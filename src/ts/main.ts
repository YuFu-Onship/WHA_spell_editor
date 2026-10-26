import { initLang } from "./i18n";
import { initTheme } from "./theme";
import { Editor } from "./editor";
import { UI } from "./ui";
import { backend } from "./backend";
import { loadDescriptions } from "./descriptions";
import { loadAutosave, readSpellFromURL } from "./io";

async function boot(): Promise<void> {
    initLang();
    initTheme();

    const viewportEl = document.getElementById("viewport")!;

    await loadDescriptions();

    let initialSpell = await backend.newSpell();
    const fromURL = await readSpellFromURL();
    if (fromURL) {
        initialSpell = fromURL;
    } else {
        const saved = await loadAutosave();
        if (saved) initialSpell = saved;
    }

    const editor = new Editor(viewportEl, initialSpell);
    new UI(editor);

    // redraw on resize keeps crisp grid lines
    window.addEventListener("resize", () => editor.refresh());
}

boot().catch((err: unknown) => {
    const viewport = document.getElementById("viewport");
    if (viewport) {
        viewport.textContent = `Go backend is unavailable: ${String(err)}`;
    }
    console.error(err);
});
