---
description: Giao UI từ /desgin cho Codex → Claude so với demo → yêu cầu Codex sửa liên tục đến khi khớp.
argument-hint: "[yêu cầu UI, đường dẫn/link demo hoặc tiếp tục kết quả /desgin]"
---

Thực hiện yêu cầu UI sau bằng quy trình **Claude chốt demo → Codex dựng UI → Claude review trực quan → Codex sửa → lặp đến khi khớp demo**.

Yêu cầu bổ sung của user:
$ARGUMENTS

## Vai trò bắt buộc: dựng UI khớp ảnh mẫu

- **Codex là người triển khai UI theo ảnh mẫu:** ưu tiên độ khớp demo, không tự thiết kế lại, thay asset bằng hình gần giống, hoặc đổi bố cục vì sở thích. **Claude là người review độc lập:** chỉ cho đạt khi đã xem bản render và kiểm đủ tiêu chí. Gửi nguyên tắc vai trò này trong mọi gói giao việc.
- **Ưu tiên ảnh native size:** đọc kích thước gốc của demo và từng asset trước khi bố trí. Giữ bản gốc để so sánh; xem ảnh ở độ phân giải gốc/100% khi công cụ hỗ trợ, không chỉ nhìn thumbnail hay bản preview đã thu nhỏ. Nếu công cụ giới hạn độ phân giải, dùng các crop ở tỉ lệ 1:1 để kiểm chi tiết, kèm ảnh toàn cảnh.
- Với asset, mặc định ưu tiên kích thước hiển thị tự nhiên và đúng aspect ratio; không tự kéo giãn, crop, upscale hoặc nén ảnh để ép vừa layout. Nếu demo thể hiện scale/crop hoặc responsive cần thu nhỏ, làm đúng demo và ghi rõ kích thước nguồn → kích thước hiển thị, tỉ lệ scale và chế độ fit/crop. Độ khớp demo là tiêu chí cuối, native size là ưu tiên khi demo không quy định khác.
- Phân biệt pixel ảnh với CSS pixel/đơn vị UI: ghi device pixel ratio (DPR), browser zoom hoặc Canvas scale và mật độ asset (@2x/@3x nếu có). Ví dụ asset @2x rộng 400 pixel có thể hiển thị tự nhiên ở 200 CSS px; không ép 400 CSS px chỉ vì file rộng 400 pixel. Không suy ra viewport chỉ từ kích thước screenshot khi chưa biết DPR.
- Không resize riêng ảnh kết quả để che sai lệch khi review. Nếu phải chuẩn hóa để so sánh, giữ ảnh gốc, ghi phép biến đổi và áp dụng cùng hệ tọa độ cho hai ảnh. Không dùng nguyên screenshot demo làm UI thay cho component và tương tác thật.

## 1. Lấy demo làm chuẩn

- Dùng kết quả `/desgin` trong hội thoại hiện tại và tham số user: ảnh, mockup, file HTML, URL demo, asset, mô tả tương tác. Nếu user gọi nó là `/design`, cũng dùng kết quả tương ứng. Đây là lệnh tiếp nối kết quả thiết kế, không giả định `/desgin` là lệnh có sẵn hay tự bịa nội dung của lệnh đó.
- Nếu tham số trống nhưng đã có demo trong hội thoại, tiếp tục ngay. Chỉ hỏi khi thiếu demo hoặc không xác định được demo nào là bản user chọn. Nếu cần nguồn có quyền truy cập, yêu cầu đúng nguồn còn thiếu; không tự chọn một thiết kế thay thế.
- Đọc hướng dẫn repo, xác nhận đường dẫn tuyệt đối repo/worktree, branch (nếu có), thay đổi sẵn có của user, stack và cách chạy UI. Không ghi đè phần việc ngoài phạm vi.
- Claude xem demo thực tế, ghi chuẩn đối chiếu: màn hình/route, viewport và tỉ lệ hiển thị, layout, kích thước, khoảng cách, font, màu, asset/icon, nội dung, trạng thái tương tác và responsive được yêu cầu. Chốt bản demo tham chiếu; chỉ đổi chuẩn khi user đổi yêu cầu.
- Tạo **UI spec có số đo**, gán ID ổn định cho từng vùng/component: `id | nguồn/vùng ảnh | x,y,w,h + đơn vị | padding/gap | font/size/weight/line-height | màu/border/radius/shadow | asset + native size + display size | trạng thái | cách kiểm`. Ghi viewport/DPR/zoom, nguồn font, đường dẫn asset và quy tắc responsive. Chỉ điền thông số có căn cứ; đánh dấu `đã đo`, `ước lượng` hoặc `chưa biết`, không trình bày số đoán như số chính xác. Chốt dung sai có lý do trước khi thực thi nếu cần (ví dụ khác biệt rasterization font); không tự tăng dung sai sau khi fail.
- Nêu plan ngắn và tiêu chí kiểm chứng rồi giao Codex. Việc gọi `/pcdesgin` đã cho phép triển khai và sửa lặp trong phạm vi này; không hỏi duyệt lại mỗi vòng. Không tự publish/deploy hoặc mở rộng phạm vi.

