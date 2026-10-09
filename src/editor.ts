import {
    CENTER, defaultSpell, wrap360, elementBounds, spellBounds, findElement, findSeal, newLine, newRing, newSeal, newSigil, newSign,
    uid, type LineEl, type Pt, type Selection, type Seal, type Spell, type SpellElement
} from "./model";
import { Renderer } from "./render";
import { History } from "./history";
import { autosave } from "./io";
import type { SymbolDef } from "./symbols";

export type Tool = "select" | "line";

export interface EditorState {
    spell: Spell;
    selection: Selection | null;
    tool: Tool;
    snap: boolean;
    grid: boolean;
    canUndo: boolean;
    canRedo: boolean;
    drawing: boolean;
}

type ChangeListener = (state: EditorState, major: boolean) => void;

const SNAP_STEP = 25;
const ROT_STEP = 15;

function snapVal(v: number, on: boolean, step = SNAP_STEP): number {
    return on ? Math.round(v / step) * step : Math.round(v);
}

export class Editor {
    renderer: Renderer;
    history = new History();

    spell: Spell;
    selections: Selection[] = [];
    tool: Tool = "select";
    snap = true;
    grid = true;

    private listeners = new Set<ChangeListener>();
    private spawnedIds = new Set<string>();

    // drag session
    private drag: null | {
        mode: "move" | "rotate" | "scale" | "pan" | "vertex" | "radius" | "msize" | "mspin" | "batch-rotate" | "batch-scale";
        startWorld: Pt;
        sealId: string | null;
        elId: string | null;
        handle?: string;
        orig: any;
        origAll?: { id: string; orig: any }[];
        origSeal?: any;
        startAngle?: number;
        startDist?: number;
        center?: Pt;
        panStart?: { x: number; y: number; vx: number; vy: number };
    } = null;

    // line tool session
    draftLine: LineEl | null = null;
    draftSealId: string | null = null;

    private spaceDown = false;

    get selection(): Selection | null {
        return this.selections[0] ?? null;
    }

    private clipboard: SpellElement[] = [];

    constructor(container: HTMLElement, initialSpell: Spell) {
        this.spell = initialSpell;
        this.renderer = new Renderer(container);
        this.history.reset(this.spell);
        (window as any).__editor = this;
        this.bindEvents(container);
        // regenerate the screen-space grid whenever the canvas is resized
        new ResizeObserver(() => this.renderer.applyViewport()).observe(container);
        this.fitView();
        this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
    }

    // ------------------------------------------------------- subscriptions

    onChange(fn: ChangeListener): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    private emit(major = false): void {
        const state = this.state();
        this.listeners.forEach(l => l(state, major));
    }

    state(): EditorState {
        return {
            spell: this.spell,
            selection: this.selection,
            tool: this.tool,
            snap: this.snap,
            grid: this.grid,
            canUndo: this.history.canUndo,
            canRedo: this.history.canRedo,
            drawing: this.draftLine !== null
        };
    }

    // ------------------------------------------------------- mutations

    commit(animateIds?: string[], major = true): void {
        if (animateIds) {
            animateIds.forEach(id => this.spawnedIds.add(id));
            setTimeout(() => {
                animateIds.forEach(id => this.spawnedIds.delete(id));
            }, 600);
        }
        this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
        this.renderer.drawSelectionOverlay(this.selections, this.spell);
        autosave(this.spell);
        this.history.push(this.spell);
        this.emit(true);
    }

    refresh(): void {
        this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
        this.renderer.drawSelectionOverlay(this.selections, this.spell);
        this.emit();
    }

    softCommit(): void {
        this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
        this.renderer.drawSelectionOverlay(this.selections, this.spell);
        autosave(this.spell);
        this.emit();
    }

    commitHistory(): void {
        this.history.push(this.spell);
        autosave(this.spell);
        this.emit();
    }

    select(sel: Selection | null): void {
        this.setSelections(sel ? [sel] : []);
    }

    setSelections(list: Selection[]): void {
        this.selections = list;
        this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
        this.renderer.drawSelectionOverlay(this.selections, this.spell);
        this.emit(true);
    }

    selectedIds(): Set<string> {
        return new Set(this.selections.map(s => s.elId).filter(Boolean) as string[]);
    }

    copySelection(): boolean {
        const clones = this.selections
            .filter(sl => sl.elId)
            .map(sl => findElement(this.spell, sl.sealId, sl.elId!))
            .filter(Boolean)
            .map(el => JSON.parse(JSON.stringify(el)) as SpellElement);
        if (!clones.length) return false;
        this.clipboard = clones;
        return true;
    }

