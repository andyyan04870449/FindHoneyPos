namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;

public interface IDailySettlementService
{
    Task<DailySettlement> SubmitAsync(DailySettlement settlement);
    Task<DailySettlement?> GetTodayAsync();
}
