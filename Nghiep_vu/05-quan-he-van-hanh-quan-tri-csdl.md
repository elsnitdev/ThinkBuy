# TÀI LIỆU QUAN HỆ, VẬN HÀNH VÀ QUẢN TRỊ CƠ SỞ DỮ LIỆU

## AI-Powered Laptop Commerce Platform — MySQL 8

Tài liệu này trả lời ba câu hỏi: các bảng **liên kết với nhau thế nào**, dữ liệu **chảy qua hệ thống ra sao**, và bạn **vận hành & bảo trì** nó bằng cách nào.

---

## MỤC LỤC

- [1. Nguyên tắc quản trị dữ liệu](#1-nguyên-tắc-quản-trị-dữ-liệu)
- [2. Bản đồ quan hệ đầy đủ](#2-bản-đồ-quan-hệ-đầy-đủ)
- [3. Ranh giới module và quy tắc truy cập](#3-ranh-giới-module-và-quy-tắc-truy-cập)
- [4. Phân loại dữ liệu theo vòng đời](#4-phân-loại-dữ-liệu-theo-vòng-đời)
- [5. Chiến lược Index](#5-chiến-lược-index)
- [6. Transaction và xử lý đồng thời](#6-transaction-và-xử-lý-đồng-thời)
- [7. Luồng vận hành dữ liệu](#7-luồng-vận-hành-dữ-liệu)
- [8. Lịch chạy Background Worker](#8-lịch-chạy-background-worker)
- [9. Partition và dọn dẹp dữ liệu](#9-partition-và-dọn-dẹp-dữ-liệu)
- [10. Quản lý Migration](#10-quản-lý-migration)
- [11. Seed dữ liệu mẫu](#11-seed-dữ-liệu-mẫu)
- [12. Backup và khôi phục](#12-backup-và-khôi-phục)
- [13. Giám sát và kiểm tra sức khỏe](#13-giám-sát-và-kiểm-tra-sức-khỏe)
- [14. Bảo mật và phân quyền DB](#14-bảo-mật-và-phân-quyền-db)
- [15. Xử lý sự cố thường gặp](#15-xử-lý-sự-cố-thường-gặp)
- [16. Checklist vận hành](#16-checklist-vận-hành)

---

## 1. Nguyên tắc quản trị dữ liệu

Bảy nguyên tắc chi phối toàn bộ thiết kế. Khi phân vân, quay về đây.

| #        | Nguyên tắc                                               | Ý nghĩa thực tế                                                                                               |
| -------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **DP-1** | Một database, nhiều schema logic                         | Tất cả module dùng chung DB `laptop_commerce`, tách nhau bằng prefix bảng. Giữ được transaction xuyên module. |
| **DP-2** | Khóa ngoại chỉ tồn tại trong cùng module                 | Ràng buộc chéo module là tham chiếu logic, được đảm bảo ở tầng Application.                                   |
| **DP-3** | Dữ liệu lịch sử là bất biến                              | Đơn hàng lưu snapshot. Sản phẩm đổi giá không được làm đổi lịch sử.                                           |
| **DP-4** | Dữ liệu dẫn xuất có thể tái tạo                          | Mọi bảng `reco_*` và `ai_product_summaries` xóa đi được, worker dựng lại từ nguồn.                            |
| **DP-5** | Event là append-only                                     | `tracking_events` chỉ thêm và cập nhật `processed_at`. Không bao giờ `UPDATE` nội dung, không `DELETE` lẻ.    |
| **DP-6** | Ghi nghiệp vụ và ghi event không được ràng buộc lẫn nhau | Tracking chết thì đặt hàng vẫn chạy.                                                                          |
| **DP-7** | Không tin dữ liệu từ client                              | Giá, tồn kho, quyền sở hữu luôn đọc lại từ DB trong transaction.                                              |

---

## 2. Bản đồ quan hệ đầy đủ

### 2.1. Ký hiệu

| Ký hiệu     | Nghĩa                                                               |
| ----------- | ------------------------------------------------------------------- |
| `1 — 1`     | Một đối một                                                         |
| `1 — N`     | Một đối nhiều                                                       |
| `N — N`     | Nhiều đối nhiều (qua bảng trung gian)                               |
| **FK thật** | Có `FOREIGN KEY` trong MySQL, DB tự bảo vệ                          |
| **Logic**   | Chỉ lưu id, không có constraint; Application layer chịu trách nhiệm |

### 2.2. Bảng quan hệ chi tiết

#### Nhóm Catalog

| Bảng cha             | Bảng con                   | Kiểu | Loại    | Hành vi xóa | Ghi chú                                                       |
| -------------------- | -------------------------- | ---- | ------- | ----------- | ------------------------------------------------------------- |
| `catalog_categories` | `catalog_categories`       | 1—N  | FK thật | `RESTRICT`  | Tự tham chiếu qua `parent_id`; không cho xóa danh mục còn con |
| `catalog_categories` | `catalog_products`         | 1—N  | FK thật | `RESTRICT`  | Không cho xóa danh mục còn sản phẩm                           |
| `catalog_brands`     | `catalog_products`         | 1—N  | FK thật | `RESTRICT`  |                                                               |
| `catalog_products`   | `catalog_product_variants` | 1—N  | FK thật | `CASCADE`   | Sản phẩm bị xóa cứng thì variant biến mất theo                |
| `catalog_products`   | `catalog_product_specs`    | 1—N  | FK thật | `CASCADE`   |                                                               |
| `catalog_products`   | `catalog_product_images`   | 1—N  | FK thật | `CASCADE`   |                                                               |

Sản phẩm dùng **xóa mềm** (`deleted_at`) trong vận hành bình thường, nên `CASCADE` hầu như không kích hoạt. Nó tồn tại để dọn dẹp dữ liệu test hoặc dữ liệu rác.

#### Nhóm Inventory

| Bảng cha                   | Bảng con                 | Kiểu | Loại      | Hành vi xóa |
| -------------------------- | ------------------------ | ---- | --------- | ----------- |
| `catalog_product_variants` | `inventory_stocks`       | 1—1  | FK thật   | `CASCADE`   |
| `catalog_product_variants` | `inventory_transactions` | 1—N  | FK thật   | `RESTRICT`  |
| `catalog_product_variants` | `inventory_reservations` | 1—N  | FK thật   | `CASCADE`   |
| `ordering_orders`          | `inventory_reservations` | 1—N  | **Logic** | —           |

> Inventory và Catalog cố tình đặt chung ranh giới FK vì tồn kho vô nghĩa nếu không có variant. Nhưng `reservations.order_id` thì chỉ là số — Ordering là module khác.

Ràng buộc bất biến (invariant) phải luôn đúng:

```
inventory_stocks.quantity >= inventory_stocks.reserved_quantity >= 0
```

Kiểm tra ở tầng Domain, đồng thời thêm `CHECK` constraint làm lưới an toàn cuối:

```sql
ALTER TABLE inventory_stocks
  ADD CONSTRAINT ck_stock_non_negative
  CHECK (quantity >= 0 AND reserved_quantity >= 0 AND quantity >= reserved_quantity);
```

#### Nhóm Identity

| Bảng cha         | Bảng con                  | Kiểu | Loại    | Hành vi xóa |
| ---------------- | ------------------------- | ---- | ------- | ----------- |
| `identity_users` | `identity_user_roles`     | 1—N  | FK thật | `CASCADE`   |
| `identity_roles` | `identity_user_roles`     | 1—N  | FK thật | `RESTRICT`  |
| `identity_users` | `identity_refresh_tokens` | 1—N  | FK thật | `CASCADE`   |
| `identity_users` | `identity_addresses`      | 1—N  | FK thật | `CASCADE`   |

`identity_users` ↔ `identity_roles` là quan hệ **N—N** qua `identity_user_roles` (khóa chính kép).

#### Nhóm Cart

| Bảng cha                   | Bảng con     | Kiểu   | Loại      | Hành vi xóa |
| -------------------------- | ------------ | ------ | --------- | ----------- |
| `identity_users`           | `cart_carts` | 1—0..1 | **Logic** | —           |
| `cart_carts`               | `cart_items` | 1—N    | FK thật   | `CASCADE`   |
| `catalog_product_variants` | `cart_items` | 1—N    | **Logic** | —           |

Mỗi user có tối đa **một** giỏ hàng đang hoạt động. Ràng buộc bằng unique index có điều kiện:

```sql
CREATE UNIQUE INDEX ux_cart_user ON cart_carts(user_id);
CREATE UNIQUE INDEX ux_cart_anon ON cart_carts(anonymous_id);
CREATE UNIQUE INDEX ux_cart_item ON cart_items(cart_id, variant_id);
```

Unique index cuối cùng là thứ khiến logic "đã có thì cộng dồn" trở nên an toàn ngay cả khi có hai request đồng thời.

#### Nhóm Ordering

| Bảng cha           | Bảng con                        | Kiểu | Loại      | Hành vi xóa |
| ------------------ | ------------------------------- | ---- | --------- | ----------- |
| `identity_users`   | `ordering_orders`               | 1—N  | **Logic** | —           |
| `ordering_orders`  | `ordering_order_items`          | 1—N  | FK thật   | `RESTRICT`  |
| `ordering_orders`  | `ordering_order_status_history` | 1—N  | FK thật   | `CASCADE`   |
| `catalog_products` | `ordering_order_items`          | 1—N  | **Logic** | —           |

Đơn hàng **không bao giờ được xóa**, kể cả xóa mềm. Đơn sai thì chuyển trạng thái `Cancelled` kèm ghi chú. Đây là dữ liệu tài chính.

#### Nhóm Review & Wishlist

| Bảng cha           | Bảng con         | Kiểu | Loại      | Ràng buộc bổ sung      |
| ------------------ | ---------------- | ---- | --------- | ---------------------- |
| `identity_users`   | `review_reviews` | 1—N  | **Logic** |                        |
| `ordering_orders`  | `review_reviews` | 1—N  | **Logic** | Bắt buộc có `order_id` |
| `catalog_products` | `review_reviews` | 1—N  | **Logic** |                        |
| `identity_users`   | `wishlist_items` | 1—N  | **Logic** |                        |

```sql
CREATE UNIQUE INDEX ux_review_once ON review_reviews(user_id, product_id, order_id);
CREATE UNIQUE INDEX ux_wishlist    ON wishlist_items(user_id, product_id);
```

Điều kiện được đánh giá không thể diễn đạt bằng constraint SQL, phải kiểm ở Application:

```
tồn tại ordering_orders o:
  o.id = @orderId
  AND o.user_id = @userId
  AND o.status = 'Completed'
  AND tồn tại ordering_order_items i: i.order_id = o.id AND i.product_id = @productId
```

#### Nhóm Tracking, Recommendation, AI

| Bảng nguồn              | Bảng đích                 | Kiểu | Loại              | Cơ chế                                        |
| ----------------------- | ------------------------- | ---- | ----------------- | --------------------------------------------- |
| `identity_users`        | `tracking_events`         | 1—N  | **Logic**         | `user_id` có thể `NULL` (khách ẩn danh)       |
| `tracking_events`       | `reco_user_preferences`   | N—1  | **Dẫn xuất**      | `PreferenceBuilder` tổng hợp                  |
| `tracking_events`       | `reco_product_similarity` | N—N  | **Dẫn xuất**      | `SimilarityCalculator` tính co-occurrence     |
| `reco_user_preferences` | `reco_precomputed`        | 1—N  | **Dẫn xuất**      | `RecoPrecomputer` sinh sẵn theo slot          |
| `reco_precomputed`      | `reco_impressions`        | 1—N  | **Logic**         | Ghi khi thực sự hiển thị                      |
| `identity_users`        | `ai_conversations`        | 1—N  | **Logic**         |                                               |
| `ai_conversations`      | `ai_messages`             | 1—N  | FK thật           | `CASCADE`                                     |
| `catalog_products`      | `ai_product_summaries`    | 1—1  | **Logic**         | Sinh bởi `AiSummaryWorker`                    |
| Mọi module              | `outbox_messages`         | N—1  | **Không quan hệ** | Bảng phẳng, chỉ chứa `event_type` + `payload` |

> **Quan hệ dẫn xuất** không phải quan hệ dữ liệu theo nghĩa quan hệ đại số. Nó là quan hệ **tính toán**: bảng đích được worker sinh ra từ bảng nguồn. Không có FK, không có ràng buộc toàn vẹn, và xóa bảng đích không gây lỗi gì.

### 2.3. Sơ đồ phụ thuộc giữa các nhóm bảng

```
                    identity_users
                    /   |    |    \
                   /    |    |     \
             cart_carts |    |   ordering_orders
                 |      |    |      /    |    \
            cart_items  |    |     /     |  order_items
                 :      |    |    /      |     :
                 :   wishlist |  /  status_history
                 :      :     | /        :
                 :      :  review_reviews:
                 :      :     :          :
        catalog_product_variants ··· catalog_products
                 |                       |
          inventory_stocks       product_specs / images
          inventory_transactions
          inventory_reservations

        ── ─ ─ ─ ─ tầng dữ liệu dẫn xuất ─ ─ ─ ─ ──
        tracking_events ──► reco_user_preferences ──► reco_precomputed ──► reco_impressions
               └──────────► reco_product_similarity
        ai_conversations ──► ai_messages
        catalog_products ··► ai_product_summaries
        (mọi module) ──────► outbox_messages

  ── : khóa ngoại thật     ·· : tham chiếu logic     ──► : sinh ra bởi worker
```

---

## 3. Ranh giới module và quy tắc truy cập

### 3.1. Quy tắc bất di bất dịch

| Mã       | Quy tắc                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| **AR-1** | Mỗi module chỉ có `DbContext` của chính nó, chỉ khai báo `DbSet` cho bảng có prefix của mình                       |
| **AR-2** | Không `JOIN` xuyên prefix module trong bất kỳ truy vấn nào                                                         |
| **AR-3** | Cần dữ liệu module khác → gọi qua interface trong `LaptopCommerce.Contracts`, hoặc lắng nghe Integration Event     |
| **AR-4** | Cần transaction xuyên module → dùng `TransactionScope` ở tầng Application của use case, không dùng DbContext chung |
| **AR-5** | View đọc-nhiều được phép JOIN xuyên module, nhưng phải khai báo tường minh và có test kiểm chứng                   |

### 3.2. Ví dụ cụ thể — vi phạm và cách sửa

**Sai:**

```csharp
// Trong Ordering module
var order = await _db.Orders
    .Include(o => o.Items)
    .Join(_catalogDb.Products, ...)   // ❌ chạm sang DbContext module khác
    .FirstAsync();
```

**Đúng:**

```csharp
// Ordering.Application/Abstractions/IProductLookup.cs
public interface IProductLookup {
    Task<IReadOnlyDictionary<long, ProductBrief>> GetBriefsAsync(
        IEnumerable<long> productIds, CancellationToken ct);
}

// Catalog.Infrastructure hiện thực interface này và đăng ký DI ở API Host
```

Cách này chậm hơn một chút vì mất một round-trip. Đổi lại, khi bạn tách Ordering thành service riêng thì chỉ cần thay implementation của `IProductLookup` bằng HTTP client — không đụng vào một dòng nào của Domain hay Application.

### 3.3. Kiểm tra ranh giới tự động

Đặt trong `LaptopCommerce.ArchitectureTests`:

```csharp
[Fact]
public void Domain_khong_duoc_phu_thuoc_EFCore() {
    var result = Types.InAssembly(typeof(Product).Assembly)
        .Should().NotHaveDependencyOn("Microsoft.EntityFrameworkCore")
        .GetResult();
    result.IsSuccessful.Should().BeTrue();
}

[Fact]
public void Ordering_khong_duoc_tham_chieu_Catalog_Infrastructure() {
    var result = Types.InAssembly(typeof(Order).Assembly)
        .Should().NotHaveDependencyOn("LaptopCommerce.Catalog.Infrastructure")
        .GetResult();
    result.IsSuccessful.Should().BeTrue();
}
```

Hai bài test này chạy trong CI. Chúng là thứ duy nhất ngăn dự án trượt dần từ modular monolith thành "big ball of mud" sau vài tháng.

---

## 4. Phân loại dữ liệu theo vòng đời

| Nhóm                | Bảng                              | Tần suất ghi | Tần suất đọc | Giữ bao lâu                 | Backup              |
| ------------------- | --------------------------------- | ------------ | ------------ | --------------------------- | ------------------- |
| **Tham chiếu**      | categories, brands                | Rất hiếm     | Rất cao      | Vĩnh viễn                   | ✅                  |
| **Nghiệp vụ chính** | products, variants, specs         | Thấp         | Rất cao      | Vĩnh viễn (xóa mềm)         | ✅                  |
| **Giao dịch**       | orders, order_items, transactions | Trung bình   | Trung bình   | Vĩnh viễn, bất biến         | ✅ Ưu tiên cao nhất |
| **Trạng thái sống** | stocks, reservations, carts       | Cao          | Cao          | Đến khi hết hiệu lực        | ✅                  |
| **Người dùng**      | users, addresses, roles           | Thấp         | Cao          | Vĩnh viễn                   | ✅                  |
| **Token**           | refresh_tokens                    | Cao          | Cao          | Xóa sau khi hết hạn 30 ngày | ❌                  |
| **Event**           | tracking_events                   | **Rất cao**  | Theo batch   | 180 ngày rồi nén            | ⚠️ Chỉ bản nén      |
| **Dẫn xuất**        | reco\_\*, ai_product_summaries    | Theo job     | Cao          | Tái tạo được                | ❌                  |
| **Hội thoại AI**    | ai_conversations, ai_messages     | Trung bình   | Thấp         | 90 ngày                     | ⚠️ Tùy chọn         |
| **Hạ tầng**         | outbox_messages                   | Cao          | Cao          | Xóa sau xử lý 7 ngày        | ❌                  |

Bảng này quyết định chiến lược backup. Backup `tracking_events` hằng ngày là lãng phí dung lượng; mất `ordering_orders` là thảm họa.

---

## 5. Chiến lược Index

### 5.1. Nguyên tắc

- Index theo **truy vấn thực tế**, không theo cảm tính. Viết truy vấn trước, `EXPLAIN`, rồi mới thêm index.
- Cột có tính chọn lọc cao (`selectivity`) đứng **trước** trong composite index.
- Cột dùng cho `WHERE` bằng đứng trước cột dùng cho `ORDER BY` hoặc `RANGE`.
- Mỗi index thêm vào làm chậm `INSERT`/`UPDATE`. Bảng ghi nhiều như `tracking_events` phải hà tiện index.
- Index thừa còn tệ hơn thiếu index: nó chiếm dung lượng, làm chậm ghi, và đánh lừa optimizer.

### 5.2. Danh sách index theo bảng

**catalog_products**

```sql
CREATE INDEX ix_products_category_status ON catalog_products(category_id, status, deleted_at);
CREATE INDEX ix_products_brand           ON catalog_products(brand_id, status);
CREATE INDEX ix_products_price           ON catalog_products(base_price);
CREATE INDEX ix_products_popular         ON catalog_products(status, sold_count DESC);
CREATE INDEX ix_products_new             ON catalog_products(status, created_at DESC);
CREATE UNIQUE INDEX ux_products_slug     ON catalog_products(slug);
CREATE FULLTEXT INDEX ft_products_search ON catalog_products(name, description);
```

**catalog_product_specs** — index này là thứ làm cho bộ lọc kỹ thuật chạy nhanh

```sql
CREATE INDEX ix_specs_filter  ON catalog_product_specs(spec_key, spec_value_num, product_id);
CREATE INDEX ix_specs_product ON catalog_product_specs(product_id, spec_key);
```

**catalog_product_variants**

```sql
CREATE UNIQUE INDEX ux_variants_sku ON catalog_product_variants(sku);
CREATE INDEX ix_variants_product    ON catalog_product_variants(product_id, is_active);
```

**inventory**

```sql
CREATE INDEX ix_reservations_expiry ON inventory_reservations(status, expires_at);
CREATE INDEX ix_inv_trans_variant   ON inventory_transactions(variant_id, created_at DESC);
```

**ordering_orders**

```sql
CREATE UNIQUE INDEX ux_orders_code   ON ordering_orders(code);
CREATE INDEX ix_orders_user          ON ordering_orders(user_id, placed_at DESC);
CREATE INDEX ix_orders_status        ON ordering_orders(status, placed_at DESC);
CREATE INDEX ix_orders_revenue       ON ordering_orders(status, completed_at);
CREATE UNIQUE INDEX ux_orders_idem   ON ordering_orders(idempotency_key);
```

**tracking_events** — chỉ 3 index, không hơn

```sql
CREATE INDEX ix_events_user        ON tracking_events(user_id, occurred_at);
CREATE INDEX ix_events_unprocessed ON tracking_events(processed_at, id);
CREATE INDEX ix_events_product     ON tracking_events(product_id, event_type, occurred_at);
```

Cám dỗ lớn nhất là thêm index cho `session_id`, `anonymous_id`, `category_id`, `brand_id`... Đừng. Bảng này ghi hàng nghìn dòng mỗi phút; mỗi index là một cái phanh. Việc phân tích theo các chiều đó là việc của bảng tổng hợp do worker sinh ra, không phải việc truy vấn trực tiếp.

**reco & ai**

```sql
CREATE INDEX ix_similarity ON reco_product_similarity(product_id, score DESC);
CREATE INDEX ix_precomputed_expiry ON reco_precomputed(expires_at);
CREATE INDEX ix_impressions_ctr ON reco_impressions(slot, shown_at, clicked_at);
CREATE INDEX ix_ai_messages_conv ON ai_messages(conversation_id, created_at);
```

**outbox_messages**

```sql
CREATE INDEX ix_outbox_pending ON outbox_messages(processed_at, occurred_at);
```

### 5.3. Kiểm tra index có được dùng không

```sql
-- Index nào chưa từng được dùng (cần bật performance_schema)
SELECT object_schema, object_name, index_name
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE index_name IS NOT NULL
  AND count_star = 0
  AND object_schema = 'laptop_commerce'
ORDER BY object_name;

-- Kích thước index so với dữ liệu
SELECT table_name,
       ROUND(data_length/1024/1024, 1)  AS data_mb,
       ROUND(index_length/1024/1024, 1) AS index_mb,
       ROUND(index_length/NULLIF(data_length,0), 2) AS ratio
FROM information_schema.tables
WHERE table_schema = 'laptop_commerce'
ORDER BY index_length DESC;
```

Nếu `ratio` vượt quá 1.0 trên một bảng ghi nhiều, bạn đang index quá tay.

---

## 6. Transaction và xử lý đồng thời

### 6.1. Ranh giới transaction

| Use case           | Phạm vi transaction                                 | Isolation                          |
| ------------------ | --------------------------------------------------- | ---------------------------------- |
| Đặt hàng           | Order + OrderItems + Reservations + Stocks + Outbox | `READ COMMITTED` + optimistic lock |
| Xác nhận đơn       | Order status + Stocks + History + Outbox            | `READ COMMITTED`                   |
| Hủy đơn            | Order status + hoàn Stocks + Transactions + Outbox  | `READ COMMITTED`                   |
| Thêm giỏ hàng      | Cart + CartItem                                     | `READ COMMITTED`                   |
| Ghi event          | Không transaction                                   | Bulk insert                        |
| Worker xử lý event | Từng batch một transaction                          | `READ COMMITTED`                   |
| Tính preference    | Ghi đè một dòng                                     | Không cần transaction              |

MySQL mặc định `REPEATABLE READ`. Dự án này nên đổi sang `READ COMMITTED` vì nó giảm gap lock, phù hợp với khối lượng ghi cao của `tracking_events` và tránh deadlock không cần thiết:

```sql
SET GLOBAL TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

### 6.2. Chống bán vượt kho — optimistic concurrency

**Cấu hình EF Core:**

```csharp
builder.Property(s => s.RowVersion).IsConcurrencyToken();
```

**Câu lệnh EF sinh ra:**

```sql
UPDATE inventory_stocks
SET reserved_quantity = reserved_quantity + 1,
    row_version = row_version + 1
WHERE variant_id = 501 AND row_version = 7;
-- Nếu affected rows = 0 → có người khác vừa sửa → ném DbUpdateConcurrencyException
```

**Xử lý trong handler:**

```csharp
const int MaxRetry = 3;
for (int attempt = 1; attempt <= MaxRetry; attempt++) {
    try {
        await PlaceOrderInternalAsync(cmd, ct);
        return Result.Success();
    }
    catch (DbUpdateConcurrencyException) when (attempt < MaxRetry) {
        await Task.Delay(50 * attempt, ct);   // backoff
        _db.ChangeTracker.Clear();             // bỏ state cũ, đọc lại
    }
}
return Result.Failure("Sản phẩm vừa hết hàng, vui lòng thử lại.");
```

Vì sao chọn optimistic thay vì `SELECT ... FOR UPDATE`? Xung đột tồn kho trên một shop laptop là **hiếm** — chỉ xảy ra với hàng sắp hết. Pessimistic lock bắt mọi request phải xếp hàng để phòng một tình huống hiếm gặp. Optimistic để 99% request chạy song song, chỉ 1% phải thử lại.

### 6.3. Thứ tự khóa để tránh deadlock

Deadlock xảy ra khi hai transaction khóa cùng bộ tài nguyên theo thứ tự khác nhau. Quy tắc: **luôn khóa theo `variant_id` tăng dần**.

```csharp
var variantIds = cart.Items.Select(i => i.VariantId).OrderBy(id => id).ToList();
foreach (var id in variantIds) {
    // xử lý từng variant theo thứ tự đã sắp
}
```

Không có bước `OrderBy` này, hai khách cùng mua hai món giống nhau nhưng thêm vào giỏ theo thứ tự ngược nhau sẽ tạo deadlock ngẫu nhiên — loại bug rất khó tái hiện.

### 6.4. Idempotency khi đặt hàng

```sql
ALTER TABLE ordering_orders ADD COLUMN idempotency_key CHAR(36) NULL;
CREATE UNIQUE INDEX ux_orders_idem ON ordering_orders(idempotency_key);
```

Client gửi header `Idempotency-Key`. Nếu unique index báo trùng, backend trả về đúng đơn hàng đã tạo trước đó thay vì báo lỗi. Đây là cách xử lý người dùng bấm nút "Đặt hàng" hai lần hoặc mạng chập chờn khiến client gửi lại.

### 6.5. Outbox — bảo đảm không mất event

```csharp
// TransactionBehavior trong MediatR pipeline
await using var tx = await _db.Database.BeginTransactionAsync(ct);
try {
    var response = await next();                 // handler ghi dữ liệu nghiệp vụ
    await _outbox.SaveDomainEventsAsync(ct);     // ghi event vào cùng transaction
    await _db.SaveChangesAsync(ct);
    await tx.CommitAsync(ct);
    return response;
}
catch {
    await tx.RollbackAsync(ct);
    throw;
}
```

Worker đọc và xử lý:

```sql
SELECT id, event_type, payload
FROM outbox_messages
WHERE processed_at IS NULL AND retry_count < 5
ORDER BY occurred_at
LIMIT 100
FOR UPDATE SKIP LOCKED;
```

`FOR UPDATE SKIP LOCKED` là điểm mấu chốt: nó cho phép chạy nhiều instance worker song song mà không instance nào xử lý trùng message của instance khác.

---

## 7. Luồng vận hành dữ liệu

### 7.1. Từ cú click đến gợi ý cá nhân hóa

```
[T+0ms]     Người dùng xem trang sản phẩm
            → React gọi track('product_viewed', {...})
            → Đẩy vào hàng đợi trong bộ nhớ trình duyệt

[T+5s]      Hàng đợi đủ 10 event hoặc hết 5 giây
            → navigator.sendBeacon POST /api/v1/tracking/events

[T+5s]      API nhận batch
            → Validate, enrich userId từ JWT, gắn received_at
            → INSERT bulk vào tracking_events (processed_at = NULL)
            → Trả 202 Accepted  ⏱ tổng cộng ~15ms

[T+15s]     EventIngestionWorker quét
            → SELECT ... WHERE processed_at IS NULL LIMIT 500
            → Cập nhật catalog_products.view_count
            → Cập nhật ma trận co-occurrence trong bộ đệm
            → UPDATE processed_at = NOW()

[T+15min]   PreferenceBuilder chạy
            → Lấy danh sách user có event mới
            → Tính brand_scores, category_scores, price range (có decay)
            → UPSERT reco_user_preferences

[T+15min]   Redis cache preference bị xóa
            → Lần request gợi ý tiếp theo sẽ nạp bản mới

[Đêm]       SimilarityCalculator + RecoPrecomputer
            → Tính reco_product_similarity từ toàn bộ đơn hàng
            → Sinh reco_precomputed cho user hoạt động

[Realtime]  Người dùng vào trang chủ
            → Đọc reco_precomputed (hoặc tính live nếu chưa có)
            → Blender trộn nhiều provider, lọc, đa dạng hóa
            → INSERT reco_impressions
            → Trả về frontend
```

Điểm cần nhớ: **đường đi của request người dùng và đường đi của dữ liệu là hai đường khác nhau**. Request luôn nhanh (đọc bảng đã tính sẵn); việc tính toán nặng nằm hết ở worker chạy nền.

### 7.2. Từ đơn hàng đến cập nhật kho

```
Khách bấm đặt hàng
   ↓
TRANSACTION mở
   ├─ Đọc lại giá từ catalog_product_variants
   ├─ UPDATE inventory_stocks SET reserved_quantity += n WHERE row_version = @v
   ├─ INSERT ordering_orders (status = Pending)
   ├─ INSERT ordering_order_items (kèm snapshot)
   ├─ INSERT inventory_reservations (expires_at = NOW() + 15 phút)
   ├─ INSERT outbox_messages (OrderPlaced)
   └─ COMMIT
   ↓
Trả mã đơn cho khách  ⏱ ~120ms
   ↓
[Bất đồng bộ] OutboxDispatcher đọc OrderPlaced
   ├─ INSERT tracking_events (purchased) cho từng sản phẩm
   ├─ UPDATE catalog_products.sold_count
   ├─ Gửi email xác nhận
   └─ Đánh dấu user cần tính lại preference
   ↓
[Khi Staff xác nhận] Order → Confirmed
   ├─ UPDATE inventory_stocks SET quantity -= n, reserved_quantity -= n
   ├─ INSERT inventory_transactions (type = Sale)
   ├─ DELETE inventory_reservations
   └─ INSERT ordering_order_status_history
   ↓
[Nếu quá 15 phút chưa thanh toán] ReservationExpirer
   ├─ UPDATE inventory_stocks SET reserved_quantity -= n
   ├─ UPDATE ordering_orders SET status = 'Cancelled'
   └─ UPDATE inventory_reservations SET status = 'Expired'
```

---

## 8. Lịch chạy Background Worker

| Worker                 | Chu kỳ          | Bảng đọc                 | Bảng ghi                          | Có được chạy song song? |
| ---------------------- | --------------- | ------------------------ | --------------------------------- | ----------------------- |
| `OutboxDispatcher`     | 5 giây          | outbox_messages          | outbox_messages                   | ✅ (nhờ `SKIP LOCKED`)  |
| `EventIngestionWorker` | 10 giây         | tracking_events          | tracking_events, catalog_products | ⚠️ Chỉ một instance     |
| `ReservationExpirer`   | 1 phút          | inventory_reservations   | stocks, orders, reservations      | ❌ Một instance         |
| `PreferenceBuilder`    | 15 phút         | tracking_events          | reco_user_preferences             | ✅ (chia theo user_id)  |
| `StatsAggregator`      | 1 giờ           | orders, events           | bảng aggregate                    | ❌                      |
| `AiSummaryWorker`      | 30 phút         | products, specs, reviews | ai_product_summaries              | ✅                      |
| `SimilarityCalculator` | 02:00 hằng ngày | order_items, events      | reco_product_similarity           | ❌                      |
| `RecoPrecomputer`      | 03:00 hằng ngày | preferences, similarity  | reco_precomputed                  | ✅                      |
| `DataRetentionWorker`  | 04:00 hằng ngày | mọi bảng                 | xóa/nén                           | ❌                      |
| `MlDatasetExporter`    | Chủ nhật 05:00  | tracking_events          | file CSV                          | ❌                      |

**Thứ tự phụ thuộc của job đêm** — chạy sai thứ tự thì kết quả sai một ngày:

```
02:00 SimilarityCalculator  (cần dữ liệu đơn hàng của ngày hôm trước)
   ↓
03:00 RecoPrecomputer       (cần similarity vừa tính xong)
   ↓
04:00 DataRetentionWorker   (chỉ dọn sau khi mọi thứ đã đọc xong dữ liệu cũ)
```

### Chống chạy trùng bằng khóa phân tán

Với các worker không được chạy song song, dùng advisory lock của MySQL:

```sql
SELECT GET_LOCK('worker:similarity_calculator', 0);  -- trả 1 nếu lấy được
-- ... chạy job ...
SELECT RELEASE_LOCK('worker:similarity_calculator');
```

Tham số `0` nghĩa là không chờ: instance thứ hai nhận về `0` và bỏ qua lượt chạy này thay vì xếp hàng.

---

## 9. Partition và dọn dẹp dữ liệu

### 9.1. Partition cho `tracking_events`

```sql
ALTER TABLE tracking_events
PARTITION BY RANGE (TO_DAYS(occurred_at)) (
  PARTITION p20260701 VALUES LESS THAN (TO_DAYS('2026-07-02')),
  PARTITION p20260702 VALUES LESS THAN (TO_DAYS('2026-07-03')),
  PARTITION pmax      VALUES LESS THAN MAXVALUE
);
```

> Ràng buộc của MySQL: mọi cột trong khóa chính và unique index **phải** chứa cột partition. Vì vậy `tracking_events` dùng khóa chính kép `(id, occurred_at)` thay vì chỉ `id`.

**Tạo partition mới cho ngày mai** (chạy trong `DataRetentionWorker`):

```sql
ALTER TABLE tracking_events REORGANIZE PARTITION pmax INTO (
  PARTITION p20260725 VALUES LESS THAN (TO_DAYS('2026-07-26')),
  PARTITION pmax      VALUES LESS THAN MAXVALUE
);
```

**Xóa dữ liệu quá 180 ngày:**

```sql
ALTER TABLE tracking_events DROP PARTITION p20260125;
```

Lệnh này chạy trong vài mili giây bất kể partition chứa bao nhiêu triệu dòng, vì MySQL chỉ việc xóa file. So với `DELETE FROM tracking_events WHERE occurred_at < ...` có thể khóa bảng hàng phút và làm phình transaction log — khác biệt là một trời một vực.

### 9.2. Nén trước khi xóa

Trước khi drop partition, tổng hợp thành dữ liệu thống kê để không mất hoàn toàn lịch sử:

```sql
INSERT INTO analytics_daily_product_stats
  (stat_date, product_id, view_count, click_count, cart_count, purchase_count)
SELECT DATE(occurred_at), product_id,
       SUM(event_type = 'product_viewed'),
       SUM(event_type = 'product_clicked'),
       SUM(event_type = 'cart_added'),
       SUM(event_type = 'purchased')
FROM tracking_events
WHERE occurred_at >= @from AND occurred_at < @to AND product_id IS NOT NULL
GROUP BY DATE(occurred_at), product_id;
```

### 9.3. Chính sách dọn dẹp toàn bộ

| Bảng                      | Điều kiện xóa                         | Cách xóa                     | Tần suất   |
| ------------------------- | ------------------------------------- | ---------------------------- | ---------- |
| `tracking_events`         | > 180 ngày                            | `DROP PARTITION` sau khi nén | Hằng ngày  |
| `outbox_messages`         | Đã xử lý > 7 ngày                     | `DELETE ... LIMIT 5000` lặp  | Hằng ngày  |
| `identity_refresh_tokens` | Hết hạn > 30 ngày                     | `DELETE ... LIMIT 5000`      | Hằng tuần  |
| `inventory_reservations`  | Status `Expired`/`Released` > 30 ngày | `DELETE`                     | Hằng tuần  |
| `cart_carts` (ẩn danh)    | Không hoạt động > 30 ngày             | `DELETE` cascade             | Hằng tuần  |
| `reco_impressions`        | > 90 ngày                             | `DELETE` sau khi tính CTR    | Hằng tuần  |
| `ai_messages`             | > 90 ngày                             | `DELETE`                     | Hằng tháng |
| `reco_precomputed`        | Đã hết hạn                            | `DELETE`                     | Hằng ngày  |

**Luôn xóa theo lô nhỏ**, không bao giờ một lệnh `DELETE` khổng lồ:

```sql
-- Lặp cho đến khi ROW_COUNT() = 0
DELETE FROM outbox_messages
WHERE processed_at IS NOT NULL AND processed_at < NOW() - INTERVAL 7 DAY
LIMIT 5000;
```

---

## 10. Quản lý Migration

### 10.1. Thách thức của nhiều DbContext

Mỗi module có `DbContext` và bộ migration riêng, nhưng cùng ghi vào một database. Vấn đề: bảng `__EFMigrationsHistory` mặc định dùng chung sẽ lẫn lộn migration của các module.

**Giải pháp — mỗi context một bảng lịch sử riêng:**

```csharp
services.AddDbContext<CatalogDbContext>(opt =>
    opt.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString),
        mySql => mySql.MigrationsHistoryTable("__EFMigrationsHistory_Catalog")));
```

### 10.2. Thứ tự chạy migration

Vì không có FK xuyên module, hầu hết module độc lập với nhau. Ngoại lệ duy nhất: **Inventory phụ thuộc Catalog** (FK sang `catalog_product_variants`).

```
1. Identity      (độc lập)
2. Catalog       (độc lập)
3. Inventory     ← BẮT BUỘC sau Catalog
4. Cart, Ordering, Review, Wishlist  (song song được)
5. Tracking, Recommendation, AI, Analytics  (song song được)
```

### 10.3. Quy tắc viết migration an toàn

| Mã       | Quy tắc                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| **MG-1** | **Luôn đọc file migration EF sinh ra trước khi apply.** EF thỉnh thoảng sinh `DROP COLUMN` khi bạn chỉ định đổi tên. |
| **MG-2** | Đổi tên cột phải viết tay thành `RenameColumn`, không để EF drop rồi add — sẽ mất sạch dữ liệu cột đó.               |
| **MG-3** | Migration đã push lên nhánh chung thì **không sửa**, chỉ thêm migration mới để chỉnh.                                |
| **MG-4** | Thêm cột `NOT NULL` vào bảng có dữ liệu phải kèm `defaultValue`, nếu không MySQL sẽ báo lỗi.                         |
| **MG-5** | Thêm index trên bảng lớn dùng `ALGORITHM=INPLACE, LOCK=NONE` để không khóa bảng.                                     |
| **MG-6** | Migration đổi schema và migration đổi dữ liệu nên tách riêng, dễ rollback hơn.                                       |
| **MG-7** | Trước khi apply lên môi trường có dữ liệu thật: sinh script SQL bằng `--idempotent` và đọc kỹ.                       |

### 10.4. Lệnh thường dùng

```cmd
:: Sinh script để review, không apply trực tiếp
dotnet ef migrations script --idempotent --output migrations\catalog.sql ^
  --project src\Modules\Catalog\LaptopCommerce.Catalog.Infrastructure ^
  --startup-project src\Hosts\LaptopCommerce.Api ^
  --context CatalogDbContext

:: Quay lại migration trước đó
dotnet ef database update TenMigrationTruoc ^
  --project ... --startup-project ... --context CatalogDbContext
```

### 10.5. Migration đổi dữ liệu — ví dụ

```csharp
public partial class ChuanHoaEmailVeChuThuong : Migration
{
    protected override void Up(MigrationBuilder mb) {
        mb.Sql("UPDATE identity_users SET email = LOWER(email) WHERE email <> LOWER(email);");
        mb.CreateIndex("ux_users_email", "identity_users", "email", unique: true);
    }

    protected override void Down(MigrationBuilder mb) {
        mb.DropIndex("ux_users_email", "identity_users");
        // Không khôi phục được chữ hoa gốc — ghi rõ trong ghi chú migration
    }
}
```

Bài học quan trọng: **không phải migration nào cũng rollback được hoàn toàn**. Hãy ghi chú rõ những migration một chiều để bạn biết mình không thể quay lui.

---

## 11. Seed dữ liệu mẫu

### 11.1. Vì sao seed quan trọng với dự án này

Recommendation và Machine Learning cần dữ liệu để có ý nghĩa. Với DB rỗng, mọi thuật toán đều trả về danh sách trống và bạn không thể biết code đúng hay sai. Đây là điểm mà rất nhiều dự án học tập bị mắc kẹt.

### 11.2. Ba tầng seed

| Tầng         | Nội dung                                          | Khi nào chạy                                   |
| ------------ | ------------------------------------------------- | ---------------------------------------------- |
| **Bắt buộc** | Roles, tài khoản admin, cây danh mục, thương hiệu | Mọi môi trường, mỗi lần khởi động (idempotent) |
| **Demo**     | 200–500 sản phẩm laptop/phụ kiện có thông số thật | Chỉ Development                                |
| **Mô phỏng** | 100 user giả + 50.000 event giả trong 90 ngày     | Chỉ Development, chạy tay                      |

### 11.3. Nguyên tắc sinh event giả

Event ngẫu nhiên đều nhau là vô dụng — recommendation học từ đó sẽ chỉ ra kết quả ngẫu nhiên. Event giả phải có **cấu trúc giống hành vi thật**:

```
Với mỗi user giả:
  1. Gán một "chân dung": phân khúc giá ưa thích, 1–2 brand ưa thích, nhóm sản phẩm quan tâm
  2. Sinh 20–200 event theo chân dung đó, phân bố không đều theo thời gian
  3. Tỉ lệ phễu thực tế:  view 100  →  click 30  →  cart 10  →  purchase 3
  4. Sau khi mua laptop, tăng xác suất xem phụ kiện trong 7 ngày sau
  5. Rải occurred_at theo phân phối lệch về gần hiện tại (để decay có tác dụng)
```

Bước 4 chính là thứ tạo ra tín hiệu co-occurrence để `SimilarityCalculator` có gì mà tính. Không có nó, tính năng "phụ kiện thường mua cùng" sẽ luôn trả về rỗng và bạn sẽ tưởng code sai.

### 11.4. Reset môi trường dev

```cmd
:: Xóa sạch và dựng lại từ đầu
docker compose down -v
docker compose up -d mysql redis
scripts\migrate-all.cmd
dotnet run --project tools\LaptopCommerce.Seeder -- --level=simulation --users=100 --events=50000
```

---

## 12. Backup và khôi phục

### 12.1. Chiến lược phân tầng

| Nhóm bảng                                               | Tần suất            | Giữ     | Lý do                                        |
| ------------------------------------------------------- | ------------------- | ------- | -------------------------------------------- |
| Giao dịch (orders, order_items, inventory_transactions) | Hằng ngày           | 90 ngày | Không tái tạo được, giá trị cao nhất         |
| Người dùng, sản phẩm, danh mục                          | Hằng ngày           | 30 ngày | Không tái tạo được                           |
| Tracking events                                         | Hằng tuần (bản nén) | 30 ngày | Dữ liệu gốc quá lớn, chỉ backup bản tổng hợp |
| Dẫn xuất (reco\_\*, summaries)                          | Không backup        | —       | Worker tái tạo được                          |

### 12.2. Lệnh backup

```cmd
:: Backup phần quan trọng nhất
docker compose exec mysql mysqldump -u root -p ^
  --single-transaction --routines --triggers ^
  laptop_commerce ^
  identity_users identity_roles identity_user_roles identity_addresses ^
  catalog_categories catalog_brands catalog_products catalog_product_variants ^
  catalog_product_specs catalog_product_images ^
  inventory_stocks inventory_transactions ^
  ordering_orders ordering_order_items ordering_order_status_history ^
  review_reviews wishlist_items ^
  > backup\core_%DATE%.sql

:: Backup chỉ schema (để dựng môi trường mới)
docker compose exec mysql mysqldump -u root -p --no-data laptop_commerce > backup\schema.sql
```

`--single-transaction` là tham số quan trọng nhất: nó cho phép dump bảng InnoDB mà **không khóa bảng**, nên website vẫn phục vụ bình thường trong lúc backup.

### 12.3. Quy trình khôi phục

```
1. Dừng API và Worker (tránh ghi đè lên dữ liệu đang khôi phục)
2. Tạo database mới:  CREATE DATABASE laptop_commerce_restore;
3. Nạp schema, rồi nạp dữ liệu
4. Chạy migration để đưa schema lên phiên bản mới nhất
5. Kiểm tra tính toàn vẹn (mục 13.2)
6. Đổi connection string sang DB mới
7. Khởi động Worker — để nó tự dựng lại toàn bộ bảng dẫn xuất
8. Khởi động API
```

Bước 7 là lý do thiết kế "dữ liệu dẫn xuất tái tạo được" có giá trị: bạn khôi phục ít bảng hơn, backup nhẹ hơn, và không bao giờ phải lo bảng gợi ý bị lệch so với bảng nguồn.

### 12.4. Kiểm tra backup có dùng được không

Backup chưa từng được thử khôi phục thì chưa phải là backup. Mỗi tháng một lần:

```cmd
docker compose exec -T mysql mysql -u root -p -e "CREATE DATABASE restore_test;"
docker compose exec -T mysql mysql -u root -p restore_test < backup\core_latest.sql
docker compose exec mysql mysql -u root -p -e "SELECT COUNT(*) FROM restore_test.ordering_orders;"
docker compose exec mysql mysql -u root -p -e "DROP DATABASE restore_test;"
```

---

## 13. Giám sát và kiểm tra sức khỏe

### 13.1. Truy vấn theo dõi hằng ngày

```sql
-- Event tồn đọng chưa xử lý (bình thường < 5.000)
SELECT COUNT(*) AS backlog,
       TIMESTAMPDIFF(MINUTE, MIN(occurred_at), NOW()) AS oldest_minutes
FROM tracking_events WHERE processed_at IS NULL;

-- Outbox kẹt (phải luôn = 0)
SELECT event_type, COUNT(*) AS stuck, MAX(retry_count) AS max_retry
FROM outbox_messages
WHERE processed_at IS NULL AND retry_count >= 5
GROUP BY event_type;

-- Reservation quá hạn chưa được nhả (phải = 0, worker chạy mỗi phút)
SELECT COUNT(*) FROM inventory_reservations
WHERE status = 'Active' AND expires_at < NOW();

-- Preference quá cũ (worker chạy 15 phút/lần)
SELECT COUNT(*) FROM reco_user_preferences
WHERE last_computed_at < NOW() - INTERVAL 2 HOUR;

-- Kích thước các bảng
SELECT table_name,
       table_rows,
       ROUND((data_length + index_length)/1024/1024, 1) AS total_mb
FROM information_schema.tables
WHERE table_schema = 'laptop_commerce'
ORDER BY (data_length + index_length) DESC
LIMIT 15;
```

### 13.2. Kiểm tra toàn vẹn dữ liệu

Vì các quan hệ chéo module không có FK, cần kiểm tra định kỳ. Chạy hằng tuần:

```sql
-- Giỏ hàng trỏ tới variant không tồn tại
SELECT ci.id, ci.variant_id FROM cart_items ci
LEFT JOIN catalog_product_variants v ON v.id = ci.variant_id
WHERE v.id IS NULL;

-- Order item trỏ tới sản phẩm không tồn tại (chấp nhận được nếu đã xóa cứng,
-- nhưng snapshot phải còn đủ thông tin để hiển thị)
SELECT oi.id, oi.product_id FROM ordering_order_items oi
LEFT JOIN catalog_products p ON p.id = oi.product_id
WHERE p.id IS NULL;

-- Đánh giá không có đơn hàng hợp lệ tương ứng
SELECT r.id FROM review_reviews r
LEFT JOIN ordering_orders o ON o.id = r.order_id AND o.status = 'Completed'
WHERE o.id IS NULL;

-- Tồn kho âm hoặc reserved vượt quantity (phải luôn rỗng)
SELECT * FROM inventory_stocks
WHERE quantity < 0 OR reserved_quantity < 0 OR reserved_quantity > quantity;

-- Tổng tiền đơn hàng lệch so với tổng dòng
SELECT o.id, o.subtotal, SUM(oi.line_total) AS computed
FROM ordering_orders o
JOIN ordering_order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.subtotal
HAVING ABS(o.subtotal - SUM(oi.line_total)) > 0.01;
```

Truy vấn cuối cùng đáng chạy thường xuyên nhất. Nếu nó trả về dòng nào, bạn có bug trong logic tính tiền — và đó là loại bug tệ nhất trong một hệ thống thương mại điện tử.

### 13.3. Truy vấn chậm

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.5;
SET GLOBAL slow_query_log_file = '/var/lib/mysql/slow.log';
```

```cmd
docker compose exec mysql mysqldumpslow -s t -t 20 /var/lib/mysql/slow.log
```

### 13.4. Health check trong ứng dụng

```csharp
builder.Services.AddHealthChecks()
    .AddMySql(connectionString, name: "mysql", tags: new[] { "ready" })
    .AddRedis(redisConnection,  name: "redis", tags: new[] { "ready" })
    .AddUrlGroup(new Uri($"{ollamaUrl}/api/tags"), name: "ollama", tags: new[] { "ai" })
    .AddCheck<EventBacklogHealthCheck>("event_backlog", tags: new[] { "worker" })
    .AddCheck<OutboxStuckHealthCheck>("outbox", tags: new[] { "worker" });
```

`EventBacklogHealthCheck` nên báo `Degraded` khi backlog > 10.000 và `Unhealthy` khi > 50.000. Đây là tín hiệu sớm nhất cho biết worker đã chết mà website vẫn có vẻ hoạt động bình thường.

---

## 14. Bảo mật và phân quyền DB

### 14.1. Tách tài khoản theo vai trò

Không dùng `root` cho ứng dụng. Tạo ba tài khoản:

```sql
-- Tài khoản cho API: đọc ghi dữ liệu, không đổi được schema
CREATE USER 'app_api'@'%' IDENTIFIED BY 'matkhau_manh_1';
GRANT SELECT, INSERT, UPDATE, DELETE ON laptop_commerce.* TO 'app_api'@'%';

-- Tài khoản cho Worker: thêm quyền dọn partition
CREATE USER 'app_worker'@'%' IDENTIFIED BY 'matkhau_manh_2';
GRANT SELECT, INSERT, UPDATE, DELETE, ALTER, DROP ON laptop_commerce.* TO 'app_worker'@'%';

-- Tài khoản chạy migration: toàn quyền schema, chỉ dùng khi deploy
CREATE USER 'app_migrator'@'%' IDENTIFIED BY 'matkhau_manh_3';
GRANT ALL PRIVILEGES ON laptop_commerce.* TO 'app_migrator'@'%';

-- Tài khoản chỉ đọc cho dashboard, BI, hoặc khi bạn cần soi dữ liệu
CREATE USER 'app_readonly'@'%' IDENTIFIED BY 'matkhau_manh_4';
GRANT SELECT ON laptop_commerce.* TO 'app_readonly'@'%';

FLUSH PRIVILEGES;
```

Lợi ích cụ thể: nếu API bị khai thác SQL injection, kẻ tấn công vẫn không thể `DROP TABLE` vì `app_api` không có quyền đó.

### 14.2. Dữ liệu nhạy cảm

| Dữ liệu                | Cách xử lý                                                           |
| ---------------------- | -------------------------------------------------------------------- |
| Mật khẩu               | BCrypt work factor 12 — **không bao giờ** lưu dạng có thể giải ngược |
| Refresh token          | Lưu SHA-256 hash, không lưu token gốc                                |
| Số điện thoại, địa chỉ | Lưu thô nhưng chỉ trả về cho chủ sở hữu; log phải che bớt            |
| Email                  | Lưu chữ thường; che trong log dạng `n***@gmail.com`                  |
| Nội dung hội thoại AI  | Có thể chứa thông tin cá nhân — áp dụng chính sách xóa sau 90 ngày   |
| Thông tin thanh toán   | **Không lưu** trong DB. Chỉ lưu token của cổng thanh toán.           |

### 14.3. Quyền của người dùng đối với dữ liệu của họ

Thiết kế sẵn hai chức năng, kể cả với dự án học tập:

```sql
-- Xuất toàn bộ dữ liệu của một user
SELECT ... FROM identity_users WHERE id = @userId;
SELECT ... FROM ordering_orders WHERE user_id = @userId;
SELECT ... FROM tracking_events WHERE user_id = @userId;
SELECT ... FROM reco_user_preferences WHERE user_id = @userId;

-- Xóa tài khoản (ẩn danh hóa, KHÔNG xóa cứng vì đơn hàng là dữ liệu tài chính)
UPDATE identity_users
SET email = CONCAT('deleted_', id, '@removed.local'),
    full_name = 'Người dùng đã xóa',
    phone = NULL,
    password_hash = '',
    status = 'Deleted'
WHERE id = @userId;

DELETE FROM identity_addresses      WHERE user_id = @userId;
DELETE FROM identity_refresh_tokens WHERE user_id = @userId;
DELETE FROM reco_user_preferences   WHERE user_id = @userId;
UPDATE tracking_events SET user_id = NULL WHERE user_id = @userId;
```

Chú ý cách xử lý: đơn hàng **giữ nguyên** vì đó là chứng từ giao dịch, nhưng thông tin định danh bị xóa. Đây là cách cân bằng giữa quyền riêng tư và nghĩa vụ lưu trữ sổ sách.

---

## 15. Xử lý sự cố thường gặp

| Triệu chứng                              | Nguyên nhân thường gặp                              | Cách xử lý                                                                                    |
| ---------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Backlog event tăng không ngừng           | Worker chết hoặc batch quá nhỏ                      | Kiểm tra log worker; tăng `LIMIT` batch; xác nhận index `ix_events_unprocessed` còn dùng được |
| `Deadlock found when trying to get lock` | Hai transaction khóa variant theo thứ tự ngược nhau | Đảm bảo luôn `OrderBy(variantId)` trước khi xử lý                                             |
| `Lock wait timeout exceeded`             | Transaction mở quá lâu                              | Rút ngắn transaction; không gọi HTTP/AI bên trong transaction                                 |
| Tồn kho sai lệch                         | Có đường ghi kho không qua Domain                   | Đối soát bằng `inventory_transactions`; tìm mọi chỗ ghi trực tiếp `inventory_stocks`          |
| Gợi ý luôn rỗng                          | Chưa đủ event, hoặc `PreferenceBuilder` chưa chạy   | Kiểm tra `reco_user_preferences.last_computed_at`; chạy seed mô phỏng                         |
| Truy vấn sản phẩm chậm dần               | Bảng lớn lên, index không phủ hết                   | `EXPLAIN` truy vấn thực tế; thêm composite index đúng thứ tự cột                              |
| Outbox message kẹt `retry_count = 5`     | Handler ném exception liên tục                      | Đọc cột `error`; sửa handler rồi reset `retry_count = 0`                                      |
| DB phình nhanh bất thường                | Partition không được dọn                            | Kiểm tra `DataRetentionWorker`; xem `SHOW TABLE STATUS`                                       |
| Migration lỗi giữa chừng                 | Migration không idempotent                          | Restore từ backup; sinh script `--idempotent` và chạy tay                                     |
| Email trùng dù có unique index           | Chưa chuẩn hóa chữ thường trước khi ghi             | Thêm chuẩn hóa ở Domain, chạy migration dọn dữ liệu cũ                                        |

### Truy vấn chẩn đoán khóa

```sql
-- Transaction đang chạy lâu nhất
SELECT trx_id, trx_state, trx_started,
       TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS duration_sec,
       trx_rows_locked, trx_query
FROM information_schema.innodb_trx
ORDER BY trx_started;

-- Deadlock gần nhất
SHOW ENGINE INNODB STATUS;
```

---

## 16. Checklist vận hành

### Trước khi merge một Pull Request đụng vào DB

- [ ] Đã đọc từng dòng file migration EF sinh ra
- [ ] Không có `DROP COLUMN` hoặc `DROP TABLE` ngoài ý muốn
- [ ] Cột `NOT NULL` mới có `defaultValue`
- [ ] Index mới có lý do rõ ràng, kèm truy vấn nó phục vụ
- [ ] Không có FK xuyên module
- [ ] `ArchitectureTests` xanh
- [ ] Integration test chạy được trên DB sạch

### Hằng ngày

- [ ] Backlog event < 5.000
- [ ] Outbox không có message `retry_count >= 5`
- [ ] Reservation quá hạn = 0
- [ ] Backup đêm chạy thành công
- [ ] Không có truy vấn nào trong slow log > 2 giây

### Hằng tuần

- [ ] Chạy bộ truy vấn kiểm tra toàn vẹn (mục 13.2)
- [ ] Xem lại top 10 truy vấn chậm
- [ ] Kiểm tra tăng trưởng kích thước bảng
- [ ] Xác nhận job dọn dẹp đã chạy

### Hằng tháng

- [ ] Thử khôi phục backup vào DB tạm
- [ ] Rà soát index chưa từng được dùng
- [ ] Xem lại chỉ số hiệu quả recommendation (CTR, coverage)
- [ ] Đánh giá xem có bảng nào cần partition thêm không

---

## Phụ lục — Ba câu hỏi phỏng vấn và cách trả lời

**"Vì sao không đặt khóa ngoại giữa các module?"**
Vì FK là một cam kết rằng hai bảng sẽ mãi mãi nằm trong cùng một database. Dự án được thiết kế để có thể tách module thành service riêng; nếu đặt FK chéo, việc tách sẽ đòi hỏi gỡ hàng chục constraint và viết lại truy vấn. Đổi lại, tôi chấp nhận rằng toàn vẹn tham chiếu phải được đảm bảo ở tầng Application, và tôi có bộ truy vấn kiểm tra định kỳ để phát hiện dữ liệu mồ côi.

**"Làm sao đảm bảo không bán vượt kho?"**
Ba lớp. Lớp một là optimistic concurrency với `row_version` trên `inventory_stocks` — hai transaction đồng thời thì một cái thất bại và retry. Lớp hai là `CHECK` constraint ở DB đảm bảo `quantity >= reserved_quantity >= 0`, coi như lưới an toàn cuối cùng. Lớp ba là quy tắc không bao giờ cache tồn kho, luôn đọc từ DB trong transaction. Ngoài ra, mọi thay đổi kho đều ghi vào `inventory_transactions` nên tôi có thể đối soát và phát hiện lệch.

**"Bảng event sẽ rất lớn, xử lý thế nào?"**
Bốn biện pháp. Partition theo ngày để xóa dữ liệu cũ bằng `DROP PARTITION` thay vì `DELETE`. Chỉ giữ ba index dù rất muốn thêm, vì mỗi index làm chậm ghi trên bảng ghi nhiều nhất hệ thống. Nâng bốn cột hay dùng ra khỏi JSON để index được mà không phải index cả JSON. Và quan trọng nhất: không truy vấn trực tiếp bảng này để hiển thị — mọi thứ người dùng thấy đều đọc từ bảng tổng hợp do worker tính sẵn. Nếu vượt quá khả năng của MySQL, đường nâng cấp là chuyển sang Kafka để nhận và ClickHouse để phân tích.
