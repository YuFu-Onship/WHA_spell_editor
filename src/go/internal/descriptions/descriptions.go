// Package descriptions owns the symbol description dictionary.
//
// The data was extracted once from the former TypeScript module by
// scripts/export-descriptions.mjs and is embedded in the binary from then on.
package descriptions

import (
	_ "embed"
	"encoding/json"
)

//go:embed data.json
var raw []byte

type Entry struct {
	Zh string `json:"zh"`
	En string `json:"en"`
	Ja string `json:"ja"`
}

var table = mustLoad()

func mustLoad() map[string]Entry {
	var data map[string]Entry
	if err := json.Unmarshal(raw, &data); err != nil {
		panic("descriptions: invalid embedded data.json: " + err.Error())
	}
	return data
}

// All returns the dictionary. The map is shared and must not be mutated.
func All() map[string]Entry {
	return table
}

// Lookup returns a description for the given UI language, falling back to
// English like the previous frontend implementation.
func Lookup(name, lang string) (string, bool) {
	entry, ok := table[name]
	if !ok {
		return "", false
	}
	var text string
	switch lang {
	case "zh-CN":
		text = entry.Zh
	case "ja":
		text = entry.Ja
	default:
		text = entry.En
	}
	if text == "" {
		text = entry.En
	}
	return text, text != ""
}
