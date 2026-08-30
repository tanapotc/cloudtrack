using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CloudTrack.Api.Controllers;
using CloudTrack.Application.Auth;
using CloudTrack.Application.Security;

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
}
