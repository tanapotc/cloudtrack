using CloudTrack.Application.Auth;
using CloudTrack.Application.Dashboard;
using CloudTrack.Application.Projects;
using CloudTrack.Application.Users;
using CloudTrack.Domain.Identity;
using CloudTrack.Infrastructure.Auth;
using CloudTrack.Infrastructure.Persistence;
using CloudTrack.Infrastructure.Dashboard;
using CloudTrack.Infrastructure.Projects;
using CloudTrack.Infrastructure.Users;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CloudTrack.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var provider = configuration["Database:Provider"] ?? "Sqlite";
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required.");

        services.AddDbContext<AppDbContext>(options =>
        {
            if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
            {
                options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure());
            }
            else
            {
                options.UseSqlite(connectionString);
            }
        });

        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(x => x.SigningKey.Length >= 32, "Jwt:SigningKey must contain at least 32 characters.")
            .ValidateOnStart();
        services.Configure<AuthOptions>(configuration.GetSection(AuthOptions.SectionName));
        services.AddScoped<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IUserManagementService, UserManagementService>();
        services.AddScoped<DatabaseInitializer>();
        return services;
    }
}
