# TÀI LIỆU NGHIỆP VỤ CHÍNH YẾU
## AI-Powered Laptop Commerce Platform

Tài liệu này mô tả các luồng nghiệp vụ quan trọng nhất, kèm quy tắc ràng buộc và các trường hợp ngoại lệ. Đây là phần tài liệu bạn nên đọc lại trước khi code từng module.

**Ký hiệu mức độ ưu tiên:** 🔴 Cốt lõi (không có thì hệ thống vô nghĩa) · 🟡 Quan trọng · 🟢 Bổ trợ

---

# PHẦN A — NGHIỆP VỤ THƯƠNG MẠI ĐIỆN TỬ

## NV-01 🔴 Đăng ký và xác thực tài khoản

### Luồng chính
1. Khách nhập email, mật khẩu, họ tên.
2. Hệ thống kiểm tra email chưa tồn tại, mật khẩu đạt độ mạnh tối thiểu.
3. Tạo user ở trạng thái `PendingVerification`, hash mật khẩu bằng BCrypt.
4. Phát sinh `UserRegistered` → Outbox → Worker gửi email xác thực.
5. Khách bấm link → user chuyển sang `Active`.
6. Đăng nhập: trả về Access Token (15 phút) + Refresh Token (7 ngày, HttpOnly cookie).

### Quy tắc nghiệp vụ
| Mã | Quy tắc |
|---|---|
| BR-01.1 | Email là định danh duy nhất, lưu dạng chữ thường |
| BR-01.2 | Mật khẩu tối thiểu 8 ký tự, có chữ và số |
| BR-01.3 | Sai mật khẩu 5 lần liên tiếp → khóa đăng nhập 15 phút |
| BR-01.4 | Refresh Token dùng một lần; nếu một token đã dùng bị dùng lại → thu hồi toàn bộ token của user (dấu hiệu bị đánh cắp) |
| BR-01.5 | User `PendingVerification` vẫn xem được sản phẩm nhưng không đặt được hàng |

### Ngoại lệ
- Email đã tồn tại → trả về thông báo chung chung ("Nếu email hợp lệ, chúng tôi đã gửi hướng dẫn"), tránh lộ danh sách email đã đăng ký.
- Link xác thực hết hạn (24h) → cho phép gửi lại, tối đa 3 lần/ngày.

### Sự kiện phát sinh
`UserRegistered`, `UserVerified`, `UserLoggedIn`, `LoginFailed`

---

## NV-02 🔴 Duyệt, tìm kiếm và lọc sản phẩm

### Luồng chính
1. Khách vào trang danh mục hoặc gõ từ khóa.
2. Frontend đọc tham số từ URL, gọi `GET /api/v1/products`.
3. Backend kiểm tra Redis cache theo hash tham số; nếu miss thì truy vấn MySQL.
4. Trả về danh sách sản phẩm + **facets** (số lượng theo brand, khoảng giá, RAM, CPU...).
5. Frontend render, đồng thời bắn event `product_searched` và `filter_applied`.

### Quy tắc lọc
| Mã | Quy tắc |
|---|---|
| BR-02.1 | Chỉ hiển thị sản phẩm `status = Published` và chưa xóa mềm |
| BR-02.2 | Sản phẩm hết hàng vẫn hiển thị nhưng đẩy xuống cuối và gắn nhãn "Hết hàng" |
| BR-02.3 | Facets phải tính trên tập kết quả **sau khi áp dụng các bộ lọc khác**, trừ chính chiều đang tính |
| BR-02.4 | Bộ lọc thông số kỹ thuật (RAM, CPU, GPU) chỉ hiện những thuộc tính liên quan đến danh mục đang xem |
| BR-02.5 | Giá hiển thị luôn là giá của variant rẻ nhất còn bán |

### Sắp xếp mặc định
Nếu khách đã đăng nhập và có preference → sắp xếp theo **personalized relevance**. Nếu không → sắp xếp theo độ phổ biến (kết hợp `sold_count` 30 ngày và `avg_rating`).

### Ngoại lệ
- Không có kết quả → gợi ý bỏ bớt bộ lọc, kèm 8 sản phẩm gần đúng nhất (nới khoảng giá ±20%).
- Từ khóa sai chính tả → giai đoạn 1 dùng FULLTEXT với `IN NATURAL LANGUAGE MODE`; giai đoạn sau dùng fuzzy của Elasticsearch.

