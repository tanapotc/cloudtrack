using System.ComponentModel.DataAnnotations;
using CloudTrack.Application.Common;

namespace CloudTrack.Application.Users;

public sealed record ManagedUserSummary(Guid Id, string Email, string DisplayName, bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? LastLoginAt, IReadOnlyCollection<string> Roles);
public sealed record RoleSummary(Guid Id, string Name, string Description, int UserCount, IReadOnlyCollection<string> Permissions);
public sealed record PermissionSummary(Guid Id, string Name, string Description, int RoleCount);
public sealed record UpdateUserRolesRequest([MinLength(1)] IReadOnlyCollection<string> Roles);
public sealed record UpdateUserStatusRequest(bool IsActive);
public sealed record UpdateRolePermissionsRequest([MinLength(1)] IReadOnlyCollection<string> Permissions);

public interface IUserManagementService
{
    Task<PagedResult<ManagedUserSummary>> ListUsersAsync(string? search, int page, int pageSize, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<RoleSummary>> ListRolesAsync(CancellationToken cancellationToken);
    Task<IReadOnlyCollection<PermissionSummary>> ListPermissionsAsync(CancellationToken cancellationToken);
    Task<ManagedUserSummary> UpdateRolesAsync(Guid actorId, Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken);
    Task<ManagedUserSummary> UpdateStatusAsync(Guid actorId, Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken);
    Task<RoleSummary> UpdateRolePermissionsAsync(Guid actorId, Guid roleId, UpdateRolePermissionsRequest request, CancellationToken cancellationToken);
}
