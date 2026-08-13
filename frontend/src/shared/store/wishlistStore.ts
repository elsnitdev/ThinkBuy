import { create } from 'zustand'

/** Id sản phẩm được yêu thích sẵn — thay bằng GET /api/v1/wishlist khi có backend */
const INITIAL_WISHLIST_IDS = [2, 5, 9, 11]

interface WishlistState {
  productIds: number[]
  toggle: (productId: number) => void
  remove: (productId: number) => void
  clear: () => void
}

export const useWishlistStore = create<WishlistState>((set) => ({
  productIds: INITIAL_WISHLIST_IDS,

  toggle: (productId) =>
    set((state) => ({
      productIds: state.productIds.includes(productId)
        ? state.productIds.filter((id) => id !== productId)
        : [productId, ...state.productIds],
    })),

  remove: (productId) =>
    set((state) => ({
      productIds: state.productIds.filter((id) => id !== productId),
    })),

  clear: () => set({ productIds: [] }),
}))
