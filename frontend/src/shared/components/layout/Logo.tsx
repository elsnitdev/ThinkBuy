import { cn } from '@/shared/lib/utils'

interface LogoProps {
  className?: string
  /** Ẩn phần chữ, chỉ hiện dấu hiệu — dùng cho màn hình hẹp */
  markOnly?: boolean
}

/**
 * Dấu hiệu thương hiệu: ba lớp sóng biển xếp chồng trong khối vuông.
 * Dùng hình khối phẳng, không gradient.
 */
export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            d="M3 8c2.2 0 2.2 2 4.4 2S9.6 8 11.8 8s2.2 2 4.4 2S18.4 8 21 8"
            fill="none"
            stroke="#fff"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M3 13c2.2 0 2.2 2 4.4 2S9.6 13 11.8 13s2.2 2 4.4 2S18.4 13 21 13"
            fill="none"
            stroke="#fff"
            strokeWidth="2.1"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M3 18c2.2 0 2.2 2 4.4 2S9.6 18 11.8 18s2.2 2 4.4 2S18.4 18 21 18"
            fill="none"
            stroke="#fff"
            strokeWidth="2.1"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
      </span>

      {!markOnly && (
        <span className="text-[19px] leading-none font-bold tracking-tight text-white">
          Think<span className="text-on-dark-soft">Buy</span>
        </span>
      )}
    </span>
  )
}
