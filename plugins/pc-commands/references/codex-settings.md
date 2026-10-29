# Chọn model Codex cho task

Quy tắc chung cho `/pc`, `/pcq`, `/pcdesgin` và `/pcset`. Đây là cấu hình của executor Codex, không phải field `model` của Agent tool chạy Claude.

## Giá trị

- Model là ID do user cung cấp, trim khoảng trắng, không rỗng và không chứa whitespace, ký tự điều khiển hoặc bắt đầu bằng `-`. Không nội suy giá trị vào shell; truyền bằng argument riêng/quote đúng nếu wrapper cần shell.
- Giữ nguyên ID; alias `spark` chuyển thành `gpt-5.3-codex-spark` để tương thích cũ. Không khẳng định một model khả dụng chỉ vì cấu hình có tên đó.
- Effort của giao diện plugin: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`. Tính tương thích còn phụ thuộc model và wrapper đã cài; lỗi không được tự đổi sang model/effort khác.
- Giá trị `default` nghĩa là bỏ flag tương ứng để Codex dùng mặc định.

## Cấu hình theo task

1. Chỉ parse các option ở đầu `$ARGUMENTS`: `--model <id|default>` và `--effort <value|default>`, thứ tự tùy ý. `--` kết thúc phần option. Phần còn lại là nguyên văn task/demo; không lấy các flag xuất hiện bên trong mô tả/code làm cấu hình. Thiếu giá trị, option lặp, option không biết ở đầu hoặc effort sai → báo lỗi trước khi dispatch, không sửa config.
2. Task mới: đọc `~/.claude/pc-codex.json`; thiếu file dùng `{}`. JSON hỏng, không phải object hoặc field sai kiểu/giá trị → báo lỗi và hướng dẫn `/pcset`, không âm thầm chạy model khác. Field thiếu/null dùng mặc định. Áp dụng từng option của task lên cấu hình đã đọc; `default` bỏ riêng field đó. Không ghi option theo task vào file cấu hình chung.
3. Lưu snapshot `codex_settings: {model, effort}` (null = default) và `codex_settings_source` (`task`, `saved`, `default` theo từng field) trong bản ghi task. Review plan, thực thi, retry và tiếp tục task đều dùng snapshot này. Nếu bản ghi cũ chưa có snapshot, resolve một lần rồi lưu. `/pcset` ảnh hưởng task mới; task đang chạy chỉ đổi khi user yêu cầu rõ, cập nhật snapshot trước lượt tiếp theo sau khi executor cũ đã dừng.
4. Trước dispatch, nêu ngắn model, effort và nguồn. Chỉ nối `--model <id>` / `--effort <value>` đã resolve vào prompt cho `codex:codex-rescue`; null thì bỏ flag. Đừng truyền model Codex vào field `model` của Agent tool.
5. Nếu runtime từ chối model/effort hoặc không hỗ trợ chuyển cấu hình, báo blocked kèm lỗi thật; không tự fallback, không tiêu hao retry cho lỗi cấu hình. Báo cáo phân biệt lựa chọn đã gửi và model thực chạy nếu runtime có xác nhận; không bịa xác nhận.

Ví dụ: `/pcq --model MODEL_ID --effort high Sửa lỗi đăng nhập` chỉ đổi cấu hình task này. `/pc --model default Kiểm tra parser` bỏ model đã lưu nhưng giữ effort đã lưu.
