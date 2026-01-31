namespace FindHoneyPos.Tests.Services;

using FindHoneyPos.Core.Enums;
using FindHoneyPos.Infrastructure.Data;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;

public class DiscountServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly DiscountService _service;

    public DiscountServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _service = new DiscountService(_context);
    }

    public void Dispose() => _context.Dispose();

    #region CRUD

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllDiscounts()
    {
        _context.Discounts.Add(TestDataBuilder.CreateDiscount(name: "折扣A"));
        _context.Discounts.Add(TestDataBuilder.CreateDiscount(name: "折扣B"));
        await _context.SaveChangesAsync();

        var result = await _service.GetAllAsync();

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task CreateAsync_ShouldSetCreatedAt()
    {
        var before = DateTime.UtcNow;
        var discount = TestDataBuilder.CreateDiscount(name: "新折扣");

        var result = await _service.CreateAsync(discount);

        result.CreatedAt.Should().BeOnOrAfter(before);
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateFields()
    {
        var discount = TestDataBuilder.CreateDiscount(name: "原始折扣");
        _context.Discounts.Add(discount);
        await _context.SaveChangesAsync();

        var updated = TestDataBuilder.CreateDiscount(name: "更新後折扣", value: 20m, type: DiscountType.Amount);
        var result = await _service.UpdateAsync(discount.Id, updated);

        result.Should().NotBeNull();
        result!.Name.Should().Be("更新後折扣");
        result.Value.Should().Be(20m);
        result.Type.Should().Be(DiscountType.Amount);
    }

    [Fact]
    public async Task UpdateAsync_NotFound_ShouldReturnNull()
    {
        var discount = TestDataBuilder.CreateDiscount();
        var result = await _service.UpdateAsync(999, discount);

        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_Existing_ShouldReturnTrue()
    {
        var discount = TestDataBuilder.CreateDiscount();
        _context.Discounts.Add(discount);
        await _context.SaveChangesAsync();

        var result = await _service.DeleteAsync(discount.Id);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAsync_NotFound_ShouldReturnFalse()
    {
        var result = await _service.DeleteAsync(999);

        result.Should().BeFalse();
    }

    #endregion

    #region ToggleAsync

    [Fact]
    public async Task ToggleAsync_Active_ShouldBecomeInactive()
    {
        var discount = TestDataBuilder.CreateDiscount(isActive: true);
        _context.Discounts.Add(discount);
        await _context.SaveChangesAsync();

        var result = await _service.ToggleAsync(discount.Id);

        result!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task ToggleAsync_Inactive_ShouldBecomeActive()
    {
        var discount = TestDataBuilder.CreateDiscount(isActive: false);
        _context.Discounts.Add(discount);
        await _context.SaveChangesAsync();

        var result = await _service.ToggleAsync(discount.Id);

        result!.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task ToggleAsync_NotFound_ShouldReturnNull()
    {
        var result = await _service.ToggleAsync(999);

        result.Should().BeNull();
    }

    #endregion

    #region GetActiveAsync

    [Fact]
    public async Task GetActiveAsync_ShouldOnlyReturnActive()
    {
        _context.Discounts.Add(TestDataBuilder.CreateDiscount(name: "Active", isActive: true));
        _context.Discounts.Add(TestDataBuilder.CreateDiscount(name: "Inactive", isActive: false));
        await _context.SaveChangesAsync();

        var result = await _service.GetActiveAsync();

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("Active");
    }

    #endregion
}
