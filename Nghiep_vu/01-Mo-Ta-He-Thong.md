# TÀI LIỆU MÔ TẢ HỆ THỐNG
## AI-Powered Laptop Commerce Platform

| Hạng mục | Nội dung |
|---|---|
| Tên dự án | AI-Powered Laptop Commerce Platform |
| Loại dự án | Personal Learning Project (định hướng Enterprise-like) |
| Phiên bản tài liệu | 1.0 |
| Frontend | React 19 + Vite + TypeScript |
| Backend | ASP.NET Core (.NET 9) — Modular Monolith + Clean Architecture |
| Database | MySQL 8 |
| Cache | Redis |
| AI | Ollama (Qwen2.5 / Gemma) — Local LLM |

---

## 1. Bối cảnh và lý do xây dựng

Phần lớn các dự án thương mại điện tử làm để học tập dừng lại ở mức CRUD: thêm sản phẩm, thêm giỏ hàng, thanh toán giả lập. Người làm xong dự án biết "đã làm gì" nhưng không giải thích được "vì sao thiết kế như vậy".

Dự án này được xây dựng để lấp đúng khoảng trống đó. Website bán laptop chỉ là **vỏ nghiệp vụ**; phần lõi thực sự cần học nằm ở bốn khối:

1. **Kiến trúc phần mềm** — Modular Monolith + Clean Architecture, tách biệt Domain khỏi hạ tầng.
2. **Dữ liệu hành vi** — Event Tracking như một tài sản, không phải log.
3. **Recommendation** — đi từ Rule Based đến Machine Learning theo từng giai đoạn có thể đo lường được.
4. **AI Integration** — AI đứng đúng vị trí của nó: lớp diễn giải, không phải lớp quyết định.

Lĩnh vực laptop và phụ kiện công nghệ được chọn có chủ đích: sản phẩm có thuộc tính kỹ thuật rõ ràng (CPU, RAM, GPU, ổ cứng, màn hình), có phân khúc giá rõ ràng, và có quan hệ mua kèm tự nhiên (laptop → chuột, balo, đế tản nhiệt). Đây là điều kiện lý tưởng để hệ thống recommendation có tín hiệu sạch thay vì nhiễu.

---

## 2. Phạm vi hệ thống

### 2.1. Trong phạm vi (In Scope)

**Nhóm sản phẩm**

| Nhóm | Ví dụ thuộc tính đặc thù |
|---|---|
| Laptop | CPU, RAM, GPU, SSD, kích thước màn hình, tần số quét, trọng lượng, thời lượng pin |
| Chuột | Kết nối, DPI, số nút, trọng lượng |
| Bàn phím | Layout, loại switch, kết nối, LED |
| Tai nghe | Kiểu đeo, chống ồn, kết nối, micro |
| Màn hình | Kích thước, độ phân giải, tấm nền, tần số quét, cổng kết nối |
| SSD | Chuẩn giao tiếp, dung lượng, tốc độ đọc/ghi |
| RAM | Loại (DDR4/DDR5), bus, dung lượng, số thanh |
| Phụ kiện khác | Balo, đế tản, hub, sạc |

**Khối chức năng**

- Thương mại điện tử đầy đủ: tài khoản, danh mục, tìm kiếm, lọc, giỏ hàng, đặt hàng, theo dõi đơn, yêu thích, đánh giá.
- Quản trị: sản phẩm, danh mục, kho, đơn hàng, người dùng, đánh giá, dashboard.
- Event Tracking toàn hệ thống.
- Recommendation System 3 giai đoạn.
- AI Shopping Assistant, AI Product Summary, AI Explanation — tất cả chạy trên RAG.
- Xử lý bất đồng bộ bằng Background Worker.
- Đóng gói và chạy bằng Docker Compose.

### 2.2. Ngoài phạm vi (Out of Scope)

