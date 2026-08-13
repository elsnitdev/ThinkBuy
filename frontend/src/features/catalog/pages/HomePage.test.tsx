import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'
import { PRODUCTS } from '@/mocks/products'

describe('HomePage', () => {
  it('hiển thị sản phẩm tiêu điểm và toàn bộ lưới sản phẩm', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    // Sản phẩm đầu tiên xuất hiện ở cả khối tiêu điểm lẫn lưới
    expect(screen.getAllByText(PRODUCTS[0].name).length).toBeGreaterThanOrEqual(
      1,
    )

    // Mỗi sản phẩm có một liên kết tới trang chi tiết
    for (const product of PRODUCTS) {
      expect(
        screen.getAllByRole('link', { name: product.name }).length,
      ).toBeGreaterThan(0)
    }
  })
})
