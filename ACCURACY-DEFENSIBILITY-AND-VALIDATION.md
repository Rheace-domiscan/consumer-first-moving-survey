# Accuracy, Defensibility, and Validation
## Iteration 3, Consumer-First Moving Survey Platform
**Date:** 2026-04-16

## Purpose
This is iteration 3 of the deep research program.

This pass answers the most important practical question:

**What does “accurate enough to win” actually mean for this product, and how do we prove it honestly?**

This document focuses on:
- accuracy targets
- defensibility of outputs
- what can be safely automated
- what should escalate to review
- how to benchmark and validate the system
- how to define “superiorly accurate” in business terms rather than hype terms

---

## 1. Core conclusion up front

The product does **not** need perfect whole-home autonomous understanding to be commercially viable.

It needs to be:
- reliable on the items that matter most to pricing and planning
- explicit about uncertainty
- structured enough to save mover time
- trustworthy enough that movers feel they are seeing something better than a generic lead form or a rushed phone survey

That means the real objective is:

### Not
“perfect AI inventory of everything in the house.”

### But
“commercially trustworthy quote-readiness with clear confidence boundaries.”

That distinction matters a lot.

---

## 2. What “superiorly accurate” should mean in this market

The phrase sounds good, but it needs translation into operational terms.

For this product, “superiorly accurate” should mean:

### 1. High recall on major move-driving items
The system should rarely miss the large objects that materially affect:
- van size
- labour estimates
- packing needs
- time on site
- special handling

### 2. Low duplicate / hallucination rate
It must not inflate inventory with phantom or repeated objects.

### 3. Credible volume estimate on major rigid items
The system does not need perfect sub-centimeter measurement.
It needs commercially useful estimates.

### 4. Strong room attribution and coverage awareness
Movers need to know:
- what was seen
- where it was seen
- what was not fully captured

### 5. Honest uncertainty
The system must say when it is unsure.
That is part of quality, not a failure.

### 6. Lower review effort than current workflows
If the mover still has to redo the whole survey, the product failed.

So “superiorly accurate” in business terms means:

**better pricing confidence, lower quote friction, lower missed-item risk, and lower review time than current remote-survey alternatives.**

---

## 3. The right accuracy target is not one number

This system should be measured across multiple dimensions.

### Dimension A, inventory recall
Did we catch the meaningful items?

### Dimension B, inventory precision
Did we avoid false positives and duplicates?

### Dimension C, dimension / volume error
How close were our large-item measurements?

### Dimension D, room assignment accuracy
Did we place items in the right room/area?

### Dimension E, completeness detection
Did we recognize when the survey was incomplete or weak?

### Dimension F, review effort
How much time did a mover/operator need to fix it?

### Dimension G, output success
Did the system consistently produce usable PDF/JSON packages?

This is much more realistic than chasing a single global “accuracy percentage”.

---

## 4. Recommended acceptance targets for early commercial trust

These are not arbitrary. They are intended to be hard enough to matter, but realistic enough for a browser-first guided MVP.

## Phase 1 target thresholds

### Major-item recall
**Target: >= 85%**

Definition:
- Of all move-relevant major items present in the test survey, what percentage are correctly surfaced?

Why this matters:
- Missing a lamp matters less than missing a fridge, piano, wardrobe, bed, or sofa.

### Major-item duplicate / false-positive rate
**Target: <= 8%**

Why:
- Duplicate detections break trust quickly.

### Large-item volume median error
**Target: <= 15%**

Applies to:
- sofas
- beds/mattresses
- wardrobes
- dining tables
- desks
- refrigerators
- washing machines
- dryers
- major shelving/bookcases

Why:
- This is commercially useful even if not engineering-perfect.

### Room assignment accuracy
**Target: >= 90%**

Why:
- Rooms matter for mover review, quote clarity, and survey auditability.

### Survey completeness detection
**Target: >= 90% precision on “incomplete / weak survey” flags**

Why:
- Better to flag low confidence than silently overpromise.

### Operator correction time
**Target: < 10 minutes for a standard survey**

Why:
- If correction takes too long, the business case weakens.

### Output package generation success
**Target: >= 95%**

Why:
- Reliability matters. A smart pipeline that often fails is not useful.

---

## Phase 2 premium target thresholds
With better multi-frame reasoning, tracking, and/or LiDAR path:

- major-item recall: >= 90%
- duplicate rate: <= 5%
- large-item volume median error: <= 10%
- room assignment accuracy: >= 93%
- operator correction time: < 6 minutes

These are stronger but still believable.

---

## 5. What should be automated now versus escalated

