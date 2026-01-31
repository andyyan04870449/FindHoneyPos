namespace FindHoneyPos.Api.DTOs;

public record UpdateIncentiveSettingsRequest(bool IsEnabled, int DailyTarget);

public record IncentiveSettingsResponse(bool IsEnabled, int DailyTarget, DateTime UpdatedAt);

public record IncentiveHistoryItem(
    int Id,
    string Date,
    int Target,
    int ItemsSold,
    bool Achieved,
    DateTime SubmittedAt
);
