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

        // 從上一次結帳之後開始算（換班邏輯）
        var dayStart = today.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = dayStart.AddDays(1);

        var lastSettlement = await _context.DailySettlements
            .Where(ds => ds.Date == today)
            .OrderByDescending(ds => ds.SubmittedAt)
            .FirstOrDefaultAsync();

        var start = lastSettlement?.SubmittedAt ?? dayStart;

        var orders = await _context.Orders
            .Where(o => o.Timestamp >= start && o.Timestamp < end && o.Status == OrderStatus.Completed)
            .ToListAsync();

        settlement.TotalOrders = orders.Count;
        settlement.TotalRevenue = orders.Sum(o => o.Subtotal);  // 折扣前總額
        settlement.TotalDiscount = orders.Sum(o => o.DiscountAmount);
        settlement.NetRevenue = settlement.TotalRevenue - settlement.TotalDiscount;  // 實收
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
            .Where(ds => ds.Date == today)
            .OrderByDescending(ds => ds.SubmittedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<(IEnumerable<DailySettlement> Items, int Total)> GetAllAsync(int page, int pageSize)
    {
        var query = _context.DailySettlements.OrderByDescending(ds => ds.SubmittedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<DailySettlement?> GetByIdAsync(int id)
    {
        return await _context.DailySettlements
            .Include(ds => ds.InventoryCounts)
                .ThenInclude(ic => ic.Product)
            .FirstOrDefaultAsync(ds => ds.Id == id);
    }
}
