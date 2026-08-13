import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, CreditCard, MapPin, Package } from 'lucide-react'
import { notify } from '@/shared/lib/notify'
import { getOrderByCode } from '@/mocks/orders'
import {
  ORDER_FLOW,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
} from '@/shared/types/order'
import { formatAddress } from '@/shared/types/user'
import { OrderStatusBadge } from '../components/OrderStatusBadge'
import { ProductImage } from '@/shared/components/product/ProductImage'
import { Button } from '@/shared/components/ui/button'
import { formatVnd } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

/** Ngày giờ đầy đủ — chi tiết đơn cần cả giờ, không chỉ ngày */
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OrderDetailPage() {
  const { code } = useParams<{ code: string }>()
  const order = code ? getOrderByCode(code) : undefined

  if (!order) {
    return (
      <section className="rounded-md border border-border bg-card px-5 py-16 text-center">
        <h1 className="text-[16px] font-bold text-heading">
          Không tìm thấy đơn hàng
        </h1>
        <p className="mt-2 text-[13.5px] text-muted-foreground">
          Mã đơn <span className="tnum">{code}</span> không tồn tại.
        </p>
        <Button asChild className="mt-5">
          <Link to="/tai-khoan/don-hang">Về danh sách đơn hàng</Link>
        </Button>
      </section>
    )
  }

  const isAborted = order.status === 'Cancelled' || order.status === 'Returned'
  const currentStep = ORDER_FLOW.indexOf(order.status)
  const canCancel = order.status === 'Pending'

  return (
    <div className="space-y-4">
      {/* ===== Đầu trang ===== */}
      <section className="rounded-md border border-border bg-card p-5">
        <Link
          to="/tai-khoan/don-hang"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-brand"
        >
          <ArrowLeft className="size-3.5" />
          Danh sách đơn hàng
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="tnum text-[18px] font-bold text-heading">
              Đơn hàng #{order.code}
            </h1>
            <p className="tnum mt-1 text-[13px] text-muted-foreground">
              Đặt lúc {formatDateTime(order.placedAt)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const agreed = await notify.confirm({
                    title: `Hủy đơn hàng #${order.code}?`,
                    description:
                      'Đơn đã hủy không thể khôi phục. Nếu đã thanh toán, tiền sẽ được hoàn trong 3 ngày làm việc.',
                    confirmLabel: 'Hủy đơn',
                    cancelLabel: 'Giữ đơn',
                    danger: true,
                  })
                  if (!agreed) return
                  notify.info(
                    'Chức năng hủy đơn chưa nối với backend',
                    'Sẽ gọi POST /api/v1/orders/{code}/cancel.',
                  )
                }}
              >
                Hủy đơn
              </Button>
            )}
          </div>
        </div>

        {/* Thanh tiến trình — chỉ vẽ cho đơn đi theo luồng thuận */}
        {!isAborted && (
          <ol className="mt-6 flex">
            {ORDER_FLOW.map((step, index) => {
              const done = index <= currentStep
              const isLast = index === ORDER_FLOW.length - 1

              return (
                <li
                  key={step}
                  className={cn('relative flex-1', !isLast && 'pr-1')}
                >
                  <div className="flex items-center">
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors',
                        done
                          ? 'border-brand bg-brand text-on-brand'
                          : 'border-border bg-card text-muted-foreground',
                      )}
                    >
                      {done ? <Check className="size-3.5" /> : index + 1}
                    </span>
                    {!isLast && (
                      <span
                        className={cn(
                          'ml-1 h-0.5 flex-1',
                          index < currentStep ? 'bg-brand' : 'bg-border',
                        )}
                      />
                    )}
                  </div>
                  <p
                    className={cn(
                      'mt-2 pr-2 text-[11.5px] leading-tight',
                      done
                        ? 'font-semibold text-heading'
                        : 'text-muted-foreground',
                    )}
                  >
                    {ORDER_STATUS_META[step].label}
                  </p>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {/* ===== Nhật ký trạng thái ===== */}
      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-[14px] font-bold text-heading">Lịch sử đơn hàng</h2>

        <ol className="mt-4 space-y-0">
          {[...order.history].reverse().map((event, index) => (
            <li key={event.at + event.status} className="flex gap-3">
              {/* Cột mốc và đường nối */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'mt-1 size-2.5 shrink-0 rounded-full',
                    index === 0 ? 'bg-brand' : 'bg-border',
                  )}
                />
                {index < order.history.length - 1 && (
                  <span className="w-0.5 flex-1 bg-border" />
                )}
              </div>

              <div
                className={cn('min-w-0 flex-1', index > 0 ? 'pb-4' : 'pb-4')}
              >
                <p
                  className={cn(
                    'text-[13.5px] font-semibold',
                    index === 0 ? 'text-heading' : 'text-body',
                  )}
                >
                  {ORDER_STATUS_META[event.status].label}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                  {event.note}
                </p>
                <p className="tnum mt-1 text-[12px] text-muted-foreground">
                  {formatDateTime(event.at)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ===== Sản phẩm ===== */}
      <section className="rounded-md border border-border bg-card">
        <h2 className="flex items-center gap-2 border-b border-border px-5 py-4 text-[14px] font-bold text-heading">
          <Package className="size-4 text-brand" />
          Sản phẩm ({order.items.length})
        </h2>

        <ul className="divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
              <Link
                to={`/san-pham/${item.slug}`}
                className="size-16 shrink-0 rounded-md bg-surface-sunken p-1.5"
              >
                <ProductImage src={item.image} alt={item.productName} />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/san-pham/${item.slug}`}
                  className="line-clamp-2 text-[13.5px] leading-snug font-medium text-heading transition-colors hover:text-brand"
                >
                  {item.productName}
                </Link>
                <p className="tnum mt-1 text-[12.5px] text-muted-foreground">
                  {item.variantLabel} · {formatVnd(item.unitPrice)} ×{' '}
                  {item.quantity}
                </p>
              </div>

              <span className="tnum shrink-0 text-[14px] font-semibold text-body">
                {formatVnd(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>

        {/* Bảng tiền */}
        <dl className="space-y-2 border-t border-border px-5 py-4 text-[13.5px]">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tạm tính</dt>
            <dd className="tnum text-body">{formatVnd(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Giảm giá</dt>
              <dd className="tnum text-sale-text">
                −{formatVnd(order.discount)}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Phí vận chuyển</dt>
            <dd className="tnum text-body">
              {order.shippingFee === 0
                ? 'Miễn phí'
                : formatVnd(order.shippingFee)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-border pt-2.5">
            <dt className="text-[14px] font-semibold text-heading">
              Tổng cộng
            </dt>
            <dd className="tnum text-[18px] font-bold text-price">
              {formatVnd(order.total)}
            </dd>
          </div>
        </dl>
      </section>

      {/* ===== Giao hàng và thanh toán ===== */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-heading">
            <MapPin className="size-4 text-brand" />
            Địa chỉ nhận hàng
          </h2>
          <p className="mt-3 text-[13.5px] font-semibold text-heading">
            {order.shippingAddress.receiver}
          </p>
          <p className="tnum mt-0.5 text-[13px] text-body">
            {order.shippingAddress.phone}
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
            {formatAddress(order.shippingAddress)}
          </p>
        </section>

        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-heading">
            <CreditCard className="size-4 text-brand" />
            Thanh toán
          </h2>
          <dl className="mt-3 space-y-2 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Phương thức</dt>
              <dd className="text-right font-medium text-body">
                {PAYMENT_METHOD_LABEL[order.paymentMethod]}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Trạng thái</dt>
              <dd
                className={cn(
                  'text-right font-semibold',
                  order.paymentStatus === 'Paid'
                    ? 'text-success'
                    : order.paymentStatus === 'Refunded'
                      ? 'text-sale-text'
                      : 'text-body',
                )}
              >
                {PAYMENT_STATUS_LABEL[order.paymentStatus]}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
