import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, Save } from 'lucide-react'
import { notify } from '@/shared/lib/notify'
import { CURRENT_USER } from '@/mocks/user'
import { Button } from '@/shared/components/ui/button'
import { formatDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(60, 'Họ tên không quá 60 ký tự'),
  phone: z
    .string()
    .trim()
    // Cho phép người dùng gõ có khoảng trắng, bỏ trước khi kiểm tra
    .refine(
      (value) => /^0\d{9}$/.test(value.replace(/\s/g, '')),
      'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0',
    ),
  gender: z.enum(['male', 'female', 'other']),
  birthDate: z
    .string()
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      'Ngày sinh không hợp lệ',
    )
    .refine(
      (value) => new Date(value) < new Date(),
      'Ngày sinh phải ở quá khứ',
    ),
})

type ProfileForm = z.infer<typeof profileSchema>

const GENDERS: { value: ProfileForm['gender']; label: string }[] = [
  { value: 'female', label: 'Nữ' },
  { value: 'male', label: 'Nam' },
  { value: 'other', label: 'Khác' },
]

export function ProfilePage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: CURRENT_USER.fullName,
      phone: CURRENT_USER.phone,
      gender: CURRENT_USER.gender,
      birthDate: CURRENT_USER.birthDate,
    },
  })

  async function onSubmit(values: ProfileForm) {
    // Chưa có backend — giả lập độ trễ mạng để thấy trạng thái đang gửi
    await new Promise((resolve) => setTimeout(resolve, 600))
    notify.success(
      'Đã lưu thông tin tài khoản',
      'Dữ liệu mới chỉ nằm trong bộ nhớ trình duyệt.',
    )
    reset(values)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-border bg-card">
        <header className="border-b border-border px-5 py-4">
          <h1 className="text-[16px] font-bold text-heading">
            Thông tin tài khoản
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Thành viên từ {formatDate(CURRENT_USER.createdAt)}
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ và tên" error={errors.fullName?.message}>
              <input
                {...register('fullName')}
                className={inputClass(!!errors.fullName)}
              />
            </Field>

            <Field label="Email" hint="Email đăng nhập không thể thay đổi">
              <input
                value={CURRENT_USER.email}
                readOnly
                className={cn(
                  inputClass(false),
                  'cursor-not-allowed bg-muted text-muted-foreground',
                )}
              />
            </Field>

            <Field label="Số điện thoại" error={errors.phone?.message}>
              <input
                {...register('phone')}
                inputMode="tel"
                className={cn(inputClass(!!errors.phone), 'tnum')}
              />
            </Field>

            <Field label="Ngày sinh" error={errors.birthDate?.message}>
              <input
                type="date"
                {...register('birthDate')}
                className={cn(inputClass(!!errors.birthDate), 'tnum')}
              />
            </Field>

            <Field label="Giới tính" className="sm:col-span-2">
              <div className="flex flex-wrap gap-4 pt-1">
                {GENDERS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 text-[13.5px] text-body"
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('gender')}
                      className="size-4 accent-brand"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              <Save className="size-4" />
              {isSubmitting ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>

            {isDirty && !isSubmitting && (
              <button
                type="button"
                onClick={() => reset()}
                className="text-[13px] font-medium text-muted-foreground hover:text-body"
              >
                Hoàn tác
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Đổi mật khẩu */}
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
              <KeyRound className="size-[18px]" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-heading">Mật khẩu</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Nên đổi mật khẩu định kỳ để giữ an toàn cho tài khoản.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => notify.info('Màn hình đổi mật khẩu chưa được dựng')}
          >
            Đổi mật khẩu
          </Button>
        </div>
      </section>
    </div>
  )
}

function inputClass(hasError: boolean) {
  return cn(
    'h-10 w-full rounded-md border px-3 text-[13.5px] text-body outline-none transition-colors',
    hasError
      ? 'border-sale focus:border-sale'
      : 'border-input focus:border-brand',
  )
}

function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string
  hint?: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[13px] font-medium text-heading">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] text-sale-text">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