### Sự kiện phát sinh
`product_searched`, `filter_applied`, `product_viewed`, `product_clicked`

---

## NV-03 🔴 Giỏ hàng

### Luồng chính
1. Khách bấm "Thêm vào giỏ" trên một variant cụ thể.
2. Backend kiểm tra variant đang bán và còn tồn kho khả dụng.
3. Nếu đã có trong giỏ → cộng dồn số lượng; nếu chưa → tạo dòng mới.
4. Trả về giỏ hàng đã tính lại toàn bộ, kèm cảnh báo nếu có.
5. Bắn event `cart_added`.

### Quy tắc nghiệp vụ
| Mã | Quy tắc |
|---|---|
| BR-03.1 | Giỏ hàng luôn tham chiếu **variant**, không bao giờ tham chiếu product |
| BR-03.2 | Số lượng mỗi dòng tối đa 10; tối đa 30 dòng trong giỏ |
| BR-03.3 | **Giá luôn được tính lại từ DB** khi hiển thị giỏ hàng — không tin giá client gửi lên |
| BR-03.4 | Nếu giá đã thay đổi so với lần xem trước → hiển thị cảnh báo cho khách xác nhận |
| BR-03.5 | Thêm giỏ **không** trừ kho, chỉ kiểm tra khả dụng |
| BR-03.6 | Giỏ khách ẩn danh lưu Redis TTL 7 ngày; giỏ user lưu MySQL |

### Merge giỏ khi đăng nhập
Đây là chỗ hay bị làm sai. Quy tắc:
- Cùng variant có ở cả hai giỏ → lấy **số lượng lớn hơn**, không cộng dồn (tránh trường hợp khách vô tình có 6 cái laptop).
- Variant chỉ có ở giỏ ẩn danh → thêm vào giỏ user.
- Sau merge → xóa giỏ ẩn danh và chạy identity stitching cho toàn bộ event ẩn danh.

### Ngoại lệ
- Variant ngừng bán khi đang trong giỏ → giữ dòng nhưng vô hiệu hóa, không tính vào tổng tiền.
- Số lượng yêu cầu > tồn kho → tự động giảm về mức tối đa còn lại và báo cho khách.

---

## NV-04 🔴 Đặt hàng và giữ kho

Đây là nghiệp vụ phức tạp nhất của hệ thống. Cần cẩn thận với đồng thời (concurrency).

### Luồng chính
```
[1] Khách bấm "Đặt hàng"
     ↓
[2] Validate: giỏ không rỗng, có địa chỉ giao, phương thức thanh toán hợp lệ
     ↓
[3] MỞ TRANSACTION
     ├─ Khóa và kiểm tra tồn kho từng variant (optimistic concurrency qua row_version)
     ├─ Tính lại giá từ DB (KHÔNG dùng giá client gửi)
     ├─ Áp mã giảm giá nếu có, kiểm tra điều kiện và lượt dùng
     ├─ Tạo Order + OrderItems với snapshot đầy đủ
     ├─ Tạo Reservation cho từng variant, hạn 15 phút
     ├─ Tăng reserved_quantity trên inventory_stocks
     ├─ Ghi OrderPlaced vào bảng outbox_messages
     └─ COMMIT
     ↓
[4] Xóa giỏ hàng
     ↓
[5] Trả về mã đơn hàng cho khách
     ↓
[6] (Bất đồng bộ) OutboxDispatcher publish OrderPlaced
     ├─ Email xác nhận đơn
     ├─ Ghi event `purchased` cho từng sản phẩm
     ├─ Cập nhật sold_count
     └─ Kích hoạt tính lại preference
```

### Quy tắc nghiệp vụ
| Mã | Quy tắc |
|---|---|
| BR-04.1 | Toàn bộ bước [3] nằm trong **một transaction** — hoặc thành công hết, hoặc rollback hết |
| BR-04.2 | Đặt hàng phải **idempotent**: cùng `Idempotency-Key` gửi hai lần chỉ tạo một đơn |
| BR-04.3 | Nếu bất kỳ variant nào không đủ hàng → hủy toàn bộ đơn, báo rõ sản phẩm nào thiếu |
| BR-04.4 | `reserved_quantity` tăng khi đặt, `quantity` chỉ giảm khi đơn chuyển sang `Confirmed` |
| BR-04.5 | Reservation quá 15 phút chưa thanh toán (với phương thức online) → worker nhả về kho, đơn chuyển `Cancelled` |
| BR-04.6 | Snapshot tên sản phẩm, cấu hình, giá vào `order_items` — lịch sử đơn không đổi khi sản phẩm đổi |
| BR-04.7 | Mã đơn hàng dạng `ORD-YYYYMMDD-XXXXX`, không dùng id tăng dần để lộ số lượng đơn |

