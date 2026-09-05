using System.Text;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// --- 1. GIAI ĐOẠN THÊM NGUYÊN LIỆU (Thêm vào TRƯỚC builder.Build) ---
builder.Services.AddOpenApi();

// TUYỂN BẢO VỆ CHẶN CỬA (AUTHENTICATION)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,           // Ktra người cấp thẻ có đúng không?
            ValidateAudience = true,         // Ktra thẻ có đúng cho hệ thống này không?
            ValidateLifetime = true,         // Ktra thẻ đã hết hạn chưa?
            ValidateIssuerSigningKey = true, // Ktra chữ ký (dấu mộc đỏ) có bị làm giả không?

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]!))
        };
    });

builder.Services.AddAuthorization(); // Cấp quyền


// --- 2. GIAI ĐOẠN NƯỚNG BÁNH (Đóng gói ứng dụng) ---
var app = builder.Build();


// --- 3. GIAI ĐOẠN SẮP XẾP LUỒNG CHẠY (Thêm vào SAU builder.Build) ---
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// 👇 HAI DÒNG LỆNH GÁC CỬA (Bắt buộc phải nằm ở đây)
app.UseAuthentication(); // 1. Xét hỏi thẻ JWT trước
app.UseAuthorization();  // 2. Xét quyền hạn Admin/User sau

// --- (Đoạn mã Thời tiết mặc định của C#) ---
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
       new WeatherForecast
       (
           DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
           Random.Shared.Next(-20, 55),
           summaries[Random.Shared.Next(summaries.Length)]
       ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run(); // 🚀 Khởi chạy Server!

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}