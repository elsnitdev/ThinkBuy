import { Link } from 'react-router-dom'
import {
  CreditCard,
  Mail,
  MapPin,
  PhoneCall,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { Logo } from './Logo'

const COMMITMENTS = [
  {
    icon: Truck,
    title: 'Giao hàng toàn quốc',
    note: 'Miễn phí cho đơn từ 5 triệu',
  },
  {
    icon: ShieldCheck,
    title: 'Bảo hành chính hãng',
    note: 'Lên đến 24 tháng tại hãng',
  },
  {
    icon: RotateCcw,
    title: 'Đổi trả trong 7 ngày',
    note: '1 đổi 1 nếu lỗi nhà sản xuất',
  },
  {
    icon: CreditCard,
    title: 'Trả góp 0%',
    note: 'Qua thẻ tín dụng, kỳ hạn 3–12 tháng',
  },
]

const LINK_COLUMNS = [
  {
    heading: 'Chính sách',
    links: [
      { label: 'Chính sách đổi trả', to: '/chinh-sach/doi-tra' },
      { label: 'Chính sách bảo hành', to: '/chinh-sach/bao-hanh' },
      { label: 'Chính sách vận chuyển', to: '/chinh-sach/van-chuyen' },
      { label: 'Chính sách bảo mật', to: '/chinh-sach/bao-mat' },
    ],
  },
  {
    heading: 'Danh mục',
    links: [
      { label: 'Laptop Gaming', to: '/danh-muc/laptop-gaming' },
      { label: 'Laptop Văn phòng', to: '/danh-muc/laptop-van-phong' },
      { label: 'Laptop Đồ họa', to: '/danh-muc/laptop-do-hoa' },
      { label: 'Linh kiện & Phụ kiện', to: '/danh-muc/linh-kien' },
    ],
  },
  {
    heading: 'Hỗ trợ',
    links: [
      { label: 'Hướng dẫn mua hàng', to: '/ho-tro/mua-hang' },
      { label: 'Hướng dẫn trả góp', to: '/ho-tro/tra-gop' },
      { label: 'Tra cứu bảo hành', to: '/ho-tro/bao-hanh' },
      { label: 'Câu hỏi thường gặp', to: '/ho-tro/faq' },
    ],
  },
]

const PAYMENTS = ['Visa', 'Mastercard', 'JCB', 'MoMo', 'VNPay', 'COD']

export function Footer() {
  return (
    <footer className="mt-16">
      {/* Dải cam kết dịch vụ */}
      <div className="border-y border-border bg-card">
        <div className="shell grid grid-cols-2 gap-x-6 gap-y-5 py-7 lg:grid-cols-4">
          {COMMITMENTS.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-brand">
                <item.icon className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] leading-snug font-semibold text-heading">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {item.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thân footer */}
      <div className="bg-surface-darkest text-on-dark-soft">
        <div className="shell grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed">
              Nền tảng bán laptop và thiết bị công nghệ, cá nhân hóa trải nghiệm
              mua sắm bằng dữ liệu hành vi và trợ lý AI.
            </p>
            <div className="mt-5 flex gap-2">
              {['Fb', 'Zl', 'Yt', 'Ig'].map((network) => (
                <a
                  key={network}
                  href="#"
                  className="flex size-8 items-center justify-center rounded-md border border-line-dark text-xs font-semibold transition-colors hover:border-brand hover:text-white"
                >
                  {network}
                </a>
              ))}
            </div>
          </div>

          {LINK_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="mb-4 text-[13px] font-semibold tracking-wider text-white uppercase">
                {column.heading}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[13.5px] transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-4 text-[13px] font-semibold tracking-wider text-white uppercase">
              Liên hệ
            </h3>
            <ul className="space-y-3 text-[13.5px]">
              <li className="flex items-start gap-2.5">
                <PhoneCall className="mt-0.5 size-4 shrink-0 text-brand" />
                <span className="tnum">1900 6868 — nhánh 1</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>support@thinkbuy.vn</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>
                  123 Đường Công Nghệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Dải cuối */}
        <div className="border-t border-navy-900">
          <div className="shell flex flex-col gap-3 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p>
              © 2026 ThinkBuy — Đồ án học tập, không phải cửa hàng thương mại
              thật.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENTS.map((method) => (
                <span
                  key={method}
                  className="rounded border border-line-dark px-2 py-1 text-[11px] tracking-wide"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
