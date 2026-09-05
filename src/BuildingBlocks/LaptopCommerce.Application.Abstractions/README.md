# LaptopCommerce.Application.Abstractions

Đây là bộ **Khung xương giao diện (Interfaces)** dành cho tầng Application của các Module. 

## Mục đích
Tầng Application định nghĩa các Use Case (kịch bản nghiệp vụ) của hệ thống. Để tầng này hoàn toàn "trong sạch" và không bị gắn chặt với các thư viện cụ thể như MediatR hay công nghệ caching, chúng ta định nghĩa các Interfaces tại đây.

## Thành phần dự kiến
- **Messaging (CQRS)**: Định nghĩa `ICommand`, `ICommandHandler`, `IQuery`, `IQueryHandler`. Chúng bọc lại cấu trúc của MediatR và ép kiểu trả về phải là `Result` hoặc `Result<T>` từ `SharedKernel`. Điều này đảm bảo mọi Use Case đều tuân thủ chuẩn xử lý lỗi không dùng Exception.
- **Data (Database)**: Định nghĩa `IUnitOfWork` để cam kết (Commit) hoặc hủy bỏ (Rollback) các thay đổi dữ liệu trong một Transaction.
- **Caching**: Định nghĩa `ICacheService` (Set, Get, Remove). Các Module chỉ cần gọi `ICacheService.Get()` mà không cần biết hệ thống đang dùng Redis hay Memcached.
