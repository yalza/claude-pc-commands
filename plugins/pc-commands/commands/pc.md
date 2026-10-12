---
description: Lên plan → Codex review → Codex thực thi (kể cả Unity qua MCP) → Claude verify + làm bù khi Codex fail
argument-hint: "<mô tả task cần làm>"
---

Xử lý task sau theo quy trình "plan → Codex review plan → Claude chỉnh → duyệt → Codex thực thi + retry → Claude fallback nếu vẫn lỗi → verify".

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

## Quy tắc bàn giao Claude ↔ Codex (áp cho mọi lượt thực thi và retry)

- **Phân vai:** Claude lập plan, điều phối, giữ trạng thái và verify độc lập; Codex thực thi code và phần Unity trong plan đã duyệt bằng tool khả dụng. Claude chỉ sửa thay phần Codex còn lỗi sau đủ 5 lượt retry; nhánh user chủ động chọn Claude tự làm vẫn được giữ nguyên nếu có.
- **Gói giao việc bắt buộc:** gửi `task_id`, `item_id` ổn định cho từng phần việc, đường dẫn tuyệt đối repo/worktree và Unity project (nếu có), branch hiện tại (nếu dùng Git), mục tiêu, plan đã duyệt, file/phạm vi được sửa, phần phải giữ nguyên (gồm thay đổi có sẵn của user), tiêu chí hoàn thành và cách verify. Kèm phần đã xong, phần còn lại, `retry_used` (0–5), lỗi/bằng chứng mới nhất và các cách đã thử. Không chỉ gửi “tiếp tục” hoặc tham chiếu vào lịch sử mà Codex có thể không nhận được. Lượt review plan vẫn READ-ONLY, không áp dụng --write hay bộ đếm retry thực thi.
- **Mẫu trả kết quả bắt buộc:** mỗi `item_id` có `status` = `done_verified` / `done_unverified` / `partial` / `failed` / `blocked`; kèm file/asset đã sửa, kiểm tra thực sự đã chạy + kết quả/bằng chứng ngắn, phần còn lại, lỗi và nguyên nhân dự đoán (ghi rõ là giả thuyết), cách đã thử và bước đề xuất tiếp theo. Không dán toàn bộ diff/log. Chưa chạy được kiểm tra thì ghi `done_unverified` hoặc trạng thái chưa hoàn tất phù hợp, không tuyên bố pass. Claude kiểm chứng trước khi kết luận hoàn thành.
- **Bản ghi bàn giao bền vững:** sau khi plan được duyệt, Claude tạo một file riêng cho task tại `~/.claude/pc-handoffs/<task_id>.json` (Windows: `%USERPROFILE%\.claude\pc-handoffs\<task_id>.json`), ngoài repo. Dùng task_id duy nhất, an toàn cho tên file; chỉ Claude ghi file này. Lưu gói giao việc, phiên bản plan, từng item_id, status, retry_used, lịch sử ngắn từng lượt (cách thử/kết quả/lỗi), owner hiện tại, mã phiên/job/PID khi có, trạng thái đang chạy/đã kết thúc và lần verify gần nhất. Cập nhật trước khi gọi và sau mỗi lượt trả về, verify hoặc fallback. Gửi nội dung cần thiết trong prompt, không giả định Codex đọc được file này. Khi tiếp tục phiên, đọc đúng bản ghi và đối chiếu repo/worktree + trạng thái thực tế; không reset retry do đổi phiên, đổi cách sửa, đổi tên phần việc hay chuyển /pcq sang /pc. Không ghi secret hay log dài vào bản ghi. Nếu không lưu được, báo rõ và giữ cùng bản ghi trong hội thoại, không tuyên bố đã lưu bền vững.
- **Một bên ghi tại một thời điểm:** trước khi giao, Claude ghi nhận thay đổi sẵn có và bảo đảm không có lượt thực thi trước đang chạy trên cùng file/Unity project. Khi Codex chạy, Claude không sửa file, mutate Unity hay chạy kiểm tra làm thay đổi trạng thái chung. Chỉ verify hoặc fallback khi lượt đó đã kết thúc. Timeout/mất phản hồi KHÔNG đồng nghĩa tiến trình đã dừng: kiểm tra phiên/job, chờ hoặc dừng đúng tiến trình của lượt đó rồi xác nhận đã kết thúc trước khi retry. Không giết tiến trình không rõ nguồn gốc. Không xác nhận được thì ghi blocked và báo user; không khởi chạy chồng hoặc chuyển cho Claude sửa.
- **Kiểm tra môi trường/Unity:** trước khi sửa, Codex xác nhận đúng repo/worktree; nếu task có Unity, kiểm tra qua tool READ-ONLY khả dụng trong chính phiên Codex để xác định kết nối, project đang mở và tool cần dùng. Không mặc định endpoint nào đang sống, không coi Claude gọi được MCP là Codex cũng gọi được, không thử mutation ngoài plan để kiểm tra quyền. Chỉ thao tác đúng Unity project; nếu không xác nhận được hoặc bị từ chối, trả blocked kèm bằng chứng. Task không có Unity thì bỏ kiểm tra Unity và dùng build/test phù hợp với repo.
- **Retry vẫn là 5 lượt:** lần đầu có retry_used = 0; Claude ghi nhận mỗi lượt retry đã gọi (kể cả lỗi gọi/không có output) để tránh lặp vô hạn. Mỗi retry phải chẩn đoán lỗi trước, điều chỉnh cách xử lý hoặc kiểm tra lại điều kiện đang chặn. Lỗi quyền/quota/MCP không cho phép fallback sớm: giữ đủ 5 lượt retry trước khi Claude làm bù, không vượt quyền, không giả lập lượt retry và không lặp mutation có thể đã thành công. Nếu cần user khôi phục quyền/quota hoặc chưa xác nhận lượt cũ đã dừng, tạm chặn và giữ nguyên bộ đếm để tiếp tục sau. Output thiếu mẫu thì kiểm tra thực tế, yêu cầu bổ sung trong lượt retry tiếp theo nếu còn; không coi output thiếu là thành công. Hết 5 lượt mà vẫn lỗi → bàn giao phần còn lại cùng toàn bộ lịch sử ngắn cho Claude; không tạo vòng Codex retry mới cho cùng phần việc.

