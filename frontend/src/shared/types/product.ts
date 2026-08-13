/**
 * Kiểu dữ liệu sản phẩm — bám theo schema catalog_* trong tài liệu kiến trúc
 * (catalog_products / catalog_product_variants / catalog_product_specs).
 * Khi nối API thật, chỉ cần đổi nguồn dữ liệu, không phải sửa component.
 */

export type ProductBadge = 'sale' | 'new' | 'hot'

/** Nhóm thông số để dựng bảng "Thông số kỹ thuật" theo từng khối */
export type SpecGroup =
  | 'Bộ xử lý & Đồ họa'
  | 'Bộ nhớ & Lưu trữ'
  | 'Màn hình'
  | 'Kết nối & Cổng'
  | 'Thiết kế & Pin'
  | 'Hệ điều hành & Bảo hành'

export interface ProductSpec {
  key: string
  label: string
  value: string
  group: SpecGroup
}

/** Thông số rút gọn hiển thị ngay trên card sản phẩm */
export interface KeySpecs {
  cpu: string
  ram: string
  storage: string
  gpu: string
  screen: string
}

export interface ProductVariant {
  id: number
  sku: string
  /** Nhãn hiển thị, ví dụ "16GB / 512GB" */
  label: string
  price: number
  compareAtPrice: number | null
  /** Số lượng còn trong kho */
  stock: number
}

export interface ProductReview {
  id: number
  author: string
  rating: number
  title: string
  content: string
  createdAt: string
  /** Đã xác minh mua hàng */
  verified: boolean
}

export interface Product {
  id: number
  slug: string
  name: string
  brand: string
  category: string
  categorySlug: string
  /** Nhu cầu sử dụng: Gaming, Văn phòng, Đồ họa… */
  useCase: string

  price: number
  compareAtPrice: number | null

  rating: number
  reviewCount: number
  soldCount: number

  badges: ProductBadge[]
  stock: number

  /**
   * Đường dẫn ảnh, ảnh đầu tiên là ảnh đại diện.
   * Tương ứng bảng catalog_product_images — khi có ảnh thật từ backend
   * chỉ cần đổi giá trị, không phải sửa component.
   */
  images: string[]

  shortDescription: string
  highlights: string[]
  keySpecs: KeySpecs
  specs: ProductSpec[]
  variants: ProductVariant[]
  reviews: ProductReview[]
  createdAt: string
}

/** Bản rút gọn dùng cho lưới sản phẩm — khớp ProductListItemDto phía backend */
export type ProductListItem = Pick<
  Product,
  | 'id'
  | 'slug'
  | 'name'
  | 'brand'
  | 'useCase'
  | 'price'
  | 'compareAtPrice'
  | 'rating'
  | 'reviewCount'
  | 'soldCount'
  | 'badges'
  | 'stock'
  | 'images'
  | 'keySpecs'
>
