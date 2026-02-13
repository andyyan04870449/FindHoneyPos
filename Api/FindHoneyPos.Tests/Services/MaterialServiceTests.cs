namespace FindHoneyPos.Tests.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Infrastructure.Data;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

public class MaterialServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly MaterialService _service;
    private readonly Mock<ILogger<MaterialService>> _loggerMock;

    public MaterialServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _loggerMock = new Mock<ILogger<MaterialService>>();
        _service = new MaterialService(_context, _loggerMock.Object);
    }

    public void Dispose() => _context.Dispose();

    #region GetAllAsync

    [Fact]
    public async Task GetAllAsync_NoFilter_ShouldReturnAllMaterials()
    {
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "珍珠"));
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "椰果"));
        await _context.SaveChangesAsync();

        var result = await _service.GetAllAsync();

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAllAsync_WithSearch_ShouldFilterByName()
    {
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "珍珠"));
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "椰果"));
        await _context.SaveChangesAsync();

        var result = await _service.GetAllAsync(search: "珍珠");

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("珍珠");
    }

    [Fact]
    public async Task GetAllAsync_WithStatus_ShouldFilterByStatus()
    {
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "珍珠", status: MaterialStatus.Active));
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "椰果", status: MaterialStatus.Inactive));
        await _context.SaveChangesAsync();

        var result = await _service.GetAllAsync(status: MaterialStatus.Active);

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("珍珠");
    }

    [Fact]
    public async Task GetAllAsync_ShouldOrderByName()
    {
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "椰果"));
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "珍珠"));
        await _context.SaveChangesAsync();

        var result = (await _service.GetAllAsync()).ToList();

        result[0].Name.Should().Be("椰果");
        result[1].Name.Should().Be("珍珠");
    }

    #endregion

    #region GetByIdAsync

    [Fact]
    public async Task GetByIdAsync_Exists_ShouldReturnMaterial()
    {
        var material = TestDataBuilder.CreateMaterial(name: "珍珠");
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var result = await _service.GetByIdAsync(material.Id);

        result.Should().NotBeNull();
        result!.Name.Should().Be("珍珠");
    }

    [Fact]
    public async Task GetByIdAsync_NotFound_ShouldReturnNull()
    {
        var result = await _service.GetByIdAsync(999);

        result.Should().BeNull();
    }

    #endregion

    #region CreateAsync

    [Fact]
    public async Task CreateAsync_ShouldSetTimestamps()
    {
        var before = DateTime.UtcNow;
        var material = TestDataBuilder.CreateMaterial(name: "新原料");

        var result = await _service.CreateAsync(material);

        result.CreatedAt.Should().BeOnOrAfter(before);
        result.UpdatedAt.Should().BeOnOrAfter(before);
    }

    [Fact]
    public async Task CreateAsync_ShouldPersistMaterial()
    {
        var material = TestDataBuilder.CreateMaterial(name: "珍珠", unit: "g", currentStock: 500m);

        var result = await _service.CreateAsync(material);

        var saved = await _service.GetByIdAsync(result.Id);
        saved.Should().NotBeNull();
        saved!.Name.Should().Be("珍珠");
        saved.Unit.Should().Be("g");
        saved.CurrentStock.Should().Be(500m);
    }

    #endregion

    #region UpdateAsync

    [Fact]
    public async Task UpdateAsync_ShouldUpdateFields()
    {
        var material = TestDataBuilder.CreateMaterial(name: "原名");
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var updated = TestDataBuilder.CreateMaterial(name: "新名", unit: "ml", alertThreshold: 20m);
        var result = await _service.UpdateAsync(material.Id, updated);

        result.Should().NotBeNull();
        result!.Name.Should().Be("新名");
        result.Unit.Should().Be("ml");
        result.AlertThreshold.Should().Be(20m);
    }

    [Fact]
    public async Task UpdateAsync_NotFound_ShouldReturnNull()
    {
        var material = TestDataBuilder.CreateMaterial();
        var result = await _service.UpdateAsync(999, material);

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateTimestamp()
    {
        var material = TestDataBuilder.CreateMaterial(name: "原名");
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var originalUpdatedAt = material.UpdatedAt;
        await Task.Delay(10);

        var updated = TestDataBuilder.CreateMaterial(name: "新名");
        var result = await _service.UpdateAsync(material.Id, updated);

        result!.UpdatedAt.Should().BeAfter(originalUpdatedAt);
    }

    #endregion

    #region DeleteAsync

    [Fact]
    public async Task DeleteAsync_Existing_ShouldReturnTrue()
    {
        var material = TestDataBuilder.CreateMaterial();
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var result = await _service.DeleteAsync(material.Id);

        result.Should().BeTrue();
        (await _service.GetByIdAsync(material.Id)).Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_NotFound_ShouldReturnFalse()
    {
        var result = await _service.DeleteAsync(999);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_WithRecipes_ShouldReturnFalse()
    {
        var material = TestDataBuilder.CreateMaterial(name: "珍珠");
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var product = TestDataBuilder.CreateProduct(name: "珍珠奶茶");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var recipe = TestDataBuilder.CreateRecipe(product.Id, material.Id, 10m);
        _context.ProductRecipes.Add(recipe);
        await _context.SaveChangesAsync();

        var result = await _service.DeleteAsync(material.Id);

        result.Should().BeFalse();
        (await _service.GetByIdAsync(material.Id)).Should().NotBeNull();
    }

    #endregion

    #region ToggleStatusAsync

    [Fact]
    public async Task ToggleStatus_Active_ShouldBecomeInactive()
    {
        var material = TestDataBuilder.CreateMaterial(status: MaterialStatus.Active);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var result = await _service.ToggleStatusAsync(material.Id);

        result!.Status.Should().Be(MaterialStatus.Inactive);
    }

    [Fact]
    public async Task ToggleStatus_Inactive_ShouldBecomeActive()
    {
        var material = TestDataBuilder.CreateMaterial(status: MaterialStatus.Inactive);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var result = await _service.ToggleStatusAsync(material.Id);

        result!.Status.Should().Be(MaterialStatus.Active);
    }

    [Fact]
    public async Task ToggleStatus_NotFound_ShouldReturnNull()
    {
        var result = await _service.ToggleStatusAsync(999);

        result.Should().BeNull();
    }

    #endregion

    #region StockInAsync

    [Fact]
    public async Task StockInAsync_ShouldIncreaseStock()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 100m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var record = await _service.StockInAsync(material.Id, 50m, "補貨");

        record.ChangeType.Should().Be(StockChangeType.In);
        record.Quantity.Should().Be(50m);
        record.StockBefore.Should().Be(100m);
        record.StockAfter.Should().Be(150m);

        var updated = await _service.GetByIdAsync(material.Id);
        updated!.CurrentStock.Should().Be(150m);
    }

    [Fact]
    public async Task StockInAsync_MaterialNotFound_ShouldThrow()
    {
        var act = () => _service.StockInAsync(999, 50m);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Material not found*");
    }

    [Fact]
    public async Task StockInAsync_ShouldRecordOperator()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 100m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var record = await _service.StockInAsync(material.Id, 50m, "補貨", operatorId: 1);

        record.OperatorId.Should().Be(1);
        record.Note.Should().Be("補貨");
    }

    [Fact]
    public async Task StockInAsync_ShouldResolveAlertIfStockRecovered()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 5m, alertThreshold: 10m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var alert = TestDataBuilder.CreateMaterialAlert(material.Id, stockLevel: 5m, alertThreshold: 10m);
        _context.MaterialAlerts.Add(alert);
        await _context.SaveChangesAsync();

        await _service.StockInAsync(material.Id, 20m);

        var updatedAlert = _context.MaterialAlerts.First();
        updatedAlert.IsResolved.Should().BeTrue();
        updatedAlert.ResolvedAt.Should().NotBeNull();
    }

    #endregion

    #region AdjustStockAsync

    [Fact]
    public async Task AdjustStockAsync_ShouldSetNewStock()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 100m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var record = await _service.AdjustStockAsync(material.Id, 80m, "盤點調整");

        record.ChangeType.Should().Be(StockChangeType.Adjust);
        record.Quantity.Should().Be(-20m);
        record.StockBefore.Should().Be(100m);
        record.StockAfter.Should().Be(80m);

        var updated = await _service.GetByIdAsync(material.Id);
        updated!.CurrentStock.Should().Be(80m);
    }

    [Fact]
    public async Task AdjustStockAsync_Increase_ShouldCalculateCorrectQuantity()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 100m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var record = await _service.AdjustStockAsync(material.Id, 150m);

        record.Quantity.Should().Be(50m);
        record.StockAfter.Should().Be(150m);
    }

    [Fact]
    public async Task AdjustStockAsync_ShouldCreateAlertIfBelowThreshold()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 100m, alertThreshold: 20m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        await _service.AdjustStockAsync(material.Id, 15m);

        var alerts = _context.MaterialAlerts.Where(a => a.MaterialId == material.Id).ToList();
        alerts.Should().HaveCount(1);
        alerts.First().IsResolved.Should().BeFalse();
    }

    #endregion

    #region WasteAsync

    [Fact]
    public async Task WasteAsync_ShouldDecreaseStock()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 100m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var record = await _service.WasteAsync(material.Id, 30m, "過期報廢");

        record.ChangeType.Should().Be(StockChangeType.Waste);
        record.Quantity.Should().Be(-30m);
        record.StockBefore.Should().Be(100m);
        record.StockAfter.Should().Be(70m);
    }

    [Fact]
    public async Task WasteAsync_ShouldNotGoBelowZero()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 20m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var record = await _service.WasteAsync(material.Id, 50m);

        record.StockAfter.Should().Be(0m);

        var updated = await _service.GetByIdAsync(material.Id);
        updated!.CurrentStock.Should().Be(0m);
    }

    [Fact]
    public async Task WasteAsync_MaterialNotFound_ShouldThrow()
    {
        var act = () => _service.WasteAsync(999, 10m);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    #endregion

    #region ConsumeByOrderAsync

    [Fact]
    public async Task ConsumeByOrderAsync_ShouldDeductStockByRecipe()
    {
        var material = TestDataBuilder.CreateMaterial(name: "珍珠", currentStock: 1000m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var product = TestDataBuilder.CreateProduct(name: "珍珠奶茶");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var recipe = TestDataBuilder.CreateRecipe(product.Id, material.Id, quantity: 30m);
        _context.ProductRecipes.Add(recipe);
        await _context.SaveChangesAsync();

        var order = TestDataBuilder.CreateOrder();
        order.Items = new List<OrderItem>
        {
            new OrderItem { ProductId = product.Id, ProductName = "珍珠奶茶", Price = 50m, Quantity = 2 }
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        await _service.ConsumeByOrderAsync(order);

        var updated = await _service.GetByIdAsync(material.Id);
        updated!.CurrentStock.Should().Be(940m); // 1000 - (30 * 2)
    }

    [Fact]
    public async Task ConsumeByOrderAsync_NoRecipes_ShouldNotAffectStock()
    {
        var product = TestDataBuilder.CreateProduct(name: "無配方商品");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var order = TestDataBuilder.CreateOrder();
        order.Items = new List<OrderItem>
        {
            new OrderItem { ProductId = product.Id, ProductName = "無配方商品", Price = 50m, Quantity = 1 }
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var act = () => _service.ConsumeByOrderAsync(order);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task ConsumeByOrderAsync_EmptyItems_ShouldNotThrow()
    {
        var order = TestDataBuilder.CreateOrder();
        order.Items = new List<OrderItem>();
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var act = () => _service.ConsumeByOrderAsync(order);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task ConsumeByOrderAsync_ShouldCreateStockRecords()
    {
        var material = TestDataBuilder.CreateMaterial(name: "珍珠", currentStock: 1000m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var product = TestDataBuilder.CreateProduct(name: "珍珠奶茶");
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var recipe = TestDataBuilder.CreateRecipe(product.Id, material.Id, quantity: 30m);
        _context.ProductRecipes.Add(recipe);
        await _context.SaveChangesAsync();

        var order = TestDataBuilder.CreateOrder();
        order.Items = new List<OrderItem>
        {
            new OrderItem { ProductId = product.Id, ProductName = "珍珠奶茶", Price = 50m, Quantity = 1 }
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        await _service.ConsumeByOrderAsync(order);

        var records = _context.MaterialStockRecords.Where(r => r.MaterialId == material.Id).ToList();
        records.Should().HaveCount(1);
        records.First().ChangeType.Should().Be(StockChangeType.Out);
        records.First().OrderId.Should().Be(order.Id);
    }

    #endregion

    #region GetStockRecordsAsync

    [Fact]
    public async Task GetStockRecordsAsync_ShouldReturnAllRecords()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 100m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        await _service.StockInAsync(material.Id, 50m);
        await _service.WasteAsync(material.Id, 20m);

        var records = await _service.GetStockRecordsAsync();

        records.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetStockRecordsAsync_FilterByMaterialId()
    {
        var material1 = TestDataBuilder.CreateMaterial(name: "珍珠", currentStock: 100m);
        var material2 = TestDataBuilder.CreateMaterial(name: "椰果", currentStock: 100m);
        _context.Materials.AddRange(material1, material2);
        await _context.SaveChangesAsync();

        await _service.StockInAsync(material1.Id, 50m);
        await _service.StockInAsync(material2.Id, 30m);

        var records = await _service.GetStockRecordsAsync(materialId: material1.Id);

        records.Should().HaveCount(1);
        records.First().MaterialId.Should().Be(material1.Id);
    }

    [Fact]
    public async Task GetStockRecordsAsync_FilterByChangeType()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 100m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        await _service.StockInAsync(material.Id, 50m);
        await _service.WasteAsync(material.Id, 20m);

        var records = await _service.GetStockRecordsAsync(changeType: StockChangeType.In);

        records.Should().HaveCount(1);
        records.First().ChangeType.Should().Be(StockChangeType.In);
    }

    [Fact]
    public async Task GetStockRecordsAsync_Pagination()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 1000m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        for (int i = 0; i < 25; i++)
        {
            await _service.StockInAsync(material.Id, 10m);
        }

        var page1 = await _service.GetStockRecordsAsync(page: 1, pageSize: 10);
        var page2 = await _service.GetStockRecordsAsync(page: 2, pageSize: 10);
        var page3 = await _service.GetStockRecordsAsync(page: 3, pageSize: 10);

        page1.Should().HaveCount(10);
        page2.Should().HaveCount(10);
        page3.Should().HaveCount(5);
    }

    #endregion

    #region CheckAndCreateAlertsAsync

    [Fact]
    public async Task CheckAndCreateAlertsAsync_BelowThreshold_ShouldCreateAlert()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 5m, alertThreshold: 10m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        await _service.CheckAndCreateAlertsAsync(material.Id);

        var alerts = _context.MaterialAlerts.Where(a => a.MaterialId == material.Id).ToList();
        alerts.Should().HaveCount(1);
        alerts.First().StockLevel.Should().Be(5m);
    }

    [Fact]
    public async Task CheckAndCreateAlertsAsync_AboveThreshold_ShouldNotCreateAlert()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 100m, alertThreshold: 10m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        await _service.CheckAndCreateAlertsAsync(material.Id);

        var alerts = _context.MaterialAlerts.Where(a => a.MaterialId == material.Id).ToList();
        alerts.Should().BeEmpty();
    }

    [Fact]
    public async Task CheckAndCreateAlertsAsync_ExistingUnresolvedAlert_ShouldNotDuplicate()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 5m, alertThreshold: 10m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var existingAlert = TestDataBuilder.CreateMaterialAlert(material.Id, stockLevel: 8m);
        _context.MaterialAlerts.Add(existingAlert);
        await _context.SaveChangesAsync();

        await _service.CheckAndCreateAlertsAsync(material.Id);

        var alerts = _context.MaterialAlerts.Where(a => a.MaterialId == material.Id).ToList();
        alerts.Should().HaveCount(1);
    }

    #endregion

    #region GetActiveAlertsAsync

    [Fact]
    public async Task GetActiveAlertsAsync_ShouldReturnOnlyUnresolved()
    {
        var material = TestDataBuilder.CreateMaterial(currentStock: 5m, alertThreshold: 10m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var activeAlert = TestDataBuilder.CreateMaterialAlert(material.Id, isResolved: false);
        var resolvedAlert = TestDataBuilder.CreateMaterialAlert(material.Id, isResolved: true);
        _context.MaterialAlerts.AddRange(activeAlert, resolvedAlert);
        await _context.SaveChangesAsync();

        var alerts = await _service.GetActiveAlertsAsync();

        alerts.Should().HaveCount(1);
        alerts.First().IsResolved.Should().BeFalse();
    }

    [Fact]
    public async Task GetActiveAlertsAsync_ShouldIncludeMaterialInfo()
    {
        var material = TestDataBuilder.CreateMaterial(name: "珍珠", currentStock: 5m, alertThreshold: 10m);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var alert = TestDataBuilder.CreateMaterialAlert(material.Id);
        _context.MaterialAlerts.Add(alert);
        await _context.SaveChangesAsync();

        var alerts = await _service.GetActiveAlertsAsync();

        alerts.First().Material.Should().NotBeNull();
        alerts.First().Material.Name.Should().Be("珍珠");
    }

    #endregion

    #region ResolveAlertAsync

    [Fact]
    public async Task ResolveAlertAsync_ShouldMarkAsResolved()
    {
        var material = TestDataBuilder.CreateMaterial();
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var alert = TestDataBuilder.CreateMaterialAlert(material.Id, isResolved: false);
        _context.MaterialAlerts.Add(alert);
        await _context.SaveChangesAsync();

        await _service.ResolveAlertAsync(alert.Id);

        var updated = _context.MaterialAlerts.First();
        updated.IsResolved.Should().BeTrue();
        updated.ResolvedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ResolveAlertAsync_NotFound_ShouldNotThrow()
    {
        var act = () => _service.ResolveAlertAsync(999);

        await act.Should().NotThrowAsync();
    }

    #endregion

    #region GetMaterialStatusAsync

    [Fact]
    public async Task GetMaterialStatusAsync_ShouldReturnCorrectCounts()
    {
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "正常1", currentStock: 100m, alertThreshold: 10m, status: MaterialStatus.Active));
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "正常2", currentStock: 50m, alertThreshold: 10m, status: MaterialStatus.Active));
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "低庫存", currentStock: 5m, alertThreshold: 10m, status: MaterialStatus.Active));
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "缺貨", currentStock: 0m, alertThreshold: 10m, status: MaterialStatus.Active));
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "停用", currentStock: 100m, alertThreshold: 10m, status: MaterialStatus.Inactive));
        await _context.SaveChangesAsync();

        var result = await _service.GetMaterialStatusAsync();

        // 使用反射取得匿名類型的屬性
        var resultType = result.GetType();
        var totalCount = (int)resultType.GetProperty("totalCount")!.GetValue(result)!;
        var normalCount = (int)resultType.GetProperty("normalCount")!.GetValue(result)!;
        var lowStockCount = (int)resultType.GetProperty("lowStockCount")!.GetValue(result)!;
        var outOfStockCount = (int)resultType.GetProperty("outOfStockCount")!.GetValue(result)!;

        totalCount.Should().Be(4); // 只計算 Active
        normalCount.Should().Be(2);
        lowStockCount.Should().Be(1);
        outOfStockCount.Should().Be(1);
    }

    #endregion

    #region GetLowStockMaterialsAsync

    [Fact]
    public async Task GetLowStockMaterialsAsync_ShouldReturnOnlyLowStock()
    {
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "正常", currentStock: 100m, alertThreshold: 10m, status: MaterialStatus.Active));
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "低庫存", currentStock: 5m, alertThreshold: 10m, status: MaterialStatus.Active));
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "停用低庫存", currentStock: 5m, alertThreshold: 10m, status: MaterialStatus.Inactive));
        await _context.SaveChangesAsync();

        var result = await _service.GetLowStockMaterialsAsync();

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("低庫存");
    }

    [Fact]
    public async Task GetLowStockMaterialsAsync_ShouldOrderByCurrentStock()
    {
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "低1", currentStock: 8m, alertThreshold: 10m, status: MaterialStatus.Active));
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "低2", currentStock: 3m, alertThreshold: 10m, status: MaterialStatus.Active));
        _context.Materials.Add(TestDataBuilder.CreateMaterial(name: "低3", currentStock: 5m, alertThreshold: 10m, status: MaterialStatus.Active));
        await _context.SaveChangesAsync();

        var result = (await _service.GetLowStockMaterialsAsync()).ToList();

        result[0].Name.Should().Be("低2"); // 3m
        result[1].Name.Should().Be("低3"); // 5m
        result[2].Name.Should().Be("低1"); // 8m
    }

    #endregion
}
