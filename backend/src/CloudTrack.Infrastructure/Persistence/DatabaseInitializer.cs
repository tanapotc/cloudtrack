using CloudTrack.Domain.Identity;
using Microsoft.EntityFrameworkCore;

namespace CloudTrack.Infrastructure.Persistence;

public sealed class DatabaseInitializer(AppDbContext dbContext)
{
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.Database.EnsureCreatedAsync(cancellationToken);
        if (await dbContext.Roles.AnyAsync(cancellationToken))
        {
            return;
        }

        dbContext.Roles.AddRange(
            new Role { Name = "Admin", Description = "Full system administration" },
            new Role { Name = "Manager", Description = "Project and team management" },
            new Role { Name = "User", Description = "Standard project contributor" });
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}

