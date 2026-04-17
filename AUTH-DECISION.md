# Auth Decision Placeholder

## Current state
Auth is intentionally not wired in the first scaffold.

## Shortlist
- Clerk
- WorkOS

## Current recommendation
Start with **Clerk** unless a strong near-term reason emerges to use WorkOS first.

### Why Clerk is the current default lean choice
- faster to wire for a consumer-facing app
- good Next.js support
- quick login/session scaffolding
- easy to replace later if needed

### Why WorkOS is still relevant
- strong longer-term fit if organization/company identity and enterprise relationships become central early
- may become more attractive when mover/company account structure becomes more complex

## Working stance
- do not block early build on final auth decision
- keep auth boundary clean so provider choice stays reversible
