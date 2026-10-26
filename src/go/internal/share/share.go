// Package share implements the URL-safe spell payload used by share links.
package share

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"

	"wha-editor/src/go/internal/model"
)

// Encode turns a spell document into a URL-safe, unpadded base64 payload.
func Encode(spellJSON string) (string, error) {
	if !json.Valid([]byte(spellJSON)) {
		return "", errors.New("spell is not valid JSON")
	}
	return base64.RawURLEncoding.EncodeToString([]byte(spellJSON)), nil
}

// Decode accepts the payload produced by Encode (and padded variants) and
// returns a sanitised spell.
func Decode(payload string) (*model.Spell, error) {
	payload = strings.TrimSpace(payload)
	if payload == "" {
		return nil, errors.New("empty share payload")
	}
	raw, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		raw, err = base64.URLEncoding.DecodeString(payload)
	}
	if err != nil {
		return nil, err
	}
	return model.Sanitize(raw)
}
