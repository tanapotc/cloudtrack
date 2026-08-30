# Configuration and secret safety

CloudTrack follows ASP.NET Core's configuration precedence. Values in environment variables or Azure application settings override the non-secret defaults in `appsettings.json`.

## Safe to commit

- `appsettings.json`: non-secret defaults, local SQLite path, empty JWT signing key.
- `appsettings.Development.json`: logging and development-only feature flags; never credentials.
- `.env.example`: names and visibly fake placeholders only.
- Angular environment files: public build-time values such as the relative API URL. Anything compiled into Angular is public.

## Never commit

- JWT signing keys, passwords, access/refresh/reset tokens.
- PostgreSQL connection strings containing credentials.
- Azure service-principal credentials, publish profiles, certificates, or downloaded portal configuration.
- `appsettings.Production.json`, `appsettings.Azure.json`, `appsettings.*.local.json`, or `.env` files.
- Local Bicep parameter files such as `infra/local.parameters.json` or `*.bicepparam` when they contain values.

The root `.gitignore` blocks these common files. CI also runs a repository secret scan. Before each commit, inspect staged changes with `git diff --cached`.

Use `git check-ignore -v <path>` to confirm a local secret file is ignored. If a secret ever reaches Git history, deleting the file is not enough: revoke or rotate the credential first, then clean the history deliberately.

## Local backend setup

Use .NET user-secrets so the key remains outside the repository:

```powershell
cd backend/src/CloudTrack.Api
dotnet user-secrets set "Jwt:SigningKey" "<generate-at-least-32-random-characters>"
dotnet run --urls http://localhost:5080
```

The default local connection string is `Data Source=cloudtrack.db`. It contains no credential and the generated database file is ignored.

## Azure mapping

Set these as Container App or App Service environment variables, not source files:

| Configuration key | Azure environment variable | Secret? |
| --- | --- | --- |
| `Jwt:SigningKey` | `Jwt__SigningKey` | Yes |
| `ConnectionStrings:DefaultConnection` | `ConnectionStrings__DefaultConnection` | Yes |
| `Database:Provider` | `Database__Provider=PostgreSql` | No |
| `Cors:AllowedOrigins:0` | `Cors__AllowedOrigins__0` | No |
| `Auth:ExposeDevelopmentResetToken` | `Auth__ExposeDevelopmentResetToken=false` | No |

For a low-cost lab, sensitive values can start as secret application settings. Key Vault is a version-2 hardening step when its operational cost and complexity are justified.
