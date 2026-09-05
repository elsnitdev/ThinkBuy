# LaptopCommerce.Infrastructure.Shared

Đây là **Hạ tầng kỹ thuật dùng chung**, nơi chứa cài đặt (Implementation) thực tế cho các Interfaces được định nghĩa ở `Application.Abstractions` và các cấu hình công nghệ cốt lõi.

## Mục đích
Giúp hệ thống gom nhóm cấu hình và cài đặt kỹ thuật về một nơi duy nhất. Các dự án Module sẽ tham chiếu dự án này ở tầng Infrastructure của chúng, hoặc Host (Web API) sẽ tham chiếu để đăng ký Dependency Injection (DI). Nếu ngày mai đổi từ Redis sang Memcached, chúng ta chỉ cần sửa code ở đây, các Module không bị ảnh hưởng.

## Thành phần dự kiến
- **Caching**: `RedisCacheService.cs` - Cài đặt `ICacheService` sử dụng StackExchange.Redis hoặc IDistributedCache kết nối tới Docker Redis.
- **Authentication**: `JwtTokenProvider.cs` - Cài đặt thuật toán sinh chuỗi token JWT dựa trên secret key.
- **Data**: `DbConnectionFactory.cs` - Trình tạo kết nối cơ sở dữ liệu raw (MySQL) phục vụ cho Dapper.
- **Cross-cutting Concerns**: Cấu hình Serilog, Exception Handling Middleware,...
