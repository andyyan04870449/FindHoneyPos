namespace FindHoneyPos.Infrastructure.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class ShiftService : IShiftService
{
    private readonly AppDbContext _context;
    private readonly ILineWebhookService _lineWebhookService;

    public ShiftService(AppDbContext context, ILineWebhookService lineWebhookService)
    {
        _context = context;
        _lineWebhookService = lineWebhookService;
    }

    public async Task<Shift> OpenAsync(int userId, string? deviceId = null)
    {
        // 檢查是否已有開啟的班次 (改用 UserId 查詢)
        var existing = await _context.Shifts
            .FirstOrDefaultAsync(s => s.AdminUserId == userId && s.Status == ShiftStatus.Open);

        if (existing != null)
            throw new InvalidOperationException("您已有開啟的班次，請先關班再開新班次");

        var shift = new Shift
        {
            AdminUserId = userId,
            DeviceId = deviceId, // 保留 DeviceId 供參考，但不用於查詢
            Status = ShiftStatus.Open,
            OpenedAt = DateTime.UtcNow,
        };

        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        // 發送 LINE 管理員通知
        var taipeiTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Taipei");
        var openedAtLocal = TimeZoneInfo.ConvertTimeFromUtc(shift.OpenedAt, taipeiTimeZone);

        await _lineWebhookService.SendAdminNotificationAsync(
            $"🟢 開班通知\n" +
            $"日期: {openedAtLocal:yyyy/MM/dd}\n" +
            $"時間: {openedAtLocal:HH:mm}");

        return shift;
    }

    public async Task<Shift?> GetCurrentOpenAsync(int userId)
    {
        return await _context.Shifts
            .FirstOrDefaultAsync(s => s.AdminUserId == userId && s.Status == ShiftStatus.Open);
    }

    public async Task<Shift?> GetByIdAsync(int id)
    {
        return await _context.Shifts
            .Include(s => s.Orders)
            .Include(s => s.Settlement)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task UpdateStatsAsync(int shiftId, Order order)
    {
        var shift = await _context.Shifts.FindAsync(shiftId);
        if (shift == null || shift.Status != ShiftStatus.Open) return;

        // order.DiscountAmount 已包含單品折扣 + 訂單折扣
        // order.Subtotal = 原始金額（折扣前）
        // order.Total = 實收金額（折扣後）
        var totalDiscount = order.DiscountAmount;

        // Gift 類型：折扣 = 訂單原價
        if (order.DiscountType == DiscountType.Gift)
        {
            totalDiscount = order.Subtotal;
        }

        shift.TotalOrders++;
        shift.TotalRevenue += order.Subtotal;      // 原始營業額（折扣前）
        shift.TotalDiscount += totalDiscount;
        shift.NetRevenue = shift.TotalRevenue - shift.TotalDiscount;  // 實收

        await _context.SaveChangesAsync();
    }

    public async Task<(Shift Shift, DailySettlement Settlement)> CloseAsync(int shiftId, DailySettlement settlementData)
    {
        var shift = await _context.Shifts.FindAsync(shiftId);
        if (shift == null)
            throw new InvalidOperationException("找不到該班次");
        if (shift.Status != ShiftStatus.Open)
            throw new InvalidOperationException("該班次已關閉");

        // 將班次統計寫入 DailySettlement
        settlementData.Date = DateOnly.FromDateTime(DateTime.UtcNow);
        settlementData.TotalOrders = shift.TotalOrders;
        settlementData.TotalRevenue = shift.TotalRevenue;
        settlementData.TotalDiscount = shift.TotalDiscount;
        settlementData.NetRevenue = shift.NetRevenue;
        settlementData.DeviceId = shift.DeviceId;
        settlementData.SubmittedAt = DateTime.UtcNow;

        _context.DailySettlements.Add(settlementData);
        await _context.SaveChangesAsync();

        // 設定班次為已關閉
        shift.Status = ShiftStatus.Closed;
        shift.ClosedAt = DateTime.UtcNow;
        shift.SettlementId = settlementData.Id;

        await _context.SaveChangesAsync();

        // 發送 LINE 管理員通知
        var taipeiTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Taipei");
        var openedAtLocal = TimeZoneInfo.ConvertTimeFromUtc(shift.OpenedAt, taipeiTimeZone);
        var closedAtLocal = TimeZoneInfo.ConvertTimeFromUtc(shift.ClosedAt!.Value, taipeiTimeZone);

        await _lineWebhookService.SendAdminNotificationAsync(
            $"📊 關班通知\n" +
            $"日期: {closedAtLocal:yyyy/MM/dd}\n" +
            $"開班: {openedAtLocal:HH:mm}\n" +
            $"關班: {closedAtLocal:HH:mm}\n" +
            $"━━━━━━━━━━\n" +
            $"營業額: ${settlementData.TotalRevenue:N0}\n" +
            $"折扣金額: ${settlementData.TotalDiscount:N0}\n" +
            $"實收金額: ${settlementData.NetRevenue:N0}\n" +
            $"訂單數: {settlementData.TotalOrders} 筆");

        return (shift, settlementData);
    }
}
