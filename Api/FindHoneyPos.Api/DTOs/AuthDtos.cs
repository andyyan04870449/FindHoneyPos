namespace FindHoneyPos.Api.DTOs;

// Request DTOs
public record RegisterRequest(string Username, string Password, string ConfirmPassword, string DisplayName);
public record LoginRequest(string Username, string Password);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record CreateUserRequest(string Username, string Password, string DisplayName);
public record UpdateUserRequest(string DisplayName);
public record ResetPasswordRequest(string NewPassword);
public record ToggleStatusRequest(bool IsActive);

// Response DTOs
public record AuthResponse(string Token, UserInfo User);
public record UserInfo(int Id, string Username, string DisplayName, bool IsActive, DateTime CreatedAt, DateTime? LastLoginAt);
public record SystemStatusResponse(bool Initialized);
public record AuditLogResponse(long Id, int? UserId, string Username, string Action, string? Detail, string? IpAddress, DateTime CreatedAt);
