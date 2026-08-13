# TÀI LIỆU THIẾT KẾ KIẾN TRÚC HỆ THỐNG
## AI-Powered Laptop Commerce Platform

**Stack chốt:** React 19 + Vite + TypeScript · ASP.NET Core (.NET 9) · MySQL 8 · Redis · Ollama

---

## 1. Quyết định kiến trúc (Architecture Decisions)

| # | Quyết định | Lý do | Đánh đổi |
|---|---|---|---|
| AD-01 | **Modular Monolith** thay vì Microservices | Một người phát triển; deploy đơn giản; transaction xuyên module vẫn dùng được DB transaction | Không scale độc lập từng module |
| AD-02 | **Clean Architecture** trong mỗi module | Domain không phụ thuộc EF Core/ASP.NET; test dễ | Nhiều project, nhiều mapping, viết nhiều code hơn |
| AD-03 | **MySQL 8** làm DB chính | Quen thuộc, nhẹ, JSON column đủ dùng cho attribute động, FULLTEXT đủ cho tìm kiếm giai đoạn đầu | Không có `pgvector`; khi làm vector search phải dùng Qdrant riêng |
| AD-04 | **Vite + React SPA** (không Next.js) | Đơn giản, tách bạch FE/BE rõ ràng, phù hợp học API-first | Mất SEO server-side — chấp nhận vì mục tiêu là học kiến trúc |
| AD-05 | **In-process Worker** trước, RabbitMQ sau | Tránh thêm hạ tầng khi chưa cần; vẫn học được Event Driven | Không chịu được tải lớn, mất event nếu process chết (giải bằng Outbox) |
| AD-06 | **Outbox Pattern** cho event | Đảm bảo không mất event khi ghi DB thành công nhưng publish thất bại | Thêm bảng, thêm worker quét |
| AD-07 | **Local LLM qua Ollama** | Không tốn phí API, không phụ thuộc mạng, kiểm soát prompt hoàn toàn | Chất lượng thấp hơn GPT-4 class; cần máy có RAM/VRAM đủ |
| AD-08 | **RAG bắt buộc** cho mọi câu trả lời AI | Chống hallucination về giá và tồn kho | Latency cao hơn, prompt dài hơn |

---

## 2. Sơ đồ tổng thể

```
┌───────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                               │
│   React 19 + Vite + TypeScript (SPA)                                  │
│   TanStack Query · Zustand · React Router · Tailwind · shadcn/ui       │
└──────────────────────────────┬────────────────────────────────────────┘
                               │ HTTPS / JSON  (+ SSE cho AI streaming)
┌──────────────────────────────▼────────────────────────────────────────┐
│                    ASP.NET Core API HOST (.NET 9)                     │
│  Middleware: Exception · CorrelationId · Auth · RateLimit · CORS      │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                        MODULES                                  │  │
│  │  Identity │ Catalog │ Inventory │ Cart │ Ordering │ Review      │  │
│  │  Wishlist │ Tracking │ Recommendation │ AI │ Analytics          │  │
│  │  Mỗi module = Domain / Application / Infrastructure / Endpoints │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│  BuildingBlocks: SharedKernel · EventBus · Caching · Logging          │
└───┬──────────────┬───────────────┬───────────────┬────────────────────┘
    │              │               │               │
┌───▼────┐   ┌─────▼─────┐   ┌─────▼──────┐  ┌─────▼──────────┐
│ MySQL 8│   │  Redis    │   │  Ollama    │  │ Background     │
│ (EF    │   │ cache +   │   │ Qwen2.5 /  │  │ Worker         │
│  Core) │   │ cart +    │   │ Gemma      │  │ (HostedService)│
│        │   │ session   │   │            │  │                │
└────────┘   └───────────┘   └────────────┘  └───────┬────────┘
                                                     │
                            ┌────────────────────────▼───────────┐
                            │ Event Processor · Preference Builder│
                            │ Reco Precompute · Stats Aggregator  │
                            │ Outbox Dispatcher · ML Dataset Export│
                            └────────────────────────────────────┘

   ── Giai đoạn 7 (mở rộng) ──
   RabbitMQ (thay in-process bus) · Elasticsearch (search) · Qdrant (vector)
```

