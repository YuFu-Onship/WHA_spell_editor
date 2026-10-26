// Package model is the authoritative spell document model for the desktop app.
//
// The webview keeps a live copy of the same structures so that pointer-driven
// editing stays synchronous, but creation, loading, sanitising and export-size
// calculations are owned by Go.
package model

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"time"
)

const (
	World  = 1000.0
	Center = World / 2
)

type Pt struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type Spell struct {
	Version         int    `json:"version"`
	Name            string `json:"name"`
	Author          string `json:"author"`
	Description     string `json:"description"`
	Background      bool   `json:"background"`
	BackgroundColor string `json:"backgroundColor"`
	Color           string `json:"color"`
	Seals           []Seal `json:"seals"`
}

type Seal struct {
	ID       string    `json:"id"`
	Visible  bool      `json:"visible"`
	X        float64   `json:"x"`
	Y        float64   `json:"y"`
	Scale    float64   `json:"scale"`
	Rotation float64   `json:"rotation"`
	Elements []Element `json:"elements"`
}

// Element is a flat representation of the four element kinds. Webview code
// narrows it by Kind, just like the TypeScript discriminated union.
type Element struct {
	Kind         string  `json:"kind"`
	ID           string  `json:"id"`
	Visible      bool    `json:"visible"`
	Symbol       string  `json:"symbol"`
	X            float64 `json:"x"`
	Y            float64 `json:"y"`
	Radius       float64 `json:"radius"`
	Weight       float64 `json:"weight"`
	Color        string  `json:"color"`
	Filled       bool    `json:"filled"`
	FillColor    string  `json:"fillColor"`
	Opening      float64 `json:"opening"`
	OpeningAngle float64 `json:"openingAngle"`
	Size         float64 `json:"size"`
	Rotation     float64 `json:"rotation"`
	Amount       int     `json:"amount"`
	Spin         float64 `json:"spin"`
	Strafe       float64 `json:"strafe"`
	Points       []Pt    `json:"points"`
}

type Size struct {
	W int `json:"w"`
	H int `json:"h"`
}

// NewID returns a random document-local identifier.
func NewID() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return fmt.Sprintf("e%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b[:])
}

func NewSpell() Spell {
	return Spell{
		Version:         1,
		Background:      true,
		BackgroundColor: "#FFF1E8",
		Color:           "#000000",
		Seals:           []Seal{NewSeal()},
	}
}

func NewSeal() Seal {
	return Seal{
		ID:       NewID(),
		Visible:  true,
		Scale:    100,
		Elements: []Element{},
	}
}

func NewRing(color string) Element {
	return Element{
		Kind:      "ring",
		ID:        NewID(),
		Visible:   true,
		Radius:    350,
		Weight:    6,
		Color:     color,
		FillColor: color,
	}
}

func NewSigil(symbol, color string) Element {
	return Element{
		Kind:    "sigil",
		ID:      NewID(),
		Visible: true,
		Symbol:  symbol,
		Size:    220,
		Color:   color,
	}
}

func NewSign(symbol, color string) Element {
	return Element{
		Kind:    "sign",
		ID:      NewID(),
		Visible: true,
		Symbol:  symbol,
		Radius:  280,
		Amount:  4,
		Size:    110,
		Color:   color,
	}
}

func NewLine(color string) Element {
	return Element{
		Kind:    "line",
		ID:      NewID(),
		Visible: true,
		Color:   color,
		Weight:  6,
		Points:  []Pt{},
	}
}

// Sanitize parses arbitrary JSON into a valid version-1 spell, applying the
// same defaults the old TypeScript sanitizer used.
func Sanitize(data []byte) (*Spell, error) {
	var root any
	if err := json.Unmarshal(data, &root); err != nil {
		return nil, err
	}
	m, ok := root.(map[string]any)
	if !ok {
		return nil, errors.New("spell must be a JSON object")
	}
	return sanitizeSpell(m), nil
}

