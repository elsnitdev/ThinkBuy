/**
 * Bám theo bảng cart_carts / cart_items.
 * Các trường tên, ảnh, giá là bản chụp để hiển thị — backend trả kèm khi
 * gọi GET /api/v1/cart, tránh phải gọi thêm API sản phẩm cho từng dòng.
 */
export interface CartItem {
  id: number
  productId: number
  variantId: number
  slug: string
  name: string
  image: string
  /** Nhãn cấu hình, ví dụ "16GB / 512GB" */
  variantLabel: string
  unitPrice: number
  compareAtPrice: number | null
  quantity: number
  /** Tồn kho của biến thể, dùng để chặn tăng quá số lượng còn lại */
  stock: number
  addedAt: string
}

export interface CartTotals {
  itemCount: number
  subtotal: number
  discount: number
  shippingFee: number
  total: number
}
