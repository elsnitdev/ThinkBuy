# Hướng Dẫn Truy Vấn Cơ Sở Dữ Liệu Tối Ưu (EF Core & SQL)

Tài liệu này cung cấp các "mẹo" (Best Practices) đơn giản, thực tế khi thao tác với cơ sở dữ liệu qua Entity Framework Core (EF Core). Trọng tâm là giúp bạn tránh những lỗi phổ biến làm hệ thống chậm đi, đồng thời giúp bạn hiểu cách EF Core sinh ra mã SQL.

---

## 1. Dùng `AsNoTracking()` cho các truy vấn CHỈ ĐỌC (Read-Only)

Khi bạn query dữ liệu chỉ để hiển thị (ví dụ: lấy danh sách sản phẩm hiển thị lên web) và không có ý định `Update` hay `Delete` chúng trong cùng một luồng (request), hãy luôn dùng `AsNoTracking()`.

- **Tại sao?** EF Core mặc định sẽ theo dõi (Tracking) mọi object nó lấy từ DB lên để xem bạn có sửa đổi gì không. Việc theo dõi này tốn rất nhiều bộ nhớ và CPU. `AsNoTracking()` sẽ tắt tính năng này đi, giúp query nhanh hơn gấp nhiều lần.

- **Ví dụ:**
  ```csharp
  // TỐT: Lấy danh sách sản phẩm chỉ để hiển thị
  var products = await _dbContext.Products
      .AsNoTracking() // Quan trọng!
      .Where(p => p.Price > 1000)
      .ToListAsync();
  ```

---

## 2. Lấy dữ liệu phân trang (Pagination) thay vì lấy tất cả

Đừng bao giờ query toàn bộ một bảng chứa hàng ngàn/triệu dòng dữ liệu lên Ram của server. Luôn sử dụng `Skip` và `Take` để lấy từng phần nhỏ.

- **Tại sao?** Kéo toàn bộ dữ liệu sẽ làm tràn RAM (Out of Memory) và làm sập ứng dụng Backend của bạn.

- **Ví dụ:**
  ```csharp
  int pageNumber = 2; // Trang số 2
  int pageSize = 20;  // 20 sản phẩm mỗi trang

  // Câu lệnh SQL sinh ra sẽ dùng LIMIT và OFFSET (đối với MySQL)
  var pagedProducts = await _dbContext.Products
      .AsNoTracking()
      .OrderBy(p => p.CreatedDate) // BẮT BUỘC phải OrderBy trước khi Skip/Take
      .Skip((pageNumber - 1) * pageSize)
      .Take(pageSize)
      .ToListAsync();
  ```

---

## 3. Tránh lỗi N+1 Query (Sát thủ hiệu năng)

Lỗi N+1 xảy ra khi bạn query 1 bảng gốc (1 query), sau đó dùng vòng lặp for chạy qua kết quả để lấy thông tin từ một bảng liên quan (N queries). Tổng cộng bạn gọi DB `N+1` lần, khiến hệ thống cực kỳ chậm.

- **Cách khắc phục:** Dùng `.Include()` để gộp query (Sinh ra câu lệnh `JOIN` trong SQL) để lấy tất cả trong 1 lần gọi duy nhất.

- **Ví dụ:**
  ```csharp
  // KÉM (Gây ra lỗi N+1):
  var orders = await _dbContext.Orders.ToListAsync(); // 1 query
  foreach(var order in orders) {
      // EF Core tự động query DB thêm N lần cho mỗi order để lấy items
      var count = order.Items.Count; 
  }

  // TỐT (Dùng Include để JOIN):
  var ordersWithItems = await _dbContext.Orders
      .Include(o => o.Items) // EF Core sẽ sinh ra LEFT JOIN sang bảng Items
      .ToListAsync(); // Chỉ tốn 1 query duy nhất
  ```

---

## 4. Chỉ Select những cột (Columns) thực sự cần thiết

Nếu bảng Product của bạn có 50 cột (Cấu hình máy, mô tả dài hàng ngàn chữ...), nhưng ở trang chủ bạn chỉ cần hiển thị `Tên` và `Giá`, đừng bắt DB trả về toàn bộ 50 cột.

- **Cách làm:** Sử dụng `.Select()` để mapping (chọn) các trường mong muốn.

- **Ví dụ:**
  ```csharp
  // SQL sinh ra: SELECT Name, Price FROM Products WHERE StockQuantity > 0
  var productSummaries = await _dbContext.Products
      .Where(p => p.StockQuantity > 0)
      .Select(p => new {
          p.Name,
          p.Price
      })
      .ToListAsync();
  ```

---

## 5. Dùng đúng hàm tính toán (Count, Any)

- Đừng bao giờ dùng `.ToList().Count` để đếm tổng số dòng, vì nó sẽ kéo hết data về server rồi mới đếm. Thay vào đó hãy dùng `.CountAsync()` (nó sinh ra `SELECT COUNT(*) FROM...` chạy rất nhẹ ở DB).
- Nếu chỉ muốn kiểm tra xem có dữ liệu thỏa mãn điều kiện tồn tại hay không (Có hay Không), dùng `.AnyAsync()` thay vì `.CountAsync() > 0`. `.AnyAsync()` sẽ dừng tìm kiếm ngay khi thấy record đầu tiên, giúp tối ưu hơn.

- **Ví dụ:**
  ```csharp
  // TỐT: Kiểm tra xem có sản phẩm nào hết hàng không
  bool hasOutOfStock = await _dbContext.Products.AnyAsync(p => p.StockQuantity == 0);
  ```
