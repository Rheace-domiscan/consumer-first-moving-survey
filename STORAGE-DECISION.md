# Storage Decision Placeholder

## Current state
Storage is intentionally not wired in the first scaffold.

## Current recommendation
Start with an **S3-compatible storage provider**.

## Lean default recommendation
Use **Cloudflare R2** unless there is a strong reason not to.

### Why
- generally cheap
- straightforward S3-compatible integration
- flexible enough for media-heavy workflows
- does not overcomplicate the first build

## Notes
- keep storage integration behind a small adapter boundary
- do not hardwire provider-specific logic everywhere
- final provider can remain reversible in the early product
