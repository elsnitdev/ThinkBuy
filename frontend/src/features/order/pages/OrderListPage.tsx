import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Package } from 'lucide-react'
import { ORDERS } from '@/mocks/orders'
import type { OrderStatus } from '@/shared/types/order'
import { OrderStatusBadge } from '../components/OrderStatusBadge'
import { ProductImage } from '@/shared/components/product/ProductImage'
import { formatDate, formatVnd } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

/** Gom các trạng thái backend thành tab cho người dùng */
const TABS: { key: string; label: string; match: OrderStatus[] | null }[] = [
  { key: 'all', label: 'Tất cả', match: null },
  { key: 'pending', label: 'Chờ xác nhận', match: ['Pending'] },
  {
    key: 'shipping',
    label: 'Đang giao',
    match: ['Confirmed', 'Packed', 'Shipping'],
  },
  { key: 'done', label: 'Hoàn thành', match: ['Delivered', 'Completed'] },
  { key: 'cancelled', label: 'Đã hủy', match: ['Cancelled', 'Returned'] },
]

export function OrderListPage() {
  const [activeTab, setActiveTab] = useState('all')

  const activeMatch = TABS.find((tab) => tab.key === activeTab)?.match ?? null
  const orders = activeMatch
    ? ORDERS.filter((order) => activeMatch.includes(order.status))
    : ORDERS

  return (
    <section className="rounded-md border border-border bg-card">
      <header className="border-b border-border px-5 pt-4">
        <h1 className="text-[16px] font-bold text-heading">Đơn hàng của tôi</h1>

        <div className="-mx-5 mt-3 flex overflow-x-auto px-5">
          {TABS.map((tab) => {
            const count = tab.match
              ? ORDERS.filter((order) => tab.match!.includes(order.status))
                  .length
              : ORDERS.length

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'shrink-0 border-b-2 px-3.5 py-2.5 text-[13.5px] font-medium whitespace-nowrap transition-colors',
                  activeTab === tab.key
                    ? 'border-brand text-brand'
                    : 'border-transparent text-muted-foreground hover:text-body',
                )}
              >
                {tab.label}
                <span className="tnum ml-1.5 text-[12px]">({count})</span>
              </button>
            )
          })}
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-sunken text-navy-300">
            <Package className="size-7" />
          </span>
          <p className="mt-4 text-[14px] font-semibold text-heading">
            Không có đơn hàng nào
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Chưa có đơn hàng nào ở trạng thái này.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {orders.map((order) => (
            <li key={order.id} className="px-5 py-4">
              {/* Dòng đầu: mã đơn và trạng thái */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    to={`/tai-khoan/don-hang/${order.code}`}
                    className="tnum text-[14px] font-bold text-heading transition-colors hover:text-brand"
                  >
                    #{order.code}
                  </Link>
                  <span className="text-border">•</span>
                  <span className="tnum text-[12.5px] text-muted-foreground">
                    Đặt ngày {formatDate(order.placedAt)}
                  </span>
                </div>

                <OrderStatusBadge status={order.status} />
              </div>

              {/* Sản phẩm trong đơn */}
              <ul className="mt-3 space-y-2.5">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <Link
                      to={`/san-pham/${item.slug}`}
                      className="size-14 shrink-0 rounded-md bg-surface-sunken p-1"
                    >
                      <ProductImage src={item.image} alt={item.productName} />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/san-pham/${item.slug}`}
                        className="line-clamp-1 text-[13.5px] font-medium text-heading transition-colors hover:text-brand"
                      >
                        {item.productName}
                      </Link>
                      <p className="tnum mt-0.5 text-[12.5px] text-muted-foreground">
                        {item.variantLabel} · Số lượng {item.quantity}
                      </p>
                    </div>

                    <span className="tnum shrink-0 text-[13.5px] font-medium text-body">
                      {formatVnd(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Dòng cuối: tổng tiền và liên kết chi tiết */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-[13px] text-muted-foreground">
                  Tổng cộng{' '}
                  <span className="tnum text-[15px] font-bold text-price">
                    {formatVnd(order.total)}
                  </span>
                </span>

                <Link
                  to={`/tai-khoan/don-hang/${order.code}`}
                  className="flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-hover"
                >
                  Xem chi tiết
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
