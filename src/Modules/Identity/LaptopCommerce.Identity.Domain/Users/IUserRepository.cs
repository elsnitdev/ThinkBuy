namespace LaptopCommerce.Identity.Domain.Users;

public interface IUserRepository
{
    // Tìm 1 User bằng Email (dùng lúc Đăng nhập)
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    // Kiểm tra xem Email đã có ai đăng ký chưa (dùng lúc Đăng ký)
    Task<bool> IsEmailUniqueAsync(string email, CancellationToken cancellationToken = default);

    // Lưu User mới vào hệ thống
    void Add(User user);
}