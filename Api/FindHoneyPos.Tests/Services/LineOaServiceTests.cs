namespace FindHoneyPos.Tests.Services;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Infrastructure.Data;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;

public class LineOaServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly LineOaService _service;

    public LineOaServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _service = new LineOaService(_context);
    }

    public void Dispose() => _context.Dispose();

    #region GetSettingsAsync

    [Fact]
    public async Task GetSettingsAsync_NoSettings_ShouldAutoCreate()
    {
        var result = await _service.GetSettingsAsync();

        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetSettingsAsync_Existing_ShouldReturnSame()
    {
        var first = await _service.GetSettingsAsync();
        var second = await _service.GetSettingsAsync();

        first.Id.Should().Be(second.Id);
    }

    #endregion

    #region UpdateSettingsAsync

    [Fact]
    public async Task UpdateSettings_ShouldUpdateFields()
    {
        await _service.GetSettingsAsync(); // ensure exists

        var updated = new LineOaSetting
        {
            ChannelId = "ch123",
            ChannelSecret = "secret",
            AccessToken = "token",
            IsConnected = true,
            AutoReply = true,
            OrderNotification = true,
            PromotionNotification = false,
        };

        var result = await _service.UpdateSettingsAsync(updated);

        result.ChannelId.Should().Be("ch123");
        result.AutoReply.Should().BeTrue();
        result.PromotionNotification.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateSettings_NoExisting_ShouldCreate()
    {
        var settings = new LineOaSetting { ChannelId = "new" };
        var result = await _service.UpdateSettingsAsync(settings);

        result.ChannelId.Should().Be("new");
    }

    #endregion

    #region TestConnectionAsync

    [Fact]
    public async Task TestConnection_NoSettings_ShouldReturnFalse()
    {
        var result = await _service.TestConnectionAsync();

        result.Should().BeFalse();
    }

    [Fact]
    public async Task TestConnection_WithChannelId_ShouldReturnTrue()
    {
        var settings = new LineOaSetting { ChannelId = "ch123" };
        _context.LineOaSettings.Add(settings);
        await _context.SaveChangesAsync();

        var result = await _service.TestConnectionAsync();

        result.Should().BeTrue();
    }

    [Fact]
    public async Task TestConnection_EmptyChannelId_ShouldReturnFalse()
    {
        var settings = new LineOaSetting { ChannelId = "" };
        _context.LineOaSettings.Add(settings);
        await _context.SaveChangesAsync();

        var result = await _service.TestConnectionAsync();

        result.Should().BeFalse();
    }

    #endregion

    #region Templates

    [Fact]
    public async Task GetTemplatesAsync_ShouldReturnAll()
    {
        _context.MessageTemplates.Add(TestDataBuilder.CreateTemplate(name: "模板A"));
        _context.MessageTemplates.Add(TestDataBuilder.CreateTemplate(name: "模板B"));
        await _context.SaveChangesAsync();

        var result = await _service.GetTemplatesAsync();

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task UpdateTemplateAsync_ShouldUpdateFields()
    {
        var template = TestDataBuilder.CreateTemplate(name: "原始名稱");
        _context.MessageTemplates.Add(template);
        await _context.SaveChangesAsync();

        var updated = new MessageTemplate { Name = "新名稱", Type = "order", Content = "新內容", IsActive = false };
        var result = await _service.UpdateTemplateAsync(template.Id, updated);

        result.Should().NotBeNull();
        result!.Name.Should().Be("新名稱");
        result.Content.Should().Be("新內容");
        result.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateTemplateAsync_NotFound_ShouldReturnNull()
    {
        var template = new MessageTemplate { Name = "x", Type = "x", Content = "x" };
        var result = await _service.UpdateTemplateAsync(999, template);

        result.Should().BeNull();
    }

    [Fact]
    public async Task ToggleTemplateAsync_ShouldToggle()
    {
        var template = TestDataBuilder.CreateTemplate(isActive: true);
        _context.MessageTemplates.Add(template);
        await _context.SaveChangesAsync();

        var result = await _service.ToggleTemplateAsync(template.Id);

        result!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task ToggleTemplateAsync_NotFound_ShouldReturnNull()
    {
        var result = await _service.ToggleTemplateAsync(999);

        result.Should().BeNull();
    }

    #endregion

    #region Broadcast

    [Fact]
    public async Task BroadcastAsync_ShouldCreateHistory()
    {
        var result = await _service.BroadcastAsync("測試廣播", null);

        result.Should().NotBeNull();
        result.Message.Should().Be("測試廣播");
        result.Status.Should().Be("sent");
    }

    [Fact]
    public async Task GetBroadcastHistoryAsync_ShouldReturnAll()
    {
        await _service.BroadcastAsync("訊息1", null);
        await _service.BroadcastAsync("訊息2", null);

        var result = await _service.GetBroadcastHistoryAsync();

        result.Should().HaveCount(2);
    }

    #endregion
}
