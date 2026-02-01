namespace FindHoneyPos.Api.DTOs;

public record SubmitSettlementRequest(
    string? DeviceId,
    Dictionary<int, int> InventoryCounts,
    int? IncentiveTarget,
    int? IncentiveItemsSold,
    bool? IncentiveAchieved
);

public record SettlementResponse(
    int Id,
    string Date,
    int TotalOrders,
    decimal TotalRevenue,
    decimal TotalDiscount,
    decimal NetRevenue,
    string? DeviceId,
    DateTime SubmittedAt,
    int IncentiveTarget,
    int IncentiveItemsSold,
    bool IncentiveAchieved
);

public record InventoryCountItem(
    int ProductId,
    string ProductName,
    int Quantity,
    int SoldQuantity
);

public record SettlementDetailResponse(
    int Id,
    string Date,
    int TotalOrders,
    decimal TotalRevenue,
    decimal TotalDiscount,
    decimal NetRevenue,
    string? DeviceId,
    DateTime SubmittedAt,
    int IncentiveTarget,
    int IncentiveItemsSold,
    bool IncentiveAchieved,
    List<InventoryCountItem> InventoryCounts
);
