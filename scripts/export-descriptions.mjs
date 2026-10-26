// One-off migration helper: exports the TypeScript symbol dictionary into
// src/go/internal/descriptions/data.json so the Go backend can own it.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { symbolDescription } = require("../.tmp/descriptions.cjs");

const symbolsRoot = path.resolve("src/ts/assets/symbols");
const out = {};
const langs = [
    ["zh", "zh-CN"],
    ["en", "en"],
    ["ja", "ja"],
];

for (const category of fs.readdirSync(symbolsRoot, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const file of fs.readdirSync(path.join(symbolsRoot, category.name))) {
        if (!file.toLowerCase().endsWith(".png")) continue;
        const name = file.replace(/\.png$/i, "");
        if (out[name]) continue;
        const entry = {};
        for (const [key, lang] of langs) {
            const description = symbolDescription(name, lang);
            if (description) entry[key] = description;
        }
        if (Object.keys(entry).length > 0) out[name] = entry;
    }
}

const dest = path.resolve("src/go/internal/descriptions/data.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`wrote ${Object.keys(out).length} descriptions to ${dest}`);
