namespace FindHoneyPos.Core.Entities;

public class IncentiveSetting
{
    public int Id { get; set; }
    public bool IsEnabled { get; set; } = true;
    public int DailyTarget { get; set; } = 125;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
