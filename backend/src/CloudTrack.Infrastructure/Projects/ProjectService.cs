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
            .Where(x => x.Id == projectId)
            .Select(x => ToDetails(x))
            .SingleOrDefaultAsync(cancellationToken);
        return project ?? throw NotFound();
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
        _ = await OwnedProjects(userId).SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
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
        _ = await OwnedProjects(userId).SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
        var workItem = await dbContext.WorkItems.SingleOrDefaultAsync(x => x.Id == workItemId && x.ProjectId == projectId, cancellationToken) ?? throw NotFound();
        if (workItem.Version != request.Version)
        {
            throw new AppException(409, "Concurrent update", "This task changed after you loaded it. Refresh and try again.");
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
        _ = await OwnedProjects(userId).SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken) ?? throw NotFound();
        var workItem = await dbContext.WorkItems.SingleOrDefaultAsync(x => x.Id == workItemId && x.ProjectId == projectId, cancellationToken) ?? throw NotFound();
        dbContext.WorkItems.Remove(workItem);
        AddAudit(userId, "WorkItemDeleted", workItem.Id, new { workItem.Title, ProjectId = projectId });
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
        project.WorkItems.OrderByDescending(x => x.UpdatedAt).Select(x => ToSummary(x, x.Comments.Count)).ToArray());

    private static WorkItemSummary ToSummary(WorkItem item, int commentCount) => new(item.Id, item.Title, item.Description, item.Status, item.Priority, item.DueDate, item.AssigneeId, item.Version, commentCount);
    private static AppException NotFound() => new(404, "Project item not found", "The item does not exist or you do not have access to it.");

    private void AddAudit(Guid actorId, string action, Guid entityId, object metadata) => dbContext.AuditLogs.Add(new AuditLog
    {
        ActorId = actorId,
        Action = action,
        EntityType = action.StartsWith("Project", StringComparison.Ordinal) ? "Project" : "WorkItem",
        EntityId = entityId.ToString(),
        Metadata = JsonSerializer.Serialize(metadata),
    });
}

