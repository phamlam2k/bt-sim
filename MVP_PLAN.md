# MVP PLAN — BIG TECH SWE SIMULATOR (bản "Rainforest")

Cập nhật: 2026-10-13 (bản 3: thêm chế độ cho người mới và hệ thống gợi ý, bản đồ văn phòng, lương và mua sắm. Bản 2: sửa theo `RESEARCH_AMAZON.md`, thêm Pipeline, chọn ngôn ngữ).
Các con số cân bằng và ước lượng thời gian là giá trị khởi điểm để chỉnh qua playtest, không phải kết quả đã kiểm chứng. Tên game và tên công cụ nhại đều là tạm.

---

## Thay đổi của bản 4 (2026-10-13) — đọc trước

Sản phẩm chuyển từ "game cốt truyện 3 giờ" sang "thang cấp bậc có kiểm chứng, vừa chơi vừa học". Chi tiết ở `LEVEL_DESIGN.md` và `MONETIZATION.md`. Những chỗ dưới đây **thay thế** nội dung tương ứng trong các mục bên dưới; phần còn lại của tài liệu (các app, chỉ số, gói công ty, gợi ý, bản đồ, lương) vẫn đúng.

| Chủ đề | Bản 3 | Bản 4 |
|---|---|---|
| Lên cấp | Theo kết quả kỳ đánh giá cuối tuần 6 | Qua **cổng thăng cấp 3 lớp**: xong cốt truyện, đủ bằng chứng, qua bài thi không gợi ý chấm ở server |
| Kỳ đánh giá hiệu suất (mục 5.3) | Quyết định kết cục | Giữ nguyên làm phần châm biếm; chỉ quyết định lương, cổ phiếu, diễn biến truyện. Không quyết định cấp bậc |
| Chế độ Guided (mục 9.1) | Áp dụng mọi nơi | Áp dụng cho học và luyện; bài thi thăng cấp luôn không gợi ý |
| Nội dung level | Cung truyện 7 tuần (mục 2) | Giáo trình theo nhiệm vụ, có Git workflow, testing, triển khai, vận hành, kiến trúc (`LEVEL_DESIGN.md` mục 6) |
| App mới | — | **Git** (đồ thị commit + lệnh), **Dojo**, **Daily CR**, **Skills**, **hồ sơ công khai** |
| Kỹ thuật | Chạy thuần trên trình duyệt | Cần tài khoản và server (đề xuất Supabase); bài thi chấm bằng cách chạy lại nhật ký hành động ở server |
| Nền tảng | Web demo, Electron sau | Web là chính; Steam là bản đóng gói về sau |
| Kiếm tiền | Chưa có trong MVP | Intern miễn phí, bán quyền truy cập từng level (`MONETIZATION.md`) |
| Đồ họa nhân vật | Hình tạm tới Giai đoạn 4 | Chủ dự án tự thiết kế; chốt phong cách sớm, vẫn dùng hình tạm trong Giai đoạn 0 |

### Lộ trình phát hành mới (thay mục 11)

| Bản | Nội dung | Mục đích | Điều kiện đi tiếp |
|---|---|---|---|
| **0. Prototype** | Một ngày chơi: Chat + Code Review + Git cơ bản + gợi ý, chỉ Python, không cần tài khoản | Kiểm tra lõi có cuốn không | 5 người thử (ít nhất 2 người không biết code), đa số muốn chơi tiếp, không ai kẹt quá 2 phút |
| **1. Intern (miễn phí, công khai)** | Level 0 đầy đủ (12 nhiệm vụ), 3 ngôn ngữ, Pipeline, bài thi "Return-offer", tài khoản, hồ sơ công khai, thẻ chia sẻ, Daily CR, trang "cửa giả" cho SDE I | Kiểm tra cú hook, vòng chia sẻ và ý định trả tiền | Chỉ tiêu ở `MONETIZATION.md` mục 6 và mục 12 của tài liệu này |
| **2. SDE I (trả tiền)** | Level 1 (khoảng 30 nhiệm vụ), on-call, COE, bản đồ văn phòng, lương và cửa hàng, Dojo, cổng thăng cấp đầy đủ, thanh toán | Doanh thu đầu tiên | Tỷ lệ mua và tỷ lệ hoàn thành level |
| **3. SDE II** | Level 2, Design Board, Docs, gói trọn bộ | Mở rộng chiều sâu; phần kiến trúc | — |
| **4. Về sau** | Senior, thuê bao Pro, bán cho tổ chức, gói công ty thứ hai, bản Steam | | |

**Về tốc độ:** dùng AI sinh code thì phần lập trình nhanh hơn nhiều so với ước lượng cũ. Ba thứ không nhanh lên theo: viết và **kiểm chứng** nội dung (mỗi puzzle × 3 ngôn ngữ + gợi ý + giải thích), cân bằng độ khó của cổng thăng cấp, và playtest với người thật. Tôi không đưa ra con số tuần mới vì nó phụ thuộc vào tốc độ làm nội dung, chưa đo được; nên đo ở bản 0 (mất bao lâu để có một puzzle hoàn chỉnh, đã kiểm chứng) rồi nhân lên theo bảng nhu cầu nội dung trong `LEVEL_DESIGN.md` mục 8.

---

## 0. Nguyên tắc của MVP: hẹp nhưng sâu

- **Hẹp:** 1 công ty (Rainforest), 2 level (Intern → SDE I), 1 team, 6 đồng nghiệp, 35 ngày trong game, khoảng 3 giờ chơi một lượt.
- **Sâu:** mọi thứ trong phạm vi đó có tiểu tiết đủ để một kỹ sư thật thấy "đúng quá".
- **Hai mục tiêu song song:** người chơi *muốn chơi lại* (mục 10) và *học được cách làm việc thật* (mục 9).
- **Người chưa biết code vẫn chơi được:** không ai bị kẹt, mọi bước đều có gợi ý và có lời giải thích "vì sao" (mục 9).
- **Quy trình là lõi, đời sống là lớp bọc:** bản đồ văn phòng, giải trí và mua sắm làm game dễ đắm chìm, nhưng không thay đổi chuỗi ticket → CR → Pipeline → sự cố → COE → đánh giá.
- **Toàn bộ game bằng tiếng Anh,** viết bằng câu ngắn và từ phổ thông vì nhiều người chơi không phải người bản ngữ; thuật ngữ nghề giữ nguyên và giải thích trong sổ thuật ngữ.
- **Ranh giới dạy và nhại:** quy trình kỹ thuật dạy đúng theo nguồn chính thức; văn hóa và chính trị công sở thì châm biếm và nói rõ là phóng đại.

### Câu hỏi MVP phải trả lời

1. Một ngày làm việc (chat + code + review) có cuốn không?
2. Người chơi có cảm nhận được hậu quả của lựa chọn cũ không?
3. Kết quả kỳ đánh giá có khiến họ muốn chơi lại theo cách khác không?
4. Chơi xong họ có kể lại được một CR đi tới production thế nào và một sự cố được xử lý ra sao không?

---

## 1. Phạm vi

### Có trong MVP

| Hạng mục | Nội dung |
|---|---|
| Công ty | Rainforest (nhại Amazon), mảng đám mây "Rainforest Cloud" (nhại AWS), team sở hữu dịch vụ hàng đợi tin nhắn "Queue Service" |
| Level | Intern (5 ngày, cũng là demo miễn phí) và SDE I / L4 (30 ngày, 6 tuần) |
| Cao trào | "RainConf" — hội nghị thường niên ở tuần 6, nơi tính năng của team ra mắt công khai; đóng băng code tuần 5 |
| Ngôn ngữ của code trong game | Người chơi chọn lúc bắt đầu: **Python, Java hoặc JavaScript** |
| Ứng dụng trên desktop | Chat, Ticket board, IDE, Code Review, **Pipeline**, Calendar, Pager + Dashboard, Wiki |
| Hệ thống | Flow/Energy/Stress, chỉ số ẩn, hậu quả đến trễ, on-call, COE, kỳ đánh giá xếp hạng |
| Lớp học tập | Wiki có nguồn, thẻ "Ngoài đời thật", sổ thuật ngữ |
| Trợ giúp người mới | 3 chế độ độ khó, thang gợi ý 3 nấc, nút "Why?", dịch code sang lời thường |
| Bản đồ văn phòng | 7 địa điểm bấm để tới (không điều khiển nhân vật đi lại), gặp trực tiếp sếp/lead, bóng bàn, máy chơi game |
| Lương và mua sắm | Nhận lương 2 tuần một lần, cửa hàng đồ cho bàn làm việc và đời sống |
| Kết cục | 4 kết cục + bản đánh giá viết theo đúng hành động của người chơi |
| Nền tảng | Web là chính, có tài khoản và server từ bản phát hành 1. Bản đóng gói cho Steam để sau |

### Cắt khỏi MVP

