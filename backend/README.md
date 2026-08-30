# Backend

The backend follows a pragmatic layered architecture:

- `CloudTrack.Domain`: business entities, value semantics, and domain constants.
- `CloudTrack.Application`: use-case contracts, DTOs, validation, and application services.
- `CloudTrack.Infrastructure`: EF Core persistence, security implementations, and external adapters.
- `CloudTrack.Api`: HTTP concerns, authentication middleware, Problem Details, and composition root.
- `CloudTrack.UnitTests`: fast tests for domain and application behavior.
- `CloudTrack.IntegrationTests`: API tests through the real ASP.NET Core pipeline.

Dependencies point inward: API composes Application and Infrastructure; Infrastructure implements Application contracts; Domain has no infrastructure dependency.
