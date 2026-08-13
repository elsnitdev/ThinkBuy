/** DỮ LIỆU MẪU — thay bằng GET /api/v1/me và /api/v1/me/addresses khi có backend */
import type { Address, User } from '@/shared/types/user'

export const CURRENT_USER: User = {
  id: 1024,
  email: 'minhanh.nguyen@gmail.com',
  fullName: 'Nguyễn Minh Anh',
  phone: '0912 345 678',
  gender: 'female',
  birthDate: '1999-04-12',
  createdAt: '2025-08-03T09:12:00Z',
}

export const ADDRESSES: Address[] = [
  {
    id: 1,
    label: 'Nhà riêng',
    receiver: 'Nguyễn Minh Anh',
    phone: '0912 345 678',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận Bình Thạnh',
    ward: 'Phường 25',
    detail: '148/12 Đường Ung Văn Khiêm',
    isDefault: true,
  },
  {
    id: 2,
    label: 'Công ty',
    receiver: 'Nguyễn Minh Anh',
    phone: '0912 345 678',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    detail: 'Tầng 8, Toà nhà Bitexco, 2 Hải Triều',
    isDefault: false,
  },
  {
    id: 3,
    label: 'Nhà bố mẹ',
    receiver: 'Nguyễn Văn Hùng',
    phone: '0987 654 321',
    province: 'Tỉnh Đồng Nai',
    district: 'TP. Biên Hòa',
    ward: 'Phường Tân Hiệp',
    detail: '57 Đường Phạm Văn Thuận',
    isDefault: false,
  },
]
