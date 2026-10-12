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

## Quy tắc bàn giao Claude ↔ Codex (áp cho mọi lượt thực thi và retry)

- **Phân vai:** Claude lập plan, điều phối, giữ trạng thái và verify độc lập; Codex thực thi code và phần Unity trong plan đã duyệt bằng tool khả dụng. Claude chỉ sửa thay phần Codex còn lỗi sau đủ 5 lượt retry; nhánh user chủ động chọn Claude tự làm vẫn được giữ nguyên nếu có.
- **Gói giao việc bắt buộc:** gửi `task_id`, `item_id` ổn định cho từng phần việc, đường dẫn tuyệt đối repo/worktree và Unity project (nếu có), branch hiện tại (nếu dùng Git), mục tiêu, plan đã duyệt, file/phạm vi được sửa, phần phải giữ nguyên (gồm thay đổi có sẵn của user), tiêu chí hoàn thành và cách verify. Kèm phần đã xong, phần còn lại, `retry_used` (0–5), lỗi/bằng chứng mới nhất và các cách đã thử. Không chỉ gửi “tiếp tục” hoặc tham chiếu vào lịch sử mà Codex có thể không nhận được. Lượt review plan vẫn READ-ONLY, không áp dụng --write hay bộ đếm retry thực thi.
- **Mẫu trả kết quả bắt buộc:** mỗi `item_id` có `status` = `done_verified` / `done_unverified` / `partial` / `failed` / `blocked`; kèm file/asset đã sửa, kiểm tra thực sự đã chạy + kết quả/bằng chứng ngắn, phần còn lại, lỗi và nguyên nhân dự đoán (ghi rõ là giả thuyết), cách đã thử và bước đề xuất tiếp theo. Không dán toàn bộ diff/log. Chưa chạy được kiểm tra thì ghi `done_unverified` hoặc trạng thái chưa hoàn tất phù hợp, không tuyên bố pass. Claude kiểm chứng trước khi kết luận hoàn thành.
- **Bản ghi bàn giao bền vững:** sau khi plan được duyệt, Claude tạo một file riêng cho task tại `~/.claude/pc-handoffs/<task_id>.json` (Windows: `%USERPROFILE%\.claude\pc-handoffs\<task_id>.json`), ngoài repo. Dùng task_id duy nhất, an toàn cho tên file; chỉ Claude ghi file này. Lưu gói giao việc, phiên bản plan, từng item_id, status, retry_used, lịch sử ngắn từng lượt (cách thử/kết quả/lỗi), owner hiện tại, mã phiên/job/PID khi có, trạng thái đang chạy/đã kết thúc và lần verify gần nhất. Cập nhật trước khi gọi và sau mỗi lượt trả về, verify hoặc fallback. Gửi nội dung cần thiết trong prompt, không giả định Codex đọc được file này. Khi tiếp tục phiên, đọc đúng bản ghi và đối chiếu repo/worktree + trạng thái thực tế; không reset retry do đổi phiên, đổi cách sửa, đổi tên phần việc hay chuyển /pcq sang /pc. Không ghi secret hay log dài vào bản ghi. Nếu không lưu được, báo rõ và giữ cùng bản ghi trong hội thoại, không tuyên bố đã lưu bền vững.
- **Một bên ghi tại một thời điểm:** trước khi giao, Claude ghi nhận thay đổi sẵn có và bảo đảm không có lượt thực thi trước đang chạy trên cùng file/Unity project. Khi Codex chạy, Claude không sửa file, mutate Unity hay chạy kiểm tra làm thay đổi trạng thái chung. Chỉ verify hoặc fallback khi lượt đó đã kết thúc. Timeout/mất phản hồi KHÔNG đồng nghĩa tiến trình đã dừng: kiểm tra phiên/job, chờ hoặc dừng đúng tiến trình của lượt đó rồi xác nhận đã kết thúc trước khi retry. Không giết tiến trình không rõ nguồn gốc. Không xác nhận được thì ghi blocked và báo user; không khởi chạy chồng hoặc chuyển cho Claude sửa.
- **Kiểm tra môi trường/Unity:** trước khi sửa, Codex xác nhận đúng repo/worktree; nếu task có Unity, kiểm tra qua tool READ-ONLY khả dụng trong chính phiên Codex để xác định kết nối, project đang mở và tool cần dùng. Không mặc định endpoint nào đang sống, không coi Claude gọi được MCP là Codex cũng gọi được, không thử mutation ngoài plan để kiểm tra quyền. Chỉ thao tác đúng Unity project; nếu không xác nhận được hoặc bị từ chối, trả blocked kèm bằng chứng. Task không có Unity thì bỏ kiểm tra Unity và dùng build/test phù hợp với repo.
- **Retry vẫn là 5 lượt:** lần đầu có retry_used = 0; Claude ghi nhận mỗi lượt retry đã gọi (kể cả lỗi gọi/không có output) để tránh lặp vô hạn. Mỗi retry phải chẩn đoán lỗi trước, điều chỉnh cách xử lý hoặc kiểm tra lại điều kiện đang chặn. Lỗi quyền/quota/MCP không cho phép fallback sớm: giữ đủ 5 lượt retry trước khi Claude làm bù, không vượt quyền, không giả lập lượt retry và không lặp mutation có thể đã thành công. Nếu cần user khôi phục quyền/quota hoặc chưa xác nhận lượt cũ đã dừng, tạm chặn và giữ nguyên bộ đếm để tiếp tục sau. Output thiếu mẫu thì kiểm tra thực tế, yêu cầu bổ sung trong lượt retry tiếp theo nếu còn; không coi output thiếu là thành công. Hết 5 lượt mà vẫn lỗi → bàn giao phần còn lại cùng toàn bộ lịch sử ngắn cho Claude; không tạo vòng Codex retry mới cho cùng phần việc.

