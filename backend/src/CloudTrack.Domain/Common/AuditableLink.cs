namespace CloudTrack.Domain.Common;

/// <summary>
/// Base type for join tables that use a composite key and have no surrogate <c>Id</c>,
/// but still carry the standard audit columns.
/// </summary>
public abstract class AuditableLink : IAuditable
{
    public Guid? CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public Guid? UpdatedBy { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsActive { get; set; } = true;
}