- System design kéo thả, viết 6-pager, level SDE II trở lên.
- Các công ty khác, DLC, thanh toán, Steam.
- Mobile, đa ngôn ngữ giao diện (chỉ tiếng Anh; chuỗi văn bản để sẵn trong file nội dung).
- Triển khai nhiều vùng trong Pipeline (chỉ mô phỏng một vùng).
- Email, trình duyệt giả, nhạc nền riêng, lồng tiếng.
- Điều khiển nhân vật đi lại tự do, hoạt ảnh nhân vật, văn phòng 3D.
- Game bóng đá hoàn chỉnh (chỉ làm dạng rút gọn, xem 4.11); mọi hình thức nạp tiền thật để mua đồ trong game.
- Nhà riêng, đời sống ngoài công ty (chỉ thể hiện qua vài món mua được).

---

## 2. Cấu trúc thời gian

- Ngày làm việc 9:00–18:00. Tốc độ đồng hồ là một tham số trong gói công ty; prototype đặt 1 phút game = 1,5 giây thật (một ngày ≈ 13,5 phút nếu không dừng), chỉnh sau playtest. Con số 0,5 giây của bản đầu quá nhanh cho người mới đọc diff.
- Đồng hồ **vẫn chạy** khi đọc chat, đọc diff, xử lý sự cố. Nó dừng khi: tạm dừng hoặc tự khóa màn hình (mục 15), đang đọc thẻ giải thích, thẻ sự kiện hay gợi ý.
- Hết việc trước 18:00 thì được "Clock out" sớm; không bao giờ bắt người chơi ngồi chờ.
- Làm thêm sau 18:00: mỗi giờ trừ 10 Energy đầu ngày hôm sau và cộng 5 Stress.
- Cuối ngày có màn tổng kết: việc xong, việc tồn, tin nhắn chưa trả lời, CR đang ở chặng nào.
- Khung cấm triển khai: ban đêm, cuối tuần, chiều thứ Sáu.
- Ngày lương: thứ Sáu của tuần 0, 2, 4, 6 (thưởng nhận việc khi chuyển từ Intern lên SDE I).
- Ở chế độ Guided, đồng hồ chạy chậm một nửa khi đang đọc diff và dừng hẳn khi đang đọc gợi ý hay lời giải thích.
- **Phóng đại có chủ ý:** ngoài đời kỳ đánh giá là hằng năm; game nén thành 6 tuần và nói rõ điều này.

### Cung truyện 7 tuần

| Tuần | Level | Diễn biến chính | Cơ chế mới |
|---|---|---|---|
| 0 | Intern | Onboarding, 3 ticket dễ, mentor kèm, quyết định có được nhận | Chat, Ticket, IDE, nộp CR, Pipeline (chỉ xem) |
| 1 | SDE I | Ticket thật đầu tiên, lần đầu review CR người khác | Code Review, Flow |
| 2 | SDE I | Nhận tính năng cho RainConf, 1:1 đầu tiên với sếp | Calendar, họp, Visibility, khảo sát hằng ngày |
| 3 | SDE I | Lỗi cũ bắt đầu nổ, đi kèm ca on-call (shadow), Sev-2 đầu tiên | Pager, Dashboard, COE, hậu quả trễ |
| 4 | SDE I | PM thêm yêu cầu, đồng nghiệp xin giúp, trình bày ở họp vận hành | Họp vận hành tuần, đánh đổi việc mình và việc người |
| 5 | SDE I | Đóng băng code, test chập chờn, viết tự đánh giá, peer feedback | Self-review, peer feedback 60 từ |
| 6 | SDE I | RainConf: Sev-1 khi đang on-call chính. Kết quả đánh giá | Kỳ đánh giá, kết cục |

---

## 3. Chọn ngôn ngữ

- Màn hình đầu game: chọn Python, Java hoặc JavaScript. Đổi được trong Cài đặt giữa các ngày (không đổi giữa một CR đang mở).
- Lựa chọn ảnh hưởng tới: diff trong Code Review, code hiện ra trong IDE, tên file và lệnh build trong Pipeline.
- **Mỗi puzzle chỉ thiết kế một lần** ở dạng không phụ thuộc ngôn ngữ (bối cảnh, loại lỗi, hậu quả), rồi viết thành 3 bản code. Vị trí dòng lỗi lưu riêng cho từng bản.
- **Quy tắc cho MVP:** chỉ dùng loại lỗi diễn đạt được ở cả 3 ngôn ngữ. Lỗi đặc thù ngôn ngữ (ví dụ so sánh `==` của JavaScript, tham số mặc định khả biến của Python) để dành cho bản sau.
- Tin nhắn và comment của NPC không nhắc cú pháp cụ thể; chỗ nào buộc phải nhắc thì dùng biến thay thế theo ngôn ngữ (ví dụ `{null}` → `None` / `null` / `undefined`).
- **Chi phí:** 40 puzzle thành 120 bản code. Giảm công bằng cách dùng AI dịch nháp từ bản gốc, người duyệt lại, và một script kiểm tra tự động (mục 8.6).
- Ghi chú trung thực với người chơi: Amazon dùng Java là chính; thẻ "Ngoài đời thật" nói rõ điều này.

---

## 4. Các ứng dụng trên desktop

### 4.1 Chat (kiểu Slack)

- Kênh: `#queue-team`, `#queue-oncall`, `#random`, tin nhắn riêng với 6 NPC.
- Mỗi tin nhắn cần phản hồi có 2–4 lựa chọn; mỗi lựa chọn ghi hiệu ứng lên chỉ số ẩn.
- Chế độ Không làm phiền: giữ Flow, nhưng tin của sếp để quá 60 phút thì giảm Trust.
- Tiểu tiết:
  - Chỉ báo "đang gõ…" rồi dừng, rồi gõ lại.
  - Sếp nhắn "got a sec?" và 4 phút sau mới nhắn tiếp.
  - Trạng thái NPC: đang họp, OOO, khác múi giờ nên trả lời chậm.
  - PM gắn `@here` cho việc không gấp.
  - Kênh im lặng cả ngày, rồi dồn 30 tin trong 10 phút.
  - NPC nhắc lại chuyện cũ ("lần trước bạn cũng nói sẽ xem").

### 4.2 Ticket board (nhại SIM)

- Cột: Backlog, In Progress, In Review, Done. Ticket có điểm công việc, hạn, độ ưu tiên, người yêu cầu.
- Ticket sự cố (Sev) cũng nằm ở đây và là nơi ghi mọi cập nhật khi xử lý sự cố.
- Tiểu tiết: ticket mô tả một dòng "fix the thing from standup"; ticket bị đổi độ ưu tiên giữa chừng; ticket trùng lặp; ticket bị chặn bởi team khác không ai trả lời; ticket tự sinh khi ai đó bỏ qua bước phê duyệt hai người.

### 4.3 IDE (làm ticket)

Người chơi **không viết code thật**.

- Mở ticket và làm việc: tiến độ tăng theo `tốc độ gốc × hệ số Flow`. Code hiện ra theo tiến độ bằng ngôn ngữ đã chọn.
- Mỗi ticket có 2–3 **điểm quyết định**, ví dụ:
  - Test thỉnh thoảng fail: (a) thêm retry — nhanh, cộng Tech Debt; (b) điều tra 40 phút; (c) hỏi mentor.
  - Viết test tích hợp hay bỏ qua (ảnh hưởng tới việc lỗi bị bắt ở chặng nào trong Pipeline).
  - Thêm metric và alarm hay không.
  - Sửa tận gốc hay vá tạm.
- Nộp **CR** → NPC review sau một khoảng trễ → sửa theo comment (1–3 vòng) → merge → vào Pipeline.
- Tiểu tiết: build cache hỏng phải build lại; reviewer nghỉ phép; comment "nit:" vô tận từ một senior; merge conflict; môi trường dev từ xa mất kết nối.

### 4.4 Code Review (nhại CRUX) — cơ chế đinh

- Người chơi nhận **CR** của đồng nghiệp: diff 20–80 dòng bằng ngôn ngữ đã chọn.
- **Bốn thứ phải kiểm tra** (đúng theo thực hành công khai của Amazon):
  1. Lỗi logic trong diff.
  2. Có test đơn vị và test tích hợp cho thay đổi không.
  3. Có metric/alarm để phát hiện khi nó hỏng không.
  4. Thay đổi có rollback an toàn được không (ví dụ đổi schema dữ liệu không tương thích ngược).
- Thao tác:
  - Bấm vào dòng → chọn loại nhận xét: Bug (chọn phân loại), Câu hỏi, Nit.
  - Đánh dấu thiếu test / thiếu giám sát / không rollback được ở mức cả CR.
  - Xem thêm ngữ cảnh file, chạy test (10 phút game), hỏi tác giả (trả lời đến sau qua Chat).
  - Kết luận: Approve hoặc Request changes.
