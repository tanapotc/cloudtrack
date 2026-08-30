# Azure infrastructure

`main.bicep` targets an existing resource group and creates only the development resources needed for the portfolio:

- Azure Container Registry Basic for the application image.
- Azure Container Apps environment and one scale-to-zero Container App.
- Azure Database for PostgreSQL Flexible Server using the Burstable B1ms SKU, 32 GB storage, 7-day local backup, and no high availability.
- Log Analytics with 30-day retention.

The template contains no secret values. Secure parameters are supplied by GitHub environment secrets or an interactive deployment command. The initial public-database rule permits connections from Azure services; a private endpoint is a version-2 security improvement because it materially increases lab cost and network complexity.

Do not run the deployment until the estimated regional prices and the target resource group have been reviewed with the subscription owner.

