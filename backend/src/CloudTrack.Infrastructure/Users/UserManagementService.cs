using System.Text.Json;
using CloudTrack.Application.Common;
using CloudTrack.Application.Users;
using CloudTrack.Application.Security;
using CloudTrack.Domain.Auditing;
using CloudTrack.Domain.Identity;
using CloudTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CloudTrack.Infrastructure.Users;

public sealed class UserManagementService(AppDbContext dbContext) : IUserManagementService
{
    public async Task<PagedResult<ManagedUserSummary>> ListUsersAsync(string? search, int page, int pageSize, CancellationToken cancellationToken)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var query = dbContext.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search.Trim()}%";
            query = query.Where(x => EF.Functions.Like(x.Email, term) || EF.Functions.Like(x.DisplayName, term));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(x => x.DisplayName).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new ManagedUserSummary(x.Id, x.Email, x.DisplayName, x.IsActive, x.CreatedAt, x.LastLoginAt, x.UserRoles.Select(role => role.Role.Name).ToArray()))
            .ToListAsync(cancellationToken);
        return new PagedResult<ManagedUserSummary>(items, page, pageSize, total);
    }

    public async Task<IReadOnlyCollection<RoleSummary>> ListRolesAsync(CancellationToken cancellationToken)
        => await dbContext.Roles.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new RoleSummary(x.Id, x.Name, x.Description, x.UserRoles.Count, x.RolePermissions.Select(grant => grant.Permission.Name).OrderBy(name => name).ToArray()))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<PermissionSummary>> ListPermissionsAsync(CancellationToken cancellationToken)
        => await dbContext.Permissions.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new PermissionSummary(x.Id, x.Name, x.Description, x.RolePermissions.Count))
            .ToListAsync(cancellationToken);

    public async Task<ManagedUserSummary> UpdateRolesAsync(Guid actorId, Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken)
    {
        var names = request.Roles.Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        var roles = await dbContext.Roles.Where(x => names.Contains(x.Name)).ToListAsync(cancellationToken);
        if (roles.Count != names.Length)
        {
            throw new AppException(400, "Unknown role", "One or more requested roles do not exist.");
        }

        var user = await dbContext.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role).SingleOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new AppException(404, "User not found", "The requested user does not exist.");
        var removesAdmin = user.UserRoles.Any(x => x.Role.Name == "Admin") && roles.All(x => x.Name != "Admin");
        if (removesAdmin && await ActiveAdminCountAsync(cancellationToken) <= 1)
        {
            throw new AppException(409, "Last admin protected", "Assign another active administrator before removing this role.");
        }

        var requestedRoleIds = roles.Select(x => x.Id).ToHashSet();
        dbContext.UserRoles.RemoveRange(user.UserRoles.Where(x => !requestedRoleIds.Contains(x.RoleId)));
        var existingRoleIds = user.UserRoles.Select(x => x.RoleId).ToHashSet();
        foreach (var role in roles.Where(x => !existingRoleIds.Contains(x.Id)))
        {
            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        }
        AddAudit(actorId, "UserRolesUpdated", user.Id, new { Roles = names });
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetUserAsync(user.Id, cancellationToken);
    }

    public async Task<ManagedUserSummary> UpdateStatusAsync(Guid actorId, Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken)
    {
        if (actorId == userId && !request.IsActive)
        {
            throw new AppException(409, "Self-deactivation blocked", "An administrator cannot deactivate their own account.");
        }

        var user = await dbContext.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role).SingleOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new AppException(404, "User not found", "The requested user does not exist.");
        if (!request.IsActive && user.UserRoles.Any(x => x.Role.Name == "Admin") && await ActiveAdminCountAsync(cancellationToken) <= 1)
        {
            throw new AppException(409, "Last admin protected", "Assign another active administrator before deactivating this account.");
        }

        user.IsActive = request.IsActive;
        AddAudit(actorId, request.IsActive ? "UserActivated" : "UserDeactivated", user.Id, null);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetUserAsync(user.Id, cancellationToken);
    }

    public async Task<RoleSummary> UpdateRolePermissionsAsync(Guid actorId, Guid roleId, UpdateRolePermissionsRequest request, CancellationToken cancellationToken)
    {
        var names = request.Permissions.Select(x => x.Trim()).Distinct(StringComparer.Ordinal).ToArray();
        var permissions = await dbContext.Permissions.Where(x => names.Contains(x.Name)).ToListAsync(cancellationToken);
        if (permissions.Count != names.Length)
        {
            throw new AppException(400, "Unknown permission", "One or more requested permissions do not exist.");
        }

        var role = await dbContext.Roles.Include(x => x.RolePermissions).SingleOrDefaultAsync(x => x.Id == roleId, cancellationToken)
            ?? throw new AppException(404, "Role not found", "The requested role does not exist.");
        if (role.Name == "Admin" && (!names.Contains(PermissionNames.ManageUsers, StringComparer.Ordinal) || !names.Contains(PermissionNames.ManageRoles, StringComparer.Ordinal)))
        {
            throw new AppException(409, "Admin permissions protected", "The Admin role must retain user and role management permissions.");
        }

        var requestedIds = permissions.Select(x => x.Id).ToHashSet();
        dbContext.RolePermissions.RemoveRange(role.RolePermissions.Where(x => !requestedIds.Contains(x.PermissionId)));
        var existingIds = role.RolePermissions.Select(x => x.PermissionId).ToHashSet();
        foreach (var permission in permissions.Where(x => !existingIds.Contains(x.Id)))
        {
            role.RolePermissions.Add(new RolePermissionGrant { RoleId = role.Id, PermissionId = permission.Id });
        }

        AddAudit(actorId, "RolePermissionsUpdated", role.Id, new { role.Name, Permissions = names }, "Role");
        await dbContext.SaveChangesAsync(cancellationToken);
        return await dbContext.Roles.AsNoTracking().Where(x => x.Id == role.Id)
            .Select(x => new RoleSummary(x.Id, x.Name, x.Description, x.UserRoles.Count, x.RolePermissions.Select(grant => grant.Permission.Name).OrderBy(name => name).ToArray()))
            .SingleAsync(cancellationToken);
    }

    private Task<int> ActiveAdminCountAsync(CancellationToken cancellationToken)
        => dbContext.Users.CountAsync(x => x.IsActive && x.UserRoles.Any(role => role.Role.Name == "Admin"), cancellationToken);

    private async Task<ManagedUserSummary> GetUserAsync(Guid userId, CancellationToken cancellationToken)
        => await dbContext.Users.AsNoTracking().Where(x => x.Id == userId)
            .Select(x => new ManagedUserSummary(x.Id, x.Email, x.DisplayName, x.IsActive, x.CreatedAt, x.LastLoginAt, x.UserRoles.Select(role => role.Role.Name).ToArray()))
            .SingleAsync(cancellationToken);

    private void AddAudit(Guid actorId, string action, Guid entityId, object? metadata, string entityType = "User") => dbContext.AuditLogs.Add(new AuditLog
    {
        ActorId = actorId,
        Action = action,
        EntityType = entityType,
        EntityId = entityId.ToString(),
        Metadata = metadata is null ? null : JsonSerializer.Serialize(metadata),
    });
}
