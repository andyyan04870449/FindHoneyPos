namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;

public interface IMaterialService
{
    Task<IEnumerable<Material>> GetAllAsync(string? search = null, MaterialStatus? status = null);
    Task<Material?> GetByIdAsync(int id);
    Task<Material> CreateAsync(Material material);
    Task<Material?> UpdateAsync(int id, Material material);
    Task<bool> DeleteAsync(int id);
    Task<Material?> ToggleStatusAsync(int id);

    // 庫存操作
    Task<MaterialStockRecord> StockInAsync(int materialId, decimal quantity, string? note = null, int? operatorId = null);
    Task<MaterialStockRecord> AdjustStockAsync(int materialId, decimal newStock, string? note = null, int? operatorId = null);
    Task<MaterialStockRecord> WasteAsync(int materialId, decimal quantity, string? note = null, int? operatorId = null);
    Task ConsumeByOrderAsync(Order order);

    // 庫存記錄
    Task<IEnumerable<MaterialStockRecord>> GetStockRecordsAsync(int? materialId = null, StockChangeType? changeType = null, DateTime? startDate = null, DateTime? endDate = null, int page = 1, int pageSize = 20);

    // 告警
    Task CheckAndCreateAlertsAsync(int materialId);
    Task<IEnumerable<MaterialAlert>> GetActiveAlertsAsync();
    Task ResolveAlertAsync(int alertId);

    // 儀表板
    Task<object> GetMaterialStatusAsync();
    Task<IEnumerable<Material>> GetLowStockMaterialsAsync();
}
