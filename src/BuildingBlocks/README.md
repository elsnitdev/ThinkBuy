# Building Blocks

Thư mục `BuildingBlocks` chứa các dự án nền tảng (Foundation) dùng chung cho toàn bộ hệ thống Modular Monolith. Các dự án này **không chứa bất kỳ logic nghiệp vụ cụ thể nào** của ứng dụng (như Cart, Catalog, Identity...), mà chỉ cung cấp các viên gạch cơ sở, công cụ, cấu hình, và giao diện chuẩn mực để các Modules có thể sử dụng lại.

Mục tiêu của Building Blocks là:
- Đảm bảo tính nhất quán trong code (cùng dùng một cấu trúc `Result`, cùng một cấu trúc Event).
- Giảm thiểu việc lặp lại code (DRY - Don't Repeat Yourself) giữa các Module.
- Quản lý các cấu hình hạ tầng tập trung (Redis, Logging, Auth).

## Các dự án bên trong:
1. **SharedKernel**: Hạt nhân dùng chung chứa các class cơ sở cho Domain-Driven Design (Entity, AggregateRoot) và mẫu Result.
2. **Application.Abstractions**: Chứa các Interfaces (ICommand, IQuery, IUnitOfWork) giúp tầng Application của các Module độc lập với framework.
3. **Infrastructure.Shared**: Nơi cài đặt các công nghệ cụ thể (Redis, MySQL, JWT, Serilog) dựa trên các interface được định nghĩa.
4. **Contracts**: Nơi định nghĩa các Sự kiện Tích hợp (Integration Events) dùng để các Module giao tiếp với nhau mà không tham chiếu trực tiếp.
