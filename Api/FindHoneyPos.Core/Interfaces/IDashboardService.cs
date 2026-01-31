namespace FindHoneyPos.Core.Interfaces;

public interface IDashboardService
{
    Task<object> GetKpiAsync();
    Task<object> GetSalesTrendAsync(int days);
    Task<object> GetTopProductsAsync(int limit);
    Task<object> GetAddonKpiAsync();
    Task<object> GetCustomerTagKpiAsync();
}
