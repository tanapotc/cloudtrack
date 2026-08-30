using CloudTrack.Application.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudTrack.Api.Errors;

public sealed class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    private static readonly Action<ILogger, int, Exception?> LogRequestFailure =
        LoggerMessage.Define<int>(LogLevel.Error, new EventId(1001, "RequestFailed"), "Request failed with status {StatusCode}");

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, title, detail) = exception switch
        {
            AppException appException => (appException.StatusCode, appException.Title, appException.Message),
            DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "Concurrent update", "This record changed after you loaded it. Refresh and try again."),
            _ => (StatusCodes.Status500InternalServerError, "Unexpected error", "An unexpected error occurred."),
        };

        LogRequestFailure(logger, status, exception);
        httpContext.Response.StatusCode = status;
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = new ProblemDetails
            {
                Status = status,
                Title = title,
                Detail = detail,
                Instance = httpContext.Request.Path,
            },
            Exception = exception,
        });
    }
}
