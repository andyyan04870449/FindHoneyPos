namespace FindHoneyPos.Infrastructure.Services;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AppDbContext db, IConfiguration config, ILogger<AuthService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task<bool> HasAnyUserAsync()
    {
        return await _db.AdminUsers.AnyAsync();
    }

    public async Task<(AdminUser User, string Token)> RegisterFirstUserAsync(string username, string password, string displayName)
    {
        if (await HasAnyUserAsync())
            throw new InvalidOperationException("系統已初始化，無法重複註冊");

        var user = new AdminUser
        {
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            DisplayName = displayName,
            IsActive = true,
            LastLoginAt = DateTime.UtcNow,
        };

        _db.AdminUsers.Add(user);
        await _db.SaveChangesAsync();
        _logger.LogInformation("首位管理員已建立: {Username}", username);

        var token = GenerateToken(user);
        return (user, token);
    }

    public async Task<(AdminUser User, string Token)?> LoginAsync(string username, string password)
    {
        var user = await _db.AdminUsers.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return null;

        if (!user.IsActive)
            return null;

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var token = GenerateToken(user);
        return (user, token);
    }

    public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
    {
        var user = await _db.AdminUsers.FindAsync(userId);
        if (user is null) return false;

        if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        _logger.LogInformation("使用者已變更密碼: {Username}", user.Username);
        return true;
    }

    public async Task<AdminUser> CreateUserAsync(string username, string password, string displayName)
    {
        if (await _db.AdminUsers.AnyAsync(u => u.Username == username))
            throw new InvalidOperationException("帳號已存在");

        var user = new AdminUser
        {
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            DisplayName = displayName,
            IsActive = true,
        };

        _db.AdminUsers.Add(user);
        await _db.SaveChangesAsync();
        _logger.LogInformation("新帳號已建立: {Username}", username);
        return user;
    }

    public async Task<AdminUser?> UpdateUserAsync(int userId, string displayName)
    {
        var user = await _db.AdminUsers.FindAsync(userId);
        if (user is null) return null;

        user.DisplayName = displayName;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return user;
    }

    public async Task<AdminUser?> ToggleUserStatusAsync(int userId)
    {
        var user = await _db.AdminUsers.FindAsync(userId);
        if (user is null) return null;

        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        _logger.LogInformation("帳號狀態已切換: {Username} → {Status}", user.Username, user.IsActive ? "啟用" : "停用");
        return user;
    }

    public async Task<string?> ResetPasswordAsync(int userId, string newPassword)
    {
        var user = await _db.AdminUsers.FindAsync(userId);
        if (user is null) return null;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        _logger.LogInformation("密碼已重設: {Username}", user.Username);
        return user.Username;
    }

    public async Task<IEnumerable<AdminUser>> GetAllUsersAsync()
    {
        return await _db.AdminUsers.OrderBy(u => u.Id).ToListAsync();
    }

    public async Task<AdminUser?> GetUserByIdAsync(int userId)
    {
        return await _db.AdminUsers.FindAsync(userId);
    }

    private string GenerateToken(AdminUser user)
    {
        var jwtConfig = _config.GetSection("Jwt");
        var secret = jwtConfig["Secret"]!;
        var issuer = jwtConfig["Issuer"];
        var audience = jwtConfig["Audience"];
        var expiryHours = int.Parse(jwtConfig["ExpiryHours"] ?? "24");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim("name", user.DisplayName),
            new Claim("username", user.Username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
