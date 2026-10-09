export type Lang = "zh-CN" | "en" | "ja";

type Dict = Record<string, string>;

const zh: Dict = {
    "app.title": "WHA 法术编辑器",
    "app.subtitle": "魔女之旅帽 · 法术印章",

    "menu.file": "文件",
    "menu.edit": "编辑",
    "menu.view": "视图",
    "menu.tool": "工具",

    "act.new": "新建",
    "act.open": "打开",
    "act.save": "保存",
    "act.exportPng": "导出",
    "exp.size": "导出尺寸",
    "exp.width": "宽",
    "exp.height": "高",
    "act.share": "分享链接",
    "act.undo": "撤销",
    "act.redo": "重做",
    "act.addSeal": "添加印章",
    "act.addRing": "圆环",
    "act.addLine": "画线",
    "act.delete": "删除",
    "act.duplicate": "复制",
    "act.zoomIn": "放大",
    "act.zoomOut": "缩小",
    "act.zoomFit": "适应窗口",
    "act.close": "关闭",

    "toggle.grid": "网格",
    "toggle.snap": "吸附",
    "toggle.theme": "明暗",
    "toggle.lang": "语言",

    "tool.select": "选择",
    "tool.line": "画线",

    "lib.title": "符号库",
    "lib.cat.sigil": "印记",
    "lib.cat.sign": "符文",
    "lib.cat.forbidden": "禁忌",
    "lib.cat.shape": "形状",
    "lib.cat.toh": "猫头鹰之屋",
    "lib.search": "搜索符号…",
    "lib.hintRightClick": "左键添加印记 · 右键添加符文阵",
    "lib.group": "组管理",
    "lib.groupOn": "组模式：符号绕圆心排布，统一管理",
    "ins.spin": "符号旋转",
    "desc.sigil": "印记 · 法阵核心，绘制于印章中心或任意位置",
    "desc.sign": "符文阵 · 沿圆周等分重复排列的符文",
    "desc.forbidden": "禁忌符号 · 被禁止使用的魔法印记",
    "desc.shape": "形状 · 基础几何形状印记",
    "desc.toh": "猫头鹰之屋 · 动画风格符号",
    "lib.empty": "没有匹配的符号",

    "layers.title": "图层",
    "layers.empty": "暂无元素，从符号库添加",
    "layers.seal": "印章",
    "layers.ring": "圆环",
    "layers.sigil": "印记",
    "layers.sign": "符文",
    "layers.line": "线条",

    "ins.title": "属性",
    "ins.none": "未选中对象",
    "ins.noneHint": "点击画布或图层中的元素开始编辑",
    "ins.spell": "法术",
    "ins.seal": "印章",
    "ins.ring": "圆环",
    "ins.sigil": "印记",
    "ins.sign": "符文阵",
    "ins.line": "线条",
    "ins.spellName": "名称",
    "ins.author": "作者",
    "ins.description": "描述",
    "ins.background": "背景",
    "ins.backgroundColor": "背景色",
    "ins.defaultColor": "默认笔色",
    "ins.visible": "可见",
    "ins.x": "X 位置",
    "ins.y": "Y 位置",
    "ins.rotation": "旋转",
    "ins.scale": "缩放",
    "ins.radius": "半径",
    "ins.size": "大小",
    "ins.amount": "数量",
    "ins.strafe": "侧移",
    "ins.weight": "线宽",
    "ins.color": "颜色",
    "ins.fill": "填充",
    "ins.fillColor": "填充色",
    "ins.opening": "缺口大小",
    "ins.openingAngle": "缺口角度",
    "ins.symbol": "符号",
    "ins.points": "顶点数",

    "status.coords": "坐标",
    "status.zoom": "缩放",
    "status.snapOn": "吸附开",
    "status.snapOff": "吸附关",
    "status.sel": "已选中",
    "status.selNone": "无选中",
    "status.hintLine": "单击放置顶点，回车 / 双击结束，Esc 取消",
    "status.hintSelect": "拖动移动 · Shift 限制水平/垂直 · 把手旋转缩放",

    "toast.saved": "已保存到浏览器",
    "toast.exported": "已导出图片",
    "toast.linkCopied": "分享链接已复制",
    "toast.loaded": "已载入法术",
    "toast.badFile": "无法读取该文件",
    "toast.cleared": "已新建空白法术",
    "toast.deleted": "已删除",

    "dialog.confirmDelete": "删除选中的元素？",

    "kbd.title": "快捷键",
    "kbd.list": "Del 删除 · Ctrl+Z 撤销 · Ctrl+Y 重做 · Ctrl+D 复制 · 方向键微移 · G 网格 · S 吸附 · F 适应窗口"
};

