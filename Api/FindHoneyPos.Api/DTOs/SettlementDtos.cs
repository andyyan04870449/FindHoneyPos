namespace FindHoneyPos.Api.DTOs;

public record SubmitSettlementRequest(
    string? DeviceId,
    Dictionary<int, int> InventoryCounts
);

public record SettlementResponse(
    int Id,
    string Date,
    int TotalOrders,
    decimal TotalRevenue,
    decimal TotalDiscount,
    decimal NetRevenue,
    string? DeviceId,
    DateTime SubmittedAt
);
