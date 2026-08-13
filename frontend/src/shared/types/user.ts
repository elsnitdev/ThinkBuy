/** Bám theo bảng identity_users / identity_addresses trong tài liệu kiến trúc */

export type Gender = 'male' | 'female' | 'other'

export interface User {
  id: number
  email: string
  fullName: string
  phone: string
  gender: Gender
  /** ISO date, chỉ phần ngày */
  birthDate: string
  createdAt: string
}

export interface Address {
  id: number
  /** Nhãn tự đặt: Nhà riêng, Công ty… */
  label: string
  receiver: string
  phone: string
  province: string
  district: string
  ward: string
  detail: string
  isDefault: boolean
}

/** Gộp địa chỉ thành một dòng để hiển thị */
export function formatAddress(address: Address): string {
  return [
    address.detail,
    address.ward,
    address.district,
    address.province,
  ].join(', ')
}
