namespace FindHoneyPos.Tests.Services;

using System.Text;
using FindHoneyPos.Core.Constants;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Infrastructure.Data;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;

public class ReportServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ReportService _service;
    private readonly DateOnly _today;

    public ReportServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _service = new ReportService(_context);
        _today = DateOnly.FromDateTime(DateTime.UtcNow);
    }

    public void Dispose() => _context.Dispose();

    private async Task SeedOrder(DateOnly date, decimal total = 100m, decimal discountAmount = 0m,
        OrderStatus status = OrderStatus.Completed, PaymentMethod payment = PaymentMethod.Cash,
        string? customerTag = null, List<OrderItem>? items = null)
    {
        var ts = date.ToDateTime(TimeOnly.FromTimeSpan(TimeSpan.FromHours(10)), DateTimeKind.Utc);
        var order = TestDataBuilder.CreateOrder(total: total, subtotal: total + discountAmount,
            discountAmount: discountAmount, status: status, paymentMethod: payment,
            timestamp: ts, customerTag: customerTag);
        order.OrderNumber = $"#S{_context.Orders.Count() + 1}";
        order.DailySequence = 126 + _context.Orders.Count();
        if (items != null)
            foreach (var item in items) order.Items.Add(item);
        else
            order.Items.Add(TestDataBuilder.CreateOrderItem());
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
    }

    #region GetDailyReportAsync

    [Fact]
    public async Task GetDailyReport_ShouldReturnOrderCount()
    {
        await SeedOrder(_today, total: 200m);
        await SeedOrder(_today, total: 300m);

        var result = await _service.GetDailyReportAsync(_today);
        var dict = ToDictionary(result);

        ((int)dict["orderCount"]).Should().Be(2);
    }

    [Fact]
    public async Task GetDailyReport_ShouldCalculateRevenue()
    {
        await SeedOrder(_today, total: 200m);
        await SeedOrder(_today, total: 300m);

        var result = await _service.GetDailyReportAsync(_today);
        var dict = ToDictionary(result);

        ((decimal)dict["totalRevenue"]).Should().Be(500m);
    }

    [Fact]
    public async Task GetDailyReport_ShouldCalculateDiscount()
    {
        await SeedOrder(_today, total: 180m, discountAmount: 20m);

        var result = await _service.GetDailyReportAsync(_today);
        var dict = ToDictionary(result);

        ((decimal)dict["totalDiscount"]).Should().Be(20m);
    }

    [Fact]
    public async Task GetDailyReport_ShouldCalculateAverageOrderValue()
    {
        await SeedOrder(_today, total: 200m);
        await SeedOrder(_today, total: 300m);

        var result = await _service.GetDailyReportAsync(_today);
        var dict = ToDictionary(result);

        ((decimal)dict["averageOrderValue"]).Should().Be(250m);
    }

    [Fact]
    public async Task GetDailyReport_ShouldCalculateStockSold()
    {
        var item1 = TestDataBuilder.CreateOrderItem(quantity: 3);
        item1.Subtotal = 150m;
        var item2 = TestDataBuilder.CreateOrderItem(productName: "紅茶", quantity: 2);
        item2.Subtotal = 60m;
        await SeedOrder(_today, items: new List<OrderItem> { item1, item2 });

        var result = await _service.GetDailyReportAsync(_today);
        var dict = ToDictionary(result);

        ((int)dict["stockSold"]).Should().Be(5);
    }

    [Fact]
    public async Task GetDailyReport_ShouldIncludeYesterdayComparison()
    {
        var yesterday = _today.AddDays(-1);
        await SeedOrder(yesterday, total: 200m);
        await SeedOrder(_today, total: 300m);

        var result = await _service.GetDailyReportAsync(_today);
        var dict = ToDictionary(result);
        var comparison = ToDictionary(dict["comparisonYesterday"]);

        ((double)comparison["revenue"]).Should().Be(50.0); // (300-200)/200*100
    }

    #endregion

    #region GetHourlySalesAsync

    [Fact]
    public async Task GetHourlySales_ShouldCoverBusinessHours()
    {
        var result = await _service.GetHourlySalesAsync(_today);
        var hourly = (result as IEnumerable<object>)!.ToList();

        var expectedHours = BusinessRules.BusinessHourEnd - BusinessRules.BusinessHourStart + 1;
        hourly.Should().HaveCount(expectedHours);
    }

    [Fact]
    public async Task GetHourlySales_EmptyHours_ShouldBeZero()
    {
        var result = await _service.GetHourlySalesAsync(_today);
        var hourly = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        hourly.All(h => (decimal)h["sales"] == 0m).Should().BeTrue();
    }

    [Fact]
    public async Task GetHourlySales_ShouldGroupByHour()
    {
        var ts10 = _today.ToDateTime(TimeOnly.FromTimeSpan(TimeSpan.FromHours(10)), DateTimeKind.Utc);
        var order = TestDataBuilder.CreateOrder(total: 200m, timestamp: ts10);
        order.OrderNumber = "#H1";
        order.DailySequence = 126;
        order.Items.Add(TestDataBuilder.CreateOrderItem());
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var result = await _service.GetHourlySalesAsync(_today);
        var hourly = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        var hour10 = hourly.First(h => (string)h["hour"] == "10:00");
        ((decimal)hour10["sales"]).Should().Be(200m);
    }

    #endregion

    #region GetCategorySalesAsync

    [Fact]
    public async Task GetCategorySales_ShouldGroupByCategory()
    {
        var product1 = TestDataBuilder.CreateProduct(name: "奶茶", category: "飲料");
        var product2 = TestDataBuilder.CreateProduct(name: "蛋糕", category: "甜點");
        _context.Products.AddRange(product1, product2);
        await _context.SaveChangesAsync();

        var item1 = TestDataBuilder.CreateOrderItem(productName: "奶茶", price: 60m, quantity: 1);
        item1.Subtotal = 60m;
        item1.ProductId = product1.Id;
        var item2 = TestDataBuilder.CreateOrderItem(productName: "蛋糕", price: 40m, quantity: 1);
        item2.Subtotal = 40m;
        item2.ProductId = product2.Id;
        await SeedOrder(_today, items: new List<OrderItem> { item1, item2 });

        var result = await _service.GetCategorySalesAsync(_today);
        var categories = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        categories.Should().HaveCount(2);
        categories.Should().Contain(c => (string)c["name"] == "飲料");
        categories.Should().Contain(c => (string)c["name"] == "甜點");
    }

    [Fact]
    public async Task GetCategorySales_ShouldCalculatePercentage()
    {
        var product = TestDataBuilder.CreateProduct(name: "奶茶", category: "飲料");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var item = TestDataBuilder.CreateOrderItem(productName: "奶茶", price: 100m, quantity: 1);
        item.Subtotal = 100m;
        item.ProductId = product.Id;
        await SeedOrder(_today, items: new List<OrderItem> { item });

        var result = await _service.GetCategorySalesAsync(_today);
        var categories = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        ((double)categories[0]["percentage"]).Should().Be(100);
    }

    #endregion

    #region GetPaymentMethodsAsync

    [Fact]
    public async Task GetPaymentMethods_ShouldGroupByMethod()
    {
        await SeedOrder(_today, total: 100m, payment: PaymentMethod.Cash);
        await SeedOrder(_today, total: 200m, payment: PaymentMethod.CreditCard);

        var result = await _service.GetPaymentMethodsAsync(_today);
        var methods = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        methods.Should().HaveCount(2);
        methods.Should().Contain(m => (string)m["method"] == "現金");
        methods.Should().Contain(m => (string)m["method"] == "信用卡");
    }

    [Fact]
    public async Task GetPaymentMethods_ShouldCalculatePercentage()
    {
        await SeedOrder(_today, total: 300m, payment: PaymentMethod.Cash);
        await SeedOrder(_today, total: 100m, payment: PaymentMethod.LinePay);

        var result = await _service.GetPaymentMethodsAsync(_today);
        var methods = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        var cashMethod = methods.First(m => (string)m["method"] == "現金");
        ((double)cashMethod["percentage"]).Should().Be(75.0);
    }

    #endregion

    #region GetTopProductsAsync

    [Fact]
    public async Task GetTopProducts_ShouldLimitTo5()
    {
        var items = Enumerable.Range(1, 7).Select(i =>
        {
            var item = TestDataBuilder.CreateOrderItem(productName: $"商品{i}", price: 10m * i, quantity: i);
            item.Subtotal = 10m * i * i;
            return item;
        }).ToList();
        await SeedOrder(_today, items: items);

        var result = await _service.GetTopProductsAsync(_today);
        var top = (result as IEnumerable<object>)!.ToList();

        top.Should().HaveCount(5);
    }

    [Fact]
    public async Task GetTopProducts_ShouldOrderByQuantityDescending()
    {
        var item1 = TestDataBuilder.CreateOrderItem(productName: "少量", price: 100m, quantity: 1);
        item1.Subtotal = 100m;
        var item2 = TestDataBuilder.CreateOrderItem(productName: "大量", price: 10m, quantity: 10);
        item2.Subtotal = 100m;
        await SeedOrder(_today, items: new List<OrderItem> { item1, item2 });

        var result = await _service.GetTopProductsAsync(_today);
        var top = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        ((string)top[0]["name"]).Should().Be("大量");
    }

    [Fact]
    public async Task GetTopProducts_ShouldCalculateRevenue()
    {
        var item = TestDataBuilder.CreateOrderItem(productName: "奶茶", price: 60m, quantity: 3);
        item.Subtotal = 180m;
        await SeedOrder(_today, items: new List<OrderItem> { item });

        var result = await _service.GetTopProductsAsync(_today);
        var top = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        ((decimal)top[0]["revenue"]).Should().Be(180m);
    }

    #endregion

    #region GetTopAddonsAsync

    [Fact]
    public async Task GetTopAddons_ShouldLimitTo10()
    {
        var items = new List<OrderItem>();
        for (int i = 1; i <= 12; i++)
        {
            var item = TestDataBuilder.CreateOrderItem(productName: $"飲料{i}", price: 50m, quantity: 1);
            item.Subtotal = 60m;
            item.Addons.Add(TestDataBuilder.CreateAddon(productName: $"加料{i}", price: 10m));
            items.Add(item);
        }
        await SeedOrder(_today, items: items);

        var result = await _service.GetTopAddonsAsync(_today);
        var top = (result as IEnumerable<object>)!.ToList();

        top.Should().HaveCount(10);
    }

    [Fact]
    public async Task GetTopAddons_ShouldOrderByQuantityDescending()
    {
        var item1 = TestDataBuilder.CreateOrderItem(productName: "飲料A", price: 50m, quantity: 1);
        item1.Subtotal = 80m;
        item1.Addons.Add(TestDataBuilder.CreateAddon(productName: "珍珠", price: 10m));
        item1.Addons.Add(TestDataBuilder.CreateAddon(productName: "珍珠", price: 10m));

        var item2 = TestDataBuilder.CreateOrderItem(productName: "飲料B", price: 50m, quantity: 1);
        item2.Subtotal = 65m;
        item2.Addons.Add(TestDataBuilder.CreateAddon(productName: "椰果", price: 15m));

        await SeedOrder(_today, items: new List<OrderItem> { item1, item2 });

        var result = await _service.GetTopAddonsAsync(_today);
        var top = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        ((string)top[0]["name"]).Should().Be("珍珠");
    }

    [Fact]
    public async Task GetTopAddons_ShouldCalculateRevenue()
    {
        var item = TestDataBuilder.CreateOrderItem(productName: "飲料", price: 50m, quantity: 1);
        item.Subtotal = 70m;
        item.Addons.Add(TestDataBuilder.CreateAddon(productName: "珍珠", price: 10m));
        item.Addons.Add(TestDataBuilder.CreateAddon(productName: "珍珠", price: 10m));
        await SeedOrder(_today, items: new List<OrderItem> { item });

        var result = await _service.GetTopAddonsAsync(_today);
        var top = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();
        var pearl = top.First(t => (string)t["name"] == "珍珠");

        ((decimal)pearl["revenue"]).Should().Be(20m);
    }

    #endregion

    #region GetAddonProductCombinationsAsync

    [Fact]
    public async Task GetAddonCombinations_ShouldLimitTo20()
    {
        var items = new List<OrderItem>();
        for (int i = 1; i <= 22; i++)
        {
            var item = TestDataBuilder.CreateOrderItem(productName: $"飲料{i}", price: 50m, quantity: 1);
            item.Subtotal = 60m;
            item.Addons.Add(TestDataBuilder.CreateAddon(productName: $"加料{i}", price: 10m));
            items.Add(item);
        }
        await SeedOrder(_today, items: items);

        var result = await _service.GetAddonProductCombinationsAsync(_today);
        var combos = (result as IEnumerable<object>)!.ToList();

        combos.Should().HaveCount(20);
    }

    [Fact]
    public async Task GetAddonCombinations_ShouldGroupByProductAndAddon()
    {
        var item1 = TestDataBuilder.CreateOrderItem(productName: "奶茶", price: 50m, quantity: 1);
        item1.Subtotal = 60m;
        item1.Addons.Add(TestDataBuilder.CreateAddon(productName: "珍珠", price: 10m));

        var item2 = TestDataBuilder.CreateOrderItem(productName: "奶茶", price: 50m, quantity: 1);
        item2.Subtotal = 60m;
        item2.Addons.Add(TestDataBuilder.CreateAddon(productName: "珍珠", price: 10m));

        await SeedOrder(_today, items: new List<OrderItem> { item1, item2 });

        var result = await _service.GetAddonProductCombinationsAsync(_today);
        var combos = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        combos.Should().HaveCount(1);
        ((string)combos[0]["product"]).Should().Be("奶茶");
        ((string)combos[0]["addon"]).Should().Be("珍珠");
        ((int)combos[0]["count"]).Should().Be(2);
    }

    [Fact]
    public async Task GetAddonCombinations_ShouldCalculateRevenue()
    {
        var item = TestDataBuilder.CreateOrderItem(productName: "奶茶", price: 50m, quantity: 1);
        item.Subtotal = 70m;
        item.Addons.Add(TestDataBuilder.CreateAddon(productName: "珍珠", price: 10m));
        item.Addons.Add(TestDataBuilder.CreateAddon(productName: "珍珠", price: 10m));
        await SeedOrder(_today, items: new List<OrderItem> { item });

        var result = await _service.GetAddonProductCombinationsAsync(_today);
        var combos = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        ((decimal)combos[0]["revenue"]).Should().Be(20m);
    }

    #endregion

    #region GetAddonRevenueTrendAsync

    [Fact]
    public async Task GetAddonRevenueTrend_ShouldReturnCorrectDays()
    {
        var result = await _service.GetAddonRevenueTrendAsync(7);
        var trend = (result as IEnumerable<object>)!.ToList();

        trend.Should().HaveCount(7);
    }

    [Fact]
    public async Task GetAddonRevenueTrend_ShouldCalculateDailyRevenue()
    {
        var item = TestDataBuilder.CreateOrderItem(productName: "飲料", price: 50m, quantity: 1);
        item.Subtotal = 70m;
        item.Addons.Add(TestDataBuilder.CreateAddon(productName: "珍珠", price: 10m));
        item.Addons.Add(TestDataBuilder.CreateAddon(productName: "椰果", price: 15m));
        await SeedOrder(_today, items: new List<OrderItem> { item });

        var result = await _service.GetAddonRevenueTrendAsync(1);
        var trend = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        ((decimal)trend.Last()["revenue"]).Should().Be(25m);
        ((int)trend.Last()["count"]).Should().Be(2);
    }

    [Fact]
    public async Task GetAddonRevenueTrend_ShouldIncludeRevenueAndCount()
    {
        var result = await _service.GetAddonRevenueTrendAsync(3);
        var trend = (result as IEnumerable<object>)!.Select(ToDictionary).ToList();

        foreach (var day in trend)
        {
            day.Should().ContainKey("date");
            day.Should().ContainKey("revenue");
            day.Should().ContainKey("count");
        }
    }

    #endregion

    #region GetCustomerTagDistributionAsync

    [Fact]
    public async Task GetCustomerTagDistribution_ShouldCalculatePercentage()
    {
        await SeedOrder(_today, total: 100m, customerTag: "男,成人");
        await SeedOrder(_today, total: 100m, customerTag: "女,學生");

        var result = await _service.GetCustomerTagDistributionAsync(_today);
        var dict = ToDictionary(result);
        var gender = (dict["gender"] as IEnumerable<object>)!.Select(ToDictionary).ToList();

        var male = gender.First(g => (string)g["tag"] == "男");
        ((double)male["percentage"]).Should().Be(50.0);
    }

    [Fact]
    public async Task GetCustomerTagDistribution_ShouldIncludeUntagged()
    {
        await SeedOrder(_today, total: 100m, customerTag: null);
        await SeedOrder(_today, total: 200m, customerTag: "男,成人");

        var result = await _service.GetCustomerTagDistributionAsync(_today);
        var dict = ToDictionary(result);
        var gender = (dict["gender"] as IEnumerable<object>)!.Select(ToDictionary).ToList();

        var untagged = gender.First(g => (string)g["tag"] == "未標記");
        ((int)untagged["orders"]).Should().Be(1);
    }

    #endregion

    #region ExportCsvAsync

    [Fact]
    public async Task ExportCsv_ShouldStartWithBom()
    {
        await SeedOrder(_today);

        var bytes = await _service.ExportCsvAsync(_today);

        bytes[0].Should().Be(0xEF);
        bytes[1].Should().Be(0xBB);
        bytes[2].Should().Be(0xBF);
    }

    [Fact]
    public async Task ExportCsv_ShouldContainHeaderRow()
    {
        await SeedOrder(_today);

        var bytes = await _service.ExportCsvAsync(_today);
        var content = Encoding.UTF8.GetString(bytes.Skip(3).ToArray());
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        lines[0].Trim().Should().Be("訂單編號,時間,商品,小計,折扣,總計,付款方式,狀態,客群標記");
    }

    [Fact]
    public async Task ExportCsv_ShouldMapStatusToChinese()
    {
        await SeedOrder(_today, status: OrderStatus.Completed);
        await SeedOrder(_today, status: OrderStatus.Cancelled);

        var bytes = await _service.ExportCsvAsync(_today);
        var content = Encoding.UTF8.GetString(bytes.Skip(3).ToArray());

        content.Should().Contain("已完成");
        content.Should().Contain("已取消");
    }

    [Fact]
    public async Task ExportCsv_ShouldIncludeCustomerTag()
    {
        await SeedOrder(_today, customerTag: "男,成人");

        var bytes = await _service.ExportCsvAsync(_today);
        var content = Encoding.UTF8.GetString(bytes.Skip(3).ToArray());

        content.Should().Contain("男,成人");
    }

    [Fact]
    public async Task ExportCsv_ShouldIncludeAllOrders()
    {
        await SeedOrder(_today, status: OrderStatus.Completed);
        await SeedOrder(_today, status: OrderStatus.Cancelled);

        var bytes = await _service.ExportCsvAsync(_today);
        var content = Encoding.UTF8.GetString(bytes.Skip(3).ToArray());
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        lines.Length.Should().Be(3); // header + 2 orders
    }

    #endregion

    private static Dictionary<string, object> ToDictionary(object obj)
    {
        return obj.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(obj)!);
    }
}
