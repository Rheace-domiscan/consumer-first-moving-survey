# MVP Direction After 4 Passes
## Consumer-First Moving Survey Platform
**Date:** 2026-04-16

## Purpose
This is iteration 4, the synthesis pass.

It combines:
- iteration 1, competitor mapping
- iteration 2, technology acceleration and accuracy analysis
- iteration 3, accuracy / defensibility / validation logic

into a practical product recommendation.

Important:
- This document is the best current synthesis of the work completed so far.
- It is strong enough to guide MVP direction.
- It is **not** the final exhaustive research word on the category.
- Some areas may still benefit from a deeper later pass, especially broader global competitor coverage and more technology triangulation.

That said, we now have enough to make smart product decisions.

---

## 1. Final synthesis in one paragraph

The right first product is a **browser-first consumer self-survey platform** that helps a person create a structured moving survey passport for free, including room-by-room inventory, major-item detection, estimated volume contribution for large items, packing-material guidance, and clear completeness/confidence flags, then securely share that survey with movers or storage firms, who pay to unlock the full operationally useful output.

That is the product.

Not a pure marketplace first.
Not a native app first.
Not a “perfect AI scan of every home item” first.

---

## 2. The best business framing now

### Best short positioning line
**A free consumer move survey passport that removals and storage firms pay to unlock.**

### Slightly longer version
Consumers create one guided digital move survey, complete with inventory, volume estimates for major items, packing guidance, and survey completeness indicators. They can then securely share that survey with removal and storage companies, who use it to price and plan the move more efficiently.

### Why this framing wins
It clearly sits between:
- mover-first survey software
- and generic lead marketplaces

That is still the strongest wedge uncovered by the research.

---

## 3. Final answer on what the MVP should actually be

## Consumer MVP
### Must include
- mobile-first browser flow
- guided room-by-room survey
- conditional questionnaire
- room/area selection including loft, cellar, garage, shed, garden, outbuildings
- video or photo upload by room/area
- manual declaration for inaccessible spaces and missed items
- survey completeness prompts
- summary view before share
- secure share link / code

### Should include
- itemized major-item inventory
- estimated total move volume band
- estimated packing-material summary
- special handling flags
- observed vs declared vs estimated labeling

### Should not include yet
- full live survey mode as MVP dependency
- native iOS app as MVP dependency
- perfect full-property autonomous 3D scene reconstruction
- exotic long-tail item precision claims

---

## Mover MVP
### Must include
- mover account / access control
- survey preview before unlock
- paid unlock flow or account-based unlock logic
- room-by-room survey review
- inventory summary
- major-item volume summary
- packing-material / special handling summary
- downloadable PDF
- structured export, JSON and/or CSV
- confidence/review flags

### Should include
- notes and internal review fields
- audit trail on unlock / access / changes

### Should not include yet
- full CRM integrations before core product value is proven
- complex dispatch/ops suite
- full market bidding engine

---

## Internal/admin MVP
### Must include
- survey record management
- mover account management
- unlock/payment tracking
- retention controls
- audit logging
- exception queue for low-confidence surveys

---

## 4. What the product should optimize for first

The product should optimize for these, in order:

### 1. consumer completion rate
If consumers do not finish the survey, nothing else matters.

### 2. major-item correctness
This matters more than long-tail item brilliance.

### 3. completeness detection
Knowing what is missing is a major trust feature.

### 4. mover review speed
The product should reduce review time, not create more of it.

### 5. portable structured output
This is one of the main differentiators.

### 6. trust and privacy posture
The product scans inside homes, so it must feel safe.

---

## 5. Final answer on what the technology stack should be

## Recommended phase-1 stack

### Frontend
- mobile-first web app
- responsive browser capture/upload
- strong step-by-step guidance

### Backend
- secure object storage
- async processing pipeline
- relational DB for surveys, users, movers, unlocks, and audit data
- worker queue for media analysis and report generation

### Vision / AI layer
- pretrained YOLO-style detection and segmentation for major move-relevant classes
- optional depth prior support using Depth Anything V2 for geometry plausibility and dimension assistance
- simple multi-frame heuristics first, deeper tracking later

### Intelligence layer
- moving ontology
- major-item dimension priors
- volume rules engine
- packing-material rules engine
- special handling logic
- completeness scoring
- confidence scoring

### Output layer
- PDF generator
- JSON / CSV export
- secure share system
- mover unlock view

### Security baseline
- TLS 1.3 everywhere applicable
- encrypted storage
- signed or expiring access links
- audit logging
- minimum-retention defaults
- tenant-aware access separation

---

## Recommended phase-1.5 quality improvements
Add after basic product works:
- CoTracker or equivalent multi-frame tracking for better duplicate suppression and object continuity
- stronger segmentation on major rigid objects
- better room attribution
- better confidence calibration
- operator review queue with quality analytics

---

## Recommended phase-2 premium accuracy path
After browser-first product is validated:
- optional iOS RoomPlan / LiDAR mode
- optional VGGSfM-like background refinement for selected surveys or selected large-item rooms
- guided live survey mode with LiveKit-class media infrastructure

