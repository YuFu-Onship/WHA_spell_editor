// Package history keeps snapshot-based undo/redo state on the Go side.
package history

import (
	"bytes"
	"encoding/json"
	"sync"
)

type State struct {
	CanUndo bool `json:"canUndo"`
	CanRedo bool `json:"canRedo"`
}

type History struct {
	mu    sync.Mutex
	stack []string
	index int
	limit int
}

func New(limit int) *History {
	if limit < 2 {
		limit = 2
	}
	return &History{index: -1, limit: limit}
}

// Push stores a snapshot, dropping any redo branch. Identical consecutive
// snapshots are ignored.
func (h *History) Push(spellJSON string) State {
	h.mu.Lock()
	defer h.mu.Unlock()
	snap := canonical(spellJSON)
	if h.index >= 0 && h.index < len(h.stack) && h.stack[h.index] == snap {
		return h.stateLocked()
	}
	h.stack = append(h.stack[:h.index+1], snap)
	if len(h.stack) > h.limit {
		h.stack = h.stack[len(h.stack)-h.limit:]
	}
	h.index = len(h.stack) - 1
	return h.stateLocked()
}

func (h *History) Reset(spellJSON string) State {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.stack = []string{canonical(spellJSON)}
	h.index = 0
	return h.stateLocked()
}

func (h *History) Undo() (string, bool, State) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.index <= 0 {
		return "", false, h.stateLocked()
	}
	h.index--
	return h.stack[h.index], true, h.stateLocked()
}

func (h *History) Redo() (string, bool, State) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.index >= len(h.stack)-1 {
		return "", false, h.stateLocked()
	}
	h.index++
	return h.stack[h.index], true, h.stateLocked()
}

func (h *History) State() State {
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.stateLocked()
}

func (h *History) stateLocked() State {
	return State{
		CanUndo: h.index > 0,
		CanRedo: h.index >= 0 && h.index < len(h.stack)-1,
	}
}

// canonical re-marshals a JSON document so snapshots compare independently of
// object key ordering. Invalid JSON is stored verbatim.
func canonical(raw string) string {
	dec := json.NewDecoder(bytes.NewBufferString(raw))
	dec.UseNumber()
	var v any
	if err := dec.Decode(&v); err != nil {
		return raw
	}
	out, err := json.Marshal(v)
	if err != nil {
		return raw
	}
	return string(out)
}