func sanitizeSpell(m map[string]any) *Spell {
	spell := NewSpell()
	spell.Name = strField(m, "name", "")
	spell.Author = strField(m, "author", "")
	spell.Description = strField(m, "description", "")
	if v, ok := m["background"].(bool); ok {
		spell.Background = v
	}
	spell.BackgroundColor = strField(m, "backgroundColor", spell.BackgroundColor)
	spell.Color = strField(m, "color", spell.Color)

	if arr, ok := m["seals"].([]any); ok && len(arr) > 0 {
		seals := make([]Seal, 0, len(arr))
		for _, item := range arr {
			if sm, ok := item.(map[string]any); ok {
				seals = append(seals, sanitizeSeal(sm))
			} else {
				seals = append(seals, NewSeal())
			}
		}
		spell.Seals = seals
	}
	return &spell
}

func sanitizeSeal(m map[string]any) Seal {
	seal := NewSeal()
	seal.X = numField(m, "x", 0)
	seal.Y = numField(m, "y", 0)
	seal.Scale = numField(m, "scale", 100)
	seal.Rotation = numField(m, "rotation", 0)
	if v, ok := m["visible"].(bool); ok {
		seal.Visible = v
	}
	if arr, ok := m["elements"].([]any); ok {
		for _, item := range arr {
			em, ok := item.(map[string]any)
			if !ok {
				continue
			}
			if el, ok := sanitizeElement(em); ok {
				seal.Elements = append(seal.Elements, el)
			}
		}
	}
	return seal
}

func sanitizeElement(m map[string]any) (Element, bool) {
	kind := strField(m, "kind", "")
	if kind == "" {
		return Element{}, false
	}
	id := strField(m, "id", "")
	if id == "" {
		id = NewID()
	}
	visible := true
	if v, ok := m["visible"].(bool); ok {
		visible = v
	}

	switch kind {
	case "ring":
		return Element{
			Kind:         "ring",
			ID:           id,
			Visible:      visible,
			X:            numField(m, "x", 0),
			Y:            numField(m, "y", 0),
			Radius:       numField(m, "radius", 350),
			Weight:       numField(m, "weight", 6),
			Color:        strField(m, "color", "#000000"),
			Filled:       boolField(m, "filled"),
			FillColor:    strField(m, "fillColor", "#000000"),
			Opening:      numField(m, "opening", 0),
			OpeningAngle: numField(m, "openingAngle", 0),
			Points:       []Pt{},
		}, true
	case "sigil":
		symbol, ok := m["symbol"].(string)
		if !ok {
			return Element{}, false
		}
		return Element{
			Kind:     "sigil",
			ID:       id,
			Visible:  visible,
			Symbol:   symbol,
			X:        numField(m, "x", 0),
			Y:        numField(m, "y", 0),
			Size:     numField(m, "size", 220),
			Rotation: numField(m, "rotation", 0),
			Color:    strField(m, "color", "#000000"),
			Points:   []Pt{},
		}, true
	case "sign":
		symbol, ok := m["symbol"].(string)
		if !ok {
			return Element{}, false
		}
		amount := int(math.Round(numField(m, "amount", 4)))
		if amount < 1 {
			amount = 1
		}
		return Element{
			Kind:     "sign",
			ID:       id,
			Visible:  visible,
			Symbol:   symbol,
			X:        numField(m, "x", 0),
			Y:        numField(m, "y", 0),
			Radius:   numField(m, "radius", 280),
			Amount:   amount,
			Size:     numField(m, "size", 110),
			Rotation: numField(m, "rotation", 0),
			Spin:     numField(m, "spin", 0),
			Color:    strField(m, "color", "#000000"),
			Strafe:   numField(m, "strafe", 0),
			Points:   []Pt{},
		}, true
	case "line":
		points := []Pt{}
		if arr, ok := m["points"].([]any); ok {
			points = make([]Pt, 0, len(arr))
			for _, item := range arr {
				pm, _ := item.(map[string]any)
				points = append(points, Pt{
					X: numField(pm, "x", 0),
					Y: numField(pm, "y", 0),
				})
			}
		}
		return Element{
			Kind:    "line",
			ID:      id,
			Visible: visible,
			Color:   strField(m, "color", "#000000"),
			Weight:  numField(m, "weight", 6),
			Points:  points,
		}, true
	default:
		return Element{}, false
	}
}

