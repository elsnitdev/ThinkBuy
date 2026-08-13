import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RootLayout } from '@/shared/components/layout/RootLayout'

/** Gom lời gọi lazy về một chỗ cho gọn — mỗi trang là một chunk riêng */
function page<T extends Record<string, React.ComponentType>>(
  loader: () => Promise<T>,
  name: keyof T,
) {
  return lazy(() =>
    loader().then((module) => ({ default: module[name] })),
  ) as React.LazyExoticComponent<React.ComponentType>
}

const HomePage = page(
  () => import('@/features/catalog/pages/HomePage'),
  'HomePage',
)
const ProductDetailPage = page(
  () => import('@/features/catalog/pages/ProductDetailPage'),
  'ProductDetailPage',
)
const CartPage = page(
  () => import('@/features/cart/pages/CartPage'),
  'CartPage',
)
const WishlistPage = page(
  () => import('@/features/wishlist/pages/WishlistPage'),
  'WishlistPage',
)
const AccountLayout = page(
  () => import('@/features/auth/components/AccountLayout'),
  'AccountLayout',
)
const ProfilePage = page(
  () => import('@/features/auth/pages/ProfilePage'),
  'ProfilePage',
)
const AddressBookPage = page(
  () => import('@/features/auth/pages/AddressBookPage'),
  'AddressBookPage',
)
const OrderListPage = page(
  () => import('@/features/order/pages/OrderListPage'),
  'OrderListPage',
)
const OrderDetailPage = page(
  () => import('@/features/order/pages/OrderDetailPage'),
  'OrderDetailPage',
)
const ComingSoonPage = page(
  () => import('@/features/catalog/pages/ComingSoonPage'),
  'ComingSoonPage',
)

export function AppRouter() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
          <Route path="/gio-hang" element={<CartPage />} />
          <Route path="/yeu-thich" element={<WishlistPage />} />

          {/* Khu tài khoản dùng chung khung sườn có menu bên trái */}
          <Route path="/tai-khoan" element={<AccountLayout />}>
            <Route index element={<ProfilePage />} />
            <Route path="don-hang" element={<OrderListPage />} />
            <Route path="don-hang/:code" element={<OrderDetailPage />} />
            <Route path="dia-chi" element={<AddressBookPage />} />
          </Route>

          {/* Các đường dẫn còn lại tạm dùng trang giữ chỗ */}
          <Route path="*" element={<ComingSoonPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