- Thanh toán thật với ngân hàng/cổng thanh toán (chỉ mô phỏng sandbox hoặc mock provider).
- Tích hợp đơn vị vận chuyển thật.
- Multi-tenant, multi-vendor (marketplace nhiều người bán).
- Ứng dụng mobile native.
- Đa ngôn ngữ giao diện (chỉ tiếng Việt ở v1).
- Microservices thật sự (chỉ chuẩn bị đường ranh giới để tách sau này).

---

## 3. Các nhóm người dùng

| Vai trò | Mô tả | Quyền hạn chính |
|---|---|---|
| **Guest** | Khách chưa đăng nhập | Xem sản phẩm, tìm kiếm, lọc, thêm giỏ hàng tạm (session), dùng AI Assistant ở mức ẩn danh |
| **Customer** | Khách đã đăng ký | Toàn bộ quyền Guest + đặt hàng, theo dõi đơn, yêu thích, đánh giá, nhận recommendation cá nhân hóa |
| **Staff** | Nhân viên vận hành | Quản lý đơn hàng, cập nhật kho, duyệt đánh giá |
| **Admin** | Quản trị viên | Toàn quyền: sản phẩm, danh mục, người dùng, phân quyền, dashboard, cấu hình AI/Recommendation |
| **System** | Tác nhân tự động | Background Worker, ML Trainer, Event Processor |

---

## 4. Mô tả chức năng theo module

### 4.1. Identity — Định danh và phân quyền
Đăng ký bằng email, xác thực email, đăng nhập, quên mật khẩu, đổi mật khẩu, quản lý hồ sơ và sổ địa chỉ. Xác thực bằng JWT Access Token (ngắn hạn) kết hợp Refresh Token (dài hạn, xoay vòng). Phân quyền theo Role và Permission.

### 4.2. Catalog — Danh mục sản phẩm
Quản lý danh mục dạng cây, thương hiệu, sản phẩm và biến thể (variant theo cấu hình RAM/SSD/màu). Mỗi nhóm sản phẩm có bộ thuộc tính kỹ thuật riêng, lưu theo mô hình EAV nhẹ để bộ lọc động hoạt động mà không phải sửa schema mỗi lần thêm nhóm hàng.

Tìm kiếm và lọc theo: từ khóa, danh mục, thương hiệu, khoảng giá, thuộc tính kỹ thuật, tình trạng còn hàng, đánh giá trung bình. Sắp xếp theo giá, độ mới, độ phổ biến, mức độ phù hợp.

### 4.3. Inventory — Kho hàng
Theo dõi tồn kho theo từng variant. Cơ chế **giữ hàng (reservation)** khi khách bắt đầu thanh toán và tự động nhả nếu quá thời gian. Ghi nhận lịch sử nhập/xuất kho để đối soát.

### 4.4. Cart — Giỏ hàng
Giỏ hàng cho khách ẩn danh lưu theo `anonymous_id` trong Redis; khi đăng nhập sẽ hợp nhất (merge) vào giỏ hàng của tài khoản. Kiểm tra giá và tồn kho tại thời điểm hiển thị, không tin vào dữ liệu client gửi lên.

### 4.5. Ordering — Đơn hàng
Vòng đời đơn hàng: `Pending → Confirmed → Packed → Shipping → Delivered → Completed`, cùng các nhánh `Cancelled` và `Returned`. Snapshot giá và thông tin sản phẩm tại thời điểm đặt để lịch sử đơn không bị thay đổi khi giá sản phẩm thay đổi.

### 4.6. Review — Đánh giá
Chỉ khách đã mua và đơn ở trạng thái `Completed` mới được đánh giá sản phẩm đó. Có kiểm duyệt trước khi hiển thị. Đánh giá vừa là nội dung hiển thị, vừa là tín hiệu mạnh cho recommendation.

### 4.7. Wishlist — Yêu thích
Danh sách sản phẩm quan tâm. Là tín hiệu ý định (intent signal) có giá trị cao hơn lượt xem nhưng thấp hơn lượt mua.

### 4.8. Tracking — Thu thập sự kiện
Đây là module quan trọng nhất về mặt dữ liệu. Xem chi tiết ở mục 5.