---

## 3. Cấu trúc Solution (.NET)

```
LaptopCommerce.sln
│
├─ src/
│  ├─ Hosts/
│  │  ├─ LaptopCommerce.Api/                 ← Web API host, DI composition root
│  │  └─ LaptopCommerce.Worker/              ← Background worker host
│  │
│  ├─ BuildingBlocks/
│  │  ├─ LaptopCommerce.SharedKernel/        ← Entity, AggregateRoot, DomainEvent,
│  │  │                                        Result<T>, ValueObject, Money
│  │  ├─ LaptopCommerce.Application.Abstractions/ ← ICommand, IQuery, IHandler,
│  │  │                                        IUnitOfWork, ICurrentUser, IClock
│  │  ├─ LaptopCommerce.Infrastructure.Shared/ ← EventBus, Outbox, Redis, Serilog,
│  │  │                                        MySQL base DbContext
│  │  └─ LaptopCommerce.Contracts/           ← Integration Event dùng chung giữa module
│  │
│  ├─ Modules/
│  │  ├─ Identity/
│  │  │  ├─ LaptopCommerce.Identity.Domain/
│  │  │  ├─ LaptopCommerce.Identity.Application/
│  │  │  ├─ LaptopCommerce.Identity.Infrastructure/
│  │  │  └─ LaptopCommerce.Identity.Endpoints/
│  │  ├─ Catalog/          (4 project tương tự)
│  │  ├─ Inventory/
│  │  ├─ Cart/
│  │  ├─ Ordering/
│  │  ├─ Review/
│  │  ├─ Wishlist/
│  │  ├─ Tracking/
│  │  ├─ Recommendation/
│  │  ├─ AI/
│  │  └─ Analytics/
│  │
├─ tests/
│  ├─ LaptopCommerce.UnitTests/
│  ├─ LaptopCommerce.IntegrationTests/       ← Testcontainers: MySQL + Redis
│  └─ LaptopCommerce.ArchitectureTests/      ← NetArchTest: kiểm tra ranh giới module
│
├─ frontend/                                  ← Vite React app
├─ ml/                                        ← Python: training, evaluation
└─ docker/
   ├─ docker-compose.yml
   ├─ docker-compose.override.yml
   └─ mysql/init.sql
```

### Quy tắc phụ thuộc (bắt buộc, có test tự động kiểm tra)

```
Endpoints  →  Application  →  Domain
     ↓             ↓
Infrastructure ────┘        (Infrastructure hiện thực interface của Application)

Domain KHÔNG tham chiếu bất kỳ project nào khác ngoài SharedKernel.
Module A KHÔNG tham chiếu trực tiếp project của Module B.
Module A ↔ Module B chỉ giao tiếp qua: Integration Event, hoặc interface public
định nghĩa trong LaptopCommerce.Contracts.
```

Quy tắc cuối cùng là quan trọng nhất. Nếu `Ordering` gọi thẳng `CatalogDbContext`, bạn đã có một monolith rối chứ không phải modular monolith. Hãy để `ArchitectureTests` chặn việc này ngay từ CI.

---

## 4. Chi tiết từng lớp trong một module (ví dụ: Catalog)

```
Catalog.Domain
├─ Entities/          Product, ProductVariant, Category, Brand, ProductAttribute
├─ ValueObjects/      Money, Slug, Sku, SpecValue
├─ Events/            ProductCreated, ProductPriceChanged, ProductPublished
├─ Repositories/      IProductRepository  (chỉ khai báo interface)
└─ Exceptions/        ProductNotFoundException

Catalog.Application
├─ Products/
│  ├─ Commands/       CreateProduct, UpdateProduct, PublishProduct
│  ├─ Queries/        GetProductDetail, SearchProducts, GetProductFacets
│  ├─ Dtos/           ProductDto, ProductListItemDto, FacetDto
│  └─ Validators/     CreateProductValidator (FluentValidation)
└─ Abstractions/      ICacheService, IEventPublisher (port ra ngoài)

Catalog.Infrastructure
├─ Persistence/       CatalogDbContext, EntityConfigurations, Migrations
├─ Repositories/      ProductRepository : IProductRepository
├─ Caching/           RedisProductCache
└─ CatalogModule.cs   Extension method AddCatalogModule(IServiceCollection)

Catalog.Endpoints
└─ ProductEndpoints.cs  Minimal API: MapGet/MapPost, gọi Handler qua MediatR
```

