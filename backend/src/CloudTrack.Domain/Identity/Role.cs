using CloudTrack.Domain.Common;

namespace CloudTrack.Domain.Identity;

public sealed class Role : Entity
{
    public required string Name { get; set; }
    public required string Description { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = [];
}

public sealed class UserRole
{
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
}

