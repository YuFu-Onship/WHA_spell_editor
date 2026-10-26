package backend

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"os"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"wha-editor/src/go/internal/descriptions"
	"wha-editor/src/go/internal/history"
	"wha-editor/src/go/internal/model"
	"wha-editor/src/go/internal/share"
	"wha-editor/src/go/internal/store"
)

// App is the Go backend bound into the webview as window.go.backend.App.
type App struct {
	ctx     context.Context
	history *history.History
}

type HistoryResult struct {
	Spell *model.Spell  `json:"spell"`
	State history.State `json:"state"`
}

func NewApp() *App {
	return &App{history: history.New(80)}
}

// Startup injects the Wails lifecycle context. It is a package function so it
// is not exposed to the webview as a bound method.
func Startup(app *App, ctx context.Context) {
	app.ctx = ctx
}

// ---------------------------------------------------------------- model

func (a *App) NewSpell() model.Spell {
	return model.NewSpell()
}

func (a *App) NewSeal() model.Seal {
	return model.NewSeal()
}

func (a *App) NewRing(color string) model.Element {
	return model.NewRing(color)
}

func (a *App) NewSigil(symbol, color string) model.Element {
	return model.NewSigil(symbol, color)
}

func (a *App) NewSign(symbol, color string) model.Element {
	return model.NewSign(symbol, color)
}

func (a *App) NewLine(color string) model.Element {
	return model.NewLine(color)
}

func (a *App) SanitizeSpell(spellJSON string) (*model.Spell, error) {
	return model.Sanitize([]byte(spellJSON))
}

func (a *App) ExportSize(spellJSON string) (model.Size, error) {
	spell, err := model.Sanitize([]byte(spellJSON))
	if err != nil {
		return model.Size{}, err
	}
	return model.ExportSize(spell), nil
}

// ---------------------------------------------------------------- descriptions

func (a *App) Descriptions() map[string]descriptions.Entry {
	return descriptions.All()
}

// ---------------------------------------------------------------- history

func (a *App) PushHistory(spellJSON string) history.State {
	return a.history.Push(spellJSON)
}

func (a *App) ResetHistory(spellJSON string) history.State {
	return a.history.Reset(spellJSON)
}

func (a *App) HistoryState() history.State {
	return a.history.State()
}

func (a *App) Undo() HistoryResult {
	snap, ok, state := a.history.Undo()
	if !ok {
		return HistoryResult{State: state}
	}
	spell, err := model.Sanitize([]byte(snap))
	if err != nil {
		return HistoryResult{State: state}
	}
	return HistoryResult{Spell: spell, State: state}
}

func (a *App) Redo() HistoryResult {
	snap, ok, state := a.history.Redo()
	if !ok {
		return HistoryResult{State: state}
	}
	spell, err := model.Sanitize([]byte(snap))
	if err != nil {
		return HistoryResult{State: state}
	}
	return HistoryResult{Spell: spell, State: state}
}

// ---------------------------------------------------------------- sharing

func (a *App) EncodeShare(spellJSON string) (string, error) {
	return share.Encode(spellJSON)
}

func (a *App) DecodeShare(payload string) (*model.Spell, error) {
	return share.Decode(payload)
}

// ---------------------------------------------------------------- persistence

func (a *App) Autosave(spellJSON string) error {
	return store.SaveAutosave([]byte(spellJSON))
}

func (a *App) LoadAutosave() (*model.Spell, error) {
	data, err := store.LoadAutosave()
	if err != nil || data == nil {
		return nil, err
	}
	return model.Sanitize(data)
}

func (a *App) OpenSpell() (*model.Spell, error) {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Open spell",
		Filters: []runtime.FileFilter{
			{DisplayName: "Spell JSON (*.json)", Pattern: "*.json"},
		},
	})
	if err != nil || path == "" {
		return nil, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return model.Sanitize(data)
}

func (a *App) SaveSpell(spellJSON string) (bool, error) {
	spell, err := model.Sanitize([]byte(spellJSON))
	if err != nil {
		return false, err
	}
	data, err := json.MarshalIndent(spell, "", "    ")
	if err != nil {
		return false, err
	}
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save spell",
		DefaultFilename: fileBaseName(spell.Name) + ".json",
		Filters: []runtime.FileFilter{
			{DisplayName: "Spell JSON (*.json)", Pattern: "*.json"},
		},
	})
	if err != nil || path == "" {
		return false, err
	}
	if !strings.HasSuffix(strings.ToLower(path), ".json") {
		path += ".json"
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return false, err
	}
	return true, nil
}

const pngDataPrefix = "data:image/png;base64,"

func (a *App) SavePNG(dataURL, defaultName string) (bool, error) {
	if !strings.HasPrefix(dataURL, pngDataPrefix) {
		return false, errors.New("unsupported image payload")
	}
	data, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(dataURL, pngDataPrefix))
	if err != nil {
		return false, err
	}
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export PNG",
		DefaultFilename: fileBaseName(defaultName) + ".png",
		Filters: []runtime.FileFilter{
			{DisplayName: "PNG image (*.png)", Pattern: "*.png"},
		},
	})
	if err != nil || path == "" {
		return false, err
	}
	if !strings.HasSuffix(strings.ToLower(path), ".png") {
		path += ".png"
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return false, err
	}
	return true, nil
}

func fileBaseName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "spell"
	}
	replacer := strings.NewReplacer(
		"\\", "_", "/", "_", ":", "_", "*", "_",
		"?", "_", "\"", "_", "<", "_", ">", "_", "|", "_",
	)
	return replacer.Replace(name)
}
