/** Định dạng tiền tệ VND: 28990000 → "28.990.000₫" */
export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}₫`
}

/** Rút gọn tiền theo đơn vị triệu: 28990000 → "29 triệu" */
export function formatMillion(amount: number): string {
  return `${Math.round(amount / 1_000_000)} triệu`
}

/** Rút gọn số lớn: 1200 → "1,2k" */
export function formatCompact(value: number): string {
  if (value < 1000) return String(value)
  return `${(value / 1000).toFixed(1).replace('.', ',').replace(',0', '')}k`
}

/** Phần trăm giảm giá, làm tròn xuống. Trả về 0 nếu không giảm. */
export function discountPercent(
  price: number,
  compareAtPrice: number | null,
): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0
  return Math.floor(((compareAtPrice - price) / compareAtPrice) * 100)
}

/** Ngày dạng "23/07/2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
