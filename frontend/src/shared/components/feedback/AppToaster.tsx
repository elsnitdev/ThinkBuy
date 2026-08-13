import { CircleAlert, CircleCheck, CircleX, Info } from 'lucide-react'
import { Toaster } from 'sonner'

/**
 * Cấu hình thông báo dùng chung cho toàn site.
 * Đặt một chỗ duy nhất để mọi toast có cùng vị trí, thời lượng và kiểu dáng.
 * Đừng dựng <Toaster> ở nơi khác — gọi qua `notify` trong shared/lib/notify.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      duration={3500}
      gap={10}
      // Xếp chồng và giãn ra khi có nhiều thông báo cùng lúc
      expand
      visibleToasts={4}
      icons={{
        success: <CircleCheck className="size-[18px] text-success" />,
        error: <CircleX className="size-[18px] text-sale" />,
        warning: <CircleAlert className="size-[18px] text-star" />,
        info: <Info className="size-[18px] text-brand" />,
      }}
      toastOptions={{
        classNames: {
          // !w-full cần cho toast tùy biến (notify.confirm): sonner đánh dấu
          // chúng data-styled="false" nên không tự nhận chiều rộng mặc định,
          // thiếu dòng này hộp xác nhận sẽ hẹp hơn các toast còn lại.
          toast:
            'group !w-full !rounded-md !border !border-line !bg-surface-card !shadow-[0_8px_24px_-6px_rgb(13_22_54_/_0.18)] !gap-3 !p-4',
          title: '!text-[13.5px] !font-semibold !text-heading !leading-snug',
          description: '!text-[12.5px] !text-soft !leading-snug !mt-0.5',
          icon: '!m-0 !self-start !mt-px',
          closeButton:
            '!border-line !bg-surface-card !text-soft hover:!text-heading',
        },
      }}
    />
  )
}
