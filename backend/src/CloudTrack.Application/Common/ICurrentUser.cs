namespace CloudTrack.Application.Common;

/// <summary>Ambient identity of the caller behind the current unit of work, if any.</summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
}

/// <summary>Null identity for background work, seeding, and tests that run without a request.</summary>
public sealed class NoCurrentUser : ICurrentUser
{
    public static NoCurrentUser Instance { get; } = new();

    public Guid? UserId => null;
}