### Vòng đời đơn hàng

```
   Pending ──confirm──> Confirmed ──pack──> Packed ──ship──> Shipping
      │                     │                                   │
      │                     │                              deliver
      │                     │                                   ▼
      └──cancel──┐          └──cancel──┐                    Delivered
                 ▼                     ▼                        │
             Cancelled             Cancelled            (7 ngày, tự động)
                                                                ▼
                                                            Completed
                                                                │
                                                          return (trong 7 ngày)
                                                                ▼
                                                            Returned
```

| Chuyển trạng thái | Ai được phép | Điều kiện |
|---|---|---|
| Pending → Confirmed | Staff/Admin hoặc tự động khi thanh toán thành công | Còn đủ hàng |
| Pending → Cancelled | Khách hoặc Staff | Chưa Confirmed |
| Confirmed → Cancelled | Chỉ Staff/Admin | Phải hoàn kho và hoàn tiền nếu đã thanh toán |
| Delivered → Completed | Tự động sau 7 ngày | |
| Delivered → Returned | Khách yêu cầu, Staff duyệt | Trong 7 ngày kể từ khi nhận |

### Ngoại lệ và tình huống khó
- **Hai khách cùng mua sản phẩm cuối cùng:** optimistic concurrency sẽ khiến một trong hai transaction thất bại với `DbUpdateConcurrencyException`. Retry tối đa 3 lần; nếu vẫn thất bại thì báo hết hàng.
- **Thanh toán thành công nhưng tạo đơn thất bại:** không được xảy ra vì thứ tự đúng là tạo đơn trước, thanh toán sau. Nếu dùng cổng thanh toán, dùng webhook + đối soát định kỳ.
- **Hủy đơn đã trừ kho:** phải hoàn lại `quantity`, ghi `inventory_transactions` với type `Return`.

---

## NV-05 🟡 Quản lý kho

### Luồng chính
- Admin nhập kho → tăng `quantity`, ghi `inventory_transactions` type `Import`.
- Đơn hàng `Confirmed` → giảm `quantity`, giảm `reserved_quantity`, ghi type `Sale`.
- Đơn hủy/trả → tăng lại `quantity`, ghi type `Return`.

### Quy tắc
| Mã | Quy tắc |
|---|---|
| BR-05.1 | **Số lượng khả dụng = quantity − reserved_quantity** — luôn dùng công thức này khi kiểm tra |
| BR-05.2 | `quantity` không bao giờ được âm; nếu tính ra âm thì có bug, phải chặn ở tầng Domain |
| BR-05.3 | Mọi thay đổi kho đều phải ghi `inventory_transactions` để đối soát |
| BR-05.4 | Tồn kho ≤ ngưỡng cảnh báo → phát `LowStockDetected`, hiện trên dashboard |
| BR-05.5 | Tồn kho tuyệt đối không được cache |

---

## NV-06 🟡 Đánh giá sản phẩm

### Luồng chính
1. Khách vào đơn hàng đã `Completed`, bấm đánh giá sản phẩm.
2. Hệ thống kiểm tra quyền đánh giá.
3. Lưu review ở trạng thái `Pending`.
4. Staff duyệt → `Approved` → hiển thị công khai, cập nhật `avg_rating` và `review_count`.
5. Bắn event `product_reviewed` với số sao.

### Quy tắc
| Mã | Quy tắc |
|---|---|
| BR-06.1 | Chỉ đánh giá được sản phẩm đã mua trong đơn `Completed` — gắn `order_id` để chứng minh |
| BR-06.2 | Mỗi cặp (user, product, order) chỉ đánh giá một lần |
| BR-06.3 | Số sao 1–5, nội dung 10–2000 ký tự |
| BR-06.4 | Sửa được trong 24h, sau đó khóa |
| BR-06.5 | `avg_rating` tính lại bằng worker, không tính trực tiếp trong request |

### Vì sao review quan trọng với recommendation
Review là tín hiệu chất lượng cao nhất trong hệ thống: khách bỏ công viết đánh giá nghĩa là họ thực sự có quan điểm. Review 5 sao là tín hiệu dương mạnh cho brand và dòng sản phẩm đó; review 1–2 sao là tín hiệu âm và nên **giảm** điểm gợi ý sản phẩm tương tự.

