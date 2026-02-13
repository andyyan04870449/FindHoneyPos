namespace FindHoneyPos.Core.Entities;

public class MaterialAlert
{
    public int Id { get; set; }
    public int MaterialId { get; set; }
    public decimal StockLevel { get; set; }
    public decimal AlertThreshold { get; set; }
    public bool IsNotified { get; set; }
    public DateTime? NotifiedAt { get; set; }
    public bool IsResolved { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Material Material { get; set; } = null!;
}
