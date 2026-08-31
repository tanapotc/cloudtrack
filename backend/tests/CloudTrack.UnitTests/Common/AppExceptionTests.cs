using CloudTrack.Application.Common;

namespace CloudTrack.UnitTests.Common;

public sealed class AppExceptionTests
{
    [Fact]
    public void ConstructorWhenCreatedPreservesHttpProblemDetails()
    {
        // Arrange
        const int statusCode = 409;
        const string title = "Email already registered";
        const string detail = "An account already uses this email address.";

        // Act
        var exception = new AppException(statusCode, title, detail);

        // Assert
        Assert.Equal(statusCode, exception.StatusCode);
        Assert.Equal(title, exception.Title);
        Assert.Equal(detail, exception.Message);
    }
}
