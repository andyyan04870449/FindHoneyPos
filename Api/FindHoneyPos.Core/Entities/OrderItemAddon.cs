namespace FindHoneyPos.Core.Entities;

public class OrderItemAddon
{
    public int Id { get; set; }
    public int OrderItemId { get; set; }
    public int? ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Price { get; set; }

    public OrderItem OrderItem { get; set; } = null!;
    public Product? Product { get; set; }
}
