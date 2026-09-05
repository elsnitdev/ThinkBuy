using MediatR;
using LaptopCommerce.SharedKernel.Results;

namespace LaptopCommerce.Application.Abstractions.Messaging;

// for no value return 
public interface ICommand : IRequest<Result>
{

}

// for value return 

public interface ICommand<TResponse> : IRequest<Result<TResponse>>
{

}