// Frontend side of persistence: autosave, share links and the canvas-based
// PNG rasteriser. File dialogs and on-disk writes are performed by Go.

import { spellBounds, type Spell } from "./model";
import { backend } from "./backend";

const LEGACY_STORAGE_KEY = "wha.editor.spell";

export async function autosave(spell: Spell): Promise<void> {
    try {
        await backend.autosave(JSON.stringify(spell));
    } catch { /* backend unavailable or disk write failed */ }
}

export async function loadAutosave(): Promise<Spell | null> {
    const saved = await backend.loadAutosave().catch(() => null);
    if (saved) return saved;

    // Migrate a spell saved by the old localStorage-based build.
    try {
        const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (!raw) return null;
        const spell = await backend.sanitizeSpell(raw);
        await backend.autosave(JSON.stringify(spell));
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return spell;
    } catch {
        return null;
    }
}

export async function readSpellFromURL(): Promise<Spell | null> {
    const hash = location.hash;
    if (!hash.startsWith("#spell=")) return null;
    try {
        return await backend.decodeShare(hash.slice("#spell=".length));
    } catch {
        return null;
    }
}

export async function makeShareURL(spell: Spell): Promise<string> {
    const payload = await backend.encodeShare(JSON.stringify(spell));
    const url = new URL(location.href);
    url.hash = `spell=${payload}`;
    return url.toString();
}

/** Crop to the drawn content, rasterise the live SVG through a canvas. */
export async function renderPNGDataURL(
    rendererSvg: SVGSVGElement,
    spell: Spell,
    outW?: number,
    outH?: number
): Promise<string> {
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