## 2. Cấu hình và trạng thái bàn giao

- Trước MỌI lần gọi subagent `codex:codex-rescue` bằng Agent tool (`subagent_type: "codex:codex-rescue"`), đọc `~/.claude/pc-codex.json` (Windows: `%USERPROFILE%\.claude\pc-codex.json`). Có `model`/`effort` không rỗng → nối `--model <giá trị>` / `--effort <giá trị>` vào prompt. File thiếu/JSON hỏng/field thiếu → bỏ flag tương ứng. Nêu gọn cấu hình đang dùng; user đổi bằng `/pcset`.
- Claude tạo và cập nhật `~/.claude/pc-handoffs/<task_id>.json`, ngoài repo, với `workflow: "pcdesgin"`, task_id an toàn và duy nhất, workspace, branch, phạm vi, demo tham chiếu, tiêu chí, round, status, owner, session/job/PID nếu có, trạng thái lượt chạy, các sai lệch còn lại và lịch sử ngắn kèm đường dẫn bằng chứng. Chỉ Claude ghi bản ghi; không lưu secret/log dài. Nếu không lưu được, báo rõ và giữ trạng thái trong hội thoại.
- Tiếp tục phiên cũ thì đọc bản ghi và đối chiếu workspace/trạng thái thực tế; giữ số vòng và sai lệch đang mở. Không áp dụng giới hạn 5 retry hay tự chuyển sang Claude sửa của `/pc` và `/pcq`. Không sửa bộ đếm của task thuộc các workflow đó.
- Chỉ một executor ghi tại một thời điểm. Claude đợi Codex kết thúc trước khi chạy UI, review hoặc giao sửa tiếp. Timeout không chứng minh đã dừng: kiểm tra đúng session/job, chờ hoặc dừng đúng lượt rồi xác nhận kết thúc. Nếu không xác nhận được, ghi blocked; không chạy chồng hay giết tiến trình không rõ nguồn gốc.

## 3. Giao Codex dựng hoặc sửa UI

### Xác nhận hiểu trước lượt sửa đầu tiên

- Gọi `codex:codex-rescue` foreground **READ-ONLY, KHÔNG --write**, kèm cấu hình bước 2, vai trò, UI spec và nguồn demo. Yêu cầu không sửa file, trả ngắn: màn hình/trạng thái sẽ dựng, demo và asset thực sự đọc được cùng kích thước gốc, viewport/DPR, component có thể tái dùng, điểm chưa rõ và kế hoạch theo giai đoạn.
- Claude kiểm tra câu trả lời với demo/spec, bổ sung thông tin hoặc sửa cách hiểu trước khi giao write. Không coi bước này là cổng duyệt thêm cho user. Chỉ hỏi user nếu thiếu quyết định không thể suy ra từ nguồn hiện có; nguồn bắt buộc không truy cập được thì blocked. Lặp xác nhận khi demo/phạm vi thay đổi đáng kể, không bắt làm lại mọi vòng sửa nhỏ.

### Triển khai theo giai đoạn

