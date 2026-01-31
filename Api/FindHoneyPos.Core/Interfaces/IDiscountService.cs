namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;

public interface IDiscountService
{
    Task<IEnumerable<Discount>> GetAllAsync();
    Task<Discount> CreateAsync(Discount discount);
    Task<Discount?> UpdateAsync(int id, Discount discount);
    Task<bool> DeleteAsync(int id);
    Task<Discount?> ToggleAsync(int id);
    Task<IEnumerable<Discount>> GetActiveAsync();
}
