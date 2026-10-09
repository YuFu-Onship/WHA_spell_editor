import { initLang } from "./i18n";
import { initTheme } from "./theme";
import { Editor } from "./editor";
import { UI } from "./ui";
import { defaultSpell } from "./model";
import { loadAutosave, readSpellFromURL } from "./io";

async function boot(): Promise<void> {
    initLang();
    initTheme();

    const viewportEl = document.getElementById("viewport")!;

    let initialSpell = defaultSpell();
    const fromURL = await readSpellFromURL();
    if (fromURL) {
        initialSpell = fromURL;
    } else {
        const saved = loadAutosave();
        if (saved) initialSpell = saved;
    }

    const editor = new Editor(viewportEl, initialSpell);
    new UI(editor);

    // redraw on resize keeps crisp grid lines
    window.addEventListener("resize", () => editor.refresh());
}

boot();
