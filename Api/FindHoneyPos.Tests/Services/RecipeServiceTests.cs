namespace FindHoneyPos.Tests.Services;

using FindHoneyPos.Core.Enums;
using FindHoneyPos.Infrastructure.Data;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

public class RecipeServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly RecipeService _service;
    private readonly Mock<ILogger<RecipeService>> _loggerMock;

    public RecipeServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _loggerMock = new Mock<ILogger<RecipeService>>();
        _service = new RecipeService(_context, _loggerMock.Object);
    }

    public void Dispose() => _context.Dispose();

    #region GetByProductIdAsync

    [Fact]
    public async Task GetByProductIdAsync_ShouldReturnRecipesForProduct()
    {
        var product = TestDataBuilder.CreateProduct(name: "珍珠奶茶");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var material1 = TestDataBuilder.CreateMaterial(name: "珍珠");
        var material2 = TestDataBuilder.CreateMaterial(name: "奶茶粉");
        _context.Materials.AddRange(material1, material2);
        await _context.SaveChangesAsync();

        var recipe1 = TestDataBuilder.CreateRecipe(product.Id, material1.Id, quantity: 30m);
        var recipe2 = TestDataBuilder.CreateRecipe(product.Id, material2.Id, quantity: 20m);
        _context.ProductRecipes.AddRange(recipe1, recipe2);
        await _context.SaveChangesAsync();

        var result = await _service.GetByProductIdAsync(product.Id);

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetByProductIdAsync_NoRecipes_ShouldReturnEmpty()
    {
        var product = TestDataBuilder.CreateProduct(name: "無配方商品");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var result = await _service.GetByProductIdAsync(product.Id);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetByProductIdAsync_ShouldIncludeMaterialInfo()
    {
        var product = TestDataBuilder.CreateProduct(name: "珍珠奶茶");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var material = TestDataBuilder.CreateMaterial(name: "珍珠", unit: "g");
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var recipe = TestDataBuilder.CreateRecipe(product.Id, material.Id, quantity: 30m);
        _context.ProductRecipes.Add(recipe);
        await _context.SaveChangesAsync();

        var result = await _service.GetByProductIdAsync(product.Id);

        result.First().Material.Should().NotBeNull();
        result.First().Material.Name.Should().Be("珍珠");
        result.First().Material.Unit.Should().Be("g");
    }

    [Fact]
    public async Task GetByProductIdAsync_ProductNotExists_ShouldReturnEmpty()
    {
        var result = await _service.GetByProductIdAsync(999);

        result.Should().BeEmpty();
    }

    #endregion

    #region UpdateRecipesAsync

    [Fact]
    public async Task UpdateRecipesAsync_ShouldReplaceExistingRecipes()
    {
        var product = TestDataBuilder.CreateProduct(name: "珍珠奶茶");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var material1 = TestDataBuilder.CreateMaterial(name: "珍珠");
        var material2 = TestDataBuilder.CreateMaterial(name: "椰果");
        _context.Materials.AddRange(material1, material2);
        await _context.SaveChangesAsync();

        // 先建立舊配方
        var oldRecipe = TestDataBuilder.CreateRecipe(product.Id, material1.Id, quantity: 30m);
        _context.ProductRecipes.Add(oldRecipe);
        await _context.SaveChangesAsync();

        // 更新為新配方
        var newRecipes = new List<(int MaterialId, decimal Quantity)>
        {
            (material2.Id, 25m)
        };

        var result = await _service.UpdateRecipesAsync(product.Id, newRecipes);

        result.Should().HaveCount(1);
        result.First().MaterialId.Should().Be(material2.Id);
        result.First().Quantity.Should().Be(25m);

        // 確認舊配方已刪除
        _context.ProductRecipes.Count(r => r.ProductId == product.Id && r.MaterialId == material1.Id)
            .Should().Be(0);
    }

    [Fact]
    public async Task UpdateRecipesAsync_ProductNotFound_ShouldThrow()
    {
        var recipes = new List<(int MaterialId, decimal Quantity)> { (1, 10m) };

        var act = () => _service.UpdateRecipesAsync(999, recipes);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Product not found*");
    }

    [Fact]
    public async Task UpdateRecipesAsync_MaterialNotFound_ShouldSkipInvalidMaterial()
    {
        var product = TestDataBuilder.CreateProduct(name: "測試商品");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var validMaterial = TestDataBuilder.CreateMaterial(name: "有效原料");
        _context.Materials.Add(validMaterial);
        await _context.SaveChangesAsync();

        var recipes = new List<(int MaterialId, decimal Quantity)>
        {
            (validMaterial.Id, 10m),
            (999, 20m) // 不存在的原料
        };

        var result = await _service.UpdateRecipesAsync(product.Id, recipes);

        result.Should().HaveCount(1);
        result.First().MaterialId.Should().Be(validMaterial.Id);
    }

    [Fact]
    public async Task UpdateRecipesAsync_EmptyRecipes_ShouldClearAllRecipes()
    {
        var product = TestDataBuilder.CreateProduct(name: "珍珠奶茶");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var material = TestDataBuilder.CreateMaterial(name: "珍珠");
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var recipe = TestDataBuilder.CreateRecipe(product.Id, material.Id, quantity: 30m);
        _context.ProductRecipes.Add(recipe);
        await _context.SaveChangesAsync();

        var emptyRecipes = new List<(int MaterialId, decimal Quantity)>();

        var result = await _service.UpdateRecipesAsync(product.Id, emptyRecipes);

        result.Should().BeEmpty();
        _context.ProductRecipes.Count(r => r.ProductId == product.Id).Should().Be(0);
    }

    [Fact]
    public async Task UpdateRecipesAsync_MultipleRecipes_ShouldCreateAll()
    {
        var product = TestDataBuilder.CreateProduct(name: "綜合飲品");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var material1 = TestDataBuilder.CreateMaterial(name: "原料1");
        var material2 = TestDataBuilder.CreateMaterial(name: "原料2");
        var material3 = TestDataBuilder.CreateMaterial(name: "原料3");
        _context.Materials.AddRange(material1, material2, material3);
        await _context.SaveChangesAsync();

        var recipes = new List<(int MaterialId, decimal Quantity)>
        {
            (material1.Id, 10m),
            (material2.Id, 20m),
            (material3.Id, 30m)
        };

        var result = await _service.UpdateRecipesAsync(product.Id, recipes);

        result.Should().HaveCount(3);
    }

    [Fact]
    public async Task UpdateRecipesAsync_ShouldReturnWithMaterialInfo()
    {
        var product = TestDataBuilder.CreateProduct(name: "珍珠奶茶");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var material = TestDataBuilder.CreateMaterial(name: "珍珠", unit: "g");
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var recipes = new List<(int MaterialId, decimal Quantity)>
        {
            (material.Id, 30m)
        };

        var result = await _service.UpdateRecipesAsync(product.Id, recipes);

        result.First().Material.Should().NotBeNull();
        result.First().Material.Name.Should().Be("珍珠");
    }

    #endregion

    #region GetProductsWithRecipesAsync

    [Fact]
    public async Task GetProductsWithRecipesAsync_ShouldReturnActiveProducts()
    {
        var activeProduct = TestDataBuilder.CreateProduct(name: "活躍商品", status: ProductStatus.Active);
        var inactiveProduct = TestDataBuilder.CreateProduct(name: "停用商品", status: ProductStatus.Inactive);
        _context.Products.AddRange(activeProduct, inactiveProduct);
        await _context.SaveChangesAsync();

        var result = await _service.GetProductsWithRecipesAsync();

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("活躍商品");
    }

    [Fact]
    public async Task GetProductsWithRecipesAsync_ShouldExcludeAddonCategory()
    {
        var regularProduct = TestDataBuilder.CreateProduct(name: "奶茶", category: "飲料", status: ProductStatus.Active);
        var addonProduct = TestDataBuilder.CreateProduct(name: "珍珠", category: "加料", status: ProductStatus.Active);
        _context.Products.AddRange(regularProduct, addonProduct);
        await _context.SaveChangesAsync();

        var result = await _service.GetProductsWithRecipesAsync();

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("奶茶");
    }

    [Fact]
    public async Task GetProductsWithRecipesAsync_ShouldOrderBySortOrder()
    {
        var product1 = TestDataBuilder.CreateProduct(name: "C商品", sortOrder: 3, status: ProductStatus.Active);
        var product2 = TestDataBuilder.CreateProduct(name: "A商品", sortOrder: 1, status: ProductStatus.Active);
        var product3 = TestDataBuilder.CreateProduct(name: "B商品", sortOrder: 2, status: ProductStatus.Active);
        _context.Products.AddRange(product1, product2, product3);
        await _context.SaveChangesAsync();

        var result = (await _service.GetProductsWithRecipesAsync()).ToList();

        result[0].Name.Should().Be("A商品");
        result[1].Name.Should().Be("B商品");
        result[2].Name.Should().Be("C商品");
    }

    [Fact]
    public async Task GetProductsWithRecipesAsync_ShouldIncludeRecipesAndMaterials()
    {
        var product = TestDataBuilder.CreateProduct(name: "珍珠奶茶", status: ProductStatus.Active);
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var material = TestDataBuilder.CreateMaterial(name: "珍珠", unit: "g");
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var recipe = TestDataBuilder.CreateRecipe(product.Id, material.Id, quantity: 30m);
        _context.ProductRecipes.Add(recipe);
        await _context.SaveChangesAsync();

        var result = await _service.GetProductsWithRecipesAsync();

        var returnedProduct = result.First();
        returnedProduct.Recipes.Should().HaveCount(1);
        returnedProduct.Recipes.First().Material.Should().NotBeNull();
        returnedProduct.Recipes.First().Material.Name.Should().Be("珍珠");
    }

    [Fact]
    public async Task GetProductsWithRecipesAsync_NoProducts_ShouldReturnEmpty()
    {
        var result = await _service.GetProductsWithRecipesAsync();

        result.Should().BeEmpty();
    }

    #endregion
}
