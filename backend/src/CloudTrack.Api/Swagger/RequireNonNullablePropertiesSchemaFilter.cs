using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace CloudTrack.Api.Swagger;

/// <summary>
/// Marks every non-nullable property as <c>required</c>. Swashbuckle infers nullability from
/// C# nullable reference types but does not populate <c>required</c> for record positional
/// members, which would otherwise leave every generated client property optional.
/// </summary>
public sealed class RequireNonNullablePropertiesSchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema.Properties is null)
        {
            return;
        }

        foreach (var (name, property) in schema.Properties)
        {
            if (!property.Nullable)
            {
                schema.Required.Add(name);
            }
        }
    }
}
