// Thin typed bridge to the Wails Go backend (window.go.backend.App).
//
// All document-level operations live in Go. The webview keeps a live copy of
// the spell for rendering and pointer interaction, but creation, history,
// persistence, sharing and descriptions are owned by the backend.

import type { LineEl, RingEl, Seal, SignEl, SigilEl, Spell } from "./model";

export interface HistoryState {
    canUndo: boolean;
    canRedo: boolean;
}

export interface HistoryResult {
    spell: Spell | null;
    state: HistoryState;
}

export interface Size {
    w: number;
    h: number;
}

export interface DescEntry {
    zh: string;
    en: string;
    ja: string;
}

interface GoApp {
    NewSpell(): Promise<Spell>;
    NewSeal(): Promise<Seal>;
    NewRing(color: string): Promise<RingEl>;
    NewSigil(symbol: string, color: string): Promise<SigilEl>;
    NewSign(symbol: string, color: string): Promise<SignEl>;
    NewLine(color: string): Promise<LineEl>;
    SanitizeSpell(json: string): Promise<Spell>;
    ExportSize(json: string): Promise<Size>;
    Descriptions(): Promise<Record<string, DescEntry>>;

    PushHistory(json: string): Promise<HistoryState>;
    ResetHistory(json: string): Promise<HistoryState>;
    Undo(): Promise<HistoryResult>;
    Redo(): Promise<HistoryResult>;

    Autosave(json: string): Promise<void>;
    LoadAutosave(): Promise<Spell | null>;
    OpenSpell(): Promise<Spell | null>;
    SaveSpell(json: string): Promise<boolean>;
    SavePNG(dataURL: string, name: string): Promise<boolean>;

    EncodeShare(json: string): Promise<string>;
    DecodeShare(payload: string): Promise<Spell>;
}

function go(): GoApp {
    const app = (window as unknown as { go?: { backend?: { App?: GoApp } } }).go?.backend?.App;
    if (!app) {
        throw new Error("Wails Go backend is unavailable");
    }
    return app;
}

// Serialize document mutations so a push can never overtake an undo/redo or
// an autosave issued just before it.
let tail: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task, task);
    tail = result.then(() => undefined, () => undefined);
    return result;
}

export const backend = {
    newSpell: (): Promise<Spell> => go().NewSpell(),
    newSeal: (): Promise<Seal> => go().NewSeal(),
    newRing: (color: string): Promise<RingEl> => go().NewRing(color),
    newSigil: (symbol: string, color: string): Promise<SigilEl> => go().NewSigil(symbol, color),
    newSign: (symbol: string, color: string): Promise<SignEl> => go().NewSign(symbol, color),
    newLine: (color: string): Promise<LineEl> => go().NewLine(color),
    sanitizeSpell: (json: string): Promise<Spell> => go().SanitizeSpell(json),
    exportSize: (json: string): Promise<Size> => go().ExportSize(json),
    descriptions: (): Promise<Record<string, DescEntry>> => go().Descriptions(),

    pushHistory: (json: string): Promise<HistoryState> => serial(() => go().PushHistory(json)),
    resetHistory: (json: string): Promise<HistoryState> => serial(() => go().ResetHistory(json)),
    undo: (): Promise<HistoryResult> => serial(() => go().Undo()),
    redo: (): Promise<HistoryResult> => serial(() => go().Redo()),

    autosave: (json: string): Promise<void> => serial(() => go().Autosave(json)),
    loadAutosave: (): Promise<Spell | null> => go().LoadAutosave(),
    openSpell: (): Promise<Spell | null> => go().OpenSpell(),
    saveSpell: (json: string): Promise<boolean> => go().SaveSpell(json),
    savePNG: (dataURL: string, name: string): Promise<boolean> => go().SavePNG(dataURL, name),

    encodeShare: (json: string): Promise<string> => go().EncodeShare(json),
    decodeShare: (payload: string): Promise<Spell> => go().DecodeShare(payload),
};
