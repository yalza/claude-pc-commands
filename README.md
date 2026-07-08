# pc-tools — marketplace cho lệnh `/pc` + `/pcq`

Marketplace Claude Code chứa plugin **`pc-commands`** với 2 slash command giúp Claude phối hợp với **Codex** (OpenAI): Claude lên plan + điều phối + verify, Codex làm phần code nặng.

- **`/pc <task>`** — đầy đủ: plan → Codex review chéo → duyệt → Codex thực thi → Claude verify + làm bù khi Codex fail. Cho task lớn/rủi ro.
- **`/pcq <task>`** — rút gọn: plan ngắn → duyệt nhanh → giao Codex (bỏ review chéo) → verify tối thiểu. Cho task nhẹ.

## Cấu trúc
```
.claude-plugin/marketplace.json         ← manifest marketplace
plugins/pc-commands/
├── .claude-plugin/plugin.json          ← manifest plugin
└── commands/{pc.md, pcq.md}            ← 2 slash command
```

---

## Bước 1 — Publish marketplace (làm 1 lần)

Đưa thư mục này lên một GitHub repo (đổi `yalza/claude-pc-commands` thành repo của bạn):

```bash
cd claude-pc-commands
git init
git add .
git commit -m "pc-tools marketplace: /pc + /pcq"
git branch -M main
git remote add origin https://github.com/yalza/claude-pc-commands.git
git push -u origin main
```

> Nếu đổi owner/repo, sửa luôn field `owner.name` trong `.claude-plugin/marketplace.json` và `plugins/pc-commands/.claude-plugin/plugin.json` cho khớp.

## Bước 2 — Cài trên bất kỳ máy nào

Trong Claude Code:
```
/plugin marketplace add yalza/claude-pc-commands
/plugin install pc-commands@pc-tools
/reload-plugins
```
Gõ `/pc` hoặc `/pcq` để kiểm tra đã có.

## Bước 3 — Dependency (BẮT BUỘC, không tự kéo theo)

2 lệnh gọi tới Codex nên máy đó cần:
```bash
# Node.js sẵn có, rồi:
npm install -g @openai/codex
codex login
```
Và **plugin Codex** (cung cấp subagent `codex:codex-rescue`):
```
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/reload-plugins
```

---

## Cập nhật về sau
Sửa command → bump `version` trong 2 file manifest → `git push`. Máy khác chạy `/plugin marketplace update pc-tools` (hoặc reinstall) để lấy bản mới.

## Ghi chú
- **Unity (tùy chọn):** phần Unity/verify dùng UnityMCP; dự án non-Unity thì tự bỏ qua.
- Codex **không mutate được Unity** qua companion → phần Unity **fallback về Claude** (chủ ý, an toàn).
- `/pcq` vẫn giữ **một cổng duyệt nhanh** trước khi Codex sửa file.
- Repo public → nội dung lệnh công khai (không nhạy cảm).
