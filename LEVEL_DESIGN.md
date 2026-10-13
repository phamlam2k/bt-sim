# LEVEL DESIGN — Cú hook, thang cấp bậc và giáo trình

Cập nhật: 2026-10-13. Đi kèm `MVP_PLAN.md` (hệ thống và kiến trúc), `RESEARCH_AMAZON.md` (nguồn) và `MONETIZATION.md` (kiếm tiền).
Các ngưỡng số là giá trị khởi điểm để chỉnh qua playtest. Toàn bộ nội dung trong game bằng tiếng Anh.

---

## 1. Cú hook

**"LeetCode đo bạn giải được bao nhiêu bài. Game này đo bạn đang ở cấp nào trong nghề."**

Người chơi không khoe số bài đã làm mà khoe một **cấp bậc đã được kiểm chứng**: "SDE I (Junior) tại Rainforest Cloud, 214 CR đã review, bắt được 91% lỗi, xử lý 12 sự cố".

Ba vòng lặp giữ người chơi:

| Vòng | Thời lượng | Nội dung | Thứ đem đi khoe |
|---|---|---|---|
| **Ngắn** | 5 phút mỗi ngày | **Daily CR:** mỗi ngày một CR, mọi người chơi cùng một bài | Kết quả dạng ô màu không lộ đáp án (kiểu Wordle), chuỗi ngày liên tiếp |
| **Vừa** | 20–40 phút | Một ngày làm việc trong cốt truyện, hoặc bài luyện theo kỹ năng yếu | Kỹ năng mới được kiểm chứng |
| **Dài** | Vài tuần | Kỳ xét thăng cấp | Cấp bậc mới, thẻ thăng cấp |

**Mười phút đầu tiên** phải tự bán được game: người chơi nhận laptop, sửa một lỗi chính tả, tạo nhánh, commit, mở CR, được duyệt, và nhìn thay đổi của mình đi qua Pipeline tới production. Kết thúc bằng thẻ "Your first change is live" có nút chia sẻ.

---

## 2. Hai thước đo tách biệt

Đây là quyết định thiết kế quan trọng nhất của bản này.

| | **Cấp bậc đã kiểm chứng** | **Xếp loại trong cốt truyện** |
|---|---|---|
| Đo cái gì | Kỹ năng thật của người chơi | Công trạng được ghi nhận, quan hệ, chính trị |
| Lấy từ đâu | Bài thi thăng cấp không có gợi ý | Kỳ đánh giá hiệu suất trong game |
| Ảnh hưởng | Mở level tiếp theo, hiện trên hồ sơ công khai | Lương, cổ phiếu, diễn biến truyện, kết cục |
| Tính chất | Nghiêm túc, công bằng, không mua được | Châm biếm, có thể bất công như ngoài đời |

Nhờ tách ra, game vừa giữ được chất châm biếm (làm giỏi chưa chắc được xếp loại cao) vừa có một cấp bậc đáng tin để khoe.

---

## 3. Cổng thăng cấp

Muốn lên cấp phải qua **đủ ba lớp**:

1. **Hoàn thành cốt truyện của level** (mọi nhiệm vụ bắt buộc).
2. **Đủ bằng chứng** — số liệu tính trên các lần làm *gần nhất*, không cộng dồn, để không cày số lượng mà qua được. Ví dụ để lên SDE II:
   - 25 CR gần nhất: bắt được ít nhất 80% lỗi, báo sai dưới 15%.
   - 3 sự cố gần nhất: khắc phục trong thời gian mục tiêu, cập nhật ticket đủ.
   - Mọi kỹ năng bắt buộc của level đạt mức "Reliable" (mục 4).
   - Không gây ra Sev-1 trong 2 tuần game gần nhất.
3. **Qua bài thi thăng cấp ("Promo Review")** — một "tuần thử thách" nén lại, khoảng 30–40 phút:
   - Không gợi ý, không dịch code sang lời thường, đồng hồ đầy đủ, bất kể đang chơi chế độ nào.
   - Mỗi mảng một bài: một tình huống Git, ba CR, một quyết định Pipeline, một sự cố, một COE (từ SDE II thêm một bài thiết kế).
   - Bài lấy từ kho biến thể chưa gặp, mỗi lần thi một bộ khác.
   - Phải đạt ngưỡng ở **từng** mảng; giỏi một mảng không bù được mảng khác.

