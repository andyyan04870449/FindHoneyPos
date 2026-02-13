namespace FindHoneyPos.Tests.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;
using Moq;

public class ShiftServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ShiftService _service;
    private readonly Mock<ILineWebhookService> _lineWebhookServiceMock;

    public ShiftServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _lineWebhookServiceMock = new Mock<ILineWebhookService>();
        _service = new ShiftService(_context, _lineWebhookServiceMock.Object);
    }

    public void Dispose() => _context.Dispose();

    #region OpenAsync

    [Fact]
    public async Task OpenAsync_NoExistingShift_ShouldCreateNewShift()
    {
        var result = await _service.OpenAsync("device-01");

        result.Should().NotBeNull();
        result.DeviceId.Should().Be("device-01");
        result.Status.Should().Be(ShiftStatus.Open);
        result.OpenedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task OpenAsync_ShouldInitializeStatsToZero()
    {
        var result = await _service.OpenAsync("device-01");

        result.TotalOrders.Should().Be(0);
        result.TotalRevenue.Should().Be(0);
        result.TotalDiscount.Should().Be(0);
        result.NetRevenue.Should().Be(0);
    }

    [Fact]
    public async Task OpenAsync_ExistingOpenShift_ShouldThrow()
    {
        var existingShift = TestDataBuilder.CreateShift(deviceId: "device-01", status: ShiftStatus.Open);
        _context.Shifts.Add(existingShift);
        await _context.SaveChangesAsync();

        var act = () => _service.OpenAsync("device-01");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*已有開啟的班次*");
    }

    [Fact]
    public async Task OpenAsync_ExistingClosedShift_ShouldCreateNewShift()
    {
        var closedShift = TestDataBuilder.CreateShift(deviceId: "device-01", status: ShiftStatus.Closed);
        _context.Shifts.Add(closedShift);
        await _context.SaveChangesAsync();

        var result = await _service.OpenAsync("device-01");

        result.Should().NotBeNull();
        result.Status.Should().Be(ShiftStatus.Open);
        result.Id.Should().NotBe(closedShift.Id);
    }

    [Fact]
    public async Task OpenAsync_DifferentDevice_ShouldCreateNewShift()
    {
        var existingShift = TestDataBuilder.CreateShift(deviceId: "device-01", status: ShiftStatus.Open);
        _context.Shifts.Add(existingShift);
        await _context.SaveChangesAsync();

        var result = await _service.OpenAsync("device-02");

        result.Should().NotBeNull();
        result.DeviceId.Should().Be("device-02");
    }

    [Fact]
    public async Task OpenAsync_NullDeviceId_ShouldWork()
    {
        var result = await _service.OpenAsync(null);

        result.Should().NotBeNull();
        result.DeviceId.Should().BeNull();
    }

    #endregion

    #region GetCurrentOpenAsync

    [Fact]
    public async Task GetCurrentOpenAsync_HasOpenShift_ShouldReturn()
    {
        var shift = TestDataBuilder.CreateShift(deviceId: "device-01", status: ShiftStatus.Open);
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        var result = await _service.GetCurrentOpenAsync("device-01");

        result.Should().NotBeNull();
        result!.Id.Should().Be(shift.Id);
    }

    [Fact]
    public async Task GetCurrentOpenAsync_NoOpenShift_ShouldReturnNull()
    {
        var closedShift = TestDataBuilder.CreateShift(deviceId: "device-01", status: ShiftStatus.Closed);
        _context.Shifts.Add(closedShift);
        await _context.SaveChangesAsync();

        var result = await _service.GetCurrentOpenAsync("device-01");

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetCurrentOpenAsync_DifferentDevice_ShouldReturnNull()
    {
        var shift = TestDataBuilder.CreateShift(deviceId: "device-01", status: ShiftStatus.Open);
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        var result = await _service.GetCurrentOpenAsync("device-02");

        result.Should().BeNull();
    }

    #endregion

    #region GetByIdAsync

    [Fact]
    public async Task GetByIdAsync_Exists_ShouldReturn()
    {
        var shift = TestDataBuilder.CreateShift(deviceId: "device-01");
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        var result = await _service.GetByIdAsync(shift.Id);

        result.Should().NotBeNull();
        result!.DeviceId.Should().Be("device-01");
    }

    [Fact]
    public async Task GetByIdAsync_NotFound_ShouldReturnNull()
    {
        var result = await _service.GetByIdAsync(999);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldIncludeOrders()
    {
        var shift = TestDataBuilder.CreateShift(deviceId: "device-01");
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        var order = TestDataBuilder.CreateOrder(total: 100m);
        order.ShiftId = shift.Id;
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var result = await _service.GetByIdAsync(shift.Id);

        result!.Orders.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldIncludeSettlement()
    {
        var settlement = TestDataBuilder.CreateDailySettlement(totalOrders: 10, totalRevenue: 1000m);
        _context.DailySettlements.Add(settlement);
        await _context.SaveChangesAsync();

        var shift = TestDataBuilder.CreateShift(deviceId: "device-01", status: ShiftStatus.Closed);
        shift.SettlementId = settlement.Id;
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        var result = await _service.GetByIdAsync(shift.Id);

        result!.Settlement.Should().NotBeNull();
        result.Settlement!.TotalOrders.Should().Be(10);
    }

    #endregion

    #region UpdateStatsAsync

    [Fact]
    public async Task UpdateStatsAsync_ShouldIncrementStats()
    {
        var shift = TestDataBuilder.CreateShift(
            deviceId: "device-01",
            totalOrders: 5,
            totalRevenue: 500m,
            totalDiscount: 50m);
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        // UpdateStatsAsync 使用 order.Subtotal 計算營收
        var order = TestDataBuilder.CreateOrder(subtotal: 150m, total: 130m, discountAmount: 20m);

        await _service.UpdateStatsAsync(shift.Id, order);

        var updated = await _service.GetByIdAsync(shift.Id);
        updated!.TotalOrders.Should().Be(6);
        updated.TotalRevenue.Should().Be(650m);    // 500 + 150 (subtotal)
        updated.TotalDiscount.Should().Be(70m);    // 50 + 20
        updated.NetRevenue.Should().Be(580m);      // 650 - 70
    }

    [Fact]
    public async Task UpdateStatsAsync_ShiftNotFound_ShouldNotThrow()
    {
        var order = TestDataBuilder.CreateOrder(total: 100m);

        var act = () => _service.UpdateStatsAsync(999, order);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task UpdateStatsAsync_ClosedShift_ShouldNotUpdate()
    {
        var shift = TestDataBuilder.CreateShift(
            deviceId: "device-01",
            status: ShiftStatus.Closed,
            totalOrders: 5,
            totalRevenue: 500m);
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        var order = TestDataBuilder.CreateOrder(total: 150m);

        await _service.UpdateStatsAsync(shift.Id, order);

        var result = await _service.GetByIdAsync(shift.Id);
        result!.TotalOrders.Should().Be(5);
        result.TotalRevenue.Should().Be(500m);
    }

    [Fact]
    public async Task UpdateStatsAsync_MultipleOrders_ShouldAccumulateCorrectly()
    {
        var shift = TestDataBuilder.CreateShift(deviceId: "device-01");
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        // UpdateStatsAsync 使用 order.Subtotal 計算營收
        var order1 = TestDataBuilder.CreateOrder(subtotal: 100m, total: 90m, discountAmount: 10m);
        var order2 = TestDataBuilder.CreateOrder(subtotal: 200m, total: 180m, discountAmount: 20m);
        var order3 = TestDataBuilder.CreateOrder(subtotal: 150m, total: 135m, discountAmount: 15m);

        await _service.UpdateStatsAsync(shift.Id, order1);
        await _service.UpdateStatsAsync(shift.Id, order2);
        await _service.UpdateStatsAsync(shift.Id, order3);

        var updated = await _service.GetByIdAsync(shift.Id);
        updated!.TotalOrders.Should().Be(3);
        updated.TotalRevenue.Should().Be(450m);    // 100 + 200 + 150
        updated.TotalDiscount.Should().Be(45m);    // 10 + 20 + 15
    }

    #endregion

    #region CloseAsync

    [Fact]
    public async Task CloseAsync_ShouldCloseShiftAndCreateSettlement()
    {
        var shift = TestDataBuilder.CreateShift(
            deviceId: "device-01",
            status: ShiftStatus.Open,
            totalOrders: 10,
            totalRevenue: 1000m,
            totalDiscount: 50m);
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        var settlementData = new DailySettlement();

        var (closedShift, settlement) = await _service.CloseAsync(shift.Id, settlementData);

        closedShift.Status.Should().Be(ShiftStatus.Closed);
        closedShift.ClosedAt.Should().NotBeNull();
        closedShift.SettlementId.Should().Be(settlement.Id);

        settlement.TotalOrders.Should().Be(10);
        settlement.TotalRevenue.Should().Be(1000m);
        settlement.TotalDiscount.Should().Be(50m);
        settlement.DeviceId.Should().Be("device-01");
    }

    [Fact]
    public async Task CloseAsync_ShiftNotFound_ShouldThrow()
    {
        var settlementData = new DailySettlement();

        var act = () => _service.CloseAsync(999, settlementData);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*找不到該班次*");
    }

    [Fact]
    public async Task CloseAsync_AlreadyClosed_ShouldThrow()
    {
        var closedShift = TestDataBuilder.CreateShift(deviceId: "device-01", status: ShiftStatus.Closed);
        _context.Shifts.Add(closedShift);
        await _context.SaveChangesAsync();

        var settlementData = new DailySettlement();

        var act = () => _service.CloseAsync(closedShift.Id, settlementData);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*已關閉*");
    }

    [Fact]
    public async Task CloseAsync_ShouldSetCorrectDate()
    {
        var shift = TestDataBuilder.CreateShift(deviceId: "device-01", status: ShiftStatus.Open);
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        var settlementData = new DailySettlement();

        var (_, settlement) = await _service.CloseAsync(shift.Id, settlementData);

        settlement.Date.Should().Be(DateOnly.FromDateTime(DateTime.UtcNow));
    }

    [Fact]
    public async Task CloseAsync_ShouldCalculateNetRevenue()
    {
        var shift = TestDataBuilder.CreateShift(
            deviceId: "device-01",
            status: ShiftStatus.Open,
            totalRevenue: 1000m,
            totalDiscount: 100m);
        shift.NetRevenue = 900m;
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        var settlementData = new DailySettlement();

        var (_, settlement) = await _service.CloseAsync(shift.Id, settlementData);

        settlement.NetRevenue.Should().Be(900m);
    }

    [Fact]
    public async Task CloseAsync_ShouldSetSubmittedAt()
    {
        var shift = TestDataBuilder.CreateShift(deviceId: "device-01", status: ShiftStatus.Open);
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        var before = DateTime.UtcNow;
        var settlementData = new DailySettlement();

        var (_, settlement) = await _service.CloseAsync(shift.Id, settlementData);

        settlement.SubmittedAt.Should().BeOnOrAfter(before);
    }

    #endregion
}
