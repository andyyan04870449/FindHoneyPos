namespace FindHoneyPos.Tests.Services;

using FindHoneyPos.Core.Enums;
using FindHoneyPos.Infrastructure.Data;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;

public class ProductServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ProductService _service;

    public ProductServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _service = new ProductService(_context);
    }

    public void Dispose() => _context.Dispose();

    #region GetAllAsync

    [Fact]
    public async Task GetAllAsync_DefaultShouldExcludeAddonCategory()
    {
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "奶茶", category: "飲料"));
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "珍珠", category: "加料"));
        await _context.SaveChangesAsync();

        var result = await _service.GetAllAsync();

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("奶茶");
    }

    [Fact]
    public async Task GetAllAsync_WithCategoryFilter_ShouldReturnMatchingOnly()
    {
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "珍珠", category: "加料"));
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "奶茶", category: "飲料"));
        await _context.SaveChangesAsync();

        var result = await _service.GetAllAsync(category: "加料");

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("珍珠");
    }

    [Fact]
    public async Task GetAllAsync_WithSearch_ShouldFilterByName()
    {
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "珍珠奶茶", category: "飲料"));
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "紅茶", category: "飲料"));
        await _context.SaveChangesAsync();

        var result = await _service.GetAllAsync(search: "奶茶");

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("珍珠奶茶");
    }

    [Fact]
    public async Task GetAllAsync_ShouldOrderBySortOrder()
    {
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "C", category: "飲料", sortOrder: 3));
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "A", category: "飲料", sortOrder: 1));
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "B", category: "飲料", sortOrder: 2));
        await _context.SaveChangesAsync();

        var result = (await _service.GetAllAsync()).ToList();

        result[0].Name.Should().Be("A");
        result[1].Name.Should().Be("B");
        result[2].Name.Should().Be("C");
    }

    #endregion

    #region GetByIdAsync

    [Fact]
    public async Task GetByIdAsync_Exists_ShouldReturnProduct()
    {
        var product = TestDataBuilder.CreateProduct(name: "找到我", price: 75m);
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var result = await _service.GetByIdAsync(product.Id);

        result.Should().NotBeNull();
        result!.Name.Should().Be("找到我");
        result.Price.Should().Be(75m);
    }

    [Fact]
    public async Task GetByIdAsync_NotFound_ShouldReturnNull()
    {
        var result = await _service.GetByIdAsync(999);

        result.Should().BeNull();
    }

    #endregion

    #region CRUD

    [Fact]
    public async Task CreateAsync_ShouldSetTimestamps()
    {
        var before = DateTime.UtcNow;
        var product = TestDataBuilder.CreateProduct(name: "新品");

        var result = await _service.CreateAsync(product);

        result.CreatedAt.Should().BeOnOrAfter(before);
        result.UpdatedAt.Should().BeOnOrAfter(before);
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateFields()
    {
        var product = TestDataBuilder.CreateProduct(name: "原名");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var updated = TestDataBuilder.CreateProduct(name: "新名", price: 200m, isPopular: true);
        var result = await _service.UpdateAsync(product.Id, updated);

        result.Should().NotBeNull();
        result!.Name.Should().Be("新名");
        result.Price.Should().Be(200m);
        result.IsPopular.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateAsync_NotFound_ShouldReturnNull()
    {
        var product = TestDataBuilder.CreateProduct();
        var result = await _service.UpdateAsync(999, product);

        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_Existing_ShouldReturnTrue()
    {
        var product = TestDataBuilder.CreateProduct();
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var result = await _service.DeleteAsync(product.Id);

        result.Should().BeTrue();
        (await _service.GetByIdAsync(product.Id)).Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_NotFound_ShouldReturnFalse()
    {
        var result = await _service.DeleteAsync(999);

        result.Should().BeFalse();
    }

    #endregion

    #region ToggleStatusAsync

    [Fact]
    public async Task ToggleStatus_Active_ShouldBecomeInactive()
    {
        var product = TestDataBuilder.CreateProduct(status: ProductStatus.Active);
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var result = await _service.ToggleStatusAsync(product.Id);

        result!.Status.Should().Be(ProductStatus.Inactive);
    }

    [Fact]
    public async Task ToggleStatus_Inactive_ShouldBecomeActive()
    {
        var product = TestDataBuilder.CreateProduct(status: ProductStatus.Inactive);
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var result = await _service.ToggleStatusAsync(product.Id);

        result!.Status.Should().Be(ProductStatus.Active);
    }

    [Fact]
    public async Task ToggleStatus_NotFound_ShouldReturnNull()
    {
        var result = await _service.ToggleStatusAsync(999);

        result.Should().BeNull();
    }

    #endregion

    #region GetActiveAsync

    [Fact]
    public async Task GetActiveAsync_ShouldOnlyReturnActiveProducts()
    {
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "Active1", status: ProductStatus.Active));
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "Inactive1", status: ProductStatus.Inactive));
        await _context.SaveChangesAsync();

        var result = await _service.GetActiveAsync();

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("Active1");
    }

    [Fact]
    public async Task GetActiveAsync_ShouldOrderBySortOrder()
    {
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "B", sortOrder: 2, status: ProductStatus.Active));
        _context.Products.Add(TestDataBuilder.CreateProduct(name: "A", sortOrder: 1, status: ProductStatus.Active));
        await _context.SaveChangesAsync();

        var result = (await _service.GetActiveAsync()).ToList();

        result[0].Name.Should().Be("A");
        result[1].Name.Should().Be("B");
    }

    #endregion
}
