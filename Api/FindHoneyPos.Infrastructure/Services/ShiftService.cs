namespace FindHoneyPos.Infrastructure.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class ShiftService : IShiftService
{
    private readonly AppDbContext _context;

    public ShiftService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Shift> OpenAsync(string? deviceId)
    {
        // 檢查是否已有開啟的班次
        var existing = await _context.Shifts
            .FirstOrDefaultAsync(s => s.DeviceId == deviceId && s.Status == ShiftStatus.Open);

        if (existing != null)
            throw new InvalidOperationException("該裝置已有開啟的班次，請先關班再開新班次");

        var shift = new Shift
        {
            DeviceId = deviceId,
            Status = ShiftStatus.Open,
            OpenedAt = DateTime.UtcNow,
        };

        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();
        return shift;
    }

    public async Task<Shift?> GetCurrentOpenAsync(string? deviceId)
    {
        return await _context.Shifts
            .FirstOrDefaultAsync(s => s.DeviceId == deviceId && s.Status == ShiftStatus.Open);
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

        shift.TotalOrders++;
        shift.TotalRevenue += order.Total;
        shift.TotalDiscount += order.DiscountAmount;
        shift.NetRevenue = shift.TotalRevenue;

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

        return (shift, settlementData);
    }
}