    paste(): void {
        if (!this.clipboard.length) return;
        const seal = this.activeSeal();
        const newIds: string[] = [];
        for (const clone of this.clipboard) {
            const copy = JSON.parse(JSON.stringify(clone)) as SpellElement;
            copy.id = uid();
            this.shiftElement(copy, 25, 25);
            seal.elements.push(copy);
            newIds.push(copy.id);
        }
        this.selections = newIds.map(id => ({ sealId: seal.id, elId: id }));
        this.commit(newIds);
    }

    private shiftElement(el: SpellElement, dx: number, dy: number): void {
        if (el.kind === "line") {
            for (const p of el.points) { p.x += dx; p.y += dy; }
        } else {
            el.x += dx; el.y += dy;
        }
    }

    setTool(tool: Tool): void {
        if (this.draftLine) this.cancelDraft();
        this.tool = tool;
        this.renderer.svg.dataset.tool = tool;
        this.emit();
    }

    setSnap(on: boolean): void {
        this.snap = on;
        this.emit();
    }

    setGrid(on: boolean): void {
        this.grid = on;
        this.renderer.svg.classList.toggle("hide-grid", !on);
        this.emit();
    }

    loadSpell(spell: Spell): void {
        this.spell = spell;
        this.selections = [];
        this.history.reset(spell);
        this.commit();
    }

    newSpell(): void {
        this.loadSpell(defaultSpell());
    }

    // ------------------------------------------------------- factories

    addSeal(): void {
        const seal = newSeal();
        this.spell.seals.push(seal);
        this.selections = [{ sealId: seal.id, elId: null }];
        this.commit([seal.id]);
    }

    addRing(): void {
        const seal = this.activeSeal();
        const ring = newRing(this.spell.color);
        seal.elements.push(ring);
        this.selections = [{ sealId: seal.id, elId: ring.id }];
        this.commit([ring.id]);
    }

    addSymbol(def: SymbolDef, asSign: boolean): void {
        const seal = this.activeSeal();
        let element: SpellElement;
        if (asSign) {
            element = newSign(def.id, this.spell.color);
        } else {
            element = newSigil(def.id, this.spell.color);
        }
        seal.elements.push(element);
        this.selections = [{ sealId: seal.id, elId: element.id }];
        this.commit([element.id]);
    }

    startLine(): void {
        const seal = this.activeSeal();
        this.draftLine = newLine(this.spell.color);
        this.draftSealId = seal.id;
        this.emit();
    }

    cancelDraft(): void {
        this.draftLine = null;
        this.draftSealId = null;
        this.refresh();
        this.emit();
    }

    private finishDraft(): void {
        if (this.draftLine && this.draftSealId) {
            const seal = findSeal(this.spell, this.draftSealId);
            if (seal && this.draftLine.points.length >= 2) {
                const line = this.draftLine;
                seal.elements.push(line);
                this.selections = [{ sealId: seal.id, elId: line.id }];
                this.draftLine = null;
                this.draftSealId = null;
                this.commit([line.id]);
                this.setTool("select");
                return;
            }
        }
        this.cancelDraft();
    }

    activeSeal(): Seal {
        const seal = findSeal(this.spell, this.selection?.sealId ?? null);
        return seal ?? this.spell.seals[0];
    }

    deleteSelection(): void {
        if (!this.selections.length) return;
        const sealLevel = this.selections.find(sl => !sl.elId);
        if (sealLevel) {
            if (this.spell.seals.length > 1) {
                this.spell.seals = this.spell.seals.filter(s => s.id !== sealLevel.sealId);
            }
            this.selections = [];
        } else {
            const ids = new Set(this.selections.map(sl => sl.elId!));
            const seal = findSeal(this.spell, this.selections[0].sealId);
            if (seal) seal.elements = seal.elements.filter(e => !ids.has(e.id));
            this.selections = [];
        }
        this.commit();
    }

    duplicateSelection(): void {
        if (!this.selections.length) return;
        const sealLevel = this.selections.find(sl => !sl.elId);
        if (sealLevel) {
            const seal = findSeal(this.spell, sealLevel.sealId);
            if (!seal) return;
            const copy = JSON.parse(JSON.stringify(seal)) as Seal;
            copy.id = uid();
            copy.x += 25;
            copy.y += 25;
            for (const e of copy.elements) e.id = uid();
            this.spell.seals.push(copy);
            this.selections = [{ sealId: copy.id, elId: null }];
            this.commit([copy.id]);
            return;
        }
        if (!this.copySelection()) return;
        this.paste();
    }

