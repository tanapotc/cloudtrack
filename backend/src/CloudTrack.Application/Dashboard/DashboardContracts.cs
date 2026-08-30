namespace CloudTrack.Application.Dashboard;

public sealed record DashboardSummary(
    int ProjectCount,
    int ActiveProjectCount,
    int OpenTaskCount,
    int CompletedTaskCount,
    int DueSoonCount,
    int TotalUserCount,
    int LoginCountToday,
    IReadOnlyCollection<ActivitySummary> RecentActivity,
    string ApiStatus,
    string DatabaseStatus,
    DateTimeOffset GeneratedAt);

public sealed record ActivitySummary(string Action, string EntityType, string? EntityId, DateTimeOffset OccurredAt);

public interface IDashboardService
{
    Task<DashboardSummary> GetAsync(Guid userId, CancellationToken cancellationToken);
}
