namespace FindHoneyPos.Infrastructure.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class DailySettlementService : IDailySettlementService
{
    private readonly AppDbContext _context;
    private readonly ILineWebhookService _lineWebhookService;

    public DailySettlementService(AppDbContext context, ILineWebhookService lineWebhookService)
    {
        _context = context;
        _lineWebhookService = lineWebhookService;
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
            .Include(o => o.Items)
            .Where(o => o.Timestamp >= start && o.Timestamp < end && o.Status == OrderStatus.Completed)
            .ToListAsync();

        // 計算總折扣（Gift 類型特殊處理，避免重複計算）
        var totalDiscount = orders.Sum(o =>
        {
            if (o.DiscountType == DiscountType.Gift)
            {
                // Gift 類型：折扣 = 訂單原價，不重複計算單品折扣
                return o.Subtotal;
            }
            else
            {
                // 其他類型：單品折扣 + 訂單折扣
                var itemDiscount = o.Items
                    .Where(i => i.OriginalPrice.HasValue)
                    .Sum(i => (i.OriginalPrice!.Value - i.Price) * i.Quantity);
                return itemDiscount + o.DiscountAmount;
            }
        });

        // 實收金額 = orders.Total 的總和
        var netRevenue = orders.Sum(o => o.Total);

        settlement.TotalOrders = orders.Count;
        settlement.TotalRevenue = netRevenue + totalDiscount;  // 原始營業額（折扣前）
        settlement.TotalDiscount = totalDiscount;
        settlement.NetRevenue = netRevenue;  // 實收
        settlement.SubmittedAt = DateTime.UtcNow;

        _context.DailySettlements.Add(settlement);
        await _context.SaveChangesAsync();

        // 發送 LINE 管理員通知
        await _lineWebhookService.SendAdminNotificationAsync(
            $"📋 日結完成\n" +
            $"日期: {settlement.Date:yyyy-MM-dd}\n" +
            $"營業額: ${settlement.TotalRevenue:N0}\n" +
            $"折扣: ${settlement.TotalDiscount:N0}\n" +
            $"實收: ${settlement.NetRevenue:N0}\n" +
            $"訂單數: {settlement.TotalOrders}");

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
