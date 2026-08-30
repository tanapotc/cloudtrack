using CloudTrack.Application.Dashboard;
using CloudTrack.Domain.Projects;
using CloudTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CloudTrack.Infrastructure.Dashboard;

public sealed class DashboardService(AppDbContext dbContext) : IDashboardService
{
    public async Task<DashboardSummary> GetAsync(Guid userId, CancellationToken cancellationToken)
    {
        var projects = dbContext.Projects.AsNoTracking().Where(x => x.OwnerId == userId || x.Members.Any(member => member.UserId == userId));
        var workItems = dbContext.WorkItems.AsNoTracking().Where(x => projects.Select(project => project.Id).Contains(x.ProjectId));
        var now = DateTimeOffset.UtcNow;
        var dueSoon = now.AddDays(7);

        var projectCount = await projects.CountAsync(cancellationToken);
        var activeProjectCount = await projects.CountAsync(x => x.Status == ProjectStatus.Active, cancellationToken);
        var openTaskCount = await workItems.CountAsync(x => x.Status != WorkItemStatus.Done, cancellationToken);
        var completedTaskCount = await workItems.CountAsync(x => x.Status == WorkItemStatus.Done, cancellationToken);
        var dueSoonCount = await workItems.CountAsync(x => x.Status != WorkItemStatus.Done && x.DueDate >= now && x.DueDate <= dueSoon, cancellationToken);
        var recentActivity = await dbContext.AuditLogs.AsNoTracking()
            .Where(x => x.ActorId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(8)
            .Select(x => new ActivitySummary(x.Action, x.EntityType, x.EntityId, x.CreatedAt))
            .ToListAsync(cancellationToken);

        return new DashboardSummary(projectCount, activeProjectCount, openTaskCount, completedTaskCount, dueSoonCount, recentActivity, "Healthy");
    }
}

