namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;

public interface ILineOaService
{
    Task<LineOaSetting> GetSettingsAsync();
    Task<LineOaSetting> UpdateSettingsAsync(LineOaSetting settings);
    Task<bool> TestConnectionAsync();
    Task<IEnumerable<MessageTemplate>> GetTemplatesAsync();
    Task<MessageTemplate?> UpdateTemplateAsync(int id, MessageTemplate template);
    Task<MessageTemplate?> ToggleTemplateAsync(int id);
    Task<BroadcastHistory> BroadcastAsync(string message, int? templateId);
    Task<IEnumerable<BroadcastHistory>> GetBroadcastHistoryAsync();
}
