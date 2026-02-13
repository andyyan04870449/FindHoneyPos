namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;

public interface IRecipeService
{
    Task<IEnumerable<ProductRecipe>> GetByProductIdAsync(int productId);
    Task<IEnumerable<ProductRecipe>> UpdateRecipesAsync(int productId, IEnumerable<(int MaterialId, decimal Quantity)> recipes);
    Task<IEnumerable<Product>> GetProductsWithRecipesAsync();
}
