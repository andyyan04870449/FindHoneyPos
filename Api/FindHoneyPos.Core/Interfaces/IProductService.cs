namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;

public interface IProductService
{
    Task<IEnumerable<Product>> GetAllAsync(string? search = null, string? category = null);
    Task<Product?> GetByIdAsync(int id);
    Task<Product> CreateAsync(Product product);
    Task<Product?> UpdateAsync(int id, Product product);
    Task<bool> DeleteAsync(int id);
    Task<Product?> ToggleStatusAsync(int id);
    Task<IEnumerable<Product>> GetActiveAsync();
    Task ReorderAsync(int[] productIds);
}
