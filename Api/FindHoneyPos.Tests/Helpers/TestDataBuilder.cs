namespace FindHoneyPos.Tests.Helpers;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;

public static class TestDataBuilder
{
    public static Product CreateProduct(
        string name = "測試商品",
        decimal price = 100m,
        ProductStatus status = ProductStatus.Active,
        string? category = "飲料",
        int sortOrder = 0,
        bool isPopular = false)
    {
        return new Product
        {
            Name = name,
            Price = price,
            Status = status,
            Category = category,
            SortOrder = sortOrder,
            IsPopular = isPopular,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }

    public static Order CreateOrder(
        decimal subtotal = 100m,
        decimal total = 100m,
        decimal discountAmount = 0m,
        OrderStatus status = OrderStatus.Completed,
        PaymentMethod paymentMethod = PaymentMethod.Cash,
        DateTime? timestamp = null,
        string? deviceId = null,
        string? customerTag = null,
        int dailySequence = 0)
    {
        return new Order
        {
            Subtotal = subtotal,
            Total = total,
            DiscountAmount = discountAmount,
            Status = status,
            PaymentMethod = paymentMethod,
            Timestamp = timestamp ?? DateTime.UtcNow,
            DeviceId = deviceId,
            CustomerTag = customerTag,
            DailySequence = dailySequence,
        };
    }

    public static OrderItem CreateOrderItem(
        string productName = "測試商品",
        decimal price = 50m,
        int quantity = 1,
        int? productId = null)
    {
        return new OrderItem
        {
            ProductName = productName,
            Price = price,
            Quantity = quantity,
            ProductId = productId,
        };
    }

    public static OrderItemAddon CreateAddon(
        string productName = "珍珠",
        decimal price = 10m,
        int? productId = null)
    {
        return new OrderItemAddon
        {
            ProductName = productName,
            Price = price,
            ProductId = productId,
        };
    }

    public static AdminUser CreateAdminUser(
        string username = "admin",
        string displayName = "管理員",
        UserRole role = UserRole.Admin,
        bool isActive = true)
    {
        return new AdminUser
        {
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            DisplayName = displayName,
            IsActive = isActive,
            Role = role,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }

    public static Discount CreateDiscount(
        string name = "測試折扣",
        DiscountType type = DiscountType.Percentage,
        decimal value = 10m,
        decimal minPurchase = 0m,
        bool isActive = true)
    {
        return new Discount
        {
            Name = name,
            Type = type,
            Value = value,
            MinPurchase = minPurchase,
            IsActive = isActive,
            CreatedAt = DateTime.UtcNow,
        };
    }

    public static MessageTemplate CreateTemplate(
        string name = "測試模板",
        string type = "promotion",
        string content = "測試訊息內容",
        bool isActive = true)
    {
        return new MessageTemplate
        {
            Name = name,
            Type = type,
            Content = content,
            IsActive = isActive,
        };
    }
}
