# Hosts

Thư mục `Hosts` chứa các dự án có khả năng khởi chạy (Executable Projects). Đây là đầu vào (Entry Points) của toàn bộ hệ thống.

## Các dự án bên trong
1. **`LaptopCommerce.Api`**: Dự án Web API chính. Dự án này sẽ là nơi duy nhất tham chiếu đến toàn bộ các Endpoints và Infrastructure của tất cả các Modules (chỉ dùng để cấu hình Dependency Injection và gắn API Router, không chứa logic nghiệp vụ). Nó cấu hình Swagger, JWT Authentication, Logging, và gọi `app.Run()`.
2. **`LaptopCommerce.Worker`** (Nếu có): Một Background Service chạy nền dùng để quét các Integration Event bị lỗi, hoặc gửi email bất đồng bộ mà không chặn luồng request của API.

## Mục đích
Việc tách Host ra một nơi riêng biệt chứng minh rằng ứng dụng của bạn không bị phụ thuộc vào ASP.NET Core. Phần nghiệp vụ nằm gọn trong `Modules`, Host chỉ có vai trò hứng HTTP Request, chuyển cho Module xử lý, và trả về HTTP Response.
