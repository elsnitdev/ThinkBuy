namespace LaptopCommerce.Application.Abstractions.Authentication;

public interface IJwtProvider
{
    // Cung cấp Id, Email, Role -> Trả về chuỗi Token (eyJ...)
    string Generate(Guid userId, string email, string role);
}