**Lưu ý về DbContext:** mỗi module có `DbContext` riêng nhưng **cùng trỏ vào một database MySQL**, tách nhau bằng prefix bảng (`catalog_products`, `ordering_orders`). Cách này giữ được transaction xuyên module khi cần, đồng thời vẫn có ranh giới rõ ràng để sau này tách DB.

---

## 5. Thiết kế cơ sở dữ liệu

### 5.1. Nhóm bảng chính

**Identity**
```
identity_users(id, email, password_hash, full_name, phone, status, created_at)
identity_roles(id, name)
identity_user_roles(user_id, role_id)
identity_refresh_tokens(id, user_id, token_hash, expires_at, revoked_at)
identity_addresses(id, user_id, receiver, phone, province, district, ward, detail, is_default)
```

**Catalog**
```
catalog_categories(id, parent_id, name, slug, path, sort_order)
catalog_brands(id, name, slug, logo_url)
catalog_products(id, category_id, brand_id, name, slug, description,
                 base_price, thumbnail, status, avg_rating, review_count,
                 view_count, sold_count, created_at)
catalog_product_variants(id, product_id, sku, attributes_json, price,
                         compare_at_price, image_url, is_active)
catalog_product_specs(id, product_id, spec_key, spec_value, spec_value_num, unit)
catalog_product_images(id, product_id, url, sort_order)
```

`catalog_product_specs` là bảng EAV. Cột `spec_value_num` tồn tại để lọc theo khoảng số (RAM ≥ 16GB) mà không phải cast chuỗi. Index `(spec_key, spec_value_num)`.

**Inventory**
```
inventory_stocks(variant_id, quantity, reserved_quantity, updated_at, row_version)
inventory_transactions(id, variant_id, type, quantity, ref_type, ref_id, created_at)
inventory_reservations(id, variant_id, order_id, quantity, expires_at, status)
```

**Cart / Ordering**
```
cart_carts(id, user_id, anonymous_id, updated_at)
cart_items(id, cart_id, variant_id, quantity, added_at)

ordering_orders(id, code, user_id, status, subtotal, discount, shipping_fee,
                total, payment_method, payment_status, shipping_address_json,
                placed_at, completed_at)
ordering_order_items(id, order_id, product_id, variant_id, product_name_snapshot,
                     variant_attributes_snapshot, unit_price, quantity, line_total)
ordering_order_status_history(id, order_id, from_status, to_status, note, changed_by, changed_at)
```

**Review / Wishlist**
```
review_reviews(id, product_id, user_id, order_id, rating, title, content,
               status, created_at, moderated_by, moderated_at)
wishlist_items(id, user_id, product_id, created_at)
```

**Tracking** — bảng lớn nhất, thiết kế cho ghi nhiều đọc theo batch
```
tracking_events(
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type    VARCHAR(50)  NOT NULL,
  user_id       BIGINT       NULL,
  anonymous_id  CHAR(36)     NULL,
  session_id    VARCHAR(64)  NOT NULL,
  product_id    BIGINT       NULL,
  category_id   INT          NULL,
  brand_id      INT          NULL,
  price         DECIMAL(15,2) NULL,
  payload       JSON         NULL,
  occurred_at   DATETIME(3)  NOT NULL,
  processed_at  DATETIME(3)  NULL,
  INDEX ix_user_time   (user_id, occurred_at),
  INDEX ix_unprocessed (processed_at, id),
  INDEX ix_product     (product_id, event_type, occurred_at)
) PARTITION BY RANGE (TO_DAYS(occurred_at));
```

Các cột "nóng" (`product_id`, `category_id`, `brand_id`, `price`) được **nâng ra khỏi JSON** thành cột riêng để index được. Phần còn lại nằm trong `payload`. Partition theo ngày để xóa dữ liệu cũ bằng `DROP PARTITION` thay vì `DELETE` hàng triệu dòng.

