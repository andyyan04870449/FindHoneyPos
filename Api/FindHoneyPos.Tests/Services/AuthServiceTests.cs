namespace FindHoneyPos.Tests.Services;

using System.IdentityModel.Tokens.Jwt;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Infrastructure.Data;
using FindHoneyPos.Infrastructure.Services;
using FindHoneyPos.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

public class AuthServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        _context = TestDbContextFactory.Create();
        var config = TestConfigurationFactory.Create();
        var logger = NullLogger<AuthService>.Instance;
        _service = new AuthService(_context, config, logger);
    }

    public void Dispose() => _context.Dispose();

    #region RegisterFirstUserAsync

    [Fact]
    public async Task RegisterFirstUser_NoUsers_ShouldSucceed()
    {
        var (user, token) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        user.Should().NotBeNull();
        user.Username.Should().Be("admin");
        user.Role.Should().Be(UserRole.Admin);
        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task RegisterFirstUser_AlreadyHasUsers_ShouldThrow()
    {
        await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var act = () => _service.RegisterFirstUserAsync("admin2", "password123", "管理員2");

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
    public async Task RegisterFirstUser_ShouldSetIsActiveTrue()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        user.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task RegisterFirstUser_ShouldSetLastLoginAt()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        user.LastLoginAt.Should().NotBeNull();
    }

    #endregion

    #region LoginAsync

    [Fact]
    public async Task Login_CorrectCredentials_ShouldReturnUserAndToken()
    {
        await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var result = await _service.LoginAsync("admin", "password123");

        result.Should().NotBeNull();
        result!.Value.User.Username.Should().Be("admin");
        result.Value.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_WrongPassword_ShouldReturnNull()
    {
        await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var result = await _service.LoginAsync("admin", "wrongpassword");

        result.Should().BeNull();
    }

    [Fact]
    public async Task Login_NonExistentUser_ShouldReturnNull()
    {
        var result = await _service.LoginAsync("nobody", "password");

        result.Should().BeNull();
    }

    [Fact]
    public async Task Login_InactiveUser_ShouldReturnNull()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");
        user.IsActive = false;
        await _context.SaveChangesAsync();

        var result = await _service.LoginAsync("admin", "password123");

        result.Should().BeNull();
    }

    [Fact]
    public async Task Login_ShouldUpdateLastLoginAt()
    {
        await _service.RegisterFirstUserAsync("admin", "password123", "管理員");
        var beforeLogin = DateTime.UtcNow;

        var result = await _service.LoginAsync("admin", "password123");

        result!.Value.User.LastLoginAt.Should().BeOnOrAfter(beforeLogin);
    }

    [Fact]
    public async Task Login_JwtClaims_ShouldContainCorrectData()
    {
        await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var result = await _service.LoginAsync("admin", "password123");

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(result!.Value.Token);
        jwt.Claims.First(c => c.Type == "name").Value.Should().Be("管理員");
        jwt.Claims.First(c => c.Type == "username").Value.Should().Be("admin");
        jwt.Claims.First(c => c.Type == "role").Value.Should().Be("Admin");
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub);
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Jti);
    }

    #endregion

    #region ChangePasswordAsync

    [Fact]
    public async Task ChangePassword_CorrectOldPassword_ShouldSucceed()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var result = await _service.ChangePasswordAsync(user.Id, "password123", "newPassword456");

        result.Should().BeTrue();
    }

    [Fact]
    public async Task ChangePassword_WrongOldPassword_ShouldReturnFalse()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        var result = await _service.ChangePasswordAsync(user.Id, "wrongOld", "newPassword456");

        result.Should().BeFalse();
    }

    [Fact]
    public async Task ChangePassword_ShouldUpdateHash()
    {
        var (user, _) = await _service.RegisterFirstUserAsync("admin", "password123", "管理員");

        await _service.ChangePasswordAsync(user.Id, "password123", "newPassword456");

        var dbUser = await _context.AdminUsers.FindAsync(user.Id);
        BCrypt.Net.BCrypt.Verify("newPassword456", dbUser!.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task ChangePassword_UserNotFound_ShouldReturnFalse()
    {
        var result = await _service.ChangePasswordAsync(999, "old", "new");

        result.Should().BeFalse();
    }

    #endregion

    #region CreateUserAsync

    [Fact]
    public async Task CreateUser_ShouldSucceed()
    {
        var user = await _service.CreateUserAsync("cashier1", "pass123", "收銀員", UserRole.PosUser);

        user.Should().NotBeNull();
        user.Username.Should().Be("cashier1");
        user.Role.Should().Be(UserRole.PosUser);
        user.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CreateUser_DuplicateUsername_ShouldThrow()
    {
        await _service.CreateUserAsync("cashier1", "pass123", "收銀員", UserRole.PosUser);

        var act = () => _service.CreateUserAsync("cashier1", "pass456", "收銀員2", UserRole.PosUser);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task CreateUser_ShouldSetRole()
    {
        var admin = await _service.CreateUserAsync("admin2", "pass123", "管理員2", UserRole.Admin);

        admin.Role.Should().Be(UserRole.Admin);
    }

    #endregion

    #region ToggleUserStatusAsync

    [Fact]
    public async Task ToggleStatus_ActiveUser_ShouldBecomeInactive()
    {
        var user = TestDataBuilder.CreateAdminUser(username: "toggle1", isActive: true);
        _context.AdminUsers.Add(user);
        await _context.SaveChangesAsync();

        var result = await _service.ToggleUserStatusAsync(user.Id);

        result.Should().NotBeNull();
        result!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task ToggleStatus_InactiveUser_ShouldBecomeActive()
    {
        var user = TestDataBuilder.CreateAdminUser(username: "toggle2", isActive: false);
        _context.AdminUsers.Add(user);
        await _context.SaveChangesAsync();

        var result = await _service.ToggleUserStatusAsync(user.Id);

        result.Should().NotBeNull();
        result!.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task ToggleStatus_NotFound_ShouldReturnNull()
    {
        var result = await _service.ToggleUserStatusAsync(999);

        result.Should().BeNull();
    }

    #endregion

    #region HasAnyUserAsync

    [Fact]
    public async Task HasAnyUser_EmptyDb_ShouldReturnFalse()
    {
        var result = await _service.HasAnyUserAsync();

        result.Should().BeFalse();
    }

    [Fact]
    public async Task HasAnyUser_WithUsers_ShouldReturnTrue()
    {
        _context.AdminUsers.Add(TestDataBuilder.CreateAdminUser(username: "user1"));
        await _context.SaveChangesAsync();

        var result = await _service.HasAnyUserAsync();

        result.Should().BeTrue();
    }

    #endregion

    #region UpdateUserAsync

    [Fact]
    public async Task UpdateUser_ShouldUpdateDisplayName()
    {
        var user = TestDataBuilder.CreateAdminUser(username: "update1", displayName: "原名");
        _context.AdminUsers.Add(user);
        await _context.SaveChangesAsync();

        var result = await _service.UpdateUserAsync(user.Id, "新名字");

        result.Should().NotBeNull();
        result!.DisplayName.Should().Be("新名字");
    }

    [Fact]
    public async Task UpdateUser_NotFound_ShouldReturnNull()
    {
        var result = await _service.UpdateUserAsync(999, "任何名字");

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateUser_ShouldUpdateTimestamp()
    {
        var user = TestDataBuilder.CreateAdminUser(username: "update2");
        _context.AdminUsers.Add(user);
        await _context.SaveChangesAsync();
        var before = DateTime.UtcNow;

        var result = await _service.UpdateUserAsync(user.Id, "新名字");

        result!.UpdatedAt.Should().BeOnOrAfter(before);
    }

    #endregion

    #region GetAllUsersAsync

    [Fact]
    public async Task GetAllUsers_ShouldReturnAllUsers()
    {
        _context.AdminUsers.Add(TestDataBuilder.CreateAdminUser(username: "a1"));
        _context.AdminUsers.Add(TestDataBuilder.CreateAdminUser(username: "a2"));
        _context.AdminUsers.Add(TestDataBuilder.CreateAdminUser(username: "a3"));
        await _context.SaveChangesAsync();

        var result = (await _service.GetAllUsersAsync()).ToList();

        result.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetAllUsers_ShouldOrderById()
    {
        _context.AdminUsers.Add(TestDataBuilder.CreateAdminUser(username: "z_last"));
        _context.AdminUsers.Add(TestDataBuilder.CreateAdminUser(username: "a_first"));
        await _context.SaveChangesAsync();

        var result = (await _service.GetAllUsersAsync()).ToList();

        result[0].Id.Should().BeLessThan(result[1].Id);
    }

    [Fact]
    public async Task GetAllUsers_EmptyDb_ShouldReturnEmpty()
    {
        var result = await _service.GetAllUsersAsync();

        result.Should().BeEmpty();
    }

    #endregion

    #region GetUserByIdAsync

    [Fact]
    public async Task GetUserById_Exists_ShouldReturnUser()
    {
        var user = TestDataBuilder.CreateAdminUser(username: "findme", displayName: "找到我");
        _context.AdminUsers.Add(user);
        await _context.SaveChangesAsync();

        var result = await _service.GetUserByIdAsync(user.Id);

        result.Should().NotBeNull();
        result!.Username.Should().Be("findme");
        result.DisplayName.Should().Be("找到我");
    }

    [Fact]
    public async Task GetUserById_NotFound_ShouldReturnNull()
    {
        var result = await _service.GetUserByIdAsync(999);

        result.Should().BeNull();
    }

    #endregion

    #region ResetPasswordAsync

    [Fact]
    public async Task ResetPassword_ShouldReturnUsername()
    {
        var user = TestDataBuilder.CreateAdminUser(username: "resetuser");
        _context.AdminUsers.Add(user);
        await _context.SaveChangesAsync();

        var result = await _service.ResetPasswordAsync(user.Id, "newPass123");

        result.Should().Be("resetuser");
    }

    [Fact]
    public async Task ResetPassword_NotFound_ShouldReturnNull()
    {
        var result = await _service.ResetPasswordAsync(999, "newPass");

        result.Should().BeNull();
    }

    [Fact]
    public async Task ResetPassword_ShouldUpdateHash()
    {
        var user = TestDataBuilder.CreateAdminUser(username: "resetuser2");
        _context.AdminUsers.Add(user);
        await _context.SaveChangesAsync();

        await _service.ResetPasswordAsync(user.Id, "brandNewPass");

        var dbUser = await _context.AdminUsers.FindAsync(user.Id);
        BCrypt.Net.BCrypt.Verify("brandNewPass", dbUser!.PasswordHash).Should().BeTrue();
    }

    #endregion
}
