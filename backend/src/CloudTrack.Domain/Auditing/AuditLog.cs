using CloudTrack.Domain.Common;

namespace CloudTrack.Domain.Auditing;

public sealed class AuditLog : Entity
{
    public Guid? ActorId { get; set; }
    public required string Action { get; set; }
    public required string EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? Metadata { get; set; }
}