### 4.9. Recommendation — Gợi ý sản phẩm
Ba giai đoạn: Rule Based → User Preference → Machine Learning. Chi tiết ở tài liệu nghiệp vụ.

### 4.10. AI — Trợ lý và diễn giải
Ba chức năng: Shopping Assistant, Product Summary, Recommendation Explanation. Toàn bộ chạy qua RAG, xem mục 6.

### 4.11. Analytics — Thống kê
Dashboard doanh thu, đơn hàng, sản phẩm bán chạy, phễu chuyển đổi (view → cart → purchase), hiệu quả recommendation (CTR, conversion rate của các slot gợi ý).

---

## 5. Event Tracking — Xương sống dữ liệu

### 5.1. Nguyên tắc

Event Tracking **không phải là logging**. Log dùng để debug và có thể xóa. Event là dữ liệu nghiệp vụ, được thiết kế schema cẩn thận, được lưu lâu dài và là nguyên liệu đầu vào cho Recommendation và Machine Learning.

### 5.2. Danh sách Event

| Event | Trọng số | Ghi chú |
|---|---|---|
| `product_viewed` | 1 | Kèm thời gian ở lại trang (dwell time) |
| `product_searched` | 1 | Kèm từ khóa và số kết quả |
| `filter_applied` | 1 | Tín hiệu rất rõ về ngân sách và nhu cầu |
| `product_clicked` | 2 | Click từ danh sách/gợi ý, kèm vị trí và nguồn |
| `product_favorited` | 4 | |
| `cart_added` | 5 | |
| `cart_removed` | -3 | Tín hiệu âm |
| `checkout_started` | 7 | |
| `purchased` | 10 | Tín hiệu mạnh nhất |
| `product_reviewed` | 8 | Kèm số sao |
| `recommendation_shown` | 0 | Dùng để tính CTR, chống bias |
| `ai_query_submitted` | 3 | Câu hỏi của khách chứa nhu cầu dạng ngôn ngữ tự nhiên |

### 5.3. Cấu trúc chung một Event

```json
{
  "event_id": "uuid",
  "event_type": "product_viewed",
  "occurred_at": "2026-07-23T10:15:00Z",
  "user_id": 1024,
  "anonymous_id": "a1b2c3...",
  "session_id": "s-98765",
  "source": "web",
  "context": {
    "page": "/product/lenovo-legion-5",
    "referrer": "/search?q=laptop+gaming",
    "device": "desktop"
  },
  "payload": {
    "product_id": 501,
    "category_id": 3,
    "brand_id": 7,
    "price": 22990000,
    "dwell_time_ms": 45000
  }
}
```

Ba trường bắt buộc phải luôn có: `event_type`, `occurred_at`, và một trong hai `user_id` / `anonymous_id`. Khi khách ẩn danh đăng nhập, hệ thống sẽ chạy tiến trình **identity stitching** để gắn lại toàn bộ event ẩn danh trước đó vào tài khoản thật.

---

## 6. Nguyên tắc AI

Dự án tuân thủ bốn nguyên tắc cứng khi tích hợp AI:

**1. AI không phải nguồn sự thật.** Model không được phép trả lời sản phẩm, giá, tồn kho theo trí nhớ. Mọi dữ liệu phải đến từ Database thông qua RAG.

**2. AI không ra quyết định nghiệp vụ.** AI không tự tạo đơn hàng, không tự áp giảm giá, không tự thay đổi tồn kho. AI chỉ đọc, phân tích và diễn giải.

**3. AI có thể hỏng mà hệ thống vẫn chạy.** Nếu Ollama không phản hồi hoặc timeout, hệ thống fallback về kết quả tìm kiếm/recommendation thuần backend. Người dùng vẫn mua được hàng.

**4. Mọi câu trả lời AI phải truy vết được.** Response luôn kèm danh sách `product_id` mà AI đã dùng làm ngữ cảnh, để có thể kiểm chứng và để frontend render thành card sản phẩm thật thay vì text.

### Luồng RAG rút gọn

