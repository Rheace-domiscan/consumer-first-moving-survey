# V1 Product Spec
## Consumer-First Moving Survey Platform
**Date:** 2026-04-16

## 1. Product summary

Build a browser-first consumer moving survey product that helps a person create a structured digital move survey for free, then securely share it with movers or storage providers who can unlock the full output.

The product should generate a survey package that is meaningfully better than:
- a basic quote form
- an unstructured phone survey
- a raw video file with no structure

The product is not trying to perfectly measure every item in every house in version 1.
It is trying to produce a **commercially useful, trustworthy, structured survey package**.

---

## 2. Product goals

## Primary goals
- make it easy for a consumer to complete a move survey on mobile browser
- generate structured quote-ready output
- detect major items with useful accuracy
- estimate major-item volume contribution credibly
- surface packing-material and special handling guidance
- show confidence and completeness clearly
- make mover review faster than current remote-survey alternatives
- support secure survey sharing and paid mover unlock

## Non-goals for v1
- perfect full-home autonomous inventory
- exact measurement of every object
- native mobile app dependency
- live guided survey as required flow
- deep mover ops/CRM suite
- open marketplace bidding engine

---

## 3. Users and roles

## User type A, consumer
A person planning a move who wants to create one structured survey and share it with one or more movers.

### Consumer needs
- easy guided flow
- confidence that they are doing it correctly
- ability to skip or declare inaccessible areas
- useful summary of what was captured
- ability to securely share survey
- ideally no upfront cost

---

## User type B, mover/storage company user
A removal/storage professional who wants to review a survey quickly and use it for quote preparation.

### Mover needs
- quick preview of survey quality
- clear inventory summary
- room-by-room review
- volume and packing insight
- confidence flags
- easy export / download
- lower review time than current alternatives

---

## User type C, internal admin/operator
Internal user who monitors surveys, manages exceptions, audits access, and helps maintain quality.

### Admin needs
- survey visibility
- low-confidence queue
- mover account management
- unlock/payment tracking
- retention controls
- audit trail

---

## 4. Core user journeys

## Journey 1, consumer creates survey
1. consumer lands on mobile-friendly survey flow
2. consumer creates account or uses low-friction start flow
3. consumer answers initial move questions
4. consumer is guided through room/area selection
5. consumer uploads or records media by room/area
6. consumer adds manual declarations for inaccessible areas or missed items
7. system analyzes survey
8. consumer reviews summary
9. consumer shares survey via secure link/code

### Success condition
Consumer completes a full survey without needing human support.

---

## Journey 2, mover unlocks survey
1. mover receives survey link or invite
2. mover sees preview page
3. mover signs in or creates account
4. mover unlocks survey access
5. mover reviews structured output
6. mover downloads PDF/JSON or uses internal review UI

### Success condition
Mover can review and use survey faster than a traditional remote quote process.

---

## Journey 3, internal review for weak survey
1. system flags low-confidence or incomplete survey
2. admin/operator sees it in exception queue
3. operator reviews media and structured output
4. operator adds corrections or notes
5. corrected output becomes available to mover

### Success condition
Weak cases are recoverable without full product failure.

---

## 5. v1 feature scope

## Consumer-facing features

### 5.1 Survey start and setup
- start survey flow
- capture move basics:
  - origin postcode / area
  - destination postcode / area if known
  - property type
  - number of bedrooms
  - likely move timeframe
  - storage needed? yes/no/unsure
  - packing help needed? yes/no/unsure

### 5.2 Room and area selection
Allow user to choose relevant areas:
- living room
- dining room
- kitchen
- utility room
- bedroom(s)
- office/study
- bathroom(s)
- hallway/landing
- garage
- loft/attic
- basement/cellar
- shed/outbuilding
- garden/outdoor items
- other custom area

### 5.3 Conditional questionnaire
Examples:
- do you have loft contents?
- do you have garage tools or storage shelving?
- any large garden furniture or equipment?
- any fragile, valuable, or specialist items?
- are there stairs, tight access, or lift restrictions?

### 5.4 Media capture/upload
Per room/area:
- upload photos and/or short video
- support multiple files per room
- allow retake/reupload
- mobile-first UX

### 5.5 Manual declarations
Allow user to add:
- missed items
- inaccessible room notes
- special items
- access notes

### 5.6 Survey summary
Show:
- rooms completed
- incomplete or weak areas
- declared inaccessible areas
- estimated key items found
- final share action

### 5.7 Sharing
- secure share link
- share code
- optional mover-specific invite later

---

## Mover-facing features

### 5.8 Survey preview page
Before unlock, show:
- high-level move summary
- property type / size
- room count covered
- completeness indicator
- indicative major-item count band
- preview of usefulness

### 5.9 Unlocked review view
After unlock, show:
- room-by-room inventory summary
- major-item list
- declared items
- observed vs estimated vs declared tags
- large-item volume summary
- packing-material guidance summary
- special handling flags
- confidence/review flags
- media review by room

### 5.10 Export
- PDF summary
- JSON export
- CSV export optional if easy

---

## Internal/admin features

### 5.11 Survey management
- list surveys
- filter by state, confidence, mover, age
- inspect full survey records

### 5.12 Exception queue
- low confidence
- incomplete survey
- processing failed
- suspected duplicate/misclassification heavy cases

### 5.13 Access and audit
- mover account controls
- unlock record history
- survey access log
- retention/expiry settings

---

## 6. AI and processing scope for v1

## Included in v1
- major-item detection for core categories
- coarse room association
- confidence scoring
- completeness scoring
- volume estimation for major rigid categories
- packing/material rule outputs

