---
description: Giao UI từ /desgin cho Codex → Claude so với demo → yêu cầu Codex sửa liên tục đến khi khớp.
argument-hint: "[--model <id|default>] [--effort <value|default>] [yêu cầu UI, đường dẫn/link demo hoặc tiếp tục kết quả /desgin]"
---

Thực hiện yêu cầu UI sau bằng quy trình **Claude chốt demo → Codex dựng UI → Claude review trực quan → Codex sửa → lặp đến khi khớp demo**.

Yêu cầu bổ sung của user:
$ARGUMENTS

Trước khi lấy demo, parse cấu hình theo `../references/codex-settings.md`; dùng phần tham số còn lại làm yêu cầu UI.

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

**Cấu hình Codex:** đọc và áp dụng `../references/codex-settings.md` (tính từ thư mục command) trước khi xử lý task. Resolve option đầu lệnh và cấu hình đã lưu, rồi giữ snapshot cho mọi handoff/retry/tiếp tục. `/pcset` đặt mặc định cho task mới; `--model`/`--effort` chỉ áp dụng task này.
- Claude tạo và cập nhật `~/.claude/pc-handoffs/<task_id>.json`, ngoài repo, với `workflow: "pcdesgin"`, task_id an toàn và duy nhất, workspace, branch, phạm vi, demo tham chiếu, tiêu chí, round, status, owner, session/job/PID nếu có, trạng thái lượt chạy, các sai lệch còn lại và lịch sử ngắn kèm đường dẫn bằng chứng. Chỉ Claude ghi bản ghi; không lưu secret/log dài. Nếu không lưu được, báo rõ và giữ trạng thái trong hội thoại.
- Tiếp tục phiên cũ thì đọc bản ghi và đối chiếu workspace/trạng thái thực tế; giữ số vòng và sai lệch đang mở. Không áp dụng giới hạn 10 retry hay tự chuyển sang Claude sửa của `/pc` và `/pcq`. Không sửa bộ đếm của task thuộc các workflow đó.
- Chỉ một executor ghi tại một thời điểm. Claude đợi Codex kết thúc trước khi chạy UI, review hoặc giao sửa tiếp. Timeout không chứng minh đã dừng: kiểm tra đúng session/job, chờ hoặc dừng đúng lượt rồi xác nhận kết thúc. Nếu không xác nhận được, ghi blocked; không chạy chồng hay giết tiến trình không rõ nguồn gốc.

## Hợp đồng hiểu yêu cầu và nghiệm thu

Trước handoff đầu tiên, Claude đọc `../references/handoff-contract.md` tương đối với file command này trong plugin **pc-commands** đang cài, một lần mỗi task. Áp dụng ID task/plan/attempt, tiêu chí có ID, phân biệt giả định và yêu cầu, cách phản biện có bằng chứng và trạng thái executor/reviewer riêng. Đưa nội dung cần thiết vào prompt; không giả định Codex đọc được tài liệu hay lịch sử Claude. Task nhỏ dùng mẫu rút gọn, không thêm vòng xác nhận hiểu. Nếu thiếu tài liệu, báo lỗi đóng gói và giữ tối thiểu các quy tắc này: gắn kết quả đúng task/plan/attempt, đối chiếu từng tiêu chí, chưa verify thì chưa accepted; không tự coi hợp đồng đã được đọc.

Mỗi handoff write phải kèm khối **Chỉ dẫn thực thi phải chuyển đến Codex** trong hợp đồng; không gửi khối write cho lượt review read-only.

Áp dụng phần **Duyệt và review có trọng tâm** trong hợp đồng: duyệt phạm vi một lần, Codex tự kiểm trước bàn giao, Claude kiểm chứng bằng chứng, gom feedback theo vòng và tách must_fix/suggestion. Suggestion không tự mở vòng sửa.

## Giảm thời gian bàn giao và thực thi

