# Azure DevOps pipeline fallback

GitHub remains the source repository and preferred CI location. This repository also includes [`azure-pipelines.yml`](../azure-pipelines.yml) so validation and App Service delivery can move to Azure DevOps if GitHub-hosted runners are unavailable.

The pipeline has two stages:

1. **Validate** builds the .NET solution, runs unit tests, validates EF Core migrations and OpenAPI drift, then builds/tests/formats/audits the Angular app.
2. **DeployAzureDev** builds the combined ASP.NET Core + Angular ZIP and deploys it to App Service only when `AzureDeployEnabled` is `true` on `main`.

An isolated SQL Server service container can run the integration suite. It is only a disposable CI dependency; CloudTrack production remains a single App Service plus Azure SQL and does not deploy Docker containers.

## One-time Azure DevOps setup

1. Create or select an Azure DevOps organization and create a project. Import the existing GitHub repository, or create a GitHub service connection and select `tanapotc/cloudtrack` as the source.
2. Create a pipeline from **Existing Azure Pipelines YAML file**, selecting `/azure-pipelines.yml` on `main`.
3. In the pipeline variables UI, create `SqlServerPassword` as a **secret**. Use a strong password that meets SQL Server's policy; it is used only by the disposable test database and must not be committed.
4. Run the pipeline once. The integration job executes only when that secret is present.
5. To enable deployment, create an Azure Resource Manager service connection with least-privilege access to the learning resource group, then add these pipeline variables in the UI:

   - `AzureServiceConnection`: service connection name
   - `AzureResourceGroup`: `learning_stack`
   - `AzureWebAppName`: `app-cloudtrack-dev-xe3xxsh`
   - `AzureDeployEnabled`: `true`

Keep `AzureDeployEnabled` false until the validation stage is green. The connection string, JWT key, and SQL test password stay in Azure DevOps secret/service-connection storage, never in Git.

## When GitHub Actions resumes

GitHub Actions is still the preferred pipeline. The Azure DevOps definition can remain disabled as a documented recovery path, or be kept for independent validation. Do not enable both deployment pipelines at the same time unless you deliberately want two systems to deploy the same App Service.