- Giao từng giai đoạn theo thứ tự: **(1) bố cục/kích thước → (2) font, asset, màu → (3) spacing và chi tiết → (4) tương tác và responsive theo yêu cầu**. Không để phần chi tiết che lấp sai bố cục; mỗi giai đoạn phải có UI render được để Claude review ở bước 4 trước khi chuyển tiếp. Nối tương tác tối thiểu sớm nếu cần để mở đúng trạng thái kiểm tra.
- Ghi `phase` và tiêu chí của giai đoạn trong bàn giao; pass giai đoạn không phải hoàn thành task. Vòng sửa nhắm đúng giai đoạn/lỗi đang mở, giữ các vùng đã đạt; sau giai đoạn cuối vẫn review toàn bộ.

Gọi `codex:codex-rescue` foreground với `--write`, cấu hình ở trên và **gói bàn giao tự đủ ngữ cảnh**:

- task_id, round, đường dẫn tuyệt đối workspace/project, branch, file/phạm vi được sửa và thay đổi sẵn có phải giữ.
- Mục tiêu, demo tham chiếu truy cập được trong phiên Codex (đường dẫn tuyệt đối/URL và ảnh nếu tool hỗ trợ), viewport, asset, tiêu chí đối chiếu và các trạng thái cần dựng. Không chỉ nói “xem ảnh ở trên”; xác nhận Codex có thể đọc nguồn, nếu không thì báo blocked và cung cấp nguồn truy cập được.
- Lệnh chạy/build/test theo repo, cách mở đúng màn hình, dữ liệu/trạng thái để tái hiện; với Unity cần kiểm tra kết nối và đúng project bằng tool read-only trong chính phiên Codex trước khi sửa.
- Phần đã đạt cần giữ, danh sách sai lệch do Claude review, ảnh hiện tại so với demo, vị trí/kích thước mong muốn, lỗi kiểm tra và cách đã thử. Vòng đầu dùng checklist từ bước 1.
- Kèm UI spec có số đo, vai trò và quy tắc native size, giai đoạn hiện tại, kết quả xác nhận hiểu, danh sách ID đã pass và sai lệch cần sửa. Không dựa vào trí nhớ của phiên Codex trước.
- Yêu cầu Codex kiểm tra môi trường, thực thi toàn bộ phần sửa trong phạm vi, tái dùng component/asset hiện có, chạy kiểm tra phù hợp, không thay demo hoặc làm yếu tiêu chí để được pass. Codex chỉ thực hiện một lượt bàn giao; Claude quản lý vòng lặp.

Yêu cầu trả ngắn: `status` = `ready_for_review` / `partial` / `failed` / `blocked`, file/asset đã sửa, kiểm tra thực sự đã chạy và kết quả, đường dẫn ảnh UI nếu chụp được, sai lệch còn biết, lỗi/điều kiện chặn và hướng sửa tiếp. Codex tự báo xong chưa phải kết luận UI khớp.

## 4. Claude review độc lập trên UI thực tế

- Sau mỗi lượt Codex kết thúc, Claude tự mở bản UI vừa sửa bằng browser/preview/Editor phù hợp và xem ảnh render mới. Xác nhận đúng workspace, route/scene và bản build mới; không dùng ảnh cũ hoặc chỉ đọc code để kết luận.
- So sánh demo và UI ở cùng viewport, scale, dữ liệu và trạng thái. Kiểm từng vùng: bố cục, alignment, kích thước, spacing, typography, màu/nền/border/shadow, asset/icon, nội dung, clipping/overflow và responsive theo chuẩn đã chốt. Không tự suy diễn thiết kế mobile nếu demo/yêu cầu chưa xác định; ghi rõ phần nào là suy luận cần thiết.
- Kiểm tương tác được yêu cầu (navigation, nút, modal, hover/selected/loading/error nếu có). Chạy build/compile và kiểm tra liên quan theo repo. Với Unity, xác nhận compile xong rồi kiểm console và Game view đúng kích thước; console trống trước compile không chứng minh pass.
- Lưu bằng chứng theo vòng ở vị trí artifact phù hợp, tránh thêm ảnh/log sinh ra vào source ngoài ý muốn. Ghi bảng ngắn `id | vị trí | demo yêu cầu | thực tế | cách kiểm lại | pass/fail` và đường dẫn ảnh. Nếu dùng công cụ so ảnh/overlay thì dùng cùng kích thước; điểm số tự động chỉ hỗ trợ, không thay việc xem UI.
- Với từng lỗi, giữ ID ổn định, ghi bounding box/vùng ảnh theo hệ tọa độ đã chốt, số đo thực tế → mong muốn, độ ưu tiên và tiêu chí đóng lỗi. Ví dụ `header-height: y=0, cao 80 CSS px → 64 CSS px ở viewport đã chốt`; không chỉ nói “header chưa giống”. Đính kèm ảnh demo và render mới đặt cạnh nhau hoặc overlay/crop 1:1 khi công cụ cho phép; giữ liên kết về ảnh gốc. Kiểm riêng asset có đúng nguồn, native/display size, aspect ratio và fit/crop theo spec không.
- Nếu chưa xem được UI thực tế hoặc chưa truy cập được demo, ghi `blocked`/`unverified`; không tuyên bố khớp dựa trên báo cáo Codex. Nêu chính xác công cụ/nguồn cần khôi phục.

