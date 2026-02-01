namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;

public interface IDailySettlementService
{
    Task<DailySettlement> SubmitAsync(DailySettlement settlement);
    Task<DailySettlement?> GetTodayAsync();
    Task<(IEnumerable<DailySettlement> Items, int Total)> GetAllAsync(int page, int pageSize);
    Task<DailySettlement?> GetByIdAsync(int id);
}