**Trượt thì sao:**

- Nhận bản nhận xét theo từng mảng, viết như phản hồi của hội đồng thăng cấp.
- Game mở sẵn các bài luyện đúng mảng yếu.
- Thi lại sau khi hoàn thành các bài luyện đó (không khóa theo thời gian thật quá 1 ngày).
- Số lần thi không giới hạn và không tốn tiền.

**Dung hòa với người mới:** học và luyện thì có đầy đủ gợi ý (chế độ Guided); chỉ riêng bài thi là không. Người mới không bao giờ bị kẹt, nhưng muốn có cấp bậc thì phải tự làm được.

### Giữ cho cấp bậc đáng tin

| Nguy cơ | Biện pháp |
|---|---|
| Sửa dữ liệu trên máy để tự lên cấp | Bài thi chấm ở server: máy gửi seed và nhật ký hành động, server chạy lại engine để tính kết quả (engine vốn đã tất định) |
| Tra đáp án trên mạng | Kho biến thể lớn, đáp án bài thi không gửi về máy, thứ tự và chi tiết thay đổi theo seed |
| Mua cấp bậc | Không bán bất cứ thứ gì ảnh hưởng tới bài thi (xem `MONETIZATION.md`) |
| Cày số lượng | Bằng chứng tính trên cửa sổ gần nhất và theo tỷ lệ đúng, không theo tổng |
| Cấp bậc bị hiểu là chứng chỉ nghề | Hồ sơ ghi rõ "Simulated career rank" và "Not affiliated with any company"; không gọi là chứng chỉ |

---

## 4. Hệ thống kỹ năng

Bảy mảng kỹ năng, mỗi mảng gồm các kỹ năng nhỏ. Mỗi kỹ năng có 4 mức:

| Mức | Nghĩa | Đạt bằng cách |
|---|---|---|
| 0 Seen | Đã được giới thiệu | Gặp trong cốt truyện |
| 1 Practiced | Làm được khi có gợi ý | Hoàn thành nhiệm vụ |
| 2 Reliable | Làm đúng ổn định, không gợi ý | Đúng 4 trong 5 lần gần nhất, không dùng gợi ý |
| 3 Under pressure | Làm đúng khi có áp lực thời gian | Đúng trong bài thi hoặc trong sự cố |

| Mảng | Nội dung |
|---|---|
| **Git & quản lý mã nguồn** | Nhánh, commit, rebase, xung đột, revert, cherry-pick, bisect, mô hình nhánh |
| **Code review** | Lỗi logic, test, giám sát, rollback, bảo mật cơ bản, cách viết nhận xét |
| **Testing** | Test đơn vị, tích hợp, mock, test chập chờn, tháp test |
| **CI/CD & triển khai** | Các chặng pipeline, feature flag, canary, bake, rollback, migration dữ liệu |
| **Vận hành** | Dashboard, alarm, runbook, xử lý sự cố, COE, SLO |
| **Kiến trúc** | Timeout/retry, idempotent, API, mô hình dữ liệu, cache, hàng đợi, phân mảnh, nhất quán |
| **Cộng tác** | Ticket, ước lượng, cập nhật tiến độ, design doc, phản hồi, làm việc liên team |

Màn hình "Skills" hiện dạng biểu đồ radar; đây cũng là một phần của hồ sơ công khai.

---

## 5. Thang cấp bậc