## 5. Lặp sửa đến khi đạt

- Còn sai lệch hoặc kiểm tra fail → cập nhật bản ghi, tăng round, giao lại Codex ở bước 3 với các lỗi cụ thể và bằng chứng mới nhất, rồi review lại toàn bộ tiêu chí bị ảnh hưởng, kể cả vùng đã pass có thể bị regression.
- **Không có số vòng tối đa mặc định. Không dừng chỉ vì đã sửa 5 lần, không tự nhận “gần giống là đủ”, không chuyển sang Claude tự code.** Tiếp tục đến khi Claude xác minh tất cả tiêu chí khớp demo và kiểm tra liên quan pass, hoặc user yêu cầu dừng/đổi phạm vi.
- Mỗi vòng phải chẩn đoán và điều chỉnh dựa trên kết quả, không gửi lại cùng yêu cầu mơ hồ. Khi sai lệch lặp lại không tiến triển, yêu cầu Codex tìm nguyên nhân (font/asset thiếu, CSS constraint, scale, render pipeline...) và thử cách xử lý có căn cứ. Không hạ chuẩn để thoát vòng lặp.
- Theo dõi danh sách vùng đã pass và số vòng không tiến triển cho từng ID. Nếu cùng lỗi không cải thiện sau **2 vòng sửa liên tiếp**, lượt kế tiếp bắt buộc Codex trả chẩn đoán nguyên nhân, bằng chứng và cách xử lý khác trước khi áp dụng sửa; không lặp lại cách đã thất bại. Đây là mốc đổi cách xử lý, không phải giới hạn số vòng. Sau mọi lượt sửa, kiểm regression các vùng liên quan; nếu hỏng lại thì mở lại đúng ID.
- Lưu UI spec, nguồn/kích thước asset, phase, kết quả xác nhận hiểu, ID pass/fail, số vòng không tiến triển và bằng chứng mới nhất vào bản ghi bước 2 để tiếp tục nhất quán qua các phiên.
- Khi bị chặn thực sự bởi quyền/quota, công cụ không khả dụng, thiếu asset/demo, hoặc không xác nhận executor đã dừng: lưu trạng thái và báo điều kiện cần khôi phục, không gọi dồn vô ích hoặc vượt quyền. Đây là tạm chặn, không phải hoàn thành; khi điều kiện được khôi phục tiếp tục từ bản ghi. Tôn trọng giới hạn thời gian/chi phí nếu user đã đặt.
- Cập nhật ngắn cho user sau mỗi vòng: vùng đã đạt, sai lệch còn lại và việc Codex sẽ sửa tiếp.

## 6. Báo cáo kết quả

Chỉ kết luận hoàn thành khi Claude đã review trực quan bản cuối và toàn bộ tiêu chí đã đạt. Báo ngắn: UI/màn hình đã làm, số vòng, bằng chứng demo so với kết quả, kiểm tra đã pass. Phân biệt rõ viewport/trạng thái đã kiểm với phần chưa kiểm; không tuyên bố pixel-perfect nếu không có phép đo chứng minh. Nếu blocked hoặc user dừng, ghi phần còn thiếu cùng task_id để tiếp tục.