const en: Dict = {
    "app.title": "WHA Spell Editor",
    "app.subtitle": "Witch Hat Atelier · Spell Seals",

    "menu.file": "File",
    "menu.edit": "Edit",
    "menu.view": "View",
    "menu.tool": "Tool",

    "act.new": "New",
    "act.open": "Open",
    "act.save": "Save",
    "act.exportPng": "Export",
    "exp.size": "Export size",
    "exp.width": "Width",
    "exp.height": "Height",
    "act.share": "Share link",
    "act.undo": "Undo",
    "act.redo": "Redo",
    "act.addSeal": "Add seal",
    "act.addRing": "Ring",
    "act.addLine": "Line",
    "act.delete": "Delete",
    "act.duplicate": "Duplicate",
    "act.zoomIn": "Zoom in",
    "act.zoomOut": "Zoom out",
    "act.zoomFit": "Fit view",
    "act.close": "Close",

    "toggle.grid": "Grid",
    "toggle.snap": "Snap",
    "toggle.theme": "Theme",
    "toggle.lang": "Language",

    "tool.select": "Select",
    "tool.line": "Line",

    "lib.title": "Symbols",
    "lib.cat.sigil": "Sigils",
    "lib.cat.sign": "Signs",
    "lib.cat.forbidden": "Forbidden",
    "lib.cat.shape": "Shapes",
    "lib.cat.toh": "The Owl House",
    "lib.search": "Search symbols…",
    "lib.hintRightClick": "Left-click adds a sigil · right-click adds a sign ring",
    "lib.group": "Group mode",
    "lib.groupOn": "Group mode: symbols arranged around a center, managed as one",
    "ins.spin": "Symbol spin",
    "desc.sigil": "Sigil · the core of the seal, drawn at its center",
    "desc.sign": "Sign ring · repeats radially around a circle",
    "desc.forbidden": "Forbidden · forbidden magic glyph",
    "desc.shape": "Shape · basic geometric glyph",
    "desc.toh": "The Owl House · anime-style glyph",
    "lib.empty": "No matching symbols",

    "layers.title": "Layers",
    "layers.empty": "No elements yet, add from the library",
    "layers.seal": "Seal",
    "layers.ring": "Ring",
    "layers.sigil": "Sigil",
    "layers.sign": "Sign",
    "layers.line": "Line",

    "ins.title": "Properties",
    "ins.none": "Nothing selected",
    "ins.noneHint": "Click an element on the canvas or in the layers list",
    "ins.spell": "Spell",
    "ins.seal": "Seal",
    "ins.ring": "Ring",
    "ins.sigil": "Sigil",
    "ins.sign": "Sign ring",
    "ins.line": "Line",
    "ins.spellName": "Name",
    "ins.author": "Author",
    "ins.description": "Description",
    "ins.background": "Background",
    "ins.backgroundColor": "Background color",
    "ins.defaultColor": "Default ink",
    "ins.visible": "Visible",
    "ins.x": "X position",
    "ins.y": "Y position",
    "ins.rotation": "Rotation",
    "ins.scale": "Scale",
    "ins.radius": "Radius",
    "ins.size": "Size",
    "ins.amount": "Count",
    "ins.strafe": "Strafe",
    "ins.weight": "Stroke",
    "ins.color": "Color",
    "ins.fill": "Filled",
    "ins.fillColor": "Fill color",
    "ins.opening": "Opening",
    "ins.openingAngle": "Opening angle",
    "ins.symbol": "Symbol",
    "ins.points": "Vertices",

    "status.coords": "Cursor",
    "status.zoom": "Zoom",
    "status.snapOn": "Snap on",
    "status.snapOff": "Snap off",
    "status.sel": "Selected",
    "status.selNone": "No selection",
    "status.hintLine": "Click to place vertices, Enter / double-click to finish, Esc to cancel",
    "status.hintSelect": "Drag to move · Shift constrains axis · handles rotate & scale",

    "toast.saved": "Saved to browser",
    "toast.exported": "Image exported",
    "toast.linkCopied": "Share link copied",
    "toast.loaded": "Spell loaded",
    "toast.badFile": "Could not read this file",
    "toast.cleared": "Started a new spell",
    "toast.deleted": "Deleted",

    "dialog.confirmDelete": "Delete the selected element?",

    "kbd.title": "Shortcuts",
    "kbd.list": "Del delete · Ctrl+Z undo · Ctrl+Y redo · Ctrl+D duplicate · arrows nudge · G grid · S snap · F fit"
};

