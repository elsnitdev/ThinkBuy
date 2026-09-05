# LaptopCommerce.Contracts

Đây là dự án chứa các **Hợp đồng giao tiếp (Contracts)** giữa các Module. Trong một kiến trúc Modular Monolith chuẩn, Module A tuyệt đối không được Add Reference trực tiếp đến Module B.

## Mục đích
Đảm bảo tính "Lỏng lẻo" (Loose Coupling). Khi Module Cart cần báo cho Module Ordering biết có đơn hàng mới, Cart không gọi trực tiếp hàm của Ordering. Thay vào đó, Cart phát ra một sự kiện (Event), và Ordering lắng nghe sự kiện đó. Dự án `Contracts` là nơi duy nhất chứa các class Event này để cả Cart và Ordering cùng tham chiếu.

## Thành phần dự kiến
- **`IIntegrationEvent`**: Giao diện đánh dấu cho một sự kiện tích hợp (Sự kiện vượt ra khỏi ranh giới của một Module).
- **Các Integration Events**: Chứa class như `OrderPlacedIntegrationEvent`, `UserRegisteredIntegrationEvent`.
- **`IEventBus`**: Giao diện của Message Broker (như RabbitMQ, Kafka) hoặc Event Bus chạy trong bộ nhớ (InMemory) dùng để Publish các sự kiện.
