namespace FindHoneyPos.Infrastructure.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class LineOaService : ILineOaService
{
    private readonly AppDbContext _context;

    public LineOaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<LineOaSetting> GetSettingsAsync()
    {
        var settings = await _context.LineOaSettings.FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new LineOaSetting();
            _context.LineOaSettings.Add(settings);
            await _context.SaveChangesAsync();
        }
        return settings;
    }

    public async Task<LineOaSetting> UpdateSettingsAsync(LineOaSetting settings)
    {
        var existing = await _context.LineOaSettings.FirstOrDefaultAsync();
        if (existing is null)
        {
            _context.LineOaSettings.Add(settings);
        }
        else
        {
            existing.ChannelId = settings.ChannelId;
            existing.ChannelSecret = settings.ChannelSecret;
            existing.AccessToken = settings.AccessToken;
            existing.IsConnected = settings.IsConnected;
            existing.AutoReply = settings.AutoReply;
            existing.OrderNotification = settings.OrderNotification;
            existing.PromotionNotification = settings.PromotionNotification;
        }
        await _context.SaveChangesAsync();
        return existing ?? settings;
    }

    public async Task<bool> TestConnectionAsync()
    {
        var settings = await _context.LineOaSettings.FirstOrDefaultAsync();
        if (settings is null || string.IsNullOrEmpty(settings.ChannelId))
            return false;

        // Stub: always return true if settings exist
        settings.IsConnected = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<MessageTemplate>> GetTemplatesAsync()
        => await _context.MessageTemplates.OrderBy(t => t.Id).ToListAsync();

    public async Task<MessageTemplate?> UpdateTemplateAsync(int id, MessageTemplate template)
    {
        var existing = await _context.MessageTemplates.FindAsync(id);
        if (existing is null) return null;

        existing.Name = template.Name;
        existing.Type = template.Type;
        existing.Content = template.Content;
        existing.IsActive = template.IsActive;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<MessageTemplate?> ToggleTemplateAsync(int id)
    {
        var existing = await _context.MessageTemplates.FindAsync(id);
        if (existing is null) return null;

        existing.IsActive = !existing.IsActive;
        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<BroadcastHistory> BroadcastAsync(string message, int? templateId)
    {
        var history = new BroadcastHistory
        {
            TemplateId = templateId,
            Message = message,
            SentAt = DateTime.UtcNow,
            Status = "sent"
        };

        _context.BroadcastHistories.Add(history);
        await _context.SaveChangesAsync();
        return history;
    }

    public async Task<IEnumerable<BroadcastHistory>> GetBroadcastHistoryAsync()
        => await _context.BroadcastHistories
            .Include(bh => bh.Template)
            .OrderByDescending(bh => bh.SentAt)
            .ToListAsync();
}
