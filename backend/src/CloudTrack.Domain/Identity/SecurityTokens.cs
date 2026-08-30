using CloudTrack.Domain.Common;

namespace CloudTrack.Domain.Identity;

public sealed class RefreshToken : Entity
{
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public required string TokenHash { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public Guid? ReplacedByTokenId { get; set; }

    /// <summary>True while the token can still be exchanged: not revoked and not past expiry.</summary>
    /// <remarks>Distinct from the inherited <see cref="Entity.IsActive"/> soft-state flag.</remarks>
    public bool IsUsable => RevokedAt is null && ExpiresAt > DateTimeOffset.UtcNow;
}

public sealed class PasswordResetToken : Entity
{
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public required string TokenHash { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? UsedAt { get; set; }
}