    reorderElement(sealId: string, elId: string, dir: -1 | 1): void {
        const seal = findSeal(this.spell, sealId);
        if (!seal) return;
        const idx = seal.elements.findIndex(e => e.id === elId);
        const target = idx + dir;
        if (idx < 0 || target < 0 || target >= seal.elements.length) return;
        const [item] = seal.elements.splice(idx, 1);
        seal.elements.splice(target, 0, item);
        this.commit();
    }

    nudge(dx: number, dy: number, big: boolean): void {
        if (!this.selection) return;
        const step = big ? 10 : 1;
        const sealLevel = this.selections.find(sl => !sl.elId);
        if (sealLevel) {
            const seal = findSeal(this.spell, sealLevel.sealId);
            if (!seal) return;
            seal.x += dx * step;
            seal.y += dy * step;
        } else {
            for (const sl of this.selections) {
                const element = findElement(this.spell, sl.sealId, sl.elId!);
                if (element) this.shiftElement(element, dx * step, dy * step);
            }
        }
        this.commit(undefined, false);
    }

    // ------------------------------------------------------- viewport

    fitView(): void {
        const b = spellBounds(this.spell);
        if (!b) {
            this.renderer.setViewport({ zoom: 1, x: 0, y: 0 });
            this.emit();
            return;
        }
        const PAD = 40;
        const w = b.w + PAD * 2, h = b.h + PAD * 2;
        const ctm = this.renderer.svg.getScreenCTM();
        if (!ctm) return;
        // available viewport in user units
        const availW = this.renderer.svg.clientWidth / ctm.a;
        const availH = this.renderer.svg.clientHeight / ctm.a;
        const zoom = Math.min(8, Math.max(0.15, Math.min(availW / w, availH / h)));
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        this.renderer.setViewport({
            zoom,
            x: availW / 2 - cx * zoom,
            y: availH / 2 - cy * zoom
        });
        this.emit();
    }

    zoomAt(clientX: number, clientY: number, factor: number): void {
        const vp = this.renderer.viewport;
        // viewBox coords of cursor (accounts for letterboxing via screen CTM)
        const ctm = this.renderer.svg.getScreenCTM();
        if (!ctm) return;
        const vb = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
        // world point under the cursor must stay fixed while zooming
        const wx = (vb.x - vp.x) / vp.zoom;
        const wy = (vb.y - vp.y) / vp.zoom;
        const newZoom = Math.min(8, Math.max(0.15, vp.zoom * factor));
        this.renderer.setViewport({
            zoom: newZoom,
            x: vb.x - wx * newZoom,
            y: vb.y - wy * newZoom
        });
        this.emit();
    }

    zoomStep(factor: number): void {
        const svgRect = this.renderer.svg.getBoundingClientRect();
        this.zoomAt(svgRect.left + svgRect.width / 2, svgRect.top + svgRect.height / 2, factor);
    }

    private worldToViewBox(world: Pt): Pt {
        return { x: world.x * this.renderer.viewport.zoom + this.renderer.viewport.x, y: world.y * this.renderer.viewport.zoom + this.renderer.viewport.y };
    }

    // ------------------------------------------------------- events

    private bindEvents(container: HTMLElement): void {
        const svg = this.renderer.svg;
        svg.dataset.tool = this.tool;

        svg.addEventListener("pointerdown", (ev) => this.onPointerDown(ev, container));
        svg.addEventListener("pointermove", (ev) => this.onPointerMove(ev, container));
        window.addEventListener("pointerup", (ev) => this.onPointerUp(ev, container));
        svg.addEventListener("wheel", (ev) => {
            ev.preventDefault();
            const factor = ev.deltaY < 0 ? 1.1 : 1 / 1.1;
            this.zoomAt(ev.clientX, ev.clientY, factor);
        }, { passive: false });
        svg.addEventListener("dblclick", () => {
            if (this.draftLine) this.finishDraft();
        });
        svg.addEventListener("contextmenu", ev => ev.preventDefault());

        window.addEventListener("keydown", (ev) => this.onKeyDown(ev));
        window.addEventListener("keyup", (ev) => {
            if (ev.code === "Space") this.spaceDown = false;
        });
    }