---

# PHẦN B — NGHIỆP VỤ DỮ LIỆU VÀ AI

## NV-07 🔴 Thu thập và xử lý Event

Đây là nghiệp vụ nền tảng cho toàn bộ phần AI và Recommendation.

### Luồng đầy đủ
```
[Trình duyệt]
   Người dùng thao tác → track() đẩy vào hàng đợi trong bộ nhớ
        │  (gom batch 10 event hoặc 5 giây, dùng sendBeacon)
        ▼
[API] POST /api/v1/tracking/events
   ├─ Validate schema, giới hạn 50 event/batch
   ├─ Enrich: userId từ JWT, IP, User-Agent, server timestamp
   ├─ Ghi thẳng vào tracking_events (bulk insert)
   └─ Trả 202 Accepted NGAY (không xử lý gì thêm)
        │
        ▼
[Worker] EventIngestionWorker — mỗi 10 giây
   ├─ SELECT ... WHERE processed_at IS NULL ORDER BY id LIMIT 500
   ├─ Cập nhật counter sản phẩm (view_count, click_count)
   ├─ Đẩy vào bộ đệm tính preference
   ├─ Cập nhật ma trận co-occurrence (sản phẩm cùng session)
   └─ UPDATE processed_at = NOW()
        │
        ▼
[Worker] PreferenceBuilder — mỗi 15 phút
   └─ Tính lại reco_user_preferences cho user có event mới
```

### Quy tắc
| Mã | Quy tắc |
|---|---|
| BR-07.1 | Ghi event **không bao giờ** được làm chậm hay làm hỏng request nghiệp vụ chính |
| BR-07.2 | Event có `occurred_at` từ client nhưng luôn kèm `received_at` từ server để phát hiện lệch giờ |
| BR-07.3 | Event trùng lặp (cùng `event_id`) bị bỏ qua — client có thể gửi lại khi mạng lỗi |
| BR-07.4 | `product_viewed` chỉ tính khi khách ở lại trang > 3 giây, tránh nhiễu do lướt qua |
| BR-07.5 | Event của bot (User-Agent đáng ngờ, tốc độ bất thường) bị loại khỏi dữ liệu huấn luyện |
| BR-07.6 | Event cũ hơn 180 ngày được nén thành dữ liệu tổng hợp rồi `DROP PARTITION` |

### Identity stitching
Khi khách ẩn danh đăng nhập:
```sql
UPDATE tracking_events
SET user_id = @userId
WHERE anonymous_id = @anonId AND user_id IS NULL;
```
Sau đó kích hoạt tính lại preference ngay lập tức. Nhờ bước này, khách vừa đăng ký đã có gợi ý cá nhân hóa dựa trên những gì họ xem trước đó — giải quyết được một phần bài toán cold start.

---

## NV-08 🔴 Xây dựng hồ sơ sở thích người dùng

### Thuật toán

Với mỗi user, worker quét event trong 90 ngày gần nhất và tính:

**Bước 1 — Tính điểm có suy giảm theo thời gian**
```
score(event) = weight(event_type) × decay(age_in_days)
decay(d)     = exp(-d / 30)        // event 30 ngày trước còn ~37% giá trị
```

**Bước 2 — Tổng hợp theo từng chiều**
```
brand_scores    = { "Lenovo": 45.2, "Asus": 22.1, "Dell": 8.5 }   → chuẩn hóa về [0,1]
category_scores = { "laptop_gaming": 60.1, "mouse": 12.0 }
spec_prefs      = { "ram_gb": 16, "cpu_tier": "high", "screen_size": 15.6 }
```

**Bước 3 — Khoảng giá quan tâm**
Lấy phân vị 25 và 75 của giá các sản phẩm khách đã tương tác, có trọng số theo `weight`. Dùng phân vị thay vì min–max để một lần lỡ xem laptop 80 triệu không kéo lệch cả hồ sơ.

**Bước 4 — Ghi kết quả**
```json
{
  "user_id": 1024,
  "brand_scores": { "lenovo": 0.62, "asus": 0.30, "dell": 0.08 },
  "category_scores": { "laptop_gaming": 0.71, "keyboard": 0.29 },
  "price_min": 15000000, "price_max": 25000000, "price_avg": 19800000,
  "spec_preferences": { "ram_min_gb": 16, "prefers_dedicated_gpu": true },
  "last_computed_at": "2026-07-23T10:00:00Z"
}
```