- Chấm điểm:
  - **Bắt đúng:** cộng Review Quality và uy tín.
  - **Bỏ sót:** lỗi vào danh sách "lỗi tiềm ẩn", sẽ lộ ra ở một chặng Pipeline hoặc ở production.
  - **Báo sai:** tác giả giảm thiện cảm, CR bị chậm.
  - **Quá nhiều nit:** giảm thiện cảm. **Duyệt không đọc** (dưới 20 giây thật): nhanh, rủi ro tối đa.
- Khoảng 1/4 số CR là **sạch**, để từ chối bừa cũng bị phạt.
- Loại lỗi (đều diễn đạt được ở cả 3 ngôn ngữ): giá trị rỗng, off-by-one, nuốt exception, retry không giới hạn hoặc không backoff, N+1 query, thiếu phân trang, thiếu timeout cho lời gọi từ xa, cache không vô hiệu hóa, lộ secret, log dữ liệu cá nhân, race condition đơn giản, thao tác không idempotent bị retry.
- Tiểu tiết: CR tên "small fix" dài 800 dòng; tác giả nhắn riêng "approve giúp, đang gấp"; senior khó chịu khi bị người mới bắt lỗi; CR có mô tả trống.

### 4.5 Pipeline (mới)

Cho người chơi thấy một thay đổi đi từ merge tới khách hàng thế nào.

- Mỗi CR đã merge là một thẻ đi qua các chặng: **Build → Beta → Gamma → One-box → Prod**.
- Thời gian nén: khoảng 2 ngày game để tới Prod nếu không vướng gì.
- Mỗi chặng làm gì:
  - **Build:** test đơn vị. Fail thì quay lại IDE.
  - **Beta:** test tích hợp. Lỗi tiềm ẩn bị bắt ở đây nếu CR có test tích hợp.
  - **Gamma:** môi trường giống production, chạy test canary.
  - **One-box:** một máy nhận khoảng 10% lưu lượng trong thời gian "bake". Alarm kêu thì **tự rollback**.
  - **Prod:** triển khai cuốn chiếu, tối đa 1/3 số máy mỗi lần.
- Lỗi càng lộ muộn càng đắt: bị bắt ở Beta chỉ mất thời gian; tự rollback ở One-box mất thời gian và một ít uy tín; lọt tới Prod thành sự cố.
- Người chơi làm được:
  - Xem trạng thái, log của từng chặng.
  - Chạy lại chặng fail vì test chập chờn.
  - Xin vượt khung cấm triển khai hoặc rút ngắn bake: cần một NPC phê duyệt (cơ chế hai người), tốn thiện cảm và tăng rủi ro.
  - Rollback tay.
- Pipeline bị khóa khi alarm mức cao của team đang kêu, và trong tuần đóng băng code.
- Tiểu tiết: CR của bạn kẹt sau CR của người khác đang fail; chặng Gamma fail vì môi trường chứ không phải vì code; chiều thứ Sáu mọi thứ đứng yên tới thứ Hai; đa số lần triển khai không ai ngồi canh.

### 4.6 Calendar

- Họp cố định: standup 9:30, 1:1 với sếp hằng tuần, sprint planning thứ Hai, **họp vận hành hằng tuần**.
- Họp đặt Flow về 0 và tốn Energy. Có thể từ chối hoặc "vào họp nhưng làm việc riêng" (rủi ro bị gọi tên).
- **Họp vận hành:** một vòng quay ngẫu nhiên chọn team phải trình bày số liệu. Tuần sau ca trực, người chơi chắc chắn phải trình bày báo cáo on-call.
- **Họp đọc tài liệu:** 10–20 phút đầu im lặng đọc; đường dẫn chỉ được gửi khi họp bắt đầu.
- Tiểu tiết: lời mời đến trước 5 phút; hai cuộc họp trùng giờ; họp kết thúc sớm là phần thưởng nhỏ.

### 4.7 Pager + Dashboard (on-call)

- Page có thể đến bất kỳ lúc nào, kể cả 2:47 sáng. Người chơi có **15 phút game để xác nhận**.
- Sự cố mở một ticket Sev và một cuộc gọi. NPC làm **người điều phối cuộc gọi**: phân vai, hỏi tình hình, không tự điều tra.
- Dashboard: 4 biểu đồ (tỷ lệ lỗi, độ trễ p99, CPU, độ dài hàng đợi), nhật ký triển khai, log trực tiếp.
- Hành động: rollback, tắt feature flag, scale up, restart, gọi người dự phòng (cứu thời gian, mất điểm ghi nhận).
- **Phải ghi cập nhật vào ticket** mỗi 15 phút game; không ghi thì mất Trust.
- Nguyên tắc được dạy: **khôi phục trước, tìm nguyên nhân sau.** Sa vào đọc code giữa sự cố bị người điều phối nhắc.
- 3 sự cố trong MVP:
  1. **Sev-2 dạy học:** Pipeline đã tự rollback khi người chơi vào; việc cần làm là xác nhận đã hồi phục và ghi ticket.
  2. **Sev-2 thứ hai:** sinh từ lỗi tiềm ẩn của chính người chơi nếu có; rollback không đủ vì dữ liệu đã bị ghi sai.
  3. **Sev-1 RainConf:** tính năng vừa ra mắt kéo lưu lượng tăng vọt; không do triển khai mà do tải, và các dịch vụ khác phụ thuộc vào Queue Service bắt đầu hỏng theo. Phải phối hợp với team khác.
- Tiểu tiết: báo động giả; biểu đồ trễ 2 phút; người triển khai gần nhất đang OOO; kỹ sư senior team bên cạnh tự vào cuộc gọi; lãnh đạo vào hỏi "ETA?".

### 4.8 COE (sau sự cố)

Mini-game viết báo cáo Correction of Error theo cấu trúc thật:

- **Dòng thời gian:** tự điền từ nhật ký; người chơi đánh dấu các mốc phát hiện, chẩn đoán, khắc phục.
- **5 Whys:** xếp các thẻ "vì sao" thành chuỗi tới nguyên nhân gốc. Dừng sớm ở "do người X sơ suất" bị chấm thấp.
- **Việc cần làm:** chọn từ danh sách; mỗi việc phải gán độ ưu tiên, người chịu trách nhiệm và hạn. Việc bạn nhận sẽ thành ticket thật trong các tuần sau.
- **Ba số đo:** thời gian phát hiện, chẩn đoán, khắc phục.
- Lựa chọn chính trị (phần nhại): viết trung thực, hay viết sao cho team mình trông ổn.

### 4.9 Wiki nội bộ

- Đóng vai "sổ luật": checklist review CR, runbook on-call, sơ đồ các chặng Pipeline, mẫu COE, bảng nguyên tắc lãnh đạo (viết lại, không chép nguyên văn).
- **Là tài liệu học thật:** nội dung dựa trên nguồn công khai, mỗi trang có đường dẫn "đọc bản gốc".
- Luật bổ sung dần: sau một sự cố, checklist thêm một dòng mà người chơi phải áp dụng từ đó.
- Tiểu tiết: trang lỗi thời, runbook trỏ tới lệnh không còn tồn tại, trang hỏi đáp nội bộ có câu hỏi 4 năm chưa ai trả lời.

### 4.10 Lớp vỏ "laptop công ty"

- Taskbar, đồng hồ, pin, biểu tượng VPN.
- **Khảo sát hằng ngày:** mỗi sáng một popup hỏi một câu (ví dụ về sếp), chấm thang 5. Câu trả lời gộp lại có ảnh hưởng nhẹ tới sếp.
- Sự kiện vặt: VPN rớt; popup bắt học khóa bảo mật; máy đòi khởi động lại để cập nhật; hết pin khi làm thêm giờ quá lâu.
- Nút **"Stand up"** ở góc màn hình: rời laptop, mở bản đồ văn phòng.

### 4.11 Bản đồ văn phòng (mới)

Cho người chơi cảm giác "ở trong công ty" mà không cần điều khiển nhân vật.

- **Hình thức:** sơ đồ mặt bằng 2D. Mỗi phòng là một điểm bấm; ảnh đại diện của NPC hiện ở nơi họ đang đứng. Bấm vào phòng là tới, tốn 2–5 phút game.
- **Mỗi địa điểm là một cảnh tĩnh:** ảnh nền + chân dung NPC + hộp thoại có lựa chọn.
- **7 địa điểm:**