    private onKeyDown(ev: KeyboardEvent): void {
        const target = ev.target as HTMLElement;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

        if (ev.code === "Space") this.spaceDown = true;

        if (ev.ctrlKey || ev.metaKey) {
            switch (ev.key.toLowerCase()) {
                case "z":
                    ev.preventDefault();
                    if (ev.shiftKey) this.redo(); else this.undo();
                    break;
                case "y":
                    ev.preventDefault();
                    this.redo();
                    break;
                case "d":
                    ev.preventDefault();
                    this.duplicateSelection();
                    break;
                case "c":
                    ev.preventDefault();
                    this.copySelection();
                    break;
                case "v":
                    ev.preventDefault();
                    this.paste();
                    break;
            }
            return;
        }

        switch (ev.key) {
            case "Delete":
            case "Backspace":
                if (this.selection) {
                    ev.preventDefault();
                    this.deleteSelection();
                }
                break;
            case "Escape":
                if (this.draftLine) this.cancelDraft();
                else this.select(null);
                break;
            case "Enter":
                if (this.draftLine) this.finishDraft();
                break;
            case "g":
            case "G":
                this.setGrid(!this.grid);
                break;
            case "s":
            case "S":
                this.setSnap(!this.snap);
                break;
            case "f":
            case "F":
                this.fitView();
                break;
            case "v":
            case "V":
                this.setTool("select");
                break;
            case "l":
            case "L":
                this.setTool("line");
                if (!this.draftLine) this.startLine();
                break;
            case "ArrowUp": ev.preventDefault(); this.nudge(0, -1, ev.shiftKey); break;
            case "ArrowDown": ev.preventDefault(); this.nudge(0, 1, ev.shiftKey); break;
            case "ArrowLeft": ev.preventDefault(); this.nudge(-1, 0, ev.shiftKey); break;
            case "ArrowRight": ev.preventDefault(); this.nudge(1, 0, ev.shiftKey); break;
        }
    }

    undo(): void {
        const prev = this.history.undo();
        if (prev) {
            this.spell = prev;
            this.selections = [];
            this.renderer.render(this.spell, new Set());
            this.renderer.drawSelectionOverlay([], this.spell);
            autosave(this.spell);
            this.emit();
        }
    }

    redo(): void {
        const next = this.history.redo();
        if (next) {
            this.spell = next;
            this.selections = [];
            this.renderer.render(this.spell, new Set());
            this.renderer.drawSelectionOverlay([], this.spell);
            autosave(this.spell);
            this.emit();
        }
    }

    // ------------------------------------------------------- pointer logic

    private onPointerDown(ev: PointerEvent, container: HTMLElement): void {
        try { (ev.target as Element).setPointerCapture?.(ev.pointerId); } catch { /* inactive pointer */ }
        const world = this.renderer.clientToWorldContent(ev.clientX, ev.clientY);

        if (ev.button === 1 || ev.button === 2 || this.spaceDown) {
            const vp = this.renderer.viewport;
            this.drag = {
                mode: "pan",
                startWorld: world,
                sealId: null, elId: null, orig: null,
                panStart: { x: vp.x, y: vp.y, vx: ev.clientX, vy: ev.clientY }
            };
            return;
        }
        if (ev.button !== 0) return;

        // line tool
        if (this.tool === "line") {
            if (!this.draftLine) this.startLine();
            if (this.draftLine) {
                const seal = findSeal(this.spell, this.draftSealId);
                if (seal) {
                    const local = this.worldToSealLocal(world, seal);
                    this.draftLine.points.push({ x: snapVal(local.x, this.snap), y: snapVal(local.y, this.snap) });
                    this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
                    // render() clears the ghost: redraw it so the line stays visible
                    this.updateDraftGhost(world);
                    this.emit();
                }
            }
            return;
        }

        const handleTarget = (ev.target as Element).closest("[data-handle]") as SVGElement | null;
        if (handleTarget) {
            const kind = handleTarget.dataset.handle!;
            this.renderer.activeHandle = kind;
            this.beginHandleDrag(kind, world);
            return;
        }

        const hitTarget = (ev.target as Element).closest("[data-id]") as SVGElement | null;
        if (hitTarget) {
            const elId = hitTarget.dataset.id!;
            const sealG = hitTarget.closest("[data-seal]") as SVGElement | null;
            const sealId = sealG?.dataset.seal ?? this.activeSeal().id;
            const seal = findSeal(this.spell, sealId);
            const element = findElement(this.spell, sealId, elId);
            if (!seal || !element) return;

            const local = this.worldToSealLocal(world, seal);

            if (ev.shiftKey) {
                // toggle membership in the multi-selection (same seal only)
                const already = this.selections.some(sl => sl.elId === elId);
                let list = already
                    ? this.selections.filter(sl => sl.elId !== elId)
                    : [...this.selections.filter(sl => sl.elId), { sealId, elId }];
                if (!list.length) list = [{ sealId, elId }];
                this.setSelections(list);
                return;
            }

            if (!this.selections.some(sl => sl.elId === elId)) {
                this.select({ sealId, elId });
            }

            const origAll = this.selections
                .filter(sl => sl.elId)
                .map(sl => ({ id: sl.elId!, orig: JSON.parse(JSON.stringify(findElement(this.spell, sl.sealId, sl.elId!))) }));

            this.drag = {
                mode: "move",
                startWorld: world,
                sealId, elId,
                orig: JSON.parse(JSON.stringify(element)),
                origAll
            };
            return;
        }

        // clicked empty space: select seal background or pan
        const sealG = (ev.target as Element).closest("[data-seal]") as SVGElement | null;
        if (sealG) {
            const sealId = sealG.dataset.seal!;
            const seal = findSeal(this.spell, sealId);
            if (seal) {
                this.select({ sealId, elId: null });
                this.drag = {
                    mode: "move",
                    startWorld: world,
                    sealId, elId: null,
                    orig: null,
                    origSeal: { x: seal.x, y: seal.y }
                };
                return;
            }
        }


        this.select(null);
        const vp = this.renderer.viewport;
        this.drag = {
            mode: "pan",
            startWorld: world,
            sealId: null, elId: null, orig: null,
            panStart: { x: vp.x, y: vp.y, vx: ev.clientX, vy: ev.clientY }
        };
    }