func strField(m map[string]any, key, def string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return def
}

func numField(m map[string]any, key string, def float64) float64 {
	if v, ok := m[key]; ok {
		if f, ok := v.(float64); ok && !math.IsNaN(f) && !math.IsInf(f, 0) {
			return f
		}
	}
	return def
}

func boolField(m map[string]any, key string) bool {
	v, _ := m[key].(bool)
	return v
}

// ---------------------------------------------------------------- bounds

type Bounds struct {
	CX float64
	CY float64
	HW float64
	HH float64
}

type Rect struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	W float64 `json:"w"`
	H float64 `json:"h"`
}

func ElementBounds(el Element) Bounds {
	switch el.Kind {
	case "ring":
		r := el.Radius + el.Weight/2
		return Bounds{CX: el.X, CY: el.Y, HW: r, HH: r}
	case "sigil":
		rad := math.Abs(el.Size/2*math.Cos(el.Rotation*math.Pi/180)) +
			math.Abs(el.Size/2*math.Sin(el.Rotation*math.Pi/180))
		return Bounds{CX: el.X, CY: el.Y, HW: rad, HH: rad}
	case "sign":
		r := el.Radius + el.Size/2 + math.Abs(el.Strafe)
		return Bounds{CX: el.X, CY: el.Y, HW: r, HH: r}
	case "line":
		if len(el.Points) == 0 {
			return Bounds{}
		}
		minX, maxX := el.Points[0].X, el.Points[0].X
		minY, maxY := el.Points[0].Y, el.Points[0].Y
		for _, p := range el.Points[1:] {
			minX = math.Min(minX, p.X)
			maxX = math.Max(maxX, p.X)
			minY = math.Min(minY, p.Y)
			maxY = math.Max(maxY, p.Y)
		}
		return Bounds{
			CX: (minX + maxX) / 2,
			CY: (minY + maxY) / 2,
			HW: (maxX-minX)/2 + el.Weight/2,
			HH: (maxY-minY)/2 + el.Weight/2,
		}
	default:
		return Bounds{}
	}
}

// SpellBounds returns the drawn content bounds in SVG viewBox coordinates.
func SpellBounds(spell *Spell) (Rect, bool) {
	minX, minY := math.Inf(1), math.Inf(1)
	maxX, maxY := math.Inf(-1), math.Inf(-1)
	for _, seal := range spell.Seals {
		if !seal.Visible {
			continue
		}
		s := seal.Scale / 100
		rad := seal.Rotation * math.Pi / 180
		cos, sin := math.Cos(rad), math.Sin(rad)
		for _, el := range seal.Elements {
			if !el.Visible {
				continue
			}
			b := ElementBounds(el)
			if b.HW <= 0 || b.HH <= 0 {
				continue
			}
			for _, corner := range [][2]float64{
				{-b.HW, -b.HH}, {b.HW, -b.HH}, {-b.HW, b.HH}, {b.HW, b.HH},
			} {
				lx := (b.CX + corner[0]) * s
				ly := (b.CY + corner[1]) * s
				wx := Center + seal.X + lx*cos - ly*sin
				wy := Center + seal.Y + lx*sin + ly*cos
				minX = math.Min(minX, wx)
				maxX = math.Max(maxX, wx)
				minY = math.Min(minY, wy)
				maxY = math.Max(maxY, wy)
			}
		}
	}
	if math.IsInf(minX, 1) || math.IsInf(minX, -1) {
		return Rect{}, false
	}
	return Rect{X: minX, Y: minY, W: maxX - minX, H: maxY - minY}, true
}

// ExportSize mirrors the previous frontend default: content bounds at 2x with
// 20 units of padding, falling back to the full canvas when nothing is drawn.
func ExportSize(spell *Spell) Size {
	const pad = 20.0
	vw, vh := World, World
	if b, ok := SpellBounds(spell); ok {
		vw = b.W + pad*2
		vh = b.H + pad*2
	}
	w := int(math.Max(1, math.Round(vw*2)))
	h := int(math.Max(1, math.Round(vh*2)))
	return Size{W: w, H: h}
}