## Categories to prioritize first
- sofa
- armchair / chair groups
- dining table
- desk
- TV / monitor
- bed / mattress
- wardrobe
- chest of drawers
- bookcase / shelving
- refrigerator
- freezer
- washing machine
- dryer
- microwave
- large cabinet sideboard classes
- obvious cartons / bags where possible

## Explicitly not required in v1
- precise recognition of every niche household item
- high-accuracy measurement of small irregular objects
- full 3D room reconstruction for every survey
- live pose-guidance system beyond basic capture UX

---

## 7. Outputs

## 7.1 Consumer-visible output
Consumer should see:
- survey completion summary
- areas completed vs incomplete
- key item summary
- declared items summary
- share link/code

## 7.2 Mover-visible output
Mover should see:
- property summary
- room-by-room inventory
- major-item counts
- estimated move volume summary
- packing-material summary
- special handling summary
- confidence flags
- notes on inaccessible or weakly captured areas

## 7.3 PDF package
Include:
- survey id
- consumer move summary
- room list
- item summary by room
- major-item estimate summary
- packing-material suggestions
- special handling flags
- completeness / confidence notes
- declared vs observed vs estimated legend

## 7.4 JSON structure
Minimum fields should support:
- survey metadata
- rooms/areas
- media references
- detected items
- declared items
- confidence values
- estimated volume figures
- packing guidance
- access notes

---

## 8. Confidence and labeling model

Each surfaced item or major output should use one or more of these labels:
- **Observed**
- **Estimated**
- **Declared**
- **Review recommended**

### Confidence tiers
- High
- Medium
- Low

### Confidence affects
- display styling
- mover trust cues
- internal review routing
- whether item contributes fully or conservatively to estimates

---

## 9. Completeness model

Each survey should receive a completeness status.

### Proposed statuses
- Complete
- Mostly complete
- Incomplete
- Review required

### Inputs into completeness
- number of selected rooms completed
- unaddressed required questions
- declared inaccessible areas
- media quality issues
- evidence of missing room coverage

This is essential to trust.

---

## 10. Functional requirements

## Consumer flow requirements
- mobile web must be first-class
- user can save and resume survey
- each room/area can hold multiple media files
- user can mark room as inaccessible or not yet ready
- user can add manual notes and declarations
- user can submit survey even with declared gaps
- system must clearly indicate incomplete sections

## Processing requirements
- media uploads are stored securely
- analysis runs asynchronously
- survey status updates visible to user and mover
- failed processing must be retryable

## Mover requirements
- mover preview available without exposing full sensitive detail
- full survey requires unlock/auth
- unlocked mover can review structured output and media
- mover can export output

## Admin requirements
- admin can review survey pipeline state
- admin can inspect low-confidence flags
- admin can manage account access and retention

---

## 11. Non-functional requirements

## Performance
- upload flow should feel responsive on mobile
- summary generation should complete within commercially acceptable time after submission
- target initial processing turnaround: a few minutes, not hours, for standard surveys

## Security
- TLS 1.3 for transport
- encryption at rest for stored media and core records
- signed or expiring share links
- least-privilege media access
- audit logging for unlocks and views

## Privacy
- minimal default media retention
- explicit retention controls
- consumer visibility on sharing state
- mover access only to surveys they are authorized to unlock/view

## Reliability
- output generation success target >= 95%
- processing jobs retryable
- bad or partial media should not crash whole survey pipeline

---

## 12. Data model, high level

## Main entities
- User
- ConsumerProfile
- MoverAccount
- Survey
- SurveyRoom
- MediaAsset
- DeclaredItem
- DetectedItem
- SurveyOutput
- UnlockEvent
- AccessAuditLog
- ReviewFlag
- ReviewAction

## Important survey fields
- survey id
- creator user id
- survey status
- completeness status
- overall confidence summary
- move metadata
- selected rooms
- declared inaccessible rooms
- share token/code metadata
- retention expiry metadata

---

## 13. Suggested states

## Survey states
- draft
- collecting_media
- submitted
- processing
- processed
- review_required
- ready_to_share
- shared
- unlocked
- archived

## Media states
- uploaded
- queued
- processing
- analyzed
- failed

---

## 14. Success metrics for v1

## Product metrics
- consumer survey completion rate
- average time to complete survey
- mover unlock conversion rate
- mover review time
- repeat share / multi-mover share rate

## Accuracy metrics
- major-item recall >= 85%
- duplicate rate <= 8%
- large-item volume median error <= 15%
- room assignment >= 90%
- output success >= 95%

## Operational metrics
- correction time < 10 minutes for standard survey
- percentage of surveys routed to review
- percentage of surveys successfully processed without manual intervention

---

## 15. Recommended implementation phases after spec

### Phase A
Build capture, storage, room flow, summary shell

### Phase B
Add structured outputs and mover unlock flow

### Phase C
Add major-item AI inventory and confidence layer

### Phase D
Add volume/packing intelligence and review queue

This is the right build order.

---

## 16. Open decisions after this spec

These do not block initial technical design, but will need resolution:
- exact unlock pricing model
- whether consumer can share to any mover from day one or only via invite flow
- whether mover preview should show indicative item counts before payment
- exact retention defaults for media
- whether a no-login lightweight consumer start is allowed
- whether storage companies are in v1 or just movers

---

## 17. Bottom line

V1 should be a disciplined, browser-first, consumer survey product that creates a trusted structured move package, not an overpromised autonomous scanning system.

If built to this spec, it will be:
- differentiated enough
- commercially useful enough
- technically realistic enough
- lean-team friendly enough

to justify moving into actual implementation planning.
