import fs   from "node:fs/promises";
import path from "node:path";

import strip from "strip-json-comments";

export default async function loadConfig(file) {
    const base = path.dirname(file);
    let contents, obj;

    contents = await fs.readFile(file, { encoding : "utf8" });

    // try reading config file as JSON first, fall back to JS
    try {
        contents = strip(contents);
        obj      = JSON.parse(contents);
    } catch (e) {
        obj = await import(new URL(`file://${file}`)).then((module) => module.default);
    }

    if (obj.dirs) {
        obj.dirs = obj.dirs.map(function(dir) {
            return path.resolve(base, dir);
        });
    }

    return obj;
}
