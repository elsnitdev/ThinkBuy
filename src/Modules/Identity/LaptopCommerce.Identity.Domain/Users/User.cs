using LaptopCommerce.SharedKernel.Domain;

namespace LaptopCommerce.Identity.Domain.Users;

public sealed class User : AggregateRoot
{
    // Đặt 'private set' để KHÔNG AI được phép đổi tên/email của User một cách bừa bãi từ bên ngoài
    public string Email { get; private set; }
    public string PasswordHash { get; private set; }
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public string Role { get; private set; } // Ví dụ: "Customer" hoặc "Admin"

    // Hàm khởi tạo Private (Bắt buộc phải có để Entity Framework Core làm việc ngầm)
    private User(Guid id, string email, string passwordHash, string firstName, string lastName, string role)
        : base(id)
    {
        Email = email;
        PasswordHash = passwordHash;
        FirstName = firstName;
        LastName = lastName;
        Role = role;
    }

    // Factory Method: Cách DUY NHẤT để tạo ra một User mới hợp lệ
    public static User Create(string email, string passwordHash, string firstName, string lastName, string role)
    {
        var user = new User(Guid.NewGuid(), email, passwordHash, firstName, lastName, role);
        return user;
    }
}