**Recommendation**
```
reco_user_preferences(user_id, brand_scores_json, category_scores_json,
                      price_min, price_max, price_avg, spec_preferences_json,
                      last_computed_at)
reco_product_similarity(product_id, similar_product_id, score, algorithm, computed_at)
reco_precomputed(user_id, slot, product_ids_json, computed_at, expires_at)
reco_impressions(id, user_id, slot, product_id, position, shown_at, clicked_at)
```

**Outbox / AI**
```
outbox_messages(id, event_type, payload, occurred_at, processed_at, error, retry_count)
ai_conversations(id, user_id, anonymous_id, started_at)
ai_messages(id, conversation_id, role, content, context_product_ids_json,
            model, latency_ms, token_count, created_at)
ai_product_summaries(product_id, summary, model, generated_at, source_hash)
```

`source_hash` trong `ai_product_summaries` là hash của thông số sản phẩm. Khi sản phẩm đổi cấu hình, hash đổi, worker biết cần sinh lại summary — tránh phải gọi LLM mỗi lần hiển thị.

### 5.2. Nguyên tắc thiết kế DB

- Tiền tệ: `DECIMAL(15,2)`, không dùng `float`.
- Thời gian: lưu UTC, quy đổi ở tầng hiển thị.
- Xóa mềm (`deleted_at`) cho Product, User, Review; xóa cứng cho Cart Item.
- `row_version` trên `inventory_stocks` để optimistic concurrency chống oversell.
- Không dùng foreign key xuyên module (Ordering không FK sang Catalog) — chỉ lưu id và snapshot.

---

## 6. Kiến trúc Frontend (React + Vite)

### 6.1. Cấu trúc thư mục — Feature-based

```
frontend/
├─ src/
│  ├─ app/
│  │  ├─ router.tsx           ← Định nghĩa route, lazy load
│  │  ├─ providers.tsx        ← QueryClient, Auth, Theme, Toast
│  │  └─ App.tsx
│  ├─ features/
│  │  ├─ auth/                { api, hooks, components, pages, store }
│  │  ├─ catalog/
│  │  ├─ cart/
│  │  ├─ checkout/
│  │  ├─ order/
│  │  ├─ review/
│  │  ├─ wishlist/
│  │  ├─ recommendation/
│  │  ├─ ai-assistant/
│  │  └─ admin/
│  ├─ shared/
│  │  ├─ api/                 ← axios instance, interceptor, error mapping
│  │  ├─ components/ui/       ← shadcn/ui
│  │  ├─ hooks/               ← useDebounce, useIntersection, useTracking
│  │  ├─ lib/                 ← formatCurrency, cn, dateUtils
│  │  └─ types/
│  ├─ tracking/
│  │  ├─ trackingClient.ts    ← hàng đợi + batch + sendBeacon
│  │  └─ events.ts            ← type-safe event definitions
│  └─ main.tsx
├─ .env.development
├─ vite.config.ts
└─ tsconfig.json
```

### 6.2. Phân tầng trạng thái

| Loại state | Công cụ | Ví dụ |
|---|---|---|
| Server state | **TanStack Query** | Danh sách sản phẩm, chi tiết, đơn hàng |
| Global client state | **Zustand** | Auth user, giỏ hàng, theme, mở/đóng AI panel |
| Local state | `useState` / `useReducer` | Form, modal, tab |
| URL state | `useSearchParams` | Bộ lọc, phân trang, sắp xếp |

Bộ lọc sản phẩm **bắt buộc** đặt trên URL. Nhờ đó khách chia sẻ được link đã lọc, nút back hoạt động đúng, và bạn có sẵn dữ liệu để bắn event `filter_applied`.

### 6.3. Tracking phía client

```ts
// tracking/trackingClient.ts — ý tưởng cốt lõi
const queue: TrackEvent[] = [];

export function track(type: EventType, payload: object) {
  queue.push({ type, payload, occurredAt: new Date().toISOString(),
               sessionId: getSessionId(), anonymousId: getAnonymousId() });
  if (queue.length >= 10) flush();
}

function flush() {
  if (!queue.length) return;
  const batch = queue.splice(0);
  navigator.sendBeacon('/api/tracking/events', JSON.stringify(batch));
}

setInterval(flush, 5000);
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
});
```

