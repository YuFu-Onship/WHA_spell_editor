// Symbol descriptions are owned by the Go backend (embedded data.json) and
// preloaded once at boot. The UI only keeps a read-only cache.

import type { Lang } from "./i18n";
import { backend, type DescEntry } from "./backend";

let table: Record<string, DescEntry> = {};

export async function loadDescriptions(): Promise<void> {
    table = await backend.descriptions();
}

export function symbolDescription(name: string, lang: Lang): string | null {
    const entry = table[name];
    if (!entry) return null;
    const text = lang === "zh-CN" ? entry.zh : lang === "ja" ? entry.ja : entry.en;
    return text || entry.en || null;
}
