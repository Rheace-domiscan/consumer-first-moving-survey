# Storage Decision Placeholder

## Current state
We have now chosen **Cloudflare R2** as the default storage direction.

## Working decision
Use **Cloudflare R2** first via an S3-compatible adapter boundary.

### Why
- generally cheap
- straightforward integration path
- fits media-heavy workflows
- keeps the early product lean

## Implementation stance
- keep storage calls behind a small abstraction
- avoid hardwiring provider-specific logic across the app
- stay compatible with other S3-like providers if needed later

## Current project bucket
- bucket: `domiscan-moving-survey-media`
- account id: `717af61c7d9a9131e2ff5c7738addaa2`
- endpoint: `https://717af61c7d9a9131e2ff5c7738addaa2.r2.cloudflarestorage.com`
- region setting for S3-compatible clients: `auto`

## Current access notes
- r2.dev public URL is currently disabled
- no custom domain is attached yet
- runtime uploads still need an R2 access key + secret for this architecture