| Địa điểm | Làm được gì | Tác dụng |
|---|---|---|
| Bàn của bạn | Mở laptop (toàn bộ các app) | Nơi làm việc chính; đồ mua về hiện ở đây |
| Bàn của lead/mentor | Hỏi trực tiếp về ticket, CR, lỗi đang kẹt | Có câu trả lời ngay thay vì chờ chat; hỏi nhiều quá thì giảm thiện cảm |
| Phòng sếp | Xin phê duyệt, xin lùi hạn, báo tin xấu, 1:1 | Một số việc **chỉ làm được trực tiếp**; báo tin xấu sớm và trực tiếp thì ít mất Trust hơn |
| Phòng họp | Standup, họp vận hành, họp đọc tài liệu | Các cuộc họp trong Calendar diễn ra ở đây |
| Bếp | Cà phê, ăn trưa, chuyện phiếm | Hồi Energy; gặp ngẫu nhiên người khác (kể cả sếp của sếp: cơ hội tăng hiển thị) |
| Góc giải trí | Bóng bàn, máy chơi game | Giảm Stress, tăng Trust với đồng nghiệp chơi cùng; tốn thời gian |
| Sảnh/quầy đồ | Cửa hàng, nhận đồ đã mua, về sớm | Vào cửa hàng (4.12) |

- **Gặp trực tiếp khác nhắn tin thế nào:** nhanh hơn và tăng Trust nhiều hơn, nhưng mất Flow của bạn và làm phiền họ. Nếu họ đang họp hay vắng thì chuyến đi mất công; **xem trạng thái của họ trong Chat trước khi đi** là thói quen game dạy.
- **Việc cần phê duyệt:** vượt khung cấm triển khai, rút ngắn bake, nghỉ phép, đổi hạn ticket đều cần sếp hoặc lead đồng ý. Xin qua chat thì chờ lâu; tới gặp thì có ngay nhưng phải chọn lúc.
- **Bóng bàn:** mini-game thật, rất đơn giản (kiểu Pong, một ván khoảng 60 giây). Thắng thua không quan trọng bằng việc chơi với ai.
- **Máy chơi game (bóng đá):** dạng rút gọn cho MVP: chọn đối thủ, thời gian trôi, hiện kết quả và một đoạn hội thoại. Không làm game bóng đá thật và không dùng tên thương hiệu.
- **Cân bằng:** giải trí giảm Stress thật sự, nhưng chơi trong giờ cao điểm hoặc khi đang có sự cố thì sếp để ý. Mỗi hoạt động giảm tác dụng nếu lặp lại trong ngày.
- **Chất châm biếm của Rainforest:** công ty nổi tiếng tiết kiệm, nên bàn bóng bàn cũ, máy chơi game đời trước, cà phê miễn phí nhưng đồ ăn vặt phải trả tiền. Công ty khác sau này sẽ có văn phòng khác hẳn.
- **Quy tắc để bản đồ không thành việc vặt:** không việc gì trong quy trình chính bắt buộc phải đi lại nhiều lần; mọi chuyến đi đều là một lựa chọn có lợi ích rõ ràng; từ laptop luôn có nút tắt tới người mình cần gặp.

### 4.12 Lương và mua sắm (mới)

- **App "Pay":** bảng lương mỗi kỳ, hiện lương gộp, thuế, chi phí sinh hoạt trừ sẵn, và số còn lại để tiêu. Có dòng cổ phiếu thưởng "chưa tới hạn nhận" để người chơi hiểu vì sao người ta ở lại.
- **Thu nhập:** trợ cấp Intern → thưởng nhận việc → lương SDE I mỗi 2 tuần. Kết cục tốt ở kỳ đánh giá cho thêm cổ phiếu. Mọi con số nằm trong file cấu hình của công ty.
- **Cửa hàng**, ba nhóm:

| Nhóm | Ví dụ | Tác dụng |
|---|---|---|
| Bàn làm việc | Bàn phím cơ, tai nghe chống ồn, màn hình thứ hai, ghế tốt, cây cảnh, đèn | Hiện trên bàn; mỗi món một lợi ích nhỏ (tai nghe: mất ít Flow hơn khi bị ngắt; màn hình thứ hai: mở được hai app cạnh nhau; ghế: Energy giảm chậm hơn) |
| Đời sống | Thẻ tập gym, nệm tốt, chuyến đi cuối tuần, bữa tối ngon | Hồi Stress hoặc Energy đầu ngày |
| Trang trí | Poster, cốc, mô hình, hình nền laptop, giao diện IDE | Chỉ để đẹp và thể hiện cá tính |

- **Cân bằng:** lợi ích nhỏ (mỗi món không quá 10%), không món nào thay được kỹ năng. Tiền không đủ mua hết trong một lượt chơi, nên phải chọn.
- **Lựa chọn có ý nghĩa:** tiêu để giảm áp lực hôm nay, hay để dành; vài sự kiện chat xoay quanh tiền (đồng nghiệp rủ góp quà, rủ đi ăn).
- **Không có nạp tiền thật.** Mọi thứ mua bằng lương trong game.

---

## 5. Hệ thống chỉ số

### 5.1 Chỉ số hiển thị

| Chỉ số | Thang | Quy tắc khởi điểm |
|---|---|---|
| **Flow** | 0–100 | +4 mỗi 10 phút game làm liên tục một việc. Mở Chat: mất 30% Flow hiện có. Đổi ticket: mất 50%. Họp hoặc sự cố: về 0. Hệ số năng suất = 0,5 + 1,5 × Flow/100 |
| **Energy** | 0–100 | Đầu ngày 100 trừ nợ làm thêm. Giảm 8/giờ khi làm việc, 12/giờ khi họp, 15/giờ khi xử lý sự cố. Cà phê +15 (lần hai +7). Ăn trưa +20, tốn 45 phút. Dưới 30: Flow tăng chậm một nửa |
| **Stress** | 0–100 | Tích lũy qua ngày. Mỗi đêm −10, cuối tuần −25 (không hồi khi đang on-call). Trên 70: giao diện nhiễu, góc bàn đổi trạng thái. Trên 90 trong 3 ngày: kiệt sức, nghỉ ốm bắt buộc 3 ngày |

### 5.2 Chỉ số ẩn

| Chỉ số | Ý nghĩa | Tăng/giảm bởi |
|---|---|---|
| **Value** | Giá trị thật đã tạo ra | Ticket xong, lỗi bắt được, sự cố xử lý, giúp đồng nghiệp |
| **Credit** | Giá trị được ghi nhận | Value × hệ số hiển thị: báo cáo trong kênh, nhắc trong 1:1, trình bày ở họp vận hành |
| **Tech Debt** | Nợ kỹ thuật của service | Vá tạm, bỏ test, duyệt bừa. Làm ticket sau chậm hơn và tăng xác suất sự cố |
| **Trust (từng NPC)** | −100 đến 100 | Lựa chọn trả lời, giữ lời hứa, chất lượng review, tốc độ phản hồi |
| **Review Quality** | Hồ sơ review | Bắt đúng, bỏ sót, báo sai, thời gian phản hồi |
| **Ops** | Năng lực vận hành | Thời gian xác nhận page, thời gian khắc phục, số hành động sai, cập nhật ticket đều không, chất lượng COE |
| **Latent Bugs** | Danh sách lỗi đã lọt | Mỗi lỗi có chặng Pipeline sẽ bắt được nó (tùy CR có test không) hoặc khung thời gian nổ ở Prod, kèm đường dẫn về CR gốc |

Khoảng cách giữa **Value** và **Credit** là trục châm biếm của game.

### 5.3 Kỳ đánh giá

- Điểm = 40% Credit + 20% Trust của sếp + 15% peer feedback + 15% Ops + 10% Review Quality − các khoản phạt.
- **Tự đánh giá:** người chơi chọn 3–5 thành tích từ nhật ký của mình để nộp; chọn sai cái đáng kể làm giảm Credit.
- **Peer feedback:** người chơi viết cho đồng nghiệp bằng cách ghép cụm câu trong giới hạn **60 từ**; đồng nghiệp viết lại cho mình tùy theo Trust.
- Xếp hạng chung với 5 đồng nghiệp mô phỏng; luôn có người ở đáy.
- Bản đánh giá là văn bản ghép từ nhật ký hành động: trích đúng CR đã duyệt bừa, đúng sự cố, đúng câu peer feedback.
- 4 kết cục: Xuất sắc · Đạt · Cần cải thiện (kế hoạch kèm cặp) · Kế hoạch cải thiện bắt buộc (kết thúc lượt chơi).
- Sau kết cục, game lộ các chỉ số ẩn.
- **Lưu ý về độ chân thực:** phần này dựa trên nguồn ẩn danh, không có tài liệu chính thức. Coi là châm biếm; thẻ "Ngoài đời thật" phải nói rõ điều đó.

---

## 6. Nhân vật