## Safe to automate early
These are good automation candidates for MVP:

### Survey workflow automation
- capture instructions
- room sequence
- branching questions
- completeness checklist
- missing-room prompts

### Inventory automation for major categories
- sofa
- mattress/bed
- table
- chairs
- desk
- TV/monitor
- wardrobe
- bookcase
- refrigerator
- washer/dryer
- microwave
- cartons/bags when obvious

### Rules-driven outputs
- packing-material estimates
- special handling flags
- mattress bag recommendations
- TV protection flags
- wardrobe carton suggestions
- mirror/artwork wrap flags

### Basic risk surfacing
- inaccessible rooms
- partial captures
- very cluttered area
- low confidence due to blur / darkness / occlusion

These are all very high ROI.

---

## Escalate to review early
These should route to human review in phase 1 when confidence is low:

### 1. Large ambiguous clutter groups
Examples:
- storage rooms
- lofts
- garages with stacked items
- sheds with irregular equipment

### 2. High-value or high-risk specialist items
Examples:
- antiques
- oversized artwork
- chandeliers
- gym equipment
- pianos
- statues
- delicate glass collections
- commercial equipment

### 3. Poor geometry conditions
Examples:
- objects only partly visible
- highly reflective surfaces
- dark rooms
- camera too close for whole-object framing
- severe motion blur

### 4. Long-tail classification uncertainty
Examples:
- unusual cabinets
- mixed furniture pieces
- custom built-ins versus movable items

### 5. Any survey with weak completeness score
This is essential.

---

## 6. The confidence model should be a first-class product feature

This is one of the most important iteration-3 conclusions.

The system should not only produce predictions.
It should produce:
- predictions
- confidence levels
- reasons for confidence loss
- review recommendations

### Confidence should consider
- detection confidence
- multi-frame consistency
- object fully visible vs partial
- category prior plausibility
- depth/geometry stability
- duplicate risk
- room coverage confidence
- survey completeness confidence

### Example confidence outcomes
- **High confidence**: item visible from multiple frames, strong class match, plausible dimensions
- **Medium confidence**: visible once but strong class match and plausible scale
- **Low confidence**: partial object, ambiguous category, unstable geometry

### Product effect
This enables:
- better mover trust
- better operator routing
- more honest consumer outputs
- safer automation

Without confidence scoring, the product is much weaker.

---

## 7. The benchmark should mimic real moving conditions, not lab demos

A useful benchmark set should include at least these categories:

## Benchmark bucket A, clean standard homes
- good lighting
- obvious furniture
- stable walkthroughs

Purpose:
- establish baseline ceiling

## Benchmark bucket B, realistic imperfect homes
- moderate clutter
- variable lighting
- handheld wobble
- partial occlusion

Purpose:
- realistic day-to-day performance

## Benchmark bucket C, difficult but important environments
- lofts
- garages
- sheds
- basements
- narrow hallways
- highly reflective or dark rooms

Purpose:
- measure failure handling, not just success handling

## Benchmark bucket D, edge-case items
- pianos
- glass tables
- big mirrors
- exercise equipment
- unusual shelving
- office setups

Purpose:
- measure escalation quality and specialist-item handling

---

## Recommended benchmark size for first serious validation
Before claiming real readiness, aim for:
- **30 to 50 full home surveys** minimum
- **5 to 10 room-level controlled measurement sets** with precise ground truth for large items
- **10 to 20 deliberately difficult surveys**

That is enough to learn something real, even if not statistically perfect.

---

## 8. What the ground truth should actually be

For accuracy work, ground truth must be better than “what someone kind of remembers”.

### Ground truth sources
- manual item inventory by human reviewer
- tape-measured dimensions for major rigid items
- room-by-room coverage checklist
- tagged inaccessible areas
- special handling truth labels

### For each survey, collect
- total rooms/areas expected
- total rooms/areas captured
- major items present per room
- item dimensions for major rigid items
- access notes
- confidence on human labeling where ambiguous

This may sound manual, but it is essential.
Without ground truth, you are optimizing vibes.

---

## 9. Recommended scoring framework

## A. Weighted inventory recall
Not all misses matter equally.

### Suggested weighting
- very high weight: fridge, sofa, bed, wardrobe, washer/dryer, major table, large shelving, piano
- medium weight: desk, TV, chair groups, microwave, small cabinets
- lower weight: lamps, bins, decor, small occasional tables

### Why
Commercial pricing is driven disproportionately by certain classes.

---

## B. Dimension/volume scoring for major items only
Do not dilute early benchmarks with impossible long-tail items.
Focus on:
- large rigid categories
- categories with strong priors
- categories with clear commercial value

