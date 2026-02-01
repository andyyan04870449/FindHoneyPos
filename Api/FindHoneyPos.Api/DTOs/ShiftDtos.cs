namespace FindHoneyPos.Api.DTOs;

public record OpenShiftRequest(string? DeviceId);

public record ShiftResponse(
    int Id,
    string? DeviceId,
    string Status,
    DateTime OpenedAt,
    DateTime? ClosedAt,
    int TotalOrders,
    decimal TotalRevenue,
    decimal TotalDiscount,
    decimal NetRevenue,
    int? SettlementId
);

public record CloseShiftRequest(
    Dictionary<int, int> InventoryCounts,
    int? IncentiveTarget,
    int? IncentiveItemsSold,
    bool? IncentiveAchieved
);

public record ShiftStatusResponse(bool HasOpenShift, ShiftResponse? Shift);
