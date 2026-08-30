using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CloudTrack.Application.Auth;
using CloudTrack.Infrastructure.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace CloudTrack.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    IAuthService authService,
    IWebHostEnvironment environment,
    IOptions<JwtOptions> jwtOptions) : ControllerBase
{
    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
        => Ok(ToResponse(await authService.RegisterAsync(request, cancellationToken)));

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
        => Ok(ToResponse(await authService.LoginAsync(request, cancellationToken)));

    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request, CancellationToken cancellationToken)
    {
        var token = request.RefreshToken ?? Request.Cookies["cloudtrack.refresh"];
        if (string.IsNullOrWhiteSpace(token))
        {
            return Unauthorized();
        }

        return Ok(ToResponse(await authService.RefreshAsync(token, cancellationToken)));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest request, CancellationToken cancellationToken)
    {
        var token = request.RefreshToken ?? Request.Cookies["cloudtrack.refresh"];
        if (!string.IsNullOrWhiteSpace(token))
        {
            await authService.RevokeAsync(token, cancellationToken);
        }

        DeleteRefreshCookie();
        return NoContent();
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<ForgotPasswordResult>> ForgotPassword(ForgotPasswordRequest request, CancellationToken cancellationToken)
        => Ok(await authService.ForgotPasswordAsync(request, cancellationToken));

    [HttpPost("reset-password")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        await authService.ResetPasswordAsync(request, cancellationToken);
        return NoContent();
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        await authService.ChangePasswordAsync(GetUserId(), request, cancellationToken);
        DeleteRefreshCookie();
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserSummary>> Me(CancellationToken cancellationToken)
        => Ok(await authService.GetCurrentUserAsync(GetUserId(), cancellationToken));

    private AuthResponse ToResponse(AuthResult result)
    {
        Response.Cookies.Append("cloudtrack.refresh", result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = !environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(jwtOptions.Value.RefreshTokenDays),
            Path = "/api/auth",
        });
        return new AuthResponse(result.AccessToken, result.ExpiresAt, result.User);
    }

    private void DeleteRefreshCookie() => Response.Cookies.Delete("cloudtrack.refresh", new CookieOptions
    {
        HttpOnly = true,
        Secure = !environment.IsDevelopment(),
        SameSite = SameSiteMode.Strict,
        Path = "/api/auth",
    });

    private Guid GetUserId()
    {
        var value = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(value, out var id) ? id : throw new UnauthorizedAccessException();
    }
}

public sealed record AuthResponse(string AccessToken, DateTimeOffset ExpiresAt, UserSummary User);