const ja: Dict = {
    "app.title": "WHA 魔法編集器",
    "app.subtitle": "魔女の旅帽子 · 魔法印章",

    "menu.file": "ファイル",
    "menu.edit": "編集",
    "menu.view": "表示",
    "menu.tool": "ツール",

    "act.new": "新規",
    "act.open": "開く",
    "act.save": "保存",
    "act.exportPng": "書き出し",
    "exp.size": "書き出しサイズ",
    "exp.width": "幅",
    "exp.height": "高さ",
    "act.share": "共有リンク",
    "act.undo": "元に戻す",
    "act.redo": "やり直す",
    "act.addSeal": "印章を追加",
    "act.addRing": "円環",
    "act.addLine": "線",
    "act.delete": "削除",
    "act.duplicate": "複製",
    "act.zoomIn": "拡大",
    "act.zoomOut": "縮小",
    "act.zoomFit": "画面に合わせる",
    "act.close": "閉じる",

    "toggle.grid": "グリッド",
    "toggle.snap": "スナップ",
    "toggle.theme": "テーマ",
    "toggle.lang": "言語",

    "tool.select": "選択",
    "tool.line": "線",

    "lib.title": "シンボル",
    "lib.cat.sigil": "印",
    "lib.cat.sign": "紋",
    "lib.cat.forbidden": "禁じられた魔法",
    "lib.cat.shape": "図形",
    "lib.cat.toh": "フクロウの家",
    "lib.search": "シンボルを検索…",
    "lib.hintRightClick": "左クリックで印 · 右クリックで紋リングを追加",
    "lib.group": "グループ管理",
    "lib.groupOn": "グループモード：シンボルを円周上に配置し一括管理",
    "ins.spin": "シンボル回転",
    "desc.sigil": "印 · 法陣の中心に描かれる核",
    "desc.sign": "紋リング · 円周に沿って等間隔に繰り返す紋",
    "desc.forbidden": "禁じられた魔法 · 禁止された魔法の印",
    "desc.shape": "図形 · 基本的な幾何学印",
    "desc.toh": "フクロウの家 · アニメ風シンボル",
    "lib.empty": "一致するシンボルがありません",

    "layers.title": "レイヤー",
    "layers.empty": "要素がありません。ライブラリから追加してください",
    "layers.seal": "印章",
    "layers.ring": "円環",
    "layers.sigil": "印",
    "layers.sign": "紋",
    "layers.line": "線",

    "ins.title": "プロパティ",
    "ins.none": "選択なし",
    "ins.noneHint": "キャンバスまたはレイヤーから要素を選択してください",
    "ins.spell": "魔法",
    "ins.seal": "印章",
    "ins.ring": "円環",
    "ins.sigil": "印",
    "ins.sign": "紋リング",
    "ins.line": "線",
    "ins.spellName": "名前",
    "ins.author": "作者",
    "ins.description": "説明",
    "ins.background": "背景",
    "ins.backgroundColor": "背景色",
    "ins.defaultColor": "基本色",
    "ins.visible": "表示",
    "ins.x": "X 位置",
    "ins.y": "Y 位置",
    "ins.rotation": "回転",
    "ins.scale": "拡大率",
    "ins.radius": "半径",
    "ins.size": "サイズ",
    "ins.amount": "数",
    "ins.strafe": "横ずらし",
    "ins.weight": "線幅",
    "ins.color": "色",
    "ins.fill": "塗りつぶし",
    "ins.fillColor": "塗り色",
    "ins.opening": "開口幅",
    "ins.openingAngle": "開口角",
    "ins.symbol": "シンボル",
    "ins.points": "頂点数",

    "status.coords": "カーソル",
    "status.zoom": "ズーム",
    "status.snapOn": "スナップ On",
    "status.snapOff": "スナップ Off",
    "status.sel": "選択中",
    "status.selNone": "選択なし",
    "status.hintLine": "クリックで頂点を追加、Enter / ダブルクリックで確定、Esc で取消",
    "status.hintSelect": "ドラッグで移動 · Shift で軸固定 · ハンドルで回転・拡大",

    "toast.saved": "ブラウザに保存しました",
    "toast.exported": "画像を書き出しました",
    "toast.linkCopied": "共有リンクをコピーしました",
    "toast.loaded": "魔法を読み込みました",
    "toast.badFile": "このファイルを読み込めません",
    "toast.cleared": "新しい魔法を作成しました",
    "toast.deleted": "削除しました",

    "dialog.confirmDelete": "選択した要素を削除しますか？",

    "kbd.title": "ショートカット",
    "kbd.list": "Del 削除 · Ctrl+Z 元に戻す · Ctrl+Y やり直す · Ctrl+D 複製 · 矢印キー 微調整 · G グリッド · S スナップ · F 画面に合わせる"
};

export const langs: { id: Lang; label: string }[] = [
    { id: "zh-CN", label: "中文" },
    { id: "en", label: "English" },
    { id: "ja", label: "日本語" }
];

const dicts: Record<Lang, Dict> = { "zh-CN": zh, en, ja };

let current: Lang = "zh-CN";
const listeners = new Set<() => void>();

export function getLang(): Lang {
    return current;
}

export function setLang(lang: Lang): void {
    if (!dicts[lang] || lang === current) return;
    current = lang;
    try { localStorage.setItem("wha.lang", lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
    document.title = t("app.title");
    listeners.forEach(l => l());
}

export function t(key: string): string {
    return dicts[current][key] ?? dicts.en[key] ?? key;
}

export function onLangChange(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function initLang(): void {
    let saved: string | null = null;
    try { saved = localStorage.getItem("wha.lang"); } catch { /* ignore */ }
    if (saved && saved in dicts) {
        current = saved as Lang;
    } else {
        const nav = navigator.language;
        current = nav.startsWith("zh") ? "zh-CN" : nav.startsWith("ja") ? "ja" : "en";
    }
    document.documentElement.lang = current;
    document.title = t("app.title");
}
