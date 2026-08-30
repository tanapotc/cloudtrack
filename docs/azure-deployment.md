# Azure deployment runbook

This runbook targets the existing resource group `learning_stack`. Keep the real subscription and tenant identifiers in protected GitHub configuration or the authenticated Azure CLI context, not in this public portfolio repository.

## Approval gate

Before the first deployment, confirm all of the following:

1. The Azure CLI is authenticated to the intended tenant and subscription.
2. `learning_stack` is the intended resource group and its region supports every selected resource.
3. The Bicep `what-if` result contains only the expected resources below.
4. The estimated monthly spend is acceptable and a budget alert is configured.
5. PostgreSQL public access is acceptable for this learning version.

Expected resources:

- Azure Container Apps environment and one Container App, Consumption plan, min replicas `0`, max replicas `1`.
- Azure Container Registry, Basic.
- PostgreSQL Flexible Server, Burstable `Standard_B1ms`, 32 GiB storage, 7-day backup, no HA.
- Log Analytics workspace with 30-day retention.
- A managed identity and only the `AcrPull` role assignment it needs.

PostgreSQL and Registry have a recurring cost even when the Container App scales to zero. Prices vary by region and must be checked in the Azure pricing calculator immediately before deployment.

## Authenticate and inspect

Authentication and MFA must be completed interactively by the account owner:

```powershell
az login --scope https://management.core.windows.net//.default
az account set --subscription "<azure-subscription-id>"
az account show --query "{subscription:name,id:id,tenant:tenantId}" --output table
az group show --name learning_stack --query "{name:name,location:location,state:properties.provisioningState}" --output table
```

Do not proceed if any identifier or tenant is unexpected.

## Validate infrastructure

Compile without creating resources:

```powershell
az bicep build --file infra/main.bicep --stdout | Out-Null
```

For manual preview, create a temporary ignored `infra/local.parameters.json` containing the secure parameters, run `what-if`, and remove the file after use. Never paste real values into `main.bicep`, `appsettings*.json`, shell transcripts, issues, or screenshots.

```powershell
az deployment group what-if `
  --name cloudtrack-dev `
  --resource-group learning_stack `
  --template-file infra/main.bicep `
  --parameters '@infra/local.parameters.json'
```

Deployment is an explicit approval step after reviewing this output.

## GitHub OIDC delivery

The preferred path is `.github/workflows/deploy-azure.yml` with a federated Azure identity. Configure these GitHub Environment values:

Variables:

- `AZURE_DEPLOY_ENABLED=false` until approved.
- `AZURE_RESOURCE_GROUP=learning_stack`.

Secrets:

- `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` for OIDC metadata.
- `POSTGRES_ADMIN_LOGIN`, `POSTGRES_ADMIN_PASSWORD`.
- `JWT_SIGNING_KEY` with at least 32 random characters.
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

Enable required reviewers on the `azure-dev` GitHub Environment. Change `AZURE_DEPLOY_ENABLED` to `true` only for an approved deployment window.

## Verify and operate

After deployment:

```powershell
az deployment group show --resource-group learning_stack --name cloudtrack-dev --output table
az containerapp show --resource-group learning_stack --name ca-cloudtrack-api-dev --query properties.configuration.ingress.fqdn --output tsv
az containerapp revision list --resource-group learning_stack --name ca-cloudtrack-api-dev --output table
```

Verify `/health`, registration, login, a project create/read flow, and the admin authorization boundary. Do not publish test administrator credentials in README screenshots.

## Cost controls and cleanup

- Create a monthly budget and at least 50%, 80%, and 100% alerts before leaving the environment unattended.
- Keep Container Apps at min replicas `0` and max replicas `1` for the interview demo.
- Review Log Analytics ingestion and retention after the first week.
- Stop PostgreSQL when not demonstrating it; compute billing stops, but storage and backups continue, and Azure automatically restarts a stopped Flexible Server after its maximum stop period.
- Delete individual CloudTrack resources only after checking the exact resource IDs. The shared `learning_stack` resource group must not be deleted as project cleanup.

## Version-two hardening

The learning deployment allows Azure-service access to PostgreSQL. A stronger production design would use private networking, Key Vault, managed database identity where supported, separate migration execution, restore drills, alerts, and an explicit observability/SLO plan.
