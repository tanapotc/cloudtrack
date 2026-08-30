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
var sqlServerName = 'sql-cloudtrack-${environmentName}-${suffix}'
var webAppName = 'app-cloudtrack-${environmentName}-${suffix}'
var sqlConnectionString = 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=cloudtrack;Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

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

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'asp-cloudtrack-${environmentName}'
  location: location
  kind: 'linux'
  sku: {
    name: 'F1'
    tier: 'Free'
    size: 'F1'
    family: 'F'
    capacity: 1
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      alwaysOn: false
      ftpsState: 'Disabled'
      http20Enabled: true
      linuxFxVersion: 'DOTNETCORE|8.0'
      minTlsVersion: '1.2'
      appSettings: [
        { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
        { name: 'ASPNETCORE_FORWARDEDHEADERS_ENABLED', value: 'true' }
        { name: 'ConnectionStrings__DefaultConnection', value: sqlConnectionString }
        { name: 'Jwt__SigningKey', value: jwtSigningKey }
        { name: 'Auth__ExposeDevelopmentResetToken', value: 'true' }
        { name: 'Seed__AdminEmail', value: seedAdminEmail }
        { name: 'Seed__AdminPassword', value: seedAdminPassword }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' }
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' }
      ]
    }
  }
  dependsOn: [
    sqlDatabase
    allowAzure
  ]
}

output appServicePlanName string = appServicePlan.name
output webAppName string = webApp.name
output applicationUrl string = 'https://${webApp.properties.defaultHostName}'
output sqlServerName string = sqlServer.name
