using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CloudTrack.Api.Controllers;
using CloudTrack.Application.Auth;
using CloudTrack.Application.Security;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace CloudTrack.IntegrationTests;

public sealed class AuthFlowTests(CloudTrackApiFactory factory) : IClassFixture<CloudTrackApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task RegisterThenReadProfileCompletesAuthenticatedFlow()
    {
        var email = $"developer-{Guid.NewGuid():N}@example.test";
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "Portfolio!234", "Portfolio Developer"));

        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);
        Assert.Contains("User", auth.User.Roles);
        Assert.Contains(PermissionNames.ManageComments, auth.User.Permissions);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        var profile = await _client.GetFromJsonAsync<UserSummary>("/api/auth/me");

        Assert.NotNull(profile);
        Assert.Equal(email, profile.Email);
        Assert.Contains(PermissionNames.ReadProjects, profile.Permissions);
    }

    [Fact]
    public async Task LoginWithWrongPasswordReturnsGenericUnauthorizedProblem()
    {
        var email = $"secure-{Guid.NewGuid():N}@example.test";
        await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "Portfolio!234", "Secure User"));

        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, "wrong-password"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<Microsoft.AspNetCore.Mvc.ProblemDetails>();
        Assert.Equal("Invalid credentials", problem?.Title);
    }

    [Fact]
    public async Task ForgotPasswordDoesNotRevealWhetherAccountExists()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest("missing@example.test"));

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ForgotPasswordResult>();
        Assert.NotNull(result);
        Assert.Null(result.DevelopmentResetToken);
    }

    [Fact]
    public async Task DemoResetModeReturnsIndistinguishableOneTimeLinks()
    {
        using var demoFactory = factory.WithWebHostBuilder(builder => builder.ConfigureAppConfiguration(
            (_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Auth:ExposeDevelopmentResetToken"] = "true",
            })));
        using var client = demoFactory.CreateClient();
        var missingEmail = $"missing-{Guid.NewGuid():N}@example.test";

        var forgot = await client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest(missingEmail));
        forgot.EnsureSuccessStatusCode();
        var result = await forgot.Content.ReadFromJsonAsync<ForgotPasswordResult>();
        var decoyToken = Assert.IsType<string>(result?.DevelopmentResetToken);

        var reset = await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequest(decoyToken, "Updated!567"));
        Assert.Equal(HttpStatusCode.BadRequest, reset.StatusCode);
    }

    [Fact]
    public async Task RefreshTokenIsRotatedAndCannotBeReplayed()
    {
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var email = $"rotation-{Guid.NewGuid():N}@example.test";
        var register = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "Portfolio!234", "Rotation User"));
        register.EnsureSuccessStatusCode();
        var firstToken = ReadRefreshToken(register);

        var refresh = await RefreshAsync(client, firstToken);
        refresh.EnsureSuccessStatusCode();
        var secondToken = ReadRefreshToken(refresh);
        Assert.NotEqual(firstToken, secondToken);

        var replay = await RefreshAsync(client, firstToken);
        Assert.Equal(HttpStatusCode.Unauthorized, replay.StatusCode);

        var current = await RefreshAsync(client, secondToken);
        current.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task PasswordResetTokenIsOneTimeAndRevokesExistingRefreshToken()
    {
        using var resetFactory = factory.WithWebHostBuilder(builder => builder.ConfigureAppConfiguration(
            (_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Auth:ExposeDevelopmentResetToken"] = "true",
            })));
        using var client = resetFactory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var email = $"reset-{Guid.NewGuid():N}@example.test";
        var oldPassword = "Portfolio!234";
        var newPassword = "Updated!567";

        var register = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, oldPassword, "Reset User"));
        register.EnsureSuccessStatusCode();
        var existingRefreshToken = ReadRefreshToken(register);

        var forgot = await client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest(email));
        forgot.EnsureSuccessStatusCode();
        var forgotResult = await forgot.Content.ReadFromJsonAsync<ForgotPasswordResult>();
        var resetToken = Assert.IsType<string>(forgotResult?.DevelopmentResetToken);
        Assert.DoesNotContain('+', resetToken);
        Assert.DoesNotContain('/', resetToken);

        var reset = await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequest(resetToken, newPassword));
        Assert.True(reset.StatusCode == HttpStatusCode.NoContent, await reset.Content.ReadAsStringAsync());

        var reuse = await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequest(resetToken, "Another!890"));
        Assert.Equal(HttpStatusCode.BadRequest, reuse.StatusCode);

        var revokedRefresh = await RefreshAsync(client, existingRefreshToken);
        Assert.Equal(HttpStatusCode.Unauthorized, revokedRefresh.StatusCode);

        var oldLogin = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, oldPassword));
        Assert.Equal(HttpStatusCode.Unauthorized, oldLogin.StatusCode);

        var newLogin = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, newPassword));
        newLogin.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task ChangePasswordRevokesSessionAndExpiresScopedCookie()
    {
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var email = $"change-{Guid.NewGuid():N}@example.test";
        var oldPassword = "Portfolio!234";
        var newPassword = "Changed!567";
        var register = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, oldPassword, "Change User"));
        register.EnsureSuccessStatusCode();
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>();
        var refreshToken = ReadRefreshToken(register);

        using var changeRequest = new HttpRequestMessage(HttpMethod.Post, "/api/auth/change-password")
        {
            Content = JsonContent.Create(new ChangePasswordRequest(oldPassword, newPassword)),
        };
        changeRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth?.AccessToken);
        changeRequest.Headers.Add("Cookie", $"cloudtrack.refresh={refreshToken}");
        var change = await client.SendAsync(changeRequest);

        Assert.Equal(HttpStatusCode.NoContent, change.StatusCode);
        AssertExpiredRefreshCookie(change);
        Assert.Equal(HttpStatusCode.Unauthorized, (await RefreshAsync(client, refreshToken)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, oldPassword))).StatusCode);
        (await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, newPassword))).EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task LogoutRevokesSessionAndExpiresScopedCookie()
    {
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var email = $"logout-{Guid.NewGuid():N}@example.test";
        var register = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "Portfolio!234", "Logout User"));
        register.EnsureSuccessStatusCode();
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>();
        var refreshToken = ReadRefreshToken(register);

        using var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout")
        {
            Content = JsonContent.Create(new RefreshRequest(null)),
        };
        logoutRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth?.AccessToken);
        logoutRequest.Headers.Add("Cookie", $"cloudtrack.refresh={refreshToken}");
        var logout = await client.SendAsync(logoutRequest);

        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        AssertExpiredRefreshCookie(logout);
        Assert.Equal(HttpStatusCode.Unauthorized, (await RefreshAsync(client, refreshToken)).StatusCode);
    }

    private static async Task<HttpResponseMessage> RefreshAsync(HttpClient client, string refreshToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/refresh")
        {
            Content = JsonContent.Create(new RefreshRequest(null)),
        };
        request.Headers.Add("Cookie", $"cloudtrack.refresh={refreshToken}");
        return await client.SendAsync(request);
    }

    private static string ReadRefreshToken(HttpResponseMessage response)
    {
        var cookie = Assert.Single(response.Headers.GetValues("Set-Cookie"));
        const string prefix = "cloudtrack.refresh=";
        var pair = cookie.Split(';', 2)[0];
        Assert.StartsWith(prefix, pair, StringComparison.Ordinal);
        return pair[prefix.Length..];
    }

    private static void AssertExpiredRefreshCookie(HttpResponseMessage response)
    {
        var cookie = Assert.Single(response.Headers.GetValues("Set-Cookie"));
        Assert.Contains("cloudtrack.refresh=", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("path=/api/auth", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("expires=Thu, 01 Jan 1970", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("httponly", cookie, StringComparison.OrdinalIgnoreCase);
    }
}
