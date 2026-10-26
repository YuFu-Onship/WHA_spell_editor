// Package store persists the autosaved spell in the native user config
// directory instead of the webview's localStorage.
package store

import (
	"errors"
	"os"
	"path/filepath"
)

const appDir = "wha-spell-editor"

func Dir() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(base, appDir), nil
}

func AutosavePath() (string, error) {
	dir, err := Dir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "autosave.json"), nil
}

// SaveAutosave writes atomically so a crash cannot truncate the previous save.
func SaveAutosave(data []byte) error {
	path, err := AutosavePath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(path), "autosave-*.tmp")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)
	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmpName, path)
}

// LoadAutosave returns nil data when no autosave exists yet.
func LoadAutosave() ([]byte, error) {
	path, err := AutosavePath()
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}
	return data, err
}
