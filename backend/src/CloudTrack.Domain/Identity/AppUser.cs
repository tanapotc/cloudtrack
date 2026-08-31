using CloudTrack.Domain.Common;
using CloudTrack.Domain.Projects;

namespace CloudTrack.Domain.Identity;

public sealed class AppUser : Entity
{
    public required string Email { get; set; }
    public required string NormalizedEmail { get; set; }
    public required string PasswordHash { get; set; }
    public required string DisplayName { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = [];
    public ICollection<Project> OwnedProjects { get; set; } = [];
    public ICollection<ProjectMember> ProjectMemberships { get; set; } = [];
    public ICollection<WorkItem> AssignedWorkItems { get; set; } = [];
    public ICollection<WorkItemComment> WrittenComments { get; set; } = [];
}
