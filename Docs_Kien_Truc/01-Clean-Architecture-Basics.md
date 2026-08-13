# Clean Architecture - Kiến Trúc Sạch Trong Từng Module

Clean Architecture (Kiến trúc sạch) được áp dụng riêng biệt bên trong từng Module nghiệp vụ (ví dụ: `Catalog`, `Ordering`, `Identity`). Mục đích tối thượng của Clean Architecture là **tách biệt Logic Nghiệp vụ (Domain/Business Logic) ra khỏi Hạ tầng Kỹ thuật (Database, Web Framework, Third-party SDK)**. 

Nhờ đó, logic kinh doanh cốt lõi của bạn không bị ảnh hưởng khi bạn đổi Database (ví dụ từ MySQL sang PostgreSQL) hoặc đổi cách viết API.

---

## 1. Sơ Đồ Cấu Trúc Các Tầng

Trong một Module nghiệp vụ, các project được phân chia theo mô hình "củ hành" từ trong ra ngoài:

```
                  ┌────────────────────────────────────────┐
                  │          4. Endpoints / API            │
                  │  ┌──────────────────────────────────┐  │
                  │  │        3. Infrastructure         │  │
                  │  │  ┌────────────────────────────┐  │  │
                  │  │  │       2. Application       │  │  │
                  │  │  │  ┌──────────────────────┐  │  │  │
                  │  │  │  │      1. Domain       │  │  │  │
                  │  │  │  │                      │  │  │  │
                  │  │  │  └──────────────────────┘  │  │  │
                  │  │  └────────────────────────────┘  │  │
                  │  └──────────────────────────────────┘  │
                  └────────────────────────────────────────┘
```

### Quy tắc bất biến về Dependency:
> Các tầng bên ngoài tham chiếu vào các tầng bên trong. Tầng bên trong **tuyệt đối không biết và không tham chiếu** ra các tầng bên ngoài.

---

## 2. Chi Tiết Từng Tầng & Ví Dụ Thực Tế (Module Catalog)

Hãy cùng lấy ví dụ về hành động **"Tạo một Laptop mới"** để xem các file được tạo ở tầng nào và có nhiệm vụ gì.

### Tầng 1: Domain Layer (`LaptopCommerce.Catalog.Domain`)
* **Nhiệm vụ:** Chứa các đối tượng nghiệp vụ (Entities, Value Objects) và luật kinh doanh cốt lõi. Đây là tầng quan trọng nhất, không phụ thuộc vào bất cứ framework hay thư viện nào (không dùng EF Core hay ASP.NET).
* **Ví dụ các file cần tạo:**
  * `Product.cs` (Entity/Aggregate Root): Đối tượng Laptop. Nó tự bảo vệ các luật nghiệp vụ của nó (ví dụ: Giá bán không được âm, tên sản phẩm không được trống).
  * `IProductRepository.cs` (Interface): Định nghĩa phương thức lưu sản phẩm (nhưng không cài đặt).

```csharp
// Ví dụ file: Domain/Entities/Product.cs
public class Product : AggregateRoot 
{
    public string Name { get; private set; }
    public decimal Price { get; private set; }
    public int StockQuantity { get; private set; }

    // Constructor bắt buộc bảo vệ dữ liệu hợp lệ
    public Product(string name, decimal price, int stockQuantity)
    {
        if (string.IsNullOrWhiteSpace(name)) 
            throw new ArgumentException("Tên sản phẩm không được để trống");
        if (price < 0) 
            throw new ArgumentException("Giá sản phẩm không được âm");

        Name = name;
        Price = price;
        StockQuantity = stockQuantity;
    }

    // Nghiệp vụ thay đổi giá phải nằm ở Domain, không nằm ở tầng API
    public void ChangePrice(decimal newPrice)
    {
        if (newPrice < 0) throw new ArgumentException("Giá mới không hợp lệ");
        Price = newPrice;
        
        // Phát event khi giá đổi để các module khác lắng nghe
        AddDomainEvent(new ProductPriceChangedEvent(Id, newPrice));
    }
}
```

---

### Tầng 2: Application Layer (`LaptopCommerce.Catalog.Application`)
* **Nhiệm vụ:** Định nghĩa các kịch bản sử dụng (Use Cases) của hệ thống. Nó điều phối luồng dữ liệu: Nhận yêu cầu từ API ➔ Đọc dữ liệu từ DB thông qua Repository interface ➔ Gọi logic của Domain để xử lý ➔ Lưu lại vào DB.
* **Ví dụ các file cần tạo:**
  * `CreateProductCommand.cs` (DTO): Chứa dữ liệu gửi lên từ API (Tên, Giá, Số lượng).
  * `CreateProductCommandHandler.cs` (Handler): Nhận Command, kiểm tra logic, tạo đối tượng `Product` ở tầng Domain, rồi lưu qua `IProductRepository`.

