namespace FindHoneyPos.Infrastructure.Services;

using FindHoneyPos.Core.Constants;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class OrderService : IOrderService
{
    private readonly AppDbContext _context;

    public OrderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<Order> Orders, int Total)> GetAllAsync(
        OrderStatus? status = null, DateTime? startDate = null, DateTime? endDate = null,
        int page = 1, int pageSize = 20)
    {
        var query = _context.Orders.Include(o => o.Items).ThenInclude(i => i.Addons).AsQueryable();

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);
        if (startDate.HasValue)
            query = query.Where(o => o.Timestamp >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(o => o.Timestamp <= endDate.Value);

        var total = await query.CountAsync();
        var orders = await query
            .OrderByDescending(o => o.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (orders, total);
    }

    public async Task<Order?> GetByIdAsync(int id)
        => await _context.Orders.Include(o => o.Items).ThenInclude(i => i.Addons).FirstOrDefaultAsync(o => o.Id == id);

    public async Task<int> GetNextDailySequenceAsync()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var maxSeq = await _context.Orders
            .Where(o => o.Timestamp >= today && o.Timestamp < tomorrow)
            .MaxAsync(o => (int?)o.DailySequence);

        return maxSeq.HasValue ? maxSeq.Value + 1 : BusinessRules.InitialOrderSequence + 1;
    }

    public async Task<Order> CreateAsync(Order order)
    {
        if (order.DailySequence == 0)
        {
            order.DailySequence = await GetNextDailySequenceAsync();
        }

        if (string.IsNullOrEmpty(order.OrderNumber))
        {
            order.OrderNumber = $"{BusinessRules.OrderNumberPrefix}{order.DailySequence.ToString().PadLeft(BusinessRules.OrderNumberPadding, '0')}";
        }

        // Snapshot product info (include addon prices)
        foreach (var item in order.Items)
        {
            var addonTotal = item.Addons.Sum(a => a.Price);
            item.Subtotal = (item.Price + addonTotal) * item.Quantity;
        }

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
        return order;
    }

    public async Task<IEnumerable<Order>> BatchCreateAsync(IEnumerable<Order> orders)
    {
        var created = new List<Order>();
        foreach (var order in orders)
        {
            // Check for duplicate by DeviceId + Timestamp
            if (!string.IsNullOrEmpty(order.DeviceId))
            {
                var exists = await _context.Orders.AnyAsync(o =>
                    o.DeviceId == order.DeviceId && o.Timestamp == order.Timestamp);
                if (exists) continue;
            }

            var result = await CreateAsync(order);
            created.Add(result);
        }
        return created;
    }

    public async Task<object> GetStatsAsync()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var todayOrders = _context.Orders.Where(o => o.Timestamp >= today && o.Timestamp < tomorrow);

        var totalOrders = await todayOrders.CountAsync();
        var completedOrders = await todayOrders.CountAsync(o => o.Status == OrderStatus.Completed);
        var cancelledOrders = await todayOrders.CountAsync(o => o.Status == OrderStatus.Cancelled);
        var totalRevenue = await todayOrders.Where(o => o.Status == OrderStatus.Completed).SumAsync(o => (decimal?)o.Total) ?? 0;

        return new
        {
            totalOrders,
            completedOrders,
            cancelledOrders,
            totalRevenue
        };
    }
}