Ba điểm cần nhớ: **gom batch** để không spam server, dùng **`sendBeacon`** để event không mất khi người dùng đóng tab, và **không bao giờ `await`** lời gọi tracking trong luồng UI.

### 6.4. AI Assistant với streaming

Backend trả về Server-Sent Events. Frontend đọc bằng `fetch` + `ReadableStream`, render dần từng token. Khi stream kết thúc, server gửi một event cuối chứa `productIds`, frontend dùng danh sách đó để render card sản phẩm thật (ảnh, giá, nút thêm giỏ) bên dưới đoạn văn giải thích.

---

## 7. Kiến trúc Backend chi tiết

### 7.1. Pipeline xử lý request

```
HTTP Request
  → ExceptionHandlingMiddleware        (ProblemDetails chuẩn RFC 7807)
  → CorrelationIdMiddleware            (gắn X-Correlation-Id vào log scope)
  → Serilog RequestLoggingMiddleware
  → CORS
  → RateLimiter                        (theo IP cho auth, theo user cho AI)
  → Authentication (JWT Bearer)
  → Authorization (Policy-based)
  → Endpoint
      → MediatR Pipeline
          → ValidationBehavior         (FluentValidation)
          → CachingBehavior            (cho query có đánh dấu ICacheable)
          → TransactionBehavior        (cho command)
          → LoggingBehavior
          → Handler
              → Repository → EF Core → MySQL
              → DomainEvent → Outbox (cùng transaction)
  → Response
```

**Điểm mấu chốt của `TransactionBehavior`:** domain event được ghi vào bảng `outbox_messages` trong **cùng transaction** với dữ liệu nghiệp vụ. Hoặc cả hai cùng thành công, hoặc cả hai cùng rollback. Không bao giờ có chuyện đơn hàng được tạo nhưng event `OrderPlaced` biến mất.

### 7.2. Background Worker

Worker host là một process riêng (`LaptopCommerce.Worker`), chạy các `BackgroundService`:

| Worker | Chu kỳ | Nhiệm vụ |
|---|---|---|
| `OutboxDispatcher` | 5 giây | Đọc outbox chưa xử lý → publish lên EventBus → đánh dấu processed; retry với backoff |
| `EventIngestionWorker` | 10 giây | Đọc `tracking_events` chưa xử lý theo batch 500 → cập nhật counter sản phẩm, đẩy vào preference builder |
| `PreferenceBuilder` | 15 phút | Tính lại `reco_user_preferences` cho user có event mới |
| `SimilarityCalculator` | Hằng đêm | Tính `reco_product_similarity` (co-occurrence, content-based) |
| `RecoPrecomputer` | Hằng đêm | Sinh sẵn top gợi ý cho user hoạt động thường xuyên |
| `AiSummaryWorker` | 30 phút | Sinh summary cho sản phẩm mới hoặc có `source_hash` thay đổi |
| `StatsAggregator` | 1 giờ | Tổng hợp dữ liệu dashboard vào bảng aggregate |
| `ReservationExpirer` | 1 phút | Nhả hàng giữ quá hạn về kho |
| `MlDatasetExporter` | Hằng tuần | Xuất CSV/Parquet vào `/ml/data` cho bước huấn luyện |

### 7.3. Event Bus

Giai đoạn 1 — in-process, dựa trên `System.Threading.Channels`:

```csharp
public interface IEventBus {
    Task PublishAsync<T>(T @event, CancellationToken ct) where T : IIntegrationEvent;
}
```

Giai đoạn 7 — thay bằng MassTransit + RabbitMQ. Vì mọi nơi trong code chỉ phụ thuộc vào `IEventBus`, việc đổi chỉ nằm ở phần đăng ký DI. Đây chính là lợi ích cụ thể của Clean Architecture, không phải lý thuyết suông.

---

## 8. Kiến trúc Recommendation

