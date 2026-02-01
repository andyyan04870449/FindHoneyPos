namespace FindHoneyPos.Api.DTOs;

public record CreateProductRequest(
    string Name,
    decimal Price,
    string Status = "Active",
    bool IsOnPromotion = false,
    decimal? PromotionPrice = null,
    string? Category = null,
    int SortOrder = 0
);

public record UpdateProductRequest(
    string Name,
    decimal Price,
    string Status,
    bool IsOnPromotion,
    decimal? PromotionPrice,
    string? Category,
    int SortOrder
);

public record ProductResponse(
    int Id,
    string Name,
    decimal Price,
    string Status,
    bool IsOnPromotion,
    decimal? PromotionPrice,
    string? Category,
    int SortOrder,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
