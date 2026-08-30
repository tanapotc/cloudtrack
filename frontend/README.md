# CloudTrack web

The Angular 22 client for CloudTrack uses standalone components, lazy routes, Angular Material, signals, and an HTTP interceptor for authenticated API calls.

```powershell
npm ci
npm start
npm test -- --watch=false
npm run build
npm run e2e
```

Local API traffic targets `http://localhost:5080/api`. The production build uses the same-origin `/api` path and contains no secret configuration. See the [root project documentation](../README.md) for the complete setup and security model.
