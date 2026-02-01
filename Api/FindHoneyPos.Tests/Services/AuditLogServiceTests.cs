namespace FindHoneyPos.Tests.Services;

using FindHoneyPos.Infrastructure.Data;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;

public class AuditLogServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AuditLogService _service;

    public AuditLogServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _service = new AuditLogService(_context);
    }

    public void Dispose() => _context.Dispose();

    [Fact]
    public async Task LogAsync_ShouldPersistLog()
    {
        var user = TestDataBuilder.CreateAdminUser(username: "admin");
        _context.AdminUsers.Add(user);
        await _context.SaveChangesAsync();

        await _service.LogAsync(user.Id, "admin", "Login", "登入成功", "127.0.0.1");

        var logs = await _service.GetLogsAsync(1, 10);
        logs.Should().HaveCount(1);
        var log = logs.First();
        log.Username.Should().Be("admin");
        log.Action.Should().Be("Login");
        log.Detail.Should().Be("登入成功");
        log.IpAddress.Should().Be("127.0.0.1");
    }

    [Fact]
    public async Task GetLogsAsync_ShouldPaginate()
    {
        for (int i = 0; i < 5; i++)
            await _service.LogAsync(null, "admin", "Action", $"detail {i}");

        var page1 = await _service.GetLogsAsync(1, 2);
        var page2 = await _service.GetLogsAsync(2, 2);

        page1.Count().Should().Be(2);
        page2.Count().Should().Be(2);
    }

    [Fact]
    public async Task GetLogsAsync_ShouldFilterByAction()
    {
        await _service.LogAsync(null, "admin", "Login");
        await _service.LogAsync(null, "admin", "Logout");
        await _service.LogAsync(null, "admin", "Login");

        var logs = await _service.GetLogsAsync(1, 10, action: "Login");

        logs.Count().Should().Be(2);
    }

    [Fact]
    public async Task GetLogsAsync_ShouldOrderByCreatedAtDesc()
    {
        await _service.LogAsync(null, "admin", "First");
        await Task.Delay(10);
        await _service.LogAsync(null, "admin", "Second");

        var logs = (await _service.GetLogsAsync(1, 10)).ToList();

        logs[0].Action.Should().Be("Second");
        logs[1].Action.Should().Be("First");
    }

    [Fact]
    public async Task GetTotalCountAsync_ShouldReturnCorrectCount()
    {
        for (int i = 0; i < 5; i++)
            await _service.LogAsync(null, "admin", "Action");

        var count = await _service.GetTotalCountAsync();

        count.Should().Be(5);
    }

    [Fact]
    public async Task GetTotalCountAsync_WithActionFilter_ShouldFilterCount()
    {
        await _service.LogAsync(null, "admin", "Login");
        await _service.LogAsync(null, "admin", "Logout");
        await _service.LogAsync(null, "admin", "Login");

        var count = await _service.GetTotalCountAsync(action: "Login");

        count.Should().Be(2);
    }

    [Fact]
    public async Task LogAsync_NullOptionalFields_ShouldSucceed()
    {
        await _service.LogAsync(null, "system", "AutoAction");

        var logs = await _service.GetLogsAsync(1, 10);
        logs.Should().HaveCount(1);
        logs.First().UserId.Should().BeNull();
        logs.First().Detail.Should().BeNull();
        logs.First().IpAddress.Should().BeNull();
    }
}