### Quy tắc
| Mã | Quy tắc |
|---|---|
| BR-08.1 | User có dưới 5 event → không tính preference, dùng gợi ý phổ biến |
| BR-08.2 | Event `purchased` có trọng số gấp 10 lần `product_viewed` |
| BR-08.3 | `cart_removed` là tín hiệu **âm**, làm giảm điểm |
| BR-08.4 | Preference tính lại tối đa 15 phút/lần cho mỗi user, tránh tốn tài nguyên vô ích |
| BR-08.5 | Khách phải xem được và xóa được hồ sơ sở thích của mình (minh bạch dữ liệu) |

### Vì sao dùng suy giảm theo thời gian
Không có decay thì hồ sơ sở thích bị đóng băng: khách mua laptop gaming 6 tháng trước, giờ đang tìm màn hình văn phòng, mà hệ thống vẫn cứ gợi ý laptop gaming. Decay làm hồ sơ **theo kịp nhu cầu hiện tại** của khách.

---

## NV-09 🔴 Recommendation System

### Giai đoạn 1 — Rule Based

| Slot hiển thị | Quy tắc |
|---|---|
| `product_similar` | Cùng danh mục + cùng khoảng giá ±20%, ưu tiên cùng brand, sắp theo `sold_count` |
| `product_bundle` | Phụ kiện thường mua kèm — tính từ co-occurrence trong đơn hàng |
| `cart_bundle` | Dựa trên sản phẩm trong giỏ; mua laptop → gợi chuột, balo, đế tản |
| `home_trending` | Bán chạy 30 ngày gần nhất, có trọng số theo độ mới |
| `home_new` | Sản phẩm mới đăng 14 ngày |
| `category_top` | Top sản phẩm trong danh mục theo điểm phổ biến |

Công thức mua kèm dùng **lift**, không dùng số lần xuất hiện thô:
```
lift(A, B) = P(A và B cùng đơn) / (P(A) × P(B))
```
Không có lift thì mọi laptop đều được gợi ý mua kèm cùng một con chuột rẻ nhất, vì món đó bán chạy nhất chứ không phải vì nó liên quan.

### Giai đoạn 2 — Personalized

Điểm cuối cùng của mỗi sản phẩm ứng viên:
```
final_score = 0.30 × rule_based_score
            + 0.25 × brand_match(user, product)
            + 0.20 × price_fit(user, product)
            + 0.15 × category_affinity(user, product)
            + 0.10 × popularity_score
```

Sau đó qua lớp lọc bắt buộc:
1. Loại sản phẩm hết hàng.
2. Loại sản phẩm khách đã mua (trừ nhóm tiêu hao/phụ kiện).
3. Loại sản phẩm đang xem.
4. **Đa dạng hóa:** tối đa 3 sản phẩm cùng brand trong một slot 12 sản phẩm.
5. Loại sản phẩm đã hiển thị 5 lần mà khách không click (chống mỏi mắt).

### Giai đoạn 3 — Machine Learning

**Bài toán:** dự đoán xác suất user `u` sẽ tương tác tích cực với sản phẩm `p`.

**Dữ liệu huấn luyện** — xuất từ `tracking_events`:

| Nhóm feature | Ví dụ |
|---|---|
| User | số đơn đã mua, giá trị đơn trung bình, brand ưa thích, khoảng giá, số ngày hoạt động |
| Product | giá, danh mục, brand, RAM, CPU tier, có GPU rời, rating, số review, tuổi sản phẩm |
| Tương tác | số lần user xem sản phẩm này, xem cùng danh mục, xem cùng brand |
| Ngữ cảnh | thứ trong tuần, giờ trong ngày, thiết bị, nguồn truy cập |

**Nhãn:** `1` nếu có `cart_added` hoặc `purchased` trong 7 ngày sau khi thấy sản phẩm; `0` nếu chỉ thấy mà không tương tác.

**Mô hình đề xuất:** LightGBM cho bài toán ranking (đơn giản, huấn luyện nhanh trên CPU, dễ giải thích bằng SHAP). Nếu muốn học sâu hơn thì thử thêm Matrix Factorization hoặc LightFM cho hybrid.

