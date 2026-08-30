namespace CloudTrack.IntegrationTests;

public sealed class SecurityHeadersTests(CloudTrackApiFactory factory) : IClassFixture<CloudTrackApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task HealthResponseAllowsSameOriginApplicationAssets()
    {
        var response = await _client.GetAsync("/health");

        response.EnsureSuccessStatusCode();
        var policy = Assert.Single(response.Headers.GetValues("Content-Security-Policy"));
        Assert.Contains("default-src 'self'", policy, StringComparison.Ordinal);
        Assert.Contains("script-src 'self'", policy, StringComparison.Ordinal);
        Assert.DoesNotContain("script-src 'self' 'unsafe-inline'", policy, StringComparison.Ordinal);
        Assert.Contains("font-src 'self' data: https://fonts.gstatic.com", policy, StringComparison.Ordinal);
        Assert.DoesNotContain("default-src 'none'", policy, StringComparison.Ordinal);
        Assert.Equal("nosniff", Assert.Single(response.Headers.GetValues("X-Content-Type-Options")));
        Assert.Equal("DENY", Assert.Single(response.Headers.GetValues("X-Frame-Options")));
    }

    [Fact]
    public async Task ApiDocumentationIsPublishedWithoutWeakeningTheApplicationPolicy()
    {
        var documentation = await _client.GetAsync("/api-docs/index.html");
        var application = await _client.GetAsync("/health");

        documentation.EnsureSuccessStatusCode();
        var documentationPolicy = Assert.Single(documentation.Headers.GetValues("Content-Security-Policy"));
        Assert.Contains("script-src 'self' 'unsafe-inline'", documentationPolicy, StringComparison.Ordinal);

        var applicationPolicy = Assert.Single(application.Headers.GetValues("Content-Security-Policy"));
        Assert.Contains("script-src 'self';", applicationPolicy, StringComparison.Ordinal);
        Assert.DoesNotContain("script-src 'self' 'unsafe-inline'", applicationPolicy, StringComparison.Ordinal);
    }
}
