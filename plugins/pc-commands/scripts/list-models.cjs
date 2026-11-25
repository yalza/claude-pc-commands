const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const directory = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const models = new Set();
for (const file of ["models_cache.codex_work_desktop.json", "models_cache.json"]) {
  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(path.join(directory, file), "utf8"));
  } catch {
    continue;
  }
  if (!Array.isArray(catalog?.models)) continue;
  for (const model of catalog.models) {
    if (model?.visibility === "list" && typeof model.slug === "string" &&
        /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(model.slug)) {
      models.add(model.slug);
    }
  }
}
console.log(JSON.stringify([...models]));
