namespace LaptopCommerce.Contracts.Events;

public interface IEventBus
{
    // Hàm ném sự kiện vào bưu điện. Chữ T bắt buộc phải là một IntegrationEvent.
    Task PublishAsync<T>(T integrationEvent, CancellationToken cancellationToken = default)
        where T : class, IIntegrationEvent;
}