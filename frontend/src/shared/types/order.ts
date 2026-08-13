import type { Address } from './user'

/**
 * Vòng đời đơn hàng theo tài liệu nghiệp vụ:
 * Pending → Confirmed → Packed → Shipping → Delivered → Completed
 * cùng hai nhánh rẽ Cancelled và Returned.
 */
export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packed'
  | 'Shipping'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled'
  | 'Returned'

export type PaymentMethod = 'COD' | 'VNPay' | 'MoMo' | 'Card'
export type PaymentStatus = 'Unpaid' | 'Paid' | 'Refunded'

export interface OrderItem {
  id: number
  productId: number
  variantId: number
  slug: string
  /** Bản chụp tên lúc đặt — giá và tên sau này đổi thì đơn cũ vẫn đúng */
  productName: string
  variantLabel: string
  image: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

/** Một mốc trong ordering_order_status_history */
export interface OrderStatusEvent {
  status: OrderStatus
  note: string
  at: string
}

export interface Order {
  id: number
  code: string
  status: OrderStatus
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  shippingAddress: Address
  placedAt: string
  completedAt: string | null
  items: OrderItem[]
  history: OrderStatusEvent[]
}

/** Nhãn tiếng Việt và tông màu hiển thị cho từng trạng thái */
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: 'neutral' | 'progress' | 'success' | 'danger' }
> = {
  Pending: { label: 'Chờ xác nhận', tone: 'neutral' },
  Confirmed: { label: 'Đã xác nhận', tone: 'progress' },
  Packed: { label: 'Đang đóng gói', tone: 'progress' },
  Shipping: { label: 'Đang giao', tone: 'progress' },
  Delivered: { label: 'Đã giao', tone: 'success' },
  Completed: { label: 'Hoàn thành', tone: 'success' },
  Cancelled: { label: 'Đã hủy', tone: 'danger' },
  Returned: { label: 'Đã trả hàng', tone: 'danger' },
}

/** Các mốc của luồng thuận, dùng vẽ thanh tiến trình */
export const ORDER_FLOW: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Packed',
  'Shipping',
  'Delivered',
  'Completed',
]

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng',
  VNPay: 'Ví điện tử VNPay',
  MoMo: 'Ví điện tử MoMo',
  Card: 'Thẻ tín dụng / ghi nợ',
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  Unpaid: 'Chưa thanh toán',
  Paid: 'Đã thanh toán',
  Refunded: 'Đã hoàn tiền',
}