Thực hiện TUẦN TỰ các bước, KHÔNG được bỏ bước:

## 1. Nghiên cứu & lên plan
- Khi cần QUÉT/ĐỌC NHIỀU code để plan → giao một **Explore subagent (`model: "haiku"`)**, yêu cầu chỉ trả về: file liên quan + hàm/pattern **tái dùng được** + kết luận đủ để plan. KHÔNG `Read` full file vào context Claude.
- Chỉ đọc trực tiếp ở main khi là 1–2 file nhỏ đã biết chính xác vị trí. Ưu tiên tái dùng hàm/pattern có sẵn.
- Soạn plan ngắn nhưng đủ **Gói giao việc bắt buộc**: Codex thực thi code + Unity theo khả năng được kiểm tra; Claude điều phối, verify độc lập và chỉ fallback sau khi hết retry. Nêu tiêu chí hoàn thành kiểm chứng được cho từng item_id.

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
- Codex kiểm tra môi trường theo **Quy tắc bàn giao** trước khi sửa; thực thi code và phần Unity đã duyệt bằng chính tool của Codex khi kết nối/project/quyền phù hợp. Phần không làm được phải trả trạng thái và bằng chứng để Claude điều phối retry; không giả định MCP đã kết nối.
- Gửi đủ **Gói giao việc bắt buộc** và yêu cầu **Mẫu trả kết quả bắt buộc** ở trên; Claude cập nhật bản ghi bàn giao sau lượt này.

## 6. Codex retry trước khi fallback Claude
- Khi Codex thực thi **fail** — không gọi được unityMCP / báo không làm được / lỗi / bỏ trống — KHÔNG chuyển ngay cho Claude. Cho Codex **tối đa 5 lượt retry sau lần thực thi đầu tiên** (tối đa 6 lượt tổng cộng cho phần việc bị lỗi); thành công thì dừng retry ngay.
- Claude theo dõi số lượt retry cho từng phần việc còn lỗi. Mỗi lượt gọi lại `codex:codex-rescue` với **--write**, kèm `--model`/`--effort` theo **Cấu hình Codex**, plan đã duyệt, phần còn lỗi, thông báo lỗi/bằng chứng verify gần nhất và những cách đã thử. Nêu rõ `Retry n/5` trong prompt và cập nhật ngắn cho user.
- Kèm quy tắc này trong prompt thực thi ở bước 5: Codex đọc trạng thái hiện tại, tìm nguyên nhân và điều chỉnh cách sửa; chỉ làm tiếp phần chưa đạt, giữ phần đã thành công, không lặp mù quáng thao tác có tác dụng phụ. Trả về ngắn: đã thử gì / kết quả / lỗi còn lại. Claude quản lý 5 lượt retry, không tạo thêm vòng retry lồng nhau.
- Chỉ sau khi hết 5 lượt retry mà phần việc vẫn lỗi, Claude mới làm bù ĐÚNG phần đó (code hoặc UnityMCP), dựa trên kết quả và lỗi cuối cùng của Codex. Không dùng retry để vượt quyền hoặc bỏ qua yêu cầu duyệt.
- Nếu Codex đã hoàn tất hết → Claude KHÔNG làm lại, sang thẳng bước verify.

## 7. Claude verify độc lập & báo cáo
- Claude LUÔN tự verify bất kể ai thực thi: kiểm compile (`read_console` = 0 lỗi), wiring, test hành vi (Play mode qua UnityMCP nếu khả thi). Phần đọc Unity nặng → qua **subagent (`model: "haiku"`)** trả về gọn `pass/fail + bằng chứng` (Nguyên tắc token).
- Verify theo tiêu chí từng item_id khi Codex đã dừng: với Unity phải xác nhận compile đã hoàn tất trên thay đổi mới nhất trước khi đọc console; console trống khi chưa compile không chứng minh pass. Repo không có Unity dùng build/test phù hợp. Ghi rõ kiểm tra chưa chạy được và cập nhật bản ghi; Claude kiểm tra lại đúng Unity project trước khi verify hoặc fallback bằng MCP của mình.
- Nếu verify phát hiện phần Codex làm còn lỗi → quay lại bước 6 với số lượt retry còn lại của phần việc đó, KHÔNG reset bộ đếm; verify lại sau khi sửa.
- Báo cáo TRUNG THỰC: phần nào **Codex** làm, phần nào **Claude fallback**, đã verify gì (kèm bằng chứng), phần nào user cần tự test.

## Nhánh khác
- Chọn `Sửa plan` → chỉnh theo góp ý user rồi quay lại bước 4 (hỏi duyệt lại).
- Chọn `Claude tự làm` → bỏ bước 5 (không giao Codex thực thi), Claude tự code + làm Unity + verify. Vòng Codex-review plan ở bước 2–3 vẫn đã chạy.
