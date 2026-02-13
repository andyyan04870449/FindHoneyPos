namespace FindHoneyPos.Tests.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;
using Moq;

public class DailySettlementServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly DailySettlementService _service;
    private readonly Mock<ILineWebhookService> _lineWebhookServiceMock;

    public DailySettlementServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _lineWebhookServiceMock = new Mock<ILineWebhookService>();
        _service = new DailySettlementService(_context, _lineWebhookServiceMock.Object);
    }

    public void Dispose() => _context.Dispose();

    private async Task SeedTodayCompletedOrder(decimal subtotal = 100m, decimal total = 100m, decimal discountAmount = 0m)
    {
        var today = DateTime.UtcNow.Date;
        var order = TestDataBuilder.CreateOrder(subtotal: subtotal, total: total, discountAmount: discountAmount,
            status: OrderStatus.Completed, timestamp: today.AddHours(10));
        order.OrderNumber = $"#D{_context.Orders.Count() + 1}";
        order.DailySequence = 126 + _context.Orders.Count();
        order.Items.Add(TestDataBuilder.CreateOrderItem());
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
    }

    #region SubmitAsync

    [Fact]
    public async Task SubmitAsync_ShouldCalculateFromCompletedOrders()
    {
        await SeedTodayCompletedOrder(subtotal: 210m, total: 200m, discountAmount: 10m);
        await SeedTodayCompletedOrder(subtotal: 320m, total: 300m, discountAmount: 20m);

        var settlement = new DailySettlement();
        var result = await _service.SubmitAsync(settlement);

        result.TotalOrders.Should().Be(2);
        result.TotalRevenue.Should().Be(530m);    // 210 + 320 (subtotal sum)
        result.TotalDiscount.Should().Be(30m);    // 10 + 20
        result.NetRevenue.Should().Be(500m);      // 530 - 30 = 500
    }

    [Fact]
    public async Task SubmitAsync_ShouldSetDateToToday()
    {
        var settlement = new DailySettlement();
        var result = await _service.SubmitAsync(settlement);

        result.Date.Should().Be(DateOnly.FromDateTime(DateTime.UtcNow));
    }

    [Fact]
    public async Task SubmitAsync_ShouldSetSubmittedAt()
    {
        var before = DateTime.UtcNow;
        var settlement = new DailySettlement();
        var result = await _service.SubmitAsync(settlement);

        result.SubmittedAt.Should().BeOnOrAfter(before);
    }

    [Fact]
    public async Task SubmitAsync_ShouldExcludeCancelledOrders()
    {
        await SeedTodayCompletedOrder(subtotal: 200m, total: 200m);

        var today = DateTime.UtcNow.Date;
        var cancelled = TestDataBuilder.CreateOrder(total: 100m, status: OrderStatus.Cancelled, timestamp: today.AddHours(11));
        cancelled.OrderNumber = "#DC1";
        cancelled.DailySequence = 999;
        cancelled.Items.Add(TestDataBuilder.CreateOrderItem());
        _context.Orders.Add(cancelled);
        await _context.SaveChangesAsync();

        var settlement = new DailySettlement();
        var result = await _service.SubmitAsync(settlement);

        result.TotalOrders.Should().Be(1);
        result.TotalRevenue.Should().Be(200m);
    }

    [Fact]
    public async Task SubmitAsync_NoOrders_ShouldReturnZeros()
    {
        var settlement = new DailySettlement();
        var result = await _service.SubmitAsync(settlement);

        result.TotalOrders.Should().Be(0);
        result.TotalRevenue.Should().Be(0m);
    }

    #endregion

    #region GetTodayAsync

    [Fact]
    public async Task GetTodayAsync_NoSettlement_ShouldReturnNull()
    {
        var result = await _service.GetTodayAsync();

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetTodayAsync_HasSettlement_ShouldReturn()
    {
        var settlement = new DailySettlement();
        await _service.SubmitAsync(settlement);

        var result = await _service.GetTodayAsync();

        result.Should().NotBeNull();
        result!.Date.Should().Be(DateOnly.FromDateTime(DateTime.UtcNow));
    }

    [Fact]
    public async Task GetTodayAsync_ShouldIncludeInventoryCounts()
    {
        var product = TestDataBuilder.CreateProduct(name: "奶茶");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var settlement = new DailySettlement();
        settlement.InventoryCounts.Add(new InventoryCount
        {
            ProductId = product.Id,
            Quantity = 50,
        });
        await _service.SubmitAsync(settlement);

        var result = await _service.GetTodayAsync();

        result.Should().NotBeNull();
        result!.InventoryCounts.Should().HaveCount(1);
        result.InventoryCounts.First().Quantity.Should().Be(50);
    }

    #endregion
}
