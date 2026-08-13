# Giải Thích Tầng Dùng Chung (Building Blocks)

Trong dự án `LaptopCommerce`, chúng ta tạo ra 4 dự án đặc biệt dưới thư mục `src/BuildingBlocks`. Các dự án này không đại diện cho bất kỳ nghiệp vụ bán hàng nào, mà chúng là **hạ tầng kỹ thuật dùng chung (Building Blocks)**.

Dưới đây là chi tiết chức năng, lý do tồn tại và ví dụ của từng khối:

---

## 1. SharedKernel (Nhân dùng chung của Domain)

* **Nhiệm vụ:** Định nghĩa các viên gạch cơ bản nhất để xây dựng mô hình nghiệp vụ (Domain Model) cho tất cả các module.
* **Tại sao phải tạo:** Nếu không có `SharedKernel`, mỗi module sẽ phải tự viết lại các cấu trúc cơ sở như Entity, ValueObject, dẫn đến code bị trùng lặp và không nhất quán.
* **Các file quan trọng bên trong:**
  * `Entity.cs`: Chứa thuộc tính `Id` (khóa chính) và các toán tử so sánh bằng giữa các thực thể.
  * `AggregateRoot.cs`: Kế thừa từ `Entity`, bổ sung khả năng quản lý và phát sinh `DomainEvents` (sự kiện nghiệp vụ phát đi trong nội bộ module).
  * `Result.cs` & `Result<T>`: Đối tượng bọc kết quả trả về của các nghiệp vụ, cho biết kết quả thành công (chứa data) hay thất bại (chứa danh sách lỗi), thay vì ném ra Exception làm chậm hệ thống.

### Ví dụ trực quan:
```csharp
// Sử dụng Result<T> để xử lý lỗi nghiệp vụ sạch sẽ:
public Result<Product> CreateProduct(string name, decimal price)
{
    if (price < 0) 
        return Result.Failure<Product>(new Error("Product.PriceNegative", "Giá sản phẩm không thể âm"));
        
    return Result.Success(new Product(name, price));
}
```

---

## 2. Application.Abstractions (Khung xương tầng nghiệp vụ)

* **Nhiệm vụ:** Chứa các Interface định nghĩa cho các thành phần của tầng kịch bản sử dụng (Application Layer). Nó đại diện cho "Khung xương" để tầng Application hoạt động mà không cần biết công nghệ triển khai thực tế.
* **Tại sao phải tạo:** Giúp tầng nghiệp vụ chỉ tập trung vào logic (Ví dụ: đặt hàng, hủy đơn) mà không bị phụ thuộc vào cách giao tiếp (như dùng thư viện MediatR nào, dùng Transaction của EF Core hay ADO.NET).
* **Các file quan trọng bên trong:**
  * `ICommand.cs` & `ICommandHandler.cs`: Định nghĩa cấu trúc cho các tác vụ thay đổi trạng thái hệ thống.
  * `IQuery.cs` & `IQueryHandler.cs`: Định nghĩa cấu trúc cho các tác vụ đọc dữ liệu.
  * `IUnitOfWork.cs`: Interface cam kết một giao dịch DB (Transaction) thành công hết hoặc rollback hết.

---

## 3. Infrastructure.Shared (Hạ tầng kỹ thuật dùng chung)

* **Nhiệm vụ:** Chứa cài đặt (Implementation) thực tế của các thư viện kỹ thuật mà hầu hết các module đều cần dùng.
* **Tại sao phải tạo:** Để tránh việc cấu hình lặp lại các công nghệ như Redis, JWT hay Logger ở từng module. Khi muốn đổi cấu hình Redis, bạn chỉ cần sửa đúng 1 file ở đây.
* **Các file quan trọng bên trong:**
  * `RedisCacheService.cs` (Kế thừa `ICacheService`): Cài đặt cách đọc/ghi dữ liệu tạm thời vào Redis Cache.
  * `JwtTokenProvider.cs`: Cài đặt thực tế thuật toán mã hóa sinh chuỗi Token JWT để xác thực tài khoản.
  * `DbConnectionFactory.cs`: Quản lý việc tạo kết nối thô đến cơ sở dữ liệu MySQL.

### Ví dụ trực quan:
```csharp
// Khi cần lưu cache, tầng Application chỉ gọi:
await _cacheService.SetAsync("product:501", productDto, ttl);
// Tầng Application không cần biết dưới nó là thư viện StackExchange.Redis hay Redis của Microsoft,
// tất cả cấu hình phức tạp đã được che giấu trong Infrastructure.Shared.
```

---

## 4. Contracts (Hợp đồng liên lạc giữa các Modules)

* **Nhiệm vụ:** Chứa các class định nghĩa cho sự kiện tích hợp (Integration Events) và dữ liệu chuyển giao giữa các module.
* **Tại sao phải tạo:** Đây là nguyên tắc cốt lõi của Modular Monolith. Module A **tuyệt đối không được gọi trực tiếp** vào code của Module B. Thay vào đó, Module A phát ra một tin nhắn (Event) và gửi lên một bảng trung gian (Event Bus). Module B sẽ lắng nghe và tự xử lý. Dự án `Contracts` chính là nơi định nghĩa các "tin nhắn" dùng chung này.
* **Các file quan trọng bên trong:**
  * `OrderPlacedIntegrationEvent.cs`
  * `UserRegisteredIntegrationEvent.cs`
  * `ProductStockLowIntegrationEvent.cs`

### Ví dụ trực quan về luồng đi của Integration Event:
```
┌─────────────────┐       phát ra Event       ┌───────────────┐
│ Module Ordering ├──────────────────────────►│  Contracts    │ (Định nghĩa Event)
└─────────────────┘  OrderPlacedIntegration   └───────┬───────┘
                                                      │
                                                      ▼
┌─────────────────┐    lắng nghe và xử lý     ┌───────────────┐
│ Module Inventory│◄──────────────────────────┤   Event Bus   │ (Kênh trung chuyển)
└─────────────────┘  Giảm reserved_quantity   └───────────────┘
```
