using LaptopCommerce.SharedKernel.Domain;

namespace LaptopCommerce.Identity.Domain.Users.Events;

// Dùng record cho các sự kiện vì sự kiện đã xảy ra thì KHÔNG ĐƯỢC PHÉP THAY ĐỔI
public sealed record UserRegisteredDomainEvent(Guid UserId, string Email) : IDomainEvent;