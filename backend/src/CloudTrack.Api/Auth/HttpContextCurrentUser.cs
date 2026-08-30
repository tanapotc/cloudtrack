using System.IdentityModel.Tokens.Jwt;
using CloudTrack.Application.Common;

namespace CloudTrack.Api.Auth;

/// <summary>Resolves the caller's id from the validated JWT on the current HTTP request.</summary>
public sealed class HttpContextCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid? UserId
    {
        get
        {
            var value = accessor.HttpContext?.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }
}
