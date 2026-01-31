namespace FindHoneyPos.Core.Entities;

using FindHoneyPos.Core.Enums;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public ProductStatus Status { get; set; } = ProductStatus.Active;
    public bool IsPopular { get; set; }
    public string? Category { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<InventoryCount> InventoryCounts { get; set; } = new List<InventoryCount>();
}