| Level | Tên hiển thị | Thời lượng mục tiêu | Chủ đề | Trạng thái |
|---|---|---|---|---|
| 0 | Intern | 1,5–2 giờ | Đưa được một thay đổi nhỏ lên production an toàn | Bản phát hành 1 (miễn phí) |
| 1 | SDE I · Junior (L4) | 10–15 giờ | Làm ticket độc lập, review, đi kèm on-call | Bản phát hành 2 |
| 2 | SDE II · Mid (L5) | 15–20 giờ | Sở hữu một tính năng từ thiết kế tới vận hành | Bản phát hành 3 |
| 3 | Senior (L6) | 20+ giờ | Thiết kế ở quy mô lớn, dẫn dắt sự cố, dự án di trú | Sau đó |
| 4 | Principal (L7) | — | Kiến trúc liên team, chiến lược | Cuối game, để sau |

Mỗi level chia 3 bậc nhỏ (ví dụ "SDE I · Tier 2") theo số kỹ năng đã đạt mức 3, để người chơi có thứ để tiến và để khoe giữa hai lần thăng cấp. Thời lượng là mục tiêu thiết kế, chưa đo.

---

## 6. Giáo trình chi tiết theo level

### Level 0 — Intern: "Your first change" (5 ngày game, 12 nhiệm vụ)

| Ngày | Nhiệm vụ | Người chơi làm gì | Học được |
|---|---|---|---|
| 1 | Setup & first ticket | Clone repo, đọc ticket, tạo nhánh `feature/QS-101-fix-typo`, sửa, commit, push, mở CR | Vòng đời một thay đổi; vì sao không commit thẳng lên `main`; cách đặt tên nhánh và viết commit message |
| 1 | Your change goes live | Xem CR đi qua Pipeline | Các chặng triển khai; vì sao phải chờ |
| 2 | Address feedback | Nhận nhận xét của mentor, sửa, commit bổ sung, trả lời từng nhận xét | Phép lịch sự của người gửi CR; CR nhỏ dễ duyệt hơn |
| 2 | Stay in sync | `main` đã thay đổi; kéo về, gặp xung đột đơn giản, giải quyết | Vì sao có xung đột; cách đọc dấu xung đột |
| 3 | Red build | Build fail vì test đơn vị; đọc log, chọn cách sửa | Test đơn vị để làm gì; đọc log CI |
| 3 | Write the test | Chọn các trường hợp cần test cho một hàm (trường hợp thường, biên, lỗi) | Nghĩ theo trường hợp biên |
| 4 | Review your first CR | Review 2 CR dễ: thiếu mô tả, thiếu test, secret nằm lộ | Bốn thứ phải kiểm tra khi review |
| 4 | Oops | Lỡ commit một file cấu hình có mật khẩu; xử lý đúng cách | Xóa file chưa đủ: phải đổi mật khẩu, vì lịch sử Git vẫn giữ |
| 5 | Ask well | Bị kẹt; chọn cách hỏi (hỏi trống không, hay nêu đã thử gì) | Cách đặt câu hỏi; khi nào nên hỏi |
| 5 | Standup | Báo cáo tiến độ trong 3 câu | Hôm qua, hôm nay, vướng gì |
| 5 | Shadow a page | Ngồi xem mentor xử lý một alarm | Sự cố trông thế nào; khôi phục trước |
| 5 | **Return-offer review** | Bài thi: 1 tình huống Git, 2 CR, 1 câu hỏi Pipeline | Cổng lên SDE I |

### Level 1 — SDE I · Junior: "Own your tickets" (6 tuần game, khoảng 30 nhiệm vụ)

