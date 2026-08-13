import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  ChevronRight,
  CreditCard,
  Feather,
  Gamepad2,
  GraduationCap,
  Headphones,
  Keyboard,
  Laptop,
  Palette,
} from 'lucide-react'
import { PRODUCTS } from '@/mocks/products'
import { ProductCard } from '../components/ProductCard'
import { ProductImage } from '@/shared/components/product/ProductImage'
import { Button } from '@/shared/components/ui/button'
import { discountPercent, formatVnd } from '@/shared/lib/format'

/** Menu danh mục dọc — bố cục quen thuộc của trang bán hàng công nghệ */
const CATEGORY_MENU = [
  { icon: Laptop, label: 'Tất cả laptop', slug: 'laptop' },
  { icon: Gamepad2, label: 'Laptop Gaming', slug: 'laptop-gaming' },
  { icon: Briefcase, label: 'Laptop Văn phòng', slug: 'laptop-van-phong' },
  { icon: Palette, label: 'Laptop Đồ họa', slug: 'laptop-do-hoa' },
  { icon: Feather, label: 'Laptop Mỏng nhẹ', slug: 'laptop-mong-nhe' },
  { icon: GraduationCap, label: 'Laptop Sinh viên', slug: 'laptop-sinh-vien' },
  { icon: Keyboard, label: 'Bàn phím & Chuột', slug: 'phu-kien-nhap-lieu' },
  { icon: Headphones, label: 'Tai nghe & Loa', slug: 'phu-kien-am-thanh' },
]

export function HomePage() {
  const spotlight = PRODUCTS[0]
  const spotlightDiscount = discountPercent(
    spotlight.price,
    spotlight.compareAtPrice,
  )

  return (
    <>
      {/* ===== Khối đầu trang: menu · banner · ưu đãi ===== */}
      <section className="shell pt-4">
        <div className="grid gap-3 lg:grid-cols-[224px_minmax(0,1fr)_264px]">
          {/* Cột trái — menu danh mục */}
          <nav className="hidden rounded-md border border-border bg-card py-1.5 lg:block">
            {CATEGORY_MENU.map((item) => (
              <Link
                key={item.slug}
                to={`/danh-muc/${item.slug}`}
                className="group flex items-center gap-2.5 px-3 py-[9px] text-[13.5px] text-body transition-colors hover:bg-surface-sunken hover:text-brand"
              >
                <item.icon className="size-4 shrink-0 text-navy-400 transition-colors group-hover:text-brand" />
                <span className="flex-1 truncate">{item.label}</span>
                <ChevronRight className="size-3.5 shrink-0 text-navy-200 transition-colors group-hover:text-brand-line" />
              </Link>
            ))}
          </nav>

          {/* Giữa — banner sản phẩm tiêu điểm */}
          <div className="overflow-hidden rounded-md bg-surface-dark">
            <div className="flex h-full flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-2 sm:p-7">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2.5 text-[11.5px] font-semibold tracking-[0.14em] text-on-dark-soft uppercase">
                  <span className="h-px w-6 bg-sale" />
                  Tiêu điểm tháng 7
                </p>

                <h1 className="mt-3 text-[23px] leading-tight font-bold text-white">
                  {spotlight.name}
                </h1>

                <p className="tnum mt-2 text-[13px] text-navy-200">
                  {spotlight.keySpecs.cpu} · {spotlight.keySpecs.gpu} ·{' '}
                  {spotlight.keySpecs.screen}
                </p>

                <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                  <span className="tnum text-[26px] leading-none font-bold text-white">
                    {formatVnd(spotlight.price)}
                  </span>
                  {spotlight.compareAtPrice && (
                    <>
                      <span className="tnum text-[13px] text-navy-400 line-through">
                        {formatVnd(spotlight.compareAtPrice)}
                      </span>
                      <span className="tnum rounded-sm bg-sale px-1.5 py-1 text-[11.5px] leading-none font-bold text-white">
                        -{spotlightDiscount}%
                      </span>
                    </>
                  )}
                </div>

                <Button asChild className="mt-5">
                  <Link to={`/san-pham/${spotlight.slug}`}>
                    Xem chi tiết
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>

              <div className="w-full shrink-0 sm:w-[46%]">
                <ProductImage
                  src={spotlight.images[0]}
                  alt={spotlight.name}
                  eager
                  className="aspect-[4/3]"
                />
              </div>
            </div>
          </div>

          {/* Cột phải — ưu đãi */}
          <div className="hidden grid-rows-2 gap-3 lg:grid">
            <div className="flex flex-col justify-center rounded-md border border-border bg-card p-4">
              <span className="flex size-9 items-center justify-center rounded-md bg-brand-soft text-brand">
                <CreditCard className="size-[18px]" />
              </span>
              <p className="mt-3 text-[14px] font-bold text-heading">
                Trả góp 0%
              </p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
                Qua thẻ tín dụng, kỳ hạn 3–12 tháng, không phát sinh phí ẩn.
              </p>
            </div>

            <div className="flex flex-col justify-center rounded-md border border-border bg-card p-4">
              <span className="flex size-9 items-center justify-center rounded-md bg-sale-soft text-sale-text">
                <GraduationCap className="size-[18px]" />
              </span>
              <p className="mt-3 text-[14px] font-bold text-heading">
                Sinh viên giảm thêm 5%
              </p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
                Áp dụng sau khi xác thực thẻ sinh viên còn hiệu lực.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Lưới sản phẩm ===== */}
      <section className="shell mt-8">
        <div className="mb-4 flex items-end justify-between gap-4 border-b-2 border-navy-900 pb-2.5">
          <h2 className="text-[18px] font-bold tracking-tight text-heading uppercase">
            Laptop bán chạy
          </h2>
          <Link
            to="/danh-muc/laptop"
            className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-hover"
          >
            Xem tất cả
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {PRODUCTS.map((product, index) => (
            <ProductCard key={product.id} product={product} eager={index < 5} />
          ))}
        </div>
      </section>
    </>
  )
}
