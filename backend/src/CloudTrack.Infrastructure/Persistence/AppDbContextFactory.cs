using CloudTrack.Application.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CloudTrack.Infrastructure.Persistence;

/// <summary>
/// Builds an <see cref="AppDbContext"/> for the `dotnet ef` tools so that adding or scripting a
/// migration never has to start the API host. Used at design time only.
/// </summary>
public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    private const string FallbackConnection =
        "Server=(localdb)\\MSSQLLocalDB;Initial Catalog=CloudTrack.Design;Integrated Security=True;Encrypt=False;TrustServerCertificate=True";

    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("CLOUDTRACK_DESIGN_SQLSERVER") ?? FallbackConnection;
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(connectionString, sql => sql.MigrationsHistoryTable("__EFMigrationsHistory", "dbo"))
            .Options;
        return new AppDbContext(options, NoCurrentUser.Instance);
    }
}