| Tuần | Chủ đề | Nhiệm vụ chính | Học được |
|---|---|---|---|
| 1 | **Git workflow** | Rebase nhánh lên `main` mới; gộp commit trước khi merge; cất việc dở (stash) để sửa việc gấp; revert một commit xấu đã lên `main` | Rebase khác merge thế nào và khi nào dùng; lịch sử sạch để làm gì; vì sao revert chứ không xóa lịch sử trên nhánh chung |
| 1 | Hai mô hình nhánh | Team mình dùng **trunk-based** (nhánh ngắn, merge sớm, pipeline tự triển khai). Nhận một ticket bên thư viện client có đánh số phiên bản, dùng **GitFlow** (`develop`, `release/*`, `hotfix/*`) | Mỗi mô hình hợp với loại sản phẩm nào; vì sao dịch vụ chạy liên tục thường chọn trunk-based |
| 2 | **Code review** | Review 8 CR với đủ loại lỗi; viết nhận xét (chọn giọng: ra lệnh, hỏi, gợi ý); một CR 800 dòng: yêu cầu tách nhỏ | Bốn thứ phải kiểm tra; nhận xét về code chứ không về người; quyền từ chối CR quá to |
| 3 | **Testing** | Thêm test tích hợp cho một API; thay phụ thuộc bên ngoài bằng mock; lần ra một test chập chờn (phụ thuộc thời gian, thứ tự chạy) | Tháp test; vì sao "chạy lại cho qua" là nợ; test nào bắt được lỗi ở chặng nào |
| 3 | Bền vững khi gọi dịch vụ khác | Sửa một lời gọi không có timeout; thêm retry có backoff và jitter; làm một thao tác thành idempotent | Vì sao retry bừa làm sập hệ thống; thế nào là idempotent |
| 4 | **Triển khai an toàn** | Bọc tính năng sau feature flag; đổi cấu trúc dữ liệu theo cách tương thích ngược (thêm trước, chuyển sau, xóa cuối); xin vượt khung cấm triển khai và bị từ chối | Tách "triển khai" khỏi "bật tính năng"; vì sao mọi thay đổi phải rollback được |
| 4 | Hotfix | Lỗi trên bản phát hành của thư viện client: tạo `hotfix/*`, sửa, cherry-pick về `develop` | Luồng hotfix; cherry-pick |
| 5 | **Vận hành** | Đọc dashboard, đặt ngưỡng alarm; đi kèm ca trực; Sev-2 đầu tiên (rollback tự chạy); Sev-2 thứ hai (rollback không đủ); viết COE với 5 Whys | Khôi phục trước; ghi mọi thứ vào ticket; COE tìm nguyên nhân hệ thống chứ không tìm người để trách |
| 6 | Ra mắt | Tuần đóng băng code; RainConf; Sev-1 do tải; trình bày ở họp vận hành | Phối hợp liên team khi có sự cố |
| 6 | **Promo Review → SDE II** | Bài thi đầy đủ (mục 3) | Cổng lên SDE II |

### Level 2 — SDE II · Mid: "Own a feature" (8 tuần game, khoảng 40 nhiệm vụ)

Mở app mới: **Design Board** (kéo thả khối kiến trúc, chạy mô phỏng tải trong giới hạn ngân sách) và **Docs** (lắp luận điểm vào design doc).

| Tuần | Chủ đề | Nhiệm vụ chính | Học được |
|---|---|---|---|
| 1 | Từ yêu cầu tới kế hoạch | Nhận một yêu cầu mơ hồ từ PM; hỏi lại cho rõ; chia thành ticket; ước lượng | Làm rõ yêu cầu; chia nhỏ việc; ước lượng có khoảng |
| 2 | **Thiết kế API** | Thiết kế API cho tính năng mới: đặt tên, phân trang, mã lỗi, đánh phiên bản, khóa idempotent | Hợp đồng API khó đổi sau khi phát hành; tương thích ngược |
| 2 | Mô hình dữ liệu | Chọn khóa, chỉ mục cho các kiểu truy vấn; phát hiện truy vấn quét toàn bảng | Thiết kế theo cách truy vấn |
| 3 | **Design doc** | Viết design doc: bối cảnh, mục tiêu, các phương án và đánh đổi, rủi ro; buổi họp đọc tài liệu im lặng rồi bị chất vấn | Viết để người khác phản biện được; nêu phương án đã loại và vì sao |
| 4 | **Kiến trúc cơ bản** | Trên Design Board: thêm cache (đặt ở đâu, hết hạn thế nào), chuyển việc nặng sang hàng đợi, giới hạn tốc độ, cân bằng tải | Cache mang lại gì và hỏng thế nào; đồng bộ khác bất đồng bộ; áp lực ngược |
| 5 | Dẫn một nhánh việc | Giao ticket cho intern, review CR của họ (chấm cả cách giải thích); bị team khác chặn; nhánh sống lâu gây xung đột lớn → chuyển sang feature flag | Kèm người; vì sao nhánh sống lâu là rủi ro |
| 5 | Truy tìm lỗi hồi quy | Một lỗi xuất hiện đâu đó trong 60 commit; dùng `git bisect`; cứu commit lỡ mất bằng `reflog` | Tìm kiếm nhị phân trên lịch sử |
| 6 | **Sẵn sàng vận hành** | Tự đánh giá theo checklist trước khi ra mắt; thử tải; đặt SLO và ngân sách lỗi; viết runbook | Ra mắt được không chỉ là "code chạy" |
| 7 | On-call chính | Ba sự cố, một trong đó do phụ thuộc bên ngoài hỏng; làm người điều phối một Sev-2 nhỏ | Giảm tải có chủ đích; điều phối khác với tự sửa |
| 8 | Ra mắt và hồ sơ thăng cấp | Chọn bằng chứng cho hồ sơ thăng cấp; xin xác nhận từ team khác | Ghi lại tác động của mình |
| 8 | **Promo Review → Senior** | Bài thi có thêm một bài thiết kế chấm bằng mô phỏng tải | Cổng lên Senior |

