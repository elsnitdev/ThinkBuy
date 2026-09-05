namespace LaptopCommerce.Contracts.Events;

// Chú ý: Ta dùng từ khóa "record" thay vì "class"
public abstract record IntegrationEvent(Guid Id, DateTime OccurredOn) : IIntegrationEvent
{
    // Hàm khởi tạo mặc định: Tự động sinh ID mới và lấy giờ UTC hiện tại
    protected IntegrationEvent() : this(Guid.NewGuid(), DateTime.UtcNow)
    {
    }
}