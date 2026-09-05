using MediatR;
using LaptopCommerce.SharedKernel.Results;
namespace LaptopCommerce.Application.Abstractions.Messaging;
// Luôn luôn phải có TResponse (kiểu dữ liệu trả về, ví dụ List<Laptop>)
public interface IQuery<TResponse> : IRequest<Result<TResponse>>
{
}