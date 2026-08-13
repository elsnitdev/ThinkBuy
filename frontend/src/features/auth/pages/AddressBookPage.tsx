import { useState } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { notify } from '@/shared/lib/notify'
import { ADDRESSES } from '@/mocks/user'
import { formatAddress, type Address } from '@/shared/types/user'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

export function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>(ADDRESSES)

  function setDefault(id: number) {
    setAddresses((list) =>
      list.map((address) => ({ ...address, isDefault: address.id === id })),
    )
    notify.success('Đã đặt làm địa chỉ mặc định')
  }

  async function remove(address: Address) {
    if (address.isDefault) {
      notify.error(
        'Không thể xóa địa chỉ mặc định',
        'Hãy đặt một địa chỉ khác làm mặc định trước.',
      )
      return
    }

    const agreed = await notify.confirm({
      title: `Xóa địa chỉ "${address.label}"?`,
      description: formatAddress(address),
      confirmLabel: 'Xóa địa chỉ',
      danger: true,
    })
    if (!agreed) return

    setAddresses((list) => list.filter((entry) => entry.id !== address.id))
    notify.success('Đã xóa địa chỉ', address.label)
  }

  return (
    <section className="rounded-md border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h1 className="text-[16px] font-bold text-heading">Sổ địa chỉ</h1>
          <p className="tnum mt-1 text-[13px] text-muted-foreground">
            {addresses.length} địa chỉ đã lưu
          </p>
        </div>

        <Button
          onClick={() => notify.info('Biểu mẫu thêm địa chỉ chưa được dựng')}
        >
          <Plus className="size-4" />
          Thêm địa chỉ
        </Button>
      </header>

      {addresses.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-sunken text-navy-300">
            <MapPin className="size-7" />
          </span>
          <p className="mt-4 text-[14px] font-semibold text-heading">
            Chưa có địa chỉ nào
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Thêm địa chỉ để đặt hàng nhanh hơn ở lần mua sau.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-wrap items-start gap-4 px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold text-heading">
                    {address.receiver}
                  </span>
                  <span className="text-border">|</span>
                  <span className="tnum text-[13.5px] text-body">
                    {address.phone}
                  </span>

                  <span
                    className={cn(
                      'rounded-sm px-1.5 py-0.5 text-[11px] leading-none font-semibold',
                      address.isDefault
                        ? 'bg-brand-soft text-brand'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {address.isDefault ? 'Mặc định' : address.label}
                  </span>
                </div>

                <p className="mt-1.5 text-[13.5px] leading-snug text-body">
                  {formatAddress(address)}
                </p>

                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefault(address.id)}
                    className="mt-2 text-[12.5px] font-medium text-brand hover:text-brand-hover"
                  >
                    Đặt làm mặc định
                  </button>
                )}
              </div>

              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() =>
                    notify.info('Biểu mẫu sửa địa chỉ chưa được dựng')
                  }
                  aria-label={`Sửa địa chỉ ${address.label}`}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-brand"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(address)}
                  aria-label={`Xóa địa chỉ ${address.label}`}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-sale-text"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