### Level 3 — Senior: "Design for scale" (phác thảo)

- **Kiến trúc quy mô lớn:** phân mảnh dữ liệu, sao chép và mức nhất quán, đa vùng, kiến trúc theo ô (cell), giảm tải, tối ưu chi phí.
- **Dự án di trú:** ghi song song, đổ dữ liệu cũ, chuyển lưu lượng dần, đường lùi.
- **Dẫn dắt sự cố lớn** với vai trò người điều phối Sev-1; duyệt COE của người khác.
- **Tài liệu 6 trang** và thuyết phục nhiều team.
- **Quản lý nợ kỹ thuật:** chọn trả nợ nào, thuyết phục PM.
- **Kèm cặp và duyệt thiết kế** của SDE II.

### Level 4 — Principal (để sau)

Kiến trúc liên tổ chức, chọn hướng công nghệ, xử lý bất đồng giữa các team. Ít code, nhiều ảnh hưởng.

---

## 7. App Git (mới, có từ Level 0)

- **Hình thức:** đồ thị commit trực quan ở trên, bảng lệnh ở dưới. Người chơi bấm nút lệnh hoặc gõ lệnh; cả hai đều được.
- Chế độ Guided hiện sẵn các lệnh hợp lý cho tình huống; Realistic phải tự gõ.
- Mỗi lệnh có nút "Why?" và hiện trước kết quả trên đồ thị trước khi chạy.
- Là một mô phỏng Git giới hạn (không phải Git thật): chỉ hỗ trợ các lệnh giáo trình dùng tới.
- Lệnh theo level: Intern — `clone, status, switch -c, add, commit, push, pull`, giải quyết xung đột. SDE I — `rebase, squash, stash, revert, cherry-pick, tag`. SDE II — `bisect, reflog`.

---

## 8. Kho bài luyện ("Dojo") và Daily CR

- **Dojo:** bài luyện ngắn theo từng kỹ năng, có gợi ý đầy đủ, không ảnh hưởng cốt truyện. Game tự đề xuất bài theo kỹ năng yếu. Đây là nơi tạo ra "con số lớn" để khoe (số CR đã review, số sự cố đã xử lý).
- **Daily CR:** mỗi ngày một CR giống nhau cho mọi người. Kết quả chia sẻ không lộ đáp án: số lỗi tìm được, thời gian, số gợi ý, chuỗi ngày.
- **Weekly Incident:** mỗi tuần một sự cố lớn, có bảng xếp hạng theo thời gian khắc phục.

**Nhu cầu nội dung** (đây là nút thắt thật, không phải code):

| Thời điểm | Puzzle review | Tình huống Git | Sự cố | Bài thiết kế |
|---|---|---|---|---|
| Bản phát hành 1 (Intern) | 30 (gồm 14 Daily đầu) | 10 | 2 | — |
| Bản phát hành 2 (SDE I) | 120 | 30 | 12 | — |
| Bản phát hành 3 (SDE II) | 250 | 50 | 25 | 20 |

