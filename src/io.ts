import { spellBounds, sanitizeSpell, type Spell } from "./model";

const STORAGE_KEY = "wha.editor.spell";

export function autosave(spell: Spell): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(spell));
    } catch { /* storage full or unavailable */ }
}

export function loadAutosave(): Spell | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return sanitizeSpell(JSON.parse(raw));
    } catch {
        return null;
    }
}

export function downloadJSON(spell: Spell): void {
    const blob = new Blob([JSON.stringify(spell, null, 4)], { type: "application/json" });
    triggerDownload(blob, `${fileBaseName(spell)}.json`);
}

export async function readJSONFile(file: File): Promise<Spell> {
    const text = await file.text();
    return sanitizeSpell(JSON.parse(text));
}

export async function readSpellFromURL(): Promise<Spell | null> {
    const hash = location.hash;
    if (!hash.startsWith("#spell=")) return null;
    try {
        const b64 = hash.slice("#spell=".length).replace(/-/g, "+").replace(/_/g, "/");
        const bin = atob(b64);
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        const json = new TextDecoder().decode(bytes);
        return sanitizeSpell(JSON.parse(json));
    } catch {
        return null;
    }
}

export function makeShareURL(spell: Spell): string {
    const json = JSON.stringify({ ...spell });
    const bytes = new TextEncoder().encode(json);
    let bin = "";
    bytes.forEach(b => bin += String.fromCharCode(b));
    const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const url = new URL(location.href);
    url.hash = `spell=${b64}`;
    return url.toString();
}

/** Default export size: content bounds at 2x. */
export function exportSize(spell: Spell): { w: number; h: number } {
    const PAD = 20;
    const b = spellBounds(spell);
    const vw = b ? b.w + PAD * 2 : 1000;
    const vh = b ? b.h + PAD * 2 : 1000;
    return { w: Math.max(1, Math.round(vw * 2)), h: Math.max(1, Math.round(vh * 2)) };
}

export async function renderPNGDataURL(
    rendererSvg: SVGSVGElement,
    spell: Spell,
    outW?: number,
    outH?: number
): Promise<string> {
    // crop to the drawn content (with padding); falls back to the full canvas
    const PAD = 20;
    const b = spellBounds(spell);
    const vx = b ? b.x - PAD : 0;
    const vy = b ? b.y - PAD : 0;
    const vw = b ? b.w + PAD * 2 : 1000;
    const vh = b ? b.h + PAD * 2 : 1000;
    const w = Math.max(1, Math.round(outW ?? vw * 2));
    const h = Math.max(1, Math.round(outH ?? vh * 2));

    const clone = rendererSvg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("viewBox", `${vx} ${vy} ${vw} ${vh}`);
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    clone.style.removeProperty("--inv-zoom");
    // export is always centered on the content, without editor helpers
    clone.querySelector("#grid-g")?.remove();
    clone.querySelector("#overlay-g")?.remove();
    const vp = clone.querySelector("#viewport-g");
    vp?.setAttribute("transform", "");
    void vp;
    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
        });
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no ctx");
        if (spell.background) {
            ctx.fillStyle = spell.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png");
    } finally {
        URL.revokeObjectURL(url);
    }
}

export async function exportPNG(rendererSvg: SVGSVGElement, spell: Spell): Promise<void> {
    const dataURL = await renderPNGDataURL(rendererSvg, spell);
    const blob: Blob = await new Promise((resolve, reject) => {
        dataURLToBlob(dataURL).then(resolve, reject);
    });
    triggerDownload(blob, `${fileBaseName(spell)}.png`);
}

async function dataURLToBlob(dataURL: string): Promise<Blob> {
    const res = await fetch(dataURL);
    return res.blob();
}

// background fill covers the cropped area only

function fileBaseName(spell: Spell): string {
    const name = (spell.name || "spell").trim().replace(/[\\/:*?"<>|]/g, "_");
    return name || "spell";
}

export function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}


