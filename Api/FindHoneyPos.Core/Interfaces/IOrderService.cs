namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;

public interface IOrderService
{
    Task<(IEnumerable<Order> Orders, int Total)> GetAllAsync(OrderStatus? status = null, DateTime? startDate = null, DateTime? endDate = null, int page = 1, int pageSize = 20);
    Task<Order?> GetByIdAsync(int id);
    Task<Order> CreateAsync(Order order);
    Task<IEnumerable<Order>> BatchCreateAsync(IEnumerable<Order> orders);
    Task<object> GetStatsAsync();
    Task<int> GetNextDailySequenceAsync();
}