Mỗi puzzle × 3 ngôn ngữ, kèm gợi ý 3 nấc và lời giải thích. Quy trình: template → AI sinh biến thể → script kiểm tra → người duyệt → playtest. Con số trên là ước lượng nhu cầu, chưa tính theo năng suất thực tế.

---

## 9. Hồ sơ công khai và chia sẻ

- **Trang hồ sơ** có đường dẫn riêng: cấp bậc, bậc nhỏ, radar kỹ năng, số liệu (CR đã review, tỷ lệ bắt lỗi, số sự cố, thời gian khắc phục trung bình), chuỗi Daily, đồ trên bàn làm việc.
- **Thẻ thăng cấp:** ảnh tạo tự động khi lên cấp, vẽ theo kiểu thư thông báo thăng chức, sẵn kích thước cho LinkedIn, X, Facebook.
- **Huy hiệu nhúng:** ảnh SVG gắn vào README trên GitHub hoặc trang cá nhân, tự cập nhật.
- **Bạn bè và nhóm:** theo dõi bạn bè, bảng xếp hạng theo lớp/trường/công ty, so kết quả Daily.
- **"Career Recap":** tổng kết theo mùa (kiểu Wrapped): lỗi hay sót nhất, sự cố nhớ đời, danh hiệu.
- **Quyền riêng tư:** hồ sơ mặc định công khai nhưng tắt được; số lần thi trượt không hiện.
- Mọi thẻ chia sẻ có dòng "Simulated career rank · Not affiliated with any company".

---

## 10. Ảnh hưởng tới kỹ thuật

- **Cần tài khoản và server** (bản 3 chạy thuần trên trình duyệt): đăng nhập, lưu tiến độ, chấm bài thi, hồ sơ, bảng xếp hạng. Đề xuất Supabase (Postgres + đăng nhập + hàm phía server).
- **Engine chạy được ở cả trình duyệt và server** — đã đúng với thiết kế hiện tại vì engine là TypeScript thuần và tất định.
- **Nội dung bài thi và đáp án ở phía server;** nội dung cốt truyện và Dojo có thể gửi về máy.
- **Web là nền tảng chính.** Bản Steam (nếu có) là bản đóng gói về sau.
- Chơi thử Intern **không cần đăng ký**: tiến độ lưu trên máy, tạo tài khoản thì được chuyển sang. Chỉ yêu cầu tài khoản khi muốn nhận cấp bậc hoặc chơi trên máy khác.
- Lưu, tạm dừng và quay lại: xem `MVP_PLAN.md` mục 15.

---

## 11. Giữ chân người chơi

Nguyên tắc: giữ chân bằng **lý do để quay lại**, không bằng **hình phạt khi vắng mặt**. Game về áp lực công sở mà lại tự gây áp lực lên đời thật của người chơi thì phản tác dụng, và người chơi sẽ gỡ.

### 11.1 Lý do để quay lại

| Cơ chế | Cách làm |
|---|---|
| **Kết thúc mỗi ngày bằng một câu hỏi mở** | Lịch ngày mai hiện một cuộc họp lạ; sếp nhắn "let's talk tomorrow"; CR của bạn sẽ tới Prod vào sáng mai |
| **Daily CR** | 5 phút, mỗi ngày một bài, mọi người cùng làm, so với bạn bè |
| **Chuỗi ngày theo lịch công sở** | Chỉ tính ngày thường; cuối tuần mặc định được nghỉ mà không mất chuỗi |
| **Ngày phép (PTO)** | Mỗi 5 ngày chơi tích được 1 ngày phép, tự dùng khi bỏ lỡ một ngày để giữ chuỗi. Không bán ngày phép bằng tiền thật |
| **Thưởng "nghỉ ngơi đủ"** | Nhiệm vụ đầu tiên của mỗi ngày thật có Energy đầu ngày cao hơn. Thưởng cho việc chơi đều, không thưởng cho việc cày liền nhiều giờ |
| **Tiến độ luôn nhìn thấy** | Thanh "còn bao nhiêu tới kỳ xét thăng cấp" theo từng lớp điều kiện; radar kỹ năng; bậc nhỏ trong level |
| **Weekly Incident** | Mỗi tuần một sự cố lớn có bảng xếp hạng |
| **Bạn bè và nhóm** | Xem bạn vừa lên cấp, so Daily, bảng xếp hạng lớp/trường |
| **Mùa** | Mỗi quý một chủ đề, bài mới, tổng kết "Career Recap" |

