using System.Text.Json;
using CloudTrack.Application.Common;
using CloudTrack.Application.Projects;
using CloudTrack.Domain.Auditing;
using CloudTrack.Domain.Projects;
using CloudTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CloudTrack.Infrastructure.Projects;

public sealed class ProjectService(AppDbContext dbContext) : IProjectService
{
    public async Task<PagedResult<ProjectSummary>> ListAsync(Guid userId, ProjectQuery query, CancellationToken cancellationToken)
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);
        var projects = dbContext.Projects.AsNoTracking()
            .Where(x => x.OwnerId == userId || x.Members.Any(member => member.UserId == userId));

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = $"%{query.Search.Trim()}%";
            projects = projects.Where(x => EF.Functions.Like(x.Name, term) || EF.Functions.Like(x.Description, term));
        }

        if (query.Status.HasValue)
        {
            projects = projects.Where(x => x.Status == query.Status.Value);
        }

        projects = (query.Sort.ToLowerInvariant(), query.Descending) switch
        {
            ("name", false) => projects.OrderBy(x => x.Name),
            ("name", true) => projects.OrderByDescending(x => x.Name),
            ("createdat", false) => projects.OrderBy(x => x.CreatedAt),
            ("createdat", true) => projects.OrderByDescending(x => x.CreatedAt),
            (_, false) => projects.OrderBy(x => x.UpdatedAt),
            _ => projects.OrderByDescending(x => x.UpdatedAt),
        };

        var total = await projects.CountAsync(cancellationToken);
        var items = await projects.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new ProjectSummary(
                x.Id,
                x.Name,
                x.Description,
                x.Status,
                x.WorkItems.Count,
                x.WorkItems.Count(task => task.Status == WorkItemStatus.Done),
                x.Members.Count,
                x.Version,
                x.UpdatedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<ProjectSummary>(items, page, pageSize, total);
    }

    public async Task<ProjectDetails> GetAsync(Guid userId, Guid projectId, CancellationToken cancellationToken)
    {
        var project = await VisibleProjects(userId).AsNoTracking()
            .Include(x => x.Members)
                .ThenInclude(x => x.User)
            .Include(x => x.WorkItems)
                .ThenInclude(x => x.Comments)
            .SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken);
        return project is null ? throw NotFound() : ToDetails(project);
    }

    public async Task<ProjectDetails> CreateAsync(Guid userId, CreateProjectRequest request, CancellationToken cancellationToken)
    {
        var project = new Project
        {
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            OwnerId = userId,
        };
        project.Members.Add(new ProjectMember { Project = project, UserId = userId });
        dbContext.Projects.Add(project);
        AddAudit(userId, "ProjectCreated", project.Id, new { project.Name });
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAsync(userId, project.Id, cancellationToken);
    }

    public async Task<ProjectDetails> UpdateAsync(Guid userId, Guid projectId, UpdateProjectRequest request, CancellationToken cancellationToken)
    {
        var project = await OwnedProjects(userId).SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
        if (project.Version != request.Version)
        {
            throw new AppException(409, "Concurrent update", "This project changed after you loaded it. Refresh and try again.");
        }

        project.Name = request.Name.Trim();
        project.Description = request.Description.Trim();
        project.Status = request.Status;
        project.Version++;
        AddAudit(userId, "ProjectUpdated", project.Id, new { project.Name, project.Status, project.Version });
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAsync(userId, project.Id, cancellationToken);
    }

    public async Task DeleteAsync(Guid userId, Guid projectId, CancellationToken cancellationToken)
    {
        var project = await OwnedProjects(userId).SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
        dbContext.Projects.Remove(project);
        AddAudit(userId, "ProjectDeleted", project.Id, new { project.Name });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<WorkItemSummary> CreateWorkItemAsync(Guid userId, Guid projectId, CreateWorkItemRequest request, CancellationToken cancellationToken)
    {
        _ = await VisibleProjects(userId).SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
        var workItem = new WorkItem
        {
            ProjectId = projectId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Priority = request.Priority,
            DueDate = request.DueDate,
        };
        dbContext.WorkItems.Add(workItem);
        AddAudit(userId, "WorkItemCreated", workItem.Id, new { workItem.Title, ProjectId = projectId });
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToSummary(workItem, 0);
    }

    public async Task<WorkItemSummary> UpdateWorkItemAsync(Guid userId, Guid projectId, Guid workItemId, UpdateWorkItemRequest request, CancellationToken cancellationToken)
    {
        var project = await VisibleProjects(userId).Include(x => x.Members).SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
        var workItem = await dbContext.WorkItems.SingleOrDefaultAsync(x => x.Id == workItemId && x.ProjectId == projectId, cancellationToken) ?? throw NotFound();
        if (workItem.Version != request.Version)
        {
            throw new AppException(409, "Concurrent update", "This task changed after you loaded it. Refresh and try again.");
        }
        if (request.AssigneeId.HasValue && project.Members.All(x => x.UserId != request.AssigneeId.Value))
        {
            throw new AppException(400, "Invalid assignee", "Tasks can only be assigned to an active project member.");
        }

        workItem.Title = request.Title.Trim();
        workItem.Description = request.Description.Trim();
        workItem.Status = request.Status;
        workItem.Priority = request.Priority;
        workItem.DueDate = request.DueDate;
        workItem.AssigneeId = request.AssigneeId;
        workItem.Version++;
        AddAudit(userId, "WorkItemUpdated", workItem.Id, new { workItem.Title, workItem.Status, workItem.Version });
        await dbContext.SaveChangesAsync(cancellationToken);
        var commentCount = await dbContext.WorkItemComments.CountAsync(x => x.WorkItemId == workItem.Id, cancellationToken);
        return ToSummary(workItem, commentCount);
    }

    public async Task DeleteWorkItemAsync(Guid userId, Guid projectId, Guid workItemId, CancellationToken cancellationToken)
    {
        _ = await VisibleProjects(userId).SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
        var workItem = await dbContext.WorkItems.SingleOrDefaultAsync(x => x.Id == workItemId && x.ProjectId == projectId, cancellationToken) ?? throw NotFound();
        dbContext.WorkItems.Remove(workItem);
        AddAudit(userId, "WorkItemDeleted", workItem.Id, new { workItem.Title, ProjectId = projectId });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<ProjectMemberSummary>> ListMembersAsync(Guid userId, Guid projectId, CancellationToken cancellationToken)
    {
        _ = await VisibleProjects(userId).AsNoTracking().SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
        return await dbContext.ProjectMembers.AsNoTracking()
            .Where(x => x.ProjectId == projectId)
            .OrderBy(x => x.User.DisplayName)
            .Select(x => new ProjectMemberSummary(x.UserId, x.User.Email, x.User.DisplayName, x.JoinedAt, x.Project.OwnerId == x.UserId))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProjectMemberSummary> AddMemberAsync(Guid userId, Guid projectId, AddProjectMemberRequest request, CancellationToken cancellationToken)
    {
        var project = await OwnedProjects(userId).Include(x => x.Members).SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var member = await dbContext.Users.AsNoTracking().SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail && x.IsActive, cancellationToken)
            ?? throw new AppException(404, "User not found", "No active CloudTrack account uses that email address.");
        if (project.Members.Any(x => x.UserId == member.Id))
        {
            throw new AppException(409, "Member already added", "This user is already a project member.");
        }

        var projectMember = new ProjectMember { ProjectId = projectId, UserId = member.Id };
        dbContext.ProjectMembers.Add(projectMember);
        AddAudit(userId, "ProjectMemberAdded", projectId, new { MemberUserId = projectMember.UserId, project.Name });
        await dbContext.SaveChangesAsync(cancellationToken);
        return new ProjectMemberSummary(member.Id, member.Email, member.DisplayName, projectMember.JoinedAt, false);
    }

    public async Task RemoveMemberAsync(Guid userId, Guid projectId, Guid memberUserId, CancellationToken cancellationToken)
    {
        var strategy = dbContext.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            var project = await OwnedProjects(userId).SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
            if (project.OwnerId == memberUserId)
            {
                throw new AppException(409, "Owner protected", "Transfer ownership before removing the project owner.");
            }

            var membership = await dbContext.ProjectMembers.SingleOrDefaultAsync(x => x.ProjectId == projectId && x.UserId == memberUserId, cancellationToken) ?? throw NotFound();
            dbContext.ProjectMembers.Remove(membership);
            await dbContext.WorkItems.Where(x => x.ProjectId == projectId && x.AssigneeId == memberUserId)
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.AssigneeId, (Guid?)null), cancellationToken);
            AddAudit(userId, "ProjectMemberRemoved", projectId, new { MemberUserId = memberUserId, project.Name });
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        });
    }

    public async Task<IReadOnlyCollection<WorkItemCommentSummary>> ListCommentsAsync(Guid userId, Guid projectId, Guid workItemId, CancellationToken cancellationToken)
    {
        _ = await VisibleProjects(userId).AsNoTracking().SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
        var taskExists = await dbContext.WorkItems.AsNoTracking().AnyAsync(x => x.Id == workItemId && x.ProjectId == projectId, cancellationToken);
        if (!taskExists)
        {
            throw NotFound();
        }

        return await dbContext.WorkItemComments.AsNoTracking()
            .Where(x => x.WorkItemId == workItemId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new WorkItemCommentSummary(x.Id, x.WorkItemId, x.AuthorId, x.Author.DisplayName, x.Body, x.CreatedAt, x.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<WorkItemCommentSummary> CreateCommentAsync(Guid userId, Guid projectId, Guid workItemId, CreateWorkItemCommentRequest request, CancellationToken cancellationToken)
    {
        _ = await VisibleProjects(userId).AsNoTracking().SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
        var workItem = await dbContext.WorkItems.AsNoTracking().SingleOrDefaultAsync(x => x.Id == workItemId && x.ProjectId == projectId, cancellationToken) ?? throw NotFound();
        var authorName = await dbContext.Users.AsNoTracking().Where(x => x.Id == userId).Select(x => x.DisplayName).SingleAsync(cancellationToken);
        var comment = new WorkItemComment { WorkItemId = workItem.Id, AuthorId = userId, Body = request.Body.Trim() };
        dbContext.WorkItemComments.Add(comment);
        AddAudit(userId, "CommentCreated", comment.Id, new { ProjectId = projectId, WorkItemId = workItemId }, "Comment");
        await dbContext.SaveChangesAsync(cancellationToken);
        return new WorkItemCommentSummary(comment.Id, comment.WorkItemId, comment.AuthorId, authorName, comment.Body, comment.CreatedAt, comment.UpdatedAt);
    }

    public async Task DeleteCommentAsync(Guid userId, Guid projectId, Guid workItemId, Guid commentId, CancellationToken cancellationToken)
    {
        var project = await VisibleProjects(userId).AsNoTracking().SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
        var comment = await dbContext.WorkItemComments.SingleOrDefaultAsync(x => x.Id == commentId && x.WorkItemId == workItemId && x.WorkItem.ProjectId == projectId, cancellationToken) ?? throw NotFound();
        if (comment.AuthorId != userId && project.OwnerId != userId)
        {
            throw new AppException(403, "Comment deletion denied", "Only the author or project owner can remove this comment.");
        }

        dbContext.WorkItemComments.Remove(comment);
        AddAudit(userId, "CommentDeleted", comment.Id, new { ProjectId = projectId, WorkItemId = workItemId }, "Comment");
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<Project> VisibleProjects(Guid userId) => dbContext.Projects.Where(x => x.OwnerId == userId || x.Members.Any(member => member.UserId == userId));
    private IQueryable<Project> OwnedProjects(Guid userId) => dbContext.Projects.Where(x => x.OwnerId == userId);

    private static ProjectDetails ToDetails(Project project) => new(
        project.Id,
        project.Name,
        project.Description,
        project.Status,
        project.OwnerId,
        project.Version,
        project.CreatedAt,
        project.UpdatedAt,
        project.Members.OrderBy(x => x.User.DisplayName).Select(x => new ProjectMemberSummary(x.UserId, x.User.Email, x.User.DisplayName, x.JoinedAt, project.OwnerId == x.UserId)).ToArray(),
        project.WorkItems.OrderByDescending(x => x.UpdatedAt).Select(x => ToSummary(x, x.Comments.Count)).ToArray());

    private static WorkItemSummary ToSummary(WorkItem item, int commentCount) => new(item.Id, item.Title, item.Description, item.Status, item.Priority, item.DueDate, item.AssigneeId, item.Version, commentCount);
    private static AppException NotFound() => new(404, "Project item not found", "The item does not exist or you do not have access to it.");

    private void AddAudit(Guid actorId, string action, Guid entityId, object metadata, string? entityType = null) => dbContext.AuditLogs.Add(new AuditLog
    {
        ActorId = actorId,
        Action = action,
        EntityType = entityType ?? (action.StartsWith("Project", StringComparison.Ordinal) ? "Project" : "WorkItem"),
        EntityId = entityId.ToString(),
        Metadata = JsonSerializer.Serialize(metadata),
    });
}
