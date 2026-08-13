# Quy Tắc Thiết Kế Modular Monolith

Kiến trúc **Modular Monolith (Đơn khối dạng Mô-đun)** là sự kết hợp hoàn hảo giữa tính đơn giản khi triển khai của Monolith và tính cô lập, dễ mở rộng của Microservices. 

Trong dự án `LaptopCommerce`, toàn bộ hệ thống được chạy trong **một tiến trình duy nhất** (Single Process) để tiết kiệm tài nguyên và dễ vận hành, nhưng mã nguồn được phân chia thành **các mô-đun độc lập có ranh giới cực kỳ rõ ràng**.

Dưới đây là 3 luật sắt bạn bắt buộc phải tuân thủ để giữ cho hệ thống không bị biến thành một "nồi lẩu thập cẩm" (Big Ball of Mud) sau một thời gian phát triển:

---

## LUẬT SỐ 1: Cách ly Mã nguồn (Code Isolation)

> **Module A KHÔNG được phép tham chiếu trực tiếp dự án của Module B.**

* **Cách thiết kế:**
  * Dự án `LaptopCommerce.Ordering.Application` không được thêm reference đến `LaptopCommerce.Catalog.Domain` hay `LaptopCommerce.Catalog.Infrastructure`.
  * Ranh giới này được kiểm tra tự động thông qua các bài Architecture Tests (sử dụng thư viện `NetArchTest.Rules`) trong CI/CD. Nếu bạn lỡ tay viết code tham chiếu chéo, Unit Test sẽ báo lỗi đỏ ngay và không cho phép merge code.

* **Làm sao để gọi dữ liệu của nhau?**
  * **Cách 1: Giao tiếp đồng bộ (Interface qua Contracts):** 
    Nếu `Ordering` cần lấy thông tin tên và giá của sản phẩm trong giỏ để kiểm tra trước khi đặt hàng, `Ordering.Application` định nghĩa một interface `IProductLookup`. Module `Catalog.Infrastructure` sẽ thực thi (implement) interface này. Cả hai chỉ biết nhau thông qua interface đặt tại `Contracts`.
  
  * **Cách 2: Giao tiếp bất đồng bộ (Integration Events - Khuyên Dùng):**
    Khi Đơn hàng được thanh toán thành công ➔ `Ordering` bắn ra sự kiện `OrderPaidIntegrationEvent`. Module `Inventory` lắng nghe và tự động giảm số lượng tồn kho vật lý. Luồng đi này hoàn toàn không chặn tiến trình của người dùng.

---

## LUẬT SỐ 2: Cô lập Cơ sở dữ liệu (Database Isolation)

> **Mỗi Module có DbContext riêng, chỉ quản lý các bảng của mình. Tuyệt đối KHÔNG JOIN các bảng xuyên Module ở tầng database.**

* **Cách thiết kế:**
  * Mặc dù toàn bộ hệ thống lưu trữ chung trong một database MySQL `laptop_commerce` để dễ backup và cài đặt, nhưng mỗi module có một `DbContext` độc lập và chỉ cấu hình các bảng có prefix của module đó (ví dụ: `catalog_products`, `ordering_orders`).
  * `OrderingDbContext` không được khai báo `DbSet<Product>`. Do đó, bạn không thể viết lệnh Entity Framework thực hiện `JOIN` giữa bảng đơn hàng và bảng sản phẩm.
  * **Không thiết lập khóa ngoại (Foreign Key) vật lý xuyên Module.** Bảng `ordering_order_items` lưu cột `product_id` nhưng không cấu hình khóa ngoại liên kết sang bảng `catalog_products`. Việc bảo toàn dữ liệu này được thực thi ở tầng code nghiệp vụ (Application).

* **Ví dụ so sánh:**
  * **❌ SAI (Làm biến mất ranh giới mô-đun):**
    ```csharp
    // Trong OrderingDbContext
    var result = await _dbContext.Orders
        .Include(o => o.OrderItems)
        .ThenInclude(item => item.Product) // ❌ EF báo lỗi vì Ordering không biết Product
        .ToListAsync();
    ```
  
  * **✅ ĐÚNG (Cô lập qua Snapshot hoặc API gọi tin):**
    ```csharp
    // Bước 1: Lấy đơn hàng từ OrderingDbContext
    var order = await _orderingDb.Orders.FirstAsync(o => o.Id == orderId);
    
    // Bước 2: Gọi dịch vụ tìm kiếm thông tin sản phẩm (Định nghĩa ở Contracts)
    var productIds = order.Items.Select(i => i.ProductId);
    var productBriefs = await _productLookup.GetBriefsAsync(productIds);
    
    // Bước 3: Map thông tin hiển thị ở tầng API/Application DTO
    ```

---

## LUẬT SỐ 3: Bất biến dữ liệu lịch sử (History Immutability)

> **Dữ liệu lịch sử giao dịch phải lưu ở dạng Snapshot (Ảnh chụp thời điểm), không được tham chiếu trực tiếp đến bảng chứa thông tin thay đổi thường xuyên.**

* **Cách thiết kế:**
  * Khi khách hàng mua một chiếc Laptop với giá 20.000.000đ, thông tin này phải được ghi nhận cố định vào bảng `ordering_order_items` (bao gồm cột `unit_price` và `product_name_snapshot`).
  * Nếu 3 tháng sau, admin sửa tên Laptop thành phiên bản mới hoặc đổi giá bán thành 22.000.000đ ở module `Catalog`, đơn hàng cũ của khách hàng **vẫn phải hiển thị đúng tên cũ và giá cũ là 20.000.000đ**.
  * Nếu bạn chỉ lưu `product_id` trong bảng đơn hàng rồi mỗi lần hiển thị lại `JOIN` sang bảng sản phẩm để lấy tên và giá mới, bạn đã vô tình làm sai lệch lịch sử tài chính của hệ thống.

---

## 4. Khi nào nên chuyển lên Microservices?

Một trong những câu hỏi phỏng vấn kinh điển là: *"Tại sao không làm Microservices ngay từ đầu?"*

Với thiết kế Modular Monolith hiện tại, **các mô-đun của bạn đã độc lập hoàn toàn về mặt logic và dữ liệu**. Nếu lượng truy cập vào module `Catalog` tăng gấp 100 lần trong khi các module khác rất ít dùng:
1. Bạn chỉ cần tách dự án `Catalog` (Domain, Application, Infrastructure, Endpoints) ra thành một solution riêng.
2. Cấu hình cho nó trỏ vào một Database MySQL riêng (bằng cách di chuyển các bảng `catalog_*` sang DB mới).
3. Đổi implementation của các interface trong `Contracts` từ gọi trực tiếp trong bộ nhớ sang gọi qua giao thức HTTP (Web API) hoặc RabbitMQ.

Bạn có thể thực hiện việc này trong vòng **vài ngày** mà không cần phải đập đi viết lại bất kỳ dòng code nghiệp vụ nào ở tầng Domain hay Application. Đó chính là sức mạnh tối thượng của thiết kế Modular Monolith đúng chuẩn.
