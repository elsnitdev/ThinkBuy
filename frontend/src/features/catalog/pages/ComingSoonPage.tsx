import { Link, useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

/** Trang giữ chỗ cho các đường dẫn đã có trong menu nhưng chưa dựng giao diện. */
export function ComingSoonPage() {
  const { pathname } = useLocation()

  return (
    <div className="shell flex flex-col items-center py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-lg bg-surface-sunken text-brand">
        <Construction className="size-7" />
      </span>
      <h1 className="mt-5 text-[22px] font-bold text-heading">
        Trang đang được xây dựng
      </h1>
      <p className="mt-2 max-w-md text-[14.5px] text-muted-foreground">
        Đường dẫn{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-[13px] text-body">
          {pathname}
        </code>{' '}
        chưa có giao diện. Hiện tại dự án mới dựng xong trang chủ và trang chi
        tiết sản phẩm.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Về trang chủ</Link>
      </Button>
    </div>
  )
}
