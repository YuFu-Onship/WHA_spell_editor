import { CENTER, WORLD, elementBounds, type Pt, type Selection, type Spell, type SpellElement, type Seal } from "./model";
import { getSymbol, spawnTint } from "./symbols";

export interface Viewport {
    zoom: number;
    x: number;
    y: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";

function el(tag: string, attrs: Record<string, string | number> = {}): any {
    const node = document.createElementNS(SVG_NS, tag) as SVGElement;
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    return node;
}

export class Renderer {
    svg: SVGSVGElement;
    private defs: SVGDefsElement;
    private gridG: SVGGElement;
    private contentG: SVGGElement;
    private overlayG: SVGGElement;
    private viewportG: SVGGElement;

    viewport: Viewport = { zoom: 1, x: 0, y: 0 };
    activeHandle: string | null = null;

    constructor(container: HTMLElement) {
        this.svg = el("svg", {
            viewBox: `0 0 ${WORLD} ${WORLD}`,
            id: "spell-svg"
        }) as unknown as SVGSVGElement;

        this.defs = el("defs") as unknown as SVGDefsElement;
        this.gridG = el("g", { id: "grid-g", class: "grid-layer" }) as unknown as SVGGElement;
        this.viewportG = el("g", { id: "viewport-g" }) as unknown as SVGGElement;
        this.contentG = el("g", { id: "content-g" }) as unknown as SVGGElement;
        this.overlayG = el("g", { id: "overlay-g" }) as unknown as SVGGElement;

        this.viewportG.appendChild(this.contentG);
        this.viewportG.appendChild(this.overlayG);
        this.svg.appendChild(this.defs);
        this.svg.appendChild(this.gridG);
        this.svg.appendChild(this.viewportG);
        container.appendChild(this.svg);

        this.applyViewport();
    }

    setViewport(vp: Partial<Viewport>): void {
        Object.assign(this.viewport, vp);
        this.applyViewport();
    }

    applyViewport(): void {
        const { zoom, x, y } = this.viewport;
        this.viewportG.setAttribute("transform", `translate(${x} ${y}) scale(${zoom})`);
        this.svg.style.setProperty("--inv-zoom", String(1 / zoom));
        this.renderGrid();
    }

    clientToWorld(clientX: number, clientY: number): Pt {
        const ctm = this.svg.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };
        const inv = ctm.inverse();
        const pt = new DOMPoint(clientX, clientY).matrixTransform(inv);
        return { x: pt.x, y: pt.y };
    }