    private beginHandleDrag(kind: string, world: Pt): void {
        if (!this.selection) return;
        const { sealId, elId } = this.selection;
        const seal = findSeal(this.spell, sealId);
        if (!seal) return;
        const local = this.worldToSealLocal(world, seal);

        if (kind.startsWith("batch")) {
            const center = this.batchCenter();
            const origAll = this.selections
                .filter(sl => sl.elId)
                .map(sl => ({ id: sl.elId!, orig: JSON.parse(JSON.stringify(findElement(this.spell, sl.sealId, sl.elId!))) }));
            const local = this.worldToSealLocal(world, seal);
            this.drag = {
                mode: kind === "batch-rotate" ? "batch-rotate" : "batch-scale",
                startWorld: world, sealId, elId: null,
                handle: kind, orig: null, origAll,
                center,
                startAngle: Math.atan2(local.y - center.y, local.x - center.x) * 180 / Math.PI,
                startDist: Math.hypot(local.x - center.x, local.y - center.y)
            };
            return;
        }

        if (!elId) {
            this.drag = {
                mode: kind === "scale" ? "scale" : "rotate",
                startWorld: world, sealId, elId: null,
                handle: kind, orig: null,
                origSeal: {
                    rotation: seal.rotation,
                    scale: seal.scale
                },
                startAngle: Math.atan2(local.y, local.x) * 180 / Math.PI,
                startDist: Math.hypot(local.x, local.y)
            };
            return;
        }

        const element = findElement(this.spell, sealId, elId);
        if (!element) return;
        const isMember = kind === "msize" || kind === "mspin";
        const center = isMember ? this.memberCenterLocal(element) : this.elementCenterLocal(element);
        this.drag = {
            mode: kind === "scale" ? "scale"
                : kind.startsWith("vertex") ? "vertex"
                : kind === "msize" ? "msize"
                : kind === "mspin" ? "mspin"
                : kind === "radius" ? "radius"
                : "rotate",
            startWorld: world, sealId, elId,
            handle: kind,
            orig: JSON.parse(JSON.stringify(element)),
            startAngle: 0,
            startDist: 0,
            center
        };
        this.drag.startAngle = Math.atan2(local.y - center.y, local.x - center.x) * 180 / Math.PI;
        this.drag.startDist = Math.hypot(local.x - center.x, local.y - center.y);
    }

