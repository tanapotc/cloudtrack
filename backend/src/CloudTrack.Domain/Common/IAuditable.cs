namespace CloudTrack.Domain.Common;

/// <summary>
/// Audit columns carried by every persisted table: who/when a row was created and last changed,
/// plus a soft-state flag so rows can be retired without a hard delete.
/// </summary>
public interface IAuditable
{
    Guid? CreatedBy { get; set; }
    DateTimeOffset CreatedAt { get; set; }
    Guid? UpdatedBy { get; set; }
    DateTimeOffset UpdatedAt { get; set; }
    bool IsActive { get; set; }
}