Các bước:

## 1. Lên plan NGẮN
- Tìm hiểu vừa đủ (ưu tiên nhanh). Cần QUÉT/ĐỌC NHIỀU code hoặc Unity nặng → giao **Explore subagent (`model: "haiku"`)** trả tóm tắt (file liên quan + hàm tái dùng + kết luận); chỉ đọc trực tiếp khi 1–2 file nhỏ đã biết vị trí. Soạn plan **1 đoạn gọn**: mục tiêu + file/chỗ sẽ sửa.
- Plan vẫn đủ **Gói giao việc bắt buộc** và tiêu chí hoàn thành cho từng item_id. Codex thực thi code + Unity theo khả năng được kiểm tra; Claude điều phối, verify và chỉ fallback sau khi hết retry.

## 2. Cổng duyệt nhanh (BẮT BUỘC)
- Dùng `AskUserQuestion` đúng MỘT lần, trình plan ngắn, 2 lựa chọn: `Giao Codex` / `Sửa plan`.
- KHÔNG cho Codex sửa file trước khi user chọn `Giao Codex`. Chọn `Sửa plan` → chỉnh theo góp ý rồi hỏi lại.

## 3. Giao Codex (sau khi duyệt)
- Gọi subagent `codex:codex-rescue` (--write) với plan vừa duyệt. KHÔNG review chéo. Kèm `--model`/`--effort` theo **Cấu hình Codex** ở trên.
- Codex kiểm tra đúng môi trường và khả năng Unity trong chính phiên của mình theo **Quy tắc bàn giao** trước khi sửa; phần không truy cập được phải trả blocked kèm bằng chứng để điều phối retry.
- Gửi đủ **Gói giao việc bắt buộc** và yêu cầu **Mẫu trả kết quả bắt buộc** ở trên; Claude cập nhật bản ghi bàn giao sau lượt này.
- Codex làm phần code C#/logic (+ Unity qua MCP nếu được). Khi thực thi lỗi, không gọi được MCP, báo không làm được hoặc bỏ sót → KHÔNG chuyển ngay cho Claude: cho Codex **tối đa 5 lượt retry sau lần thực thi đầu tiên** (tối đa 6 lượt tổng cộng cho phần việc bị lỗi), thành công thì dừng ngay.
- Claude theo dõi số lượt retry cho từng phần việc còn lỗi. Mỗi lượt gọi lại `codex:codex-rescue` với **--write**, kèm `--model`/`--effort` theo **Cấu hình Codex**, plan đã duyệt, phần còn lỗi, lỗi/bằng chứng verify gần nhất và những cách đã thử. Nêu `Retry n/5` trong prompt và cập nhật ngắn cho user.
- Kèm quy tắc retry trong prompt thực thi: Codex đọc trạng thái hiện tại, tìm nguyên nhân và điều chỉnh cách sửa; chỉ làm tiếp phần chưa đạt, giữ phần đã thành công, không lặp mù quáng thao tác có tác dụng phụ. Trả về ngắn: đã thử gì / kết quả / lỗi còn lại. Claude quản lý 5 lượt retry, không tạo thêm vòng retry lồng nhau.
- Chỉ khi hết 5 lượt retry mà vẫn lỗi, Claude mới làm bù ĐÚNG phần đó (code hoặc UnityMCP; đọc nặng vẫn qua subagent), dựa trên kết quả và lỗi cuối cùng. Không dùng retry để vượt quyền hoặc bỏ qua yêu cầu duyệt.

## 4. Verify tối thiểu & báo cáo gọn
- Kiểm compile (`read_console` = 0 lỗi). Phần đọc Unity nặng → **subagent (`model: "haiku"`)** trả gọn `pass/fail + bằng chứng`. Nếu task đụng hành vi rõ ràng và rẻ để kiểm thì kiểm nhanh; không thì nêu rõ phần user nên tự test.
- Verify theo tiêu chí từng item_id khi Codex đã dừng: với Unity xác nhận compile đã hoàn tất trên thay đổi mới nhất rồi mới đọc console; console trống khi chưa compile không chứng minh pass. Repo không có Unity dùng build/test phù hợp. Ghi rõ kiểm tra chưa chạy được và cập nhật bản ghi; Claude kiểm tra lại đúng Unity project trước khi verify hoặc fallback bằng MCP của mình.
- Nếu verify phát hiện phần Codex làm còn lỗi → quay lại bước 3 với số lượt retry còn lại của phần việc đó, KHÔNG reset bộ đếm; verify lại sau khi sửa.
- Báo cáo ngắn: đã làm gì, ai làm (Codex/Claude), compile ok chưa.

## Khi nào KHÔNG dùng /pcq
- Task lớn/nhiều rủi ro/đụng nhiều hệ thống → dùng `/pc` đầy đủ (có review chéo + cổng duyệt).
- Nếu giữa chừng thấy task hoá ra không "nhẹ" → dừng, chuyển sang quy trình `/pc`.
