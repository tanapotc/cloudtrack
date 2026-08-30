using CloudTrack.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CloudTrack.IntegrationTests;

public sealed class CloudTrackApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _connection.Open();
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
            }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _connection.Dispose();
        }
    }
}