    private batchCenter(): Pt {
        const seal = findSeal(this.spell, this.selections[0]?.sealId ?? null);
        if (!seal || !this.selections.length) return { x: 0, y: 0 };
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const sl of this.selections) {
            const el = findElement(this.spell, sl.sealId, sl.elId!);
            if (!el) continue;
            const b = elementBounds(el);
            minX = Math.min(minX, b.cx - b.hw); maxX = Math.max(maxX, b.cx + b.hw);
            minY = Math.min(minY, b.cy - b.hh); maxY = Math.max(maxY, b.cy + b.hh);
        }
        return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    }

    private memberCenterLocal(element: SpellElement): Pt {
        if (element.kind !== "sign") return this.elementCenterLocal(element);
        const rad = element.rotation * Math.PI / 180;
        return {
            x: element.x + element.radius * Math.sin(rad),
            y: element.y - element.radius * Math.cos(rad)
        };
    }

    private elementCenterLocal(element: SpellElement): Pt {
        switch (element.kind) {
            case "ring": return { x: element.x, y: element.y };
            case "sigil": return { x: element.x, y: element.y };
            case "sign": return { x: element.x, y: element.y };
            case "line": return { x: 0, y: 0 };
        }
    }

    private worldToSealLocal(world: Pt, seal: Seal): Pt {
        const dx = world.x - (CENTER + seal.x);
        const dy = world.y - (CENTER + seal.y);
        const s = seal.scale / 100;
        const rad = -seal.rotation * Math.PI / 180;
        return {
            x: (dx * Math.cos(rad) - dy * Math.sin(rad)) / s,
            y: (dx * Math.sin(rad) + dy * Math.cos(rad)) / s
        };
    }

    private onPointerMove(ev: PointerEvent, _container: HTMLElement): void {
        const world = this.renderer.clientToWorldContent(ev.clientX, ev.clientY);
        this.lastPointer = world;

        if (!this.drag) {
            if (this.draftLine) {
                this.updateDraftGhost(world);
            }
            return;
        }

        this.handleDrag(ev, world, _container);
    }


    private lastPointer: Pt | null = null;


    private updateDraftGhost(world: Pt): void {
        const ghost = document.getElementById("draft-ghost");
        if (ghost) ghost.remove();
        const seal = findSeal(this.spell, this.draftSealId);
        if (!seal || !this.draftLine) return;
        const local = this.worldToSealLocal(world, seal);
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.id = "draft-ghost";
        g.setAttribute("transform",
            `translate(${CENTER + seal.x} ${CENTER + seal.y}) rotate(${seal.rotation}) scale(${seal.scale / 100})`);
        const points = [...this.draftLine.points, { x: snapVal(local.x, this.snap), y: snapVal(local.y, this.snap) }];
        if (points.length >= 2) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" "));
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "var(--color-active)");
            path.setAttribute("stroke-width", String(this.draftLine.weight));
            path.setAttribute("stroke-dasharray", "10 8");
            path.setAttribute("class", "draft-line");
            g.appendChild(path);
        }
        for (const p of this.draftLine.points) {
            const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("cx", String(p.x));
            c.setAttribute("cy", String(p.y));
            c.setAttribute("r", String(5 / Math.max(0.2, this.renderer.viewport.zoom)));
            c.setAttribute("fill", "var(--popup-bg)");
            c.setAttribute("stroke", "var(--color-active)");
            c.setAttribute("stroke-width", String(2 / Math.max(0.2, this.renderer.viewport.zoom)));
            g.appendChild(c);
        }
        const contentG = this.renderer.svg.querySelector("#content-g");
        contentG?.appendChild(g);
    }

    private renderDraftPreview(): void {
        // draft vertices are shown via ghost updates; nothing extra needed
    }

    private handleDrag(ev: PointerEvent, world: Pt, container: HTMLElement): void {
        const d = this.drag;
        if (!d) return;

        if (d.mode === "pan") {
        if (!d.panStart) return;
        const ctm = this.renderer.svg.getScreenCTM();
        if (!ctm) return;
        const s = 1 / ctm.a; // screen px -> viewBox units
        this.renderer.setViewport({
         x: d.panStart.x + (ev.clientX - d.panStart.vx) * s,
         y: d.panStart.y + (ev.clientY - d.panStart.vy) * s
        });
        return;
        }

        const seal = findSeal(this.spell, d.sealId);
        if (!seal) return;

        if (d.mode === "move" && d.elId === null && d.origSeal) {
            let dx = world.x - d.startWorld.x;
            let dy = world.y - d.startWorld.y;
            if (ev.shiftKey) {
                if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0;
            }
            seal.x = snapVal(d.origSeal.x + dx, this.snap);
            seal.y = snapVal(d.origSeal.y + dy, this.snap);
            this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
            this.renderer.drawSelectionOverlay(this.selections, this.spell);
            this.renderer.drawCenterMarker(seal, 0, 0);
            return;
        }

        const local = this.worldToSealLocal(world, seal);

        if (d.mode === "move" && d.elId && d.orig) {
            let dx = local.x - this.worldToSealLocal(d.startWorld, seal).x;
            let dy = local.y - this.worldToSealLocal(d.startWorld, seal).y;
            if (ev.shiftKey) {
                if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0;
            }
            const targets: { id: string; orig: any }[] = d.origAll && d.origAll.length > 1
                ? d.origAll
                : [{ id: d.elId, orig: d.orig }];
            let movedEl: SpellElement | null = null;
            for (const t of targets) {
                const element = findElement(this.spell, d.sealId, t.id);
                if (!element) continue;
                if (element.kind === "line") {
                    element.points = (t.orig as LineEl).points.map(p => ({
                        x: snapVal(p.x + dx, this.snap),
                        y: snapVal(p.y + dy, this.snap)
                    }));
                } else if ("x" in element && "y" in element) {
                    element.x = snapVal((t.orig as any).x + dx, this.snap);
                    element.y = snapVal((t.orig as any).y + dy, this.snap);
                }
                if (d.elId === t.id) movedEl = element;
            }
            this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
            this.renderer.drawSelectionOverlay(this.selections, this.spell);
            if (movedEl && movedEl.kind !== "line") {
                this.renderer.drawCenterMarker(seal, movedEl.x, movedEl.y);
            }
            return;
        }


        if (d.mode === "vertex" && d.orig) {
            const element = findElement(this.spell, d.sealId, d.elId!);
            if (element && element.kind === "line") {
                const startLocal = this.worldToSealLocal(d.startWorld, seal);
                const idx = Number(d.handle!.replace("vertex", ""));
                const orig = (d.orig as LineEl).points[idx];
                if (orig) {
                    const target = element.points[idx];
                    if (target) {
                        const ddx = local.x - startLocal.x;
                        const ddy = local.y - startLocal.y;
                        target.x = snapVal(orig.x + ddx, this.snap);
                        target.y = snapVal(orig.y + ddy, this.snap);
                        this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
                        this.renderer.drawSelectionOverlay(this.selections, this.spell);
                    }
                }
            }
            return;
        }

        if (d.mode === "rotate") {
            const center = d.center ?? { x: 0, y: 0 };
            const deg = Math.atan2(local.y - center.y, local.x - center.x) * 180 / Math.PI;
            let delta = deg - (d.startAngle ?? 0);
            if (!ev.shiftKey && this.snap) {
                // snap the resulting rotation
            }
            if (d.elId && d.orig) {
                const element = findElement(this.spell, d.sealId, d.elId);
                if (!element) return;
                const origRot = (d.orig as any).rotation as number;
                let next = origRot + delta;
                if (this.snap && !ev.shiftKey) next = Math.round(next / ROT_STEP) * ROT_STEP;
                (element as any).rotation = wrap360(Math.round(next * 10) / 10);
            } else if (d.origSeal) {
                let next = d.origSeal.rotation + delta;
                if (this.snap && !ev.shiftKey) next = Math.round(next / ROT_STEP) * ROT_STEP;
                seal.rotation = wrap360(Math.round(next * 10) / 10);
            }
            this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
            this.renderer.drawSelectionOverlay(this.selections, this.spell);
            return;
        }

        if (d.mode === "radius") {
            const element = findElement(this.spell, d.sealId, d.elId!);
            if (element && element.kind === "sign") {
                element.radius = Math.max(10, snapVal(Math.hypot(local.x - element.x, local.y - element.y), this.snap, 5));
                this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
                this.renderer.drawSelectionOverlay(this.selections, this.spell);
            }
            return;
        }

        if (d.mode === "msize") {
            const element = findElement(this.spell, d.sealId, d.elId!);
            if (element && element.kind === "sign") {
                const startLocal = this.worldToSealLocal(d.startWorld, seal);
                const center = this.memberCenterLocal(d.orig);
                const startDist = Math.hypot(startLocal.x - center.x, startLocal.y - center.y);
                const nowDist = Math.hypot(local.x - center.x, local.y - center.y);
                const f = startDist > 0 ? nowDist / startDist : 1;
                element.size = Math.max(20, Math.round((d.orig as any).size * f));
                this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
                this.renderer.drawSelectionOverlay(this.selections, this.spell);
            }
            return;
        }

        if (d.mode === "mspin") {
            const element = findElement(this.spell, d.sealId, d.elId!);
            if (element && element.kind === "sign") {
                const center = this.memberCenterLocal(d.orig);
                const deg = Math.atan2(local.y - center.y, local.x - center.x) * 180 / Math.PI;
                let next = (d.orig as any).spin + (deg - (d.startAngle ?? 0));
                if (this.snap && !ev.shiftKey) next = Math.round(next / ROT_STEP) * ROT_STEP;
                element.spin = wrap360(Math.round(next * 10) / 10);
                this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
                this.renderer.drawSelectionOverlay(this.selections, this.spell);
            }
            return;
        }

        if (d.mode === "batch-rotate" || d.mode === "batch-scale") {
            const c = d.center ?? { x: 0, y: 0 };
            const deg = Math.atan2(local.y - c.y, local.x - c.x) * 180 / Math.PI;
            const delta = d.mode === "batch-rotate"
                ? (this.snap && !ev.shiftKey ? Math.round((deg - (d.startAngle ?? 0)) / ROT_STEP) * ROT_STEP : deg - (d.startAngle ?? 0))
                : 0;
            const f = d.mode === "batch-scale"
                ? (d.startDist ?? 0) > 0 ? Math.hypot(local.x - c.x, local.y - c.y) / (d.startDist ?? 1) : 1
                : 1;
            const rad = delta * Math.PI / 180;
            const cos = Math.cos(rad), sin = Math.sin(rad);
            for (const t of d.origAll ?? []) {
                const el = findElement(this.spell, d.sealId, t.id);
                if (!el) continue;
                const orig = t.orig;
                const tp = (px: number, py: number) => {
                    const ox = (px - c.x) * f, oy = (py - c.y) * f;
                    return { x: snapVal(c.x + ox * cos - oy * sin, this.snap), y: snapVal(c.y + ox * sin + oy * cos, this.snap) };
                };
                if (el.kind === "line") {
                    el.points = (orig as LineEl).points.map(p => tp(p.x, p.y));
                } else {
                    const np = tp(orig.x, orig.y);
                    el.x = np.x; el.y = np.y;
                    if (el.kind === "ring") {
                        el.radius = Math.max(1, orig.radius * f);
                        el.openingAngle = orig.openingAngle + delta;
                    } else {
                        el.rotation = wrap360(orig.rotation + delta);
                        if (el.kind === "sign") {
                            el.radius = Math.max(1, orig.radius * f);
                            el.size = Math.max(10, orig.size * f);
                        } else if (el.kind === "sigil") {
                            el.size = Math.max(10, orig.size * f);
                        }
                    }
                }
            }
            this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
            this.renderer.drawSelectionOverlay(this.selections, this.spell);
            return;
        }

        if (d.mode === "scale") {
            const factor = (d.startDist ?? 0) > 0 ? Math.hypot(local.x, local.y) / (d.startDist ?? 1) : 1;
            if (d.elId && d.orig) {
                const element = findElement(this.spell, d.sealId, d.elId);
                if (!element) return;
                switch (element.kind) {
                    case "ring": {
                        const orig = d.orig as any;
                        const center = { x: orig.x, y: orig.y };
                        const startLocal = this.worldToSealLocal(d.startWorld, seal);
                        const startDist = Math.hypot(startLocal.x - center.x, startLocal.y - center.y);
                        const nowDist = Math.hypot(local.x - center.x, local.y - center.y);
                        const f = startDist > 0 ? nowDist / startDist : 1;
                        element.radius = Math.max(10, snapVal(orig.radius * f, this.snap, 5));
                        break;
                    }
                    case "sigil": {
                        const orig = d.orig as any;
                        const startLocal = this.worldToSealLocal(d.startWorld, seal);
                        const center = { x: orig.x, y: orig.y };
                        const startDist = Math.hypot(startLocal.x - center.x, startLocal.y - center.y);
                        const nowDist = Math.hypot(local.x - center.x, local.y - center.y);
                        const f = startDist > 0 ? nowDist / startDist : 1;
                        element.size = Math.max(20, Math.round(orig.size * f));
                        break;
                    }
                    case "sign": {
                        const orig = d.orig as any;
                        const startLocal = this.worldToSealLocal(d.startWorld, seal);
                        const center = { x: orig.x, y: orig.y };
                        const startDist = Math.hypot(startLocal.x - center.x, startLocal.y - center.y);
                        const nowDist = Math.hypot(local.x - center.x, local.y - center.y);
                        const f = startDist > 0 ? nowDist / startDist : 1;
                        element.radius = Math.max(10, snapVal(orig.radius * f, this.snap, 5));
                        break;
                    }
                    case "line": break;
                }
            } else if (d.origSeal) {
                seal.scale = Math.min(500, Math.max(10, Math.round(d.origSeal.scale * factor)));
            }
            this.renderer.render(this.spell, this.selectedIds(), this.spawnedIds);
            this.renderer.drawSelectionOverlay(this.selections, this.spell);
            return;
        }
    }

    private onPointerUp(_ev: PointerEvent, _container: HTMLElement): void {
        this.renderer.activeHandle = null;
        if (!this.drag) return;
        const wasMutating = this.drag.mode !== "pan";
        this.drag = null;
        if (wasMutating) {
            this.history.push(this.spell);
            autosave(this.spell);
            this.renderer.drawSelectionOverlay(this.selections, this.spell);
            this.emit();
        }
    }

    cursorWorld(): Pt | null {
        return this.lastPointer;
    }
}
