package store

import "testing"

func TestSaveLoadAutosave(t *testing.T) {
	// os.UserConfigDir uses AppData on Windows and XDG_CONFIG_HOME elsewhere.
	t.Setenv("AppData", t.TempDir())
	t.Setenv("XDG_CONFIG_HOME", t.TempDir())

	if data, err := LoadAutosave(); err != nil || data != nil {
		t.Fatalf("expected no autosave, got %q err=%v", data, err)
	}

	if err := SaveAutosave([]byte("first")); err != nil {
		t.Fatal(err)
	}
	if err := SaveAutosave([]byte("second")); err != nil {
		t.Fatal(err)
	}

	data, err := LoadAutosave()
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "second" {
		t.Fatalf("want latest autosave, got %q", data)
	}
}
