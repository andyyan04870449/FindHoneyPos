namespace FindHoneyPos.Api.DTOs;

public record CreateProductRequest(
    string Name,
    decimal Price,
    string Status = "Active",
    bool IsPopular = false,
    string? Category = null,
    int SortOrder = 0
);

public record UpdateProductRequest(
    string Name,
    decimal Price,
    string Status,
    bool IsPopular,
    string? Category,
    int SortOrder
);

public record ProductResponse(
    int Id,
    string Name,
    decimal Price,
    string Status,
    bool IsPopular,
    string? Category,
    int SortOrder,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
