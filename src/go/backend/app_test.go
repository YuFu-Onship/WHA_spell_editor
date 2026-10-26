package backend

import (
	"encoding/json"
	"testing"
)

func TestAppDocumentLifecycle(t *testing.T) {
	t.Setenv("AppData", t.TempDir())

	app := NewApp()

	spell := app.NewSpell()
	if len(spell.Seals) != 1 {
		t.Fatalf("default spell should have one seal: %+v", spell)
	}
	raw, err := json.Marshal(spell)
	if err != nil {
		t.Fatal(err)
	}

	state := app.ResetHistory(string(raw))
	if state.CanUndo || state.CanRedo {
		t.Fatalf("fresh history should be clean: %+v", state)
	}

	ring := app.NewRing("#FF004D")
	spell.Seals[0].Elements = append(spell.Seals[0].Elements, ring)
	edited, err := json.Marshal(spell)
	if err != nil {
		t.Fatal(err)
	}
	state = app.PushHistory(string(edited))
	if !state.CanUndo {
		t.Fatalf("push should enable undo: %+v", state)
	}

	result := app.Undo()
	if result.Spell == nil || len(result.Spell.Seals[0].Elements) != 0 {
		t.Fatalf("undo should restore the empty spell: %+v", result)
	}
	if !result.State.CanRedo {
		t.Fatalf("undo should enable redo: %+v", result.State)
	}

	result = app.Redo()
	if result.Spell == nil || len(result.Spell.Seals[0].Elements) != 1 {
		t.Fatalf("redo should restore the ring: %+v", result)
	}

	if err := app.Autosave(string(edited)); err != nil {
		t.Fatal(err)
	}
	loaded, err := app.LoadAutosave()
	if err != nil {
		t.Fatal(err)
	}
	if loaded == nil || loaded.Seals[0].Elements[0].Kind != "ring" {
		t.Fatalf("autosave round trip failed: %+v", loaded)
	}

	size, err := app.ExportSize(string(edited))
	if err != nil {
		t.Fatal(err)
	}
	if size.W <= 0 || size.H <= 0 {
		t.Fatalf("bad export size: %+v", size)
	}

	payload, err := app.EncodeShare(string(edited))
	if err != nil {
		t.Fatal(err)
	}
	decoded, err := app.DecodeShare(payload)
	if err != nil || decoded == nil {
		t.Fatalf("share round trip failed: %v %+v", err, decoded)
	}

	if len(app.Descriptions()) == 0 {
		t.Fatal("descriptions not exposed")
	}
}
