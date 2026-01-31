namespace FindHoneyPos.Core.Entities;

using FindHoneyPos.Core.Enums;

public class AdminUser
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public UserRole Role { get; set; } = UserRole.PosUser;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
