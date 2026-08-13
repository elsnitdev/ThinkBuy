/** DỮ LIỆU MẪU — thay bằng GET /api/v1/orders khi có backend */
import type { Order, OrderItem } from '@/shared/types/order'
import { PRODUCTS } from './products'
import { ADDRESSES } from './user'

function item(
  id: number,
  slug: string,
  variantIndex: number,
  quantity: number,
): OrderItem {
  const product = PRODUCTS.find((entry) => entry.slug === slug)
  if (!product) throw new Error(`Không tìm thấy sản phẩm mẫu: ${slug}`)
  const variant = product.variants[variantIndex]

  return {
    id,
    productId: product.id,
    variantId: variant.id,
    slug: product.slug,
    productName: product.name,
    variantLabel: variant.label,
    image: product.images[0],
    unitPrice: variant.price,
    quantity,
    lineTotal: variant.price * quantity,
  }
}

function sum(items: OrderItem[]): number {
  return items.reduce((total, entry) => total + entry.lineTotal, 0)
}

const order1Items = [item(1, 'macbook-air-m3-2024', 0, 1)]
const order2Items = [
  item(2, 'asus-vivobook-pro-15-oled', 0, 1),
  item(3, 'msi-modern-14-c13m', 0, 1),
]
const order3Items = [item(4, 'acer-aspire-7-a715', 0, 1)]
const order4Items = [item(5, 'hp-omen-16-2024', 0, 1)]
const order5Items = [item(6, 'lenovo-ideapad-slim-5-14', 0, 1)]

export const ORDERS: Order[] = [
  {
    id: 5,
    code: 'TB26072401',
    status: 'Shipping',
    subtotal: sum(order1Items),
    discount: 0,
    shippingFee: 0,
    total: sum(order1Items),
    paymentMethod: 'VNPay',
    paymentStatus: 'Paid',
    shippingAddress: ADDRESSES[0],
    placedAt: '2026-07-24T10:32:00Z',
    completedAt: null,
    items: order1Items,
    history: [
      {
        status: 'Pending',
        note: 'Đơn hàng được tạo',
        at: '2026-07-24T10:32:00Z',
      },
      {
        status: 'Confirmed',
        note: 'Đã xác nhận thanh toán qua VNPay',
        at: '2026-07-24T10:35:00Z',
      },
      {
        status: 'Packed',
        note: 'Đã đóng gói tại kho Quận 7',
        at: '2026-07-24T15:10:00Z',
      },
      {
        status: 'Shipping',
        note: 'Bàn giao cho đơn vị vận chuyển, mã vận đơn GHN9284517',
        at: '2026-07-25T08:00:00Z',
      },
    ],
  },
  {
    id: 4,
    code: 'TB26071902',
    status: 'Pending',
    subtotal: sum(order2Items),
    discount: 500000,
    shippingFee: 0,
    total: sum(order2Items) - 500000,
    paymentMethod: 'COD',
    paymentStatus: 'Unpaid',
    shippingAddress: ADDRESSES[1],
    placedAt: '2026-07-19T20:14:00Z',
    completedAt: null,
    items: order2Items,
    history: [
      {
        status: 'Pending',
        note: 'Đơn hàng được tạo',
        at: '2026-07-19T20:14:00Z',
      },
    ],
  },
  {
    id: 3,
    code: 'TB26061503',
    status: 'Completed',
    subtotal: sum(order3Items),
    discount: 0,
    shippingFee: 45000,
    total: sum(order3Items) + 45000,
    paymentMethod: 'COD',
    paymentStatus: 'Paid',
    shippingAddress: ADDRESSES[0],
    placedAt: '2026-06-15T11:02:00Z',
    completedAt: '2026-06-19T09:40:00Z',
    items: order3Items,
    history: [
      {
        status: 'Pending',
        note: 'Đơn hàng được tạo',
        at: '2026-06-15T11:02:00Z',
      },
      {
        status: 'Confirmed',
        note: 'Nhân viên đã gọi xác nhận',
        at: '2026-06-15T13:20:00Z',
      },
      {
        status: 'Packed',
        note: 'Đã đóng gói tại kho Quận 7',
        at: '2026-06-16T08:15:00Z',
      },
      {
        status: 'Shipping',
        note: 'Mã vận đơn GHN8871203',
        at: '2026-06-17T07:30:00Z',
      },
      {
        status: 'Delivered',
        note: 'Giao thành công',
        at: '2026-06-19T09:40:00Z',
      },
      {
        status: 'Completed',
        note: 'Đơn hàng hoàn tất',
        at: '2026-06-19T09:40:00Z',
      },
    ],
  },
  {
    id: 2,
    code: 'TB26050704',
    status: 'Cancelled',
    subtotal: sum(order4Items),
    discount: 0,
    shippingFee: 0,
    total: sum(order4Items),
    paymentMethod: 'Card',
    paymentStatus: 'Refunded',
    shippingAddress: ADDRESSES[0],
    placedAt: '2026-05-07T16:45:00Z',
    completedAt: null,
    items: order4Items,
    history: [
      {
        status: 'Pending',
        note: 'Đơn hàng được tạo',
        at: '2026-05-07T16:45:00Z',
      },
      {
        status: 'Confirmed',
        note: 'Đã thanh toán bằng thẻ',
        at: '2026-05-07T16:47:00Z',
      },
      {
        status: 'Cancelled',
        note: 'Khách hủy đơn — đã hoàn tiền về thẻ trong 3 ngày làm việc',
        at: '2026-05-08T09:12:00Z',
      },
    ],
  },
  {
    id: 1,
    code: 'TB26031205',
    status: 'Completed',
    subtotal: sum(order5Items),
    discount: 0,
    shippingFee: 45000,
    total: sum(order5Items) + 45000,
    paymentMethod: 'MoMo',
    paymentStatus: 'Paid',
    shippingAddress: ADDRESSES[2],
    placedAt: '2026-03-12T08:20:00Z',
    completedAt: '2026-03-15T14:05:00Z',
    items: order5Items,
    history: [
      {
        status: 'Pending',
        note: 'Đơn hàng được tạo',
        at: '2026-03-12T08:20:00Z',
      },
      {
        status: 'Confirmed',
        note: 'Đã thanh toán qua MoMo',
        at: '2026-03-12T08:22:00Z',
      },
      {
        status: 'Packed',
        note: 'Đã đóng gói tại kho Biên Hòa',
        at: '2026-03-13T09:00:00Z',
      },
      {
        status: 'Shipping',
        note: 'Mã vận đơn GHTK5520918',
        at: '2026-03-14T06:50:00Z',
      },
      {
        status: 'Delivered',
        note: 'Giao thành công',
        at: '2026-03-15T14:05:00Z',
      },
      {
        status: 'Completed',
        note: 'Đơn hàng hoàn tất',
        at: '2026-03-15T14:05:00Z',
      },
    ],
  },
]

export function getOrderByCode(code: string): Order | undefined {
  return ORDERS.find((order) => order.code === code)
}
