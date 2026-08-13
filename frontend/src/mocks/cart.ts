/** DỮ LIỆU MẪU — thay bằng GET /api/v1/cart khi có backend */
import type { CartItem } from '@/shared/types/cart'
import { PRODUCTS } from './products'

/** Dựng dòng giỏ hàng từ sản phẩm + chỉ số biến thể, tránh chép tay giá và tên */
function line(
  id: number,
  slug: string,
  variantIndex: number,
  quantity: number,
  addedAt: string,
): CartItem {
  const product = PRODUCTS.find((item) => item.slug === slug)
  if (!product) throw new Error(`Không tìm thấy sản phẩm mẫu: ${slug}`)
  const variant = product.variants[variantIndex]

  return {
    id,
    productId: product.id,
    variantId: variant.id,
    slug: product.slug,
    name: product.name,
    image: product.images[0],
    variantLabel: variant.label,
    unitPrice: variant.price,
    compareAtPrice: variant.compareAtPrice,
    quantity,
    stock: variant.stock,
    addedAt,
  }
}

export const INITIAL_CART_ITEMS: CartItem[] = [
  line(1, 'lenovo-legion-5-pro-2024', 0, 1, '2026-07-25T14:20:00Z'),
  line(2, 'lenovo-thinkbook-14-g6', 1, 2, '2026-07-24T09:05:00Z'),
  line(3, 'asus-zenbook-14-oled-ux3405', 0, 1, '2026-07-22T18:41:00Z'),
]

/** Mã giảm giá mẫu để thử luồng áp mã */
export const COUPONS: Record<string, { label: string; amount: number }> = {
  THINKBUY500: { label: 'Giảm 500.000₫ cho đơn từ 10 triệu', amount: 500000 },
  SINHVIEN5: { label: 'Ưu đãi sinh viên — giảm 1.000.000₫', amount: 1000000 },
}

/** Miễn phí vận chuyển từ mốc này trở lên */
export const FREE_SHIPPING_THRESHOLD = 5000000
export const SHIPPING_FEE = 45000
