namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;

public interface IAuditLogService
{
    Task LogAsync(int? userId, string username, string action, string? detail = null, string? ipAddress = null);
    Task<IEnumerable<AuditLog>> GetLogsAsync(int page, int pageSize, string? action = null);
    Task<int> GetTotalCountAsync(string? action = null);
}
