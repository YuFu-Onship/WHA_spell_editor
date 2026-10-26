package model

import (
	"encoding/json"
	"math"
	"testing"
)

func closeTo(a, b float64) bool { return math.Abs(a-b) < 1e-9 }

func TestNewSpellDefaults(t *testing.T) {
	s := NewSpell()
	if s.Version != 1 || !s.Background || s.BackgroundColor != "#FFF1E8" || s.Color != "#000000" {
		t.Fatalf("unexpected defaults: %+v", s)
	}
	if len(s.Seals) != 1 {
		t.Fatalf("want one default seal, got %d", len(s.Seals))
	}
	seal := s.Seals[0]
	if !seal.Visible || seal.Scale != 100 || len(seal.Elements) != 0 {
		t.Fatalf("unexpected seal defaults: %+v", seal)
	}
	if seal.ID == "" {
		t.Fatal("seal id must not be empty")
	}
}

func TestSanitizeAppliesElementDefaults(t *testing.T) {
	raw := []byte(`{"seals":[{"elements":[{"kind":"ring","radius":100}]}]}`)
	s, err := Sanitize(raw)
	if err != nil {
		t.Fatal(err)
	}
	if !s.Background || s.BackgroundColor != "#FFF1E8" || s.Color != "#000000" {
		t.Fatalf("spell defaults not applied: %+v", s)
	}
	if s.Seals[0].Scale != 100 || !s.Seals[0].Visible {
		t.Fatalf("seal defaults not applied: %+v", s.Seals[0])
	}
	el := s.Seals[0].Elements[0]
	if el.Radius != 100 || el.Weight != 6 || el.Color != "#000000" || el.FillColor != "#000000" || !el.Visible {
		t.Fatalf("ring defaults not applied: %+v", el)
	}
	if el.ID == "" {
		t.Fatal("element id must be generated")
	}
}

func TestSanitizeDropsUnknownAndSymbolLessElements(t *testing.T) {
	raw := []byte(`{"seals":[{"elements":[
		{"kind":"unknown"},
		{"kind":"sigil"},
		{"kind":"sign","symbol":"Wind"},
		{"kind":"line","points":[{"x":1,"y":2},{}]}
	]}]}`)
	s, err := Sanitize(raw)
	if err != nil {
		t.Fatal(err)
	}
	els := s.Seals[0].Elements
	if len(els) != 2 {
		t.Fatalf("want 2 valid elements, got %d: %+v", len(els), els)
	}
	if els[0].Kind != "sign" || els[0].Amount != 4 || els[0].Radius != 280 || els[0].Size != 110 {
		t.Fatalf("sign defaults wrong: %+v", els[0])
	}
	if els[1].Kind != "line" || len(els[1].Points) != 2 || els[1].Points[1].X != 0 || els[1].Weight != 6 {
		t.Fatalf("line defaults wrong: %+v", els[1])
	}
}

func TestSanitizeKeepsExplicitHidden(t *testing.T) {
	raw := []byte(`{"background":false,"seals":[{"visible":false,"elements":[{"kind":"ring","visible":false}]}]}`)
	s, err := Sanitize(raw)
	if err != nil {
		t.Fatal(err)
	}
	if s.Background || s.Seals[0].Visible || s.Seals[0].Elements[0].Visible {
		t.Fatal("explicit false must be preserved")
	}
}

func TestSpellBoundsAndExportSize(t *testing.T) {
	s := NewSpell()
	if _, ok := SpellBounds(&s); ok {
		t.Fatal("empty spell should have no bounds")
	}
	ring := NewRing("#000000")
	ring.Radius = 100
	ring.Weight = 4
	s.Seals[0].Elements = append(s.Seals[0].Elements, ring)

	b, ok := SpellBounds(&s)
	if !ok {
		t.Fatal("expected bounds")
	}
	if !closeTo(b.W, 204) || !closeTo(b.H, 204) {
		t.Fatalf("unexpected bounds: %+v", b)
	}
	if !closeTo(b.X, Center-102) || !closeTo(b.Y, Center-102) {
		t.Fatalf("unexpected origin: %+v", b)
	}
	size := ExportSize(&s)
	if size.W != 488 || size.H != 488 {
		t.Fatalf("unexpected export size: %+v", size)
	}
}

func TestSanitizeJSONFieldNames(t *testing.T) {
	s := NewSpell()
	s.Seals[0].Elements = append(s.Seals[0].Elements, NewSigil("Wind", "#FF004D"))
	out, err := json.Marshal(s)
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]any
	if err := json.Unmarshal(out, &m); err != nil {
		t.Fatal(err)
	}
	if _, ok := m["backgroundColor"]; !ok {
		t.Fatalf("missing backgroundColor in %s", out)
	}
	seal := m["seals"].([]any)[0].(map[string]any)
	el := seal["elements"].([]any)[0].(map[string]any)
	if el["symbol"] != "Wind" || el["kind"] != "sigil" {
		t.Fatalf("unexpected element json: %v", el)
	}
}