This is the right order.

---

## 6. Exact scope line for v1

If I were drawing the line very clearly, v1 should be:

### In v1
- browser-first self-survey
- upload-first, async-first
- major-item AI inventory
- volume estimation for large rigid items
- manual declarations for gaps
- completeness scoring
- packing-material recommendations
- mover unlock flow
- PDF + JSON output
- confidence flags

### Out of v1
- native app dependency
- full live guided-calling platform
- precise measurement of every single item
- automatic full-home 3D twin
- direct marketplace quote-bidding engine
- deep mover back-office suite

This scope is disciplined and commercially coherent.

---

## 7. Best product promise for the MVP

### Safe, strong promise
**Create one guided digital moving survey with AI-assisted inventory, major-item volume estimates, packing guidance, and clear confidence flags, then share it securely with movers for faster, better quoting.**

### Unsafe promise
**Perfectly scan and measure everything in your home automatically from a quick video.**

Do not use the unsafe promise.

---

## 8. Final answer on where the moat can come from

The moat is unlikely to come from one thing.
It can come from a combination of:

### 1. Consumer entry point and data ownership model
Most competitors are mover-owned or marketplace-led.

### 2. Better moving ontology and rules engine
This is underrated and commercially important.

### 3. Better confidence-aware UX
Most products do not productize uncertainty well.

### 4. Better structured output portability
Portable survey passport is a real wedge.

### 5. Better premium geometry path later
LiDAR / stronger reconstruction can deepen the moat later.

So the moat is:
- workflow + data structure + trust + improving perception quality over time
not just a single AI model.

---

## 9. Final answer on what to build first, in sequence

## Milestone 1, survey capture foundation
Build:
- auth
- survey creation
- room flow
- question branching
- upload pipeline
- storage
- survey status tracking

### Success condition
A consumer can complete and submit a multi-room survey cleanly.

---

## Milestone 2, structured output foundation
Build:
- room/area model
- item ontology
- manual declarations
- completeness logic
- PDF/JSON output shell

### Success condition
A finished survey can generate a structured non-AI report.

---

## Milestone 3, major-item AI inventory
Build:
- major-item detection layer
- dedupe heuristics
- room assignment heuristics
- confidence labels

### Success condition
The system can produce a first useful AI-assisted inventory on real consumer media.

---

## Milestone 4, major-item volume and packing logic
Build:
- dimension priors
- volume contribution estimates
- packing-material logic
- special handling flags

### Success condition
Movers can review a quote-supportive package rather than just a lead form.

---

## Milestone 5, mover unlock and review product
Build:
- preview/unlock flow
- mover dashboard
- access control
- audit trail
- download/export

### Success condition
A mover can pay or otherwise unlock, review, and use the survey operationally.

---

## Milestone 6, review + quality loop
Build:
- operator correction workflow
- quality analytics
- benchmark harness
- error logging by item class and survey condition

### Success condition
The product starts learning where it is weak and where to improve next.

---

## 10. Recommended success criteria before calling MVP “real”

Before claiming real readiness, I would want:
- major-item recall >= 85%
- duplicate rate <= 8%
- large-item volume median error <= 15%
- room assignment >= 90%
- output package success >= 95%
- operator correction time < 10 minutes
- a benchmark set of at least 30 to 50 real survey cases

If you hit those, this is not just a concept anymore.

---

## 11. Final answer on what not to do next

Do **not** do these next:
- build native app first
- over-invest in full 3D reconstruction immediately
- start with live video survey mode if async upload is enough to validate demand
- train giant custom models before error data exists
- add marketplace bidding complexity before survey product proves value
- market “perfect AI scan” claims

These are the highest-risk distractions.

---

## 12. The best immediate next step after research

Now that iteration 4 exists, the most valuable next artifact is:

### a real product spec / build brief for v1
It should define:
- user roles
- screens and flows
- data model
- media pipeline
- AI pipeline boundaries
- confidence system
- output package structure
- mover unlock workflow
- acceptance criteria

That is the bridge from research into execution.

---

## 13. Final decision summary

### Business model
- consumer free
- mover/storage pays to unlock/use survey

### Product type
- survey passport first
- lead/network effects second

### MVP form
- browser-first
- async-first
- major-item-first
- confidence-aware

### Technical philosophy
- hybrid stack
- pretrained vision + rules + review
- premium geometry later

### Accuracy philosophy
- optimize for quote-readiness, not AI theater

### Company philosophy
- keep it lean
- avoid research-lab sprawl before product traction

---

## 14. Bottom line

After four passes, the clearest recommendation is this:

**Build a browser-first consumer moving survey passport that focuses on major-item inventory, practical volume support, packing guidance, completeness detection, and mover unlock workflows.**

That is the cleanest path to:
- shipping something real
- preserving strategic differentiation
- staying lean
- improving toward stronger volumetric accuracy later

It is a stronger plan than trying to begin with a perfect fully autonomous Yembo-style 3D intelligence engine.

That can come later.
The right first win is a product that people will actually complete, movers will actually use, and a tiny team can actually build.