**Cách triển khai:**
1. Worker xuất dataset ra `/ml/data/train.csv` hằng tuần.
2. Script Python huấn luyện, đánh giá, lưu model.
3. Model phục vụ qua FastAPI ở `/predict` (batch scoring).
4. .NET gọi API này như một `IRecommendationProvider` mới.
5. **Bắt buộc có fallback:** ML service chết → orchestrator vẫn chạy bằng các provider còn lại.

### Đo lường hiệu quả

| Chỉ số | Cách tính | Mục tiêu |
|---|---|---|
| CTR | click / impression theo slot | Tăng qua từng giai đoạn |
| Conversion rate | mua / click từ slot gợi ý | |
| Coverage | % sản phẩm từng được gợi ý ít nhất 1 lần | > 60% |
| Diversity | số brand/danh mục khác nhau trong một slot | ≥ 3 |
| Novelty | tỉ lệ sản phẩm gợi ý không nằm trong top bán chạy | Tránh chỉ gợi hàng hot |

Không đo thì không biết giai đoạn 3 có thật sự tốt hơn giai đoạn 1 không. Rất nhiều dự án ML thất bại đúng ở chỗ này: mô hình phức tạp hơn nhưng CTR lại thấp hơn rule-based đơn giản, mà không ai phát hiện ra.

---

## NV-10 🔴 AI Shopping Assistant

### Luồng nghiệp vụ chi tiết

**Đầu vào:** "Tôi có khoảng 20 triệu, cần laptop để lập trình ASP.NET và chạy Docker"

**Bước 1 — Trích xuất ý định**
```
Prompt tới Ollama (model nhỏ, temperature 0.1, format=json):
  "Trích xuất yêu cầu mua hàng thành JSON theo schema sau. Chỉ trả JSON."

Kết quả:
{
  "category": "laptop",
  "budget_min": 17000000,
  "budget_max": 22000000,
  "use_case": "software_development",
  "requirements": {
    "ram_min_gb": 16,
    "cpu_tier": "mid_high",
    "storage_min_gb": 512,
    "needs_dedicated_gpu": false
  },
  "brand_preference": [],
  "confidence": 0.9
}
```

Lưu ý cách suy luận: "20 triệu" được nới thành khoảng 17–22 triệu vì khách nói "khoảng". "Docker + ASP.NET" được ánh xạ thành RAM tối thiểu 16GB — đây là **tri thức miền**, nên đặt trong prompt dưới dạng quy tắc rõ ràng chứ không phó mặc model tự đoán.

**Bước 2 — Truy vấn dữ liệu thật**
```sql
SELECT p.*, v.price, s.quantity - s.reserved_quantity AS available
FROM catalog_products p
JOIN catalog_product_variants v ON v.product_id = p.id
JOIN inventory_stocks s ON s.variant_id = v.id
WHERE p.category_id = @categoryId
  AND v.price BETWEEN @budgetMin AND @budgetMax
  AND p.status = 'Published'
  AND EXISTS (SELECT 1 FROM catalog_product_specs sp
              WHERE sp.product_id = p.id AND sp.spec_key='ram_gb'
                AND sp.spec_value_num >= @ramMin)
ORDER BY p.avg_rating DESC, p.sold_count DESC
LIMIT 8;
```

**Bước 3 — Dựng context và gọi LLM**
```
SYSTEM: Bạn là tư vấn viên bán laptop. CHỈ dùng thông tin trong CONTEXT.
Nếu context không có sản phẩm phù hợp, hãy nói rõ là không tìm thấy.
TUYỆT ĐỐI không bịa tên sản phẩm, giá, hay cấu hình.
Khi nhắc sản phẩm, ghi kèm số thứ tự dạng [1], [2].

CONTEXT:
[1] Lenovo ThinkBook 14 G6 — 19.490.000đ — i5-13500H, 16GB DDR5, 512GB SSD, còn 12 chiếc
[2] Asus Vivobook Pro 15 — 21.990.000đ — Ryzen 7 7735HS, 16GB, 512GB SSD, còn 5 chiếc
...

HỒ SƠ KHÁCH (nếu có): thường xem Lenovo, khoảng giá 18–22 triệu

USER: Tôi có khoảng 20 triệu, cần laptop lập trình ASP.NET và Docker
```

**Bước 4 — Trả về**
Stream văn bản qua SSE. Event cuối cùng gửi `{"productIds": [501, 502, 507]}` để frontend render card sản phẩm thật với ảnh, giá và nút "Thêm vào giỏ".

