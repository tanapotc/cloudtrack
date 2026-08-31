using CloudTrack.Domain.Identity;

namespace CloudTrack.UnitTests.Identity;

public sealed class RefreshTokenTests
{
    [Fact]
    public void IsUsableWhenNotRevokedAndExpiryIsInFutureReturnsTrue()
    {
        // Arrange
        var token = CreateToken(expiresAt: DateTimeOffset.UtcNow.AddDays(1));

        // Act
        var isUsable = token.IsUsable;

        // Assert
        Assert.True(isUsable);
    }

    [Fact]
    public void IsUsableWhenExpiryHasPassedReturnsFalse()
    {
        // Arrange
        var token = CreateToken(expiresAt: DateTimeOffset.UtcNow.AddDays(-1));

        // Act
        var isUsable = token.IsUsable;

        // Assert
        Assert.False(isUsable);
    }

    [Fact]
    public void IsUsableWhenTokenHasBeenRevokedReturnsFalse()
    {
        // Arrange
        var token = CreateToken(expiresAt: DateTimeOffset.UtcNow.AddDays(1));
        token.RevokedAt = DateTimeOffset.UtcNow;

        // Act
        var isUsable = token.IsUsable;

        // Assert
        Assert.False(isUsable);
    }

    private static RefreshToken CreateToken(DateTimeOffset expiresAt) => new()
    {
        UserId = Guid.NewGuid(),
        TokenHash = "hash",
        ExpiresAt = expiresAt,
    };
}
