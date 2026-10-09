export type ElementKind = "ring" | "sigil" | "sign" | "line";

export interface Pt { x: number; y: number }

export interface Seal {
    id: string;
    visible: boolean;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    elements: SpellElement[];
}

export interface RingEl {
    kind: "ring";
    id: string;
    visible: boolean;
    x: number;
    y: number;
    radius: number;
    weight: number;
    color: string;
    filled: boolean;
    fillColor: string;
    opening: number;
    openingAngle: number;
}

export interface SigilEl {
    kind: "sigil";
    id: string;
    visible: boolean;
    symbol: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
    color: string;
}

export interface SignEl {
    kind: "sign";
    id: string;
    visible: boolean;
    symbol: string;
    x: number;
    y: number;
    radius: number;
    amount: number;
    size: number;
    rotation: number;
    spin: number;
    color: string;
    strafe: number;
}

export interface LineEl {
    kind: "line";
    id: string;
    visible: boolean;
    color: string;
    weight: number;
    points: Pt[];
}

export type SpellElement = RingEl | SigilEl | SignEl | LineEl;

export interface Spell {
    version: 1;
    name: string;
    author: string;
    description: string;
    background: boolean;
    backgroundColor: string;
    color: string;
    seals: Seal[];
}

export const WORLD = 1000;
export const CENTER = WORLD / 2;

export const PICO8 = [
    "#000000", "#1D2B53", "#7E2553", "#008751",
    "#AB5236", "#5F574F", "#C2C3C7", "#FFF1E8",
    "#FF004D", "#FFA300", "#FFEC27", "#00E436",
    "#29ADFF", "#83769C", "#FF77A8", "#FFCCAA"
];

export function wrap360(deg: number): number {
    return ((deg % 360) + 360) % 360;
}

let uidCounter = 0;
export function uid(): string {
    uidCounter = (uidCounter + 1) % Number.MAX_SAFE_INTEGER;
    return `${Date.now().toString(36)}${uidCounter.toString(36)}`;
}

export function defaultSpell(): Spell {
    return {
        version: 1,
        name: "",
        author: "",
        description: "",
        background: true,
        backgroundColor: "#FFF1E8",
        color: "#000000",
        seals: [newSeal()]
    };
}

export function newSeal(): Seal {
    return {
        id: uid(),
        visible: true,
        x: 0,
        y: 0,
        scale: 100,
        rotation: 0,
        elements: []
    };
}

export function newRing(color: string): RingEl {
    return {
        kind: "ring",
        id: uid(),
        visible: true,
        x: 0, y: 0,
        radius: 350,
        weight: 6,
        color,
        filled: false,
        fillColor: color,
        opening: 0,
        openingAngle: 0
    };
}

export function newSigil(symbol: string, color: string): SigilEl {
    return {
        kind: "sigil",
        id: uid(),
        visible: true,
        symbol,
        x: 0, y: 0,
        size: 220,
        rotation: 0,
        color
    };
}

export function newSign(symbol: string, color: string): SignEl {
    return {
        kind: "sign",
        id: uid(),
        visible: true,
        symbol,
        x: 0, y: 0,
        radius: 280,
        amount: 4,
        size: 110,
        rotation: 0,
        spin: 0,
        color,
        strafe: 0
    };
}

export function newLine(color: string): LineEl {
    return { kind: "line", id: uid(), visible: true, color, weight: 6, points: [] };
}

export function findSeal(spell: Spell, sealId: string | null): Seal | undefined {
    if (!sealId) return undefined;
    return spell.seals.find(s => s.id === sealId);
}

export function findElement(spell: Spell, sealId: string | null, elId: string | null): SpellElement | undefined {
    const seal = findSeal(spell, sealId);
    if (!seal || !elId) return undefined;
    return seal.elements.find(e => e.id === elId);
}

export interface Selection {
    sealId: string;
    elId: string | null;
}

export function sanitizeSpell(data: unknown): Spell {
    const d = (data ?? {}) as Partial<Spell>;
    const spell = defaultSpell();
    spell.name = typeof d.name === "string" ? d.name : "";
    spell.author = typeof d.author === "string" ? d.author : "";
    spell.description = typeof d.description === "string" ? d.description : "";
    spell.background = d.background !== false;
    if (typeof d.backgroundColor === "string") spell.backgroundColor = d.backgroundColor;
    if (typeof d.color === "string") spell.color = d.color;
    if (Array.isArray(d.seals) && d.seals.length > 0) {
        spell.seals = d.seals.map((s: any) => {
            const seal = newSeal();
            seal.x = num(s?.x, 0);
            seal.y = num(s?.y, 0);
            seal.scale = num(s?.scale, 100);
            seal.rotation = num(s?.rotation, 0);
            seal.visible = s?.visible !== false;
            seal.elements = Array.isArray(s?.elements) ? s.elements.map(sanitizeElement).filter(Boolean) as SpellElement[] : [];
            return seal;
        });
    }
    return spell;
}

