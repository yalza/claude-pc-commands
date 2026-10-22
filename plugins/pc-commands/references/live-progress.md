# Hiển thị tiến trình khi Codex chạy

Áp dụng cho mọi handoff của `/pc`, `/pcq`, `/pcdesgin`, kể cả review read-only và retry. Đây là hướng dẫn điều phối, không phải stream hay bộ hẹn giờ chạy độc lập.

- **Tự động xuyên suốt:** bật mặc định khi gọi `/pc`, `/pcq` hoặc `/pcdesgin`, không yêu cầu user gọi `/pcstatus` hay bật tùy chọn. Báo bước hiện tại từ lúc khảo sát/lập plan, review plan, giao Codex, chờ chạy, retry đến Claude verify và kết quả cuối. Trong các bước Claude đang làm, dùng cùng nhịp cập nhật bên dưới và nêu rõ Claude hay Codex đang phụ trách. Khi đang chờ user duyệt/trả lời hoặc workflow đã blocked và kết thúc lượt, báo điều kiện tiếp tục một lần rồi dừng heartbeat; không tự tạo automation.
- **Trước khi gọi:** báo task_id, phần việc giao, model/effort thực tế (không biết thì ghi mặc định), lượt hiện tại và bước kế tiếp. Không để user chỉ thấy một tool đang chờ mà không biết mục đích.
- **Giữ khả năng tương tác:** dùng Agent chạy nền khi tool đã xác minh hỗ trợ, kể cả khi chưa biết task dài hay ngắn. Lưu Agent ID ngay khi có; chỉ lưu runtime job/thread ID khi runtime trả về. Không tự đoán flag và không đổi rescue thành agent polling. Nếu chỉ có foreground, báo trước rằng trong lúc tool bị chặn không thể bảo đảm cập nhật hay xử lý tin nhắn; không hứa chạy nền.
- **Nhịp theo dõi:** dùng notification và status/result đã xác minh trong command. Mỗi lần chờ tối đa 30 giây nếu API cho phép, không tạo vòng polling không chờ. Khi đang điều phối, tự gửi status ngắn mỗi khoảng 30 giây, kể cả trạng thái chưa đổi; không đợi user hỏi và không chỉ cập nhật bản ghi/tool output mà phải có thông báo hiển thị trong hội thoại. Khi một tool chặn lâu hơn dự kiến, cập nhật ngay khi quyền điều khiển trở lại và nói rõ khoảng trống quan sát; báo ngay khi có lỗi, cần input, chuyển bước hoặc hoàn tất. Không mở executor khác để lấy tiến trình. Không kết thúc workflow chỉ vì đã giao nền: tiếp tục theo dõi, lấy kết quả và review.
- **Chỉ báo điều quan sát được:** ưu tiên sự kiện/log tiến trình mà runtime thực tế cung cấp cho đúng lượt. Tóm tắt hoạt động mới nhất, nguồn và thời điểm; không in secret, prompt, nội dung file hay log dài. Nếu runtime chỉ trả running, ghi “Codex vẫn chạy; runtime chưa cung cấp hoạt động chi tiết”. Phân biệt thời gian từ lúc giao với thời gian thực thi; không suy ra phần trăm, ETA, file đang sửa hoặc bị treo từ thời gian chờ. Sự kiện cũ phải ghi là hoạt động gần nhất, không khẳng định đang tiếp diễn.
- **Bản ghi:** chỉ Claude ghi `progress` trong bản ghi handoff: `phase`, `dispatched_at`, `last_checked_at`, `last_activity_at`, `last_activity`, `source`, `next_action`. Dùng timestamp có múi giờ; giá trị chưa biết là null. `phase` là queued/running/reviewing/blocked/completed khi có bằng chứng. Lưu sau khi lấy được trạng thái, không biến một lần đọc status thành activity mới. Không có tiến trình không đồng nghĩa thất bại; không tăng retry hoặc tự hủy vì im lặng. Nếu không lưu được, báo rõ.
- **User chen ngang:** trả lời trạng thái hoặc câu hỏi ngay ở cơ hội xử lý tiếp theo. User yêu cầu dừng thì dùng cancel đúng Agent/job chỉ khi giao diện đã xác minh hỗ trợ, kiểm tra executor đã kết thúc rồi mới báo đã dừng. Không xác nhận được thì báo rõ, giữ khóa một bên ghi. User đổi yêu cầu thì áp dụng quy tắc plan_version; không chạy lượt sửa mới chồng lượt cũ. Không cần hỏi lại quyền để chỉ xem trạng thái.

Mẫu hiển thị (thay bằng dữ liệu thật; bỏ trường chưa có):

```text
[pc · <task_id> · <thời gian từ lúc giao>] Codex: <trạng thái đã kiểm tra>
Hoạt động gần nhất: <tóm tắt> · <thời điểm/nguồn>
Tiếp theo: <lấy kết quả / Claude review / điều kiện gỡ chặn>
```

Status ở trên tự hiển thị, `/pcstatus` chỉ là lệnh xem thêm theo yêu cầu. Khi bắt đầu, nhắc ngắn user có thể hỏi “đang tới đâu?”, yêu cầu dừng, hoặc dùng `/pcstatus` khi Claude có thể nhận lệnh. Khả năng nhận input trong lúc tool chạy phụ thuộc Claude/runtime; command này không thay đổi giao diện Claude và không làm Codex tính toán nhanh hơn.
