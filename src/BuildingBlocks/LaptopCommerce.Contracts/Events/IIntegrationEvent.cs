namespace LaptopCommerce.Contracts.Events;

public interface IIntegrationEvent
{
    // Guid GUID trong .NET C# (viết tắt của Globally Unique Identifier) 
    // dùng để tạo ra một mã định danh duy nhất toàn cầu dưới dạng một chuỗi 128-bit 
    // (thường hiển thị thành 36 ký tự gồm cả dấu gạch ngang) với xác suất trùng lặp cực kỳ thấp gần như bằng không.
    Guid Id { get; }

    DateTime OccurredOn { get; }
}