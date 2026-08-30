using System.ComponentModel.DataAnnotations;
using CloudTrack.Application.Common;
using CloudTrack.Domain.Projects;

namespace CloudTrack.Application.Projects;

public sealed record ProjectQuery(string? Search, ProjectStatus? Status, string Sort = "updatedAt", bool Descending = true, int Page = 1, int PageSize = 10);
public sealed record ProjectSummary(Guid Id, string Name, string Description, ProjectStatus Status, int TaskCount, int CompletedTaskCount, int MemberCount, int Version, DateTimeOffset UpdatedAt);
public sealed record ProjectDetails(Guid Id, string Name, string Description, ProjectStatus Status, Guid OwnerId, int Version, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, IReadOnlyCollection<ProjectMemberSummary> Members, IReadOnlyCollection<WorkItemSummary> WorkItems);
public sealed record WorkItemSummary(Guid Id, string Title, string Description, WorkItemStatus Status, WorkItemPriority Priority, DateTimeOffset? DueDate, Guid? AssigneeId, int Version, int CommentCount);
public sealed record ProjectMemberSummary(Guid UserId, string Email, string DisplayName, DateTimeOffset JoinedAt, bool IsOwner);
public sealed record WorkItemCommentSummary(Guid Id, Guid WorkItemId, Guid AuthorId, string AuthorName, string Body, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
public sealed record CreateProjectRequest([Required, MinLength(3), MaxLength(120)] string Name, [MaxLength(1000)] string Description);
public sealed record UpdateProjectRequest([Required, MinLength(3), MaxLength(120)] string Name, [MaxLength(1000)] string Description, ProjectStatus Status, [Range(1, int.MaxValue)] int Version);
public sealed record CreateWorkItemRequest([Required, MinLength(3), MaxLength(160)] string Title, [MaxLength(2000)] string Description, WorkItemPriority Priority, DateTimeOffset? DueDate);
public sealed record UpdateWorkItemRequest([Required, MinLength(3), MaxLength(160)] string Title, [MaxLength(2000)] string Description, WorkItemStatus Status, WorkItemPriority Priority, DateTimeOffset? DueDate, Guid? AssigneeId, [Range(1, int.MaxValue)] int Version);
public sealed record AddProjectMemberRequest([Required, EmailAddress] string Email);
public sealed record CreateWorkItemCommentRequest([Required, MinLength(1), MaxLength(1000)] string Body);

public interface IProjectService
{
    Task<PagedResult<ProjectSummary>> ListAsync(Guid userId, ProjectQuery query, CancellationToken cancellationToken);
    Task<ProjectDetails> GetAsync(Guid userId, Guid projectId, CancellationToken cancellationToken);
    Task<ProjectDetails> CreateAsync(Guid userId, CreateProjectRequest request, CancellationToken cancellationToken);
    Task<ProjectDetails> UpdateAsync(Guid userId, Guid projectId, UpdateProjectRequest request, CancellationToken cancellationToken);
    Task DeleteAsync(Guid userId, Guid projectId, CancellationToken cancellationToken);
    Task<WorkItemSummary> CreateWorkItemAsync(Guid userId, Guid projectId, CreateWorkItemRequest request, CancellationToken cancellationToken);
    Task<WorkItemSummary> UpdateWorkItemAsync(Guid userId, Guid projectId, Guid workItemId, UpdateWorkItemRequest request, CancellationToken cancellationToken);
    Task DeleteWorkItemAsync(Guid userId, Guid projectId, Guid workItemId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<ProjectMemberSummary>> ListMembersAsync(Guid userId, Guid projectId, CancellationToken cancellationToken);
    Task<ProjectMemberSummary> AddMemberAsync(Guid userId, Guid projectId, AddProjectMemberRequest request, CancellationToken cancellationToken);
    Task RemoveMemberAsync(Guid userId, Guid projectId, Guid memberUserId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<WorkItemCommentSummary>> ListCommentsAsync(Guid userId, Guid projectId, Guid workItemId, CancellationToken cancellationToken);
    Task<WorkItemCommentSummary> CreateCommentAsync(Guid userId, Guid projectId, Guid workItemId, CreateWorkItemCommentRequest request, CancellationToken cancellationToken);
    Task DeleteCommentAsync(Guid userId, Guid projectId, Guid workItemId, Guid commentId, CancellationToken cancellationToken);
}
