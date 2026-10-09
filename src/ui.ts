import { t, getLang, setLang, langs, onLangChange } from "./i18n";
import { getTheme, setTheme, toggleTheme, onThemeChange } from "./theme";
import { symbolsByCategory, type SymbolCategory, getSymbol } from "./symbols";
import { symbolDescription } from "./descriptions";
import { getLang as getLangState } from "./i18n";
import { PICO8, findElement, findSeal, wrap360, type SpellElement } from "./model";
import type { Editor, EditorState } from "./editor";
import { downloadJSON, exportSize, readJSONFile, renderPNGDataURL, triggerDownload } from "./io";

const ICONS: Record<string, string> = {
    new: '<path d="M14 3v9M9.5 7.5h9"/>',
    open: '<path d="M3 6a1 1 0 0 1 1-1h4l2 2h6a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
    save: '<path d="M5 3h10l2 2v12l-2 2H5l-2-2V5z"/><path d="M7 3v5h7V3M7 13h6"/>',
    image: '<rect x="3" y="4" width="14" height="12" rx="1.5"/><circle cx="7.5" cy="8.5" r="1.5"/><path d="M4 15l4-4 3 3 3-3 2 2"/>',
    link: '<path d="M7 10a3.5 3.5 0 0 1 0-5l1-1a3.5 3.5 0 0 1 5 5"/><path d="M13 10a3.5 3.5 0 0 1 0 5l-1 1a3.5 3.5 0 0 1-5-5"/><path d="M6 14L14 6"/>',
    undo: '<path d="M4 8h8a4 4 0 0 1 0 8H8"/><path d="M7 5L4 8l3 3"/>',
    redo: '<path d="M16 8H8a4 4 0 0 0 0 8h4"/><path d="M13 5l3 3-3 3"/>',
    seal: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="2.5"/>',
    ring: '<circle cx="10" cy="10" r="7"/>',
    line: '<path d="M4 16L16 4"/><circle cx="4" cy="16" r="1.6"/><circle cx="16" cy="4" r="1.6"/>',
    grid: '<path d="M3 3h14v14H3zM7 3v14M11 3v14M15 3v14M3 7h14M3 11h14M3 15h14" stroke-width="1"/>',
    magnet: '<path d="M6 3v7a4 4 0 0 0 8 0V3h-3v7a1 1 0 0 1-2 0V3z"/>',
    zoomOut: '<circle cx="9" cy="9" r="6"/><path d="M16 16l4 4M6.5 9h5"/>',
    zoomIn: '<circle cx="9" cy="9" r="6"/><path d="M16 16l4 4M6.5 9h5M9 6.5v5"/>',
    fit: '<path d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5"/>',
    sun: '<circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M15.7 4.3l-1.4 1.4M5.7 14.3l-1.4 1.4"/>',
    moon: '<path d="M16 12A7 7 0 0 1 8 4a7 7 0 1 0 8 8z"/>',
    trash: '<path d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11"/>',
    copy: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><rect x="3" y="3" width="10" height="10" rx="1.5"/>',
    eye: '<path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z"/><circle cx="10" cy="10" r="2.5"/>',
    eyeOff: '<path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z"/><path d="M4 4l12 12"/>',
    up: '<path d="M6 13l4-5 4 5"/>',
    down: '<path d="M6 7l4 5 4-5"/>',
    close: '<path d="M5 5l10 10M15 5L5 15"/>',
    plus: '<path d="M10 4v12M4 10h12"/>'
};

