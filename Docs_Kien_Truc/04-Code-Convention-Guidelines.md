# Hướng Dẫn Chuẩn Viết Code (Code Convention)

Mục tiêu của tài liệu này không phải là trói buộc bạn bằng những quy tắc khắt khe, mà là những **lời khuyên thực tế** giúp code của bạn dễ đọc, dễ hiểu và dễ bảo trì hơn, đặc biệt hữu ích cho mục đích học tập và rèn luyện kỹ năng viết code "sạch" (Clean Code).

---

## 1. C# & .NET (Backend)

### Đặt tên (Naming)
Sử dụng các quy chuẩn cơ bản của C# để code trông chuyên nghiệp:
- **Tên Class, Interface, Method:** Dùng `PascalCase` (viết hoa chữ cái đầu mỗi từ).
  - *Ví dụ:* `public class Product`, `public interface IOrderRepository`, `public void CalculateTotal()`.
- **Tên biến (Variables) & Tham số (Parameters):** Dùng `camelCase` (chữ cái đầu tiên viết thường).
  - *Ví dụ:* `int stockQuantity = 10;`, `public void UpdatePrice(decimal newPrice)`.
- **Biến private trong Class (Fields):** Dùng `_camelCase` (có dấu gạch dưới).
  - *Ví dụ:* 
    ```csharp
    private readonly CatalogDbContext _dbContext;
    public ProductService(CatalogDbContext dbContext) {
        _dbContext = dbContext;
    }
    ```

### Tổ chức Code (Structure)
- **Giữ method ngắn gọn:** Một method chỉ nên làm **một việc duy nhất**. Nếu một method dài hơn 50 dòng, hãy cân nhắc tách nó thành các method nhỏ hơn.
- **Return Early (Trả về sớm):** Tránh việc if-else lồng nhau quá sâu. Hãy kiểm tra lỗi và `return` ngay lập tức.
  - *Không nên:*
    ```csharp
    if (product != null) {
        if (price > 0) {
            // Xử lý...
        }
    }
    ```
  - *Nên làm:*
    ```csharp
    if (product == null) return Result.Failure("Không tìm thấy");
    if (price <= 0) return Result.Failure("Giá không hợp lệ");
    // Xử lý logic chính ở ngoài cùng, rất dễ nhìn
    ```

---

## 2. React & TypeScript (Frontend)

### Đặt tên (Naming)
- **Tên Component (File và Function):** Dùng `PascalCase`.
  - *Ví dụ:* `ProductCard.tsx`, `export function ShoppingCart() { ... }`
- **Tên Hook:** Luôn bắt đầu bằng chữ `use` và dùng `camelCase`.
  - *Ví dụ:* `useProductList()`, `useAuth()`
- **Tên biến, hàm xử lý sự kiện:** Dùng `camelCase`. Đặt tên hàm xử lý sự kiện bắt đầu bằng `handle`.
  - *Ví dụ:* `const isLoading = true;`, `const handleAddToCart = () => { ... }`

### Tổ chức Code
- **Tách biệt UI và Logic:** Nếu một component có quá nhiều logic gọi API, tính toán... hãy tách logic đó ra một custom hook (ví dụ `useProductLogic`). Component chỉ nên tập trung vào việc render HTML/UI.
- **Destructuring (Phân rã object):** Lấy thẳng các thuộc tính cần thiết ra thay vì dùng `props.` nhiều lần.
  - *Nên làm:* `const ProductCard = ({ name, price }) => { return <div>{name}</div> }`

---

## 3. Bình luận code (Comments)

- **Nguyên tắc vàng:** Code tốt tự nó đã giải thích nó làm cái gì (thông qua cách đặt tên biến, tên hàm rõ ràng). Bạn chỉ nên viết comment để giải thích **TẠI SAO (Why)** lại làm như vậy, chứ đừng giải thích **CÁI GÌ (What)**.
- *Ví dụ tốt:* `// Phải trừ đi 1 vì API của đối tác bắt đầu index từ 0 thay vì 1.`
- *Ví dụ xấu:* `// Khai báo biến đếm` (Điều này quá hiển nhiên, ai đọc code cũng biết).
