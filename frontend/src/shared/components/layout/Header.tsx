import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Bot,
  Heart,
  Menu,
  Phone,
  Search,
  ShoppingCart,
  Truck,
  User,
  X,
} from 'lucide-react'
import { Logo } from './Logo'
import { selectCartCount, useCartStore } from '@/shared/store/cartStore'
import { useWishlistStore } from '@/shared/store/wishlistStore'
import { cn } from '@/shared/lib/utils'

const NAV_ITEMS = [
  { label: 'Laptop', to: '/danh-muc/laptop' },
  { label: 'Linh kiện', to: '/danh-muc/linh-kien' },
  { label: 'Phụ kiện', to: '/danh-muc/phu-kien' },
  { label: 'Khuyến mãi', to: '/khuyen-mai', hot: true },
  { label: 'Tin công nghệ', to: '/tin-tuc' },
  { label: 'Liên hệ', to: '/lien-he' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  // Badge lấy số thật từ store, không phải số cứng
  const cartCount = useCartStore(selectCartCount)
  const wishlistCount = useWishlistStore((state) => state.productIds.length)

  return (
    <header className="sticky top-0 z-50">
      {/* Tầng 1 — dải tiện ích */}
      <div className="hidden bg-surface-darkest text-[12.5px] text-on-dark-soft md:block">
        <div className="shell flex h-8 items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Truck className="size-3.5" />
              Miễn phí giao hàng toàn quốc
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5" />
              Hotline 1900 6868
            </span>
          </div>
          <nav className="flex items-center gap-5">
            <Link to="/tra-cuu-don-hang" className="hover:text-white">
              Tra cứu đơn hàng
            </Link>
            <Link to="/he-thong-cua-hang" className="hover:text-white">
              Hệ thống cửa hàng
            </Link>
          </nav>
        </div>
      </div>

      {/* Tầng 2 — khối chính */}
      <div className="bg-surface-dark">
        <div className="shell flex h-16 items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="-ml-1 rounded-md p-2 text-white lg:hidden"
            aria-label="Mở danh mục"
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>

          <Link to="/" className="shrink-0">
            <Logo className="hidden sm:flex" />
            <Logo className="sm:hidden" markOnly />
          </Link>

          {/* Ô tìm kiếm */}
          <form
            className="flex h-10 max-w-xl flex-1 overflow-hidden rounded-md bg-white"
            onSubmit={(event) => event.preventDefault()}
          >
            <select
              className="hidden h-full border-r border-border bg-transparent pr-1 pl-3 text-[13px] text-muted-foreground outline-none sm:block"
              aria-label="Phạm vi tìm kiếm"
            >
              <option>Tất cả</option>
              <option>Laptop</option>
              <option>Linh kiện</option>
              <option>Phụ kiện</option>
            </select>
            <input
              type="search"
              placeholder="Tìm laptop, ví dụ: Legion RAM 16GB…"
              className="h-full min-w-0 flex-1 px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="flex h-full w-11 items-center justify-center bg-brand text-on-brand transition-colors hover:bg-brand-hover"
              aria-label="Tìm kiếm"
            >
              <Search className="size-4" />
            </button>
          </form>

          {/* Nhóm hành động */}
          <div className="ml-auto flex items-center">
            <HeaderAction
              icon={<Bot className="size-5" />}
              label="Trợ lý AI"
              to="/tro-ly-ai"
              className="hidden md:flex"
            />
            <HeaderAction
              icon={<Heart className="size-5" />}
              label="Yêu thích"
              to="/yeu-thich"
              badge={wishlistCount}
              className="hidden sm:flex"
            />
            <HeaderAction
              icon={<ShoppingCart className="size-5" />}
              label="Giỏ hàng"
              to="/gio-hang"
              badge={cartCount}
            />
            <HeaderAction
              icon={<User className="size-5" />}
              label="Tài khoản"
              to="/tai-khoan"
            />
          </div>
        </div>
      </div>

      {/* Tầng 3 — thanh danh mục */}
      <nav className="hidden border-b border-border bg-card lg:block">
        <div className="shell flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-1.5 px-3.5 py-3 text-[14.5px] font-medium text-heading transition-colors',
                  'after:absolute after:inset-x-3.5 after:bottom-0 after:h-0.5 after:bg-brand after:opacity-0 after:transition-opacity',
                  'hover:text-brand hover:after:opacity-100',
                  isActive && 'text-brand after:opacity-100',
                )
              }
            >
              {item.label}
              {item.hot && (
                <span className="rounded-sm bg-sale-soft px-1.5 py-0.5 text-[10px] leading-none font-bold text-sale-text uppercase">
                  Hot
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Danh mục cho màn hình hẹp */}
      {mobileOpen && (
        <nav className="border-b border-border bg-card lg:hidden">
          <div className="shell flex flex-col py-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 border-b border-border py-3 text-[15px] font-medium text-heading last:border-b-0"
              >
                {item.label}
                {item.hot && (
                  <span className="rounded-sm bg-sale-soft px-1.5 py-0.5 text-[10px] leading-none font-bold text-sale-text uppercase">
                    Hot
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}

interface HeaderActionProps {
  icon: React.ReactNode
  label: string
  to: string
  badge?: number
  className?: string
}

function HeaderAction({
  icon,
  label,
  to,
  badge,
  className,
}: HeaderActionProps) {
  return (
    <Link
      to={to}
      className={cn(
        'relative flex flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 text-white transition-colors hover:bg-navy-800 lg:px-3',
        className,
      )}
    >
      <span className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="tnum absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-sale px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </span>
      <span className="hidden text-[11px] leading-none text-navy-200 lg:block">
        {label}
      </span>
    </Link>
  )
}
