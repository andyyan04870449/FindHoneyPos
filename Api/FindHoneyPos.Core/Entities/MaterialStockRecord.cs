namespace FindHoneyPos.Core.Entities;

using FindHoneyPos.Core.Enums;

public class MaterialStockRecord
{
    public int Id { get; set; }
    public int MaterialId { get; set; }
    public StockChangeType ChangeType { get; set; }
    public decimal Quantity { get; set; }
    public decimal StockBefore { get; set; }
    public decimal StockAfter { get; set; }
    public int? OrderId { get; set; }
    public string? Note { get; set; }
    public int? OperatorId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Material Material { get; set; } = null!;
    public Order? Order { get; set; }
}
