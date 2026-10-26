package history

import "testing"

func TestHistoryUndoRedo(t *testing.T) {
	h := New(80)
	st := h.Reset(`{"name":"a"}`)
	if st.CanUndo || st.CanRedo {
		t.Fatalf("fresh history should be clean: %+v", st)
	}

	st = h.Push(`{"name":"b"}`)
	if !st.CanUndo || st.CanRedo {
		t.Fatalf("after push: %+v", st)
	}

	st = h.Push(`{"name":"b"}`)
	if !st.CanUndo || st.CanRedo {
		t.Fatalf("identical push must not add an entry: %+v", st)
	}

	snap, ok, st := h.Undo()
	if !ok || snap != `{"name":"a"}` || st.CanUndo || !st.CanRedo {
		t.Fatalf("undo failed: %q %v %+v", snap, ok, st)
	}

	snap, ok, st = h.Redo()
	if !ok || snap != `{"name":"b"}` || !st.CanUndo || st.CanRedo {
		t.Fatalf("redo failed: %q %v %+v", snap, ok, st)
	}

	st = h.Push(`{"name":"c"}`)
	if !st.CanUndo || st.CanRedo {
		t.Fatalf("push after undo must drop redo: %+v", st)
	}
	if _, ok, _ := h.Redo(); ok {
		t.Fatal("redo branch should be gone")
	}
}

func TestHistoryCanonicalDedupe(t *testing.T) {
	h := New(80)
	h.Reset(`{"a":1,"b":2}`)
	h.Push(`{"b":2,"a":1}`)
	if h.State().CanUndo {
		t.Fatal("key order differences must not create a history entry")
	}
}

func TestHistoryLimit(t *testing.T) {
	h := New(3)
	h.Reset(`{"v":0}`)
	for i := 1; i <= 5; i++ {
		h.Push(`{"v":` + string(rune('0'+i)) + `}`)
	}
	// stack should retain only the last three snapshots
	steps := 0
	for h.State().CanUndo {
		h.Undo()
		steps++
	}
	if steps != 2 {
		t.Fatalf("want 2 undo steps with limit 3, got %d", steps)
	}
}
