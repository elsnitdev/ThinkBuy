import { TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from './utils'

/**
 * Điểm gọi thông báo duy nhất của dự án.
 *
 * Đừng import `toast` từ 'sonner' trong component — dùng `notify` để mọi
 * thông báo có chung kiểu dáng và để sau này đổi thư viện chỉ phải sửa file này.
 *
 *   notify.success('Đã lưu thay đổi')
 *   notify.error('Mã giảm giá không hợp lệ')
 *   if (await notify.confirm({ title: 'Xóa địa chỉ này?' })) { … }
 */

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Tô nút xác nhận màu cảnh báo — dùng cho thao tác xóa, không hoàn tác được */
  danger?: boolean
}

function show(
  kind: 'success' | 'error' | 'info' | 'warning',
  title: string,
  description?: string,
) {
  return toast[kind](title, { description })
}

/**
 * Hộp xác nhận dạng toast, chờ được bằng await.
 * Trả về true khi người dùng bấm xác nhận, false khi hủy hoặc đóng.
 */
function confirm({
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = false,
}: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    // Chốt để đóng bằng cách nào cũng chỉ trả lời đúng một lần
    let settled = false
    const finish = (answer: boolean, id?: string | number) => {
      if (settled) return
      settled = true
      if (id !== undefined) toast.dismiss(id)
      resolve(answer)
    }

    toast.custom(
      (id) => (
        <div className="flex w-full gap-3">
          <span
            className={cn(
              'mt-px flex size-[18px] shrink-0 items-center justify-center',
              danger ? 'text-sale' : 'text-star',
            )}
          >
            <TriangleAlert className="size-[18px]" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-snug font-semibold text-heading">
              {title}
            </p>
            {description && (
              <p className="mt-1 text-[12.5px] leading-snug text-soft">
                {description}
              </p>
            )}

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => finish(false, id)}
                className="rounded-md border border-line px-3 py-1.5 text-[12.5px] font-medium text-body transition-colors hover:bg-surface-sunken"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => finish(true, id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors',
                  danger
                    ? 'bg-sale hover:bg-sale-hover'
                    : 'bg-brand hover:bg-brand-hover',
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ),
      {
        // Không tự tắt: người dùng phải chọn một trong hai
        duration: Infinity,
        onDismiss: () => finish(false),
      },
    )
  })
}

export const notify = {
  success: (title: string, description?: string) =>
    show('success', title, description),
  error: (title: string, description?: string) =>
    show('error', title, description),
  info: (title: string, description?: string) =>
    show('info', title, description),
  warning: (title: string, description?: string) =>
    show('warning', title, description),

  confirm,

  /** Dùng cho thao tác có chờ mạng: tự đổi trạng thái theo kết quả Promise */
  promise: <T,>(
    task: Promise<T>,
    messages: { loading: string; success: string; error: string },
  ) => toast.promise(task, messages),

  dismiss: (id?: string | number) => toast.dismiss(id),
}
