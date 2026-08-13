import { Link } from 'react-router-dom'
import {
  CircuitBoard,
  Cpu,
  Heart,
  MemoryStick,
  Monitor,
  ShoppingCart,
  Star,
} from 'lucide-react'
import { notify } from '@/shared/lib/notify'
import type { ProductListItem } from '@/shared/types/product'
import { ProductImage } from '@/shared/components/product/ProductImage'
import { useWishlistStore } from '@/shared/store/wishlistStore'
import { discountPercent, formatCompact, formatVnd } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

interface ProductCardProps {
  product: ProductListItem
  /** Ảnh của card trong màn hình đầu nên tải ngay thay vì tải trễ */
  eager?: boolean
  className?: string
}

export function ProductCard({ product, eager, className }: ProductCardProps) {
  const wishlisted = useWishlistStore((state) =>
    state.productIds.includes(product.id),
  )
  const toggleWishlist = useWishlistStore((state) => state.toggle)

  const discount = discountPercent(product.price, product.compareAtPrice)
  const outOfStock = product.stock === 0

  // Chỉ một nhãn duy nhất — nhiều nhãn chồng nhau làm lưới rối
  const flag = discount
    ? { text: `-${discount}%`, tone: 'coral' as const }
    : product.badges.includes('new')
      ? { text: 'Mới', tone: 'blue' as const }
      : product.badges.includes('hot')
        ? { text: 'Bán chạy', tone: 'blue' as const }
        : null

  const specRows = [
    { icon: Cpu, value: product.keySpecs.cpu },
    { icon: CircuitBoard, value: product.keySpecs.gpu },
    {
      icon: MemoryStick,
      value: `${product.keySpecs.ram} · ${product.keySpecs.storage}`,
    },
    { icon: Monitor, value: product.keySpecs.screen },
  ]

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-md border border-border bg-card transition-colors',
        'hover:border-brand-line',
        className,
      )}
    >
      <div className="relative">
        <Link
          to={`/san-pham/${product.slug}`}
          className="block aspect-[4/3] px-3 pt-3"
          aria-label={product.name}
        >
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            eager={eager}
            className={cn(outOfStock && 'opacity-40 grayscale')}
          />
        </Link>

        {flag && (
          <span
            className={cn(
              'tnum absolute top-2 left-2 rounded-sm px-1.5 py-1 text-[11px] leading-none font-bold text-white',
              flag.tone === 'coral' ? 'bg-sale' : 'bg-brand',
            )}
          >
            {flag.text}
          </span>
        )}

        {outOfStock ? (
          <span className="absolute top-2 right-2 rounded-sm bg-surface-dark/85 px-2 py-1 text-[11px] leading-none font-semibold text-white">
            Hết hàng
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              toggleWishlist(product.id)
              notify.success(
                wishlisted
                  ? 'Đã bỏ khỏi danh sách yêu thích'
                  : 'Đã thêm vào danh sách yêu thích',
                product.name,
              )
            }}
            aria-label={
              wishlisted
                ? `Bỏ ${product.name} khỏi yêu thích`
                : `Thêm ${product.name} vào yêu thích`
            }
            aria-pressed={wishlisted}
            className={cn(
              'absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-md transition-colors hover:bg-surface-sunken',
              wishlisted ? 'text-sale' : 'text-navy-300 hover:text-sale',
            )}
          >
            <Heart className={cn('size-4', wishlisted && 'fill-current')} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3>
          <Link
            to={`/san-pham/${product.slug}`}
            className="line-clamp-2 min-h-[2.6em] text-[13.5px] leading-snug font-semibold text-heading transition-colors hover:text-brand"
          >
            {product.name}
          </Link>
        </h3>

        {/* Khối thông số — thứ làm card trông như trang bán hàng thật */}
        <ul className="mt-2 space-y-1 rounded-sm bg-surface-sunken px-2 py-1.5">
          {specRows.map((row) => (
            <li
              key={row.value}
              className="flex items-center gap-1.5 text-[11.5px] leading-tight text-navy-700"
            >
              <row.icon className="size-3.5 shrink-0 text-navy-400" />
              <span className="truncate">{row.value}</span>
            </li>
          ))}
        </ul>

        {/* Giá — luôn sát đáy để các card thẳng hàng */}
        <div className="mt-auto pt-2.5">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="tnum text-[17px] leading-none font-bold text-price">
                {formatVnd(product.price)}
              </p>
              {product.compareAtPrice && (
                <p className="tnum mt-1 flex items-center gap-1.5 text-[11.5px] leading-none">
                  <span className="text-muted-foreground line-through">
                    {formatVnd(product.compareAtPrice)}
                  </span>
                  <span className="font-semibold text-sale-text">
                    -{discount}%
                  </span>
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={outOfStock}
              aria-label={`Thêm ${product.name} vào giỏ hàng`}
              className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-navy-600 transition-colors hover:border-brand hover:bg-brand hover:text-white disabled:pointer-events-none disabled:opacity-40"
            >
              <ShoppingCart className="size-4" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="size-3 fill-star text-star" />
              <span className="tnum font-semibold text-body">
                {product.rating.toFixed(1)}
              </span>
              <span className="tnum">({product.reviewCount})</span>
            </span>
            <span className="tnum">
              Đã bán {formatCompact(product.soldCount)}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