| Vai | Tính cách | Chức năng trong gameplay |
|---|---|---|
| Sếp trực tiếp | Bận, mơ hồ, chịu áp lực từ trên; kiêm điều phối dự án | Nguồn Trust quan trọng nhất, 1:1 hằng tuần |
| Mentor (senior) | Giỏi, hay nit, ít thời gian | Trợ giúp có giới hạn, reviewer khó tính, người dự phòng khi on-call |
| Đồng nghiệp cùng cấp | Thân thiện nhưng đang cạnh tranh cùng suất | Xin approve gấp, tranh công |
| PM | Nhiệt tình, hay thêm yêu cầu | Nguồn scope creep và deadline |
| Kỹ sư team khác | Trả lời chậm, khác múi giờ | Nguồn bị chặn việc; cần phối hợp trong Sev-1 |
| Sếp của sếp | Xuất hiện hiếm: sự cố, họp vận hành | Nhân hệ số hiển thị rất lớn; người điều phối cuộc gọi Sev-1 |

Mỗi NPC có giọng văn riêng. Phần này cần người từng làm ở Amazon đọc duyệt.

### Hình ảnh nhân vật

Vẫn không cần nhân vật đi lại hay hoạt ảnh. Nhưng vì có bản đồ văn phòng và gặp trực tiếp, nhu cầu hình ảnh tăng so với bản 2:

| Cần có | Mức độ cho MVP |
|---|---|
| Ảnh đại diện trong Chat, CR, ticket, bản đồ | 6 ảnh nhỏ, phong cách phẳng thống nhất |
| Chân dung bán thân cho cảnh gặp trực tiếp | 6 NPC × 3 biểu cảm (bình thường, hài lòng, khó chịu) |
| Ảnh nền địa điểm | 7 cảnh tĩnh |
| Sơ đồ mặt bằng | 1 hình |
| Bàn làm việc | 1 cảnh có các vị trí đặt đồ; khoảng 20 món đồ vẽ rời; 3 trạng thái theo Stress |
| Người chơi | Nhập tên, chọn 1 trong vài ảnh đại diện có sẵn |
| Cuộc gọi sự cố | Danh sách người tham gia và chỉ báo ai đang nói; không cần video |

Giai đoạn 0–2 dùng hình tạm (hình khối, ảnh xám). Chỉ thuê hoặc vẽ bản chính thức ở Giai đoạn 4, khi đã biết game cuốn. Cần chọn một phong cách thống nhất cho toàn bộ trước khi vẽ.

---

## 7. Ngân sách nội dung

| Loại | Số lượng | Ghi chú |
|---|---|---|
| Puzzle review có lỗi | 30 thiết kế → **90 bản code** | 10 template lỗi × 3 biến thể × 3 ngôn ngữ |
| Puzzle review sạch | 10 thiết kế → **30 bản code** | Vài cái trông đáng ngờ nhưng đúng |
| Ticket | 25 | 8 cho Intern, 17 cho SDE I |
| Đoạn code hiển thị trong IDE | khoảng 15 đoạn × 3 ngôn ngữ | Chỉ để tạo cảm giác, không cần đúng tuyệt đối |
| Điểm quyết định trong IDE | 20 | Dùng lại giữa các ticket |
| Chuỗi sự kiện chat | 40 chuỗi, khoảng 300 tin nhắn | 25 cố định theo cốt truyện, 15 ngẫu nhiên |
| Sự cố | 3 | Mỗi cái có 1 nguyên nhân thật, 2 hướng đánh lạc, 1 bộ thẻ 5 Whys |
| Kịch bản Pipeline | 8 | Fail do test chập chờn, do môi trường, tự rollback, bị khóa… |
| Trang wiki | 8 | Có đường dẫn nguồn |
| Thẻ "Ngoài đời thật" | 10 | Mỗi thẻ 3–4 dòng, có nguồn |
| Mục sổ thuật ngữ | khoảng 30 | |
| Mẫu câu cho bản đánh giá và peer feedback | khoảng 80 | Ghép theo điều kiện |
| Gợi ý cho puzzle | 40 puzzle × 3 nấc | Nấc 1 và 2 dùng chung cho 3 ngôn ngữ; nấc 3 chỉ dòng theo từng bản |
| Lời giải thích sau mỗi CR | 40 | Lỗi là gì, vì sao nguy hiểm, ngoài đời sẽ gây ra chuyện gì |
| Lời dịch code sang lời thường | Theo từng dòng quan trọng của mỗi bản code | Dùng AI soạn nháp, người duyệt |
| Mục "Why?" | khoảng 40 | Gắn vào từng bước quy trình và từng nút quan trọng |
| Hội thoại gặp trực tiếp | khoảng 30 cảnh | Dùng lại nội dung chat ở nơi phù hợp, viết giọng nói chuyện |
| Gặp ngẫu nhiên ở bếp, góc giải trí | 15 | |
| Món đồ trong cửa hàng | khoảng 25 | Tên, giá, mô tả hài, tác dụng |

Dùng AI soạn nháp lúc phát triển, người duyệt lại từng cái. Không sinh nội dung lúc người chơi đang chơi.

---

## 8. Kiến trúc

### 8.1 Stack

React + TypeScript + Tailwind + Vite, Zustand cho state, Zod để kiểm tra file nội dung, Vitest cho test logic. (Game viết bằng TypeScript; "JavaScript" ở mục 3 chỉ là ngôn ngữ của code hiển thị trong game.)

### 8.2 Cấu trúc thư mục

```
src/
  engine/      # TypeScript thuần, không import React
    clock.ts  stats.ts  events.ts  rng.ts  log.ts
    review.ts      # chấm điểm code review
    pipeline.ts    # máy trạng thái các chặng triển khai
    incident.ts    # máy trạng thái sự cố
    coe.ts         # chấm điểm COE
    perf.ts        # kỳ đánh giá, xếp hạng
    hints.ts       # phát hiện người chơi kẹt, thang gợi ý
    economy.ts     # lương, số dư, tác dụng của đồ đã mua
    office.ts      # vị trí và lịch di chuyển của NPC, thời gian đi lại
  apps/        # chat, tix, ide, crx, pipeline, calendar, pager, coe, wiki, pay
  office/      # bản đồ, cảnh địa điểm, hội thoại trực tiếp, cửa hàng, bóng bàn
  shell/       # window manager, taskbar, khung bàn làm việc
  learning/    # thẻ "Ngoài đời thật", sổ thuật ngữ, nút "Why?", dịch code sang lời thường
  platform/    # lưu game (bản web trước)
  content/
    rainforest/
      pack.json  npcs.json  glossary.json     # pack.json là CompanyPack, xem 8.5
      tickets/  puzzles/  chats/  incidents/  pipeline/  wiki/  realworld/  review-text/
    testco/                                   # gói giả để test engine
scripts/
  validate-content.ts   # kiểm tra nội dung, xem 8.6
```

### 8.3 Ba quy tắc kiến trúc

1. **Engine không biết gì về giao diện.** Luật chơi chạy và test được không cần trình duyệt.
2. **Mọi hành động đi qua nhật ký hành động.** Dùng cho lưu game, viết bản đánh giá, dựng dòng thời gian COE, và phát lại để tìm lỗi.
3. **Ngẫu nhiên có seed.** Cùng seed và cùng hành động cho cùng kết quả.

### 8.4 Kiểu dữ liệu chính

```ts
type Lang = 'python' | 'java' | 'javascript';

type Condition =
  | { stat: string; op: '<' | '>' | '>=' | '<='; value: number }
  | { flag: string; is: boolean }
  | { day: { from: number; to: number } }
  | { all: Condition[] } | { any: Condition[] };

type Effect =
  | { stat: string; delta: number }
  | { setFlag: string; value: boolean }
  | { schedule: string; afterMinutes: number }    // hậu quả đến trễ
  | { addLatentBug: string }
  | { startIncident: string }
  | { unlockGlossary: string }
  | { showRealWorldCard: string };

interface ChatEvent {
  id: string;
  when: Condition;
  from: string;
  messages: { text: string; delayMs: number }[];  // text có thể chứa biến {null}, {lang}
  replies: { text: string; effects: Effect[] }[];
  expiresAfterMinutes?: number;
  onIgnored?: Effect[];
}

type PipelineStage = 'build' | 'beta' | 'gamma' | 'onebox' | 'prod';

interface ReviewPuzzle {
  id: string;
  author: string;
  title: string;
  description: string;
  bugs: {
    id: string;
    category: string;
    severity: 1 | 2 | 3;
    caughtAt: { ifTested: PipelineStage; ifUntested: PipelineStage };
    prodDetonation?: { chance: number; dayRange: [number, number]; incident?: string };
  }[];
  missing: { tests: boolean; monitoring: boolean; rollbackSafe: boolean };
  variants: Record<Lang, {
    files: { path: string; diff: string }[];
    bugLines: Record<string, number[]>;           // id lỗi → các dòng
    decoyLines: number[];                         // trông đáng ngờ nhưng đúng
  }>;
}

interface LevelConfig {
  id: string;
  days: number;
  taskMix: { tickets: number; reviews: number; meetings: number; oncall: number };
  interruptRate: number;
  ticketAmbiguity: number;
  unlockedApps: string[];
  perfWeights: Record<string, number>;
}

interface CompanyConfig {
  id: string;
  pipelineStages: { id: PipelineStage; bakeMinutes: number; autoRollback: boolean }[];
  deployBlackout: Condition[];                    // chiều thứ Sáu, cuối tuần, tuần đóng băng
  sevPolicy: { ackMinutes: number; ticketUpdateEveryMinutes: number };
}
```