### Metrics
- median absolute percentage error
- P75 / P90 error bands
- pass rate within 10%, 15%, and 20%

This is a much richer measurement than a single mean.

---

## C. Review burden scoring
Measure:
- time to review a survey
- edits per survey
- number of escalated items
- number of full-resurvey recommendations

This is critical because the product only wins if review burden is acceptable.

---

## 10. Defensibility, how the system should explain itself

A commercially trusted product should provide not just results, but **defensible outputs**.

### For movers
Each survey output should show:
- what was captured
- what rooms were covered
- which items are high/medium/low confidence
- which areas were incomplete or inaccessible
- which estimates are measured vs inferred vs declared

### Labeling tiers I recommend
- **Observed**: seen clearly in media
- **Estimated**: category and/or dimensions inferred from model/rules
- **Declared**: entered manually by consumer
- **Review recommended**: low confidence or high-risk item

This is hugely important.
It turns the system from a black box into an auditable tool.

---

## 11. Security and privacy are part of defensibility, not side issues

Because this product scans inside homes, trust depends partly on security posture.

### Key principles
- TLS 1.3 for transport protection
- secure media handling and short-lived access tokens
- minimal raw media retention by default
- explicit retention settings
- auditable access logs
- tenant isolation for mover access
- signed or one-time share links where appropriate
- encryption at rest for stored media and structured outputs

### For live mode
WebRTC security architecture matters:
- secure signaling assumptions
- consent and media permissions
- communications security
- privacy around IP/location exposure

### Why this belongs in iteration 3
A product that is “accurate” but not trustworthy with home-media data is still commercially weak.

---

## 12. Where superior accuracy will actually come from

Not from one place.
Superior accuracy will come from a stack of choices:

### 1. Better capture guidance
Often the cheapest and highest ROI improvement.

### 2. Major-item-first optimization
Do the commercially meaningful things well first.

### 3. Better duplicate suppression and multi-frame consistency
Huge trust win.

### 4. Strong class priors and dimension priors
Many household categories have constrained size distributions.

### 5. Better completeness detection
Knowing when you do not know is a competitive advantage.

### 6. Escalation rather than bluffing
This is probably the most underrated quality feature.

### 7. Premium geometry path when available
RoomPlan / LiDAR or stronger SfM-based refinement.

---

## 13. What would make movers trust this product faster

If I were a mover, I would trust it more quickly if it consistently gave me:
- room-by-room inventory summary
- high recall on big items
- obvious missing-area flags
- media-backed review of questionable items
- volume estimate with confidence label
- “declared vs observed vs estimated” distinctions

That is more important than a flashy AI claim.

---

## 14. The honest automation boundary for MVP

### Safe product promise for MVP
“Create a structured moving survey with AI-assisted inventory, volume estimates for major items, packing guidance, and clear flags for items or areas that need review.”

### Unsafe product promise for MVP
“Perfectly scan and measure every item in your home automatically from any video.”

The second promise is how teams trap themselves.

---

## 15. Recommended validation plan before public MVP claims

Before marketing heavy accuracy claims, do this:

### Stage 1, internal benchmark
- 30 to 50 surveys
- manual ground truth
- score by metric set above

### Stage 2, friendly pilot with 2 to 5 mover partners
- compare quote prep time
- compare missed-item rate
- compare operator review time
- gather trust feedback

### Stage 3, shadow mode
- run alongside existing mover process
- do not replace it yet
- compare output quality and correction rate

### Stage 4, controlled rollout
- use for quote acceleration, not final sole decision source at first

This is a much more defensible way to launch.

---

## 16. Loop-back, weak spots that remain after iteration 3

To keep the research honest, these still need synthesis in iteration 4:

### Weak spot 1
We have not yet fully translated all this into a single phased MVP recommendation document.

### Weak spot 2
We have not yet chosen the exact first-ship scope line, e.g. whether to include live mode in v1.

### Weak spot 3
We have not yet turned the research into a concrete milestone roadmap with sequencing.

### Weak spot 4
We have not yet finalized the commercial positioning language using the research outputs.

Those are iteration 4 tasks.

---

## 17. Iteration 3 conclusion

The most important insight from this pass is:

**The winning product is not the one that claims the most AI. It is the one that produces the most trustworthy quote-ready output with the least hidden risk.**

That means:
- optimize for major-item correctness
- expose uncertainty clearly
- benchmark honestly
- treat review routing as product design, not failure
- define “accuracy” in operational terms

If you do that well, you do not need perfect autonomous home understanding to have a product that beats a lot of today’s alternatives.
