# TÀI LIỆU QUẢN LÝ HÀNH VI NGƯỜI DÙNG
## AI-Powered Laptop Commerce Platform

Tài liệu `01` liệt kê **có những event nào**. Tài liệu `02` mô tả **event chảy đi đâu**. Tài liệu này trả lời câu hỏi nằm giữa hai cái đó — cũng là câu hỏi khiến phần lớn hệ thống tracking thất bại:

> Làm sao đảm bảo event được bắn **đúng chỗ, đủ trường, không trùng, không thiếu** — và mang đủ thông tin để sáu tháng sau vẫn tính lại được?

Đây là tài liệu thi hành (implementation contract) cho module **Tracking**, và là tiền đề bắt buộc của **Recommendation** và **AI**.

---

## MỤC LỤC

- [1. Nguyên tắc nền tảng](#1-nguyên-tắc-nền-tảng)
- [2. Phân tầng kiến trúc tracking phía client](#2-phân-tầng-kiến-trúc-tracking-phía-client)
- [3. Event Registry — nguồn sự thật duy nhất](#3-event-registry--nguồn-sự-thật-duy-nhất)
- [4. Nguyên tắc payload tự đủ nghĩa](#4-nguyên-tắc-payload-tự-đủ-nghĩa)
- [5. Bảng trigger — khi nào bắn, ai bắn, chống trùng thế nào](#5-bảng-trigger--khi-nào-bắn-ai-bắn-chống-trùng-thế-nào)
- [6. Ranh giới Frontend / Backend](#6-ranh-giới-frontend--backend)
- [7. Impression tracking](#7-impression-tracking)
- [8. Truy vết nguồn gốc tương tác (attribution)](#8-truy-vết-nguồn-gốc-tương-tác-attribution)
- [9. Ba tầng dữ liệu phục vụ AI](#9-ba-tầng-dữ-liệu-phục-vụ-ai)
- [10. Session Context — tầng nóng](#10-session-context--tầng-nóng)
- [11. Vòng đời định danh và identity stitching](#11-vòng-đời-định-danh-và-identity-stitching)
- [12. Chất lượng dữ liệu và chống nhiễu](#12-chất-lượng-dữ-liệu-và-chống-nhiễu)
- [13. Hợp đồng API tracking](#13-hợp-đồng-api-tracking)
- [14. Ánh xạ event → tính năng downstream](#14-ánh-xạ-event--tính-năng-downstream)
- [15. Hiện trạng code và việc cần sửa](#15-hiện-trạng-code-và-việc-cần-sửa)
- [16. Thứ tự triển khai](#16-thứ-tự-triển-khai)
- [17. Checklist review khi thêm event mới](#17-checklist-review-khi-thêm-event-mới)

---

## 1. Nguyên tắc nền tảng

Tám nguyên tắc chi phối toàn bộ tài liệu. Khi phân vân, quay về đây.

| # | Nguyên tắc | Ý nghĩa thực tế |
|---|---|---|
| **TR-1** | Event là **hợp đồng**, không phải log | Thêm/sửa event phải qua Registry và review, không sửa tùy tiện trong component |
| **TR-2** | Payload phải **tự đủ nghĩa** | Đủ để tính lại về sau mà không cần JOIN sang bảng có thể đã thay đổi |
| **TR-3** | Event có hệ quả tiền bạc do **Backend** bắn | Client có thể bị chặn, đóng tab, hoặc bị giả mạo |
| **TR-4** | Không có **impression** thì không có gì cả | Thiếu impression thì không có CTR và không có negative sample cho ML |
| **TR-5** | Mọi tương tác phải biết **nó đến từ đâu** | `source` + `position` là bắt buộc, không phải tùy chọn |
| **TR-6** | AI **không bao giờ** đọc raw event | AI đọc dữ liệu đã tổng hợp; raw event là nguyên liệu của worker |
| **TR-7** | Tracking hỏng thì **nghiệp vụ vẫn chạy** | Không `await`, không throw, không chặn UI (đồng bộ với DP-6) |
| **TR-8** | Event xấu bị **từ chối tường minh** | Không âm thầm nhận event thiếu trường — sẽ phát hiện quá muộn |

Nguyên tắc TR-1 là gốc rễ. Nếu event chỉ được coi là log, mỗi lập trình viên sẽ tự thêm trường theo ý mình, và sau ba tháng bạn có mười biến thể của cùng một event — không thể tổng hợp, không thể huấn luyện.

---

## 2. Phân tầng kiến trúc tracking phía client

### 2.1. Vấn đề cần tránh

Sai lầm phổ biến nhất là gọi `track()` trực tiếp trong `onClick` của từng component:

```tsx
// ❌ SAI — payload dựng tại chỗ, mỗi nơi một kiểu
<Button onClick={() => {
  addToCart(variantId)
  track('cart_added', { productId: p.id, price: p.price })   // thiếu categoryId, brandId
}}>
```

Sau vài tháng bạn có mười bốn chỗ gọi `cart_added` với mười bốn payload khác nhau. Khi `PreferenceBuilder` cần `brand_id`, bạn phát hiện 60% event không có trường đó — và dữ liệu đã bắn rồi thì không lấy lại được.

### 2.2. Ba lớp bắt buộc

```
┌─────────────────────────────────────────────────────────────┐
│  Component (UI)                                             │
│  Chỉ biết: "người dùng vừa bấm thêm giỏ"                    │
│  KHÔNG biết: tên event, cấu trúc payload                    │
└───────────────────────┬─────────────────────────────────────┘
                        │  onAddToCart()
┌───────────────────────▼─────────────────────────────────────┐
│  Tracking Hooks  (theo feature)                             │
│  useProductTracking(product) · useSlotTracking(slot)         │
│  useSearchTracking() · useCartTracking()                     │
│  → NƠI DUY NHẤT dựng payload                                │
└───────────────────────┬─────────────────────────────────────┘
                        │  track(type, payload)
┌───────────────────────▼─────────────────────────────────────┐
│  trackingClient                                             │
│  Hàng đợi · gom batch · gắn eventId/sessionId · gửi         │
│  KHÔNG biết ý nghĩa nghiệp vụ của event                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.3. Cấu trúc thư mục

```
frontend/src/tracking/
├─ registry.ts          ← định nghĩa event: trọng số, trường bắt buộc, quy tắc dedupe
├─ events.ts            ← discriminated union sinh từ registry
├─ trackingClient.ts    ← hàng đợi, batch, transport
├─ identity.ts          ← anonymousId, sessionId, vòng đời phiên
├─ sourceContext.ts     ← lưu nguồn gốc điều hướng (mục 8)
└─ hooks/
   ├─ useProductView.ts      ← dwell time, chống trùng
   ├─ useSlotTracking.ts     ← impression + click theo slot
   ├─ useSearchTracking.ts   ← debounce, gộp filter
   └─ useCartTracking.ts
```

### 2.4. Ví dụ hook

```ts
// hooks/useProductTracking.ts
export function useProductTracking(product: ProductDetail) {
  const base = {
    productId: product.id,
    categoryId: product.categoryId,
    brandId: product.brandId,
    price: product.minPrice,
  }

  return {
    trackAddToCart: (variantId: number, quantity: number) =>
      track('cart_added', { ...base, variantId, quantity }),

    trackFavorite: () => track('product_favorited', base),

    trackRemoveFromCart: (variantId: number) =>
      track('cart_removed', { ...base, variantId }),
  }
}
```

Component chỉ gọi `trackAddToCart(...)`. Nó không biết tên event, không dựng payload, không thể quên trường nào. Muốn thêm một chiều dữ liệu mới cho toàn bộ event sản phẩm? Sửa đúng một chỗ: biến `base`.

---

## 3. Event Registry — nguồn sự thật duy nhất

### 3.1. Vì sao cần Registry

Registry là chỗ trả lời bốn câu hỏi cho mỗi event, ở **một nơi duy nhất**:

1. Trọng số bao nhiêu (dùng cho `PreferenceBuilder`)?
2. Trường nào bắt buộc, trường nào tùy chọn?
3. Ai được phép bắn — client hay server?
4. Quy tắc chống trùng là gì?

Không có Registry thì ba câu trả lời đầu nằm rải rác trong tài liệu Word, trong đầu người viết code, và trong comment — tức là không nằm ở đâu cả.

### 3.2. Định nghĩa

```ts
// tracking/registry.ts
export type EventOrigin = 'client' | 'server'

export interface EventDefinition {
  weight: number
  origin: EventOrigin
  required: readonly string[]
  optional?: readonly string[]
  dedupe?: 'session' | 'session-slot' | 'none'
  minDwellMs?: number
}

export const EVENT_REGISTRY = {
  product_viewed: {
    weight: 1, origin: 'client',
    required: ['productId', 'categoryId', 'brandId', 'price'],
    optional: ['variantId', 'dwellTimeMs', 'source'],
    dedupe: 'session',
    minDwellMs: 3000,
  },
  product_searched: {
    weight: 1, origin: 'client',
    required: ['query', 'resultCount'],
    optional: ['categoryId', 'queryId'],
    dedupe: 'none',
  },
  filter_applied: {
    weight: 1, origin: 'client',
    required: ['filters'],
    optional: ['resultCount', 'categoryId'],
    dedupe: 'none',
  },
  product_clicked: {
    weight: 2, origin: 'client',
    required: ['productId', 'categoryId', 'brandId', 'price', 'source', 'position'],
    optional: ['queryId', 'slot'],
    dedupe: 'none',
  },
  product_favorited: {
    weight: 4, origin: 'client',
    required: ['productId', 'categoryId', 'brandId', 'price'],
    dedupe: 'none',
  },
  cart_added: {
    weight: 5, origin: 'client',
    required: ['productId', 'variantId', 'categoryId', 'brandId', 'price', 'quantity'],
    optional: ['source'],
    dedupe: 'none',
  },
  cart_removed: {
    weight: -3, origin: 'client',
    required: ['productId', 'variantId', 'categoryId', 'brandId', 'price'],
    dedupe: 'none',
  },
  checkout_started: {
    weight: 7, origin: 'client',
    required: ['productIds', 'itemCount', 'subtotal'],
    dedupe: 'session',
  },
  purchased: {
    weight: 10, origin: 'server',
    required: ['orderId', 'productId', 'variantId', 'categoryId', 'brandId',
               'price', 'quantity'],
  },
  product_reviewed: {
    weight: 8, origin: 'server',
    required: ['productId', 'categoryId', 'brandId', 'reviewId', 'rating'],
  },
  recommendation_shown: {
    weight: 0, origin: 'client',
    required: ['productId', 'slot', 'position'],
    optional: ['provider', 'anchorProductId'],
    dedupe: 'session-slot',
  },
  ai_query_submitted: {
    weight: 3, origin: 'client',
    required: ['conversationId', 'query'],
    optional: ['extractedIntent'],
    dedupe: 'none',
  },
} as const satisfies Record<string, EventDefinition>
```

### 3.3. Registry ràng buộc cả hai đầu

| Đầu | Cách dùng Registry |
|---|---|
| **Frontend** | Sinh discriminated union cho `TrackEvent`; TypeScript báo lỗi biên dịch nếu thiếu trường bắt buộc |
| **Backend** | `EventSchemaValidator` đọc bản JSON tương ứng; event thiếu trường → **reject** |
| **Worker** | `PreferenceBuilder` đọc `weight` từ đây, không hardcode |

Bản JSON cho backend đặt tại `src/Modules/Tracking/.../event-registry.json`, được sinh từ file TS bằng một script nhỏ trong `npm run build`. Không copy tay — copy tay là lúc hai bên bắt đầu lệch nhau.

### 3.4. Xử lý event không hợp lệ

Theo TR-8, event thiếu trường bắt buộc **không được âm thầm chấp nhận**:

```
Event hợp lệ            → INSERT tracking_events, trả 202
Event thiếu trường      → BỎ QUA dòng đó, ghi WARN kèm event_type + trường thiếu
Toàn bộ batch sai định dạng → 400 Bad Request
```

API vẫn trả `202 Accepted` khi một phần batch hỏng — không để lỗi tracking làm client retry vô ích. Nhưng phải có **metric đếm số event bị từ chối theo loại**. Con số này tăng đột biến nghĩa là ai đó vừa deploy một component bắn sai.

---

## 4. Nguyên tắc payload tự đủ nghĩa

### 4.1. Quy tắc

> Payload phải chứa đủ dữ liệu để tính lại preference mà **không cần JOIN** sang bảng có thể đã thay đổi tại thời điểm phân tích.

### 4.2. Vì sao — một ví dụ cụ thể

`PreferenceBuilder` tính `price_min` / `price_max` từ giá các sản phẩm khách đã tương tác (NV-08, bước 3).

Giả sử bạn chỉ lưu `product_id`, đến lúc tính mới JOIN sang `catalog_products` lấy giá:

```
Tháng 3: Khách A xem Legion 5 giá 25.000.000đ
         → hồ sơ: quan tâm phân khúc ~25 triệu   ✅ đúng

Tháng 6: Legion 5 giảm còn 17.000.000đ
         → worker JOIN lại, tính ra: khách A quan tâm phân khúc ~17 triệu   ❌ SAI
```

Bạn vừa **viết lại quá khứ**. Khách chưa bao giờ quan tâm hàng 17 triệu; hệ thống tự bịa ra điều đó và bắt đầu gợi ý sai phân khúc.

Đây là lý do schema `tracking_events` trong tài liệu `02` nâng `price`, `category_id`, `brand_id` ra khỏi JSON thành cột riêng. Chúng vừa để index, vừa là **ảnh chụp tại thời điểm xảy ra** — giống hệt tinh thần snapshot của `ordering_order_items` (DP-3).

### 4.3. Câu hỏi kiểm tra khi thêm trường mới

Với mỗi trường, hỏi hai câu:

1. *Lúc phân tích, tra lại được không?* — Không tra được (ví dụ: từ khóa tìm kiếm, vị trí click) → **bắt buộc lưu**.
2. *Tra lại có còn đúng không?* — Có thể đổi theo thời gian (giá, danh mục, brand, trạng thái) → **bắt buộc lưu**.

Chỉ những trường vừa tra lại được vừa bất biến (ví dụ: `product.name` của sản phẩm không đổi tên) mới được phép bỏ qua — và ngay cả thế cũng nên cân nhắc.

### 4.4. Ranh giới: đừng lưu quá tay

Payload không phải nơi nhồi toàn bộ đối tượng sản phẩm. Bảng này ghi hàng nghìn dòng mỗi phút; mỗi byte thừa nhân với hàng triệu dòng.

| Nên lưu | Không nên lưu |
|---|---|
| `price` tại thời điểm xem | Toàn bộ mô tả sản phẩm |
| `categoryId`, `brandId` | Tên danh mục, tên brand (tra được, hiếm đổi) |
| `position`, `source`, `slot` | URL ảnh, danh sách variant |
| `dwellTimeMs`, `resultCount` | Toàn bộ HTML/DOM state |

---

## 5. Bảng trigger — khi nào bắn, ai bắn, chống trùng thế nào

Đây là bảng thi hành. Mỗi dòng là một hợp đồng cụ thể giữa UI và dữ liệu.

| Event | Trigger chính xác | Nguồn | Chống trùng |
|---|---|---|---|
| `product_viewed` | Vào trang chi tiết, ở lại **> 3s**, tab **đang hiển thị** | Client | 1 lần / product / session |
| `product_clicked` | Click card từ list, search, hoặc slot gợi ý — kèm `source` + `position` | Client | Không chặn |
| `product_searched` | Sau debounce 500ms, **khi kết quả đã trả về** (để có `resultCount`) | Client | Gộp query giống nhau trong 10s |
| `filter_applied` | URL params đổi và **ổn định 800ms** — gộp cả cụm filter thành 1 event | Client | Gộp theo cụm |
| `product_favorited` | Sau khi API wishlist trả 200 | Client | Không chặn |
| `cart_added` | **Sau khi API giỏ hàng trả 200** | Client | Idempotent theo `eventId` |
| `cart_removed` | Sau khi API xóa trả 200 | Client | Idempotent theo `eventId` |
| `checkout_started` | Vào trang checkout với giỏ khác rỗng | Client | 1 lần / session |
| `recommendation_shown` | Card lọt viewport **≥ 50% trong ≥ 1s** (IntersectionObserver) | Client | 1 lần / product / slot / lần render |
| `ai_query_submitted` | Khi gửi câu hỏi, **trước** khi stream trả về | Client | Không chặn |
| `purchased` | `OutboxDispatcher` xử lý `OrderPlaced` — một event cho **mỗi order item** | **Server** | Idempotent theo `(orderId, productId)` |
| `product_reviewed` | Khi review chuyển sang `Approved` | **Server** | Idempotent theo `reviewId` |

### 5.1. Giải thích vài trigger dễ làm sai

**`product_viewed` — vì sao phải kiểm tra tab đang hiển thị.**
Khách mở 8 tab sản phẩm bằng chuột giữa rồi đọc lần lượt. Nếu chỉ đếm thời gian mount component, cả 8 tab đều tính là "đã xem 5 phút" trong khi khách chỉ thực sự đọc 2 tab. Dùng `document.visibilityState` để **tạm dừng đếm** khi tab bị ẩn.

**`filter_applied` — vì sao phải gộp.**
Khách kéo thanh giá từ 10 triệu lên 25 triệu. Nếu bắn mỗi lần `onChange`, bạn có 40 event rác. Nếu chỉ bắn khi thả chuột, vẫn có vấn đề: khách chọn brand, rồi RAM, rồi giá — ba event rời rạc, mỗi cái chỉ thấy một chiều. Đúng nhất là **debounce 800ms trên toàn bộ URL params** và bắn một event chứa trọn cụm filter. Đó mới là "ý định" thật của khách.

**`cart_added` — vì sao bắn sau khi API trả 200.**
Bắn trước khi gọi API nghĩa là khi API thất bại (hết hàng, lỗi mạng), bạn vẫn ghi nhận trọng số 5 cho một hành động chưa từng thành công. Preference bị nhiễu bởi những lần thêm giỏ thất bại.

**`product_searched` — vì sao đợi kết quả.**
`resultCount` là tín hiệu rất giá trị: tìm kiếm trả về 0 kết quả là dữ liệu quan trọng nhất trong toàn bộ log tìm kiếm — nó cho biết khách muốn gì mà bạn không có. Bắn trước khi có kết quả thì mất trường này.

---

## 6. Ranh giới Frontend / Backend

### 6.1. Quy tắc phân chia

| Loại hành vi | Nguồn bắn | Lý do |
|---|---|---|
| **Khám phá** — view, click, search, filter, impression | Frontend | Chỉ có client biết những thứ này xảy ra |
| **Có hệ quả nghiệp vụ** — purchased, reviewed | **Backend** | Có giá trị tiền bạc, phải tin cậy được |
| **Trung gian** — cart_added, favorited, checkout_started | Frontend, **sau khi API thành công** | Client biết ngữ cảnh (`source`), server biết kết quả |

### 6.2. Vì sao `purchased` phải do Backend bắn

Ba lý do, theo thứ tự nghiêm trọng:

1. **Bảo mật.** `purchased` có trọng số 10 — cao nhất hệ thống. Nếu client bắn được, bất kỳ ai mở DevTools cũng có thể tự nâng điểm cho sản phẩm bất kỳ. Toàn bộ bảng "bán chạy" và ma trận co-occurrence bị đầu độc.
2. **Độ tin cậy.** Sau khi đặt hàng thành công, khách thường đóng tab ngay. Ad-blocker chặn request tracking. Mạng rớt. Mỗi trường hợp là một đơn hàng biến mất khỏi dữ liệu huấn luyện — mà đó chính là dữ liệu quý nhất.
3. **Tính toàn vẹn.** Backend bắn từ `OutboxDispatcher` nghĩa là event nằm trong cùng đảm bảo giao dịch với đơn hàng (AD-06). Có đơn hàng thì **chắc chắn** có event, không có ngoại lệ.

Luồng cụ thể đã có sẵn trong tài liệu `05`, mục 7.2:

```
COMMIT transaction đặt hàng (đã ghi outbox_messages: OrderPlaced)
   ↓
OutboxDispatcher đọc OrderPlaced
   ├─ Với mỗi order_item → INSERT tracking_events (purchased)
   │    kèm product_id, variant_id, category_id, brand_id, unit_price, quantity
   ├─ UPDATE catalog_products.sold_count
   └─ Đánh dấu user cần tính lại preference
```

Lưu ý `category_id` và `brand_id`: `ordering_order_items` không lưu hai trường này. `OutboxDispatcher` phải lấy qua `IProductLookup` (theo AR-3, không JOIN xuyên module) tại thời điểm xử lý. Chấp nhận được vì độ trễ chỉ vài giây, không phải vài tháng.

---

## 7. Impression tracking

### 7.1. Vì sao event trọng số 0 lại là quan trọng nhất

`recommendation_shown` có trọng số 0 — nó không đóng góp gì cho `PreferenceBuilder`. Nhìn qua thì vô dụng. Nhưng thiếu nó, ba thứ sụp đổ:

| Thiếu impression thì mất | Hệ quả |
|---|---|
| **CTR** = click / impression | Không biết reco tốt hay dở. Không so sánh được giai đoạn 3 với giai đoạn 1 |
| **Negative sample** cho ML | NV-09 định nghĩa nhãn `0` là "chỉ **thấy** mà không tương tác". Không có "thấy" thì tập huấn luyện chỉ toàn nhãn `1` → mô hình vô nghĩa |
| **Chống mỏi mắt** | Luật lọc số 5 của NV-09 ("đã hiện 5 lần không click thì loại") không chạy được |

Đây là lý do tài liệu `01` cảnh báo *"dùng để tính CTR, chống bias"*. Phải làm **ngay từ giai đoạn 3 (Rule Based)**, không đợi đến giai đoạn 6.

### 7.2. Quy tắc "đã hiển thị"

Không phải cứ render ra DOM là tính hiển thị. Card nằm dưới màn hình 3 trang thì khách chưa từng thấy nó, mà bạn vẫn đếm impression → CTR bị pha loãng, số liệu vô nghĩa.

Định nghĩa chuẩn:

> Một sản phẩm được coi là **đã hiển thị** khi ≥ 50% diện tích card nằm trong viewport liên tục ≥ 1 giây, với tab đang ở trạng thái visible.

```ts
// hooks/useSlotTracking.ts — ý tưởng cốt lõi
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const productId = Number(entry.target.getAttribute('data-product-id'))
      if (entry.isIntersecting) {
        timers.set(productId, window.setTimeout(() => {
          if (document.visibilityState !== 'visible') return
          if (seen.has(productId)) return          // dedupe: session-slot
          seen.add(productId)
          track('recommendation_shown', {
            productId, slot, position: positionOf(productId), provider,
          })
        }, 1000))
      } else {
        clearTimeout(timers.get(productId))         // rời viewport trước 1s → hủy
      }
    })
  },
  { threshold: 0.5 }
)
```

### 7.3. Ghi vào đâu

Impression đi theo **hai đường**, có chủ đích:

| Đích | Mục đích | Ghi khi nào |
|---|---|---|
| `reco_impressions` | Tính CTR theo slot, gắn `clicked_at` khi có click | Server ghi khi trả danh sách gợi ý (NV-09) |
| `tracking_events` | Negative sample cho ML dataset | Client bắn khi thực sự lọt viewport |

Hai bảng phục vụ hai mục đích khác nhau và **không được gộp**: `reco_impressions` ghi thứ backend *đã gửi đi*, `tracking_events` ghi thứ khách *thực sự nhìn thấy*. Chênh lệch giữa hai con số chính là tỉ lệ gợi ý bị lãng phí vì nằm dưới màn hình — một chỉ số đáng theo dõi.

---

## 8. Truy vết nguồn gốc tương tác (attribution)

### 8.1. Vấn đề

Nếu `product_clicked` chỉ có `productId`, bạn không bao giờ trả lời được những câu quan trọng nhất:

- Slot gợi ý nào mang lại doanh thu?
- Khách vào sản phẩm này từ tìm kiếm hay từ gợi ý?
- Vị trí thứ mấy trong danh sách thì được click nhiều nhất?

Không trả lời được thì dashboard "hiệu quả recommendation" (NV-13) chỉ là ô trống.

### 8.2. Trường `source` — bắt buộc, có enum cố định

```ts
export type ClickSource =
  | 'search_result'      // từ kết quả tìm kiếm
  | 'category_list'      // từ danh sách danh mục
  | 'reco_similar'       // slot "sản phẩm tương tự"
  | 'reco_bundle'        // slot "mua kèm"
  | 'reco_cart_bundle'   // gợi ý trong giỏ
  | 'reco_home_trending' // trang chủ - bán chạy
  | 'reco_home_new'      // trang chủ - hàng mới
  | 'reco_for_you'       // trang chủ - cá nhân hóa
  | 'ai_assistant'       // card sản phẩm do AI trả về
  | 'wishlist'
  | 'order_history'
  | 'direct'             // gõ URL, bookmark, link ngoài
```

Đây là enum đóng, khai báo trong `registry.ts`. Backend validate theo danh sách này. Thêm slot mới = thêm giá trị enum + review — không để lập trình viên tự nghĩ ra chuỗi mới.

### 8.3. Chuỗi ngữ cảnh: `queryId`

Để nối `product_searched` → `product_clicked` → `product_viewed` thành một chuỗi, sinh một `queryId` (UUID) mỗi lần tìm kiếm hoặc áp filter, và mang nó theo:

```
product_searched  { queryId: "q-a1b2", query: "laptop gaming", resultCount: 34 }
product_clicked   { queryId: "q-a1b2", productId: 501, position: 3, source: 'search_result' }
product_viewed    { queryId: "q-a1b2", productId: 501, dwellTimeMs: 45000 }
cart_added        { queryId: "q-a1b2", productId: 501 }
```

Bốn dòng này cho phép trả lời: *"từ khóa `laptop gaming` dẫn đến bao nhiêu lượt thêm giỏ?"* — dữ liệu vàng để tối ưu tìm kiếm và để AI hiểu ngôn ngữ khách dùng khi mô tả nhu cầu.

`queryId` lưu trong `sessionStorage`, ghi đè mỗi lần search/filter mới, gắn tự động bởi `trackingClient` nếu có.

### 8.4. Lưu `source` khi điều hướng

`source` được xác định ở **nơi click**, nhưng `product_viewed` xảy ra ở **trang đích**. Cách nối:

```ts
// sourceContext.ts
export function setNavigationSource(src: ClickSource, meta?: object) {
  sessionStorage.setItem('tb_nav_source', JSON.stringify({ src, meta, at: Date.now() }))
}

export function consumeNavigationSource(): { src: ClickSource; meta?: object } | null {
  const raw = sessionStorage.getItem('tb_nav_source')
  sessionStorage.removeItem('tb_nav_source')       // dùng một lần
  if (!raw) return null
  const parsed = JSON.parse(raw)
  if (Date.now() - parsed.at > 30_000) return null  // quá 30s → không còn liên quan
  return parsed
}
```

Dùng một lần và có hạn 30 giây. Không có hai điều kiện này, khách bấm nút Back rồi lang thang thêm 10 phút, mọi lượt xem sau đó đều bị gán sai nguồn.

---

## 9. Ba tầng dữ liệu phục vụ AI

Đây là phần trả lời trực tiếp câu hỏi *"lấy hành vi đưa AI xử lý thế nào"*.

### 9.1. AI không đọc raw event

Nhắc lại TR-6. Lý do rất thực tế:

- Raw event là hàng nghìn dòng cho một user — không thể nhét vào prompt.
- Raw event không có ý nghĩa nếu chưa tổng hợp: "xem sản phẩm 501 lúc 10:15" không nói lên điều gì; "thường xem Lenovo tầm 18–22 triệu" thì có.
- Nhét dữ liệu thô vào prompt vi phạm nguyên tắc AI-1 (tài liệu `01`): AI sẽ bắt đầu tự suy diễn thay vì dựa trên dữ liệu đã kiểm chứng.

### 9.2. Ba tầng

| Tầng | Nguồn | Độ trễ | Nội dung | AI dùng làm gì |
|---|---|---|---|---|
| **Hot** | Redis `session:ctx:{sessionId}` | ~0 (realtime) | 10 sản phẩm vừa xem, filter vừa áp, câu vừa hỏi, giỏ hiện tại | Hiểu khách đang tìm gì **ngay lúc này** |
| **Warm** | `reco_user_preferences` | 15 phút | brand_scores, category_scores, khoảng giá, spec_preferences | Biết gu **dài hạn** |
| **Cold** | MySQL qua `QueryBuilder` | ~50ms | Sản phẩm thật: giá, cấu hình, tồn kho | **Nguồn sự thật duy nhất** cho mọi con số |

### 9.3. Context bundle gửi cho LLM

```
SYSTEM: Bạn là tư vấn viên bán laptop. CHỈ dùng thông tin trong CONTEXT.
        Không bịa tên sản phẩm, giá, hay cấu hình.

CONTEXT — SẢN PHẨM (nguồn sự thật, tầng Cold):
[1] Lenovo ThinkBook 14 G6 — 19.490.000đ — i5-13500H, 16GB DDR5, 512GB SSD, còn 12
[2] Asus Vivobook Pro 15   — 21.990.000đ — Ryzen 7 7735HS, 16GB, 512GB SSD, còn 5
...

PHIÊN HIỆN TẠI (tầng Hot):
- Vừa lọc: laptop gaming, 20–25 triệu, RTX
- Vừa xem: Legion 5, Nitro 5, TUF Gaming A15
- Trong giỏ: chưa có gì

GU DÀI HẠN (tầng Warm, chỉ khi đã đăng nhập):
- Thường xem Lenovo (0.62), Asus (0.30)
- Khoảng giá quen thuộc: 18–22 triệu

USER: máy nào chơi game tốt trong tầm này?
```

### 9.4. Quy tắc dựng context

| Mã | Quy tắc |
|---|---|
| **CTX-1** | Mọi con số (giá, cấu hình, tồn kho) **chỉ** đến từ tầng Cold. Tầng Hot/Warm không bao giờ chứa giá cụ thể của sản phẩm cụ thể |
| **CTX-2** | Tầng Hot đặt **trước** tầng Warm trong prompt — nhu cầu hiện tại thắng gu dài hạn |
| **CTX-3** | Khách ẩn danh: chỉ có tầng Hot + Cold, bỏ hoàn toàn tầng Warm |
| **CTX-4** | Không đưa dữ liệu của user khác vào context, kể cả dạng tổng hợp ẩn danh |
| **CTX-5** | Tầng Hot/Warm được diễn giải thành **câu tiếng Việt ngắn**, không dump JSON thô vào prompt |
| **CTX-6** | Tổng context ≤ 2000 token — cắt tầng Hot trước, giữ nguyên tầng Cold |

CTX-2 là quyết định thiết kế đáng nhớ: khách mua laptop gaming 6 tháng trước, hôm nay đang lọc màn hình văn phòng. Nếu gu dài hạn thắng, AI sẽ tư vấn laptop gaming — sai hoàn toàn. Đây cũng chính là lý do NV-08 dùng time decay, chỉ là ở quy mô phiên thay vì quy mô tháng.

---

## 10. Session Context — tầng nóng

### 10.1. Vì sao cần tầng này

`PreferenceBuilder` chạy 15 phút/lần (BR-08.4). Với recommendation trên trang chủ, độ trễ đó chấp nhận được. Với **AI Assistant** thì không:

```
10:00:00  Khách lọc "gaming, 20–25 triệu, RTX"
10:00:30  Xem Legion 5
10:01:10  Xem Nitro 5
10:01:45  Mở chat, hỏi "máy nào chơi game tốt?"
          → Profile gần nhất tính lúc 09:52, KHÔNG biết gì về 105 giây vừa rồi
          → AI trả lời chung chung, vô dụng
```

Tầng Hot lấp đúng khoảng trống này, mà không cần thêm hạ tầng nào ngoài Redis đã có sẵn.

### 10.2. Cấu trúc

```
Key:  session:ctx:{sessionId}
TTL:  30 phút (gia hạn mỗi lần ghi)
```

```json
{
  "sessionId": "s-98765",
  "userId": 1024,
  "recentProducts": [
    { "id": 512, "categoryId": 3, "brandId": 7, "price": 24990000, "at": "10:01:10" },
    { "id": 501, "categoryId": 3, "brandId": 2, "price": 22990000, "at": "10:00:30" }
  ],
  "recentFilters": {
    "categoryId": 3, "priceMin": 20000000, "priceMax": 25000000,
    "specs": { "gpu": "rtx" }, "at": "10:00:00"
  },
  "recentQueries": ["laptop gaming 25 triệu"],
  "cartProductIds": [],
  "updatedAt": "10:01:10"
}
```

Giới hạn: tối đa **10** sản phẩm gần nhất, **3** truy vấn gần nhất, chỉ giữ **cụm filter mới nhất**. Không giới hạn thì key phình ra và prompt bị nhiễu.

### 10.3. Cập nhật ở đâu

Ngay trong `POST /api/v1/tracking/events`, **song song** với bulk insert:

```
[API] POST /api/v1/tracking/events
   ├─ Validate theo Registry
   ├─ Enrich: userId từ JWT, IP, User-Agent, received_at
   ├─ Bulk INSERT tracking_events              ← đường dữ liệu (chậm, đầy đủ)
   ├─ Cập nhật session:ctx:{sessionId} ~1ms    ← đường nóng (nhanh, rút gọn)
   └─ Trả 202 Accepted
```

Chỉ 4 loại event cập nhật tầng Hot: `product_viewed`, `filter_applied`, `product_searched`, `cart_added`. Các event khác bỏ qua — chúng không thay đổi hiểu biết về nhu cầu hiện tại.

Thao tác Redis mất khoảng 1ms, không vi phạm BR-07.1. Và nếu Redis lỗi, **nuốt exception** — tầng Hot là bonus, không phải điều kiện sống còn (TR-7).

### 10.4. Ai dùng tầng Hot

| Nơi dùng | Cách dùng |
|---|---|
| **AI Assistant** | Đưa vào context bundle (mục 9.3) |
| **AI Intent Extraction** | Điền sẵn ngân sách/danh mục khi câu hỏi của khách nói trống ("máy nào tốt?") |
| **Recommendation realtime** | Bổ sung cho user chưa có preference (dưới 5 event, BR-08.1) — giải quyết cold start trong phiên |
| **Reco filter layer** | Loại sản phẩm khách vừa xem xong khỏi slot "có thể bạn thích" |

Điểm thứ ba đáng chú ý: khách hoàn toàn mới, chưa đăng nhập, chưa có gì trong `reco_user_preferences` — nhưng sau 3 phút lướt web đã có tầng Hot đủ dùng. Đây là mảnh ghép còn thiếu của bài toán cold start, bên cạnh identity stitching.

---

## 11. Vòng đời định danh và identity stitching

### 11.1. Ba định danh

| Định danh | Lưu ở | Vòng đời | Vai trò |
|---|---|---|---|
| `anonymousId` | `localStorage` | Vĩnh viễn cho tới khi xóa trình duyệt | Nối hành vi qua nhiều phiên của khách chưa đăng nhập |
| `sessionId` | `sessionStorage` | Một tab, hoặc 30 phút không hoạt động | Ranh giới tính co-occurrence và session context |
| `userId` | JWT | Khi đã đăng nhập | Định danh thật, gắn với preference |

### 11.2. Quy tắc làm mới `sessionId`

Session không nên chỉ gắn với vòng đời tab. Quy tắc:

```
Tạo sessionId mới khi:
  - sessionStorage trống (tab mới), HOẶC
  - lần hoạt động cuối cách hiện tại > 30 phút
```

Cần lưu thêm `tb_session_last_active` (timestamp) và kiểm tra mỗi lần `track()`. Không có luật 30 phút, khách để tab mở qua đêm sẽ có một "phiên" kéo dài 14 tiếng — làm hỏng ma trận co-occurrence, vì `SimilarityCalculator` coi mọi sản phẩm trong cùng phiên là có liên quan.

### 11.3. Luồng stitching khi đăng nhập

```
Khách đăng nhập
   ↓
[1] Merge giỏ hàng (NV-03)
   ↓
[2] UPDATE tracking_events SET user_id = @userId
    WHERE anonymous_id = @anonId AND user_id IS NULL
   ↓
[3] Gán userId vào session:ctx:{sessionId} hiện tại
   ↓
[4] Kích hoạt PreferenceBuilder cho user này NGAY (không đợi chu kỳ 15 phút)
   ↓
[5] Xóa cache preference trong Redis
```

Bước 3 hay bị quên. Không có nó, khách vừa đăng nhập xong hỏi AI thì tầng Hot vẫn ẩn danh, và AI không kéo được tầng Warm.

### 11.4. Quyền của khách với dữ liệu hành vi

BR-08.5 yêu cầu khách xem và xóa được hồ sơ sở thích. Cụ thể hóa thành hai endpoint:

```
GET    /api/v1/me/preferences     → trả về profile ở dạng người đọc được
DELETE /api/v1/me/preferences     → xóa reco_user_preferences + session:ctx
                                    + UPDATE tracking_events SET user_id = NULL
```

Lưu ý cách xóa: `tracking_events` **không bị DELETE** (vi phạm DP-5 append-only) mà chỉ gỡ liên kết `user_id`. Dữ liệu vẫn phục vụ thống kê tổng hợp, nhưng không còn quy về cá nhân nào.

---

## 12. Chất lượng dữ liệu và chống nhiễu

### 12.1. Các nguồn nhiễu và cách xử lý

| Nguồn nhiễu | Triệu chứng | Xử lý |
|---|---|---|
| **Bot / crawler** | Hàng nghìn `product_viewed` trong vài giây, User-Agent lạ | BE gắn cờ `is_bot`, loại khỏi dataset huấn luyện (BR-07.5) |
| **Lướt qua** | `product_viewed` với dwell 0.4s | Chặn ở client: `minDwellMs = 3000` (BR-07.4) |
| **Tab ẩn** | Dwell time 8 tiếng | Dừng đếm khi `visibilityState !== 'visible'` |
| **Nhân viên nội bộ** | Admin xem 200 sản phẩm/ngày để kiểm tra | Loại event của user có role Staff/Admin khỏi preference và ML |
| **Gửi lại do lỗi mạng** | Event trùng `eventId` | `INSERT IGNORE` theo unique index trên `event_id` (BR-07.3) |
| **Lệch giờ máy khách** | `occurred_at` ở năm 2019 hoặc tương lai | So với `received_at`; lệch > 24h → dùng `received_at` và gắn cờ |
| **Test tự động** | Event từ CI/E2E | Header `X-Tracking-Environment: test` → ghi vào bảng riêng hoặc bỏ |

### 12.2. Chống trùng ở tầng DB

```sql
ALTER TABLE tracking_events ADD COLUMN event_id CHAR(36) NOT NULL;
CREATE UNIQUE INDEX ux_events_id ON tracking_events(event_id, occurred_at);
```

Index phải chứa `occurred_at` vì bảng đã partition theo cột này (ràng buộc của MySQL, xem tài liệu `05` mục 9.1).

Đây là index thứ tư của bảng — tài liệu `05` khuyến cáo chỉ giữ ba. Nhưng index này bắt buộc, vì không có nó thì BR-07.3 không thể thực thi. Đổi lại, tuyệt đối không thêm index thứ năm.

Khi bulk insert dùng `INSERT IGNORE` để event trùng bị bỏ qua lặng lẽ thay vì làm hỏng cả batch.

### 12.3. Giám sát chất lượng

Ba con số theo dõi hằng ngày, bên cạnh checklist ở tài liệu `05`:

```sql
-- 1. Tỉ lệ event bị từ chối do sai schema (bình thường < 0.5%)
--    Tăng đột biến = ai đó vừa deploy component bắn sai

-- 2. Tỉ lệ product_clicked thiếu source (phải = 0%)
SELECT COUNT(*) FROM tracking_events
WHERE event_type = 'product_clicked'
  AND occurred_at > NOW() - INTERVAL 1 DAY
  AND JSON_EXTRACT(payload, '$.source') IS NULL;

-- 3. Tỉ lệ phễu — so với mức tham chiếu ở NV-13
--    view → click → cart → purchase. Lệch bất thường = có event bị mất
SELECT event_type, COUNT(*) FROM tracking_events
WHERE occurred_at > NOW() - INTERVAL 1 DAY
  AND event_type IN ('product_viewed','product_clicked','cart_added','purchased')
GROUP BY event_type;
```

Truy vấn thứ hai đáng chạy nhất. Nếu nó trả về khác 0, một component nào đó đang bắn click không kèm nguồn — và mọi phân tích attribution từ hôm đó trở đi đều thiếu dữ liệu, không cách nào bù lại.

---

## 13. Hợp đồng API tracking

### 13.1. Endpoint

```
POST /api/v1/tracking/events
Content-Type: application/json
```

### 13.2. Request

```json
{
  "events": [
    {
      "eventId": "3f2a...-uuid",
      "type": "product_viewed",
      "occurredAt": "2026-07-28T10:15:00.123Z",
      "sessionId": "s-98765",
      "anonymousId": "a1b2c3...",
      "context": {
        "page": "/product/lenovo-legion-5",
        "referrer": "/search?q=laptop+gaming",
        "device": "desktop",
        "queryId": "q-a1b2"
      },
      "payload": {
        "productId": 501, "categoryId": 3, "brandId": 7,
        "price": 22990000, "dwellTimeMs": 45000, "source": "search_result"
      }
    }
  ]
}
```

### 13.3. Ràng buộc

| Mã | Ràng buộc |
|---|---|
| **API-1** | Tối đa **50 event**/batch, payload tối đa **256KB** |
| **API-2** | Luôn trả `202 Accepted`, kể cả khi một phần batch bị từ chối |
| **API-3** | `userId` **chỉ** lấy từ JWT phía server, không bao giờ nhận từ client |
| **API-4** | Server luôn gắn `received_at`; `occurred_at` từ client chỉ để tham khảo |
| **API-5** | Rate limit **100 request/phút/session** (đồng bộ tài liệu `02` mục 12) |
| **API-6** | Không trả body có ý nghĩa — client không được phụ thuộc vào response |
| **API-7** | Endpoint cho phép **cả** request đã xác thực và ẩn danh |

### 13.4. Vấn đề `sendBeacon` và JWT

`navigator.sendBeacon` **không gửi được header `Authorization`**. Code hiện tại dùng `sendBeacon`, nghĩa là backend không bao giờ enrich được `userId` từ JWT — mâu thuẫn với API-3 và làm hỏng toàn bộ luồng preference cho khách đã đăng nhập.

Hai phương án:

| Phương án | Ưu | Nhược |
|---|---|---|
| **A.** Cookie HttpOnly chứa token tracking | `sendBeacon` dùng được | Thêm một cơ chế xác thực thứ hai; rủi ro CSRF |
| **B.** `fetch(..., { keepalive: true })` | Gửi được header; vẫn sống sót khi đóng tab; có response để retry | Giới hạn 64KB payload (đủ dùng với API-1) |

**Chọn phương án B.** `keepalive` được mọi trình duyệt hiện đại hỗ trợ, giữ nguyên mô hình xác thực JWT sẵn có, và cho phép biết request thất bại để đẩy batch trở lại hàng đợi — điều `sendBeacon` không làm được.

---

## 14. Ánh xạ event → tính năng downstream

Bảng này trả lời: *"nếu tôi bỏ event này thì mất gì?"* — dùng khi cân nhắc cắt phạm vi.

| Event | `view_count` | Preference | Similarity | Reco CTR | ML dataset | AI context |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `product_viewed` | ✅ | ✅ | ✅ | | ✅ | ✅ Hot |
| `product_searched` | | ✅ | | | ✅ | ✅ Hot |
| `filter_applied` | | ✅✅ | | | ✅ | ✅ Hot |
| `product_clicked` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `product_favorited` | | ✅ | ✅ | | ✅ | |
| `cart_added` | | ✅ | ✅ | ✅ | ✅ **nhãn** | ✅ Hot |
| `cart_removed` | | ✅ âm | | | ✅ | |
| `checkout_started` | | ✅ | | | ✅ | |
| `purchased` | ✅ `sold_count` | ✅✅ | ✅✅ | ✅ | ✅ **nhãn** | |
| `product_reviewed` | | ✅ | | | ✅ | |
| `recommendation_shown` | | | | ✅ **mẫu số** | ✅ **negative** | |
| `ai_query_submitted` | | ✅ | | | | ✅ Hot |

Ba ô đáng chú ý:

- **`filter_applied` → Preference (✅✅).** Đây là tín hiệu rõ ràng nhất về ngân sách và nhu cầu. Khách lọc "20–25 triệu, RTX" nói lên nhiều hơn hai chục lượt xem cộng lại. Nhiều hệ thống bỏ qua filter vì tưởng nó chỉ là thao tác UI.
- **`recommendation_shown` → ML (negative).** Không có nó thì không có nhãn `0`.
- **`purchased` → Similarity (✅✅).** Toàn bộ tính năng "mua kèm" (lift trong NV-09) dựng trên đơn hàng. Đây là lý do TR-3 tồn tại.

---

## 15. Hiện trạng code và việc cần sửa

Code hiện có: [`frontend/src/tracking/trackingClient.ts`](../frontend/src/tracking/trackingClient.ts) và [`events.ts`](../frontend/src/tracking/events.ts). Hoạt động được, nhưng có 6 lỗ hổng cần xử lý **trước khi** viết bất kỳ component nào gọi `track()` — vì mỗi component viết theo API cũ là một chỗ phải sửa lại sau.

| # | Vấn đề | Hệ quả | Cách sửa |
|---|---|---|---|
| 1 | **Thiếu `eventId`** | BR-07.3 không thực thi được; mạng chập chờn → event nhân đôi → preference lệch | Sinh `crypto.randomUUID()` ngay khi tạo event, không phải khi gửi |
| 2 | **`sendBeacon` không gửi được JWT** | `userId` luôn NULL; toàn bộ preference cho khách đã đăng nhập không chạy | Chuyển sang `fetch(..., { keepalive: true })` (mục 13.4) |
| 3 | **Không xử lý khi gửi thất bại** | `queue.splice(0)` đã lấy hết event ra; gửi hỏng là mất sạch | Đẩy batch trở lại đầu hàng đợi khi thất bại, tối đa 2 lần thử |
| 4 | **`payload: Record<string, unknown>`** | Mất hoàn toàn type-safety; TypeScript không chặn được việc thiếu trường | Discriminated union sinh từ Registry |
| 5 | **`setInterval` ở module scope** | Chạy ngay khi import, kể cả trong unit test; không dừng được | Đưa vào `initTracking()` gọi từ `providers.tsx`, trả về hàm cleanup |
| 6 | **`sessionId` không có luật 30 phút** | Tab mở qua đêm = một phiên 14 tiếng; hỏng ma trận co-occurrence | Thêm `tb_session_last_active`, kiểm tra mỗi lần `track()` (mục 11.2) |

Ngoài ra, thiếu ba thứ chưa có trong code:

- `flush()` khi `pagehide` (không chỉ `visibilitychange`) — Safari trên iOS không bắn `visibilitychange` một cách đáng tin cậy.
- Giới hạn kích thước hàng đợi (ví dụ 200 event) để tab mở lâu không phình bộ nhớ vô hạn.
- Chặn tracking khi người dùng bật `navigator.doNotTrack` hoặc chưa đồng ý — chuẩn bị sẵn, dù v1 chưa có banner consent.

---

## 16. Thứ tự triển khai

Tương ứng giai đoạn 2 trong lộ trình (tài liệu `01`, mục 8) — tuần 8–9.

| Bước | Nội dung | Kết quả kiểm chứng được |
|---|---|---|
| **1** | `registry.ts` + discriminated union trong `events.ts` | TypeScript báo lỗi khi thiếu trường bắt buộc |
| **2** | Sửa 6 lỗ hổng ở mục 15 | Event có `eventId`, có `userId`, không mất khi gửi hỏng |
| **3** | `identity.ts` — luật session 30 phút, vòng đời anonymousId | Phiên mới sinh đúng lúc |
| **4** | Tracking hooks theo feature; gỡ mọi lời gọi `track()` trực tiếp | Grep `track(` chỉ ra kết quả trong thư mục `tracking/` |
| **5** | BE: `POST /tracking/events` + `EventSchemaValidator` theo Registry | Event thiếu trường bị từ chối và ghi WARN |
| **6** | BE: cập nhật `session:ctx` trong Redis | Key xuất hiện và đúng nội dung sau vài thao tác |
| **7** | `useSlotTracking` — impression qua IntersectionObserver | Cuộn trang thấy impression tăng đúng số card đã nhìn |
| **8** | BE: `purchased` + `product_reviewed` từ `OutboxDispatcher` | Đặt một đơn → có đúng N event `purchased` |
| **9** | `EventIngestionWorker` | `processed_at` được điền; `view_count` tăng |
| **10** | `PreferenceBuilder` | `reco_user_preferences` có dữ liệu hợp lý sau khi seed mô phỏng |

**Không nhảy bước 7.** Impression tưởng là việc của giai đoạn ML, thực ra là điều kiện tiên quyết — làm sau nghĩa là mất toàn bộ dữ liệu negative của mấy tháng đầu, và không có gì để so sánh khi đánh giá reco.

**Kiểm chứng bước 10 bằng seed mô phỏng** (tài liệu `05`, mục 11.3). Sau khi seed 100 user giả với chân dung rõ ràng, `reco_user_preferences` phải phản ánh đúng chân dung đó. Nếu user giả được gán "thích Lenovo, tầm 20 triệu" mà profile tính ra "thích Dell, tầm 40 triệu" thì có bug ở đâu đó trong chuỗi — và tốt nhất là phát hiện lúc này, không phải lúc đã có dữ liệu thật.

---

## 17. Checklist review khi thêm event mới

Dán vào template Pull Request.

- [ ] Đã khai báo trong `EVENT_REGISTRY` với `weight`, `origin`, `required`
- [ ] Đã trả lời được: bỏ event này thì tính năng nào hỏng? (đối chiếu bảng mục 14)
- [ ] Mọi trường trong `required` đều **tự đủ nghĩa** — không cần JOIN để hiểu (TR-2)
- [ ] Nếu là hành vi có hệ quả nghiệp vụ → `origin: 'server'` (TR-3)
- [ ] Có quy tắc dedupe rõ ràng, hoặc ghi rõ vì sao không cần
- [ ] Payload được dựng trong **hook**, không dựng trong component (mục 2)
- [ ] Nếu là tương tác với sản phẩm → có `source` và `position` (TR-5)
- [ ] Backend validator đã cập nhật; event sai bị từ chối và ghi WARN
- [ ] Đã cân nhắc kích thước: không nhồi trường tra lại được và bất biến (mục 4.4)
- [ ] Có test: bắn thử một event, kiểm tra dòng trong `tracking_events` đúng như mong đợi
- [ ] Không thêm index mới vào `tracking_events` (đã đủ 4)

---

## Phụ lục — Ba câu hỏi phỏng vấn và cách trả lời

**"Làm sao bạn đảm bảo dữ liệu hành vi đáng tin cậy?"**

Bốn lớp. Lớp một là Event Registry — một nguồn sự thật duy nhất định nghĩa trường bắt buộc, ràng buộc cả frontend bằng TypeScript và backend bằng validator; event thiếu trường bị từ chối tường minh chứ không âm thầm chấp nhận. Lớp hai là phân chia nguồn bắn: hành vi có giá trị tiền bạc như `purchased` do backend bắn từ Outbox nên không thể giả mạo và không mất khi khách đóng tab. Lớp ba là chống trùng bằng `event_id` với unique index, vì client có thể gửi lại khi mạng lỗi. Lớp bốn là giám sát chất lượng: tôi theo dõi tỉ lệ event bị từ chối và tỉ lệ click thiếu nguồn hằng ngày, vì dữ liệu hành vi hỏng thì không cách nào bù lại được sau.

**"Vì sao phải log cả những gợi ý mà người dùng không click?"**

Vì thiếu nó thì cả hệ thống đánh giá sụp đổ. CTR là click chia impression — không có mẫu số thì không so sánh được rule-based với machine learning, và rất nhiều dự án ML thất bại đúng ở chỗ mô hình phức tạp hơn nhưng CTR thấp hơn mà không ai phát hiện. Quan trọng hơn, bài toán của tôi là dự đoán xác suất tương tác, nhãn `0` được định nghĩa là "đã thấy nhưng không tương tác" — không có impression thì tập huấn luyện chỉ toàn nhãn dương, mô hình học được đúng một điều là "trả lời có" cho mọi thứ. Tôi cũng định nghĩa "đã thấy" chặt chẽ: 50% diện tích trong viewport liên tục một giây, chứ không phải cứ render ra DOM là tính.

**"Hành vi người dùng đi vào AI như thế nào?"**

Qua ba tầng, và AI không bao giờ đọc raw event. Tầng lạnh là sản phẩm thật truy vấn từ MySQL — nguồn duy nhất cho mọi con số về giá, cấu hình, tồn kho, để chống hallucination. Tầng ấm là hồ sơ sở thích do worker tính 15 phút một lần, cho biết gu dài hạn. Tầng nóng là session context trong Redis cập nhật realtime, cho biết khách đang tìm gì ngay lúc này. Tầng nóng là thứ tôi thấy nhiều hệ thống bỏ sót: profile 15 phút một lần là quá chậm cho chat — khách vừa lọc xong một khoảng giá rồi hỏi ngay thì profile chưa kịp biết. Và trong prompt tôi đặt tầng nóng trước tầng ấm, vì nhu cầu hiện tại phải thắng gu quá khứ: khách mua laptop gaming sáu tháng trước, hôm nay đang tìm màn hình văn phòng, thì tư vấn laptop gaming là sai hoàn toàn.
