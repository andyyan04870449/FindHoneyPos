namespace FindHoneyPos.Api.DTOs;

public record CreateOrderRequest(
    List<CreateOrderItemRequest> Items,
    string? DeviceId = null,
    string? DiscountType = null,
    decimal? DiscountValue = null,
    decimal DiscountAmount = 0,
    string PaymentMethod = "現金",
    DateTime? Timestamp = null,
    string? CustomerTag = null
);

public record CreateOrderItemRequest(
    int? ProductId,
    string ProductName,
    decimal Price,
    int Quantity,
    List<CreateOrderItemAddonRequest>? Addons = null
);

public record CreateOrderItemAddonRequest(
    int? ProductId,
    string ProductName,
    decimal Price
);

public record BatchOrdersRequest(List<CreateOrderRequest> Orders);

public record BatchSyncOrderItem(
    string LocalId,
    CreateOrderRequest Request,
    DateTime? CreatedAt = null
);

public record BatchSyncRequest(List<BatchSyncOrderItem> Orders);

public record OrderResponse(
    int Id,
    string OrderNumber,
    DateTime Timestamp,
    List<OrderItemResponse> Items,
    decimal Subtotal,
    decimal DiscountAmount,
    string? DiscountType,
    decimal? DiscountValue,
    decimal Total,
    string Status,
    string PaymentMethod,
    string? CustomerTag
);

public record OrderItemResponse(
    string Name,
    decimal Price,
    int Quantity,
    decimal Subtotal,
    List<OrderItemAddonResponse> Addons
);

public record OrderItemAddonResponse(
    string Name,
    decimal Price
);