function icon(name: string): string {
    const body = ICONS[name] ?? "";
    return `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export class UI {
    constructor(private editor: Editor) {
        this.buildTopbar();
        this.buildLeftPanel();
        this.buildRightPanel();
        this.buildStatusbar();
        this.buildFloatInfo();

        onLangChange(() => this.rebuild());
        onThemeChange(() => this.syncThemeButton());

        this.editor.onChange((state, major) => this.updateDynamic(state, major));
        this.updateDynamic(this.editor.state(), true);
        this.syncThemeButton();
    }

    private rebuild(): void {
        this.buildTopbar();
        this.buildLeftPanel();
        this.buildRightPanel();
        this.buildStatusbar();
        this.updateDynamic(this.editor.state(), true);
        this.syncThemeButton();
    }

    // ------------------------------------------------------------- topbar

    private topbar = document.getElementById("topbar")!;

    private buildTopbar(): void {
        const e = this.editor;
        const fileInput = this.ensureFileInput();

        const group = (...btns: string[]) => btns.join("");

        const btn = (id: string, iconName: string, labelKey: string, extra = "") =>
            `<button class="tb-btn" data-action="${id}" title="${t(labelKey)}" ${extra}>${icon(iconName)}<span>${t(labelKey)}</span></button>`;

        const toggle = (id: string, iconName: string, labelKey: string) =>
            `<button class="tb-btn tb-toggle" data-action="${id}" data-toggle="${id}" title="${t(labelKey)}">${icon(iconName)}<span>${t(labelKey)}</span></button>`;

        this.topbar.innerHTML = `
            <div class="topbar-left">
                ${btn("new", "new", "act.new")}
                ${btn("open", "open", "act.open")}
                ${btn("save", "save", "act.save")}
                ${btn("exportPng", "image", "act.exportPng")}
            </div>
            <nav class="toolbar">
                <button class="tb-btn tb-icon" data-action="undo" title="${t("act.undo")}" data-needs="undo">${icon("undo")}</button>
                <button class="tb-btn tb-icon" data-action="redo" title="${t("act.redo")}" data-needs="redo">${icon("redo")}</button>
                <span class="tb-sep"></span>
                ${btn("addSeal", "seal", "act.addSeal")}
                ${btn("addRing", "ring", "act.addRing")}
                <button class="tb-btn tb-toggle" data-action="tool-line" data-toggle="tool-line" title="${t("tool.line")}">${icon("line")}<span>${t("tool.line")}</span></button>
                <span class="tb-sep"></span>
                ${toggle("grid", "grid", "toggle.grid")}
                ${toggle("snap", "magnet", "toggle.snap")}
                <span class="tb-sep"></span>
                <button class="tb-btn tb-icon" data-action="zoomOut" title="${t("act.zoomOut")}">${icon("zoomOut")}</button>
                <button class="tb-btn tb-icon" data-action="zoomIn" title="${t("act.zoomIn")}">${icon("zoomIn")}</button>
                <button class="tb-btn tb-icon" data-action="zoomFit" title="${t("act.zoomFit")}">${icon("fit")}</button>
            </nav>
            <div class="topbar-right">
                <div class="lang-select">
                    <select id="lang-select" title="${t("toggle.lang")}" aria-label="${t("toggle.lang")}">
                        ${langs.map(l => `<option value="${l.id}" ${l.id === getLang() ? "selected" : ""}>${l.label}</option>`).join("")}
                    </select>
                </div>
                <button class="tb-btn tb-icon theme-btn" data-action="theme" title="${t("toggle.theme")}"></button>
            </div>
        `;

        this.topbar.querySelectorAll("[data-action]").forEach(b => {
            b.addEventListener("click", () => this.action((b as HTMLElement).dataset.action!));
        });
        this.topbar.querySelector("#lang-select")?.addEventListener("change", (ev) => {
            setLang((ev.target as HTMLSelectElement).value as any);
        });
        void fileInput;
        void e;
    }

    private syncThemeButton(): void {
        const btn = this.topbar.querySelector(".theme-btn") as HTMLElement | null;
        if (!btn) return;
        const dark = getTheme() === "dark";
        btn.innerHTML = icon(dark ? "sun" : "moon");
    }

    private async openPreview(): Promise<void> {
        try {
            const def = exportSize(this.editor.spell);
            let outW = def.w;
            let outH = def.h;
            const aspect = def.w / def.h;

            const overlay = document.createElement("div");
            overlay.className = "modal-overlay";
            overlay.innerHTML = `
                <div class="modal fade-in">
                    <div class="modal-head">
                        <h3>${t("act.exportPng")}</h3>
                        <button class="tb-btn tb-icon modal-close" title="${t("act.close")}">${icon("close")}</button>
                    </div>
                    <img class="modal-img" alt="preview" />
                    <div class="export-size">
                        <span class="export-size-label">${t("exp.size")}</span>
                        <label class="exp-field"><span>${t("exp.width")}</span><input type="number" id="exp-w" min="16" max="8192" step="1" /></label>
                        <span class="exp-x">×</span>
                        <label class="exp-field"><span>${t("exp.height")}</span><input type="number" id="exp-h" min="16" max="8192" step="1" /></label>
                        <span class="exp-px">px</span>
                    </div>
                    <div class="modal-actions">
                        <button class="btn primary">${icon("save")}<span>${t("act.exportPng")}</span></button>
                        <button class="btn ghost modal-close">${icon("close")}<span>${t("act.close")}</span></button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            const close = () => overlay.remove();
            overlay.addEventListener("click", (ev) => {
                if (ev.target === overlay || (ev.target as HTMLElement).closest(".modal-close")) close();
            });

            const img = overlay.querySelector(".modal-img") as HTMLImageElement;
            const wInput = overlay.querySelector("#exp-w") as HTMLInputElement;
            const hInput = overlay.querySelector("#exp-h") as HTMLInputElement;

            const render = async () => {
                img.src = await renderPNGDataURL(this.editor.renderer.svg, this.editor.spell, outW, outH);
            };
            wInput.value = String(outW);
            hInput.value = String(outH);
            await render();

            wInput.addEventListener("change", () => {
                const w = Math.min(8192, Math.max(16, Math.round(Number(wInput.value) || def.w)));
                outW = w;
                outH = Math.max(16, Math.round(w / aspect));
                hInput.value = String(outH);
                render();
            });
            hInput.addEventListener("change", () => {
                const h = Math.min(8192, Math.max(16, Math.round(Number(hInput.value) || def.h)));
                outH = h;
                outW = Math.max(16, Math.round(h * aspect));
                wInput.value = String(outW);
                render();
            });

            overlay.querySelector(".btn.primary")!.addEventListener("click", async () => {
                const dataURL = await renderPNGDataURL(this.editor.renderer.svg, this.editor.spell, outW, outH);
                const blob = await (await fetch(dataURL)).blob();
                triggerDownload(blob, `${(this.editor.spell.name || "spell").replace(/[\\/:*?"<>|]/g, "_")}.png`);
                toast(t("toast.exported"));
                close();
            });
        } catch {
            toast(t("toast.badFile"), "error");
        }
    }

    private fileInput: HTMLInputElement | null = null;

    private ensureFileInput(): HTMLInputElement {
        if (this.fileInput) return this.fileInput;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json,.json";
        input.style.display = "none";
        input.addEventListener("change", async () => {
            const file = input.files?.[0];
            input.value = "";
            if (!file) return;
            try {
                const spell = await readJSONFile(file);
                this.editor.loadSpell(spell);
                toast(t("toast.loaded"));
            } catch {
                toast(t("toast.badFile"), "error");
            }
        });
        document.body.appendChild(input);
        this.fileInput = input;
        return input;
    }

    private action(name: string): void {
        const e = this.editor;
        switch (name) {
            case "new":
                e.newSpell();
                toast(t("toast.cleared"));
                break;
            case "open":
                this.ensureFileInput().click();
                break;
            case "save":
                downloadJSON(e.spell);
                break;
            case "exportPng":
                this.openPreview();
                break;
            case "undo": e.undo(); break;
            case "redo": e.redo(); break;
            case "addSeal": e.addSeal(); break;
            case "addRing": e.addRing(); break;
            case "tool-line":
                e.setTool(e.tool === "line" ? "select" : "line");
                if (e.tool === "line" && !e.draftLine) e.startLine();
                break;
            case "grid": e.setGrid(!e.grid); break;
            case "snap": e.setSnap(!e.snap); break;
            case "zoomIn": e.zoomStep(1.25); break;
            case "zoomOut": e.zoomStep(0.8); break;
            case "zoomFit": e.fitView(); break;
            case "theme": toggleTheme(); break;
        }
    }

    // ------------------------------------------------------------- left panel

    private leftPanel = document.getElementById("left-panel")!;
    private signMode = false;
    private layersCollapsed = false;
    private buildLeftPanel(): void {
        const categories: { id: SymbolCategory; key: string }[] = [
            { id: "sigil", key: "lib.cat.sigil" },
            { id: "sign", key: "lib.cat.sign" },
            { id: "forbidden", key: "lib.cat.forbidden" },
            { id: "shape", key: "lib.cat.shape" },
            { id: "toh", key: "lib.cat.toh" }
        ];

        this.leftPanel.innerHTML = `
            <section class="panel-section lib-section" id="lib-section">
                <header class="panel-header">
                    <h2>${t("lib.title")}</h2>
                    <span class="header-spacer"></span>
                    <button class="chip chip-toggle ${this.signMode ? "active" : ""}" id="group-toggle" title="${t("lib.groupOn")}">${t("lib.group")}</button>
                </header>
                <div class="panel-body">
                    <p class="lib-hint">${t("lib.hintRightClick")}</p>
                    <input type="search" id="lib-search" class="text-input" placeholder="${t("lib.search")}" />
                    <div class="cat-chips" id="lib-cats">
                        ${categories.map((c, i) => `<button class="chip ${i === 0 ? "active" : ""}" data-cat="${c.id}">${t(c.key)}</button>`).join("")}
                    </div>
                    <div class="lib-grid" id="lib-grid"></div>
                    <div class="lib-empty hidden" id="lib-empty">${t("lib.empty")}</div>
                </div>
            </section>
            <section class="panel-section layers-section ${this.layersCollapsed ? "collapsed" : ""}" id="layers-section">
                <header class="panel-header">
                    <h2>${t("layers.title")}</h2>
                    <span class="header-spacer"></span>
                    <button class="collapse-btn" data-collapse="layers-section" aria-label="collapse">${icon("down")}</button>
                </header>
                <div class="panel-body">
                    <div id="layers-list" class="layers-list"></div>
                    <div id="layers-empty" class="lib-empty hidden">${t("layers.empty")}</div>
                </div>
            </section>
        `;

        const search = this.leftPanel.querySelector("#lib-search") as HTMLInputElement;
        search.addEventListener("input", () => this.renderLibrary());
        this.leftPanel.querySelector("#group-toggle")?.addEventListener("click", (ev) => {
            this.signMode = !this.signMode;
            (ev.currentTarget as HTMLElement).classList.toggle("active", this.signMode);
        });
        this.leftPanel.querySelectorAll("#lib-cats .chip").forEach(b => {
            b.addEventListener("click", () => {
                this.leftPanel.querySelectorAll("#lib-cats .chip").forEach(x => x.classList.toggle("active", x === b));
                this.renderLibrary();
            });
        });
        this.leftPanel.querySelectorAll(".collapse-btn").forEach(b => {
            b.addEventListener("click", () => {
                const section = b.closest(".panel-section") as HTMLElement;
                this.layersCollapsed = section.classList.toggle("collapsed");
            });
        });

        this.renderLibrary();
    }

    private renderLibrary(): void {
        const grid = this.leftPanel.querySelector("#lib-grid") as HTMLElement;
        const empty = this.leftPanel.querySelector("#lib-empty") as HTMLElement;
        const cat = this.leftPanel.querySelector("#lib-cats .chip.active") as HTMLElement;
        const query = (this.leftPanel.querySelector("#lib-search") as HTMLInputElement).value.trim().toLowerCase();

        let list = symbolsByCategory((cat?.dataset.cat ?? "sigil") as SymbolCategory);
        if (query) list = list.filter(s => s.name.toLowerCase().includes(query));

        grid.innerHTML = "";
        empty.classList.toggle("hidden", list.length > 0);

        for (const sym of list) {
            const card = document.createElement("button");
            card.className = "lib-card";
            card.innerHTML = `<img src="${sym.url}" alt="${sym.name}" draggable="false" loading="lazy" />`;
            card.addEventListener("click", () => this.editor.addSymbol(sym, this.signMode));
            card.addEventListener("contextmenu", (ev) => {
                ev.preventDefault();
                this.editor.addSymbol(sym, true);
            });
            this.attachFloatInfo(card, () => this.symbolInfoHTML(sym.category, sym.name, sym.url));
            grid.appendChild(card);
        }
    }

    // ------------------------------------------------------------- layers

    private renderLayers(): void {
        const list = this.leftPanel.querySelector("#layers-list") as HTMLElement;
        const empty = this.leftPanel.querySelector("#layers-empty") as HTMLElement;
        const spell = this.editor.spell;
        list.innerHTML = "";
        const total = spell.seals.reduce((n, s) => n + s.elements.length, 0);
        empty.classList.toggle("hidden", total > 0);

        const sel = this.editor.selection;

        for (const seal of [...spell.seals].reverse()) {
            const sealRow = document.createElement("div");
            sealRow.className = `layer-row seal-row${sel && sel.sealId === seal.id && !sel.elId ? " selected" : ""}${seal.visible ? "" : " dimmed"}`;
            sealRow.innerHTML = `
                <button class="layer-vis" data-vis-seal="${seal.id}">${icon(seal.visible ? "eye" : "eyeOff")}</button>
                <span class="layer-icon">${icon("seal")}</span>
                <span class="layer-name">${t("layers.seal")}</span>
                <span class="layer-actions">
                    <button class="layer-btn" data-dup-seal="${seal.id}" title="${t("act.duplicate")}">${icon("copy")}</button>
                    ${spell.seals.length > 1 ? `<button class="layer-btn danger" data-del-seal="${seal.id}" title="${t("act.delete")}">${icon("trash")}</button>` : ""}
                </span>
            `;
            sealRow.addEventListener("click", (ev) => {
                if ((ev.target as HTMLElement).closest("button")) return;
                this.editor.select({ sealId: seal.id, elId: null });
            });
            list.appendChild(sealRow);

            const kids = document.createElement("div");
            kids.className = "layer-children";
            for (const element of [...seal.elements].reverse()) {
                const row = document.createElement("div");
                const isSel = sel?.sealId === seal.id && sel?.elId === element.id;
                row.className = `layer-row el-row${isSel ? " selected" : ""}${element.visible ? "" : " dimmed"}`;
                row.innerHTML = `
                    <button class="layer-vis" data-vis-el="${seal.id}:${element.id}">${icon(element.visible ? "eye" : "eyeOff")}</button>
                    <span class="layer-icon kind-${element.kind}">${icon(element.kind === "ring" ? "ring" : element.kind === "line" ? "line" : "seal")}</span>
                    <span class="layer-name">${elementLabel(element)}</span>
                    <span class="layer-actions">
                        <button class="layer-btn" data-el-up="${seal.id}:${element.id}" title="${t("act.duplicate")}">${icon("copy")}</button>
                        <button class="layer-btn" data-el-reorder="${seal.id}:${element.id}:1" title="${t("up")}">${icon("up")}</button>
                        <button class="layer-btn" data-el-reorder="${seal.id}:${element.id}:-1" title="${t("down")}">${icon("down")}</button>
                        <button class="layer-btn danger" data-el-del="${seal.id}:${element.id}" title="${t("act.delete")}">${icon("trash")}</button>
                    </span>
                `;
                row.addEventListener("click", (ev) => {
                    if ((ev.target as HTMLElement).closest("button")) return;
                    this.editor.select({ sealId: seal.id, elId: element.id });
                });
                kids.appendChild(row);
            }
            list.appendChild(kids);
        }

        list.querySelectorAll("[data-vis-seal]").forEach(b =>
            b.addEventListener("click", () => {
                const seal = findSeal(this.editor.spell, (b as HTMLElement).dataset.visSeal!);
                if (!seal) return;
                seal.visible = !seal.visible;
                this.editor.commit();
            }));
        list.querySelectorAll("[data-vis-el]").forEach(b =>
            b.addEventListener("click", () => {
                const [sealId, elId] = (b as HTMLElement).dataset.visEl!.split(":");
                const element = findElement(this.editor.spell, sealId, elId);
                if (!element) return;
                element.visible = !element.visible;
                this.editor.commit();
            }));
        list.querySelectorAll("[data-dup-seal]").forEach(b =>
            b.addEventListener("click", () => {
                this.editor.select({ sealId: (b as HTMLElement).dataset.dupSeal!, elId: null });
                this.editor.duplicateSelection();
            }));
        list.querySelectorAll("[data-del-seal]").forEach(b =>
            b.addEventListener("click", () => {
                this.editor.select({ sealId: (b as HTMLElement).dataset.delSeal!, elId: null });
                this.editor.deleteSelection();
            }));
        list.querySelectorAll("[data-el-del]").forEach(b =>
            b.addEventListener("click", () => {
                const [sealId, elId] = (b as HTMLElement).dataset.elDel!.split(":");
                this.editor.select({ sealId, elId });
                this.editor.deleteSelection();
            }));
        list.querySelectorAll("[data-el-up]").forEach(b =>
            b.addEventListener("click", () => {
                const [sealId, elId] = (b as HTMLElement).dataset.elUp!.split(":");
                this.editor.duplicateSelection();
                void sealId; void elId;
            }));
        list.querySelectorAll("[data-el-reorder]").forEach(b =>
            b.addEventListener("click", () => {
                const [sealId, elId, dir] = (b as HTMLElement).dataset.elReorder!.split(":");
                this.editor.reorderElement(sealId, elId, Number(dir) as -1 | 1);
            }));
    }

    // ------------------------------------------------------------- inspector

    private rightPanel = document.getElementById("right-panel")!;

    private buildRightPanel(): void {
        this.rightPanel.innerHTML = `
            <section class="panel-section">
                <header class="panel-header"><h2>${t("ins.title")}</h2></header>
                <div id="inspector-body"></div>
            </section>
        `;
        this.renderInspector();
    }

    private inspectorBody(): HTMLElement {
        return this.rightPanel.querySelector("#inspector-body") as HTMLElement;
    }

    private renderInspector(): void {
        this.valueSyncers = [];
        const body = this.inspectorBody();
        const e = this.editor;
        const spell = e.spell;
        const sel = e.selection;
        body.innerHTML = '';

        const card = (title: string) => {
            const el = document.createElement('div');
            el.className = 'ins-card fade-in';
            el.innerHTML = `<h3 class="ins-title">${title}</h3>`;
            body.appendChild(el);
            return el;
        };

        const field = (parent: HTMLElement, labelKey: string, control: HTMLElement) => {
            const row = document.createElement('label');
            row.className = 'field';
            const span = document.createElement('span');
            span.className = 'field-label';
            span.textContent = t(labelKey);
            row.appendChild(span);
            control.classList.add('field-control');
            row.appendChild(control);
            parent.appendChild(row);
            return control;
        };

        const numberInput = (get: () => number, apply: (v: number) => void, step: number, min?: number, max?: number) => {
            const wrap = document.createElement('div');
            wrap.className = 'stepper';
            const dec = document.createElement('button');
            dec.type = 'button';
            dec.className = 'stepper-btn';
            dec.textContent = '−';
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'text-input num';
            input.step = String(step);
            if (min !== undefined) input.min = String(min);
            if (max !== undefined) input.max = String(max);
            const inc = document.createElement('button');
            inc.type = 'button';
            inc.className = 'stepper-btn';
            inc.textContent = '+';

            const clamp = (v: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));
            const commitValue = (v: number) => {
                apply(clamp(Math.round(v * 10) / 10));
                this.editor.softCommit();
            };

            input.value = String(Math.round(get() * 10) / 10);
            input.addEventListener('input', () => {
                const v = Number(input.value);
                if (Number.isFinite(v)) commitValue(v);
            });
            input.addEventListener('change', () => this.editor.commitHistory());

            const bump = (dir: 1 | -1) => {
                const cur = Number(input.value) || 0;
                input.value = String(Math.round(clamp(cur + dir * step) * 10) / 10);
                commitValue(Number(input.value));
            };

            holdable(dec, () => { bump(-1 as 1 | -1); this.editor.commitHistory(); });
            holdable(inc, () => { bump(1 as 1 | -1); this.editor.commitHistory(); });

            wrap.append(dec, input, inc);
            this.valueSyncers.push(() => {
                if (document.activeElement !== input) input.value = String(Math.round(get() * 10) / 10);
            });
            return wrap;
        };

        const palettePicker = (get: () => string, apply: (v: string) => void) => {
            const wrap = document.createElement('div');
            wrap.className = 'palette-picker';
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = 'palette-swatch';
            const refresh = () => swatch.style.backgroundColor = get();
            refresh();
            const pop = document.createElement('div');
            pop.className = 'palette-pop';
            pop.innerHTML = PICO8.map(c =>
                `<button type="button" class="palette-cell" data-c="${c}" style="background-color:${c}" title="${c}"></button>`
            ).join('');
            pop.classList.add('hidden');
            swatch.addEventListener('click', (ev) => {
                ev.stopPropagation();
                document.querySelectorAll('.palette-pop').forEach(p => p !== pop && p.classList.add('hidden'));
                pop.classList.toggle('hidden');
            });
            pop.addEventListener('click', (ev) => {
                const cell = (ev.target as HTMLElement).closest('.palette-cell') as HTMLElement | null;
                if (!cell) return;
                apply(cell.dataset.c!);
                this.editor.commit();
                refresh();
                pop.classList.add('hidden');
            });
            wrap.append(swatch, pop);
            this.valueSyncers.push(refresh);
            return wrap;
        };

        const checkInput = (get: () => boolean, apply: (v: boolean) => void) => {
            const wrap = document.createElement('label');
            wrap.className = 'switch';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = get();
            input.addEventListener('change', () => {
                apply(input.checked);
                this.editor.commit();
            });
            const slider = document.createElement('span');
            slider.className = 'switch-slider';
            wrap.append(input, slider);
            this.valueSyncers.push(() => { if (document.activeElement !== input) input.checked = get(); });
            return wrap;
        };

        const textInput = (get: () => string, apply: (v: string) => void, multiline = false, placeholder = '') => {
            const input = document.createElement(multiline ? 'textarea' : 'input');
            if (!multiline) (input as HTMLInputElement).type = 'text';
            input.className = 'text-input';
            if (multiline) (input as HTMLTextAreaElement).rows = 3;
            input.placeholder = placeholder;
            input.value = get();
            input.addEventListener('input', () => { apply(input.value); this.editor.softCommit(); });
            input.addEventListener('change', () => this.editor.commitHistory());
            this.valueSyncers.push(() => { if (document.activeElement !== input) input.value = get(); });
            return input;
        };

        const dangerRow = (parent: HTMLElement) => {
            const row = document.createElement('div');
            row.className = 'ins-actions';
            const dup = document.createElement('button');
            dup.className = 'btn ghost';
            dup.innerHTML = `${icon('copy')}<span>${t('act.duplicate')}</span>`;
            dup.addEventListener('click', () => this.editor.duplicateSelection());
            const del = document.createElement('button');
            del.className = 'btn danger';
            del.innerHTML = `${icon('trash')}<span>${t('act.delete')}</span>`;
            del.addEventListener('click', () => this.editor.deleteSelection());
            row.append(dup, del);
            parent.appendChild(row);
        };

        if (!sel) {
            const c = card(t('ins.spell'));
            field(c, 'ins.spellName', textInput(() => spell.name, v => { spell.name = v; }, false, t('ins.spellName')));
            field(c, 'ins.author', textInput(() => spell.author, v => { spell.author = v; }));
            field(c, 'ins.description', textInput(() => spell.description, v => { spell.description = v; }, true));
            field(c, 'ins.background', checkInput(() => spell.background, v => { spell.background = v; }));
            field(c, 'ins.backgroundColor', palettePicker(() => spell.backgroundColor, v => { spell.backgroundColor = v; }));
            field(c, 'ins.defaultColor', palettePicker(() => spell.color, v => { spell.color = v; }));

            const hint = document.createElement('p');
            hint.className = 'ins-hint';
            hint.textContent = t('kbd.list');
            body.appendChild(hint);
            return;
        }

        const seal = findSeal(spell, sel.sealId);
        if (!seal) return;

        if (!sel.elId) {
            const c = card(t('ins.seal'));
            field(c, 'ins.x', numberInput(() => seal.x, v => { seal.x = v; }, 5));
            field(c, 'ins.y', numberInput(() => seal.y, v => { seal.y = v; }, 5));
            field(c, 'ins.rotation', numberInput(() => seal.rotation, v => { seal.rotation = wrap360(v); }, 5));
            field(c, 'ins.scale', numberInput(() => seal.scale, v => { seal.scale = v; }, 5, 10, 500));
            field(c, 'ins.visible', checkInput(() => seal.visible, v => { seal.visible = v; }));
            dangerRow(c);
            return;
        }

        const element = findElement(spell, sel.sealId, sel.elId);
        if (!element) return;

        const kindTitle = element.kind === 'ring' ? t('ins.ring')
            : element.kind === 'sigil' ? t('ins.sigil')
            : element.kind === 'sign' ? t('ins.sign')
            : t('ins.line');
        const c = card(kindTitle);

        const sym = element.kind === 'sigil' || element.kind === 'sign' ? getSymbol(element.symbol) : undefined;
        if (sym) {
            const symRow = document.createElement('div');
            symRow.className = 'symbol-preview';
            symRow.innerHTML = `<img src="${sym.url}" alt="" />`;
            c.querySelector('.ins-title')?.appendChild(symRow);
        }

        field(c, 'ins.visible', checkInput(() => element.visible, v => { element.visible = v; }));

        if (element.kind === 'ring') {
            field(c, 'ins.x', numberInput(() => element.x, v => { element.x = v; }, 5));
            field(c, 'ins.y', numberInput(() => element.y, v => { element.y = v; }, 5));
            field(c, 'ins.radius', numberInput(() => element.radius, v => { element.radius = Math.max(1, v); }, 5, 1));
            field(c, 'ins.weight', numberInput(() => element.weight, v => { element.weight = Math.max(0.5, v); }, 1, 0.5));
            field(c, 'ins.fill', checkInput(() => element.filled, v => { element.filled = v; }));
            field(c, 'ins.fillColor', palettePicker(() => element.fillColor, v => { element.fillColor = v; }));
            field(c, 'ins.opening', numberInput(() => element.opening, v => { element.opening = v; }, 5, 0, 360));
            field(c, 'ins.openingAngle', numberInput(() => element.openingAngle, v => { element.openingAngle = v; }, 5));
        } else if (element.kind === 'sigil') {
            field(c, 'ins.x', numberInput(() => element.x, v => { element.x = v; }, 5));
            field(c, 'ins.y', numberInput(() => element.y, v => { element.y = v; }, 5));
            field(c, 'ins.size', numberInput(() => element.size, v => { element.size = Math.max(10, v); }, 10, 10));
            field(c, 'ins.rotation', numberInput(() => element.rotation, v => { element.rotation = wrap360(v); }, 5));
        } else if (element.kind === 'sign') {
            field(c, 'ins.x', numberInput(() => element.x, v => { element.x = v; }, 5));
            field(c, 'ins.y', numberInput(() => element.y, v => { element.y = v; }, 5));
            field(c, 'ins.radius', numberInput(() => element.radius, v => { element.radius = Math.max(1, v); }, 5, 1));
            field(c, 'ins.amount', numberInput(() => element.amount, v => { element.amount = Math.round(v); }, 1, 1, 64));
            field(c, 'ins.size', numberInput(() => element.size, v => { element.size = Math.max(10, v); }, 5, 10));
            field(c, 'ins.rotation', numberInput(() => element.rotation, v => { element.rotation = v; }, 5));
            field(c, 'ins.spin', numberInput(() => element.spin, v => { element.spin = wrap360(v); }, 5));
            field(c, 'ins.strafe', numberInput(() => element.strafe, v => { element.strafe = v; }, 5));
        } else if (element.kind === 'line') {
            field(c, 'ins.weight', numberInput(() => element.weight, v => { element.weight = Math.max(0.5, v); }, 1, 0.5));
            field(c, 'ins.points', numberInput(() => element.points.length, () => { /* read-only */ }, 1, 0));
        }

        field(c, 'ins.color', palettePicker(() => (element as any).color, (v: string) => { (element as any).color = v; }));
        dangerRow(c);
    }

    // ------------------------------------------------------------- statusbar

    private statusbar = document.getElementById("statusbar")!;

    private buildStatusbar(): void {
        this.statusbar.innerHTML = `
            <span id="status-coords" class="status-item">${t("status.coords")} 0, 0</span>
            <span id="status-zoom" class="status-item">${t("status.zoom")} 100%</span>
            <span id="status-snap" class="status-item"></span>
            <span id="status-sel" class="status-item grow"></span>
            <span id="status-hint" class="status-item hint"></span>
        `;
    }

    // ------------------------------------------------------------- dynamic

    private valueSyncers: (() => void)[] = [];

    private updateDynamic(_state: EditorState, major: boolean): void {
        const e = this.editor;
        const state = e.state();

        // toggles
        this.topbar.querySelectorAll('[data-toggle]').forEach(b => {
            const id = (b as HTMLElement).dataset.toggle;
            const active = id === 'grid' ? state.grid : id === 'snap' ? state.snap : state.tool === 'line';
            b.classList.toggle('active', active);
        });

        // undo/redo disabled state
        this.topbar.querySelectorAll('[data-needs]').forEach(b => {
            (b as HTMLButtonElement).disabled = (b as HTMLElement).dataset.needs === 'undo' ? !state.canUndo : !state.canRedo;
        });

        // statusbar
        const coords = document.getElementById('status-coords');
        const zoom = document.getElementById('status-zoom');
        const snap = document.getElementById('status-snap');
        const sel = document.getElementById('status-sel');
        const hint = document.getElementById('status-hint');
        if (coords && zoom && snap && sel && hint) {
            const p = e.cursorWorld();
            coords.textContent = `${t('status.coords')} ${p ? `${Math.round(p.x - 500)}, ${Math.round(p.y - 500)}` : '–'}`;
            zoom.textContent = `${t('status.zoom')} ${Math.round(e.renderer.viewport.zoom * 100)}%`;
            snap.textContent = e.snap ? t('status.snapOn') : t('status.snapOff');
            snap.classList.toggle('on', e.snap);
            if (state.drawing) {
                sel.textContent = t('tool.line');
                hint.textContent = t('status.hintLine');
            } else if (e.selection) {
                const element = e.selection.elId ? findElement(e.spell, e.selection.sealId, e.selection.elId) : null;
                const label = element ? t(`layers.${element.kind}`) : t('layers.seal');
                sel.textContent = `${t('status.sel')}: ${label}`;
                hint.textContent = t('status.hintSelect');
            } else {
                sel.textContent = t('status.selNone');
                hint.textContent = t('status.hintSelect');
            }
        }

        if (major) {
            this.renderLayers();
            this.renderInspector();
        } else {
            // keep controls in sync without rebuilding (avoids losing focus/press)
            this.valueSyncers.forEach(fn => fn());
        }
    }

    // ------------------------------------------------------------- float info

    private floatInfo: HTMLElement | null = null;
    private floatHideTimer: number | null = null;

    private buildFloatInfo(): void {
        const el = document.createElement('div');
        el.className = 'float-info hidden';
        document.body.appendChild(el);
        this.floatInfo = el;
        document.addEventListener('click', () => {
            document.querySelectorAll('.palette-pop').forEach(p => p.classList.add('hidden'));
        });
    }

    private symbolInfoHTML(category: SymbolCategory, name: string, url: string): string {
        const catLabel = t(`lib.cat.${category}`);
        const desc = symbolDescription(name, getLangState()) ?? t(`desc.${category}`);
        return `
            <img class="float-info-img" src="${url}" alt="" />
            <div class="float-info-body">
                <div class="float-info-name">${name}</div>
                <div class="float-info-cat">${catLabel}</div>
                <div class="float-info-desc">${desc}</div>
            </div>`;
    }

    private attachFloatInfo(trigger: HTMLElement, getContent: () => string): void {
        trigger.addEventListener('mouseenter', () => {
            if (!this.floatInfo) return;
            if (this.floatHideTimer !== null) {
                clearTimeout(this.floatHideTimer);
                this.floatHideTimer = null;
            }
            this.floatInfo.innerHTML = getContent();
            this.floatInfo.classList.remove('hidden');
            requestAnimationFrame(() => this.floatInfo!.classList.add('show'));
            this.positionFloatInfo(trigger.getBoundingClientRect());
        });
        trigger.addEventListener('mouseleave', () => this.scheduleHideFloatInfo());
    }

    private positionFloatInfo(rect: DOMRect): void {
        const fi = this.floatInfo;
        if (!fi) return;
        const fw = fi.offsetWidth, fh = fi.offsetHeight;
        let x = rect.right + 10;
        let y = rect.top;
        if (x + fw > window.innerWidth - 8) x = rect.left - fw - 10;
        y = Math.min(Math.max(8, y), window.innerHeight - fh - 8);
        fi.style.left = x + 'px';
        fi.style.top = y + 'px';
    }

    private scheduleHideFloatInfo(): void {
        if (this.floatHideTimer !== null) clearTimeout(this.floatHideTimer);
        this.floatHideTimer = window.setTimeout(() => {
            this.floatInfo?.classList.remove('show');
            this.floatInfo?.classList.add('hidden');
            this.floatHideTimer = null;
        }, 120);
    }

}

function holdable(btn: HTMLElement, fn: () => void): void {
    let delay: number | null = null;
    let repeat: number | null = null;
    const stop = () => {
        if (delay !== null) { clearTimeout(delay); delay = null; }
        if (repeat !== null) { clearInterval(repeat); repeat = null; }
    };
    btn.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        fn();
        delay = window.setTimeout(() => {
            repeat = window.setInterval(fn, 70);
        }, 420);
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(evt =>
            btn.addEventListener(evt, stop, { once: true }));
    });
}

function elementLabel(element: SpellElement): string {
    if (element.kind === "sigil" || element.kind === "sign") {
        const sym = getSymbol(element.symbol);
        return sym?.name ?? t(`layers.${element.kind}`);
    }
    return t(`layers.${element.kind}`);
}

function toHex6(color: string): string {
    if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
    if (/^#[0-9a-fA-F]{3}$/.test(color)) {
        return "#" + color.slice(1).split("").map(c => c + c).join("");
    }
    return "#000000";
}

export function toast(message: string, kind: "info" | "error" = "info"): void {
    const container = document.getElementById("toasts")!;
    const el = document.createElement("div");
    el.className = `toast ${kind}`;
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.remove(), 400);
    }, 2600);
}