    clientToWorldContent(clientX: number, clientY: number): Pt {
        const ctm = this.contentG.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };
        const inv = ctm.inverse();
        const pt = new DOMPoint(clientX, clientY).matrixTransform(inv);
        return { x: pt.x, y: pt.y };
    }

    render(spell: Spell, selectedIds: Set<string>, spawnedIds: Set<string> = new Set()): void {
        this.contentG.innerHTML = "";
        this.overlayG.innerHTML = "";

        for (const seal of spell.seals) {
            if (!seal.visible) continue;
            this.contentG.appendChild(this.renderSeal(spell, seal, selectedIds, spawnedIds));
        }
    }

    /** Screen-space CAD grid covering the whole visible world. */
    private renderGrid(): void {
        this.gridG.innerHTML = "";
        const { zoom, x: panX, y: panY } = this.viewport;
        const ctm = this.svg.getScreenCTM();
        if (!ctm) return;
        const pxPerUnit = ctm.a;
        const inv = ctm.inverse();
        const rect = this.svg.getBoundingClientRect();
        // bottom-right in CLIENT coordinates (rect.left/top offset included!)
        const v0 = new DOMPoint(rect.left, rect.top).matrixTransform(inv);
        const v1 = new DOMPoint(rect.left + rect.width, rect.top + rect.height).matrixTransform(inv);

        // seal space: world origin at seal center (CENTER, CENTER)
        const toSealX = (vb: number) => (vb - panX) / zoom - CENTER;
        const toSealY = (vb: number) => (vb - panY) / zoom - CENTER;
        const toVbX = (seal: number) => panX + (seal + CENTER) * zoom;
        const toVbY = (seal: number) => panY + (seal + CENTER) * zoom;

        const wx0 = toSealX(v0.x), wx1 = toSealX(v1.x);
        const wy0 = toSealY(v0.y), wy1 = toSealY(v1.y);

        const minorPx = 25 * zoom * pxPerUnit;
        const minor = minorPx < 7 ? 100 : 25;

        const line = (x1: number, y1: number, x2: number, y2: number, cls: string, widthPx: number) => {
            this.gridG.appendChild(el("line", {
                x1, y1, x2, y2,
                class: cls,
                "stroke-width": widthPx / pxPerUnit
            }));
        };

        const k0 = Math.ceil(wx0 / minor) * minor;
        for (let k = k0; k <= wx1 + minor; k += minor) {
            const vbX = toVbX(k);
            if (k === 0) line(vbX, v0.y, vbX, v1.y, "grid-axis", 1.5);
            else if (k % 100 === 0) line(vbX, v0.y, vbX, v1.y, "grid-major", 1);
            else line(vbX, v0.y, vbX, v1.y, "grid-minor", 0.5);
        }
        const j0 = Math.ceil(wy0 / minor) * minor;
        for (let j = j0; j <= wy1 + minor; j += minor) {
            const vbY = toVbY(j);
            if (j === 0) line(v0.x, vbY, v1.x, vbY, "grid-axis", 1.5);
            else if (j % 100 === 0) line(v0.x, vbY, v1.x, vbY, "grid-major", 1);
            else line(v0.x, vbY, v1.x, vbY, "grid-minor", 0.5);
        }
    }

    private renderSeal(spell: Spell, seal: Seal, selectedIds: Set<string>, spawnedIds: Set<string>): SVGGElement {
        const g = el("g", {
            class: "seal",
            "data-seal": seal.id,
            transform: `translate(${CENTER + seal.x} ${CENTER + seal.y}) rotate(${seal.rotation}) scale(${seal.scale / 100})`
        });
        for (const element of seal.elements) {
            if (!element.visible) continue;
            const node = this.renderElement(spell, seal, element, selectedIds, spawnedIds);
            if (node) g.appendChild(node);
        }
        return g;
    }

    private renderElement(
        spell: Spell,
        seal: Seal,
        element: SpellElement,
        selectedIds: Set<string>,
        spawnedIds: Set<string>
    ): SVGGElement | null {
        const selected = selectedIds.has(element.id);
        const spawn = spawnedIds.has(element.id);
        const cls = `el el-${element.kind}${selected ? " selected" : ""}${spawn ? " spawn" : ""}`;

        switch (element.kind) {
            case "ring":
                return this.renderRing(element, cls, selected);
            case "line":
                return this.renderLine(element, cls, selected);
            case "sigil":
                return this.renderSigil(element, cls, spawn);
            case "sign":
                return this.renderSign(element, cls, spawn);
            default:
                return null;
        }
    }

    private renderRing(r: Extract<SpellElement, { kind: "ring" }>, cls: string, selected: boolean): SVGGElement {
        const g = el("g", { class: cls, "data-id": r.id });
        if (r.filled) {
            g.appendChild(el("circle", {
                cx: r.x, cy: r.y, r: r.radius,
                fill: r.fillColor,
                stroke: "none"
            }));
        }
        const strokeAttrs: Record<string, string | number> = {
            fill: "none",
            stroke: r.color,
            "stroke-width": r.weight,
            "stroke-linecap": "round"
        };
        if (r.opening > 0 && r.opening < 360) {
            const start = (r.openingAngle + r.opening / 2) * Math.PI / 180;
            const end = (r.openingAngle - r.opening / 2) * Math.PI / 180;
            // draw the full circle minus the opening gap (clockwise from start to end)
            const largeArc = r.opening < 180 ? 1 : 0;
            const sweepFlag = 1;
            const p1 = { x: r.x + r.radius * Math.cos(start), y: r.y + r.radius * Math.sin(start) };
            const p2 = { x: r.x + r.radius * Math.cos(end), y: r.y + r.radius * Math.sin(end) };
            g.appendChild(el("path", {
                ...strokeAttrs,
                d: `M ${p1.x} ${p1.y} A ${r.radius} ${r.radius} 0 ${largeArc} ${sweepFlag} ${p2.x} ${p2.y}`
            }));
        } else if (r.opening <= 0) {
            g.appendChild(el("circle", { ...strokeAttrs, cx: r.x, cy: r.y, r: r.radius }));
        }
        // hit area: only a band along the ring itself so elements
        // inside the ring stay clickable
        g.appendChild(el("circle", {
            cx: r.x, cy: r.y, r: r.radius,
            fill: "none", stroke: "transparent",
            "stroke-width": r.weight + 22 / Math.max(0.2, this.viewport.zoom),
            class: "hit", "data-id": r.id
        }));
        if (selected) {
            g.appendChild(el("circle", {
                cx: r.x, cy: r.y, r: r.radius,
                fill: "none", stroke: "var(--color-active)",
                "stroke-width": r.weight + 4,
                class: "sel-outline", "data-id": r.id
            }));
        }
        return g;
    }

    private renderLine(l: Extract<SpellElement, { kind: "line" }>, cls: string, selected: boolean): SVGGElement {
        const g = el("g", { class: cls, "data-id": l.id });
        if (l.points.length >= 2) {
            const d = l.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
            g.appendChild(el("path", {
                d,
                fill: "none",
                stroke: l.color,
                "stroke-width": l.weight,
                "stroke-linecap": "round",
                "stroke-linejoin": "round"
            }));
            g.appendChild(el("path", {
                d,
                fill: "none", stroke: "transparent",
                "stroke-width": l.weight + 16 / Math.max(0.2, this.viewport.zoom),
                class: "hit", "data-id": l.id
            }));
            if (selected) {
                g.appendChild(el("path", {
                    d,
                    fill: "none", stroke: "var(--color-active)",
                    "stroke-width": l.weight + 4,
                    class: "sel-outline", "data-id": l.id
                }));
            }
        }
        return g;
    }

    private renderSigil(s: Extract<SpellElement, { kind: "sigil" }>, cls: string, _spawn: boolean): SVGGElement {
        const g = el("g", {
            class: cls, "data-id": s.id,
            transform: `translate(${s.x} ${s.y}) rotate(${s.rotation})`
        });
        const half = s.size / 2;
        g.appendChild(el("rect", {
            x: -half, y: -half, width: s.size, height: s.size,
            fill: "transparent", class: "hit", "data-id": s.id
        }));
        const img = el("image", {
            x: -half, y: -half, width: s.size, height: s.size,
            class: "symbol-img", "data-id": s.id,
            preserveAspectRatio: "xMidYMid meet"
        });
        g.appendChild(img);
        spawnTint(s.symbol, s.color, url => {
            img.setAttribute("href", url);
        });
        if (cls.includes("selected")) {
            g.appendChild(el("rect", {
                x: -half - 4, y: -half - 4, width: s.size + 8, height: s.size + 8,
                fill: "none", stroke: "var(--color-active)",
                "stroke-width": 3, class: "sel-outline", "data-id": s.id
            }));
        }
        return g;
    }

    private renderSign(s: Extract<SpellElement, { kind: "sign" }>, cls: string, _spawn: boolean): SVGGElement {
        const g = el("g", {
            class: cls, "data-id": s.id,
            transform: `translate(${s.x} ${s.y})`
        });
        const amount = Math.max(1, Math.round(s.amount));
        for (let i = 0; i < amount; i++) {
            const inner = el("g", {
                transform: `rotate(${s.rotation + (i * 360) / amount}) translate(0 ${-s.radius}) translate(${s.strafe} 0) rotate(${s.spin})`
            });
            const half = s.size / 2;
            inner.appendChild(el("rect", {
                x: -half, y: -half, width: s.size, height: s.size,
                fill: "transparent", class: "hit", "data-id": s.id
            }));
            const img = el("image", {
                x: -half, y: -half, width: s.size, height: s.size,
                class: "symbol-img", "data-id": s.id,
                preserveAspectRatio: "xMidYMid meet"
            });
            inner.appendChild(img);
            spawnTint(s.symbol, s.color, url => {
                img.setAttribute("href", url);
            });
            if (cls.includes("selected")) {
                inner.appendChild(el("rect", {
                    x: -half - 3, y: -half - 3, width: s.size + 6, height: s.size + 6,
                    fill: "none", stroke: "var(--color-active)",
                    "stroke-width": 1.5 / Math.max(0.2, this.viewport.zoom),
                    "stroke-dasharray": "6 4", class: "member-outline", "pointer-events": "none"
                }));
            }
            g.appendChild(inner);
        }
        // group members are grabbed individually (per-copy rects above);
        // no disc hit area so other elements stay reachable
        if (cls.includes("selected")) {
            g.appendChild(el("circle", {
                cx: 0, cy: 0, r: s.radius,
                fill: "none", stroke: "var(--color-active)",
                "stroke-width": 2, "stroke-dasharray": "8 6",
                class: "sel-outline guide", "pointer-events": "none", "data-id": s.id
            }));
        }
        return g;
    }

    // ------------------------------------------------ overlay (handles)

    /** CAD-style center marker shown while dragging an element or seal. */
    drawCenterMarker(seal: Seal, x: number, y: number): void {
        const zoom = Math.max(0.2, this.viewport.zoom);
        const g = el("g", {
            transform: `translate(${CENTER + seal.x} ${CENTER + seal.y}) rotate(${seal.rotation}) scale(${seal.scale / 100})`
        });
        const r = 6 / zoom;
        const stroke = `var(--color-active)`;
        g.appendChild(el("circle", {
            cx: x, cy: y, r, fill: "none", stroke,
            "stroke-width": 1.5 / zoom, class: "center-marker", "pointer-events": "none"
        }));
        g.appendChild(el("line", {
            x1: x - r * 1.9, y1: y, x2: x + r * 1.9, y2: y, stroke,
            "stroke-width": 1 / zoom, class: "center-marker", "pointer-events": "none"
        }));
        g.appendChild(el("line", {
            x1: x, y1: y - r * 1.9, x2: x, y2: y + r * 1.9, stroke,
            "stroke-width": 1 / zoom, class: "center-marker", "pointer-events": "none"
        }));
        this.overlayG.appendChild(g);
    }

    /** Unified frame around a multi-selection: move / rotate / scale everything at once. */
    private drawBatchOverlay(seal: Seal, selections: Selection[], zoom: number): void {
        const comp = seal.scale / 100;
        const host = el("g", {
            transform: `translate(${CENTER + seal.x} ${CENTER + seal.y}) rotate(${seal.rotation}) scale(${comp})`
        });
        this.overlayG.appendChild(host);

        const els = selections
            .map(sl => seal.elements.find(e => e.id === sl.elId))
            .filter(Boolean) as SpellElement[];
        if (!els.length) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const el of els) {
            const b = elementBounds(el);
            minX = Math.min(minX, b.cx - b.hw); maxX = Math.max(maxX, b.cx + b.hw);
            minY = Math.min(minY, b.cy - b.hh); maxY = Math.max(maxY, b.cy + b.hh);
        }
        const pad = 8 / (zoom * comp);
        minX -= pad; minY -= pad; maxX += pad; maxY += pad;
        const w = maxX - minX, h = maxY - minY;

        host.appendChild(el("rect", {
            x: minX, y: minY, width: w, height: h,
            fill: "none", stroke: "var(--color-active)",
            "stroke-width": 1.5 / (zoom * comp),
            "stroke-dasharray": `${7 / (zoom * comp)} ${5 / (zoom * comp)}`,
            class: "batch-frame", "pointer-events": "none"
        }));

        const ext = 24 / (zoom * comp);
        const tether = el("line", {
            x1: minX + w / 2, y1: minY + h / 2, x2: minX + w / 2, y2: minY - ext,
            stroke: "var(--color-active)",
            "stroke-width": 1.5 / (zoom * comp),
            "stroke-dasharray": `${5 / (zoom * comp)} ${4 / (zoom * comp)}`,
            class: "sel-tether", "pointer-events": "none"
        });
        host.appendChild(tether);

        const dot = (x: number, y: number, kind: string) => {
            host.appendChild(el("circle", {
                cx: x, cy: y, r: 8 / (zoom * comp),
                fill: "var(--popup-bg)", stroke: "var(--color-active)",
                "stroke-width": 2 / (zoom * comp),
                class: `handle handle-${kind} handle-group${this.activeHandle === kind ? " handle-active" : ""}`,
                "data-handle": kind
            }));
        };
        dot(minX + w / 2, minY - ext, "batch-rotate");
        dot(maxX, maxY, "batch-scale");
    }

    drawSelectionOverlay(selections: Selection[], spell: Spell): void {
        this.overlayG.innerHTML = "";
        if (!selections.length) return;
        const seal = spell.seals.find(s => s.id === selections[0].sealId);
        if (!seal) return;
        const zoom = Math.max(0.2, this.viewport.zoom);

        if (selections.length > 1) {
            this.drawBatchOverlay(seal, selections, zoom);
            return;
        }
        const sel = selections[0];

        const dot = (x: number, y: number, kind: string, parent: SVGElement, scaleComp = 1, color = "var(--color-active)") => {
            const r = 8 / (zoom * scaleComp);
            const c = el("circle", {
                cx: x, cy: y, r,
                fill: "var(--popup-bg)", stroke: color,
                "stroke-width": 2 / (zoom * scaleComp),
                class: `handle handle-${kind} handle-${color === "var(--color-active)" ? "group" : "member"}${this.activeHandle === kind ? " handle-active" : ""}`,
                "data-handle": kind
            });
            parent.appendChild(c);
        };

        // handles bound to the element's bounding rect: scale at the
        // bottom-right corner, rotate above, tethered to the center
        const handleGroup = (
            cx: number, cy: number, rot: number, hw: number, hh: number,
            rotDist: number, scaleComp: number, host: SVGElement
        ) => {
            const g = el("g", {
                transform: `translate(${cx} ${cy}) rotate(${rot})`
            });
            g.appendChild(el("line", {
                x1: 0, y1: 0, x2: 0, y2: -rotDist,
                stroke: "var(--color-active)",
                "stroke-width": 1.5 / (zoom * scaleComp),
                "stroke-dasharray": `${5 / (zoom * scaleComp)} ${4 / (zoom * scaleComp)}`,
                class: "sel-tether", "pointer-events": "none"
            }));
            dot(0, -rotDist, "rotate", g, scaleComp);
            dot(hw, hh, "scale", g, scaleComp);
            host.appendChild(g);
        };

        // element handles live in seal-local space: wrap in the seal's transform
        const sealGroup = (scaleComp: number) => {
            const g = el("g", {
                transform: `translate(${CENTER + seal.x} ${CENTER + seal.y}) rotate(${seal.rotation}) scale(${seal.scale / 100})`
            });
            this.overlayG.appendChild(g);
            void scaleComp;
            return g;
        };

        if (sel.elId) {
            const element = seal.elements.find(e => e.id === sel.elId);
            if (!element) return;
            const comp = seal.scale / 100;
            const host = sealGroup(comp);
            switch (element.kind) {
                case "ring": {
                    // rings have no rotation (openingAngle covers it);
                    // the scale dot sits on the ring edge itself
                    const d = element.radius * Math.SQRT1_2;
                    dot(element.x + d, element.y + d, "scale", host, comp);
                    break;
                }
                case "sigil": {
                    const half = element.size / 2;
                    const off = 9 / (zoom * comp) * Math.SQRT1_2;
                    handleGroup(element.x, element.y, element.rotation, half + off, half + off, half + 26 / (zoom * comp), comp, host);
                    break;
                }
                case "sign": {
                    // group handles: rotate = whole-array rotation, radius dot sits on the dashed ring
                    const grp = el("g", {
                        transform: `translate(${element.x} ${element.y}) rotate(${element.rotation})`
                    });
                    host.appendChild(grp);
                    const ext = 26 / (zoom * comp);
                    grp.appendChild(el("line", {
                        x1: 0, y1: 0, x2: 0, y2: -(element.radius + ext),
                        stroke: "var(--color-active)",
                        "stroke-width": 1.5 / (zoom * comp),
                        "stroke-dasharray": `${5 / (zoom * comp)} ${4 / (zoom * comp)}`,
                        class: "sel-tether", "pointer-events": "none"
                    }));
                    dot(0, -(element.radius + ext), "rotate", grp, comp);
                    dot(element.radius, 0, "radius", grp, comp);

                    // member handles on the first member (i = 0): size + spin
                    const mem = el("g", {
                        transform: `translate(${element.x} ${element.y}) rotate(${element.rotation}) translate(0 ${-element.radius})`
                    });
                    host.appendChild(mem);
                    const half = element.size / 2;
                    const extm = 20 / (zoom * comp);
                    const mc = "var(--handle-member)";
                    const spinG = el("g", { transform: `rotate(${element.spin})` });
                    mem.appendChild(spinG);
                    // member spin tether points INWARD so it never crosses the dashed ring
                    spinG.appendChild(el("line", {
                        x1: 0, y1: 0, x2: 0, y2: half + extm,
                        stroke: mc,
                        "stroke-width": 1.5 / (zoom * comp),
                        "stroke-dasharray": `${5 / (zoom * comp)} ${4 / (zoom * comp)}`,
                        class: "sel-tether", "pointer-events": "none"
                    }));
                    dot(0, half + extm, "mspin", spinG, comp, mc);
                    // member scale dot lives in the spin frame: stays at the visual corner
                    const moff = 9 / (zoom * comp) * Math.SQRT1_2;
                    dot(half + moff, half + moff, "msize", spinG, comp, mc);
                    break;
                }
                case "line": {
                    for (const [i, p] of element.points.entries()) dot(p.x, p.y, `vertex${i}`, host, comp);
                    break;
                }
            }
        } else {
            handleGroup(CENTER + seal.x, CENTER + seal.y, seal.rotation, 500, 500, 500 + 26 / Math.max(0.2, zoom * (seal.scale / 100)), seal.scale / 100, this.overlayG);
        }
    }
}
