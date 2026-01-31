namespace FindHoneyPos.Tests.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Infrastructure.Data;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;

public class DashboardServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly DashboardService _service;

    public DashboardServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _service = new DashboardService(_context);
    }

    public void Dispose() => _context.Dispose();

    private async Task SeedTodayOrder(decimal total = 100m, OrderStatus status = OrderStatus.Completed, string? customerTag = null, List<OrderItem>? items = null)
    {
        var today = DateTime.UtcNow.Date;
        var order = TestDataBuilder.CreateOrder(total: total, status: status, timestamp: today.AddHours(10), customerTag: customerTag);
        order.OrderNumber = $"#T{_context.Orders.Count() + 1}";
        order.DailySequence = 126 + _context.Orders.Count();
        if (items != null)
            foreach (var item in items) order.Items.Add(item);
        else
            order.Items.Add(TestDataBuilder.CreateOrderItem());
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
    }

    private async Task SeedYesterdayOrder(decimal total = 100m, List<OrderItem>? items = null)
    {
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        var order = TestDataBuilder.CreateOrder(total: total, status: OrderStatus.Completed, timestamp: yesterday.AddHours(10));
        order.OrderNumber = $"#Y{_context.Orders.Count() + 1}";
        order.DailySequence = 126 + _context.Orders.Count();
        if (items != null)
            foreach (var item in items) order.Items.Add(item);
        else
            order.Items.Add(TestDataBuilder.CreateOrderItem());
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
    }

    #region GetKpiAsync

    [Fact]
    public async Task GetKpiAsync_ShouldReturn4Cards()
    {
        var result = await _service.GetKpiAsync();

        var cards = (result as IEnumerable<object>)!.ToList();
        cards.Should().HaveCount(4);
    }

    [Fact]
    public async Task GetKpiAsync_ShouldCalculateTodayRevenue()
    {
        await SeedTodayOrder(total: 300m);
        await SeedTodayOrder(total: 200m);

        var result = await _service.GetKpiAsync();
        var cards = (result as IEnumerable<object>)!.ToList();
        var firstCard = ToDictionary(cards[0]);

        firstCard["value"].Should().Be("NT$ 500");
    }

    [Fact]
    public async Task GetKpiAsync_YesterdayZero_ShouldNotDivideByZero()
    {
        await SeedTodayOrder(total: 100m);

        var result = await _service.GetKpiAsync();
        var cards = (result as IEnumerable<object>)!.ToList();
        var firstCard = ToDictionary(cards[0]);

        firstCard["change"].Should().Be("+0%");
    }

    [Fact]
    public async Task GetKpiAsync_ShouldCalculateComparisonPercentage()
    {
        await SeedYesterdayOrder(total: 200m);
        await SeedTodayOrder(total: 300m);

        var result = await _service.GetKpiAsync();
        var cards = (result as IEnumerable<object>)!.ToList();
        var firstCard = ToDictionary(cards[0]);

        // (300-200)/200 * 100 = 50%
        firstCard["change"].Should().Be("+50.0%");
    }

    [Fact]
    public async Task GetKpiAsync_ShouldCountActiveProducts()
    {
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "A", status: ProductStatus.Active));
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "B", status: ProductStatus.Inactive));
        await _context.SaveChangesAsync();

        var result = await _service.GetKpiAsync();
        var cards = (result as IEnumerable<object>)!.ToList();
        var productCard = ToDictionary(cards[2]);

        productCard["value"].Should().Be("1");
    }

    #endregion

    #region GetSalesTrendAsync

    [Fact]
    public async Task GetSalesTrendAsync_ShouldReturnCorrectNumberOfDays()
    {
        var result = await _service.GetSalesTrendAsync(7);

        var trend = (result as IEnumerable<object>)!.ToList();
        trend.Should().HaveCount(7);
    }

    [Fact]
    public async Task GetSalesTrendAsync_ShouldExcludeCancelledOrders()
    {
        await SeedTodayOrder(total: 200m, status: OrderStatus.Completed);
        await SeedTodayOrder(total: 100m, status: OrderStatus.Cancelled);

        var result = await _service.GetSalesTrendAsync(1);
        var trend = (result as IEnumerable<object>)!.ToList();
        var today = ToDictionary(trend.Last());

        ((decimal)today["sales"]).Should().Be(200m);
    }

    #endregion

    #region GetAddonKpiAsync

    [Fact]
    public async Task GetAddonKpiAsync_ShouldReturn3Cards()
    {
        var result = await _service.GetAddonKpiAsync();

        var cards = (result as IEnumerable<object>)!.ToList();
        cards.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetAddonKpiAsync_ShouldCalculateAddonRevenue()
    {
        var item = TestDataBuilder.CreateOrderItem(price: 50m, quantity: 1);
        item.Addons.Add(TestDataBuilder.CreateAddon(price: 10m));
        item.Addons.Add(TestDataBuilder.CreateAddon(productName: "椰果", price: 15m));
        item.Subtotal = (50m + 10m + 15m) * 1;
        await SeedTodayOrder(items: new List<OrderItem> { item });

        var result = await _service.GetAddonKpiAsync();
        var cards = (result as IEnumerable<object>)!.ToList();
        var revenueCard = ToDictionary(cards[0]);

        revenueCard["value"].Should().Be("NT$ 25");
    }

    [Fact]
    public async Task GetAddonKpiAsync_ShouldCalculateAddonRate()
    {
        var itemWithAddon = TestDataBuilder.CreateOrderItem(price: 50m, quantity: 1);
        itemWithAddon.Addons.Add(TestDataBuilder.CreateAddon(price: 10m));
        itemWithAddon.Subtotal = 60m;

        var itemWithoutAddon = TestDataBuilder.CreateOrderItem(productName: "紅茶", price: 30m, quantity: 1);
        itemWithoutAddon.Subtotal = 30m;

        await SeedTodayOrder(items: new List<OrderItem> { itemWithAddon, itemWithoutAddon });

        var result = await _service.GetAddonKpiAsync();
        var cards = (result as IEnumerable<object>)!.ToList();
        var rateCard = ToDictionary(cards[2]);

        // 1 out of 2 items has addon = 50%
        rateCard["value"].Should().Be("50.0%");
    }

    #endregion

    #region GetCustomerTagKpiAsync

    [Fact]
    public async Task GetCustomerTagKpiAsync_ShouldParseCommaSeparatedTags()
    {
        await SeedTodayOrder(total: 200m, customerTag: "男,成人");
        await SeedTodayOrder(total: 150m, customerTag: "女,學生");

        var result = await _service.GetCustomerTagKpiAsync();
        var dict = ToDictionary(result);
        var gender = (dict["gender"] as IEnumerable<object>)!.Select(ToDictionary).ToList();

        gender.First(g => (string)g["tag"] == "男")["orders"].Should().Be(1);
        gender.First(g => (string)g["tag"] == "女")["orders"].Should().Be(1);
    }

    [Fact]
    public async Task GetCustomerTagKpiAsync_ShouldCountUntagged()
    {
        await SeedTodayOrder(total: 100m, customerTag: null);
        await SeedTodayOrder(total: 200m, customerTag: "男,成人");

        var result = await _service.GetCustomerTagKpiAsync();
        var dict = ToDictionary(result);
        var gender = (dict["gender"] as IEnumerable<object>)!.Select(ToDictionary).ToList();

        gender.First(g => (string)g["tag"] == "未標記")["orders"].Should().Be(1);
    }

    [Fact]
    public async Task GetCustomerTagKpiAsync_ShouldGroupByGenderAndAge()
    {
        await SeedTodayOrder(total: 100m, customerTag: "男,成人");

        var result = await _service.GetCustomerTagKpiAsync();
        var dict = ToDictionary(result);

        dict.Should().ContainKey("gender");
        dict.Should().ContainKey("age");
    }

    #endregion

    #region GetTopProductsAsync

    [Fact]
    public async Task GetTopProducts_ShouldOrderBySalesDescending()
    {
        var item1 = TestDataBuilder.CreateOrderItem(productName: "奶茶", price: 50m, quantity: 5);
        item1.Subtotal = 250m;
        var item2 = TestDataBuilder.CreateOrderItem(productName: "紅茶", price: 30m, quantity: 10);
        item2.Subtotal = 300m;
        await SeedTodayOrder(items: new List<OrderItem> { item1, item2 });

        var result = await _service.GetTopProductsAsync(10);
        var top = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        top[0]["name"].Should().Be("紅茶");
        top[1]["name"].Should().Be("奶茶");
    }

    [Fact]
    public async Task GetTopProducts_ShouldRespectLimit()
    {
        var item1 = TestDataBuilder.CreateOrderItem(productName: "A", price: 10m, quantity: 3);
        item1.Subtotal = 30m;
        var item2 = TestDataBuilder.CreateOrderItem(productName: "B", price: 20m, quantity: 2);
        item2.Subtotal = 40m;
        var item3 = TestDataBuilder.CreateOrderItem(productName: "C", price: 30m, quantity: 1);
        item3.Subtotal = 30m;
        await SeedTodayOrder(items: new List<OrderItem> { item1, item2, item3 });

        var result = await _service.GetTopProductsAsync(2);
        var top = (result as IEnumerable<object>)!.ToList();

        top.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetTopProducts_ShouldCalculateCorrectSalesAndRevenue()
    {
        var item1 = TestDataBuilder.CreateOrderItem(productName: "奶茶", price: 60m, quantity: 3);
        item1.Subtotal = 180m;
        await SeedTodayOrder(items: new List<OrderItem> { item1 });

        var item2 = TestDataBuilder.CreateOrderItem(productName: "奶茶", price: 60m, quantity: 2);
        item2.Subtotal = 120m;
        await SeedTodayOrder(items: new List<OrderItem> { item2 });

        var result = await _service.GetTopProductsAsync(10);
        var top = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();
        var milkTea = top.First(t => (string)t["name"] == "奶茶");

        ((int)milkTea["sales"]).Should().Be(5);
        ((string)milkTea["revenue"]).Should().Be("NT$ 300");
    }

    #endregion

    private static Dictionary<string, object> ToDictionary(object obj)
    {
        return obj.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(obj)!);
    }
}