### Quy tắc
| Mã | Quy tắc |
|---|---|
| BR-10.1 | AI **không bao giờ** trả lời khi context rỗng — phải nói không tìm thấy và gợi ý nới ngân sách |
| BR-10.2 | AI không được sinh SQL; chỉ sinh JSON theo schema cố định |
| BR-10.3 | Mọi sản phẩm AI nhắc tới phải có trong `productIds` — nếu lệch thì có hallucination, cần log lại |
| BR-10.4 | Timeout 15 giây → fallback về kết quả tìm kiếm thuần backend, kèm thông báo nhẹ |
| BR-10.5 | Rate limit 10 câu/phút với user, 5 câu/phút với khách ẩn danh |
| BR-10.6 | Lưu toàn bộ hội thoại vào `ai_messages` để phân tích và cải thiện prompt |
| BR-10.7 | Câu hỏi của khách là event `ai_query_submitted` — nguồn dữ liệu nhu cầu rất giá trị |

### Ngoại lệ
- Khách hỏi ngoài phạm vi ("thời tiết hôm nay") → AI lịch sự từ chối và kéo về chủ đề mua sắm.
- Khách hỏi so sánh 2 sản phẩm cụ thể → nhánh riêng: lấy đúng 2 sản phẩm đó làm context, prompt so sánh theo từng tiêu chí.
- Ngân sách quá thấp so với yêu cầu → AI nói thẳng và đề xuất mức giá thực tế cần có.

---

## NV-11 🟡 AI Product Summary

### Luồng
1. Worker phát hiện sản phẩm mới hoặc `source_hash` thay đổi.
2. Dựng prompt từ thông số kỹ thuật + mô tả gốc + 3 review tiêu biểu.
3. Gọi Ollama sinh tóm tắt 2–3 câu hướng tới **người dùng nào phù hợp**, không lặp lại thông số.
4. Lưu vào `ai_product_summaries` kèm `model` và `generated_at`.
5. Trang chi tiết đọc thẳng từ DB, không gọi LLM lúc render.

### Quy tắc
| Mã | Quy tắc |
|---|---|
| BR-11.1 | Summary sinh sẵn bất đồng bộ, **không bao giờ** gọi LLM trong request hiển thị trang |
| BR-11.2 | Nội dung tối đa 300 ký tự, không được chứa giá (giá thay đổi thường xuyên) |
| BR-11.3 | Sản phẩm chưa có summary → hiển thị mô tả gốc, không hiển thị placeholder |
| BR-11.4 | Admin xem, sửa tay và khóa summary nếu AI viết sai |

---

## NV-12 🟡 AI Explanation cho Recommendation

### Luồng
Khi khách bấm biểu tượng "?" bên cạnh một sản phẩm được gợi ý:

1. Backend lấy: lý do gợi ý ở dạng có cấu trúc (provider nào, điểm bao nhiêu, khớp chiều nào) + preference của khách.
2. Gửi cho LLM để diễn đạt thành câu tự nhiên.
3. Trả về giải thích.

**Đầu vào có cấu trúc:**
```json
{
  "product": "Lenovo ThinkBook 14 G6",
  "matched_signals": [
    { "type": "brand_affinity", "detail": "đã xem 8 sản phẩm Lenovo trong 30 ngày" },
    { "type": "price_fit", "detail": "giá 19.5tr nằm trong khoảng thường xem 18–22tr" },
    { "type": "spec_match", "detail": "16GB RAM khớp nhu cầu lập trình" }
  ],
  "provider": "preference_based",
  "score": 0.87
}
```

**Đầu ra:** "Sản phẩm này được đề xuất vì gần đây bạn thường xem các laptop Lenovo ở phân khúc 18–22 triệu, và cấu hình 16GB RAM của máy phù hợp với nhu cầu lập trình mà bạn quan tâm."

### Quy tắc
| Mã | Quy tắc |
|---|---|
| BR-12.1 | AI chỉ **diễn đạt lại** tín hiệu có thật, tuyệt đối không tự nghĩ ra lý do |
| BR-12.2 | Nếu không có tín hiệu nào (user mới) → không hiện nút giải thích |
| BR-12.3 | Giải thích được cache theo (user, product) trong 24h |
| BR-12.4 | Không tiết lộ điểm số hay tên thuật toán cho người dùng cuối |

Chức năng này nhỏ nhưng có giá trị lớn khi đi phỏng vấn: nó thể hiện bạn hiểu **explainable AI**, và hiểu rằng recommendation không phải hộp đen mà là chuỗi tín hiệu có thể truy vết.

