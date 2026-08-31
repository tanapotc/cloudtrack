using CloudTrack.Application.Common;

namespace CloudTrack.UnitTests.Common;

public sealed class PagedResultTests
{
    [Theory]
    [InlineData(0, 20, 0)]
    [InlineData(1, 20, 1)]
    [InlineData(20, 20, 1)]
    [InlineData(21, 20, 2)]
    public void TotalPagesWhenResultContainsItemsReturnsCeilingOfTotalCountDividedByPageSize(
        int totalCount,
        int pageSize,
        int expectedTotalPages)
    {
        // Arrange
        var result = new PagedResult<string>([], Page: 1, PageSize: pageSize, TotalCount: totalCount);

        // Act
        var totalPages = result.TotalPages;

        // Assert
        Assert.Equal(expectedTotalPages, totalPages);
    }
}
