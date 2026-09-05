using MediatR;
using LaptopCommerce.SharedKernel.Results;
namespace LaptopCommerce.Application.Abstractions.Messaging;
public interface IQueryHandler<TQuery, TResponse> : IRequestHandler<TQuery, Result<TResponse>>
    where TQuery : IQuery<TResponse>
{
}