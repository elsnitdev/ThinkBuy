using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using LaptopCommerce.Application.Abstractions.Authentication;

using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace LaptopCommerce.Infrastructure.Shared.Authentication;

public class JwtProvider : IJwtProvider
{
    private readonly JwtOptions _options;

    // Sử dụng IOptions<T> để tự động lôi dữ liệu từ file appsettings.json đã khai báo ở Bước 1
    public JwtProvider(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public string Generate(Guid userId, string email, string role)
    {
        // 1. Nhồi thông tin người dùng vào Payload (Claims)
        var claims = new Claim[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Role, role)
        };

        // 2. Chế tạo Dấu mộc đỏ (Signature) bằng SecretKey trong appsettings
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SecretKey));
        var signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 3. Lắp ráp 3 phần: Header + Payload + Signature
        var token = new JwtSecurityToken(
            _options.Issuer,
            _options.Audience,
            claims,
            null, // NotBefore
            DateTime.UtcNow.AddMinutes(_options.ExpirationInMinutes), // Bom hẹn giờ (EXP)
            signingCredentials);

        // 4. Xuất xưởng ra chuỗi Token dạng chữ
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}