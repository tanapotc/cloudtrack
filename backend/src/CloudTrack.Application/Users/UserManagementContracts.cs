using System.ComponentModel.DataAnnotations;
using CloudTrack.Application.Common;

namespace CloudTrack.Application.Users;

public sealed record ManagedUserSummary(Guid Id, string Email, string DisplayName, bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? LastLoginAt, IReadOnlyCollection<string> Roles);
public sealed record RoleSummary(Guid Id, string Name, string Description, int UserCount);
public sealed record UpdateUserRolesRequest([MinLength(1)] IReadOnlyCollection<string> Roles);
public sealed record UpdateUserStatusRequest(bool IsActive);

public interface IUserManagementService
{
    Task<PagedResult<ManagedUserSummary>> ListUsersAsync(string? search, int page, int pageSize, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<RoleSummary>> ListRolesAsync(CancellationToken cancellationToken);
    Task<ManagedUserSummary> UpdateRolesAsync(Guid actorId, Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken);
    Task<ManagedUserSummary> UpdateStatusAsync(Guid actorId, Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken);
}

