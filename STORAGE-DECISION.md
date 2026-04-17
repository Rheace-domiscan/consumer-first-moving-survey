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
