namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;

public interface IIncentiveService
{
    Task<IncentiveSetting> GetSettingsAsync();
    Task<IncentiveSetting> UpdateSettingsAsync(bool isEnabled, int dailyTarget);
}
