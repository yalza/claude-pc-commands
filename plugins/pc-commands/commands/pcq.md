---
description: (pc quick) Claude lên plan ngắn → duyệt nhanh → giao Codex (bỏ review chéo) → verify tối thiểu. Cho task nhẹ.
argument-hint: "<mô tả task nhẹ cần làm>"
---

Bản RÚT GỌN của /pc cho **task nhẹ, ít rủi ro**. Bỏ vòng Codex-review-plan; giữ MỘT cổng duyệt nhanh để đi nhanh mà vẫn kiểm soát.

Task của user:
$ARGUMENTS

Nếu phần task ở trên trống, hãy hỏi user cần làm gì rồi mới bắt đầu.

**Nguyên tắc token:** đọc/quét Unity qua MCP mà output LỚN (`get_hierarchy`, dump components, `read_console` dài, quét prefab/scene) → giao **subagent** chạy và trả tóm tắt; KHÔNG gọi trực tiếp để tránh nuốt JSON to. Subagent chỉ đọc/tóm tắt/verify → chạy **model rẻ** (`model: "haiku"` khi gọi Agent tool).

**Cấu hình Codex:** trước khi gọi `codex:codex-rescue`, đọc `~/.claude/pc-codex.json` (Windows: `%USERPROFILE%\.claude\pc-codex.json`). Có `model`/`effort` → nối `--model <x>` / `--effort <y>` vào cuối prompt gửi subagent. Không có file / JSON hỏng → bỏ qua, KHÔNG báo lỗi. Nêu 1 dòng cho user biết đang dùng model + effort nào. Đổi cấu hình bằng `/pcset`.

Các bước:

## 1. Lên plan NGẮN
- Tìm hiểu vừa đủ (ưu tiên nhanh). Cần QUÉT/ĐỌC NHIỀU code hoặc Unity nặng → giao **Explore subagent (`model: "haiku"`)** trả tóm tắt (file liên quan + hàm tái dùng + kết luận); chỉ đọc trực tiếp khi 1–2 file nhỏ đã biết vị trí. Soạn plan **1 đoạn gọn**: mục tiêu + file/chỗ sẽ sửa.

## 2. Cổng duyệt nhanh (BẮT BUỘC)
- Dùng `AskUserQuestion` đúng MỘT lần, trình plan ngắn, 2 lựa chọn: `Giao Codex` / `Sửa plan`.
- KHÔNG cho Codex sửa file trước khi user chọn `Giao Codex`. Chọn `Sửa plan` → chỉnh theo góp ý rồi hỏi lại.

## 3. Giao Codex (sau khi duyệt)
- Gọi subagent `codex:codex-rescue` (--write) với plan vừa duyệt. KHÔNG review chéo. Kèm `--model`/`--effort` theo **Cấu hình Codex** ở trên.
- YÊU CẦU ĐỊNH DẠNG OUTPUT (tiết kiệm token): "Kết thúc bằng bảng NGẮN: file đã sửa / phần fail (nếu có) / compile status. KHÔNG dán lại toàn bộ diff hay nội dung file."
- Codex làm phần code C#/logic (+ Unity qua MCP nếu được). Phần Unity nào Codex fail → Claude làm bù qua UnityMCP (đọc nặng vẫn qua subagent).

## 4. Verify tối thiểu & báo cáo gọn
- Kiểm compile (`read_console` = 0 lỗi). Phần đọc Unity nặng → **subagent (`model: "haiku"`)** trả gọn `pass/fail + bằng chứng`. Nếu task đụng hành vi rõ ràng và rẻ để kiểm thì kiểm nhanh; không thì nêu rõ phần user nên tự test.
- Báo cáo ngắn: đã làm gì, ai làm (Codex/Claude), compile ok chưa.

## Khi nào KHÔNG dùng /pcq
- Task lớn/nhiều rủi ro/đụng nhiều hệ thống → dùng `/pc` đầy đủ (có review chéo + cổng duyệt).
- Nếu giữa chừng thấy task hoá ra không "nhẹ" → dừng, chuyển sang quy trình `/pc`.
