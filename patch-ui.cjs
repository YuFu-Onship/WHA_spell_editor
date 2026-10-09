const fs = require('fs');

// i18n: rename export label
let i = fs.readFileSync('src/i18n.ts', 'utf8');
i = i.replace('"act.exportPng": "导出 PNG",', '"act.exportPng": "导出",');
i = i.replace('"act.exportPng": "Export PNG",', '"act.exportPng": "Export",');
i = i.replace('"act.exportPng": "PNG 書き出し",', '"act.exportPng": "書き出し",');
fs.writeFileSync('src/i18n.ts', i);

let u = fs.readFileSync('src/ui.ts', 'utf8');
const tStart = u.indexOf('        this.topbar.innerHTML = `');
const tEnd = u.indexOf('`;', tStart);
if (tStart < 0 || tEnd < 0) throw new Error('topbar markers');

const markup = `        this.topbar.innerHTML = \`
            <div class="topbar-left">
                \${btn("new", "new", "act.new")}
                \${btn("open", "open", "act.open")}
                \${btn("save", "save", "act.save")}
                \${btn("exportPng", "image", "act.exportPng")}
            </div>
            <nav class="toolbar">
                <button class="tb-btn tb-icon" data-action="undo" title="\${t("act.undo")}" data-needs="undo">\${icon("undo")}</button>
                <button class="tb-btn tb-icon" data-action="redo" title="\${t("act.redo")}" data-needs="redo">\${icon("redo")}</button>
                <span class="tb-sep"></span>
                \${btn("addSeal", "seal", "act.addSeal")}
                \${btn("addRing", "ring", "act.addRing")}
                <button class="tb-btn tb-toggle" data-action="tool-line" data-toggle="tool-line" title="\${t("tool.line")}">\${icon("line")}<span>\${t("tool.line")}</span></button>
                <span class="tb-sep"></span>
                \${toggle("grid", "grid", "toggle.grid")}
                \${toggle("snap", "magnet", "toggle.snap")}
                <span class="tb-sep"></span>
                <button class="tb-btn tb-icon" data-action="zoomOut" title="\${t("act.zoomOut")}">\${icon("zoomOut")}</button>
                <button class="tb-btn tb-icon" data-action="zoomIn" title="\${t("act.zoomIn")}">\${icon("zoomIn")}</button>
                <button class="tb-btn tb-icon" data-action="zoomFit" title="\${t("act.zoomFit")}">\${icon("fit")}</button>
            </nav>
            <div class="topbar-right">
                <div class="lang-select">
                    <select id="lang-select" title="\${t("toggle.lang")}" aria-label="\${t("toggle.lang")}">
                        \${langs.map(l => `<option value="\${l.id}" \${l.id === getLang() ? "selected" : ""}>\${l.label}</option>`).join("")}
                    </select>
                </div>
                <button class="tb-btn tb-icon theme-btn" data-action="theme" title="\${t("toggle.theme")}"></button>
            </div>
        \`;
`;
u = u.slice(0, tStart) + markup + u.slice(tEnd + 2);

// remove share action case
const shareStart = u.indexOf('            case "share": {');
const shareEnd = u.indexOf('            case "undo":');
if (shareStart < 0 || shareEnd < 0) throw new Error('share markers');
u = u.slice(0, shareStart) + u.slice(shareEnd);

u = u.replace('import { downloadJSON, readJSONFile, renderPNGDataURL, makeShareURL, triggerDownload } from "./io";',
    'import { downloadJSON, readJSONFile, renderPNGDataURL, triggerDownload } from "./io";');

fs.writeFileSync('src/ui.ts', u);
console.log('ui ok');