### 11.2 Những điểm người chơi hay bỏ, và cách xử lý

| Điểm rơi | Vì sao bỏ | Xử lý |
|---|---|---|
| 10 phút đầu | Chưa thấy hay, quá nhiều chữ | Vào việc ngay: sửa, commit, thấy thay đổi lên production trong 10 phút; hướng dẫn lồng trong nhiệm vụ, không có màn giải thích dài |
| Puzzle khó đầu tiên | Thấy mình kém | Gợi ý 3 nấc, dịch code sang lời thường; thẻ giải thích viết theo hướng "ai cũng sót lỗi này lần đầu" |
| Giữa level | Lặp lại, không thấy tiến | Mỗi tuần game một chủ đề và một cơ chế mới; bậc nhỏ trong level; một sự kiện truyện mỗi tuần |
| Trượt bài thi | Nản | Nhận xét theo từng mảng, chỉ rõ còn thiếu bao nhiêu; bài luyện mở sẵn đúng chỗ yếu; chỉ thi lại phần chưa đạt, không thi lại cả bài |
| Tường trả tiền sau Intern | Chưa đủ gắn bó | Cho chơi ngày đầu của SDE I; Intern kết thúc bằng tình huống dang dở |
| Hết nội dung | Không còn gì làm | Daily, Weekly, Dojo, mùa; thông báo rõ khi nào có level mới |
| Vắng lâu rồi quay lại | Quên đang làm gì, ngại bắt đầu lại | Thẻ "Where you left off", tóm tắt truyện, bài nhớ lại 2 phút, không mất gì |

Sửa so với mục 3: khi trượt bài thi thăng cấp, người chơi **chỉ thi lại các phần chưa đạt**; phần đã đạt được giữ trong 7 ngày.

### 11.3 Thông báo

- Mặc định **tắt**; người chơi tự bật.
- Tối đa 1 thông báo mỗi ngày, có giờ yên lặng do người chơi đặt.
- Viết theo giọng trong game nhưng **không giả khẩn cấp**: "Your CR reached Prod" thì được; "Production is down, come back now!" thì không.
- Email: một bản tóm tắt tuần, có nút hủy đăng ký rõ ràng.

### 11.4 Những thứ cố ý không làm

- Không khóa chơi bằng thời gian chờ thật.
- Không trừ điểm, tụt cấp hay để việc xấu xảy ra vì vắng mặt.
- Không thông báo gây tội lỗi ("You broke your streak").
- Không bán khôi phục chuỗi ngày.
- Không ép phiên chơi dài: game tự đề xuất nghỉ sau khoảng 45–60 phút.

### 11.5 Đo lường

Theo dõi từ bản phát hành 1:

- Tỷ lệ quay lại sau 1, 7, 30 ngày.
- Số phiên mỗi tuần và độ dài phiên.
- Phễu theo từng nhiệm vụ: bao nhiêu người bắt đầu, bao nhiêu người xong; nhiệm vụ nào rơi nhiều nhất thì sửa trước.
- Tỷ lệ mở lại thành công đúng chỗ đã dừng (lỗi ở đây là lỗi nghiêm trọng).
- Sau khi trượt bài thi: bao nhiêu người thi lại, bao nhiêu người bỏ.
- Tỷ lệ bật thông báo và tỷ lệ tắt sau khi bật.

Ngưỡng mục tiêu tự đặt cho bản phát hành 1 (giả thuyết, chỉnh sau khi có số thật): quay lại sau 1 ngày trên 35%, sau 7 ngày trên 15%, sau 30 ngày trên 7%.
