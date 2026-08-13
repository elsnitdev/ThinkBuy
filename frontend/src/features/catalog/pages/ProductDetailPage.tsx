import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  BadgeCheck,
  ChevronRight,
  CreditCard,
  Heart,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react'
import { getProductBySlug, getRelatedProducts } from '@/mocks/products'
import type { ProductSpec, SpecGroup } from '@/shared/types/product'
import { ProductImage } from '@/shared/components/product/ProductImage'
import { Button } from '@/shared/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs'
import {
  discountPercent,
  formatCompact,
  formatDate,
  formatVnd,
} from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

const POLICIES = [
  {
    icon: ShieldCheck,
    text: 'Bảo hành chính hãng 24 tháng tại trung tâm ủy quyền',
  },
  {
    icon: Truck,
    text: 'Giao hàng toàn quốc 2–4 ngày, miễn phí đơn từ 5 triệu',
  },
  { icon: RotateCcw, text: 'Đổi trả trong 7 ngày nếu lỗi từ nhà sản xuất' },
  { icon: CreditCard, text: 'Trả góp 0% qua thẻ tín dụng, kỳ hạn 3–12 tháng' },
]

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const product = slug ? getProductBySlug(slug) : undefined

  const [variantIndex, setVariantIndex] = useState(0)
  const [imageIndex, setImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  if (!product) {
    return (
      <div className="shell py-24 text-center">
        <h1 className="text-xl font-bold text-heading">
          Không tìm thấy sản phẩm
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sản phẩm bạn tìm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Về trang chủ</Link>
        </Button>
      </div>
    )
  }

  const variant = product.variants[variantIndex]
  const discount = discountPercent(variant.price, variant.compareAtPrice)
  const outOfStock = variant.stock === 0
  const related = getRelatedProducts(product)

  const specGroups = product.specs.reduce<Record<string, ProductSpec[]>>(
    (groups, spec) => {
      ;(groups[spec.group] ??= []).push(spec)
      return groups
    },
    {},
  )

  const ratingBuckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: product.reviews.filter((review) => review.rating === star).length,
  }))

  return (
    <div className="shell py-5">
      {/* Đường dẫn phân cấp */}
      <nav className="flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
        <Link to="/" className="hover:text-brand">
          Trang chủ
        </Link>
        <ChevronRight className="size-3.5" />
        <Link to="/danh-muc/laptop" className="hover:text-brand">
          {product.category}
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          to={`/danh-muc/laptop-${product.brand.toLowerCase()}`}
          className="hover:text-brand"
        >
          {product.brand}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-heading">{product.name}</span>
      </nav>

      {/* ===== Khối mua hàng ===== */}
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* Thư viện ảnh */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="aspect-[4/3] rounded-md bg-surface-sunken p-6">
            <ProductImage
              src={product.images[imageIndex]}
              alt={`${product.name} — góc ${imageIndex + 1}`}
              eager
            />
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2.5">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`Xem ảnh ${index + 1}`}
                  className={cn(
                    'aspect-[4/3] rounded-md border-2 bg-surface-sunken p-2 transition-colors',
                    index === imageIndex
                      ? 'border-brand'
                      : 'border-transparent hover:border-navy-300',
                  )}
                >
                  <ProductImage src={image} alt="" eager />
                </button>
              ))}
            </div>
          )}

          <p className="mt-3 text-[12px] text-muted-foreground">
            Ảnh minh họa do dự án tự dựng — thay bằng ảnh thật qua bảng
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px]">
              catalog_product_images
            </code>
          </p>
        </div>

        {/* Hộp thông tin và đặt mua */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-[11.5px] font-semibold tracking-wider text-muted-foreground uppercase">
            {product.brand}
            <span className="mx-1.5 text-border">|</span>
            <span className="text-brand">{product.useCase}</span>
          </p>

          <h1 className="mt-2 text-[22px] leading-snug font-bold text-heading">
            {product.name}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="size-4 fill-star text-star" />
              <span className="tnum font-semibold text-heading">
                {product.rating.toFixed(1)}
              </span>
              <span className="tnum">({product.reviewCount} đánh giá)</span>
            </span>
            <span className="text-border">•</span>
            <span className="tnum">
              Đã bán {formatCompact(product.soldCount)}
            </span>
            <span className="text-border">•</span>
            <span className="tnum">SKU {variant.sku}</span>
          </div>

          {/* Giá */}
          <div className="mt-4 rounded-md bg-surface-sunken p-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
              <span className="tnum text-[28px] leading-none font-bold text-price">
                {formatVnd(variant.price)}
              </span>
              {variant.compareAtPrice && (
                <>
                  <span className="tnum text-[14px] text-muted-foreground line-through">
                    {formatVnd(variant.compareAtPrice)}
                  </span>
                  <span className="tnum rounded bg-sale px-1.5 py-1 text-[11.5px] leading-none font-bold text-white">
                    -{discount}%
                  </span>
                </>
              )}
            </div>
            {variant.compareAtPrice && (
              <p className="tnum mt-2 text-[13px] font-medium text-sale-text">
                Tiết kiệm {formatVnd(variant.compareAtPrice - variant.price)} so
                với giá niêm yết
              </p>
            )}
          </div>

          {/* Chọn cấu hình */}
          <div className="mt-5">
            <p className="text-[13px] font-semibold text-heading">
              Cấu hình
              <span className="ml-1.5 font-normal text-muted-foreground">
                (RAM / Ổ cứng)
              </span>
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {product.variants.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVariantIndex(index)}
                  disabled={item.stock === 0}
                  className={cn(
                    'rounded-md border px-3 py-2 text-left transition-colors',
                    index === variantIndex
                      ? 'border-brand bg-surface-sunken'
                      : 'border-border hover:border-navy-300',
                    item.stock === 0 && 'cursor-not-allowed opacity-45',
                  )}
                >
                  <span className="block text-[13px] font-semibold text-heading">
                    {item.label}
                  </span>
                  <span className="tnum block text-[12px] text-muted-foreground">
                    {item.stock === 0 ? 'Hết hàng' : formatVnd(item.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tồn kho */}
          <p
            className={cn(
              'mt-4 flex items-center gap-1.5 text-[13px] font-medium',
              outOfStock ? 'text-muted-foreground' : 'text-success',
            )}
          >
            <BadgeCheck className="size-4" />
            {outOfStock
              ? 'Cấu hình này tạm hết hàng'
              : `Còn ${variant.stock} máy tại kho — sẵn sàng giao`}
          </p>

          {/* Số lượng và nút đặt mua */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 items-center rounded-md border border-border">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1}
                className="flex size-10 items-center justify-center text-muted-foreground disabled:opacity-40"
                aria-label="Giảm số lượng"
              >
                <Minus className="size-4" />
              </button>
              <span className="tnum w-10 text-center text-[14px] font-semibold text-heading">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((value) =>
                    Math.min(variant.stock || 1, value + 1),
                  )
                }
                disabled={outOfStock || quantity >= variant.stock}
                className="flex size-10 items-center justify-center text-muted-foreground disabled:opacity-40"
                aria-label="Tăng số lượng"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Thêm vào yêu thích"
            >
              <Heart className="size-4" />
            </Button>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <Button size="lg" disabled={outOfStock}>
              <ShoppingCart className="size-4" />
              Thêm vào giỏ
            </Button>
            <Button
              size="lg"
              disabled={outOfStock}
              className="bg-sale hover:bg-sale-hover"
            >
              Mua ngay
            </Button>
          </div>

          {/* Cam kết */}
          <ul className="mt-5 space-y-2.5 border-t border-border pt-4">
            {POLICIES.map((policy) => (
              <li
                key={policy.text}
                className="flex items-start gap-2.5 text-[13px] leading-snug text-body"
              >
                <policy.icon className="mt-0.5 size-4 shrink-0 text-brand" />
                {policy.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ===== Nội dung chi tiết ===== */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Tabs defaultValue="mo-ta" className="min-w-0 gap-0">
          {/* overflow-x-auto: nhãn tiếng Việt dài hơn bề ngang màn hình hẹp */}
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-b-none border-b border-border bg-card p-0">
            {[
              { value: 'mo-ta', label: 'Mô tả sản phẩm' },
              { value: 'thong-so', label: 'Thông số kỹ thuật' },
              {
                value: 'danh-gia',
                label: `Đánh giá (${product.reviewCount})`,
              },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-none shrink-0 rounded-none border-0 border-b-2 border-transparent px-5 py-3 text-[14px] font-medium whitespace-nowrap text-muted-foreground data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:text-heading data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Mô tả */}
          <TabsContent
            value="mo-ta"
            className="rounded-b-lg border border-t-0 border-border bg-card p-6"
          >
            <p className="text-[14.5px] leading-relaxed text-body">
              {product.shortDescription}
            </p>

            <h3 className="mt-6 text-[15px] font-bold text-heading">
              Điểm nổi bật
            </h3>
            <ul className="mt-3 space-y-2.5">
              {product.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-2.5 text-[14px] leading-relaxed text-body"
                >
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand" />
                  {highlight}
                </li>
              ))}
            </ul>

            <h3 className="mt-6 text-[15px] font-bold text-heading">
              Trong hộp có gì
            </h3>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {[
                'Thân máy',
                'Adapter sạc theo máy',
                'Sách hướng dẫn sử dụng',
                'Phiếu bảo hành điện tử',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 rounded-md bg-muted px-3 py-2.5 text-[13.5px] text-body"
                >
                  <Package className="size-4 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </TabsContent>

          {/* Thông số */}
          <TabsContent
            value="thong-so"
            className="rounded-b-lg border border-t-0 border-border bg-card p-6"
          >
            <div className="space-y-6">
              {Object.entries(specGroups).map(([group, specs]) => (
                <section key={group}>
                  <h3 className="mb-2.5 text-[13px] font-bold tracking-wide text-brand uppercase">
                    {group as SpecGroup}
                  </h3>
                  <dl className="overflow-hidden rounded-md border border-border">
                    {specs.map((spec, index) => (
                      <div
                        key={spec.key}
                        className={cn(
                          'grid grid-cols-1 gap-1 px-4 py-2.5 sm:grid-cols-[200px_1fr] sm:gap-4',
                          index % 2 === 1 && 'bg-muted/60',
                        )}
                      >
                        <dt className="text-[13.5px] text-muted-foreground">
                          {spec.label}
                        </dt>
                        <dd className="text-[13.5px] font-medium text-heading">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </TabsContent>

          {/* Đánh giá */}
          <TabsContent
            value="danh-gia"
            className="rounded-b-lg border border-t-0 border-border bg-card p-6"
          >
            <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
              <div className="rounded-md bg-surface-sunken p-5 text-center">
                <p className="tnum text-[38px] leading-none font-bold text-body">
                  {product.rating.toFixed(1)}
                </p>
                <div className="mt-2 flex justify-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        'size-4',
                        index < Math.round(product.rating)
                          ? 'fill-star text-star'
                          : 'text-navy-200',
                      )}
                    />
                  ))}
                </div>
                <p className="tnum mt-2 text-[12.5px] text-muted-foreground">
                  {product.reviewCount} lượt đánh giá
                </p>
              </div>

              <div className="space-y-2">
                {ratingBuckets.map((bucket) => {
                  const total = product.reviews.length || 1
                  const percent = Math.round((bucket.count / total) * 100)
                  return (
                    <div key={bucket.star} className="flex items-center gap-3">
                      <span className="tnum flex w-8 items-center gap-1 text-[13px] text-muted-foreground">
                        {bucket.star}
                        <Star className="size-3 fill-star text-star" />
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-brand"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="tnum w-8 text-right text-[12.5px] text-muted-foreground">
                        {bucket.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 divide-y divide-border border-t border-border">
              {product.reviews.map((review) => (
                <article key={review.id} className="py-5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-full bg-navy-100 text-[13px] font-bold text-navy-700">
                      {review.author.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-heading">
                        {review.author}
                        {review.verified && (
                          <span className="flex items-center gap-1 rounded-sm bg-success-soft px-1.5 py-0.5 text-[10.5px] leading-none font-medium text-success">
                            <BadgeCheck className="size-3" />
                            Đã mua hàng
                          </span>
                        )}
                      </p>
                      <p className="tnum mt-0.5 text-[12px] text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <span className="ml-auto flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={cn(
                            'size-3.5',
                            index < review.rating
                              ? 'fill-star text-star'
                              : 'text-navy-200',
                          )}
                        />
                      ))}
                    </span>
                  </div>

                  <h4 className="mt-3 text-[14px] font-semibold text-heading">
                    {review.title}
                  </h4>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-body">
                    {review.content}
                  </p>
                </article>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Cột phải — sản phẩm tương tự */}
        <aside className="rounded-lg border border-border bg-card p-4 lg:self-start">
          <h3 className="text-[14px] font-bold text-heading">
            Sản phẩm tương tự
          </h3>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Cùng nhu cầu {product.useCase.toLowerCase()}
          </p>

          <ul className="mt-4 divide-y divide-border">
            {related.map((item) => (
              <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  to={`/san-pham/${item.slug}`}
                  className="group flex gap-3"
                >
                  <span className="size-16 shrink-0 rounded-md bg-surface-sunken p-1.5">
                    <ProductImage src={item.images[0]} alt={item.name} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[13px] leading-snug font-medium text-heading transition-colors group-hover:text-brand">
                      {item.name}
                    </span>
                    <span className="tnum mt-1.5 block text-[13.5px] font-bold text-body">
                      {formatVnd(item.price)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