- Claude gửi bản đồ code ngắn đã tìm được: file + symbol liên quan, pattern có thể tái dùng, lệnh build/test chính xác và lỗi tái hiện. Codex kiểm chứng phần liên quan rồi sửa; không quét lại toàn repo hoặc lập lại plan đã duyệt nếu không có bằng chứng mới.
- Gom các item liên quan trong cùng phạm vi đã duyệt vào một lượt thực thi; Codex sửa và kiểm tra phù hợp trước khi trả kết quả. Không tách mỗi file thành một lượt Agent. Với UI giữ các mốc review của chế độ compact/staged đã chọn.
- Retry hoặc tiếp tục cùng task: ưu tiên `--resume` CHỈ khi runtime đang cài hỗ trợ và xác nhận phiên cuối thuộc đúng task_id + workspace, đã kết thúc, không có task khác chạy xen vào. Wrapper hiện tại ánh xạ flag này thành `--resume-last`, không phải chọn session ID; nếu không chứng minh đúng phiên thì dùng `--fresh` và gói bàn giao tự đủ. Ghi session/job vào bản ghi khi runtime cung cấp; không đoán flag hay ID.
- Kể cả resume, gửi đủ phạm vi, tiêu chí, trạng thái và ngân sách retry; giữ prompt gọn bằng tóm tắt quyết định, lỗi mới nhất và cách đã thử, không chép toàn hội thoại/log/diff. Resume không reset retry và không bỏ kiểm tra môi trường hay verify độc lập.
- Dùng tìm kiếm có mục tiêu và batch các lượt đọc độc lập; chỉ chạy kiểm tra phù hợp phần thay đổi rồi kiểm tra bắt buộc của repo. Không chạy lại toàn bộ suite khi không có thay đổi mới hay nghi ngờ chưa giải quyết.
- Giữ model/effort do `/pcset` chọn. Không tự hạ effort, đổi model hoặc bật dịch vụ tính phí để lấy tốc độ. Không đo thời gian chờ hoặc trạng thái Codex chỉ để báo cáo; giữ prompt và kết quả ngắn.


- **Khảo sát vừa đủ rồi giao:** với task rõ, phạm vi hẹp, Claude chỉ xác định điểm sửa, pattern liên quan và cách kiểm; không tự giải xong bài toán rồi yêu cầu Codex giải lại. Dừng khám phá khi đủ thông tin lập tiêu chí và giao việc. Chỉ mở rộng tìm kiếm khi có câu hỏi cụ thể chưa trả lời; không quét toàn repo theo thói quen. Task lớn vẫn khảo sát dependency/rủi ro cần thiết. Giữ các bước review/duyệt bắt buộc của command.
- **Một gói thực thi có thể hoàn tất:** ghi rõ đầu ra cần đạt, điểm bắt đầu (file/symbol), ràng buộc và lệnh kiểm; Codex triển khai rồi tự sửa lỗi build/test trong phạm vi cùng lượt trước khi bàn giao. Không trả sớm chỉ để hỏi tiếp tục cho việc đã được duyệt; không thêm lượt xác nhận riêng cho task rõ. Vẫn báo blocked ngay khi thiếu quyền, nguồn hoặc quyết định thật sự; không tự lặp vô hạn hay mở vòng Agent con. UI staged giữ các mốc review đã chọn.
- **Tái dùng dữ liệu theo nội dung:** giữ code map, kết quả khám phá và lệnh kiểm trong bản ghi task; chỉ đọc lại phần đã đổi hoặc còn nghi vấn. HEAD không đủ kiểm tra độ mới khi có thay đổi chưa commit: đối chiếu diff/nội dung liên quan. Khi retry, gửi bản tóm tắt tự đủ của yêu cầu hiện hành và phần thay đổi/lỗi mới; không gửi lại toàn bộ log và lịch sử. Không tạo cache dùng chung giữa các task hoặc tin kết quả cũ khi môi trường đã đổi.
- **Kiểm tra theo phạm vi một lần có bằng chứng:** Codex chạy kiểm tra hẹp liên quan trước, rồi kiểm tra bắt buộc của repo; gom chỉnh sửa liên quan trước build tốn thời gian. Claude đọc diff và đối chiếu tiêu chí, dùng lại log kiểm tra hợp lệ theo hợp đồng; chỉ chạy lại khi có lý do cụ thể (thay đổi mới, thiếu bằng chứng, mâu thuẫn, rủi ro hoặc quy định repo). Không chạy hai build trên cùng workspace đồng thời; review UI thực tế vẫn bắt buộc.
- **Không theo dõi Codex:** giao một lượt thực thi và chờ chính kết quả trả về. Không polling status/job, không heartbeat, không gọi handoff mới để hỏi tiến độ và không lưu `progress`, `job_id` hoặc `last_checked_at` chỉ để theo dõi.
- **Đo để tìm chỗ chậm:** Claude lưu mốc bắt đầu/kết thúc từng phase và số handoff/retry khi quan sát được. Phân biệt khảo sát, review plan, chờ user, khoảng từ dispatch đến kết quả, và Claude verify; khoảng dispatch không mặc nhiên là thời gian model suy luận. Nếu runtime không tách queue/execution thì ghi chưa biết, không đoán. Báo cuối ngắn phần chiếm thời gian nhiều nhất khi có dữ liệu; không thêm tool call chỉ để lấy đồng hồ sau mỗi thao tác nhỏ. Không hứa tốc độ tăng trước khi có phép so sánh tương đương.

