# Autonomous Execution Setup Checklist
## Consumer-First Moving Survey Platform
**Date:** 2026-04-17

## Purpose
This document defines what must be in place for the assistant to act as the primary technical execution engine for this product.

The goal is to remove avoidable friction so implementation can move quickly, with the human only stepping in where a human is genuinely required.

This is not a strategy memo.
It is an operating checklist.

---

## 1. Operating model

## Intended working model
The assistant should handle the majority of:
- technical planning
- scaffolding
- implementation
- refactoring
- integration work
- deployment preparation
- iteration on product flows

The human should mainly handle:
- account creation
- billing / 2FA / approvals
- legal/business signoff
- irreversible external decisions
- real-world testing inputs

## Decision rule
The assistant should make **reversible technical decisions by default**.
The assistant should ask only when a decision is:
- expensive
- external/public
- brand-critical
- legal/privacy-sensitive
- hard to reverse

---

## 2. Build home setup

## Required
- [ ] choose the real implementation folder/repo location
- [ ] initialize Git in the implementation root
- [ ] decide whether to push to GitHub immediately or after initial scaffold

## Recommended default
Use one monorepo with a structure close to:

- `apps/web`
- `apps/api` or API routes inside web app initially
- `packages/shared`
- `packages/ai-pipeline`
- `infra/`
- `scripts/`

## Human input needed
- [ ] confirm the real project root path
- [ ] confirm whether GitHub repo should be created now

---

## 3. Default technical stack

These defaults should be treated as approved unless explicitly changed.

## Frontend
- [ ] Next.js
- [ ] TypeScript
- [ ] Tailwind CSS
- [ ] fast component system, likely shadcn/ui or equivalent

## Backend
- [ ] Node/TypeScript environment
- [ ] start simple, likely Next.js server actions/routes or adjacent API layer

## Database
- [ ] Postgres
- [ ] Prisma ORM

## Auth
Pick one:
- [ ] Clerk
- [ ] Supabase Auth
- [ ] Auth.js / NextAuth

## Storage
Pick one S3-compatible option:
- [ ] AWS S3
- [ ] Cloudflare R2
- [ ] Supabase Storage

## Background jobs
- [ ] start with simplest reliable async job approach
- [ ] only add complex queue infra when needed

## AI/CV inference
- [ ] initial server-side inference/integration approach
- [ ] model boundary designed so components can be swapped later

## Human input needed
- [ ] choose default auth provider
- [ ] choose default storage provider
- [ ] choose default hosting/deployment path

## Recommended default stack if no preference
- Next.js
- TypeScript
- Tailwind
- Prisma
- Postgres
- Clerk or Supabase Auth
- Cloudflare R2 or S3-compatible storage

---

## 4. Infrastructure accounts

These are the main external accounts likely needed.

## Required soon
- [ ] GitHub
- [ ] hosting provider
- [ ] Postgres provider
- [ ] object storage provider

## Likely needed later
- [ ] email provider
- [ ] PDF/render service if not local
- [ ] monitoring / error tracking
- [ ] analytics
- [ ] AI inference provider(s) if managed APIs are used

## Human-required actions
- [ ] create accounts
- [ ] complete billing setup
- [ ] complete 2FA
- [ ] confirm workspace/team access model

---

## 5. Environment variable / secret setup

## Required principle
The assistant should define the environment variable list and expected values.
The human should fill secrets where needed.

## Recommended setup
Create:
- [ ] `.env.example`
- [ ] `.env.local`
- [ ] `.env.production`

## Categories of secrets likely needed
- [ ] database URL
- [ ] auth provider keys
- [ ] storage keys
- [ ] app base URL
- [ ] share-link signing secret
- [ ] session/auth secret
- [ ] email keys later
- [ ] AI provider keys later if used

## Human input needed
- [ ] populate actual secret values when prompted

---

## 6. Repository and access model

## Required
- [ ] decide whether assistant builds locally first or against remote GitHub from day one
- [ ] decide whether commits should happen continuously or milestone-based

## Recommended
- local Git from first scaffold
- frequent commits after meaningful vertical slices
- push to GitHub early once scaffold is stable

## Human input needed
- [ ] confirm commit cadence preference
- [ ] confirm remote repo preference

---

## 7. Delegation model