```csharp
// Ví dụ file: Application/Products/Commands/CreateProductCommandHandler.cs
public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Result<Guid>>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateProductCommandHandler(IProductRepository productRepository, IUnitOfWork unitOfWork)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Guid>> Handle(CreateProductCommand request, CancellationToken ct)
    {
        // 1. Thực thi nghiệp vụ tạo Product (Domain)
        var product = new Product(request.Name, request.Price, request.StockQuantity);

        // 2. Lưu xuống DB qua Interface (Tầng Application không biết DB thực tế là MySQL hay gì)
        await _productRepository.AddAsync(product, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success(product.Id);
    }
}
```

---

### Tầng 3: Infrastructure Layer (`LaptopCommerce.Catalog.Infrastructure`)
* **Nhiệm vụ:** Triển khai (Implement) các interface kỹ thuật định nghĩa ở tầng Application hoặc Domain. Đây là nơi chứa code liên quan đến EF Core DbContext, MySQL, Redis, File Storage, v.v.
* **Ví dụ các file cần tạo:**
  * `CatalogDbContext.cs`: Khai báo với EF Core về các bảng dữ liệu trong CSDL MySQL.
  * `ProductRepository.cs`: Kế thừa `IProductRepository`, viết code LINQ/EF Core thực tế để `INSERT` sản phẩm vào bảng `catalog_products`.

```csharp
// Ví dụ file: Infrastructure/Persistence/Repositories/ProductRepository.cs
public class ProductRepository : IProductRepository
{
    private readonly CatalogDbContext _dbContext;

    public ProductRepository(CatalogDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Product product, CancellationToken ct)
    {
        // Thực tế lưu xuống MySQL bằng EF Core
        await _dbContext.Products.AddAsync(product, ct);
    }
}
```

---

### Tầng 4: Endpoints Layer (`LaptopCommerce.Catalog.Endpoints`)
* **Nhiệm vụ:** Định nghĩa cách bên ngoài giao tiếp với module. Trong .NET 9, đây là nơi định nghĩa các Minimal APIs endpoint. Nó tiếp nhận HTTP Request ➔ Chuyển đổi dữ liệu thành Command/Query ➔ Gửi vào MediatR để chuyển tới tầng Application ➔ Trả về HTTP Response (200 OK, 201 Created, 400 Bad Request).
* **Ví dụ các file cần tạo:**
  * `ProductEndpoints.cs`: Khai báo endpoint `POST /api/v1/products`.

```csharp
// Ví dụ file: Endpoints/ProductEndpoints.cs
public class ProductEndpoints : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/products", async (CreateProductRequest request, ISender sender) =>
        {
            var command = new CreateProductCommand(request.Name, request.Price, request.StockQuantity);
            
            // Gửi command vào MediatR để chuyển tới Application Handler
            var result = await sender.Send(command);

            return result.IsSuccess 
                ? Results.Created($"/api/v1/products/{result.Value}", result.Value) 
                : Results.BadRequest(result.Error);
        })
        .WithName("CreateProduct")
        .WithTags("Products");
    }
}
```

---

## 3. Tại Sao Phải Chia Tách Rõ Ràng Như Vậy?

1. **Dễ viết Unit Test (Testability):** 
   Tầng Domain của bạn hoàn toàn độc lập. Bạn có thể test logic đổi giá của `Product` trong tích tắc mà không cần phải khởi tạo kết nối MySQL thật.
2. **Độc lập Database (Database Independence):**
   Nếu ngày mai bạn muốn đổi từ EF Core MySQL sang Dapper PostgreSQL cho tầng `Catalog`, bạn chỉ cần viết lại tầng `Infrastructure`. Toàn bộ code xử lý nghiệp vụ ở tầng `Application` và `Domain` giữ nguyên 100%.
3. **Mở rộng (Scalability):**
   Vì các lớp giao tiếp qua các Interface (Loose Coupling - Liên kết lỏng), hệ thống rất linh hoạt để tách một module ra thành một Web Service riêng biệt chạy trên một Server khác khi quy mô dự án tăng lên.
