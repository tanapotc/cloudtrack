using CloudTrack.Domain.Common;
using CloudTrack.Domain.Identity;

namespace CloudTrack.Domain.Projects;

public enum ProjectStatus { Planning, Active, OnHold, Completed }
public enum WorkItemStatus { Backlog, InProgress, Review, Done }
public enum WorkItemPriority { Low, Medium, High, Critical }

public sealed class Project : Entity
{
    public required string Name { get; set; }
    public string Description { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
    public Guid OwnerId { get; set; }
    public int Version { get; set; } = 1;
    public ICollection<ProjectMember> Members { get; set; } = [];
    public ICollection<WorkItem> WorkItems { get; set; } = [];
}

public sealed class ProjectMember
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class WorkItem : Entity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public required string Title { get; set; }
    public string Description { get; set; } = string.Empty;
    public WorkItemStatus Status { get; set; } = WorkItemStatus.Backlog;
    public WorkItemPriority Priority { get; set; } = WorkItemPriority.Medium;
    public DateTimeOffset? DueDate { get; set; }
    public Guid? AssigneeId { get; set; }
    public int Version { get; set; } = 1;
    public ICollection<WorkItemComment> Comments { get; set; } = [];
}

public sealed class WorkItemComment : Entity
{
    public Guid WorkItemId { get; set; }
    public WorkItem WorkItem { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public AppUser Author { get; set; } = null!;
    public required string Body { get; set; }
}