```
                    ┌──────────────────────────────┐
   Request gợi ý →  │   RecommendationOrchestrator │
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────┬───────────┼───────────┬──────────────┐
        ▼              ▼           ▼           ▼              ▼
   RuleBased     Preference   Similarity   MlScorer      Trending
   Provider       Provider     Provider    Provider      Provider
        └──────────────┴───────────┼───────────┴──────────────┘
                                   ▼
                          ┌─────────────────┐
                          │  Blender/Ranker │  ← trộn theo trọng số cấu hình
                          └────────┬────────┘
                                   ▼
                          ┌─────────────────┐
                          │  Filter Layer   │  ← loại hết hàng, loại đã mua,
                          └────────┬────────┘     loại trùng, đa dạng hóa brand
                                   ▼
                          ┌─────────────────┐
                          │  Impression Log │  ← ghi để tính CTR sau này
                          └─────────────────┘
```

Mỗi Provider hiện thực chung một interface:

```csharp
public interface IRecommendationProvider {
    string Name { get; }
    int Priority { get; }
    Task<IReadOnlyList<ScoredProduct>> GetAsync(RecoContext ctx, CancellationToken ct);
}
```

Thêm thuật toán mới = thêm một class, đăng ký DI, chỉnh trọng số trong `appsettings.json`. Không sửa dòng nào ở orchestrator. Đây là lý do nên thiết kế theo Strategy ngay từ giai đoạn Rule Based, dù lúc đó chỉ có một provider.

**Xử lý cold start:** user mới không có preference → orchestrator tự động rơi về Trending + Best Seller. Sản phẩm mới không có tương tác → dùng content-based similarity dựa trên thông số kỹ thuật thay vì co-occurrence.

---

## 9. Kiến trúc AI và RAG

### 9.1. Luồng AI Shopping Assistant

```
[1] Người dùng: "Tôi có 20 triệu, cần laptop lập trình ASP.NET và Docker"
      │
[2] IntentExtractor  →  Ollama (temperature 0.1, format json)
      │  Output bắt buộc theo JSON Schema:
      │  { "budget_min": 17000000, "budget_max": 22000000,
      │    "category": "laptop", "use_case": "software_development",
      │    "must_have": { "ram_min_gb": 16, "cpu_tier": "mid_high" },
      │    "brand_preference": [] }
      │
[3] QueryBuilder  →  chuyển JSON thành truy vấn MySQL có tham số
      │              (KHÔNG bao giờ để LLM sinh SQL)
      │
[4] Retriever  →  Top 8 sản phẩm thật + specs + giá + tồn kho
      │           + hồ sơ sở thích người dùng (nếu đã đăng nhập)
      │
[5] ContextBuilder  →  đóng gói thành text ngắn gọn, có đánh số [1]..[8]
      │
[6] Ollama (temperature 0.3, stream)  →  phân tích và giải thích
      │    System prompt: "Chỉ dùng thông tin trong CONTEXT. Nếu không đủ
      │    dữ liệu, hãy nói không tìm thấy. Không bịa giá, không bịa cấu hình."
      │
[7] Response  →  SSE stream text + event cuối chứa productIds
      │
[8] Log vào ai_messages (câu hỏi, context ids, latency, model)
```

### 9.2. Vì sao không để LLM sinh SQL

Ba lý do: rủi ro SQL injection, LLM không biết index nên sinh truy vấn chậm, và không thể kiểm soát chính sách nghiệp vụ (ẩn sản phẩm ngừng bán, ẩn giá nội bộ). Trích xuất ý định thành JSON rồi tự dựng truy vấn cho kết quả tốt hơn hẳn và an toàn hơn nhiều.

### 9.3. Chống lỗi và tối ưu chi phí

| Vấn đề | Giải pháp |
|---|---|
| Ollama chậm/chết | `HttpClient` timeout 15s + Polly circuit breaker → fallback về kết quả search thuần |
| Câu hỏi lặp lại | Cache response theo hash của (intent JSON + tập product id) trong Redis, TTL 1 giờ |
| Summary sản phẩm | Sinh trước bằng worker, lưu DB — không gọi LLM lúc render trang |
| Lạm dụng | Rate limit 10 câu hỏi/phút/user, 30/giờ cho khách ẩn danh |
| Output sai định dạng | Dùng `format: json` của Ollama + validate schema, retry tối đa 2 lần |