## Điều phối job, tránh chờ và retry thừa

Không đọc `live-progress.md` và không tự động hiển thị tiến độ. Sau khi giao Codex, chờ kết quả; chỉ xử lý output cuối cùng hoặc lỗi/timeout. Không gọi status/result để theo dõi.
- **Preflight một lần mỗi task:** trước handoff đầu, xác nhận plugin/runtime đã cài, workspace, trạng thái Git và lệnh kiểm tra liên quan; đọc hướng dẫn runtime để xác định cách gọi và kết quả. Không tự cài hoặc cập nhật dependency. Giữ kết quả trong bản ghi; chỉ kiểm lại phần thay đổi hoặc đang lỗi. Kiểm tra đúng workspace và Unity project trước mutation vẫn bắt buộc mỗi lượt.
- **Chờ kết quả trực tiếp:** dùng một lượt gọi Codex và nhận output cuối. Không yêu cầu chạy nền, không phân biệt hay lưu Agent task ID/runtime job ID để polling.
- **Xử lý timeout/output rỗng:** coi là lượt không có kết quả; chỉ retry khi có bằng chứng lượt trước đã trả lỗi hoặc đã kết thúc theo cơ chế gọi. Không tra status Codex.


- **Resume có đối chiếu:** Chỉ dùng resume khi công cụ gọi trả về cách resume rõ ràng và đúng workspace; nếu không, gọi lượt mới với prompt tự đủ.
- **Lỗi phải dẫn tới hành động khác:** lưu error_kind (`implementation`, `verification`, `transient`, `environment`, `permission`, `quota`, `unknown`), error_signature ngắn và consecutive_same_error. Cùng lỗi không tiến triển qua 2 lượt liên tiếp thì lượt tiếp theo phải có chẩn đoán và cách xử lý khác, không chỉ gửi lại prompt. Lỗi tạm thời tôn trọng Retry-After nếu có; lỗi cần đăng nhập/quota/quyền/asset thì lưu blocked và điều kiện tiếp tục, không đốt hết retry bằng các lần gọi chắc chắn thất bại. Giữ ngân sách và chính sách fallback của workflow.
- **Bàn giao kết quả có thể hành động:** mỗi item trả status, changed_files, checks (lệnh + kết quả), remaining, error_kind và next_action; giữ báo cáo ngắn, dẫn đường dẫn artifact khi log dài. Claude đọc diff, đối chiếu tiêu chí và verify độc lập sau khi executor dừng. Chỉ chạy lại kiểm tra cần thiết cho rủi ro/thay đổi; không bỏ kiểm tra bắt buộc. Chỉ ghi kết quả kiểm tra cần cho nghiệm thu.

## 3. Giao Codex dựng hoặc sửa UI

### Chọn chế độ review

- Claude chọn và lưu `review_mode` cùng lý do trước khi giao: `compact` khi UI nhỏ (một màn hình/component), demo/asset và tiêu chí rõ, ít trạng thái, không thay thành phần dùng chung có ảnh hưởng rộng. Còn lại dùng `staged`; không rõ mức rủi ro thì chọn staged.
- Compact: Codex xác nhận đọc được demo/asset và hiểu spec ngay trong lượt write trước khi sửa, rồi dựng đầy đủ, tự kiểm và trả review; thiếu nguồn hoặc mâu thuẫn quan trọng thì blocked trước phần sửa bị ảnh hưởng. Không thêm một lượt read-only riêng. Claude vẫn xem UI thực tế và kiểm đủ tiêu chí.
- Staged: dùng lượt xác nhận read-only và bốn giai đoạn bên dưới. Nếu compact phát hiện độ phức tạp/rủi ro lớn hơn, chuyển staged tại mốc executor đã dừng, giữ round, ID và phần đã đạt; không tự thêm cổng duyệt khi phạm vi không đổi.

### Xác nhận hiểu trước lượt sửa đầu tiên (chỉ staged)