function num(v: unknown, fallback: number): number {
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function sanitizeElement(e: any): SpellElement | undefined {
    if (!e || typeof e.kind !== "string") return undefined;
    const base = { id: typeof e.id === "string" ? e.id : uid(), visible: e.visible !== false };
    switch (e.kind) {
        case "ring":
            return {
                ...base, kind: "ring",
                x: num(e.x, 0), y: num(e.y, 0),
                radius: num(e.radius, 350), weight: num(e.weight, 6),
                color: typeof e.color === "string" ? e.color : "#000000",
                filled: e.filled === true,
                fillColor: typeof e.fillColor === "string" ? e.fillColor : "#000000",
                opening: num(e.opening, 0), openingAngle: num(e.openingAngle, 0)
            } as RingEl;
        case "sigil":
            if (typeof e.symbol !== "string") return undefined;
            return {
                ...base, kind: "sigil",
                symbol: e.symbol,
                x: num(e.x, 0), y: num(e.y, 0),
                size: num(e.size, 220), rotation: num(e.rotation, 0),
                color: typeof e.color === "string" ? e.color : "#000000"
            } as SigilEl;
        case "sign":
            if (typeof e.symbol !== "string") return undefined;
            return {
                ...base, kind: "sign",
                symbol: e.symbol,
                x: num(e.x, 0), y: num(e.y, 0),
                radius: num(e.radius, 280), amount: Math.max(1, Math.round(num(e.amount, 4))),
                size: num(e.size, 110), rotation: num(e.rotation, 0),
                spin: num(e.spin, 0),
                color: typeof e.color === "string" ? e.color : "#000000",
                strafe: num(e.strafe, 0)
            } as SignEl;
        case "line":
            return {
                ...base, kind: "line",
                color: typeof e.color === "string" ? e.color : "#000000",
                weight: num(e.weight, 6),
                points: Array.isArray(e.points) ? e.points.map((p: any) => ({ x: num(p?.x, 0), y: num(p?.y, 0) })) : []
            } as LineEl;
        default:
            return undefined;
    }
}

// ------------------------------------------------------------- bounds

export interface Rect { x: number; y: number; w: number; h: number }

/** Local AABB (center + half extents) of an element, in seal space. */
export function elementBounds(el: SpellElement): { cx: number; cy: number; hw: number; hh: number } {
    switch (el.kind) {
        case "ring":
            return { cx: el.x, cy: el.y, hw: el.radius + el.weight / 2, hh: el.radius + el.weight / 2 };
        case "sigil": {
            const rad = Math.abs((el.size / 2) * Math.cos(el.rotation * Math.PI / 180)) +
                Math.abs((el.size / 2) * Math.sin(el.rotation * Math.PI / 180));
            return { cx: el.x, cy: el.y, hw: rad, hh: rad };
        }
        case "sign":
            return { cx: el.x, cy: el.y, hw: el.radius + el.size / 2 + Math.abs(el.strafe), hh: el.radius + el.size / 2 + Math.abs(el.strafe) };
        case "line": {
            if (el.points.length === 0) return { cx: 0, cy: 0, hw: 0, hh: 0 };
            const xs = el.points.map(p => p.x), ys = el.points.map(p => p.y);
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, hw: (maxX - minX) / 2 + el.weight / 2, hh: (maxY - minY) / 2 + el.weight / 2 };
        }
    }
}

/**
 * Bounding box of everything drawn, in svg viewBox coordinates.
 * Returns null when nothing is visible.
 */
export function spellBounds(spell: Spell): Rect | null {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const seal of spell.seals) {
        if (!seal.visible) continue;
        const s = seal.scale / 100;
        const rad = seal.rotation * Math.PI / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        for (const el of seal.elements) {
            if (!el.visible) continue;
            const b = elementBounds(el);
            if (b.hw <= 0 || b.hh <= 0) continue;
            for (const [dx, dy] of [[-b.hw, -b.hh], [b.hw, -b.hh], [-b.hw, b.hh], [b.hw, b.hh]]) {
                const lx = (b.cx + dx) * s, ly = (b.cy + dy) * s;
                const wx = CENTER + seal.x + lx * cos - ly * sin;
                const wy = CENTER + seal.y + lx * sin + ly * cos;
                minX = Math.min(minX, wx); maxX = Math.max(maxX, wx);
                minY = Math.min(minY, wy); maxY = Math.max(maxY, wy);
            }
        }
    }
    if (!Number.isFinite(minX)) return null;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
