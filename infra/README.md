# Azure infrastructure

`main.bicep` targets an existing resource group and creates only the cost-conscious development resources needed for the portfolio:

- Linux Azure App Service plan on Free F1 and one .NET 8 web app.
- Azure SQL Database free offer using General Purpose serverless compute, 32 GB storage, and auto-pause when the monthly free allowance is exhausted.

The template contains no secret values. Secure parameters are supplied by an interactive owner-controlled deployment and stored as protected App Service settings. GitHub Actions uses OIDC and does not receive the application secrets. The initial database rule permits connections from Azure services; a private endpoint is a version-2 security improvement because it materially increases lab cost and network complexity.

Do not run the deployment until the estimated regional prices and the target resource group have been reviewed with the subscription owner.
