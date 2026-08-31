# Azure deployment runbook

This learning deployment uses the existing resource group `learning_stack`. It runs the ASP.NET Core API and compiled Angular application together on Linux Azure App Service and deploys a ZIP package directly.

## Cost-conscious resources

- Linux Azure App Service plan, Free F1 (shared compute, no SLA, suitable for a learning demo).
- One App Service web app with HTTPS-only access.
- Azure SQL Database free offer, General Purpose serverless, 2 vCores, 32 GB, local backup redundancy.

The database uses `useFreeLimit=true` and `freeLimitExhaustionBehavior=AutoPause`. It pauses after the monthly free allowance is exhausted instead of continuing with paid overage. Free F1 App Service has daily CPU and storage limits and may cold-start after being idle.

Check the current Azure limits and prices before every deployment. Create a budget alert even when using free SKUs because bandwidth, SQL backup growth, or later SKU changes can incur charges.

## Secrets and configuration

`appsettings.json` contains safe defaults only. The infrastructure template receives SQL credentials, the JWT signing key, and the seeded administrator credentials as secure parameters and writes them directly to App Service settings. Never commit real values to:

- `appsettings*.json`;
- `.env` files;
- Bicep parameter JSON files;
- workflow YAML, issues, screenshots, or build logs.

The repository `.gitignore` excludes local/production settings, environment files, certificates, keys, and Bicep parameter JSON. For a production system, move secrets to Key Vault and use the App Service managed identity.

## Authenticate and validate

Authentication and MFA must be completed interactively by the account owner:

```powershell
az login --scope https://management.core.windows.net//.default
az account set --subscription "<azure-subscription-id>"
az account show --query "{subscription:name,id:id,tenant:tenantId}" --output table
az group show --name learning_stack --query "{name:name,location:location,state:properties.provisioningState}" --output table
```

Compile the template and preview changes before deployment:

```powershell
az bicep build --file infra/main.bicep --stdout | Out-Null
az deployment group what-if `
  --name cloudtrack-dev `
  --resource-group learning_stack `
  --template-file infra/main.bicep `
  --parameters '@infra/local.parameters.json'
```

Keep `infra/local.parameters.json` ignored and delete it after the owner-controlled deployment. Stop if the subscription, tenant, or `what-if` changes are unexpected.

## GitHub OIDC delivery

`.github/workflows/deploy-azure.yml` builds Angular, publishes ASP.NET Core with the frontend included, creates a ZIP package, and deploys it to the existing App Service. GitHub authenticates with an Azure federated identity; there is no client secret or registry credential.

Repository/environment variables:

- `AZURE_DEPLOY_ENABLED=false` until the deployment window is approved;
- `AZURE_RESOURCE_GROUP=learning_stack`;
- `AZURE_WEB_APP=app-cloudtrack-dev<suffix>`;
- `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID` for non-secret OIDC metadata.

Grant the federated identity only `Website Contributor` on the target web app. Infrastructure and application settings remain owner-controlled and are not managed by the application workflow.

## Manual package deployment

`scripts/deploy-local.ps1` builds the Angular bundle, publishes the API with the frontend embedded, creates and validates a Linux-safe ZIP, deploys it, and exercises the live API. Build artifacts default to `D:\CloudTrackBuilds` when drive D is available, keeping temporary build output off drive C:

```powershell
pwsh ./scripts/deploy-local.ps1
```

To run the steps by hand, build Angular, publish the API with `IncludeFrontendDist=true`, then pack the ZIP so `CloudTrack.Api.dll` and `wwwroot/index.html` sit at its root. Use .NET `ZipFile` on Windows (or `zip` on Linux/macOS), **not** `Compress-Archive` or a `tar -C <publish> .` archive. The former can write backslash paths and the latter can prefix every entry with `./`; either shape can prevent Linux App Service from mounting the package.

```powershell
[System.IO.Compression.ZipFile]::CreateFromDirectory(
  'D:\CloudTrackBuilds\cloudtrack-publish',
  'D:\CloudTrackBuilds\cloudtrack.zip'
)
az webapp deploy --resource-group learning_stack --name app-cloudtrack-dev<suffix> `
  --src-path 'D:\CloudTrackBuilds\cloudtrack.zip' --type zip --clean true --restart true
```

After deployment, the PowerShell script checks health and OpenAPI, verifies that a protected endpoint returns 401 without credentials, and sends a real forgot-password API request. The GitHub workflow performs the same checks through `.github/scripts/smoke-azure.sh`. Production forgot-password responses must not expose a reset token.

## Database migrations

The API runs `Database.Migrate()` on start-up, so deploying a build with a new migration applies it before the app serves traffic; a migration failure keeps the old instance serving and fails the deploy's health check. No separate migration step is required on Free F1.

One-time cutover: the deployed database was first created by the pre-migration `EnsureCreated` path with every table in `dbo`. Before deploying the migration baseline, drop it so `InitialCreate` can rebuild it (seed data is recreated on start-up):

```powershell
az sql db delete --resource-group learning_stack --server sql-cloudtrack-dev<suffix> --name cloudtrack --yes
az sql db create --resource-group learning_stack --server sql-cloudtrack-dev<suffix> --name cloudtrack `
  --edition GeneralPurpose --compute-model Serverless --family Gen5 --capacity 2 --use-free-limit --free-limit-exhaustion-behavior AutoPause
```

Or re-run the Bicep template, which provisions the database with the same settings.

## Operations and cleanup

- Do not delete the shared `learning_stack` resource group.
- Keep the SQL free-limit behavior set to `AutoPause`.
- Free F1 has no SLA; a sleeping or quota-exhausted demo is expected to be unavailable temporarily.
- Check exact resource IDs before removing resources.
- Any legacy Container Apps, managed environments, ACR instances, and container-only identities can be removed after the App Service deployment is verified.

## Version-two hardening

This learning deployment allows Azure-service access to Azure SQL. A production design should use private networking, Key Vault references, managed database identity where supported, separate migration execution, restore drills, alerts, and an explicit observability/SLO plan.
