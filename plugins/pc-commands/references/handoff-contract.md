# Hợp đồng bàn giao Claude ↔ Codex

Áp dụng cho lượt thực thi của `/pc`, `/pcq`, `/pcdesgin`; không thay quy trình duyệt, ngân sách retry hay các mốc review UI. Claude đọc một lần mỗi task và đưa các trường cần thiết vào prompt Codex, không yêu cầu Codex tự tìm tài liệu này. Đây là quy ước prompt, không phải schema được runtime tự cưỡng chế.

## Một yêu cầu hiện hành

- Mỗi handoff có `task_id`, `plan_version`, `attempt_id` duy nhất và `item_id` ổn định. Codex trả lại đúng các ID này. `attempt_id` mới không reset retry; lượt review/read-only không tiêu thụ retry thực thi.
- Claude giữ yêu cầu hiện hành, các quyết định đã chốt và nguồn tham chiếu trong bản ghi. Ghi rõ `goal`, `in_scope`, `out_of_scope`, `constraints`, `assumptions`; phân biệt yêu cầu user, sự kiện đã kiểm chứng và giả thuyết. Không biến gợi ý của agent thành yêu cầu user.
- Khi user đổi yêu cầu, Claude cập nhật plan_version và mô tả thay đổi. Nếu lượt cũ đang chạy, chờ hoặc dừng đúng lượt và xác nhận kết thúc trước khi giao bản mới. Kết quả bản cũ chỉ là bằng chứng lịch sử; đối chiếu phần có thể tái dùng với bản mới, không mặc nhiên công nhận hoàn thành và không tự hoàn tác thay đổi.
- Ghi baseline: workspace, branch/HEAD nếu có Git, danh sách thay đổi sẵn có cần giữ. HEAD không đại diện cho nội dung chưa commit: bằng chứng test phải kèm attempt_id, file/phạm vi đã kiểm và thời điểm sau lần sửa cuối. Phát hiện thay đổi ngoài dự kiến trên phần đang làm thì đối chiếu trước khi sửa tiếp, không reset/ghi đè.

## Hiểu đúng và tự chủ trong phạm vi

- Codex tự đối chiếu mục tiêu, phạm vi và tiêu chí trước khi sửa; ghi ngắn cách hiểu và giả định trong kết quả. Không thêm một lượt gọi chỉ để lặp lại plan đối với task rõ ràng. `/pcdesgin` vẫn giữ lượt xác nhận hiểu demo đã quy định.
- Thiếu chi tiết triển khai có thể suy ra từ repo thì tự chọn theo pattern hiện có và ghi quyết định. Thiếu quyết định ảnh hưởng hành vi sản phẩm, dữ liệu, API công khai hoặc phạm vi thì trả `blocked` cho item bị ảnh hưởng với câu hỏi cụ thể và lựa chọn đề xuất; vẫn làm phần độc lập đã được duyệt nếu an toàn.
- Codex được phản biện plan bằng bằng chứng, không buộc làm theo giả định sai. Báo `conflict: yêu cầu/giả định | bằng chứng | phương án`; Claude đối chiếu nguồn và quyết định trong phạm vi đã duyệt. Chỉ hỏi user khi thiếu quyết định thực sự; không để hai agent tự tranh luận nhiều vòng hay âm thầm mở rộng phạm vi.
- Nếu phần việc phụ thuộc item chưa đạt, ghi `depends_on` và chờ điều kiện đó; không báo pass bằng dữ liệu giả. Không tự thêm framework, refactor ngoài phạm vi hoặc hạ tiêu chí để đóng task.

## Tiêu chí và bằng chứng

Mỗi item có danh sách `acceptance`: `criterion_id | hành vi mong đợi | cách kiểm`. Dùng điều kiện đầu vào → kết quả quan sát được; thêm trường hợp lỗi/biên liên quan khi cần, không tạo checklist hình thức. Với UI dùng ID vùng/tiêu chí đã có.

Codex trả mỗi tiêu chí: `criterion_id | pass/fail/not_run | bằng chứng`. Bằng chứng gồm lệnh/cách kiểm, kết quả thực tế, artifact nếu có và attempt_id. `not_run` phải ghi lý do; không biến thành pass. Test/code do Codex tự viết không tự chứng minh rằng cách hiểu yêu cầu đúng; Claude phải đối chiếu với tiêu chí ban đầu.

Claude lưu riêng `executor_status` và `review_status` (`pending`, `accepted`, `changes_requested`, `blocked`). `done_verified` của Codex chỉ là tự kiểm; `ready_for_review` của UI cũng chưa phải được chấp nhận. Chỉ `accepted` sau khi Claude kiểm chứng tất cả tiêu chí bắt buộc trên bản hiện hành. Đã sửa tiếp phần liên quan thì bằng chứng cũ phải được đánh giá lại. Kiểm tra bắt buộc chưa chạy được thì báo chưa xác minh, không kết luận hoàn tất.

Feedback sửa lỗi phải có `criterion_id`, bước tái hiện, expected, actual, bằng chứng và phạm vi bị ảnh hưởng. Codex kiểm chứng lỗi rồi sửa nguyên nhân; không chỉ sửa cho khớp lời nhận xét. Nếu phản biện feedback thì đưa bằng chứng cùng điều kiện tái hiện. Giữ nguyên ID khi lỗi tái xuất hiện.

## Mẫu gọn trong prompt/kết quả

Không gửi placeholder. Có thể dùng Markdown thay JSON; không cần thêm lượt chỉ để sửa định dạng nếu thông tin đã đủ để Claude ánh xạ chắc chắn.

```text
REQUEST
task_id / plan_version / attempt_id / workspace / baseline
goal / in_scope / out_of_scope / constraints / assumptions
item_id / depends_on / acceptance[criterion_id, expected, check]
retry_used (pc, pcq) hoặc round + phase (pcdesgin)
đã đạt / lỗi mới nhất / cách đã thử / quyết định hiện hành

RESULT
task_id / plan_version / attempt_id / item_id
understanding / assumptions_or_conflicts
executor_status / changed_files
criteria[criterion_id, pass|fail|not_run, evidence]
remaining / error_kind / next_action
```

Output thiếu ID: Claude chỉ ánh xạ qua đúng Agent/job đã theo dõi và bản ghi tương ứng khi chắc chắn; ghi rõ đây là ánh xạ của Claude. Không lấy kết quả job khác hoặc gửi mutation lại chỉ vì thiếu trường. Nếu không xác định được nguồn kết quả thì giữ review_status pending/blocked và phục hồi metadata trước.