### 8.5 Gói công ty (thiết kế để thêm công ty sau này)

Mỗi công ty là một **gói** tự chứa. Engine và các app không được biết tên công ty nào.

```ts
interface CompanyPack {
  id: string;                      // 'rainforest'
  version: string;
  theme: { colors: Record<string, string>; deskArt: string[]; sounds: Record<string, string> };
  terminology: Record<string, string>;   // 'changeRequest' → 'CR' | 'Diff' | 'CL'; 'incidentReport' → 'COE' | 'Postmortem'
  apps: { id: string; displayName: string; skin?: string; enabledFromLevel: string }[];
  ladder: LevelConfig[];                 // Intern, SDE I, ...
  customStats: { id: string; hidden: boolean; min: number; max: number; initial: number }[];
  pipeline: CompanyConfig['pipelineStages'];
  deployBlackout: Condition[];
  sevPolicy: CompanyConfig['sevPolicy'];
  perfModel: {
    cycleDays: number;
    weights: Record<string, number>;
    tiers: { id: string; label: string; minPercentile: number }[];
    forcedBottomShare: number;           // tỷ lệ bắt buộc ở đáy
  };
  cultureRules: { when: Condition; effects: Effect[] }[];   // luật ngầm của công ty
  office: {
    floorplan: string;
    locations: { id: string; name: string; background: string; travelMinutes: number;
                 activities: string[] }[];           // 'ask', 'approve', 'coffee', 'pingpong', ...
    npcSchedule: Record<string, { from: string; to: string; location: string }[]>;
  };
  economy: {
    currency: string;
    payEveryDays: number;
    payByLevel: Record<string, { gross: number; deductions: number }>;
    bonuses: { id: string; when: Condition; amount: number }[];
    shop: { id: string; name: string; price: number; group: 'desk' | 'life' | 'cosmetic';
            effects: Effect[]; deskSlot?: string }[];
  };
  mechanics: string[];                   // id các module cơ chế riêng, xem tầng 3
  contentRoot: string;
}
```

**Ba tầng mở rộng, từ rẻ tới đắt:**

| Tầng | Thêm bằng gì | Ví dụ |
|---|---|---|
| 1. Cấu hình | Sửa số trong gói | Chu kỳ đánh giá 6 tháng thay vì 1 năm; không có tỷ lệ đáy bắt buộc; pipeline ít chặng hơn |
| 2. Nội dung | Thêm file JSON | Ticket, puzzle, chat, sự cố, wiki, NPC của công ty đó |
| 3. Cơ chế | Viết một module code và đăng ký vào danh mục app | Hội đồng duyệt design doc (Goggle); bảng theo dõi "Impact" (Zeta); cơ chế bí mật giữa các team (FruitCo) |

**Quy tắc bắt buộc từ ngày đầu:**

1. **Không có chữ "Rainforest", "CR", "COE", "Sev" nào viết cứng trong `engine/`, `apps/`, `shell/`.** Mọi tên gọi lấy từ `terminology`.
2. **App đăng ký qua danh mục** (`registerApp(id, component)`); gói công ty chọn bật app nào, đặt tên gì, dùng giao diện nào.
3. **Chỉ số lõi dùng chung** (Flow, Energy, Stress, Value, Credit, Trust); chỉ số riêng của công ty khai báo trong `customStats`.
4. **Gói được nạp động** (dynamic import theo `id`). Đây cũng là chỗ gắn kiểm tra quyền sở hữu DLC sau này.
5. **Dữ liệu lưu game tách theo công ty và ghi kèm `version` của gói,** để cập nhật nội dung không làm hỏng save cũ.
6. **Có một gói giả `testco` rất nhỏ** (1 level, 2 ticket, 1 puzzle, pipeline 2 chặng, thuật ngữ khác hẳn) chạy trong bộ test tự động. Engine chạy được `testco` nghĩa là chưa bị dính cứng vào Rainforest.

**Giới hạn cần biết:** thiết kế này lo được tầng 1 và 2 chắc chắn. Tầng 3 chỉ được kiểm chứng thật khi làm công ty thứ hai; lúc đó gần như chắc chắn phải chỉnh lại một vài ranh giới. Mục tiêu bây giờ là để việc chỉnh đó nhỏ, không phải đoán trước mọi thứ.

### 8.6 Script kiểm tra nội dung

Chạy mỗi lần build, chặn build nếu sai:

- Mọi file nội dung khớp schema Zod; chạy cho từng gói công ty.
- Không có tên công ty hay thuật ngữ riêng viết cứng trong `engine/`, `apps/`, `shell/` (quét chuỗi).
- Mỗi puzzle có đủ 3 bản ngôn ngữ; mọi id lỗi đều có dòng tương ứng ở cả 3 bản; số dòng không vượt quá độ dài diff.
- Mỗi bản code qua được bộ phân tích cú pháp của ngôn ngữ đó (không lỗi cú pháp ngoài ý muốn).
- Mọi id được tham chiếu (NPC, sự cố, thẻ, mục thuật ngữ) đều tồn tại.
- Mọi trang wiki và thẻ "Ngoài đời thật" có ít nhất một đường dẫn nguồn.

---

## 9. Người mới, gợi ý và mục tiêu học tập

### 9.1 Ba chế độ độ khó (chọn lúc bắt đầu, đổi được bất kỳ lúc nào)

| Chế độ | Dành cho | Khác biệt |
|---|---|---|
| **Guided** (mặc định) | Người chưa biết code hoặc mới học | Gợi ý miễn phí và tự xuất hiện; đồng hồ chậm khi đọc diff; có dịch code sang lời thường; kết cục xấu nhất là kế hoạch kèm cặp, được chơi lại tuần |
| **Standard** | Sinh viên IT, dev ít kinh nghiệm | Gợi ý phải tự xin, mỗi lần hỏi tốn một ít thiện cảm của mentor; đủ 4 kết cục |
| **Realistic** | Dev có kinh nghiệm | Không có gợi ý tự động, đồng hồ đầy đủ, lỗi tinh vi hơn |

Quy trình ở cả ba chế độ **giống hệt nhau**; chỉ khác mức trợ giúp và áp lực thời gian.

### 9.2 Không ai bị kẹt

- **Ô "Today":** luôn hiện 2–4 mục tiêu của ngày và **bước tiếp theo** bằng một câu ("Open the CR from Priya in Code Review").
- **Phát hiện kẹt:** không có thao tác có ý nghĩa trong 45 giây thật (Guided) thì mentor nhắn một gợi ý nhẹ. Không bao giờ tự làm hộ.
- **Thang gợi ý 3 nấc** cho mỗi puzzle review:
  1. **Hướng nhìn:** "What happens if the other service never answers?"
  2. **Khoanh vùng:** tô sáng một đoạn khoảng 5 dòng.
  3. **Chỉ ra và giải thích:** chỉ đúng dòng, nói rõ lỗi là gì.
- **Luôn có lối ra:** mọi màn hình có nút "Ask for help" (nhắn mentor, hoặc ra bàn họ trên bản đồ). Trong sự cố, người điều phối cuộc gọi gợi ý bước tiếp nếu người chơi im quá lâu.
- **Thất bại vẫn đi tiếp:** sót lỗi hay làm sai không chặn game; hậu quả đến sau và được giải thích.

### 9.3 Luôn giải thích "vì sao"

- **Nút "Why?"** cạnh mọi bước quy trình: vì sao phải có người duyệt CR, vì sao phải chờ bake, vì sao không triển khai chiều thứ Sáu, vì sao khôi phục trước rồi mới tìm nguyên nhân.
- **Dịch code sang lời thường:** rê chuột vào một dòng để thấy nó làm gì bằng tiếng Anh đơn giản ("This line asks the Billing service for the price and waits for the answer"). Người không biết code vẫn suy luận được.
- **Thẻ giải thích sau mỗi CR:** lỗi là gì, vì sao nguy hiểm, nếu lọt thì chuyện gì xảy ra với khách hàng, người review giỏi nhận ra nó bằng dấu hiệu nào. Hiện cả khi người chơi bắt đúng.
- **Giải thích hậu quả:** khi một lỗi cũ phát nổ, game chỉ lại đúng CR, đúng dòng, và nói lẽ ra phải kiểm tra gì.
- **Đường cong làm quen:** các CR của tuần Intern chủ yếu là lỗi không cần đọc code (thiếu mô tả, thiếu test, tên biến gây hiểu nhầm, secret nằm lộ ra), rồi mới tới lỗi logic đơn giản.

