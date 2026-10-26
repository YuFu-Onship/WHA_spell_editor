export type SymbolCategory = "sigil" | "sign" | "forbidden" | "shape" | "toh";

export interface SymbolDef {
    id: string;
    category: SymbolCategory;
    name: string;
    url: string;
}

const modules = import.meta.glob("./assets/symbols/**/*.png", {
    eager: true,
    query: "?url",
    import: "default"
}) as Record<string, string>;

const categoryOf: Record<string, SymbolCategory> = {
    sigils: "sigil",
    signs: "sign",
    forbiddens: "forbidden",
    shapes: "shape",
    tohs: "toh"
};

function naturalCompare(a: string, b: string): number {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export const symbols: SymbolDef[] = Object.entries(modules)
    .map(([path, url]) => {
        const parts = path.split("/");
        const folder = parts[parts.length - 2];
        const file = parts[parts.length - 1].replace(/\.png$/i, "");
        return {
            id: `${categoryOf[folder] ?? folder}:${file}`,
            category: categoryOf[folder] ?? "sigil",
            name: file,
            url
        };
    })
    .sort((a, b) => naturalCompare(a.name, b.name));

const byId = new Map(symbols.map(s => [s.id, s]));

export function getSymbol(id: string): SymbolDef | undefined {
    return byId.get(id);
}

export function symbolsByCategory(category: SymbolCategory): SymbolDef[] {
    return symbols.filter(s => s.category === category);
}

// ---------------------------------------------------------------- tinting

const imgCache = new Map<string, Promise<HTMLImageElement>>();
const tintCache = new Map<string, string>();

function loadImage(url: string): Promise<HTMLImageElement> {
    let p = imgCache.get(url);
    if (!p) {
        p = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
        imgCache.set(url, p);
    }
    return p;
}

export function loadSymbolImage(id: string): Promise<HTMLImageElement> {
    const def = getSymbol(id);
    if (!def) return Promise.reject(new Error(`Unknown symbol: ${id}`));
    return loadImage(def.url);
}

export async function tintedDataURL(id: string, color: string): Promise<string> {
    const key = `${id}|${color}`;
    const cached = tintCache.get(key);
    if (cached) return cached;

    const img = await loadSymbolImage(id);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");
    ctx.drawImage(img, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const url = canvas.toDataURL("image/png");
    tintCache.set(key, url);
    if (tintCache.size > 600) {
        const first = tintCache.keys().next().value;
        if (first !== undefined) tintCache.delete(first);
    }
    return url;
}

export function spawnTint(id: string, color: string, apply: (url: string) => void): void {
    tintedDataURL(id, color)
        .then(apply)
        .catch(() => { /* symbol may not exist, ignore */ });
}
