# pc-tools — marketplace for the `/pc` + `/pcq` + `/pcset` commands

A Claude Code marketplace hosting the **`pc-commands`** plugin: slash commands that let Claude team up with **Codex** (OpenAI). Claude plans, orchestrates, and verifies; Codex does the heavy code work (on your OpenAI quota).

- **`/pc <task>`** — full flow: plan → Codex cross-reviews the plan → approve → Codex executes → Claude verifies + fills in whatever Codex can't do. For larger / riskier tasks.
- **`/pcq <task>`** — quick flow: short plan → fast approval → hand to Codex (no cross-review) → minimal verify. For light tasks.
- **`/pcset [model] [effort]`** — set the model + reasoning effort that `/pc` and `/pcq` hand to Codex. Persists across sessions.

The marketplace also lists **`task-grid`**: `/grid 2x3` opens parallel tasks in one Windows Terminal window, split as a grid of any size, each in its own git worktree running `claude`. See [task-grid](#task-grid) below.

## Layout
```
.claude-plugin/marketplace.json              ← marketplace manifest
plugins/pc-commands/
├── .claude-plugin/plugin.json               ← plugin manifest
└── commands/{pc.md, pcq.md, pcset.md}       ← the slash commands
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

## Codex model + effort (`/pcset`)

`/pc` and `/pcq` read `~/.claude/pc-codex.json` before every Codex handoff and forward `--model` / `--effort` to `codex:codex-rescue`. Missing file or missing field → that flag is skipped and Codex falls back to its own default.

```bash
/pcset                      # interactive menu: pick model, then effort
/pcset show                 # print current config
/pcset gpt-5.4-mini high    # set both, no menu
/pcset low                  # set effort only; model is kept
/pcset spark                # alias → gpt-5.3-codex-spark
/pcset reset                # back to Codex defaults
```

Config shape (`~/.claude/pc-codex.json`, on Windows `%USERPROFILE%\.claude\pc-codex.json`):
```json
{ "model": "gpt-5.4-mini", "effort": "high" }
```

- **`effort`** must be one of `none` `minimal` `low` `medium` `high` `xhigh` — `/pcset` rejects anything else. Note that `ultra`, valid in `~/.codex/config.toml`, is **not** a valid `--effort` value.
- **`model`** is *not* validated: any string is accepted and a typo only surfaces when Codex actually runs.
- The menu offers `gpt-5.6-sol`, `gpt-5.4-mini`, `spark` and "Codex default"; pick **Other** to type any other model.

## Updating later
Current version: **0.3.2**.

Edit a command → bump `version` in **all three fields** → `git push`. On other machines run `/plugin marketplace update pc-tools` (then `/reload-plugins`) to pull the new version.

The three `version` fields to keep in sync:
- `.claude-plugin/marketplace.json` → `metadata.version`
- `.claude-plugin/marketplace.json` → `plugins[0].version`
- `plugins/pc-commands/.claude-plugin/plugin.json` → `version`

## task-grid

Source: [yalza/TaskGrid](https://github.com/yalza/TaskGrid). **Windows only** (needs Windows Terminal, `wt.exe`).

Run several tasks in parallel without them overwriting each other's files: each task gets its own git worktree + branch, and all of them open in **one** Windows Terminal window, split as a grid, each pane already running `claude`.

### Install
```
/plugin marketplace add yalza/claude-pc-commands    # skip if pc-tools is already added
/plugin marketplace update pc-tools
/plugin install task-grid@pc-tools
/reload-plugins
```

### Use
Open Claude Code in the repo you work on, then:
```
/grid 2x3
```
That opens a new, maximized window split into 2 rows × 3 columns: 6 panes `t1`…`t6`, each in its own worktree and branch, each running `claude`. (`/grid` is the short name; if another plugin also has a `grid` skill, use `/task-grid:grid`.)

| Command | Result |
| --- | --- |
| `/grid 2x3` | 2 rows × 3 columns, panes `t1`…`t6` |
| `/grid 4` | 4 panes `t1`…`t4`, laid out 2×2 automatically |
| `/grid 2x3 guard-ai fence-ui` | 2×3 grid: panes 1–2 are `guard-ai`, `fence-ui`; panes 3–6 are `t1`…`t4` |
| `/grid guard-ai fence-ui fix/noise .` | 4 tasks, auto 2×2; the last pane is the main checkout |

| Argument | Meaning |
| --- | --- |
| `RxC` | grid size, **rows × columns** (`2x3` = 2 rows, 3 columns). Unnamed panes get `t1`, `t2`, … |
| `N` | pane count; the grid is picked for you (3 → 2×2 with one empty slot, 5 or 6 → 2×3, 9 → 3×3) |
| `<task>` | worktree `<repo>-worktrees\<task>` on branch `feat/<task>` |
| `fix/noise` | a name with `/` is used as-is as the branch name (folder `fix-noise`) |
| `.` | a pane in the main checkout (no worktree) |
| `-Base <ref>` | where new branches start (default `origin/main`, fetched first) |
| `-Command "<cmd>"` | what each pane runs (default `claude`), e.g. `-Command "claude --continue"` |
| `-Repo <path>` | target repo (default: current directory) |

Panes fill in reading order: left to right, then top to bottom. `<repo>-worktrees` is a folder next to your repo, e.g. `E:\Work\MyGame-worktrees\` for `E:\Work\MyGame`.

- **Resume:** run the same command again (same names, including `t1`, `t2`, …) → existing worktrees/branches are reused, nothing is recreated.
- **Safe branches:** new branches are created `--no-track`, so `git pull`/`git push` in a pane never touches `main`.
- **Clean up** a merged task (close its pane first, Windows locks the folder):
  ```
  git worktree remove <repo>-worktrees\<task>
  git branch -d <branch>
  ```
- **Unity projects:** a worktree has no `Library/` and no Editor open on it. Verify code there with tests that run outside Unity; to check in the Editor, check the branch out in the main checkout. Don't let a worktree session drive Unity MCP — it would act on the main checkout's Editor.

### Team mode (`/grid team`, 1.2.0+)
Open a whole team of role-based Claude sessions, one pane each, with its own model, effort and rules. You talk to the PM in the first pane. The PM plans, assigns tasks, and stops twice for your approval (the plan, and before any push or merge). Members message each other and share a task board in `<repo>-worktrees\_team\`, outside git.

| Command | Does |
| --- | --- |
| `/grid team init -Preset unity-game` | Creates `.claude/team.json`, `.claude/team-rules.md` and missing role files. Presets: `basic` (pm, dev, reviewer), `unity-game` (pm, designer, 2 devs, artist, Unity integrator, reviewer, qa) |
| `/grid team` | Opens the whole team |
| `/grid team pm gameplay reviewer` | Opens only these members (the PM always opens; members already running are skipped) |
| `/grid team -Resume` | Reopens each member's previous session |
| `/grid team -DryRun` | Generates the team files and prints the plan, without opening anything |

- Edit `.claude/team.json` to change members, models and effort, and commit it with `.claude/agents/` and `.claude/team-rules.md`.
- The first launch asks "trust this folder" once per new member worktree. A session cannot receive messages until you accept.
- A member that works in the main checkout (the Unity integrator) needs a clean main checkout. Don't work there while the team runs, and turn off editor tools that touch git (for example an auto-sync).
- Full design and verification: `docs/specs/` in [yalza/TaskGrid](https://github.com/yalza/TaskGrid).

### Without Claude Code
Clone [yalza/TaskGrid](https://github.com/yalza/TaskGrid), add the folder to your user `PATH`, then from any repo (`grid team ...` works the same way):
```
grid 2x3
```

## Notes
- **Unity (optional):** the Unity/verify steps use UnityMCP; on non-Unity projects those parts are simply skipped.
- In both `/pc` and `/pcq`, failed execution gets up to **5 Codex retries after the initial attempt** (6 attempts total per failed work item). Each retry includes the latest error and prior approaches, preserves completed work, and stops on success. Verification failures use the same remaining retry budget. Claude takes over only the work still failing after all 5 retries.
- Both commands use structured handoffs (scope, workspace, acceptance criteria), per-item results with verification evidence, and a Claude-maintained task record at `~/.claude/pc-handoffs/<task_id>.json`. Retry counts survive session changes and switching from `/pcq` to `/pc`.
- Only one executor may write at a time. A timeout requires confirming the previous run has stopped before retry or fallback. Codex checks its own Unity connection and project before editing; denied or unavailable tools are reported explicitly. Unresolved work falls back to Claude only after all 5 retries; permissions are never bypassed.
- `/pcq` still keeps **one quick approval gate** before Codex touches any file.
- Heavy Unity MCP reads (large `get_hierarchy`, component dumps, long console) should be delegated to a subagent that returns a summary, to avoid bloating Claude's context.
- A public repo means the command contents are world-readable (nothing sensitive here).