### 9.4 Người chơi học được gì sau 35 ngày

1. Đọc một CR và kiểm tra 4 thứ: lỗi logic, test, giám sát, khả năng rollback.
2. Hiểu một thay đổi đi từ máy mình tới production qua những chặng nào và vì sao phải chờ.
3. Xử lý sự cố theo thứ tự đúng: khôi phục trước, tìm nguyên nhân sau, ghi mọi thứ vào ticket.
4. Viết một COE: dòng thời gian, 5 Whys, việc cần làm có người chịu trách nhiệm và hạn.
5. Hiểu khác biệt giữa giá trị tạo ra và giá trị được ghi nhận.

### 9.5 Cách đưa việc học vào game

- **Wiki trong game** viết lại từ nguồn công khai, có đường dẫn tới bản gốc.
- **Thẻ "Ngoài đời thật"** sau mỗi sự kiện lớn: thực tế làm thế nào, game phóng đại chỗ nào.
- **Sổ thuật ngữ** tự điền dần (CR, Sev-2, COE, bake time, one-box…).
- **Chỉ dạy điều có nguồn chính thức hoặc đã được người trong cuộc xác nhận.** Chi tiết từ nguồn ẩn danh chỉ làm màu sắc.
- **Màn tổng kết cuối game** có mục "Bạn đã học": liệt kê các thực hành đã gặp, kèm số liệu của chính người chơi (ví dụ bắt được bao nhiêu trên tổng số lỗi thiếu timeout).

---

## 10. Thiết kế cho việc chơi lại

- **Nhiều lối chơi đều sống được:** cày ticket, làm chính trị, làm người "keo dán", làm tối thiểu.
- **Sự kiện ngẫu nhiên có seed:** 15 trong 40 chuỗi chat và thứ tự CR thay đổi mỗi lượt.
- **Hậu quả trễ tạo câu chuyện riêng:** lỗi nào lọt, bị bắt ở chặng nào, ai bị gọi dậy.
- **Chơi lại bằng ngôn ngữ khác** cho bộ diff trông khác hẳn.
- **Lộ chỉ số ẩn sau kết cục.**
- **Danh hiệu theo lượt chơi** ("Rubber Stamper", "Glue Person", "Never Paged"), chia sẻ được dưới dạng ảnh.
- **Chia sẻ seed** để so kết quả.

---

## 11. Lộ trình (đã được thay bằng "Lộ trình phát hành mới" ở đầu tài liệu; giữ lại để tham khảo phạm vi từng phần)

Ước lượng cho một người làm toàn thời gian; bán thời gian thì khoảng gấp đôi. Bản 3 tăng lên khoảng 24 tuần (bản 2 là 20) vì thêm hệ thống gợi ý, bản đồ văn phòng, lương và mua sắm. Chưa tính công vẽ đồ họa chính thức nếu thuê ngoài.

| Giai đoạn | Thời lượng | Sản phẩm | Điều kiện đi tiếp |
|---|---|---|---|
| **0. Prototype một ngày** | 3 tuần | Chat + Code Review + Flow, 1 ngày chơi, **chỉ Python**, có thang gợi ý 3 nấc, dịch code sang lời thường và thẻ giải thích sau CR | 5 người chơi thử, **trong đó ít nhất 2 người không biết code**; đa số muốn chơi ngày thứ hai; không ai kẹt quá 2 phút |
| **1. Lõi engine** | 4 tuần | Đồng hồ, chỉ số, bộ sự kiện, nhật ký, lưu game, window manager, Ticket, IDE, khung gói công ty và danh mục app, gói giả `testco`, script kiểm tra nội dung | Chạy 5 ngày liên tục không lỗi; engine có test và chạy được cả `testco` |
| **2. Tuần Intern** | 6 tuần | Nội dung tuần 0, Code Review hoàn chỉnh, **Pipeline**, 3 chế độ độ khó, ô "Today", nút "Why?", màn chọn ngôn ngữ với đủ 3 bản cho puzzle của tuần này, 6 NPC, Wiki, **bản đồ văn phòng với hình tạm** (bàn mình, bàn lead, phòng sếp, bếp) | 10 người chơi hết tuần Intern, mỗi ngôn ngữ ít nhất 3 người, ít nhất 4 người không biết code; hiểu luật không cần giải thích |
| **3. Sáu tuần SDE I** | 6 tuần | Calendar, hậu quả trễ, on-call, 3 sự cố, COE, họp vận hành, kỳ đánh giá, 4 kết cục, 3 bản ngôn ngữ cho toàn bộ puzzle, **lương, app Pay, cửa hàng**, đủ 7 địa điểm | Chơi thông tới kết cục; ít nhất 2 kết cục khác nhau xuất hiện trong playtest |
| **4. Tiểu tiết, đắm chìm, cân bằng** | 5 tuần | Lớp vỏ laptop, sự kiện vặt, thẻ "Ngoài đời thật", sổ thuật ngữ, bóng bàn, đồ hiện trên bàn, đồ họa chính thức, âm thanh, chỉnh số, người từng làm ở Amazon đọc duyệt | 20 người chơi thử; đạt chỉ tiêu ở mục 12 |

Tổng khoảng 24 tuần.

**Thứ tự ưu tiên nếu thiếu thời gian:** gợi ý và giải thích (bắt buộc) → bản đồ văn phòng tối giản → lương và cửa hàng → bóng bàn. Các lớp sau có thể lùi sang bản cập nhật mà không ảnh hưởng quy trình lõi. **Giai đoạn 0 là cổng quan trọng nhất:** một ngày chơi không cuốn thì dừng lại sửa thiết kế.

### Việc cụ thể của Giai đoạn 0

1. Tạo dự án Vite + React + TypeScript.
2. Window manager tối thiểu: 2 cửa sổ kéo được, có focus.
3. Đồng hồ ngày và thanh Flow.
4. Code Review với 5 CR (4 có lỗi, 1 sạch) bằng Python, chấm đúng/sót/báo sai. Dùng sẵn kiểu `ReviewPuzzle` có `variants` để sau thêm ngôn ngữ không phải sửa.
5. Chat với 8 chuỗi sự kiện làm gián đoạn.
6. Màn tổng kết cuối ngày cho biết lỗi nào đã lọt.
7. Cho 5 người làm dev chơi, ngồi xem, không giải thích.

---

## 12. Chỉ tiêu thành công của MVP

| Chỉ tiêu | Ngưỡng |
|---|---|
| Hoàn thành tuần Intern | Trên 60% người bắt đầu |
| Chơi hết 35 ngày | Trên 25% |
| Bắt đầu lượt thứ hai | Trên 20% người đã có kết cục |
| Học được | Sau khi chơi, trên 60% người trả lời đúng 3 trong 5 câu hỏi ngắn về các chặng Pipeline, thứ tự xử lý sự cố và cấu trúc COE |
| Người không biết code | Trên 50% hoàn thành tuần Intern ở chế độ Guided |
| Không bị kẹt | Dưới 5% số phiên có khoảng lặng trên 3 phút không thao tác rồi thoát game |
| Dùng gợi ý | Phần lớn người chơi Guided dừng ở nấc 1 hoặc 2; nếu đa số phải tới nấc 3 thì puzzle đang quá khó |
| Phản hồi định tính | Có người từng làm Big Tech tự nói "đúng quá" mà không được gợi ý |
| Đăng ký nhận tin / wishlist | Tự đặt mục tiêu trước khi tung demo |

Đo bằng sự kiện ẩn danh trong bản web, tách theo ngôn ngữ đã chọn.

---

## 13. Rủi ro và cách giảm

