FROM node:24-alpine AS web-build
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS api-build
WORKDIR /src
COPY backend/CloudTrack.sln backend/Directory.Build.props ./
COPY backend/src/CloudTrack.Domain/CloudTrack.Domain.csproj src/CloudTrack.Domain/
COPY backend/src/CloudTrack.Application/CloudTrack.Application.csproj src/CloudTrack.Application/
COPY backend/src/CloudTrack.Infrastructure/CloudTrack.Infrastructure.csproj src/CloudTrack.Infrastructure/
COPY backend/src/CloudTrack.Api/CloudTrack.Api.csproj src/CloudTrack.Api/
RUN dotnet restore src/CloudTrack.Api/CloudTrack.Api.csproj
COPY backend/src/ ./src/
RUN dotnet publish src/CloudTrack.Api/CloudTrack.Api.csproj --configuration Release --no-restore --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
RUN addgroup -S cloudtrack && adduser -S cloudtrack -G cloudtrack
COPY --from=api-build /app/publish ./
COPY --from=web-build /web/dist/cloudtrack-web/browser ./wwwroot
RUN chown -R cloudtrack:cloudtrack /app
USER cloudtrack
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "CloudTrack.Api.dll"]

