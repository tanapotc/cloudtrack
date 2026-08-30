using CloudTrack.Application.Dashboard;
using Microsoft.AspNetCore.Mvc;

namespace CloudTrack.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController(IDashboardService dashboardService) : AuthenticatedControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DashboardSummary>> Get(CancellationToken cancellationToken)
        => Ok(await dashboardService.GetAsync(CurrentUserId, cancellationToken));
}

