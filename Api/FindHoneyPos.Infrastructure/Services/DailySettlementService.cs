namespace FindHoneyPos.Infrastructure.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class DailySettlementService : IDailySettlementService
{
    private readonly AppDbContext _context;

    public DailySettlementService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DailySettlement> SubmitAsync(DailySettlement settlement)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        settlement.Date = today;

        // Calculate from today's orders
        var start = today.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(1);
        var orders = await _context.Orders
            .Where(o => o.Timestamp >= start && o.Timestamp < end && o.Status == OrderStatus.Completed)
            .ToListAsync();

        settlement.TotalOrders = orders.Count;
        settlement.TotalRevenue = orders.Sum(o => o.Total);
        settlement.TotalDiscount = orders.Sum(o => o.DiscountAmount);
        settlement.NetRevenue = settlement.TotalRevenue;
        settlement.SubmittedAt = DateTime.UtcNow;

        _context.DailySettlements.Add(settlement);
        await _context.SaveChangesAsync();
        return settlement;
    }

    public async Task<DailySettlement?> GetTodayAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return await _context.DailySettlements
            .Include(ds => ds.InventoryCounts)
            .FirstOrDefaultAsync(ds => ds.Date == today);
    }
}
