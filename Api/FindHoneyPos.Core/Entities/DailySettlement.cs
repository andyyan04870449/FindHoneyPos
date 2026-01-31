namespace FindHoneyPos.Core.Entities;

public class DailySettlement
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal NetRevenue { get; set; }
    public string? DeviceId { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public ICollection<InventoryCount> InventoryCounts { get; set; } = new List<InventoryCount>();
}
