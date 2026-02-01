namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;

public interface IShiftService
{
    Task<Shift> OpenAsync(string? deviceId);
    Task<Shift?> GetCurrentOpenAsync(string? deviceId);
    Task<Shift?> GetByIdAsync(int id);
    Task UpdateStatsAsync(int shiftId, Order order);
    Task<(Shift Shift, DailySettlement Settlement)> CloseAsync(int shiftId, DailySettlement settlementData);
}