The assistant is authorized by default to:
- [ ] choose internal code structure
- [ ] choose libraries and package layout within agreed stack
- [ ] define schemas and internal APIs
- [ ] implement UI flows
- [ ] refactor code for maintainability
- [ ] write scripts, migrations, and developer tooling
- [ ] choose the order of reversible technical work

The assistant must pause before:
- [ ] public launch actions
- [ ] sending external communications
- [ ] spending money / enabling paid services without confirmation
- [ ] irreversible infra/provider migrations
- [ ] publishing privacy/security/legal claims
- [ ] destructive data operations

## Human input needed
- [ ] confirm this delegation model

---

## 8. Product scope lock for v1

To move fast, the assistant should treat the following as locked unless changed explicitly.

## In scope
- [ ] browser-first consumer survey flow
- [ ] room-by-room capture/upload
- [ ] conditional questionnaire
- [ ] manual declarations
- [ ] mover unlock flow
- [ ] structured PDF/JSON output
- [ ] major-item-first AI inventory
- [ ] volume support for major rigid items
- [ ] confidence and completeness flags

## Out of scope
- [ ] native app dependency
- [ ] fully live guided video mode as MVP requirement
- [ ] full 3D home twin
- [ ] precise long-tail item measurement
- [ ] broad marketplace bidding engine
- [ ] deep mover back-office suite

## Human input needed
- [ ] confirm v1 scope remains locked

---

## 9. Data and testing inputs

## Required soon
- [ ] sample survey media set

## Recommended test set
- [ ] 2 clean home surveys
- [ ] 2 average realistic surveys
- [ ] 1 difficult cluttered survey
- [ ] 1 garage/loft/shed survey
- [ ] 1 specialist-item-heavy survey if possible

## If not available immediately
The assistant can still build:
- app shell
- upload flow
- schema
- mover unlock logic
- output generation shell
- AI integration boundaries

But real quality validation will remain limited.

## Human input needed
- [ ] gather or approve initial test media plan

---

## 10. Legal / privacy / policy decisions

These do not all need to be finalized before coding starts, but some defaults are helpful.

## Needed soon
- [ ] basic retention policy direction
- [ ] whether surveys can be shared to any mover or only invited movers initially
- [ ] whether storage companies are included in v1 or not

## Needed before public release
- [ ] privacy policy
- [ ] terms of use
- [ ] data retention commitments
- [ ] consumer consent language around media processing

## Human input needed
- [ ] approve default retention direction
- [ ] approve sharing model direction

---

## 11. Deployment posture

## Recommended
The assistant should build with a path to deployment from day one, but not block implementation on full production polish.

## Environment sequence
- [ ] local development
- [ ] preview/staging deployment
- [ ] production later

## Human input needed
- [ ] choose first deployment target

---

## 12. Execution sequence after checklist

Once the minimum setup is confirmed, the assistant should proceed in this order:

### Step 1
- scaffold repo/app

### Step 2
- implement survey creation + room flow

### Step 3
- implement upload/storage + survey records

### Step 4
- implement survey summary + status model

### Step 5
- implement mover preview/unlock shell

### Step 6
- implement structured output generation

### Step 7
- add first-pass AI extraction

### Step 8
- add confidence/completeness logic

That is the intended execution path.

---

## 13. Minimum unblock set

The assistant can start meaningful implementation once these are true:

- [ ] real project root confirmed
- [ ] default stack confirmed
- [ ] delegation model confirmed
- [ ] Git initialized

The assistant can go much further once these are also true:

- [ ] hosting chosen
- [ ] DB chosen
- [ ] storage chosen
- [ ] env values available

---

## 14. Current status snapshot

### Already done
- research direction established
- v1 product scope defined
- consumer-first business model reframed
- MVP direction synthesized

### Not yet done
- implementation repo scaffold
- stack confirmation
- infra/provider selection
- secret setup
- test media collection

---

## 15. Immediate next actions

## Assistant actions
- [ ] create a short implementation kickoff plan
- [ ] prepare repo scaffold approach
- [ ] define exact stack recommendation if human does not override

## Human actions
- [ ] confirm implementation root path
- [ ] confirm default stack/providers or allow assistant defaults
- [ ] confirm delegation model
- [ ] create required external accounts when prompted

---

## 16. Bottom line

If this checklist is treated as the operating contract, the assistant can move from “advisor” mode into “primary builder” mode.

That is the point of this document.