### 9.4. Cấu hình Ollama gợi ý

| Máy | Model đề xuất | Ghi chú |
|---|---|---|
| 8GB RAM, không GPU | `qwen2.5:3b` hoặc `gemma2:2b` | Đủ cho intent extraction |
| 16GB RAM | `qwen2.5:7b` | Cân bằng tốt nhất cho tiếng Việt |
| 16GB+ có GPU 8GB VRAM | `qwen2.5:14b` | Chất lượng giải thích rõ rệt hơn |

Nên dùng **hai model khác nhau**: một model nhỏ chạy nhanh cho intent extraction (tác vụ dễ), một model lớn hơn cho phần giải thích (tác vụ cần diễn đạt).

---

## 10. Thiết kế API

### 10.1. Quy ước

- Base path: `/api/v1`
- Chuẩn REST, dùng danh từ số nhiều: `/products`, `/orders`
- Phân trang: `?page=1&pageSize=20`, response bọc trong `PagedResult<T>`
- Lỗi: `ProblemDetails` (RFC 7807), có `traceId`
- Idempotency: header `Idempotency-Key` cho `POST /orders`

### 10.2. Endpoint chính

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/products?q=&categoryId=&brandId=&minPrice=&maxPrice=&specs=&sort=&page=
GET    /api/v1/products/{slug}
GET    /api/v1/products/{id}/facets
GET    /api/v1/categories/tree
GET    /api/v1/brands

GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/{id}
DELETE /api/v1/cart/items/{id}
POST   /api/v1/cart/merge

POST   /api/v1/orders
GET    /api/v1/orders
GET    /api/v1/orders/{code}
POST   /api/v1/orders/{code}/cancel

GET    /api/v1/wishlist
POST   /api/v1/wishlist/{productId}
DELETE /api/v1/wishlist/{productId}

GET    /api/v1/products/{id}/reviews
POST   /api/v1/products/{id}/reviews

POST   /api/v1/tracking/events            ← nhận batch, trả 202 Accepted ngay

GET    /api/v1/recommendations?slot=home_for_you&limit=12
GET    /api/v1/recommendations?slot=product_similar&productId=501
GET    /api/v1/recommendations?slot=cart_bundle
POST   /api/v1/recommendations/impressions

POST   /api/v1/ai/chat                    ← SSE stream
GET    /api/v1/ai/products/{id}/summary
POST   /api/v1/ai/recommendations/{id}/explain

