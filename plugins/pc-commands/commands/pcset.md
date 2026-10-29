---
description: Chọn model Codex và effort mặc định cho task mới của /pc, /pcq và /pcdesgin. Lưu qua các phiên.
argument-hint: "[menu] | <model> [effort] | model <id|default> | effort <value|default> | show | reset"
---

Quản lý `~/.claude/pc-codex.json` (Windows: `%USERPROFILE%\.claude\pc-codex.json`). Đọc `../references/codex-settings.md` để dùng cùng quy tắc giá trị và handoff.

Tham số user:
$ARGUMENTS

## Menu (không có tham số)

Đọc config trước, hiển thị model/effort đã lưu hoặc `(mặc định Codex)`. Không đoán tên model mặc định từ ví dụ hay khẳng định model nào mạnh/rẻ nhất.

Dùng AskUserQuestion để chọn model:
- `Giữ model hiện tại`: giữ nguyên field model.
- `Nhập model khác`: hỏi user nhập ID model chính xác bằng Other/free text trước khi ghi.
- `Mặc định Codex`: xóa field model.

Cho phép nhập ID trực tiếp qua Other ngay ở câu hỏi model. Câu trả lời rỗng/hủy không phải lựa chọn mặc định, không ghi gì.

Hỏi effort: `Giữ effort hiện tại`, `low`, `medium`, `high`; mô tả Other cho phép `none`, `minimal`, `xhigh`, `default`. Chỉ ghi sau khi cả hai câu trả lời hợp lệ. Không dùng tên lựa chọn menu làm ID model.

## Tham số trực tiếp

Parse toàn bộ trước khi ghi, theo thứ tự:
1. `show` / `status` đứng riêng: in cấu hình và đường dẫn, không ghi. File thiếu → mặc định Codex. JSON hỏng → báo lỗi, không che giấu.
2. `reset` / `clear` / `off` đứng riêng: đặt `{}`. Đây cũng là cách user chủ động khôi phục file hỏng.
3. `model <id|default>`: chỉ thay/xóa model.
4. `effort <value|default>`: chỉ thay/xóa effort; từ chối giá trị ngoài allowlist.
5. Một token effort hợp lệ: chỉ đổi effort (tương thích `/pcset low`). Một token `default`: yêu cầu dùng `model default`, `effort default` hoặc `reset` để tránh mơ hồ. Một token khác: model ID; riêng `ultra`/`max` báo effort không được giao diện này hỗ trợ, dùng `model <id>` nếu thật sự là ID.
6. Hai token: đúng một model và một effort hợp lệ, thứ tự tùy ý. Nếu không đúng, báo cú pháp, không ghi. Nhiều token hơn hoặc trộn lệnh quản lý với giá trị → từ chối, không lấy token cuối ghi đè token trước.

## Ghi cấu hình

- File thiếu → `{}`. JSON hỏng/không phải object → không ghi đè, hướng dẫn `reset` để khôi phục.
- Merge chỉ field được chọn, giữ field còn lại và field khác. Null/field thiếu nghĩa là default. Chỉ `reset` xóa toàn bộ.
- Validate model và effort theo reference; xác nhận này chỉ là cú pháp, không kiểm tra quyền truy cập model. Không chạy task thử tốn quota để xác thực.
- Tạo thư mục nếu thiếu; ghi JSON UTF-8 qua file tạm cùng thư mục rồi thay file đích, tránh cấu hình bị ghi dở. Không báo thành công nếu ghi thất bại.
- In lại model, effort, đường dẫn và `Áp dụng cho task mới của /pc, /pcq, /pcdesgin`. Task đang chạy giữ snapshot; muốn đổi riêng task, dùng option `--model`/`--effort` khi tạo task hoặc yêu cầu rõ khi tiếp tục.

Ví dụ:
```text
/pcset
/pcset model MODEL_ID
/pcset MODEL_ID high
/pcset effort medium
/pcset model default
/pcset show
/pcset reset
```

Không chỉnh `~/.codex/config.toml` hoặc model của Claude. Cấu hình chỉ điều khiển Codex được plugin này gọi.
