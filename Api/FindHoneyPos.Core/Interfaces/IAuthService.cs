namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;

public interface IAuthService
{
    Task<bool> HasAnyUserAsync();
    Task<(AdminUser User, string Token)> RegisterFirstUserAsync(string username, string password, string displayName);
    Task<(AdminUser User, string Token)?> LoginAsync(string username, string password);
    Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    Task<AdminUser> CreateUserAsync(string username, string password, string displayName, UserRole role);
    Task<AdminUser?> UpdateUserAsync(int userId, string displayName);
    Task<AdminUser?> ToggleUserStatusAsync(int userId);
    Task<string?> ResetPasswordAsync(int userId, string newPassword);
    Task<IEnumerable<AdminUser>> GetAllUsersAsync();
    Task<AdminUser?> GetUserByIdAsync(int userId);
}
