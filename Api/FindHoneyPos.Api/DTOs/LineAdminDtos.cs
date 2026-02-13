namespace FindHoneyPos.Api.DTOs;

using FindHoneyPos.Core.Enums;

public record LineAdminResponse(
    int Id,
    string LineUserId,
    string? DisplayName,
    string? PictureUrl,
    LineAdminStatus Status,
    string? ApprovedByName,
    DateTime? ApprovedAt,
    DateTime CreatedAt,
    bool IsActive
);

public record ApproveRejectRequest(string? Reason = null);
