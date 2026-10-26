package share

import (
	"encoding/base64"
	"testing"
)

func TestEncodeDecodeRoundTrip(t *testing.T) {
	raw := `{"version":1,"name":"Wind","seals":[{"elements":[{"kind":"ring","radius":10}]}]}`
	payload, err := Encode(raw)
	if err != nil {
		t.Fatal(err)
	}
	if payload == "" {
		t.Fatal("empty payload")
	}
	spell, err := Decode(payload)
	if err != nil {
		t.Fatal(err)
	}
	if spell.Name != "Wind" {
		t.Fatalf("unexpected spell: %+v", spell)
	}
	el := spell.Seals[0].Elements[0]
	if el.Kind != "ring" || el.Radius != 10 || el.Weight != 6 {
		t.Fatalf("sanitize not applied on decode: %+v", el)
	}
}

func TestDecodeAcceptsPaddedPayload(t *testing.T) {
	raw := `{"name":"x"}`
	padded := base64.URLEncoding.EncodeToString([]byte(raw))
	if _, err := Decode(padded); err != nil {
		t.Fatalf("padded payload should decode: %v", err)
	}
}

func TestDecodeRejectsGarbage(t *testing.T) {
	if _, err := Decode("!!!"); err == nil {
		t.Fatal("expected error")
	}
	if _, err := Encode("not json"); err == nil {
		t.Fatal("expected encode error")
	}
}
