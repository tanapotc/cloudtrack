using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CloudTrack.Application.Auth;
using CloudTrack.Application.Common;
using CloudTrack.Application.Security;
using CloudTrack.Domain.Auditing;
using CloudTrack.Domain.Identity;
using CloudTrack.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CloudTrack.Infrastructure.Auth;

public sealed class AuthService(
    AppDbContext dbContext,
    IPasswordHasher<AppUser> passwordHasher,
    IOptions<JwtOptions> jwtOptions,
    IOptions<AuthOptions> authOptions) : IAuthService
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;
    private readonly AuthOptions _authOptions = authOptions.Value;

    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (await dbContext.Users.AnyAsync(x => x.NormalizedEmail == normalizedEmail, cancellationToken))
        {
            throw new AppException(409, "Email already registered", "An account already uses this email address.");
        }

        var user = new AppUser
        {
            Email = request.Email.Trim(),
            NormalizedEmail = normalizedEmail,
            DisplayName = request.DisplayName.Trim(),
            PasswordHash = string.Empty,
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        var role = await dbContext.Roles.Include(x => x.RolePermissions).ThenInclude(x => x.Permission)
            .SingleAsync(x => x.Name == "User", cancellationToken);
        user.UserRoles.Add(new UserRole { User = user, Role = role });
        dbContext.Users.Add(user);
        dbContext.AuditLogs.Add(new AuditLog { ActorId = user.Id, Action = "UserRegistered", EntityType = "User", EntityId = user.Id.ToString() });
        await dbContext.SaveChangesAsync(cancellationToken);
        return await IssueTokensAsync(user, [role.Name], role.RolePermissions.Select(x => x.Permission.Name).ToArray(), cancellationToken);
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.UserRoles).ThenInclude(x => x.Role).ThenInclude(x => x.RolePermissions).ThenInclude(x => x.Permission)
            .SingleOrDefaultAsync(x => x.NormalizedEmail == NormalizeEmail(request.Email), cancellationToken);

        if (user is null || !user.IsActive || passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
        {
            throw new AppException(401, "Invalid credentials", "The email or password is incorrect.");
        }

        user.LastLoginAt = DateTimeOffset.UtcNow;
        dbContext.AuditLogs.Add(new AuditLog { ActorId = user.Id, Action = "UserLoggedIn", EntityType = "User", EntityId = user.Id.ToString() });
        return await IssueTokensAsync(user, Roles(user), Permissions(user), cancellationToken);
    }

    public async Task<AuthResult> RefreshAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var tokenHash = HashToken(refreshToken);
        var stored = await dbContext.RefreshTokens
            .Include(x => x.User).ThenInclude(x => x.UserRoles).ThenInclude(x => x.Role).ThenInclude(x => x.RolePermissions).ThenInclude(x => x.Permission)
            .SingleOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);

        if (stored is null || !stored.IsActive || !stored.User.IsActive)
        {
            throw new AppException(401, "Invalid refresh token", "Sign in again to continue.");
        }

        stored.RevokedAt = DateTimeOffset.UtcNow;
        var result = await IssueTokensAsync(stored.User, Roles(stored.User), Permissions(stored.User), cancellationToken);
        stored.ReplacedByTokenId = await dbContext.RefreshTokens.Where(x => x.TokenHash == HashToken(result.RefreshToken)).Select(x => x.Id).SingleAsync(cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task RevokeAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var tokenHash = HashToken(refreshToken);
        var stored = await dbContext.RefreshTokens.SingleOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);
        if (stored is not null && stored.RevokedAt is null)
        {
            stored.RevokedAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<ForgotPasswordResult> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(x => x.NormalizedEmail == NormalizeEmail(request.Email), cancellationToken);
        string? rawToken = null;
        if (user is not null)
        {
            rawToken = CreateSecureToken();
            dbContext.PasswordResetTokens.Add(new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = HashToken(rawToken),
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(30),
            });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return new ForgotPasswordResult(
            "If the account exists, password reset instructions have been prepared.",
            _authOptions.ExposeDevelopmentResetToken ? rawToken : null);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var stored = await dbContext.PasswordResetTokens.Include(x => x.User)
            .SingleOrDefaultAsync(x => x.TokenHash == HashToken(request.Token), cancellationToken);
        if (stored is null || stored.UsedAt is not null || stored.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            throw new AppException(400, "Invalid reset token", "The password reset link is invalid or expired.");
        }

        stored.User.PasswordHash = passwordHasher.HashPassword(stored.User, request.NewPassword);
        stored.UsedAt = DateTimeOffset.UtcNow;
        await RevokeAllTokensAsync(stored.UserId, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new AppException(404, "User not found", "The current user no longer exists.");
        if (passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword) == PasswordVerificationResult.Failed)
        {
            throw new AppException(400, "Current password is incorrect", "Enter the current password and try again.");
        }

        user.PasswordHash = passwordHasher.HashPassword(user, request.NewPassword);
        await RevokeAllTokensAsync(user.Id, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserSummary> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.AsNoTracking()
            .Include(x => x.UserRoles).ThenInclude(x => x.Role).ThenInclude(x => x.RolePermissions).ThenInclude(x => x.Permission)
            .SingleOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new AppException(404, "User not found", "The current user no longer exists.");
        return new UserSummary(user.Id, user.Email, user.DisplayName, Roles(user), Permissions(user));
    }

    private async Task<AuthResult> IssueTokensAsync(
        AppUser user,
        IReadOnlyCollection<string> roles,
        IReadOnlyCollection<string> permissions,
        CancellationToken cancellationToken)
    {
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_jwtOptions.AccessTokenMinutes);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, user.DisplayName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        claims.AddRange(permissions.Select(permission => new Claim(PermissionNames.ClaimType, permission)));

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SigningKey)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(_jwtOptions.Issuer, _jwtOptions.Audience, claims, expires: expiresAt.UtcDateTime, signingCredentials: credentials);
        var refreshToken = CreateSecureToken();
        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashToken(refreshToken),
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_jwtOptions.RefreshTokenDays),
        });
        await dbContext.SaveChangesAsync(cancellationToken);

        return new AuthResult(new JwtSecurityTokenHandler().WriteToken(token), refreshToken, expiresAt, new UserSummary(user.Id, user.Email, user.DisplayName, roles, permissions));
    }

    private async Task RevokeAllTokensAsync(Guid userId, CancellationToken cancellationToken)
    {
        await dbContext.RefreshTokens.Where(x => x.UserId == userId && x.RevokedAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.RevokedAt, DateTimeOffset.UtcNow), cancellationToken);
    }

    private static string NormalizeEmail(string email) => email.Trim().ToUpperInvariant();
    private static string[] Roles(AppUser user) => user.UserRoles.Select(x => x.Role.Name).Distinct(StringComparer.Ordinal).ToArray();
    private static string[] Permissions(AppUser user) => user.UserRoles
        .SelectMany(x => x.Role.RolePermissions)
        .Select(x => x.Permission.Name)
        .Distinct(StringComparer.Ordinal)
        .ToArray();
    private static string CreateSecureToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    private static string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
