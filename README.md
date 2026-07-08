# pc-tools — marketplace for the `/pc` + `/pcq` commands

A Claude Code marketplace hosting the **`pc-commands`** plugin: two slash commands that let Claude team up with **Codex** (OpenAI). Claude plans, orchestrates, and verifies; Codex does the heavy code work (on your OpenAI quota).

- **`/pc <task>`** — full flow: plan → Codex cross-reviews the plan → approve → Codex executes → Claude verifies + fills in whatever Codex can't do. For larger / riskier tasks.
- **`/pcq <task>`** — quick flow: short plan → fast approval → hand to Codex (no cross-review) → minimal verify. For light tasks.

## Layout
```
.claude-plugin/marketplace.json         ← marketplace manifest
plugins/pc-commands/
├── .claude-plugin/plugin.json          ← plugin manifest
└── commands/{pc.md, pcq.md}            ← the two slash commands
```

---

## Step 1 — Publish the marketplace (one-time)

Push this folder to a GitHub repo (replace `yalza/claude-pc-commands` with your own):

```bash
cd claude-pc-commands
git init
git add .
git commit -m "pc-tools marketplace: /pc + /pcq"
git branch -M main
git remote add origin https://github.com/yalza/claude-pc-commands.git
git push -u origin main
```

> If you change the owner/repo, also update `owner.name` in `.claude-plugin/marketplace.json` and `plugins/pc-commands/.claude-plugin/plugin.json` to match.

## Step 2 — Install on any machine

In Claude Code:
```
/plugin marketplace add yalza/claude-pc-commands
/plugin install pc-commands@pc-tools
/reload-plugins
```
Type `/pc` or `/pcq` to confirm they loaded.

## Step 3 — Dependencies (REQUIRED — not pulled in automatically)

Both commands call out to Codex, so that machine needs:
```bash
# Node.js must be installed, then:
npm install -g @openai/codex
codex login
```
And the **Codex plugin** (provides the `codex:codex-rescue` subagent):
```
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/reload-plugins
```

---

## Updating later
Current version: **0.2.0**.

Edit a command → bump `version` in **all three fields** → `git push`. On other machines run `/plugin marketplace update pc-tools` (then `/reload-plugins`) to pull the new version.

The three `version` fields to keep in sync:
- `.claude-plugin/marketplace.json` → `metadata.version`
- `.claude-plugin/marketplace.json` → `plugins[0].version`
- `plugins/pc-commands/.claude-plugin/plugin.json` → `version`

## Notes
- **Unity (optional):** the Unity/verify steps use UnityMCP; on non-Unity projects those parts are simply skipped.
- Codex **cannot mutate Unity** through the companion (its MCP tool calls are auto-rejected in headless mode), so Unity work **falls back to Claude** by design (safe).
- `/pcq` still keeps **one quick approval gate** before Codex touches any file.
- Heavy Unity MCP reads (large `get_hierarchy`, component dumps, long console) should be delegated to a subagent that returns a summary, to avoid bloating Claude's context.
- A public repo means the command contents are world-readable (nothing sensitive here).
