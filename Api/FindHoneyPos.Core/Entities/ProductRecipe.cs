namespace FindHoneyPos.Core.Entities;

public class ProductRecipe
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int MaterialId { get; set; }
    public decimal Quantity { get; set; } // 每份商品消耗量

    public Product Product { get; set; } = null!;
    public Material Material { get; set; } = null!;
}
