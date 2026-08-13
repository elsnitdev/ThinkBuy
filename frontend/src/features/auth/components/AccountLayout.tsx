import { NavLink, Outlet } from 'react-router-dom'
import { Heart, LogOut, MapPin, Package, UserRound } from 'lucide-react'
import { notify } from '@/shared/lib/notify'
import { CURRENT_USER } from '@/mocks/user'
import { ORDERS } from '@/mocks/orders'
import { useWishlistStore } from '@/shared/store/wishlistStore'
import { cn } from '@/shared/lib/utils'

export function AccountLayout() {
  const wishlistCount = useWishlistStore((state) => state.productIds.length)

  const navItems = [
    {
      to: '/tai-khoan',
      label: 'Thông tin tài khoản',
      icon: UserRound,
      end: true,
    },
    {
      to: '/tai-khoan/don-hang',
      label: 'Đơn hàng của tôi',
      icon: Package,
      badge: ORDERS.length,
    },
    { to: '/tai-khoan/dia-chi', label: 'Sổ địa chỉ', icon: MapPin },
    {
      to: '/yeu-thich',
      label: 'Sản phẩm yêu thích',
      icon: Heart,
      badge: wishlistCount,
    },
  ]

  const initial = CURRENT_USER.fullName.trim().slice(-1).toUpperCase()

  return (
    <div className="shell py-5">
      <div className="grid gap-4 lg:grid-cols-[248px_minmax(0,1fr)]">
        {/* ===== Cột trái ===== */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-[17px] font-bold text-on-brand">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-heading">
                  {CURRENT_USER.fullName}
                </p>
                <p className="truncate text-[12.5px] text-muted-foreground">
                  {CURRENT_USER.email}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-3 overflow-hidden rounded-md border border-border bg-card">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 border-l-2 px-3.5 py-3 text-[13.5px] transition-colors',
                    isActive
                      ? 'border-brand bg-brand-soft font-semibold text-brand'
                      : 'border-transparent text-body hover:bg-surface-sunken',
                  )
                }
              >
                <item.icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="tnum rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={async () => {
                const agreed = await notify.confirm({
                  title: 'Đăng xuất khỏi tài khoản?',
                  description:
                    'Giỏ hàng và danh sách yêu thích vẫn được giữ lại cho lần đăng nhập sau.',
                  confirmLabel: 'Đăng xuất',
                })
                if (!agreed) return
                notify.info('Chức năng đăng xuất chưa nối với backend')
              }}
              className="flex w-full items-center gap-2.5 border-t border-border px-3.5 py-3 text-[13.5px] text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-sale-text"
            >
              <LogOut className="size-4 shrink-0" />
              Đăng xuất
            </button>
          </nav>
        </aside>

        {/* ===== Nội dung ===== */}
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
