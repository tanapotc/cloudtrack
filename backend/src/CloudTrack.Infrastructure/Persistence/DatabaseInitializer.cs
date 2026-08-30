using CloudTrack.Domain.Identity;
using CloudTrack.Application.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace CloudTrack.Infrastructure.Persistence;

public sealed class DatabaseInitializer(AppDbContext dbContext, IPasswordHasher<AppUser> passwordHasher, IConfiguration configuration)
{
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.Database.EnsureCreatedAsync(cancellationToken);
        await SeedRolesAndPermissionsAsync(cancellationToken);

        var adminEmail = configuration["Seed:AdminEmail"]?.Trim();
        var adminPassword = configuration["Seed:AdminPassword"];
        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword) || await dbContext.Users.AnyAsync(cancellationToken))
        {
            return;
        }

        var admin = new AppUser { Email = adminEmail, NormalizedEmail = adminEmail.ToUpperInvariant(), DisplayName = "CloudTrack Admin", PasswordHash = string.Empty };
        admin.PasswordHash = passwordHasher.HashPassword(admin, adminPassword);
        var adminRole = await dbContext.Roles.SingleAsync(x => x.Name == "Admin", cancellationToken);
        admin.UserRoles.Add(new UserRole { User = admin, Role = adminRole });
        dbContext.Users.Add(admin);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SeedRolesAndPermissionsAsync(CancellationToken cancellationToken)
    {
        var roleSeeds = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["Admin"] = "Full system administration",
            ["Manager"] = "Project and team management",
            ["User"] = "Standard project contributor",
        };
        var permissionSeeds = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [PermissionNames.ReadUsers] = "View user directory and account status",
            [PermissionNames.ManageUsers] = "Change user roles and account status",
            [PermissionNames.ManageRoles] = "Configure permissions assigned to roles",
            [PermissionNames.ReadProjects] = "View projects where the user is a member",
            [PermissionNames.ManageProjects] = "Create projects and manage project members",
            [PermissionNames.ManageTasks] = "Create and update project tasks",
            [PermissionNames.ManageComments] = "Create and remove task comments",
        };

        var existingRoleNames = await dbContext.Roles.Select(x => x.Name).ToListAsync(cancellationToken);
        dbContext.Roles.AddRange(roleSeeds
            .Where(seed => !existingRoleNames.Contains(seed.Key, StringComparer.Ordinal))
            .Select(seed => new Role { Name = seed.Key, Description = seed.Value }));

        var existingPermissionNames = await dbContext.Permissions.Select(x => x.Name).ToListAsync(cancellationToken);
        dbContext.Permissions.AddRange(permissionSeeds
            .Where(seed => !existingPermissionNames.Contains(seed.Key, StringComparer.Ordinal))
            .Select(seed => new PermissionDefinition { Name = seed.Key, Description = seed.Value }));
        await dbContext.SaveChangesAsync(cancellationToken);

        var roles = await dbContext.Roles.Include(x => x.RolePermissions).ToDictionaryAsync(x => x.Name, cancellationToken);
        var permissions = await dbContext.Permissions.ToDictionaryAsync(x => x.Name, cancellationToken);
        var grants = new Dictionary<string, IReadOnlyCollection<string>>(StringComparer.Ordinal)
        {
            ["Admin"] = PermissionNames.All,
            ["Manager"] =
            [
                PermissionNames.ReadUsers,
                PermissionNames.ReadProjects,
                PermissionNames.ManageProjects,
                PermissionNames.ManageTasks,
                PermissionNames.ManageComments,
            ],
            ["User"] =
            [
                PermissionNames.ReadProjects,
                PermissionNames.ManageProjects,
                PermissionNames.ManageTasks,
                PermissionNames.ManageComments,
            ],
        };

        foreach (var (roleName, permissionNames) in grants)
        {
            var role = roles[roleName];
            var existingIds = role.RolePermissions.Select(x => x.PermissionId).ToHashSet();
            foreach (var permissionName in permissionNames)
            {
                var permission = permissions[permissionName];
                if (!existingIds.Contains(permission.Id))
                {
                    role.RolePermissions.Add(new RolePermissionGrant { PermissionId = permission.Id });
                }
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