---

## NV-13 🟢 Dashboard quản trị

### Nhóm chỉ số

**Kinh doanh:** doanh thu theo ngày/tuần/tháng, số đơn theo trạng thái, giá trị đơn trung bình, top sản phẩm bán chạy, top danh mục.

**Phễu chuyển đổi:**
```
Lượt xem sản phẩm  100.000
   ↓ 12%
Thêm giỏ hàng       12.000
   ↓ 35%
Bắt đầu thanh toán   4.200
   ↓ 78%
Đặt hàng thành công  3.276
```

**Hiệu quả recommendation:** CTR theo từng slot, doanh thu quy cho gợi ý, coverage, so sánh giữa các provider.

**Hiệu quả AI:** số câu hỏi/ngày, độ trễ trung bình, tỉ lệ hội thoại dẫn đến thêm giỏ hàng, top chủ đề khách hỏi.

### Quy tắc
| Mã | Quy tắc |
|---|---|
| BR-13.1 | Dashboard đọc từ **bảng tổng hợp** do worker tính sẵn, không truy vấn trực tiếp bảng event |
| BR-13.2 | Dữ liệu cập nhật mỗi giờ; hiển thị rõ thời điểm cập nhật gần nhất |
| BR-13.3 | Doanh thu chỉ tính đơn `Completed`, không tính đơn đã hủy hay trả |

---

# PHẦN C — MA TRẬN QUYỀN

| Chức năng | Guest | Customer | Staff | Admin |
|---|:---:|:---:|:---:|:---:|
| Xem, tìm kiếm sản phẩm | ✅ | ✅ | ✅ | ✅ |
| Giỏ hàng | ✅ | ✅ | ✅ | ✅ |
| Đặt hàng | ❌ | ✅ | ✅ | ✅ |
| Xem đơn của mình | ❌ | ✅ | ✅ | ✅ |
| Đánh giá sản phẩm | ❌ | ✅ | ✅ | ✅ |
| Yêu thích | ❌ | ✅ | ✅ | ✅ |
| Gợi ý cá nhân hóa | ❌ | ✅ | ✅ | ✅ |
| AI Assistant | ✅ (giới hạn) | ✅ | ✅ | ✅ |
| Duyệt đánh giá | ❌ | ❌ | ✅ | ✅ |
| Cập nhật trạng thái đơn | ❌ | ❌ | ✅ | ✅ |
| Cập nhật kho | ❌ | ❌ | ✅ | ✅ |
| Quản lý sản phẩm, danh mục | ❌ | ❌ | ❌ | ✅ |
| Quản lý người dùng, phân quyền | ❌ | ❌ | ❌ | ✅ |
| Dashboard đầy đủ | ❌ | ❌ | Một phần | ✅ |
| Cấu hình Recommendation / AI | ❌ | ❌ | ❌ | ✅ |

---

# PHẦN D — THỨ TỰ TRIỂN KHAI ĐỀ XUẤT

| Tuần | Nghiệp vụ | Ghi chú |
|---|---|---|
| 1–2 | NV-01 | Kèm dựng solution, Docker Compose, EF Core |
| 3–4 | NV-02, NV-05 | Catalog và Inventory — nên làm cùng nhau |
| 5–6 | NV-03, NV-04 | Cart và Ordering — phần khó nhất, làm chậm và kỹ |
| 7 | NV-06, NV-13 (cơ bản) | |
| 8–9 | **NV-07** | Event Tracking — mốc quan trọng nhất |
| 10–11 | NV-09 giai đoạn 1 | Rule Based Recommendation |
| 12–13 | NV-08, NV-09 giai đoạn 2 | Preference và personalized ranking |
| 14–16 | NV-10, NV-11, NV-12 | Toàn bộ khối AI |
| 17–20 | NV-09 giai đoạn 3 | Machine Learning |
| 21+ | Mở rộng | RabbitMQ, Elasticsearch, A/B testing |

Một lời khuyên thực tế: **đừng bỏ qua tuần 8–9 để nhảy sang AI cho nhanh**. Không có event thì không có preference, không có preference thì recommendation cá nhân hóa chỉ là if-else trá hình, và AI cũng chẳng có gì để dựa vào ngoài bộ lọc giá. Toàn bộ giá trị của dự án nằm ở chỗ các tầng này **thật sự nối được với nhau**.
