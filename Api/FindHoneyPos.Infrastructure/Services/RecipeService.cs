namespace FindHoneyPos.Infrastructure.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

public class RecipeService : IRecipeService
{
    private readonly AppDbContext _context;
    private readonly ILogger<RecipeService> _logger;

    public RecipeService(AppDbContext context, ILogger<RecipeService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<ProductRecipe>> GetByProductIdAsync(int productId)
    {
        return await _context.ProductRecipes
            .Include(r => r.Material)
            .Where(r => r.ProductId == productId)
            .ToListAsync();
    }

    public async Task<IEnumerable<ProductRecipe>> UpdateRecipesAsync(int productId, IEnumerable<(int MaterialId, decimal Quantity)> recipes)
    {
        // 檢查商品是否存在
        var productExists = await _context.Products.AnyAsync(p => p.Id == productId);
        if (!productExists)
        {
            throw new ArgumentException("Product not found", nameof(productId));
        }

        // 刪除現有配方
        var existingRecipes = await _context.ProductRecipes
            .Where(r => r.ProductId == productId)
            .ToListAsync();
        _context.ProductRecipes.RemoveRange(existingRecipes);

        // 建立新配方
        var newRecipes = new List<ProductRecipe>();
        foreach (var (materialId, quantity) in recipes)
        {
            // 驗證原物料存在
            var materialExists = await _context.Materials.AnyAsync(m => m.Id == materialId);
            if (!materialExists)
            {
                _logger.LogWarning("Material {MaterialId} not found when updating recipes for product {ProductId}", materialId, productId);
                continue;
            }

            var recipe = new ProductRecipe
            {
                ProductId = productId,
                MaterialId = materialId,
                Quantity = quantity
            };
            newRecipes.Add(recipe);
        }

        _context.ProductRecipes.AddRange(newRecipes);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Recipes updated for product {ProductId}: {RecipeCount} items", productId, newRecipes.Count);

        // 返回包含 Material 資訊的配方
        return await GetByProductIdAsync(productId);
    }

    public async Task<IEnumerable<Product>> GetProductsWithRecipesAsync()
    {
        return await _context.Products
            .Include(p => p.Recipes)
            .ThenInclude(r => r.Material)
            .Where(p => p.Status == ProductStatus.Active && p.Category != "加料")
            .OrderBy(p => p.SortOrder)
            .ToListAsync();
    }
}
