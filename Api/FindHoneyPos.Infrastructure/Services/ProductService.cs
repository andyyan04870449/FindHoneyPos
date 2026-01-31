namespace FindHoneyPos.Infrastructure.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class ProductService : IProductService
{
    private readonly AppDbContext _context;

    public ProductService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Product>> GetAllAsync(string? search = null, string? category = null)
    {
        var query = _context.Products.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search));
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category == category);
        else
            query = query.Where(p => p.Category != "加料");
        return await query.OrderBy(p => p.SortOrder).ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(int id)
        => await _context.Products.FindAsync(id);

    public async Task<Product> CreateAsync(Product product)
    {
        product.CreatedAt = DateTime.UtcNow;
        product.UpdatedAt = DateTime.UtcNow;
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<Product?> UpdateAsync(int id, Product product)
    {
        var existing = await _context.Products.FindAsync(id);
        if (existing is null) return null;

        existing.Name = product.Name;
        existing.Price = product.Price;
        existing.Status = product.Status;
        existing.IsPopular = product.IsPopular;
        existing.Category = product.Category;
        existing.SortOrder = product.SortOrder;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product is null) return false;
        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<Product?> ToggleStatusAsync(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product is null) return null;
        product.Status = product.Status == ProductStatus.Active ? ProductStatus.Inactive : ProductStatus.Active;
        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<IEnumerable<Product>> GetActiveAsync()
        => await _context.Products
            .Where(p => p.Status == ProductStatus.Active)
            .OrderBy(p => p.SortOrder)
            .ToListAsync();
}
