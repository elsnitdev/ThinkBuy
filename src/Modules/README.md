# Modules

Thư mục `Modules` là trái tim nghiệp vụ của hệ thống, được thiết kế theo tư tưởng **Modular Monolith**.

## Cấu trúc của một Module
Mỗi thư mục con trong này đại diện cho một Bounded Context độc lập (ví dụ: `Cart`, `Catalog`, `Identity`). Bên trong mỗi Module tiếp tục áp dụng Clean Architecture hoặc Vertical Slice Architecture, chia thành các dự án nhỏ hơn:

1. **`*.Domain`**: Chứa cốt lõi nghiệp vụ, không phụ thuộc framework (Entities, Value Objects, Domain Events).
2. **`*.Application`**: Chứa Use Cases (CQRS Commands/Queries). Tham chiếu đến Domain và `Application.Abstractions`.
3. **`*.Infrastructure`**: Nơi thao tác với DB riêng biệt của Module (DbContext), tham chiếu đến `Infrastructure.Shared`.
4. **`*.Endpoints` (hoặc Presentation)**: Nơi chứa các API Controllers hoặc Minimal APIs.

## Luật số 1 (Vô cùng quan trọng)
Các Module **KHÔNG ĐƯỢC PHÉP** tham chiếu (`<ProjectReference>`) chéo lẫn nhau. Nếu Module A cần nói chuyện với Module B, chúng phải giao tiếp thông qua:
1. Phát và Lắng nghe **Integration Events** định nghĩa tại dự án `Contracts`.
2. Gọi trực tiếp thông qua một interface public (Facade) được cung cấp. (Phương án này ít dùng hơn Event-driven).
