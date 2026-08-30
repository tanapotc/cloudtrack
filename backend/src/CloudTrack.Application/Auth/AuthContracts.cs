using System.ComponentModel.DataAnnotations;

namespace CloudTrack.Application.Auth;

public sealed record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8), MaxLength(100)] string Password,
    [Required, MinLength(2), MaxLength(80)] string DisplayName);

public sealed record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public sealed record RefreshRequest(string? RefreshToken);
public sealed record ForgotPasswordRequest([Required, EmailAddress] string Email);
public sealed record ResetPasswordRequest([Required] string Token, [Required, MinLength(8)] string NewPassword);
public sealed record ChangePasswordRequest([Required] string CurrentPassword, [Required, MinLength(8)] string NewPassword);

public sealed record UserSummary(Guid Id, string Email, string DisplayName, IReadOnlyCollection<string> Roles, IReadOnlyCollection<string> Permissions);
public sealed record AuthResult(string AccessToken, string RefreshToken, DateTimeOffset ExpiresAt, UserSummary User);
public sealed record ForgotPasswordResult(string Message, string? DevelopmentResetToken);

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<AuthResult> RefreshAsync(string refreshToken, CancellationToken cancellationToken);
    Task RevokeAsync(string refreshToken, CancellationToken cancellationToken);
    Task<ForgotPasswordResult> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken);
    Task<UserSummary> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken);
}
