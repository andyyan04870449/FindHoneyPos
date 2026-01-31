namespace FindHoneyPos.Infrastructure.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class DiscountService : IDiscountService
{
    private readonly AppDbContext _context;

    public DiscountService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Discount>> GetAllAsync()
        => await _context.Discounts.OrderBy(d => d.Id).ToListAsync();

    public async Task<Discount> CreateAsync(Discount discount)
    {
        discount.CreatedAt = DateTime.UtcNow;
        _context.Discounts.Add(discount);
        await _context.SaveChangesAsync();
        return discount;
    }

    public async Task<Discount?> UpdateAsync(int id, Discount discount)
    {
        var existing = await _context.Discounts.FindAsync(id);
        if (existing is null) return null;

        existing.Name = discount.Name;
        existing.Type = discount.Type;
        existing.Value = discount.Value;
        existing.MinPurchase = discount.MinPurchase;
        existing.IsActive = discount.IsActive;
        existing.Description = discount.Description;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var discount = await _context.Discounts.FindAsync(id);
        if (discount is null) return false;
        _context.Discounts.Remove(discount);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<Discount?> ToggleAsync(int id)
    {
        var discount = await _context.Discounts.FindAsync(id);
        if (discount is null) return null;
        discount.IsActive = !discount.IsActive;
        await _context.SaveChangesAsync();
        return discount;
    }

    public async Task<IEnumerable<Discount>> GetActiveAsync()
        => await _context.Discounts.Where(d => d.IsActive).ToListAsync();
}
