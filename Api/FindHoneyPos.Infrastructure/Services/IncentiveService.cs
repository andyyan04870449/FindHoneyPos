namespace FindHoneyPos.Infrastructure.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class IncentiveService : IIncentiveService
{
    private readonly AppDbContext _context;

    public IncentiveService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IncentiveSetting> GetSettingsAsync()
    {
        var settings = await _context.IncentiveSettings.FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new IncentiveSetting();
            _context.IncentiveSettings.Add(settings);
            await _context.SaveChangesAsync();
        }
        return settings;
    }

    public async Task<IncentiveSetting> UpdateSettingsAsync(bool isEnabled, int dailyTarget)
    {
        var settings = await _context.IncentiveSettings.FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new IncentiveSetting
            {
                IsEnabled = isEnabled,
                DailyTarget = dailyTarget,
                UpdatedAt = DateTime.UtcNow
            };
            _context.IncentiveSettings.Add(settings);
        }
        else
        {
            settings.IsEnabled = isEnabled;
            settings.DailyTarget = dailyTarget;
            settings.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return settings;
    }
}
