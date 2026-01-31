namespace FindHoneyPos.Core.Entities;

public class BroadcastHistory
{
    public int Id { get; set; }
    public int? TemplateId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "sent";

    public MessageTemplate? Template { get; set; }
}