# Admin
GET    /api/v1/admin/products
POST   /api/v1/admin/products
PUT    /api/v1/admin/products/{id}
PATCH  /api/v1/admin/inventory/{variantId}
GET    /api/v1/admin/orders
PATCH  /api/v1/admin/orders/{code}/status
GET    /api/v1/admin/dashboard/overview
GET    /api/v1/admin/dashboard/funnel
GET    /api/v1/admin/dashboard/recommendation-performance
```

---

## 11. Chiến lược Cache

| Dữ liệu | Nơi lưu | TTL | Cách vô hiệu hóa |
|---|---|---|---|
| Cây danh mục | Redis | 24h | Xóa key khi admin sửa danh mục |
| Chi tiết sản phẩm | Redis | 30 phút | Xóa key theo `product_id` khi có `ProductUpdated` |
| Kết quả tìm kiếm | Redis | 5 phút | Key gồm hash của toàn bộ tham số lọc |
| Giỏ hàng khách ẩn danh | Redis | 7 ngày | Xóa khi merge vào tài khoản |
| Preference người dùng | Redis | 1h | Ghi đè khi `PreferenceBuilder` chạy |
| Gợi ý đã tính sẵn | MySQL + Redis | 6h | Worker ghi đè |
| AI summary | MySQL | Vĩnh viễn | Sinh lại khi `source_hash` đổi |
| Tồn kho | **Không cache** | — | Luôn đọc từ DB |

Tồn kho không bao giờ được cache. Bán vượt kho vì cache cũ là lỗi nghiệp vụ nghiêm trọng, còn tiết kiệm được vài mili giây thì không đáng.

---

## 12. Bảo mật

| Lớp | Biện pháp |
|---|---|
| Xác thực | JWT Access Token 15 phút + Refresh Token 7 ngày, xoay vòng và phát hiện tái sử dụng |
| Mật khẩu | BCrypt (work factor 12) hoặc Argon2id |
| Phân quyền | Policy-based; mọi endpoint có `{id}` phải kiểm tra quyền sở hữu (chống IDOR) |
| Đầu vào | FluentValidation cho toàn bộ command; giới hạn kích thước payload tracking |
| SQL | EF Core parameterized query; tuyệt đối không nối chuỗi SQL |
| AI | Lọc prompt injection cơ bản; không đưa dữ liệu người dùng khác vào context; giới hạn độ dài câu hỏi |
| Rate limit | Auth 5 req/phút/IP · AI 10 req/phút/user · Tracking 100 req/phút/session |
| Bí mật | User Secrets khi dev, biến môi trường khi chạy Docker; không commit `.env` |
| Header | HSTS, CSP, X-Content-Type-Options, Referrer-Policy |

---

## 13. Khả năng quan sát (Observability)

- **Logging:** Serilog structured, sink ra Console (dev) và file/Seq (prod). Mọi log có `CorrelationId`, `UserId`, `Module`.
- **Health check:** `/health/live` (process sống) và `/health/ready` (MySQL + Redis + Ollama sẵn sàng).
- **Metrics tự xây (đủ cho mục tiêu học tập):** thời gian xử lý event trung bình, độ trễ p95 của AI, CTR theo slot gợi ý, tỉ lệ chuyển đổi phễu.
- **Correlation:** frontend sinh `X-Correlation-Id` cho mỗi request, backend truyền tiếp vào event và log của worker — nhờ vậy truy được toàn bộ chuỗi từ cú click đến bảng preference.

---

## 14. Docker Compose

```yaml
services:
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: laptop_commerce
    ports: ["3306:3306"]
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 10

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]

  ollama:
    image: ollama/ollama:latest
    ports: ["11434:11434"]
    volumes: [ollama_data:/root/.ollama]

  api:
    build: { context: .., dockerfile: docker/Api.Dockerfile }
    depends_on:
      mysql: { condition: service_healthy }
      redis: { condition: service_started }
    environment:
      ConnectionStrings__MySql: "Server=mysql;Database=laptop_commerce;User=root;Password=${MYSQL_ROOT_PASSWORD}"
      ConnectionStrings__Redis: "redis:6379"
      Ollama__BaseUrl: "http://ollama:11434"
    ports: ["5000:8080"]

  worker:
    build: { context: .., dockerfile: docker/Worker.Dockerfile }
    depends_on:
      mysql: { condition: service_healthy }

  frontend:
    build: { context: ../frontend }
    ports: ["3000:80"]
    depends_on: [api]

volumes:
  mysql_data:
  redis_data:
  ollama_data:
```

---

## 15. Đường nâng cấp lên quy mô lớn

Khi được hỏi "nếu scale lên thì đổi gì", đây là câu trả lời có cấu trúc:

| Nút thắt | Dấu hiệu | Giải pháp |
|---|---|---|
| Ghi event | Bảng `tracking_events` phình, insert chậm | Chuyển sang Kafka; đọc/ghi tách riêng; đổ vào ClickHouse |
| Tìm kiếm | LIKE/FULLTEXT trên MySQL chậm khi > 100k sản phẩm | Elasticsearch, đồng bộ qua Integration Event |
| Đọc sản phẩm | CPU MySQL cao vì query đọc | Read replica + CQRS với read model riêng |
| Suy luận AI | Ollama nghẽn khi nhiều người hỏi cùng lúc | Tách thành AI Service riêng, hàng đợi request, GPU pool |
| Tính recommendation | Job đêm chạy quá lâu | Spark hoặc feature store, tính incremental |
| Toàn hệ thống | Một module deploy làm chết cả hệ thống | Tách module thành service — ranh giới đã sẵn sàng từ AD-01 |

Điểm quan trọng cần nhấn mạnh: **kiến trúc hiện tại đã chuẩn bị sẵn đường ranh giới**, nên việc tách là công việc hạ tầng chứ không phải viết lại Domain.
