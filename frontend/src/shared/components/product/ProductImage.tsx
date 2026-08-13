import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ProductImageProps {
  src: string
  alt: string
  className?: string
  /** Ảnh đại diện trong màn hình đầu nên tải ngay, phần còn lại tải trễ */
  eager?: boolean
}

/**
 * Hiển thị ảnh sản phẩm. Dùng object-contain để không cắt mất thân máy —
 * ảnh sản phẩm khác ảnh bìa, cắt là hỏng.
 */
export function ProductImage({
  src,
  alt,
  className,
  eager = false,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center text-navy-300',
          className,
        )}
      >
        <ImageOff className="size-8" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-contain', className)}
    />
  )
}
