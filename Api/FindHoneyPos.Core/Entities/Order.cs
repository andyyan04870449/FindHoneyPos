namespace FindHoneyPos.Core.Entities;

using FindHoneyPos.Core.Enums;

public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int DailySequence { get; set; }
    public string? DeviceId { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public DiscountType? DiscountType { get; set; }
    public decimal? DiscountValue { get; set; }
    public decimal Total { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Completed;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? CustomerTag { get; set; }

    // 班次關聯（nullable，向下相容舊訂單）
    public int? ShiftId { get; set; }
    public Shift? Shift { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
