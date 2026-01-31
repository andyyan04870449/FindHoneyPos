namespace FindHoneyPos.Core.Entities;

public class MessageTemplate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public ICollection<BroadcastHistory> BroadcastHistories { get; set; } = new List<BroadcastHistory>();
}
