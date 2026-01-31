namespace FindHoneyPos.Tests.Services;

using FindHoneyPos.Core.Constants;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;

public class OrderServiceTests : IDisposable
{
    private readonly Infrastructure.Data.AppDbContext _context;
    private readonly OrderService _service;

    public OrderServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _service = new OrderService(_context);
    }

    public void Dispose() => _context.Dispose();

    // ===== CreateAsync =====

    [Fact]
    public async Task CreateAsync_ShouldGenerateDailySequence_WhenNotProvided()
    {
        var order = TestDataBuilder.CreateOrder();
        order.Items.Add(TestDataBuilder.CreateOrderItem());

        var result = await _service.CreateAsync(order);

        result.DailySequence.Should().Be(BusinessRules.InitialOrderSequence + 1);
    }

    [Fact]
    public async Task CreateAsync_ShouldGenerateOrderNumber_WithCorrectFormat()
    {
        var order = TestDataBuilder.CreateOrder();
        order.Items.Add(TestDataBuilder.CreateOrderItem());

        var result = await _service.CreateAsync(order);

        result.OrderNumber.Should().Be("#0126");
    }

    [Fact]
    public async Task CreateAsync_ShouldCalculateSubtotal_WithAddonPrices()
    {
        var order = TestDataBuilder.CreateOrder();
        var item = TestDataBuilder.CreateOrderItem(price: 50m, quantity: 2);
        item.Addons.Add(TestDataBuilder.CreateAddon(price: 10m));
        item.Addons.Add(TestDataBuilder.CreateAddon(productName: "椰果", price: 15m));
        order.Items.Add(item);

        var result = await _service.CreateAsync(order);

        // (50 + 10 + 15) * 2 = 150
        result.Items.First().Subtotal.Should().Be(150m);
    }

    [Fact]
    public async Task CreateAsync_ShouldCalculateSubtotal_WithoutAddons()
    {
        var order = TestDataBuilder.CreateOrder();
        order.Items.Add(TestDataBuilder.CreateOrderItem(price: 80m, quantity: 3));

        var result = await _service.CreateAsync(order);

        // 80 * 3 = 240
        result.Items.First().Subtotal.Should().Be(240m);
    }

    [Fact]
    public async Task CreateAsync_ShouldIncrementDailySequence()
    {
        var order1 = TestDataBuilder.CreateOrder();
        order1.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(order1);

        var order2 = TestDataBuilder.CreateOrder();
        order2.Items.Add(TestDataBuilder.CreateOrderItem());
        var result = await _service.CreateAsync(order2);

        result.DailySequence.Should().Be(BusinessRules.InitialOrderSequence + 2);
        result.OrderNumber.Should().Be("#0127");
    }

    [Fact]
    public async Task CreateAsync_ShouldPreserveDailySequence_WhenAlreadySet()
    {
        var order = TestDataBuilder.CreateOrder(dailySequence: 200);
        order.Items.Add(TestDataBuilder.CreateOrderItem());

        var result = await _service.CreateAsync(order);

        result.DailySequence.Should().Be(200);
    }

    [Fact]
    public async Task CreateAsync_ShouldPreserveOrderNumber_WhenAlreadySet()
    {
        var order = TestDataBuilder.CreateOrder();
        order.OrderNumber = "#9999";
        order.DailySequence = 9999;
        order.Items.Add(TestDataBuilder.CreateOrderItem());

        var result = await _service.CreateAsync(order);

        result.OrderNumber.Should().Be("#9999");
    }

    [Fact]
    public async Task CreateAsync_ShouldHandleMultipleItemsWithAddons()
    {
        var order = TestDataBuilder.CreateOrder();

        var item1 = TestDataBuilder.CreateOrderItem(price: 100m, quantity: 1);
        item1.Addons.Add(TestDataBuilder.CreateAddon(price: 20m));
        order.Items.Add(item1);

        var item2 = TestDataBuilder.CreateOrderItem(productName: "紅茶", price: 40m, quantity: 2);
        order.Items.Add(item2);

        var result = await _service.CreateAsync(order);

        result.Items.First(i => i.ProductName == "測試商品").Subtotal.Should().Be(120m); // (100+20)*1
        result.Items.First(i => i.ProductName == "紅茶").Subtotal.Should().Be(80m); // 40*2
    }

    // ===== BatchCreateAsync =====

    [Fact]
    public async Task BatchCreateAsync_ShouldDetectDuplicate_ByDeviceIdAndTimestamp()
    {
        var timestamp = DateTime.UtcNow;
        var order1 = TestDataBuilder.CreateOrder(deviceId: "device1", timestamp: timestamp);
        order1.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(order1);

        var duplicate = TestDataBuilder.CreateOrder(deviceId: "device1", timestamp: timestamp);
        duplicate.Items.Add(TestDataBuilder.CreateOrderItem());

        var results = await _service.BatchCreateAsync(new[] { duplicate });

        results.Should().BeEmpty();
    }

    [Fact]
    public async Task BatchCreateAsync_ShouldAllowSameTimestamp_WithDifferentDeviceId()
    {
        var timestamp = DateTime.UtcNow;
        var order1 = TestDataBuilder.CreateOrder(deviceId: "device1", timestamp: timestamp);
        order1.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(order1);

        var order2 = TestDataBuilder.CreateOrder(deviceId: "device2", timestamp: timestamp);
        order2.Items.Add(TestDataBuilder.CreateOrderItem());

        var results = await _service.BatchCreateAsync(new[] { order2 });

        results.Should().HaveCount(1);
    }

    [Fact]
    public async Task BatchCreateAsync_ShouldNotSkip_WhenDeviceIdIsNull()
    {
        var timestamp = DateTime.UtcNow;
        var order = TestDataBuilder.CreateOrder(deviceId: null, timestamp: timestamp);
        order.Items.Add(TestDataBuilder.CreateOrderItem());

        var results = await _service.BatchCreateAsync(new[] { order });

        results.Should().HaveCount(1);
    }

    [Fact]
    public async Task BatchCreateAsync_ShouldCreateMultipleOrders()
    {
        var orders = Enumerable.Range(0, 3).Select(i =>
        {
            var o = TestDataBuilder.CreateOrder(deviceId: $"device{i}");
            o.Items.Add(TestDataBuilder.CreateOrderItem());
            return o;
        });

        var results = await _service.BatchCreateAsync(orders);

        results.Should().HaveCount(3);
    }

    // ===== GetAllAsync =====

    [Fact]
    public async Task GetAllAsync_ShouldReturnPaginatedResults()
    {
        for (int i = 0; i < 25; i++)
        {
            var o = TestDataBuilder.CreateOrder();
            o.Items.Add(TestDataBuilder.CreateOrderItem());
            await _service.CreateAsync(o);
        }

        var (orders, total) = await _service.GetAllAsync(page: 1, pageSize: 10);

        orders.Count().Should().Be(10);
        total.Should().Be(25);
    }

    [Fact]
    public async Task GetAllAsync_ShouldFilterByStatus()
    {
        var completed = TestDataBuilder.CreateOrder(status: OrderStatus.Completed);
        completed.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(completed);

        var cancelled = TestDataBuilder.CreateOrder(status: OrderStatus.Cancelled);
        cancelled.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(cancelled);

        var (orders, total) = await _service.GetAllAsync(status: OrderStatus.Completed);

        total.Should().Be(1);
        orders.First().Status.Should().Be(OrderStatus.Completed);
    }

    [Fact]
    public async Task GetAllAsync_ShouldFilterByDateRange()
    {
        var today = DateTime.UtcNow.Date;
        var todayOrder = TestDataBuilder.CreateOrder(timestamp: today.AddHours(10));
        todayOrder.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(todayOrder);

        var oldOrder = TestDataBuilder.CreateOrder(timestamp: today.AddDays(-5));
        oldOrder.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(oldOrder);

        var (orders, total) = await _service.GetAllAsync(startDate: today, endDate: today.AddDays(1));

        total.Should().Be(1);
    }

    [Fact]
    public async Task GetAllAsync_ShouldIncludeItemsAndAddons()
    {
        var order = TestDataBuilder.CreateOrder();
        var item = TestDataBuilder.CreateOrderItem();
        item.Addons.Add(TestDataBuilder.CreateAddon());
        order.Items.Add(item);
        await _service.CreateAsync(order);

        var (orders, _) = await _service.GetAllAsync();

        var first = orders.First();
        first.Items.Should().HaveCount(1);
        first.Items.First().Addons.Should().HaveCount(1);
    }

    // ===== GetByIdAsync =====

    [Fact]
    public async Task GetByIdAsync_ShouldReturnCompleteOrder()
    {
        var order = TestDataBuilder.CreateOrder();
        var item = TestDataBuilder.CreateOrderItem();
        item.Addons.Add(TestDataBuilder.CreateAddon());
        order.Items.Add(item);
        var created = await _service.CreateAsync(order);

        var result = await _service.GetByIdAsync(created.Id);

        result.Should().NotBeNull();
        result!.Items.Should().HaveCount(1);
        result.Items.First().Addons.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotFound()
    {
        var result = await _service.GetByIdAsync(999);

        result.Should().BeNull();
    }

    // ===== GetStatsAsync =====

    [Fact]
    public async Task GetStatsAsync_ShouldOnlyCountTodayOrders()
    {
        var today = DateTime.UtcNow.Date;

        var todayOrder = TestDataBuilder.CreateOrder(total: 200m, timestamp: today.AddHours(10));
        todayOrder.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(todayOrder);

        var oldOrder = TestDataBuilder.CreateOrder(total: 300m, timestamp: today.AddDays(-1));
        oldOrder.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(oldOrder);

        dynamic stats = await _service.GetStatsAsync();

        ((int)stats.totalOrders).Should().Be(1);
    }

    [Fact]
    public async Task GetStatsAsync_ShouldSeparateCompletedAndCancelled()
    {
        var today = DateTime.UtcNow.Date;

        var completed = TestDataBuilder.CreateOrder(total: 100m, status: OrderStatus.Completed, timestamp: today.AddHours(10));
        completed.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(completed);

        var cancelled = TestDataBuilder.CreateOrder(total: 50m, status: OrderStatus.Cancelled, timestamp: today.AddHours(11));
        cancelled.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(cancelled);

        dynamic stats = await _service.GetStatsAsync();

        ((int)stats.completedOrders).Should().Be(1);
        ((int)stats.cancelledOrders).Should().Be(1);
        ((decimal)stats.totalRevenue).Should().Be(100m);
    }

    [Fact]
    public async Task GetStatsAsync_ShouldSumRevenueOnlyFromCompleted()
    {
        var today = DateTime.UtcNow.Date;

        var c1 = TestDataBuilder.CreateOrder(total: 150m, status: OrderStatus.Completed, timestamp: today.AddHours(10));
        c1.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(c1);

        var c2 = TestDataBuilder.CreateOrder(total: 250m, status: OrderStatus.Completed, timestamp: today.AddHours(11));
        c2.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(c2);

        var cancelled = TestDataBuilder.CreateOrder(total: 999m, status: OrderStatus.Cancelled, timestamp: today.AddHours(12));
        cancelled.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(cancelled);

        dynamic stats = await _service.GetStatsAsync();

        ((decimal)stats.totalRevenue).Should().Be(400m);
    }

    // ===== GetNextDailySequenceAsync =====

    [Fact]
    public async Task GetNextDailySequenceAsync_ShouldReturnInitialPlusOne_WhenNoOrders()
    {
        var result = await _service.GetNextDailySequenceAsync();

        result.Should().Be(BusinessRules.InitialOrderSequence + 1);
    }

    [Fact]
    public async Task GetNextDailySequenceAsync_ShouldIgnoreYesterdayOrders()
    {
        var yesterday = DateTime.UtcNow.Date.AddDays(-1).AddHours(10);
        var old = TestDataBuilder.CreateOrder(timestamp: yesterday);
        old.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(old);

        var result = await _service.GetNextDailySequenceAsync();

        result.Should().Be(BusinessRules.InitialOrderSequence + 1);
    }

    [Fact]
    public async Task GetNextDailySequenceAsync_ShouldReturnNextAfterExisting()
    {
        var order = TestDataBuilder.CreateOrder();
        order.Items.Add(TestDataBuilder.CreateOrderItem());
        await _service.CreateAsync(order);

        var result = await _service.GetNextDailySequenceAsync();

        result.Should().Be(BusinessRules.InitialOrderSequence + 2);
    }
}
