namespace FindHoneyPos.Tests.Services;

using FindHoneyPos.Infrastructure.Data;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;

public class IncentiveServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly IncentiveService _service;

    public IncentiveServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _service = new IncentiveService(_context);
    }

    public void Dispose() => _context.Dispose();

    #region GetSettingsAsync

    [Fact]
    public async Task GetSettingsAsync_NoSettings_ShouldAutoCreateWithDefaults()
    {
        var result = await _service.GetSettingsAsync();

        result.Should().NotBeNull();
        result.IsEnabled.Should().BeTrue();
        result.DailyTarget.Should().Be(125);
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
    public async Task UpdateSettingsAsync_NoExisting_ShouldCreate()
    {
        var result = await _service.UpdateSettingsAsync(false, 200);

        result.IsEnabled.Should().BeFalse();
        result.DailyTarget.Should().Be(200);
    }

    [Fact]
    public async Task UpdateSettingsAsync_Existing_ShouldUpdate()
    {
        await _service.GetSettingsAsync(); // ensure exists

        var result = await _service.UpdateSettingsAsync(false, 300);

        result.IsEnabled.Should().BeFalse();
        result.DailyTarget.Should().Be(300);
    }

    [Fact]
    public async Task UpdateSettingsAsync_ShouldUpdateTimestamp()
    {
        var before = DateTime.UtcNow;

        var result = await _service.UpdateSettingsAsync(true, 150);

        result.UpdatedAt.Should().BeOnOrAfter(before);
    }

    #endregion
}
