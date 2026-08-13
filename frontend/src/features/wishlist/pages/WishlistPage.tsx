import { Link } from 'react-router-dom'
import { ArrowRight, Heart, Trash2 } from 'lucide-react'
import { notify } from '@/shared/lib/notify'
import { PRODUCTS } from '@/mocks/products'
import { ProductCard } from '@/features/catalog/components/ProductCard'
import { useWishlistStore } from '@/shared/store/wishlistStore'
import { Button } from '@/shared/components/ui/button'

export function WishlistPage() {
  const productIds = useWishlistStore((state) => state.productIds)
  const clear = useWishlistStore((state) => state.clear)

  // Giữ đúng thứ tự đã thêm thay vì thứ tự trong danh mục
  const products = productIds
    .map((id) => PRODUCTS.find((product) => product.id === id))
    .filter((product) => product !== undefined)

  if (products.length === 0) {
    return (
      <div className="shell py-20 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-surface-sunken text-navy-300">
          <Heart className="size-8" />
        </span>
        <h1 className="mt-5 text-[22px] font-bold text-heading">
          Chưa có sản phẩm yêu thích
        </h1>
        <p className="mt-2 text-[14.5px] text-muted-foreground">
          Bấm vào biểu tượng trái tim trên sản phẩm để lưu lại xem sau.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">
            Khám phá sản phẩm
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="shell py-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-[20px] font-bold text-heading">
            Sản phẩm yêu thích
          </h1>
          <p className="tnum mt-1 text-[13.5px] text-muted-foreground">
            {products.length} sản phẩm đã lưu
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            const agreed = await notify.confirm({
              title: `Xóa toàn bộ ${products.length} sản phẩm yêu thích?`,
              description: 'Thao tác này không thể hoàn tác.',
              confirmLabel: 'Xóa tất cả',
              danger: true,
            })
            if (!agreed) return
            clear()
            notify.success('Đã xóa toàn bộ danh sách yêu thích')
          }}
          className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-sale-text"
        >
          <Trash2 className="size-4" />
          Xóa tất cả
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} eager={index < 5} />
        ))}
      </div>

      <p className="mt-6 rounded-md border border-border bg-card px-4 py-3 text-[13px] text-muted-foreground">
        Danh sách yêu thích là tín hiệu ý định mạnh hơn lượt xem — hệ thống gợi
        ý sẽ dùng dữ liệu này để cá nhân hoá sản phẩm hiển thị cho bạn.
      </p>
    </div>
  )
}
