namespace FindHoneyPos.Tests.Services;

using System.IdentityModel.Tokens.Jwt;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

public class AuthServiceTests : IDisposable
{
    private readonly Infrastructure.Data.AppDbContext _context;
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        _context = TestDbContextFactory.Create();
        var config = TestConfigurationFactory.Create();
        _service = new AuthService(_context, config, NullLogger<AuthService>.Instance);
    }

    public void Dispose() => _context.Dispose();

    // ===== HasAnyUserAsync =====

    [Fact]
    public async Task HasAnyUserAsync_ShouldReturnFalse_WhenNoUsers()
    {
        var result = await _service.HasAnyUserAsync();
        result.Should().BeFalse();
    }

    [Fact]
    public async Task HasAnyUserAsync_ShouldReturnTrue_WhenUsersExist()
    {
        await _service.RegisterFirstUserAsync("admin", "password123", "Admin");
        var result = await _service.HasAnyUserAsync();
        result.Should().BeTrue();
    }

    // ===== RegisterFirstUserAsync =====

    [Fact]
    public async Task RegisterFirstUser_ShouldSucceed_WhenNoUsersExist()
    {
        var (user, token) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        user.Username.Should().Be("admin");
        user.DisplayName.Should().Be("管理員");
        user.Role.Should().Be(UserRole.Admin);
        user.IsActive.Should().BeTrue();
        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task RegisterFirstUser_ShouldThrow_WhenUsersAlreadyExist()
    {
        await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var act = () => _service.RegisterFirstUserAsync("admin2", "password456", "管理員2");

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task RegisterFirstUser_ShouldHashPassword()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        user.PasswordHash.Should().NotBe("password123");
        BCrypt.Net.BCrypt.Verify("password123", user.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task RegisterFirstUser_ShouldReturnValidJwt()
    {
        var (user, token) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == user.Id.ToString());
        jwt.Claims.Should().Contain(c => c.Type == "username" && c.Value == "admin");
        jwt.Claims.Should().Contain(c => c.Type == "role" && c.Value == "Admin");
        jwt.Claims.Should().Contain(c => c.Type == "name" && c.Value == "管理員");
    }

    // ===== LoginAsync =====

    [Fact]
    public async Task Login_ShouldReturnUserAndToken_WithCorrectCredentials()
    {
        await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var result = await _service.LoginAsync("admin", "password123");

        result.Should().NotBeNull();
        result!.Value.User.Username.Should().Be("admin");
        result.Value.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_ShouldReturnNull_WithWrongPassword()
    {
        await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var result = await _service.LoginAsync("admin", "wrongpassword");

        result.Should().BeNull();
    }

    [Fact]
    public async Task Login_ShouldReturnNull_WhenUserNotFound()
    {
        var result = await _service.LoginAsync("nonexistent", "password123");

        result.Should().BeNull();
    }

    [Fact]
    public async Task Login_ShouldReturnNull_WhenUserIsInactive()
    {
        await _service.RegisterFirstUserAsync("admin", "password123", "管理員");
        var users = await _service.GetAllUsersAsync();
        await _service.ToggleUserStatusAsync(users.First().Id); // deactivate

        var result = await _service.LoginAsync("admin", "password123");

        result.Should().BeNull();
    }

    [Fact]
    public async Task Login_ShouldUpdateLastLoginAt()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");
        var firstLogin = user.LastLoginAt;

        await Task.Delay(10); // ensure different timestamp
        await _service.LoginAsync("admin", "password123");

        var updated = await _service.GetUserByIdAsync(user.Id);
        updated!.LastLoginAt.Should().BeAfter(firstLogin!.Value);
    }

    [Fact]
    public async Task Login_ShouldReturnJwt_WithCorrectClaims()
    {
        await _service.RegisterFirstUserAsync("admin", "password123", "管理員");
        var result = await _service.LoginAsync("admin", "password123");

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(result!.Value.Token);

        jwt.Claims.Should().Contain(c => c.Type == "username" && c.Value == "admin");
        jwt.Claims.Should().Contain(c => c.Type == "role" && c.Value == "Admin");
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Jti);
    }

    // ===== ChangePasswordAsync =====

    [Fact]
    public async Task ChangePassword_ShouldSucceed_WithCorrectOldPassword()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var result = await _service.ChangePasswordAsync(user.Id, "password123", "newpassword");

        result.Should().BeTrue();
    }

    [Fact]
    public async Task ChangePassword_ShouldFail_WithWrongOldPassword()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var result = await _service.ChangePasswordAsync(user.Id, "wrongpassword", "newpassword");

        result.Should().BeFalse();
    }

    [Fact]
    public async Task ChangePassword_ShouldReturnFalse_WhenUserNotFound()
    {
        var result = await _service.ChangePasswordAsync(999, "old", "new");

        result.Should().BeFalse();
    }

    [Fact]
    public async Task ChangePassword_ShouldUpdateHash()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");
        await _service.ChangePasswordAsync(user.Id, "password123", "newpassword");

        var loginResult = await _service.LoginAsync("admin", "newpassword");

        loginResult.Should().NotBeNull();
    }

    // ===== CreateUserAsync =====

    [Fact]
    public async Task CreateUser_ShouldCreateWithCorrectRole()
    {
        var user = await _service.CreateUserAsync("pos1", "password123", "POS 員工", UserRole.PosUser);

        user.Username.Should().Be("pos1");
        user.Role.Should().Be(UserRole.PosUser);
        user.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CreateUser_ShouldThrow_WhenUsernameExists()
    {
        await _service.CreateUserAsync("pos1", "password123", "POS 員工", UserRole.PosUser);

        var act = () => _service.CreateUserAsync("pos1", "password456", "另一個", UserRole.PosUser);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    // ===== ToggleUserStatusAsync =====

    [Fact]
    public async Task ToggleStatus_ShouldFlipActiveState()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var toggled = await _service.ToggleUserStatusAsync(user.Id);

        toggled!.IsActive.Should().BeFalse();

        var toggledBack = await _service.ToggleUserStatusAsync(user.Id);

        toggledBack!.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task ToggleStatus_ShouldReturnNull_WhenUserNotFound()
    {
        var result = await _service.ToggleUserStatusAsync(999);

        result.Should().BeNull();
    }

    // ===== ResetPasswordAsync =====

    [Fact]
    public async Task ResetPassword_ShouldReturnUsername()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var result = await _service.ResetPasswordAsync(user.Id, "newpassword");

        result.Should().Be("admin");
    }

    [Fact]
    public async Task ResetPassword_ShouldReturnNull_WhenUserNotFound()
    {
        var result = await _service.ResetPasswordAsync(999, "newpassword");

        result.Should().BeNull();
    }

    [Fact]
    public async Task ResetPassword_ShouldAllowLoginWithNewPassword()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");
        await _service.ResetPasswordAsync(user.Id, "resetted");

        var loginResult = await _service.LoginAsync("admin", "resetted");

        loginResult.Should().NotBeNull();
    }
}
