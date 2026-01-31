namespace FindHoneyPos.Api.DTOs;

public record UpdateLineSettingsRequest(
    string? ChannelId,
    string? ChannelSecret,
    string? AccessToken,
    bool AutoReply,
    bool OrderNotification,
    bool PromotionNotification
);

public record LineSettingsResponse(
    string? ChannelId,
    string? ChannelSecret,
    string? AccessToken,
    bool IsConnected,
    bool AutoReply,
    bool OrderNotification,
    bool PromotionNotification
);

public record UpdateTemplateRequest(
    string Name,
    string Type,
    string Content,
    bool IsActive
);

public record TemplateResponse(
    int Id,
    string Name,
    string Type,
    string Content,
    bool IsActive
);

public record BroadcastRequest(string Message, int? TemplateId = null);

public record BroadcastHistoryResponse(
    int Id,
    int? TemplateId,
    string? TemplateName,
    string Message,
    DateTime SentAt,
    string Status
);
