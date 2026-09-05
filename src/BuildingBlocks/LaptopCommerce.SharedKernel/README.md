# LaptopCommerce.SharedKernel

Đây là lớp **Hạt nhân dùng chung (Shared Kernel)**. Trong kiến trúc DDD (Domain-Driven Design), Shared Kernel chứa các khái niệm cốt lõi nhất mà mọi Bounded Context (Module) đều phải tuân theo.

## Mục đích
Dự án này là tầng thấp nhất, nó **không phụ thuộc vào bất kỳ dự án nào khác**. Các Module nghiệp vụ sẽ tham chiếu đến dự án này để sử dụng các lớp cơ sở.

## Thành phần chính
- **`Entity`**: Lớp trừu tượng định nghĩa một thực thể với thuộc tính `Id` và cách so sánh bằng nhau (Equality).
- **`AggregateRoot`**: Kế thừa `Entity`, đại diện cho thực thể trung tâm của một Aggregate. Cung cấp khả năng lưu trữ và phát (Raise) các `IDomainEvent`.
- **`IDomainEvent`**: Giao diện đánh dấu (marker interface) đại diện cho các sự kiện xảy ra bên trong nội bộ một Module. Kế thừa `INotification` của MediatR để hỗ trợ cơ chế Pub/Sub trong bộ nhớ.
- **`Result` & `Result<T>`**: Thay vì ném `Exception` khi gặp lỗi nghiệp vụ (gây tốn chi phí hiệu năng và khó kiểm soát), hệ thống sẽ trả về đối tượng `Result` báo hiệu thành công/thất bại kèm theo lỗi cụ thể (`Error`).
