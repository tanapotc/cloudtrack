# Docker

The production image builds Angular and publishes ASP.NET Core, then copies the browser bundle into the API's `wwwroot`. One origin means the browser never needs a production API secret or a cross-origin URL.

## Local composition

1. Copy `.env.example` to `.env` and replace every placeholder locally. `.env` is ignored by Git.
2. Run `docker compose up --build`.
3. Open `http://localhost:8080`; health is available at `http://localhost:8080/health`.

The compose stack uses PostgreSQL 16 and a named volume. The container runs as a non-root user. Docker is not installed in the initial development environment, so CI is the authoritative image-build verification until Docker Desktop is available locally.

