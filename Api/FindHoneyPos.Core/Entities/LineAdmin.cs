namespace FindHoneyPos.Core.Entities;

using FindHoneyPos.Core.Enums;

public class LineAdmin
{
    public int Id { get; set; }
    public string LineUserId { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? PictureUrl { get; set; }
    public LineAdminStatus Status { get; set; } = LineAdminStatus.Pending;
    public int? ApprovedById { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public AdminUser? ApprovedBy { get; set; }
}
