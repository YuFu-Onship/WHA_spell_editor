export type Theme = "light" | "dark";

let current: Theme = "dark";
const listeners = new Set<(t: Theme) => void>();

export function getTheme(): Theme {
    return current;
}

export function setTheme(theme: Theme, persist = true): void {
    current = theme;
    document.documentElement.dataset.theme = theme;
    if (persist) {
        try { localStorage.setItem("wha.theme", theme); } catch { /* ignore */ }
    }
    listeners.forEach(l => l(theme));
}

export function toggleTheme(): void {
    setTheme(current === "dark" ? "light" : "dark");
}

export function onThemeChange(fn: (t: Theme) => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function initTheme(): void {
    let saved: string | null = null;
    try { saved = localStorage.getItem("wha.theme"); } catch { /* ignore */ }
    if (saved === "light" || saved === "dark") {
        setTheme(saved, false);
        return;
    }
    setTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark", false);
}
