using CloudTrack.Application.Common;
using CloudTrack.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CloudTrack.IntegrationTests;

public sealed class CloudTrackApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"CloudTrackTests_{Guid.NewGuid():N}";
    private readonly string _connectionString;

    public CloudTrackApiFactory()
    {
        var serverConnection = Environment.GetEnvironmentVariable("CLOUDTRACK_TEST_SQLSERVER")
            ?? "Server=(localdb)\\MSSQLLocalDB;Integrated Security=True;Encrypt=False;TrustServerCertificate=True";
        _connectionString = new SqlConnectionStringBuilder(serverConnection)
        {
            InitialCatalog = _databaseName,
            MultipleActiveResultSets = true,
        }.ConnectionString;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["Jwt:Issuer"] = "CloudTrack.Tests",
                ["Jwt:Audience"] = "CloudTrack.Tests",
                ["Jwt:SigningKey"] = "integration-test-signing-key-that-is-long-enough",
                ["Auth:ExposeDevelopmentResetToken"] = "false",
                ["RateLimiting:AuthPermitLimit"] = "100",
                ["Cors:AllowedOrigins:0"] = "http://localhost",
                ["Seed:AdminEmail"] = "admin@example.test",
                ["Seed:AdminPassword"] = "IntegrationAdmin!234",
                ["ConnectionStrings:DefaultConnection"] = _connectionString,
            }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseSqlServer(
                _connectionString,
                sql => sql.EnableRetryOnFailure()));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlServer(_connectionString)
                .Options;
            using var dbContext = new AppDbContext(options, NoCurrentUser.Instance);
            dbContext.Database.EnsureDeleted();
        }
    }
}
