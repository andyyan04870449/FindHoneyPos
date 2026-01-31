namespace FindHoneyPos.Core.Entities;

public class InventoryCount
{
    public int Id { get; set; }
    public int SettlementId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }

    public DailySettlement Settlement { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
