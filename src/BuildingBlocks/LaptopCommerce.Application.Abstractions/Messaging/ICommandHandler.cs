using MediatR;
using LaptopCommerce.SharedKernel.Results;

namespace LaptopCommerce.Application.Abstractions.Messaging;

// handler for no data result

public interface ICommandHandler<TCommand> : IRequestHandler<TCommand, Result>
where TCommand : ICommand // Ràng buộc: TCommand truyền vào BẮT BUỘC phải là một ICommand, không được truyền bậy bạ.
{

}

// Người xử lý cho Lệnh loại 2 (Có trả về data)
public interface ICommandHandler<TCommand, TResponse> : IRequestHandler<TCommand, Result<TResponse>>
    where TCommand : ICommand<TResponse>
{
}