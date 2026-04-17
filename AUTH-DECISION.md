# Auth Decision Placeholder

## Current state
We have now chosen **Clerk** as the default auth direction for the build.

## Working decision
Use **Clerk first** for the early product.

### Why
- faster to wire for a consumer-facing Next.js app
- clean developer experience
- good default fit for early survey creation and account ownership
- keeps us moving without prematurely designing enterprise identity complexity

## WorkOS status
WorkOS remains a possible later option if mover/company-side organizational identity becomes more complex.

## Working stance
- move forward with Clerk unless a strong blocker appears
- keep auth boundaries clean so future evolution stays manageable