- Gọi `codex:codex-rescue` (chạy nền khi Agent hỗ trợ) **READ-ONLY, KHÔNG --write**, kèm cấu hình bước 2, vai trò, UI spec và nguồn demo. Yêu cầu không sửa file, trả ngắn: màn hình/trạng thái sẽ dựng, demo và asset thực sự đọc được cùng kích thước gốc, viewport/DPR, component có thể tái dùng, điểm chưa rõ và kế hoạch theo giai đoạn.
- Claude kiểm tra câu trả lời với demo/spec, bổ sung thông tin hoặc sửa cách hiểu trước khi giao write. Không coi bước này là cổng duyệt thêm cho user. Chỉ hỏi user nếu thiếu quyết định không thể suy ra từ nguồn hiện có; nguồn bắt buộc không truy cập được thì blocked. Lặp xác nhận khi demo/phạm vi thay đổi đáng kể, không bắt làm lại mọi vòng sửa nhỏ.

### Triển khai theo giai đoạn (staged) hoặc một lượt (compact)

- Với staged, giao từng giai đoạn theo thứ tự: **(1) bố cục/kích thước → (2) font, asset, màu → (3) spacing và chi tiết → (4) tương tác và responsive theo yêu cầu**. Không để phần chi tiết che lấp sai bố cục; mỗi giai đoạn phải có UI render được để Claude review ở bước 4 trước khi chuyển tiếp. Nối tương tác tối thiểu sớm nếu cần để mở đúng trạng thái kiểm tra.
- Với compact, đặt `phase: full_ui`, gom bốn phần vào một lượt triển khai rồi review toàn bộ; vòng sửa chỉ nhắm lỗi và regression liên quan.
- Ghi `review_mode`, `phase` và tiêu chí của giai đoạn trong bàn giao; pass giai đoạn không phải hoàn thành task. Vòng sửa nhắm đúng giai đoạn/lỗi đang mở, giữ các vùng đã đạt; sau giai đoạn cuối vẫn review toàn bộ.

Gọi `codex:codex-rescue` (chạy nền khi Agent hỗ trợ) với `--write`, cấu hình ở trên và **gói bàn giao tự đủ ngữ cảnh**:

- task_id, round, đường dẫn tuyệt đối workspace/project, branch, file/phạm vi được sửa và thay đổi sẵn có phải giữ.
- Mục tiêu, demo tham chiếu truy cập được trong phiên Codex (đường dẫn tuyệt đối/URL và ảnh nếu tool hỗ trợ), viewport, asset, tiêu chí đối chiếu và các trạng thái cần dựng. Không chỉ nói “xem ảnh ở trên”; xác nhận Codex có thể đọc nguồn, nếu không thì báo blocked và cung cấp nguồn truy cập được.
- Lệnh chạy/build/test theo repo, cách mở đúng màn hình, dữ liệu/trạng thái để tái hiện; với Unity cần kiểm tra kết nối và đúng project bằng tool read-only trong chính phiên Codex trước khi sửa.
- Phần đã đạt cần giữ, danh sách sai lệch do Claude review, ảnh hiện tại so với demo, vị trí/kích thước mong muốn, lỗi kiểm tra và cách đã thử. Vòng đầu dùng checklist từ bước 1.
- Kèm UI spec có số đo, vai trò và quy tắc native size, giai đoạn hiện tại, kết quả xác nhận hiểu (hoặc yêu cầu tự đối chiếu trước mutation trong lượt compact đầu), danh sách ID đã pass và sai lệch cần sửa. Không dựa vào trí nhớ của phiên Codex trước.
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
- Lưu UI spec, nguồn/kích thước asset, review_mode, phase, kết quả xác nhận hiểu, ID pass/fail, số vòng không tiến triển và bằng chứng mới nhất vào bản ghi bước 2 để tiếp tục nhất quán qua các phiên.
- Khi bị chặn thực sự bởi quyền/quota, công cụ không khả dụng, thiếu asset/demo, hoặc không xác nhận executor đã dừng: lưu trạng thái và báo điều kiện cần khôi phục, không gọi dồn vô ích hoặc vượt quyền. Đây là tạm chặn, không phải hoàn thành; khi điều kiện được khôi phục tiếp tục từ bản ghi. Tôn trọng giới hạn thời gian/chi phí nếu user đã đặt.
- Cập nhật ngắn cho user sau mỗi vòng: vùng đã đạt, sai lệch còn lại và việc Codex sẽ sửa tiếp.

## 6. Báo cáo kết quả

Chỉ kết luận hoàn thành khi Claude đã review trực quan bản cuối và toàn bộ tiêu chí đã đạt. Báo ngắn: UI/màn hình đã làm, số vòng, bằng chứng demo so với kết quả, kiểm tra đã pass. Phân biệt rõ viewport/trạng thái đã kiểm với phần chưa kiểm; không tuyên bố pixel-perfect nếu không có phép đo chứng minh. Nếu blocked hoặc user dừng, ghi phần còn thiếu cùng task_id để tiếp tục.

