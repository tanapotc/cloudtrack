using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using CloudTrack.Api.Auth;
using CloudTrack.Api.Errors;
using CloudTrack.Api.Swagger;
using CloudTrack.Infrastructure;
using CloudTrack.Infrastructure.Auth;
using CloudTrack.Infrastructure.Persistence;
using CloudTrack.Application.Common;
using CloudTrack.Application.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, HttpContextCurrentUser>();
builder.Services.AddControllers(options =>
{
    // One response content type keeps the generated client's methods single-variant
    // (no text/plain sibling of every JSON operation).
    options.Filters.Add(new ProducesAttribute("application/json"));
});
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "CloudTrack API", Version = "v1" });
    // Reflect C# nullable reference types in the schema so the generated client's
    // properties are non-optional where the API guarantees a value.
    options.SupportNonNullableReferenceTypes();
    options.UseAllOfToExtendReferenceSchemas();
    options.SchemaFilter<RequireNonNullablePropertiesSchemaFilter>();
    // Stable "<Controller>_<Action>" operation ids so the generated TypeScript client
    // gets readable method names (login, createProject, ...) instead of path-derived ones.
    options.CustomOperationIds(description =>
        description.ActionDescriptor is ControllerActionDescriptor controllerAction
            ? $"{controllerAction.ControllerName}_{controllerAction.ActionName}"
            : null);
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = Array.Empty<string>(),
    });
});
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>("database");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<Microsoft.Extensions.Options.IOptions<JwtOptions>>((options, configuredJwt) =>
    {
        var jwt = configuredJwt.Value;
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role,
        };
    });
builder.Services.AddAuthorization(options =>
{
    foreach (var permission in PermissionNames.All)
    {
        options.AddPolicy(permission, policy => policy.RequireClaim(PermissionNames.ClaimType, permission));
    }
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy("web", policy =>
    policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = context.RequestServices.GetRequiredService<IConfiguration>().GetValue("RateLimiting:AuthPermitLimit", 10),
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        }));
});

var app = builder.Build();

app.UseExceptionHandler();
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append(
        "Content-Security-Policy",
        "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; " +
        "script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
        "font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'");
    await next();
});

if (app.Environment.IsProduction())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseSwagger();
if (app.Environment.IsDevelopment())
{
    app.UseSwaggerUI();
}

app.UseCors("web");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await services.GetRequiredService<DatabaseInitializer>().InitializeAsync();
    }
    catch (Exception ex)
    {
        // A database that is unreachable at start-up must not crash-loop the whole site.
        // The app still serves the SPA and static content, and /health reports the database
        // as unhealthy; a restart re-runs the migration and seed.
        LogStartupDatabaseFailure(services.GetRequiredService<ILogger<Program>>(), ex);
    }
}

app.Run();

public partial class Program
{
    private static readonly Action<ILogger, Exception?> LogStartupDatabaseFailure =
        LoggerMessage.Define(
            LogLevel.Critical,
            new EventId(1002, "StartupDatabaseInitFailed"),
            "Database initialization failed at start-up; continuing without it.");
}
