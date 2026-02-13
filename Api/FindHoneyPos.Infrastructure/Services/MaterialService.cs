namespace FindHoneyPos.Infrastructure.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

public class MaterialService : IMaterialService
{
    private readonly AppDbContext _context;
    private readonly ILogger<MaterialService> _logger;

    public MaterialService(AppDbContext context, ILogger<MaterialService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<Material>> GetAllAsync(string? search = null, MaterialStatus? status = null)
    {
        var query = _context.Materials.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(m => m.Name.Contains(search));
        if (status.HasValue)
            query = query.Where(m => m.Status == status.Value);
        return await query.OrderBy(m => m.Name).ToListAsync();
    }

    public async Task<Material?> GetByIdAsync(int id)
        => await _context.Materials.FindAsync(id);

    public async Task<Material> CreateAsync(Material material)
    {
        material.CreatedAt = DateTime.UtcNow;
        material.UpdatedAt = DateTime.UtcNow;
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Material created: {MaterialId} {MaterialName}", material.Id, material.Name);
        return material;
    }

    public async Task<Material?> UpdateAsync(int id, Material material)
    {
        var existing = await _context.Materials.FindAsync(id);
        if (existing is null) return null;

        existing.Name = material.Name;
        existing.Unit = material.Unit;
        existing.AlertThreshold = material.AlertThreshold;
        existing.Status = material.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Material updated: {MaterialId} {MaterialName}", existing.Id, existing.Name);
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material is null) return false;

        // 檢查是否有配方使用此原物料
        var hasRecipes = await _context.ProductRecipes.AnyAsync(r => r.MaterialId == id);
        if (hasRecipes)
        {
            _logger.LogWarning("Cannot delete material {MaterialId} because it has recipes", id);
            return false;
        }

        _context.Materials.Remove(material);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Material deleted: {MaterialId}", id);
        return true;
    }

