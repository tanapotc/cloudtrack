using CloudTrack.Domain.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace CloudTrack.Infrastructure.Persistence;

public sealed class DatabaseInitializer(AppDbContext dbContext, IPasswordHasher<AppUser> passwordHasher, IConfiguration configuration)
{
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.Database.EnsureCreatedAsync(cancellationToken);
        if (!await dbContext.Roles.AnyAsync(cancellationToken))
        {
            dbContext.Roles.AddRange(
                new Role { Name = "Admin", Description = "Full system administration" },
                new Role { Name = "Manager", Description = "Project and team management" },
                new Role { Name = "User", Description = "Standard project contributor" });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

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
}
