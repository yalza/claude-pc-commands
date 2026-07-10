---
description: Lên plan → Codex review → Codex thực thi (kể cả Unity qua MCP) → Claude verify + làm bù khi Codex fail
argument-hint: "<mô tả task cần làm>"
---

Xử lý task sau theo quy trình "plan → Codex review plan → Claude chỉnh → duyệt → Codex thực thi → Claude lo Unity → verify".

Task của user:
$ARGUMENTS

Nếu phần task ở trên trống, hãy hỏi user cần làm gì rồi mới bắt đầu.

**Nguyên tắc token (áp cho MỌI bước):** khi cần ĐỌC/QUÉT trạng thái Unity qua MCP mà output LỚN (`get_hierarchy`, dump components, `read_console` dài, quét prefab/scene) → giao một **subagent** (general-purpose/Explore) chạy các tool UnityMCP đó và **chỉ trả về tóm tắt** (id/giá trị/kết luận cần dùng). KHÔNG gọi trực tiếp để tránh nuốt JSON to vào context Claude. Thao tác nhỏ (1–2 giá trị) hoặc mutate lẻ thì gọi trực tiếp cho nhanh.

**Model cho subagent tóm tắt:** các subagent chỉ làm việc đọc/quét/tóm tắt/verify (không cần suy luận sâu) hãy chạy **model rẻ** — gọi Agent tool với `model: "haiku"` — để tiết kiệm chi phí. Chỉ dùng model mặc định khi subagent cần suy luận/quyết định phức tạp.

**Cấu hình Codex (áp cho MỌI lần gọi `codex:codex-rescue`):** trước khi gọi, đọc `~/.claude/pc-codex.json` (Windows: `%USERPROFILE%\.claude\pc-codex.json`).
- Có `model` → nối `--model <giá trị>` vào cuối prompt gửi subagent. Có `effort` → nối `--effort <giá trị>`.
- File không tồn tại / JSON hỏng / field rỗng → BỎ QUA, không báo lỗi (Codex dùng mặc định của nó).
- Nêu 1 dòng cho user biết đang chạy Codex với model + effort nào (hoặc "mặc định Codex").
- User đổi cấu hình này bằng lệnh `/pcset`.

Thực hiện TUẦN TỰ các bước, KHÔNG được bỏ bước:

## 1. Nghiên cứu & lên plan
- Khi cần QUÉT/ĐỌC NHIỀU code để plan → giao một **Explore subagent (`model: "haiku"`)**, yêu cầu chỉ trả về: file liên quan + hàm/pattern **tái dùng được** + kết luận đủ để plan. KHÔNG `Read` full file vào context Claude.
- Chỉ đọc trực tiếp ở main khi là 1–2 file nhỏ đã biết chính xác vị trí. Ưu tiên tái dùng hàm/pattern có sẵn.
- Soạn một plan ngắn gọn nhưng đủ để thực thi: mục tiêu, file sẽ sửa, cách chia việc **Codex (code C#/logic)** vs **Claude (prefab/scene/material + verify qua UnityMCP)**, và cách verify cuối.

## 2. Codex review plan (READ-ONLY, không sửa file)
- Gọi subagent `codex:codex-rescue` (Agent tool, `subagent_type: "codex:codex-rescue"`), foreground. Kèm `--model`/`--effort` theo **Cấu hình Codex** ở trên.
- Prompt cho Codex = toàn văn plan vừa soạn + yêu cầu: **CHỈ REVIEW, KHÔNG SỬA FILE, KHÔNG --write**. Tìm: lỗ hổng logic, edge case bị bỏ sót, giả định sai, rủi ro, thiếu bước verify.
- YÊU CẦU ĐỊNH DẠNG (tiết kiệm token): "Trả về CHỈ bullet `[vấn đề] — [mức độ] — [đề xuất]`. KHÔNG lặp lại plan, KHÔNG giải thích dài dòng."
- Nhận nguyên văn feedback của Codex.

## 3. Claude verify & chỉnh plan (1 lượt)
- Đọc feedback của Codex, tự đánh giá đúng/sai — KHÔNG tiếp thu mù quáng. Kiểm chứng lại bằng code khi cần.
- Chỉnh plan cho chặt. Nêu ngắn gọn: điểm nào tiếp thu, điểm nào bác bỏ (kèm lý do).

## 4. Cổng duyệt user (BẮT BUỘC)
- Dùng `AskUserQuestion` đúng MỘT lần, trình plan cuối, 3 lựa chọn:
  - `Duyệt & giao Codex`
  - `Sửa plan`
  - `Claude tự làm (không Codex)`
- TUYỆT ĐỐI không sửa code sản phẩm trước khi được duyệt.

## 5. Giao Codex thực thi TOÀN BỘ (khi chọn "Duyệt & giao Codex")
- Gọi subagent `codex:codex-rescue`, prompt = plan đã chốt, chạy **--write** (mặc định của rescue là write). Kèm `--model`/`--effort` theo **Cấu hình Codex** ở trên.
- Codex thực thi CẢ phần code C#/logic LẪN phần Unity (prefab/scene/material, kiểm compile) **bằng chính unityMCP của Codex** — Codex CLI đã cấu hình `unityMCP` (endpoint `127.0.0.1:8080` sống). Nêu RÕ trong prompt: dùng unityMCP để thao tác Unity, và **liệt kê ở CUỐI phần nào KHÔNG hoàn tất được** (đặc biệt nếu không gọi được MCP).
- YÊU CẦU ĐỊNH DẠNG OUTPUT (tiết kiệm token): "Kết thúc bằng bảng NGẮN: file đã sửa / phần fail (nếu có) / compile status. KHÔNG dán lại toàn bộ diff hay nội dung file."

## 6. Fallback Claude (CHỈ khi Codex fail)
- Đọc kết quả Codex. Phần nào Codex **fail** — không gọi được unityMCP / báo không làm được / lỗi / bỏ trống — thì Claude làm bù ĐÚNG phần đó qua UnityMCP.
- Nếu Codex đã hoàn tất hết → Claude KHÔNG làm lại, sang thẳng bước verify.

## 7. Claude verify độc lập & báo cáo
- Claude LUÔN tự verify bất kể ai thực thi: kiểm compile (`read_console` = 0 lỗi), wiring, test hành vi (Play mode qua UnityMCP nếu khả thi). Phần đọc Unity nặng → qua **subagent (`model: "haiku"`)** trả về gọn `pass/fail + bằng chứng` (Nguyên tắc token).
- Báo cáo TRUNG THỰC: phần nào **Codex** làm, phần nào **Claude fallback**, đã verify gì (kèm bằng chứng), phần nào user cần tự test.

## Nhánh khác
- Chọn `Sửa plan` → chỉnh theo góp ý user rồi quay lại bước 4 (hỏi duyệt lại).
- Chọn `Claude tự làm` → bỏ bước 5 (không giao Codex thực thi), Claude tự code + làm Unity + verify. Vòng Codex-review plan ở bước 2–3 vẫn đã chạy.