    public async Task<Material?> ToggleStatusAsync(int id)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material is null) return null;
        material.Status = material.Status == MaterialStatus.Active ? MaterialStatus.Inactive : MaterialStatus.Active;
        material.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogInformation("Material status toggled: {MaterialId} to {Status}", material.Id, material.Status);
        return material;
    }

    public async Task<MaterialStockRecord> StockInAsync(int materialId, decimal quantity, string? note = null, int? operatorId = null)
    {
        var material = await _context.Materials.FindAsync(materialId)
            ?? throw new ArgumentException("Material not found", nameof(materialId));

        var stockBefore = material.CurrentStock;
        material.CurrentStock += quantity;
        material.UpdatedAt = DateTime.UtcNow;

        var record = new MaterialStockRecord
        {
            MaterialId = materialId,
            ChangeType = StockChangeType.In,
            Quantity = quantity,
            StockBefore = stockBefore,
            StockAfter = material.CurrentStock,
            Note = note,
            OperatorId = operatorId,
            CreatedAt = DateTime.UtcNow
        };

        _context.MaterialStockRecords.Add(record);
        await _context.SaveChangesAsync();

        // 檢查是否需要解除告警
        await ResolveAlertsIfStockRecoveredAsync(materialId);

        _logger.LogInformation("Stock in: Material {MaterialId}, Quantity {Quantity}, StockAfter {StockAfter}", materialId, quantity, material.CurrentStock);
        return record;
    }

    public async Task<MaterialStockRecord> AdjustStockAsync(int materialId, decimal newStock, string? note = null, int? operatorId = null)
    {
        var material = await _context.Materials.FindAsync(materialId)
            ?? throw new ArgumentException("Material not found", nameof(materialId));

        var stockBefore = material.CurrentStock;
        var quantity = newStock - stockBefore;
        material.CurrentStock = newStock;
        material.UpdatedAt = DateTime.UtcNow;

        var record = new MaterialStockRecord
        {
            MaterialId = materialId,
            ChangeType = StockChangeType.Adjust,
            Quantity = quantity,
            StockBefore = stockBefore,
            StockAfter = material.CurrentStock,
            Note = note,
            OperatorId = operatorId,
            CreatedAt = DateTime.UtcNow
        };

        _context.MaterialStockRecords.Add(record);
        await _context.SaveChangesAsync();

        await CheckAndCreateAlertsAsync(materialId);

        _logger.LogInformation("Stock adjusted: Material {MaterialId}, NewStock {NewStock}", materialId, newStock);
        return record;
    }

    public async Task<MaterialStockRecord> WasteAsync(int materialId, decimal quantity, string? note = null, int? operatorId = null)
    {
        var material = await _context.Materials.FindAsync(materialId)
            ?? throw new ArgumentException("Material not found", nameof(materialId));

        var stockBefore = material.CurrentStock;
        material.CurrentStock -= quantity;
        if (material.CurrentStock < 0) material.CurrentStock = 0;
        material.UpdatedAt = DateTime.UtcNow;

        var record = new MaterialStockRecord
        {
            MaterialId = materialId,
            ChangeType = StockChangeType.Waste,
            Quantity = -quantity,
            StockBefore = stockBefore,
            StockAfter = material.CurrentStock,
            Note = note,
            OperatorId = operatorId,
            CreatedAt = DateTime.UtcNow
        };

        _context.MaterialStockRecords.Add(record);
        await _context.SaveChangesAsync();

        await CheckAndCreateAlertsAsync(materialId);

        _logger.LogInformation("Stock waste: Material {MaterialId}, Quantity {Quantity}, StockAfter {StockAfter}", materialId, quantity, material.CurrentStock);
        return record;
    }

    public async Task ConsumeByOrderAsync(Order order)
    {
        // 取得訂單項目
        var orderItems = order.Items;
        if (!orderItems.Any()) return;

        var productIds = orderItems.Select(i => i.ProductId).Distinct().ToList();

        // 取得這些商品的配方
        var recipes = await _context.ProductRecipes
            .Include(r => r.Material)
            .Where(r => productIds.Contains(r.ProductId))
            .ToListAsync();

        if (!recipes.Any()) return;

        var affectedMaterialIds = new HashSet<int>();

        foreach (var item in orderItems)
        {
            var itemRecipes = recipes.Where(r => r.ProductId == item.ProductId);
            foreach (var recipe in itemRecipes)
            {
                var consumeQuantity = recipe.Quantity * item.Quantity;
                var material = recipe.Material;

                var stockBefore = material.CurrentStock;
                material.CurrentStock -= consumeQuantity;
                if (material.CurrentStock < 0) material.CurrentStock = 0;
                material.UpdatedAt = DateTime.UtcNow;

                var record = new MaterialStockRecord
                {
                    MaterialId = material.Id,
                    ChangeType = StockChangeType.Out,
                    Quantity = -consumeQuantity,
                    StockBefore = stockBefore,
                    StockAfter = material.CurrentStock,
                    OrderId = order.Id,
                    Note = $"訂單 {order.OrderNumber} 消耗",
                    CreatedAt = DateTime.UtcNow
                };

                _context.MaterialStockRecords.Add(record);
                affectedMaterialIds.Add(material.Id);
            }
        }

        await _context.SaveChangesAsync();

        // 檢查告警
        foreach (var materialId in affectedMaterialIds)
        {
            await CheckAndCreateAlertsAsync(materialId);
        }

        _logger.LogInformation("Order {OrderId} consumed materials from {MaterialCount} materials", order.Id, affectedMaterialIds.Count);
    }

    public async Task<IEnumerable<MaterialStockRecord>> GetStockRecordsAsync(int? materialId = null, StockChangeType? changeType = null, DateTime? startDate = null, DateTime? endDate = null, int page = 1, int pageSize = 20)
    {
        var query = _context.MaterialStockRecords
            .Include(r => r.Material)
            .AsQueryable();

        if (materialId.HasValue)
            query = query.Where(r => r.MaterialId == materialId.Value);
        if (changeType.HasValue)
            query = query.Where(r => r.ChangeType == changeType.Value);
        if (startDate.HasValue)
            query = query.Where(r => r.CreatedAt >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(r => r.CreatedAt <= endDate.Value);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task CheckAndCreateAlertsAsync(int materialId)
    {
        var material = await _context.Materials.FindAsync(materialId);
        if (material is null) return;

        // 檢查是否低於警戒庫存
        if (material.CurrentStock <= material.AlertThreshold)
        {
            // 檢查是否已有未解決的告警
            var existingAlert = await _context.MaterialAlerts
                .FirstOrDefaultAsync(a => a.MaterialId == materialId && !a.IsResolved);

            if (existingAlert is null)
            {
                var alert = new MaterialAlert
                {
                    MaterialId = materialId,
                    StockLevel = material.CurrentStock,
                    AlertThreshold = material.AlertThreshold,
                    IsNotified = false,
                    IsResolved = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.MaterialAlerts.Add(alert);
                await _context.SaveChangesAsync();

                _logger.LogWarning("Low stock alert created: Material {MaterialId} {MaterialName}, Stock {Stock}, Threshold {Threshold}",
                    material.Id, material.Name, material.CurrentStock, material.AlertThreshold);
            }
        }
    }

    private async Task ResolveAlertsIfStockRecoveredAsync(int materialId)
    {
        var material = await _context.Materials.FindAsync(materialId);
        if (material is null) return;

        // 如果庫存已恢復到警戒值以上，解除告警
        if (material.CurrentStock > material.AlertThreshold)
        {
            var unresolvedAlerts = await _context.MaterialAlerts
                .Where(a => a.MaterialId == materialId && !a.IsResolved)
                .ToListAsync();

            foreach (var alert in unresolvedAlerts)
            {
                alert.IsResolved = true;
                alert.ResolvedAt = DateTime.UtcNow;
            }

            if (unresolvedAlerts.Any())
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Alerts resolved for material {MaterialId} due to stock recovery", materialId);
            }
        }
    }

    public async Task<IEnumerable<MaterialAlert>> GetActiveAlertsAsync()
    {
        return await _context.MaterialAlerts
            .Include(a => a.Material)
            .Where(a => !a.IsResolved)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task ResolveAlertAsync(int alertId)
    {
        var alert = await _context.MaterialAlerts.FindAsync(alertId);
        if (alert is null) return;

        alert.IsResolved = true;
        alert.ResolvedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Alert {AlertId} manually resolved", alertId);
    }

    public async Task<object> GetMaterialStatusAsync()
    {
        var materials = await _context.Materials
            .Where(m => m.Status == MaterialStatus.Active)
            .ToListAsync();

        var totalCount = materials.Count;
        var lowStockCount = materials.Count(m => m.CurrentStock <= m.AlertThreshold && m.CurrentStock > 0);
        var outOfStockCount = materials.Count(m => m.CurrentStock <= 0);
        var normalCount = materials.Count(m => m.CurrentStock > m.AlertThreshold);

        var activeAlertCount = await _context.MaterialAlerts.CountAsync(a => !a.IsResolved);

        return new
        {
            totalCount,
            normalCount,
            lowStockCount,
            outOfStockCount,
            activeAlertCount
        };
    }

    public async Task<IEnumerable<Material>> GetLowStockMaterialsAsync()
    {
        return await _context.Materials
            .Where(m => m.Status == MaterialStatus.Active && m.CurrentStock <= m.AlertThreshold)
            .OrderBy(m => m.CurrentStock)
            .ToListAsync();
    }
}
