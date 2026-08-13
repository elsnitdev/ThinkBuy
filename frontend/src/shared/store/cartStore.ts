import { create } from 'zustand'
import type { CartItem, CartTotals } from '@/shared/types/cart'
import {
  COUPONS,
  FREE_SHIPPING_THRESHOLD,
  INITIAL_CART_ITEMS,
  SHIPPING_FEE,
} from '@/mocks/cart'

interface CartState {
  items: CartItem[]
  /** Id các dòng đang được tick — chỉ những dòng này mới vào đơn */
  selectedIds: number[]
  couponCode: string | null

  setQuantity: (id: number, quantity: number) => void
  removeItem: (id: number) => void
  removeSelected: () => void
  toggleSelect: (id: number) => void
  toggleSelectAll: () => void
  applyCoupon: (code: string) => { ok: boolean; message: string }
  clearCoupon: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  // Khởi tạo từ dữ liệu mẫu — sau này thay bằng dữ liệu từ GET /api/v1/cart
  items: INITIAL_CART_ITEMS,
  selectedIds: INITIAL_CART_ITEMS.map((item) => item.id),
  couponCode: null,

  setQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? // Chặn ở hai đầu: tối thiểu 1, tối đa bằng tồn kho
            { ...item, quantity: Math.max(1, Math.min(item.stock, quantity)) }
          : item,
      ),
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      selectedIds: state.selectedIds.filter((selected) => selected !== id),
    })),

  removeSelected: () =>
    set((state) => ({
      items: state.items.filter((item) => !state.selectedIds.includes(item.id)),
      selectedIds: [],
    })),

  toggleSelect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((selected) => selected !== id)
        : [...state.selectedIds, id],
    })),

  toggleSelectAll: () =>
    set((state) => ({
      selectedIds:
        state.selectedIds.length === state.items.length
          ? []
          : state.items.map((item) => item.id),
    })),

  applyCoupon: (code) => {
    const normalized = code.trim().toUpperCase()
    if (!normalized) return { ok: false, message: 'Chưa nhập mã giảm giá' }

    const coupon = COUPONS[normalized]
    if (!coupon) return { ok: false, message: 'Mã giảm giá không hợp lệ' }

    const state = get()
    const { subtotal } = computeTotals(state.items, state.selectedIds, null)
    if (subtotal < 10_000_000 && normalized === 'THINKBUY500') {
      return { ok: false, message: 'Mã này chỉ áp dụng cho đơn từ 10 triệu' }
    }

    set({ couponCode: normalized })
    return { ok: true, message: coupon.label }
  },

  clearCoupon: () => set({ couponCode: null }),
}))

/**
 * Chỉ tính trên các dòng đang được tick.
 *
 * KHÔNG được dùng làm selector cho useCartStore: hàm này trả về object mới
 * mỗi lần gọi, React sẽ thấy snapshot luôn thay đổi và lặp vô hạn.
 * Gọi trong component qua useMemo với ba tham số dưới đây.
 */
export function computeTotals(
  items: CartItem[],
  selectedIds: number[],
  couponCode: string | null,
): CartTotals {
  const selected = items.filter((item) => selectedIds.includes(item.id))

  const itemCount = selected.reduce((count, item) => count + item.quantity, 0)
  const subtotal = selected.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  )

  const coupon = couponCode ? COUPONS[couponCode] : null
  // Không cho giảm quá giá trị đơn
  const discount = coupon ? Math.min(coupon.amount, subtotal) : 0

  const shippingFee =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE

  return {
    itemCount,
    subtotal,
    discount,
    shippingFee,
    total: subtotal - discount + shippingFee,
  }
}

/** Tổng số máy trong giỏ, dùng cho badge trên header */
export function selectCartCount(state: CartState): number {
  return state.items.reduce((count, item) => count + item.quantity, 0)
}
