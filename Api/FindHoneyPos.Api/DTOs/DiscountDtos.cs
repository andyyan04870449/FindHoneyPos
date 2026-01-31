namespace FindHoneyPos.Api.DTOs;

public record CreateDiscountRequest(
    string Name,
    string Type,
    decimal Value,
    decimal MinPurchase = 0,
    bool IsActive = true,
    string? Description = null
);

public record UpdateDiscountRequest(
    string Name,
    string Type,
    decimal Value,
    decimal MinPurchase,
    bool IsActive,
    string? Description
);

public record DiscountResponse(
    int Id,
    string Name,
    string Type,
    decimal Value,
    decimal MinPurchase,
    bool IsActive,
    string? Description,
    DateTime CreatedAt
);
