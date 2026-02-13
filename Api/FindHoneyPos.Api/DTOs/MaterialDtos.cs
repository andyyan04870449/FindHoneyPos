namespace FindHoneyPos.Api.DTOs;

public record CreateMaterialRequest(
    string Name,
    string Unit,
    decimal CurrentStock = 0,
    decimal AlertThreshold = 0,
    string Status = "Active"
);

public record UpdateMaterialRequest(
    string Name,
    string Unit,
    decimal AlertThreshold,
    string Status
);

public record MaterialResponse(
    int Id,
    string Name,
    string Unit,
    decimal CurrentStock,
    decimal AlertThreshold,
    string Status,
    bool IsLowStock,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record StockInRequest(
    decimal Quantity,
    string? Note = null
);

public record StockAdjustRequest(
    decimal NewStock,
    string? Note = null
);

public record StockWasteRequest(
    decimal Quantity,
    string? Note = null
);

public record StockRecordResponse(
    int Id,
    int MaterialId,
    string MaterialName,
    string ChangeType,
    decimal Quantity,
    decimal StockBefore,
    decimal StockAfter,
    int? OrderId,
    string? Note,
    DateTime CreatedAt
);

public record MaterialAlertResponse(
    int Id,
    int MaterialId,
    string MaterialName,
    string Unit,
    decimal StockLevel,
    decimal AlertThreshold,
    bool IsNotified,
    DateTime CreatedAt
);

public record MaterialStatusResponse(
    int TotalCount,
    int NormalCount,
    int LowStockCount,
    int OutOfStockCount,
    int ActiveAlertCount
);