| Rủi ro | Cách giảm |
|---|---|
| Ba ngôn ngữ nhân ba công viết và công kiểm tra diff | Thiết kế puzzle một lần, AI dịch nháp, người duyệt, script kiểm tra tự động; Giai đoạn 0 chỉ làm 1 ngôn ngữ |
| Một bản ngôn ngữ sai vị trí dòng lỗi làm puzzle chấm sai | Script kiểm tra; playtest mỗi ngôn ngữ riêng; nút "báo puzzle sai" trong game |
| Đọc diff quá khó với người mới | Diff ngắn, lỗi tuần Intern rất lộ, Wiki có checklist; đo tỷ lệ bắt lỗi |
| Pipeline thành màn hình chờ nhàm chán | Chủ yếu để xem; chỉ đòi chú ý khi có quyết định (chạy lại, xin vượt khóa, rollback) |
| Game giống đi làm thật, gây mệt | Ngày ngắn 4,5 phút; cắt mọi thao tác lặp không có quyết định |
| Dạy sai | Chỉ dạy theo nguồn chính thức; phần đánh giá hiệu suất ghi rõ là châm biếm; người trong cuộc đọc duyệt |
| Thiết kế gói công ty đoán sai nhu cầu của công ty thứ hai | Gói giả `testco` trong bộ test; giữ engine không biết tên công ty; chấp nhận chỉnh ranh giới khi làm công ty thứ hai |
| Dịch vụ hàng đợi khó hiểu với người chưa làm backend | Tuần Intern giải thích bằng ví dụ đời thường trong Wiki; ticket đầu chỉ đụng phần dễ |
| Phình phạm vi (bản 3 đã thêm 3 hệ thống lớn) | Giữ thứ tự ưu tiên ở mục 11; Giai đoạn 0 vẫn chỉ kiểm tra lõi; bản đồ và cửa hàng dùng hình tạm tới khi lõi được chứng minh |
| Gợi ý quá nhiều làm game mất thử thách với dev có kinh nghiệm | Ba chế độ độ khó; Realistic không có gợi ý tự động |
| Bản đồ thành việc vặt, đi lại gây phiền | Không bắt buộc đi lại nhiều lần; luôn có nút tắt từ laptop; mỗi chuyến đi có lợi ích rõ |
| Cửa hàng làm game quá dễ hoặc biến thành trọng tâm | Mỗi món lợi ích không quá 10%; tiền không đủ mua hết; không món nào thay được kỹ năng |
| Giải trí lấn át công việc, người chơi chỉ đánh bóng bàn | Tác dụng giảm dần khi lặp lại; sếp để ý nếu chơi lúc cao điểm; hạn ticket vẫn chạy |
| Công vẽ tăng mạnh (chân dung, 7 cảnh, 25 món đồ) | Hình tạm tới Giai đoạn 4; chốt một phong cách đơn giản trước khi vẽ |
| Pháp lý | Không dùng logo, màu thương hiệu, tên công cụ nội bộ thật, không chép nguyên văn tài liệu; hỏi luật sư trước khi bán |

---

## 14. Quyết định còn mở

1. Tên game và tên các công cụ nhại.
2. Số người làm và thời gian mỗi tuần.
3. Ai kiểm chứng độ chân thực (cần 2–3 người từng làm ở Amazon, tốt nhất có người ở AWS).
4. Demo web công khai ở cuối Giai đoạn 2 (chỉ tuần Intern) hay cuối Giai đoạn 4.

Đã chốt: Giai đoạn 0 dùng Python; bối cảnh là mảng đám mây (khớp với nguồn chính thức); có app Pipeline; 3 ngôn ngữ Python/Java/JavaScript.

---

## 15. Lưu, tạm dừng và quay lại (bổ sung 2026-10-13)

Nguyên tắc: **game chờ người chơi, không bao giờ ngược lại.** Tắt máy lúc nào cũng được, mở lên là đúng chỗ cũ, và không có gì xấu xảy ra trong lúc vắng mặt.

### 15.1 Thời gian trong game

- **Thời gian game chỉ trôi khi đang chơi.** Không có bộ đếm theo giờ thật trong cốt truyện. Pager kêu lúc 2:47 sáng là 2:47 sáng *trong game*.
- Energy, Stress, hạn ticket, bake time của Pipeline đều tính theo thời gian game. Không có kiểu "chờ 4 tiếng thật để hồi năng lượng".
- Vắng 1 ngày hay 3 tháng, thế giới trong game đứng yên đúng chỗ đó. Không NPC nào trách, không chỉ số nào tụt.

### 15.2 Tạm dừng

- **Nút Pause luôn hiện,** kể cả giữa sự cố và giữa một CR.
- **Tự tạm dừng** khi: chuyển tab, thu nhỏ cửa sổ, máy ngủ, hoặc không thao tác 60 giây.
- **Hình thức trong game:** laptop chuyển sang màn hình khóa. Màn hình khóa **che toàn bộ nội dung**, nên không dùng Pause để ngồi nghĩ thêm trong lúc đồng hồ dừng (quan trọng với chế độ Realistic và bài thi).
- Bỏ quy tắc cũ "đồng hồ chỉ dừng ở menu hệ thống" ở mục 2.

### 15.3 Tự động lưu

- **Lưu sau mỗi hành động.** Vì mọi hành động đã đi qua nhật ký hành động, lưu game chỉ là ghi thêm một dòng vào nhật ký.
- **Hai lớp:** ghi ngay vào máy (IndexedDB), đồng bộ lên server theo lô vài giây một lần và khi tạm dừng.
- **Ảnh chụp trạng thái** ở đầu mỗi nhiệm vụ và mỗi ngày game, để mở lại nhanh mà không phải chạy lại toàn bộ nhật ký.
- **Mở lại đúng thời điểm đã dừng,** kể cả giữa ngày, giữa CR, giữa sự cố. Không có "điểm lưu" mà người chơi phải nhớ tới.
- Mất điện hay trình duyệt sập: mất tối đa hành động cuối cùng.

### 15.4 Quay lại

- **Thẻ "Where you left off"** mỗi lần mở game: đang ở ngày nào, đang làm gì dở, việc còn tồn, CR nào đang ở chặng nào của Pipeline, tin nhắn chưa đọc. Một nút "Continue".
- **Quay lại giữa lúc căng** (sự cố, CR có đồng hồ): đếm ngược 3 giây và nhắc lại tình hình trước khi đồng hồ chạy tiếp.
- **Vắng trên 7 ngày:** thẻ dài hơn một chút, tóm tắt cốt truyện gần nhất bằng 3–4 câu, và mời (không bắt) làm một bài luyện 2 phút để nhớ lại kỹ năng vừa học.
- **Vắng trên 30 ngày:** thêm "What's new" nếu có nội dung mới. Vẫn không mất gì.
- **Cấp bậc không hết hạn.** Bằng chứng thăng cấp tính theo *số lần làm gần nhất*, không theo ngày, nên nghỉ lâu không làm tụt tiến độ.

### 15.5 Các trường hợp đặc biệt

| Tình huống | Xử lý |
|---|---|
| **Bài thi thăng cấp** | Chia thành các phần 5–8 phút. Giữa các phần được nghỉ bao lâu tùy ý, bài thi có hiệu lực 7 ngày. Thoát giữa một phần thì phần đó được phát lại bằng một biến thể khác, không bị trừ điểm. Cách này chống tra đáp án mà không ép người chơi ngồi liền 40 phút |
| **Daily CR** | Thoát giữa chừng vẫn làm tiếp được và vẫn tính chuỗi ngày; chỉ không được xếp hạng tốc độ hôm đó |
| **Chơi chưa đăng ký** | Lưu trên máy. Khi tạo tài khoản, toàn bộ tiến độ được chuyển sang |
| **Mất mạng** | Cốt truyện và Dojo chơi tiếp được, đồng bộ sau. Bài thi và Daily cần mạng |
| **Hai thiết bị** | Tiến độ theo tài khoản. Mỗi lúc chỉ một phiên hoạt động; mở ở máy thứ hai thì hỏi "tiếp tục ở đây?" và phiên kia chuyển sang màn hình khóa |
| **Game cập nhật nội dung** | Bản lưu ghi kèm phiên bản gói nội dung. Nếu nhiệm vụ đang dở bị thay đổi, chỉ nhiệm vụ đó chơi lại từ đầu; mọi thứ khác giữ nguyên |
| **Người chơi muốn làm lại** | Có "chơi lại level" tạo bản lưu riêng; cấp bậc đã kiểm chứng không bị mất |

### 15.6 Nhịp chơi vừa với đời sống

- **Nhiệm vụ dài 5–15 phút.** Một ngày game gồm 2–4 nhiệm vụ.
- **Điểm dừng rõ ràng:** cuối mỗi nhiệm vụ và mỗi ngày có dòng "Good place to stop" kèm một câu về việc tiếp theo.
- **"Hôm nay bạn có bao lâu?"** (5 / 15 / 30 phút, tùy chọn): game đề xuất Daily CR, một nhiệm vụ, hoặc cả một ngày game.
- **Game chủ động khuyên nghỉ:** sau khoảng 45–60 phút liên tục, hết ngày game hiện "That's a full day. Clock out." Người chơi vẫn chơi tiếp được nếu muốn.

### 15.7 Việc kỹ thuật cần làm

- Kiểm thử tự động: chạy lại nhật ký từ ảnh chụp trạng thái phải cho đúng trạng thái đã lưu (bảo đảm tính tất định).
- Kiểm thử thủ công bắt buộc trước mỗi bản phát hành: tắt trình duyệt ở 10 thời điểm khác nhau (giữa CR, giữa sự cố, giữa hội thoại, giữa bài thi, lúc đang đồng bộ) rồi mở lại.
- Bảng dữ liệu phía server: ảnh chụp trạng thái mới nhất, nhật ký hành động từ ảnh chụp đó, phiên bản gói nội dung.
- Người chơi tự xuất và tự xóa được dữ liệu của mình.
