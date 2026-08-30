# Docker (optional local workflow)

The production image builds Angular and publishes ASP.NET Core, then copies the browser bundle into the API's `wwwroot`. One origin means the browser never needs a production API secret or a cross-origin URL.

## Local composition

1. Copy `.env.example` to `.env` and replace every placeholder locally. `.env` is ignored by Git.
2. Run `docker compose up --build`.
3. Open `http://localhost:8080`; health is available at `http://localhost:8080/health`.

The compose stack uses SQL Server 2022 and a named volume. The application container runs as a non-root user. Azure delivery does not use this image: GitHub Actions publishes a ZIP directly to App Service, so Docker is optional for contributors.
