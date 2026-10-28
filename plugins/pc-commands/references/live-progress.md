# Không theo dõi trạng thái Codex

Claude chỉ gửi một handoff tự đủ ngữ cảnh, chờ output cuối của lượt đó rồi verify. Không polling Agent/runtime, không heartbeat, không gọi status/result/cancel để hỏi tiến độ, không lưu job/thread ID hay timestamp theo dõi. Nếu output rỗng hoặc timeout, báo rõ và chỉ retry theo chính sách của command khi có thể xác định lượt trước đã kết thúc; không chạy chồng.

Codex phải trả báo cáo ngắn gồm trạng thái kết quả, file đã sửa, kiểm tra đã chạy và lỗi/phần còn lại. `done_verified` hoặc `ready_for_review` vẫn chỉ là tự kiểm; Claude tự verify trước khi kết luận.

