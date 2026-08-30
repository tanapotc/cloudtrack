using System.Text.Json;
using CloudTrack.Application.Common;
using CloudTrack.Application.Users;
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
            .Select(x => new RoleSummary(x.Id, x.Name, x.Description, x.UserRoles.Count))
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

    private Task<int> ActiveAdminCountAsync(CancellationToken cancellationToken)
        => dbContext.Users.CountAsync(x => x.IsActive && x.UserRoles.Any(role => role.Role.Name == "Admin"), cancellationToken);

    private async Task<ManagedUserSummary> GetUserAsync(Guid userId, CancellationToken cancellationToken)
        => await dbContext.Users.AsNoTracking().Where(x => x.Id == userId)
            .Select(x => new ManagedUserSummary(x.Id, x.Email, x.DisplayName, x.IsActive, x.CreatedAt, x.LastLoginAt, x.UserRoles.Select(role => role.Role.Name).ToArray()))
            .SingleAsync(cancellationToken);

    private void AddAudit(Guid actorId, string action, Guid userId, object? metadata) => dbContext.AuditLogs.Add(new AuditLog
    {
        ActorId = actorId,
        Action = action,
        EntityType = "User",
        EntityId = userId.ToString(),
        Metadata = metadata is null ? null : JsonSerializer.Serialize(metadata),
    });
}
