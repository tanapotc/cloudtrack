targetScope = 'resourceGroup'

@description('Azure region; defaults to the resource group location.')
param location string = resourceGroup().location

@secure()
param sqlAdminLogin string

@secure()
param sqlAdminPassword string

@secure()
@minLength(32)
param jwtSigningKey string

@secure()
param seedAdminEmail string

@secure()
param seedAdminPassword string

param environmentName string = 'dev'

var suffix = take(uniqueString(subscription().id, resourceGroup().id), 7)
var registryName = 'crcloudtrack${environmentName}${suffix}'
var sqlServerName = 'sql-cloudtrack-${environmentName}-${suffix}'
var appName = 'ca-cloudtrack-api-${environmentName}'
var placeholderImage = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-cloudtrack-${environmentName}'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    features: { enableLogAccessUsingOnlyResourcePermissions: true }
  }
}

resource registry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: registryName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'cae-cloudtrack-${environmentName}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

resource sqlServer 'Microsoft.Sql/servers@2023-08-01' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01' = {
  parent: sqlServer
  name: 'cloudtrack'
  location: location
  sku: {
    name: 'GP_S_Gen5_2'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 2
  }
  properties: {
    autoPauseDelay: 60
    freeLimitExhaustionBehavior: 'AutoPause'
    maxSizeBytes: 34359738368
    minCapacity: json('0.5')
    requestedBackupStorageRedundancy: 'Local'
    useFreeLimit: true
    zoneRedundant: false
  }
}

resource allowAzure 'Microsoft.Sql/servers/firewallRules@2023-08-01' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8080
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: registry.properties.loginServer
          identity: 'system'
        }
      ]
      secrets: [
        { name: 'jwt-signing-key', value: jwtSigningKey }
        { name: 'sql-connection', value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=cloudtrack;Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;' }
        { name: 'seed-admin-email', value: seedAdminEmail }
        { name: 'seed-admin-password', value: seedAdminPassword }
      ]
    }
    template: {
      containers: [
        {
          name: 'cloudtrack'
          image: placeholderImage
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
            { name: 'Database__Provider', value: 'SqlServer' }
            { name: 'ConnectionStrings__DefaultConnection', secretRef: 'sql-connection' }
            { name: 'Jwt__SigningKey', secretRef: 'jwt-signing-key' }
            { name: 'Auth__ExposeDevelopmentResetToken', value: 'false' }
            { name: 'Seed__AdminEmail', secretRef: 'seed-admin-email' }
            { name: 'Seed__AdminPassword', secretRef: 'seed-admin-password' }
          ]
          probes: [
            { type: 'Liveness', httpGet: { path: '/health', port: 8080, scheme: 'HTTP' }, initialDelaySeconds: 20, periodSeconds: 30 }
            { type: 'Readiness', httpGet: { path: '/health', port: 8080, scheme: 'HTTP' }, initialDelaySeconds: 10, periodSeconds: 15 }
          ]
        }
      ]
      scale: { minReplicas: 0, maxReplicas: 1 }
    }
  }
  dependsOn: [
    sqlDatabase
    allowAzure
  ]
}

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registry.id, app.id, 'AcrPull')
  scope: registry
  properties: {
    principalId: app.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  }
}

output registryName string = registry.name
output containerAppName string = app.name
output applicationUrl string = 'https://${app.properties.configuration.ingress.fqdn}'
output sqlServerName string = sqlServer.name
