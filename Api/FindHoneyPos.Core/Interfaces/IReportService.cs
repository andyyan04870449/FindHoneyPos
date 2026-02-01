namespace FindHoneyPos.Core.Interfaces;

public interface IReportService
{
    Task<object> GetDailyReportAsync(DateOnly date);
    Task<object> GetHourlySalesAsync(DateOnly date);
    Task<object> GetCategorySalesAsync(DateOnly date);
    Task<object> GetPaymentMethodsAsync(DateOnly date);
    Task<object> GetTopProductsAsync(DateOnly date);
    Task<byte[]> ExportCsvAsync(DateOnly date);
    Task<object> GetTopAddonsAsync(DateOnly date);
    Task<object> GetAddonProductCombinationsAsync(DateOnly date);
    Task<object> GetAddonRevenueTrendAsync(int days);
    Task<object> GetCustomerTagDistributionAsync(DateOnly date);
    Task<object> GetInventorySummaryAsync(DateOnly date);
}
