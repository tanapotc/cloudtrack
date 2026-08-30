using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudTrack.Api.Controllers;

[Authorize]
public abstract class AuthenticatedControllerBase : ControllerBase
{
    protected Guid CurrentUserId
    {
        get
        {
            var value = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return Guid.TryParse(value, out var id) ? id : throw new UnauthorizedAccessException();
        }
    }
}