```
Câu hỏi tự nhiên
   → LLM trích xuất ý định thành JSON có cấu trúc
     (ngân sách, nhóm sản phẩm, nhu cầu sử dụng, thương hiệu ưu tiên)
   → Backend dựng truy vấn MySQL từ JSON đó
   → Lấy Top-N sản phẩm thật + thông số kỹ thuật + tồn kho + giá
   → Đóng gói thành context
   → LLM phân tích và giải thích dựa trên context
   → Trả về: văn bản giải thích + danh sách product_id
```

---

## 7. Yêu cầu phi chức năng

| Nhóm | Yêu cầu |
|---|---|
| **Hiệu năng** | API danh sách sản phẩm p95 < 300ms; trang chi tiết < 500ms; AI Assistant < 8s (có streaming để giảm cảm giác chờ) |
| **Khả năng chịu tải** | Mục tiêu học tập: 100 request/giây trên máy cá nhân với Redis cache |
| **Bất đồng bộ** | Event Tracking không được làm chậm request người dùng — ghi nhận rồi trả về ngay, xử lý sau |
| **Bảo mật** | JWT + Refresh Token xoay vòng, hash mật khẩu bằng Argon2/BCrypt, rate limit trên endpoint auth và AI, validate toàn bộ input, chống IDOR trên mọi endpoint có tham số id |
| **Toàn vẹn dữ liệu** | Không được oversell — trừ kho phải nằm trong transaction hoặc dùng optimistic concurrency |
| **Khả năng quan sát** | Serilog structured logging, correlation id xuyên suốt request, health check cho MySQL/Redis/Ollama |
| **Khả năng mở rộng** | Ranh giới module rõ ràng để có thể tách thành service riêng mà không phải viết lại Domain |
| **Triển khai** | Toàn bộ hệ thống chạy được bằng một lệnh `docker compose up` |

---

## 8. Lộ trình phát triển

| Giai đoạn | Nội dung | Kết quả đạt được |
|---|---|---|
| **0 — Nền móng** | Solution structure, Docker Compose (MySQL + Redis), EF Core, Serilog, JWT | Chạy được API rỗng có auth |
| **1 — Thương mại điện tử** | Catalog, Cart, Ordering, Inventory, Review, Admin | Website bán hàng hoàn chỉnh |
| **2 — Event Tracking** | Event API, Outbox, Background Worker, bảng event | Dữ liệu hành vi bắt đầu tích lũy |
| **3 — Rule Based Reco** | Cùng danh mục, cùng brand, cùng tầm giá, bán chạy, mua kèm | Gợi ý hoạt động không cần AI |
| **4 — User Preference** | Worker tổng hợp hồ sơ sở thích, personalized ranking | Gợi ý theo cá nhân |
| **5 — AI + RAG** | Ollama, intent extraction, Shopping Assistant, Summary, Explanation | Trợ lý mua hàng |
| **6 — Machine Learning** | Xuất dataset, huấn luyện mô hình, phục vụ điểm số qua API | Reco học từ dữ liệu |
| **7 — Mở rộng** | RabbitMQ, Elasticsearch, Vector DB, A/B testing | Hạ tầng gần production |

Nguyên tắc xuyên suốt: **không nhảy cóc giai đoạn**. Giai đoạn sau chỉ có giá trị khi giai đoạn trước đã sinh ra dữ liệu thật. Recommendation bằng Machine Learning làm khi chưa có event là làm ngược.

---

## 9. Tiêu chí hoàn thành

Dự án được coi là đạt mục tiêu khi bạn có thể trả lời trôi chảy các câu hỏi sau trong một buổi phỏng vấn:

- Vì sao chọn Modular Monolith thay vì Microservices, và khi nào thì nên đổi?
- Event đi từ trình duyệt đến bảng `user_preference` qua những bước nào?
- Recommendation xử lý bài toán cold start ra sao?
- AI lấy dữ liệu từ đâu, và làm gì khi AI trả lời sai?
- Nếu lượng truy cập tăng 100 lần thì nút thắt cổ chai nằm ở đâu và xử lý thế nào?
