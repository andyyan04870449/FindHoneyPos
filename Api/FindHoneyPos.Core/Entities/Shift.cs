namespace FindHoneyPos.Core.Entities;

using FindHoneyPos.Core.Enums;

public class Shift
{
    public int Id { get; set; }
    public string? DeviceId { get; set; }
    public ShiftStatus Status { get; set; } = ShiftStatus.Open;
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    // 即時統計欄位
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal NetRevenue { get; set; }

    // Navigation
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public int? SettlementId { get; set; }
    public DailySettlement? Settlement { get; set; }
}
