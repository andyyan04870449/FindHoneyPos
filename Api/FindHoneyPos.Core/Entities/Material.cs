namespace FindHoneyPos.Core.Entities;

using FindHoneyPos.Core.Enums;

public class Material
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty; // g/ml/顆/包
    public decimal CurrentStock { get; set; }
    public decimal AlertThreshold { get; set; }
    public MaterialStatus Status { get; set; } = MaterialStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ProductRecipe> Recipes { get; set; } = new List<ProductRecipe>();
    public ICollection<MaterialStockRecord> StockRecords { get; set; } = new List<MaterialStockRecord>();
    public ICollection<MaterialAlert> Alerts { get; set; } = new List<MaterialAlert>();
}
