---
description: Menu chọn model + effort cho Codex (dùng bởi /pc, /pcq và /pcdesgin). Lưu bền vững, áp dụng cả phiên sau.
argument-hint: "[để trống = menu] | <model> <effort> | show | reset"
---

Quản lý cấu hình Codex dùng chung cho `/pc`, `/pcq` và `/pcdesgin`.

Tham số user:
$ARGUMENTS

## File config
`~/.claude/pc-codex.json` (Windows: `%USERPROFILE%\.claude\pc-codex.json`). Schema:
```json
{ "model": "gpt-5.4-mini", "effort": "high" }
```
Field vắng mặt / `null` → bỏ qua flag đó, Codex dùng mặc định của nó.

## Giá trị hợp lệ
- **effort**: `none` `minimal` `low` `medium` `high` `xhigh` — CHỈ 6 giá trị này (allowlist của `codex-companion.mjs`). Lưu ý: `ultra` trong `~/.codex/config.toml` KHÔNG hợp lệ cho `--effort`, sẽ ném lỗi.
- **model**: chuỗi bất kỳ, KHÔNG được validate. Alias: `spark` → `gpt-5.3-codex-spark`.

---

# Nhánh A — `$ARGUMENTS` RỖNG → hiện MENU

Đọc config hiện tại trước (để đánh dấu giá trị đang dùng). Rồi gọi `AskUserQuestion` **đúng MỘT lần** với 2 câu hỏi:

**Câu 1 — header `Model`:**
| label | description |
|---|---|
| `gpt-5.6-sol` | Mặc định Codex đang set trong config.toml. Mạnh nhất, tốn nhất. |
| `gpt-5.4-mini` | Nhỏ, nhanh, rẻ. Hợp task nhẹ. |
| `spark` | `gpt-5.3-codex-spark` — tối ưu tốc độ. |
| `Dùng mặc định Codex` | Không set `--model`, để Codex tự quyết theo `~/.codex/config.toml`. |

**Câu 2 — header `Effort`:**
| label | description |
|---|---|
| `low` | Suy luận nông, nhanh + rẻ nhất. |
| `medium` | Cân bằng. |
| `high` | Suy luận sâu, chậm + tốn hơn. |
| `xhigh` | Sâu nhất. Chỉ cho task khó. |

Trong description của câu 2, nhắc: chọn `Other` nếu muốn `none`, `minimal`, hoặc gõ `default` để bỏ set effort.

Xử lý câu trả lời:
- Chọn `Dùng mặc định Codex` (model) → **xoá** field `model` khỏi config.
- Câu 2 trả về `default` qua Other → **xoá** field `effort`.
- Other trả về giá trị effort ngoài 6 giá trị hợp lệ → báo lỗi, KHÔNG ghi file.
- `spark` → chuẩn hoá thành `gpt-5.3-codex-spark` trước khi ghi.

Sau đó ghi config theo **Quy tắc ghi** bên dưới.

---

# Nhánh B — `$ARGUMENTS` CÓ giá trị → không hiện menu

Tách thành token, thứ tự tự do:

1. `show` / `status` → đọc & in config hiện tại. Chưa có file → báo "đang dùng mặc định của Codex". KHÔNG ghi gì.
2. `reset` / `clear` / `off` → ghi `{}` vào file config. Báo đã về mặc định Codex.
3. Token nằm trong 6 giá trị effort → đó là **effort**.
4. Token còn lại → đó là **model**. `spark` → `gpt-5.3-codex-spark`.

---

## Quy tắc ghi (áp cho cả 2 nhánh)

- **Merge, KHÔNG ghi đè cả file.** Đọc config cũ trước; chỉ cập nhật field user vừa đưa, giữ nguyên field kia. (`/pcset low` khi đang có model → model không đổi.)
- File chưa tồn tại / JSON hỏng → coi như config rỗng `{}`, KHÔNG báo lỗi, ghi mới bình thường.
- **Effort sai giá trị** → báo lỗi, liệt kê 6 giá trị hợp lệ, **KHÔNG ghi file**, dừng.
- **Model** → nhận mọi chuỗi, nhưng **cảnh báo** rằng tên model không được kiểm tra; gõ sai chỉ lộ ra lúc Codex chạy thật.
- Sau khi ghi, LUÔN in lại config mới để user xác nhận.

## Báo cáo
Ngắn gọn, ví dụ:
```
Đã lưu → model: gpt-5.4-mini | effort: high
Config: ~/.claude/pc-codex.json
```
Field bị xoá thì ghi rõ `(mặc định Codex)` thay vì để trống.
