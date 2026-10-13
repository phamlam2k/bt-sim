# RESEARCH — Cách làm việc thật ở Amazon (nguồn cho "Rainforest")

Cập nhật: 2026-10-13. Chỉ dùng tài liệu công khai; tôi không có quyền xem tài liệu nội bộ của Amazon.

## Cách đọc độ tin cậy

| Hạng | Nguồn | Dùng thế nào |
|---|---|---|
| **A** | Amazon/AWS tự công bố (Builders' Library, AWS blog, AWS docs, blog của CTO) | Dùng làm nền cho luật chơi và nội dung dạy học |
| **B** | Người có tên tuổi từng làm ở đó viết (Pragmatic Engineer, Scarlet Ink, dev.to) | Dùng cho chi tiết và giọng văn; phần lớn viết năm 2022, có thể đã cũ |
| **C** | Bài ẩn danh (Blind), blog nghề nghiệp | Chỉ dùng làm gợi ý; phải có người trong cuộc xác nhận trước khi game "dạy" điều đó |

---

## 1. Tổ chức team và quyền sở hữu

- **Team hai-pizza = "service team":** tự lo kế hoạch, phát triển, vận hành và hỗ trợ khách hàng. Nguyên tắc "you build it, you run it": team viết ra service nào thì trực service đó. (A/B — [InfoQ](https://www.infoq.com/news/2015/12/microservices-amazon), [AWS Executive Insights](https://aws.amazon.com/executive-insights/content/amazon-two-pizza-team/))
- **Nhịp sprint do team tự chọn**, không có nhịp chung toàn công ty. (B — bài nói được InfoQ ghi lại)
- **Team thường không có QA, BA hay project manager riêng;** quản lý kỹ thuật kiêm điều phối. (B — [dev.to, 2022](https://dev.to/bytebodger/what-its-like-to-code-for-amazon-4nke))
- **Nhiều ngày chỉ có một cuộc họp là standup.** (B — cùng nguồn; một người, một team)

## 2. Công cụ nội bộ

Nguồn chính: [Pragmatic Engineer — Notable Internal Systems at Amazon](https://blog.pragmaticengineer.com/amazon-notable-systems/) (B, cập nhật tháng 3/2022) và [dev.to](https://dev.to/bytebodger/what-its-like-to-code-for-amazon-4nke) (B, 2022).

| Tên thật | Chức năng | Chi tiết đáng đưa vào game |
|---|---|---|
| **CRUX** | Review code | Đơn vị là **"CR" (change request)**, không gọi là PR |
| **Brazil** | Hệ thống build | Cùng một cấu hình build cho máy cá nhân, review và CI |
| **Pipelines** | CI/CD | Các chặng beta → gamma → prod |
| **Apollo** | Triển khai (đời cũ) | Đang bị thay dần khi các team chuyển sang AWS thuần |
| **SIM** (Simple Issue Manager) | Ticket | Thay cho Jira |
| **Sage** | Hỏi đáp nội bộ | "Stack Overflow nội bộ" |
| **Wiki / Quip** | Tài liệu | Wiki nhúng được biểu đồ metric trực tiếp |
| **Cloud Desktop** | Máy dev trên EC2 | Code chạy trên máy từ xa, không chạy trên laptop |
| **Isengard** | Quản lý tài khoản AWS | Mỗi vùng, service, chặng có một tài khoản riêng |
| **2PR** | Phê duyệt hai người | Thao tác nhạy cảm cần người thứ hai duyệt; bỏ qua thì tự sinh ticket cho team và có thể leo thang lên quản lý |
| **Slack** | Chat | Chat đã chuyển sang Slack; Chime chỉ còn dùng cho gọi video (tính đến 2022) |
| **Kingpin** | Theo dõi mục tiêu | Cấp team, tổ chức, công ty |
| **Accolades** | Khen đồng nghiệp | Dễ CC cho sếp của người được khen |
| **Connections** | Khảo sát hằng ngày | Mỗi ngày laptop hỏi một câu (ví dụ về sếp của bạn), chấm thang 5; kết quả gộp gửi lên quản lý |
| **Forte** | Phản hồi hiệu suất | Xem mục 7 |

Ngôn ngữ chủ đạo là **Java** (B).

## 3. Review code

Nguồn: [Builders' Library — Automating safe, hands-off deployments](https://aws.amazon.com/builders-library/automating-safe-hands-off-deployments/) (A).

- Mọi thay đổi phải được một thành viên trong team duyệt trước khi vào nhánh chính; **pipeline chặn commit chưa được review.**
- Người review phải kiểm tra: có test đơn vị, test tích hợp, test canary không; có giám sát (metric, alarm) không; **thay đổi có rollback an toàn được không.**
- Điểm quan trọng cho game: ở Amazon, review không chỉ là "tìm bug trong diff" mà còn là "thay đổi này có vận hành an toàn không".

## 4. Triển khai

Nguồn: hai bài Builders' Library (A): [Automating safe, hands-off deployments](https://aws.amazon.com/builders-library/automating-safe-hands-off-deployments/) và [Going faster with continuous delivery](https://aws.amazon.com/builders-library/going-faster-with-continuous-delivery/).

- **Các chặng trước production:** alpha và beta (test chức năng, test tích hợp), gamma (cấu hình giống production). Một số pipeline có thêm zeta.
- **One-box:** code mới chạy trên một máy trước, nhận tối đa khoảng 10% lưu lượng; có vấn đề thì tự rollback.
- **Triển khai cuốn chiếu:** thay tối đa 33% số máy mỗi lần, giữ ít nhất 66% năng lực khỏe mạnh.
- **Theo đợt (wave):** bắt đầu ở vùng ít lưu lượng, rồi mở rộng dần.
- **Thời gian "bake":** ít nhất 1 giờ sau one-box, ít nhất 12 giờ sau đợt vùng đầu tiên, 2–4 giờ sau mỗi đợt sau. Một thay đổi mất khoảng **4–5 ngày làm việc** để tới mọi vùng.
- **Tự động rollback** khi alarm kêu: tỷ lệ lỗi, độ trễ P50/P90/P99, CPU, bộ nhớ, đĩa, lỗi trong log, health check.
- **Khung giờ cấm triển khai:** ban đêm, ngày lễ, cuối tuần; nhiều team cấm thêm thứ Sáu và cuối buổi chiều.
- **Phần lớn lần triển khai không có ai ngồi canh.** Khi on-call bị gọi, rollback thường đã tự chạy.
- **Sửa khẩn cấp:** Principal Engineer duyệt, rút ngắn bake, theo dõi sát.
- Lịch sử: trước khi có Pipelines, trung bình mất 16 ngày từ lúc check-in đến production, trong đó khoảng 14 ngày là chờ.

## 5. On-call và sự cố

- **Mức độ nghiêm trọng (C — Blind):** Sev-2 là khi một phần chức năng kinh doanh bị ảnh hưởng; on-call bị gọi và có **15 phút để phản hồi**. Sev-3 trở xuống không gọi ai, xử lý trong ngày làm việc kế tiếp. Sev-1 leo thang lên lãnh đạo cấp cao.
- **Ca trực (B/C):** thường một tuần liền 24/7, lặp lại mỗi 4–7 tuần tùy quy mô team. ([helloacm](https://helloacm.com/?p=156039), tin tuyển dụng trên [amazon.jobs](https://amazon.jobs/jobs/2797709))
- **Sau ca trực:** người trực viết báo cáo và trình bày ở cuộc họp vận hành hằng tuần; một người kể đây là phần căng thẳng nhất. (B — helloacm)
- **Diễn biến một Sev-2 (B — [Scarlet Ink](https://www.scarletink.com/p/inside-a-high-severity-outage-resolving), do cựu quản lý Amazon viết):**
  1. On-call đẩy code trong khung giờ triển khai của team, ngay sau đó nhận page Sev-2.
  2. Dừng triển khai, chạy rollback. Alarm vẫn kêu.
  3. Gọi người dự phòng (một senior). Không giải thích được thì ghi vào ticket rằng đang gọi "leader".
  4. Mở cuộc gọi hội nghị. Kỹ sư senior của team bên cạnh tự vào vì họ nhận email sự cố nghiêm trọng.
  5. **Người điều phối cuộc gọi** phân vai, gửi thông báo sự cố, và cố ý không tự đào sâu điều tra.
  6. **Mọi cập nhật ghi vào ticket**, không để trong trí nhớ hay trao đổi riêng.
  7. Nguyên tắc: **khôi phục trước, tìm nguyên nhân sau.** Không ai được giao tìm bug khi sự cố còn đang diễn ra.

## 6. COE (Correction of Error)

Nguồn: AWS blog (A) — [Why you should develop a COE](https://aws.amazon.com/blogs/mt/why-you-should-develop-a-correction-of-error-coe) và [Creating a COE document](https://aws.amazon.com/blogs/mt/creating-a-correction-of-errors-document/).

- Khác postmortem thông thường ở chỗ trọng tâm là **hành động khắc phục**, không chỉ ghi lại thất bại.
- Các phần: Tóm tắt (viết sau cùng, như email gửi lãnh đạo) · Tác động tới khách hàng (có giờ bắt đầu và kết thúc) · Dòng thời gian · Số liệu · Câu hỏi về phát hiện, chẩn đoán, khắc phục · **5 Whys** (ví dụ chính thức hỏi tới 6 lần) · Việc cần làm.
- **Mỗi việc cần làm phải có độ ưu tiên, người chịu trách nhiệm và hạn.**
- Ba số đo: thời gian phát hiện, thời gian chẩn đoán, thời gian khắc phục.

## 7. Đánh giá hiệu suất và thăng cấp

Phần này **không có tài liệu chính thức**; gần như toàn bộ là nguồn hạng B và C, và các nguồn mâu thuẫn nhau ở vài điểm.

- **Forte (B — Pragmatic Engineer):** đợt phản hồi toàn công ty từ cuối tháng 12 đến hết tháng 1. **Phản hồi của đồng nghiệp giới hạn 60 từ.**
- **Tự đánh giá (C):** nộp 3–5 thành tích, mỗi cái nêu tác động cụ thể.
- **OLR (C):** họp xếp hạng của các quản lý. Thứ hạng nội bộ gồm các bậc như Top Tier, Highly Valued, Least Effective; nhân viên chỉ thấy bản tóm tắt thô hơn.
- **Ép đường cong (C):** một cựu quản lý kể phải hạ bậc một người để cứu người khác khỏi bậc thấp nhất.
- **URA (C):** chỉ tiêu "nghỉ việc không tiếc" khoảng 6% được nhắc trên diễn đàn; chưa ai đưa ra văn bản.
- **Focus → Pivot (C):** người bị xếp bậc thấp nhất vào chương trình Focus (thường 3–6 tuần); không qua thì sang Pivot, được chọn giữa nhận gói thôi việc hoặc vào kế hoạch cải thiện.
- **Cấp bậc (C):** SDE I = L4, SDE II = L5, Senior SDE = L6, Principal = L7. L4 lên L5 thường 18–24 tháng. Lên L6 cần **tài liệu thăng cấp** có bằng chứng từ các team khác và sự vận động của quản lý.
- Nguồn: [developex](https://developex.com/blog/amazons-software-developer-performance-management/), [Blind — AMA của cựu quản lý](https://www.teamblind.com/post/ex-amazonian-manager-ama-inside-amazon-perf-review-cmepwbtt), [Blind — Pivot](https://www.teamblind.com/post/amazon-pivot-because-of-olr-elafzebh), [designgurus](https://www.designgurus.io/blog/amazon-sde-levels).

## 8. Văn hóa tài liệu và các cơ chế khác

- **16 Leadership Principles:** 14 nguyên tắc gốc, thêm 2 vào năm 2021 (Strive to be Earth's Best Employer; Success and Scale Bring Broad Responsibility). Lấy nguyên văn từ trang chính thức của Amazon khi cần đối chiếu.
- **6-pager và PR/FAQ:** văn bản tường thuật thay cho slide. Cuộc họp mở đầu bằng 10–20 phút im lặng đọc; đường dẫn tài liệu chỉ được chia sẻ khi họp bắt đầu. (B — dev.to; sách *Working Backwards* của Bryar và Carr)
- **Họp vận hành hằng tuần của AWS và "The Wheel":** họp 2 giờ có lãnh đạo cấp cao; một vòng quay ngẫu nhiên chọn service phải trình bày số liệu. (A — [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/the-wheel))
- **ORR (Operational Readiness Review):** checklist câu hỏi đúc kết từ các sự cố cũ, team tự đánh giá trước khi ra mắt service. (A — [AWS docs](https://docs.aws.amazon.com/wellarchitected/latest/operational-readiness-reviews/wa-operational-readiness-reviews.html))
- **Thực hành kỹ thuật công khai:** timeout cho mọi lời gọi từ xa, retry có backoff và jitter, API idempotent. (A — [Builders' Library](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter))

---

## 9. Những chỗ MVP plan cần sửa theo research

| Trong plan hiện tại | Thực tế | Sửa thành |
|---|---|---|
| Gọi là "PR" | Amazon gọi là "CR" | Đổi toàn bộ thuật ngữ thành CR |
| Chat nhại Chime | Chat là Slack; Chime chỉ gọi video | App chat kiểu Slack; cuộc gọi sự cố mới dùng app gọi riêng |
| Review chỉ tìm bug | Review còn kiểm tra test, giám sát, khả năng rollback | Thêm 3 mục kiểm tra này vào CRX và vào checklist trong Wiki |
| Merge xong là xong | Thay đổi đi qua beta → gamma → one-box → prod, có bake và tự rollback | Thêm app **Pipeline** (chủ yếu để xem): CR của bạn bò qua các chặng trong nhiều ngày |
| Sự cố: người chơi tự bấm rollback | Rollback thường tự chạy; việc khó là khi rollback rồi mà vẫn hỏng | Sev-2 dạy học: rollback tự chạy. Sev-2 thứ hai và Sev-1: rollback không cứu được |
| Cập nhật tình hình trong kênh chat | Cập nhật ghi vào ticket; có cuộc gọi và người điều phối | Sự cố mở một ticket Sev; có NPC làm người điều phối cuộc gọi |
| "Báo cáo hậu kiểm" tự chọn giọng văn | COE có cấu trúc cố định, 5 Whys, việc cần làm phải có người chịu trách nhiệm và hạn | Mini-game COE: xếp chuỗi 5 Whys, gán người và hạn cho từng việc |
| Không có | Người trực trình bày báo cáo ở họp vận hành tuần sau | Thêm cuộc họp này; có "vòng quay" chọn team |
| Peer feedback tự do | Giới hạn 60 từ | Người chơi chọn/ghép phản hồi trong giới hạn 60 từ |
| Không có | Connections: câu hỏi hằng ngày trên laptop | Popup mỗi sáng; câu trả lời có ảnh hưởng nhẹ tới sếp |
| Level "Junior" | SDE I = L4 | Intern → SDE I (L4) |
| Diff viết bằng TypeScript | Java là chủ đạo | Cân nhắc Java; TypeScript dễ đọc hơn với số đông. Cần quyết định |

## 10. Những gì research này chưa trả lời được

- **Trải nghiệm hiện tại (2025–2026):** phần lớn nguồn B viết năm 2022. Chưa kiểm chứng tình trạng hiện nay của Chime, Apollo, và ảnh hưởng của công cụ AI lên quy trình review.
- **Phần đánh giá hiệu suất** chỉ có nguồn ẩn danh. Đây cũng là phần game châm biếm mạnh nhất, nên rủi ro sai là cao nhất.
- **Giọng văn thật** của ticket, CR comment, tin nhắn: tài liệu công khai không cho thấy. Chỉ người từng làm ở đó mới duyệt được.
- **Khác biệt giữa các tổ chức:** AWS, Retail, Devices làm việc khá khác nhau; các nguồn A nghiêng hẳn về AWS, trong khi team trong game ("Cart Service") thuộc Retail.

Kết luận: research này đủ để dựng **luật chơi và nội dung dạy học** phần kỹ thuật (review, triển khai, sự cố, COE) trên nguồn chính thức. Nó **không thay được** việc nhờ 2–3 người từng làm ở Amazon đọc duyệt, nhất là phần đánh giá hiệu suất và giọng văn.

## 11. Luồng giao việc và quản lý task (bổ sung 2026-10-13)

**Độ tin cậy: thấp đến trung bình.** Không có tài liệu chính thức nào của Amazon mô tả việc này. Nguồn là lời kể ẩn danh trên Blind và bài viết của thực tập sinh, nên chỉ nên xem là "một cách phổ biến", không phải quy định.

| Điều tìm được | Nguồn | Đưa vào game |
|---|---|---|
| Amazon dùng công cụ nội bộ SIM; vài team dùng Jira. "Every team is diff." | [Blind: sprint planning at Amazon](https://www.teamblind.com/post/sprint-planning-at-amazon-2tyvc8cg) | App **Tickets**; tên app lấy từ pack để công ty khác đổi được |
| Sprint planning do chính team (phía SDE) chạy; TPM nếu có chỉ hỗ trợ | cùng nguồn trên | Bảng sprint; "Why: Who decides what I work on?" |
| Ticket từ team khác vào hàng đợi của team, người on-call xử lý trước | [Blind: SDM handle incoming defects](https://www.teamblind.com/post/sdm-handle-multiple-incoming-defects-best-practice-nftljlkl) | Trường "Where it came from" trên mỗi ticket; hàng đợi on-call để dành cho level sau |
| Tuần đầu chủ yếu onboarding; sau đó nhận một hai bug nhỏ, không ưu tiên | [Blind: AWS SDE 1 day to day](https://www.teamblind.com/post/amazon-aws-sde-1-what-is-your-day-to-day-like-cow1aso2) | Ticket đầu tiên là lỗi chính tả, mức ưu tiên thấp |
| Mentor giao việc nhỏ để làm quen codebase, kiểm tra thường xuyên trong vài tuần đầu | [Blind: mentoring an intern](https://www.teamblind.com/post/mentoring-an-intern-djneamsz) | Maya (mentor) gán ticket, không phải Rohan (manager) |
| 1:1 hằng tuần với manager, có mentor riêng cho intern | [Taro: Amazon SDE intern review](https://www.jointaro.com/interviews/companies/amazon/work-experiences/sde-intern-seattle-wa-may-25-2025-4-6e1aec2c) | Sync 15 phút với Rohan ở ngày 2 (đã có) |

Chưa xác minh được: cấu trúc CTI (Category/Type/Item) của SIM, cách ước lượng điểm, và việc ticket tự đổi trạng thái khi CR được merge. Trong game, trạng thái tự chuyển khi mở CR; đó là lựa chọn thiết kế để người mới không bị kẹt.
