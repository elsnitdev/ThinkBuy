import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { notify } from '@/shared/lib/notify'
import { computeTotals, useCartStore } from '@/shared/store/cartStore'
import { FREE_SHIPPING_THRESHOLD } from '@/mocks/cart'
import { ProductImage } from '@/shared/components/product/ProductImage'
import { Button } from '@/shared/components/ui/button'
import { discountPercent, formatVnd } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

export function CartPage() {
  const items = useCartStore((state) => state.items)
  const selectedIds = useCartStore((state) => state.selectedIds)
  const couponCode = useCartStore((state) => state.couponCode)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const removeSelected = useCartStore((state) => state.removeSelected)
  const toggleSelect = useCartStore((state) => state.toggleSelect)
  const toggleSelectAll = useCartStore((state) => state.toggleSelectAll)
  const applyCoupon = useCartStore((state) => state.applyCoupon)
  const clearCoupon = useCartStore((state) => state.clearCoupon)

  // Tính ngoài selector để tránh tạo object mới mỗi lần store phát tín hiệu
  const totals = useMemo(
    () => computeTotals(items, selectedIds, couponCode),
    [items, selectedIds, couponCode],
  )
  const [couponInput, setCouponInput] = useState('')

  const allSelected = items.length > 0 && selectedIds.length === items.length
  const missingForFreeShip = FREE_SHIPPING_THRESHOLD - totals.subtotal

  function handleApplyCoupon() {
    const result = applyCoupon(couponInput)
    if (result.ok) {
      notify.success('Đã áp dụng mã giảm giá', result.message)
      setCouponInput('')
    } else {
      notify.error(result.message)
    }
  }

  if (items.length === 0) {
    return (
      <div className="shell py-20 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-surface-sunken text-navy-300">
          <ShoppingCart className="size-8" />
        </span>
        <h1 className="mt-5 text-[22px] font-bold text-heading">
          Giỏ hàng đang trống
        </h1>
        <p className="mt-2 text-[14.5px] text-muted-foreground">
          Bạn chưa chọn sản phẩm nào. Ghé xem những mẫu laptop đang bán chạy
          nhé.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">
            Bắt đầu mua sắm
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="shell py-5">
      <h1 className="text-[20px] font-bold text-heading">
        Giỏ hàng
        <span className="tnum ml-2 text-[15px] font-normal text-muted-foreground">
          ({items.length} sản phẩm)
        </span>
      </h1>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ===== Danh sách sản phẩm ===== */}
        <div className="space-y-3">
          {/* Thanh chọn hàng loạt */}
          <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] font-medium text-body">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="size-4 accent-brand"
              />
              Chọn tất cả ({items.length})
            </label>

            <button
              type="button"
              onClick={async () => {
                const count = selectedIds.length
                const agreed = await notify.confirm({
                  title: `Xóa ${count} sản phẩm khỏi giỏ hàng?`,
                  description: 'Thao tác này không thể hoàn tác.',
                  confirmLabel: 'Xóa',
                  danger: true,
                })
                if (!agreed) return
                removeSelected()
                notify.success(`Đã xóa ${count} sản phẩm khỏi giỏ hàng`)
              }}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-sale-text disabled:pointer-events-none disabled:opacity-40"
            >
              <Trash2 className="size-4" />
              Xóa đã chọn
            </button>
          </div>

          {items.map((item) => {
            const selected = selectedIds.includes(item.id)
            const lineTotal = item.unitPrice * item.quantity
            const discount = discountPercent(
              item.unitPrice,
              item.compareAtPrice,
            )

            return (
              <article
                key={item.id}
                className={cn(
                  'rounded-md border bg-card p-3.5 transition-colors sm:p-4',
                  selected ? 'border-brand-line' : 'border-border',
                )}
              >
                <div className="flex gap-3 sm:gap-4">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSelect(item.id)}
                    aria-label={`Chọn ${item.name}`}
                    className="mt-1 size-4 shrink-0 accent-brand"
                  />

                  <Link
                    to={`/san-pham/${item.slug}`}
                    className="size-20 shrink-0 rounded-md bg-surface-sunken p-1.5 sm:size-24"
                  >
                    <ProductImage src={item.image} alt={item.name} eager />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={`/san-pham/${item.slug}`}
                          className="line-clamp-2 text-[14px] leading-snug font-semibold text-heading transition-colors hover:text-brand"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 text-[12.5px] text-muted-foreground">
                          Cấu hình:{' '}
                          <span className="font-medium text-body">
                            {item.variantLabel}
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          removeItem(item.id)
                          notify.success('Đã xóa khỏi giỏ hàng', item.name)
                        }}
                        aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
                        className="shrink-0 rounded-md p-1.5 text-navy-300 transition-colors hover:bg-surface-sunken hover:text-sale-text"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                      {/* Bộ đếm số lượng */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 items-center rounded-md border border-border">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            aria-label="Giảm số lượng"
                            className="flex size-9 items-center justify-center text-muted-foreground disabled:opacity-40"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="tnum w-9 text-center text-[13.5px] font-semibold text-heading">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(item.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stock}
                            aria-label="Tăng số lượng"
                            className="flex size-9 items-center justify-center text-muted-foreground disabled:opacity-40"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>

                        {item.quantity >= item.stock && (
                          <span className="tnum text-[12px] text-sale-text">
                            Chỉ còn {item.stock} máy
                          </span>
                        )}
                      </div>

                      {/* Giá */}
                      <div className="text-right">
                        <p className="tnum text-[16px] leading-none font-bold text-price">
                          {formatVnd(lineTotal)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="tnum mt-1 text-[12px] text-muted-foreground">
                            {formatVnd(item.unitPrice)} × {item.quantity}
                          </p>
                        )}
                        {discount > 0 && item.quantity === 1 && (
                          <p className="tnum mt-1 text-[12px] text-muted-foreground line-through">
                            {formatVnd(item.compareAtPrice!)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {/* ===== Cột tóm tắt ===== */}
        <aside className="space-y-3 lg:sticky lg:top-28 lg:self-start">
          {/* Mã giảm giá */}
          <div className="rounded-md border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-[13.5px] font-semibold text-heading">
              <Tag className="size-4 text-brand" />
              Mã giảm giá
            </p>

            {couponCode ? (
              <div className="mt-3 flex items-center justify-between rounded-md bg-brand-soft px-3 py-2.5">
                <span className="text-[13px] font-semibold text-brand">
                  {couponCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearCoupon()
                    notify.success('Đã gỡ mã giảm giá')
                  }}
                  className="text-[12.5px] font-medium text-muted-foreground hover:text-sale-text"
                >
                  Gỡ mã
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  value={couponInput}
                  onChange={(event) => setCouponInput(event.target.value)}
                  onKeyDown={(event) =>
                    event.key === 'Enter' && handleApplyCoupon()
                  }
                  placeholder="Nhập mã"
                  className="h-9 min-w-0 flex-1 rounded-md border border-input px-3 text-[13px] uppercase outline-none focus:border-brand"
                />
                <Button size="sm" className="h-9" onClick={handleApplyCoupon}>
                  Áp dụng
                </Button>
              </div>
            )}

            <p className="mt-2.5 text-[11.5px] leading-snug text-muted-foreground">
              Mã thử nghiệm:{' '}
              <code className="rounded bg-muted px-1 py-0.5">THINKBUY500</code>{' '}
              hoặc{' '}
              <code className="rounded bg-muted px-1 py-0.5">SINHVIEN5</code>
            </p>
          </div>

          {/* Tổng tiền */}
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-[13.5px] font-semibold text-heading">
              Tóm tắt đơn hàng
            </p>

            <dl className="mt-3 space-y-2.5 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Tạm tính
                  <span className="tnum ml-1">({totals.itemCount} máy)</span>
                </dt>
                <dd className="tnum font-medium text-body">
                  {formatVnd(totals.subtotal)}
                </dd>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Giảm giá</dt>
                  <dd className="tnum font-medium text-sale-text">
                    −{formatVnd(totals.discount)}
                  </dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phí vận chuyển</dt>
                <dd className="tnum font-medium text-body">
                  {totals.shippingFee === 0
                    ? 'Miễn phí'
                    : formatVnd(totals.shippingFee)}
                </dd>
              </div>
            </dl>

            {missingForFreeShip > 0 && totals.subtotal > 0 && (
              <p className="tnum mt-3 flex items-start gap-2 rounded-md bg-surface-sunken px-3 py-2.5 text-[12px] leading-snug text-body">
                <Truck className="mt-0.5 size-3.5 shrink-0 text-brand" />
                Mua thêm {formatVnd(missingForFreeShip)} để được miễn phí vận
                chuyển
              </p>
            )}

            <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-[14px] font-semibold text-heading">
                Tổng cộng
              </span>
              <span className="tnum text-[20px] leading-none font-bold text-price">
                {formatVnd(totals.total)}
              </span>
            </div>

            <Button
              size="lg"
              className="mt-4 w-full"
              disabled={selectedIds.length === 0}
              onClick={() =>
                notify.info(
                  'Trang thanh toán chưa được dựng',
                  'Bước tiếp theo của dự án là màn hình đặt hàng và thanh toán.',
                )
              }
            >
              Tiến hành đặt hàng
              {selectedIds.length > 0 && ` (${selectedIds.length})`}
            </Button>

            {selectedIds.length === 0 && (
              <p className="mt-2 text-center text-[12px] text-muted-foreground">
                Chọn ít nhất một sản phẩm để đặt hàng
              </p>
            )}
          </div>

          {/* Cam kết */}
          <ul className="space-y-2.5 rounded-md border border-border bg-card p-4">
            {[
              { icon: ShieldCheck, text: 'Bảo hành chính hãng đến 24 tháng' },
              { icon: Truck, text: 'Giao hàng toàn quốc 2–4 ngày làm việc' },
            ].map((policy) => (
              <li
                key={policy.text}
                className="flex items-start gap-2.5 text-[12.5px] leading-snug text-body"
              >
                <policy.icon className="mt-0.5 size-4 shrink-0 text-brand" />
                {policy.text}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
