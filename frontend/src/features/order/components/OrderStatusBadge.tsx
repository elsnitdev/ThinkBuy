import { ORDER_STATUS_META, type OrderStatus } from '@/shared/types/order'
import { cn } from '@/shared/lib/utils'

const TONE_CLASS = {
  neutral: 'bg-muted text-body',
  progress: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  danger: 'bg-sale-soft text-sale-text',
} as const

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus
  className?: string
}) {
  const meta = ORDER_STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-1 text-[11.5px] leading-none font-semibold',
        TONE_CLASS[meta.tone],
        className,
      )}
    >
      {meta.label}
    </span>
  )
}
