# Technology Acceleration and Accuracy Deep Dive
## Iteration 2, Consumer-First Moving Survey Platform
**Date:** 2026-04-16

## Purpose
This is iteration 2 of the deep-research program.

The goal of this pass is to determine:
- what technologies can get the product to MVP faster
- what technologies are actually likely to improve commercial accuracy
- what should be bought, reused, stitched together, or avoided
- what stack is most likely to keep the company lean while still becoming genuinely good

Important:
- This is not a “coolest AI stack” document.
- It is a **speed-to-MVP plus accuracy** document.
- A technology only matters if it improves either:
  - time to a working product
  - accuracy on commercially meaningful outputs
  - maintainability for a very small team

---

## 1. Core conclusion up front

The fastest credible path is **not**:
- a single magical end-to-end AI model
- giant custom dataset collection first
- native app first
- full 3D reconstruction of every home before value can be delivered

The fastest credible path is:

### A hybrid stack
- browser-first capture and upload
- strong pretrained detection / segmentation models
- monocular depth + multi-frame geometry where useful
- domain rules for volume and packing logic
- confidence scoring
- human-reviewable exceptions
- LiDAR / RoomPlan as a premium accuracy path later

This is still the best answer.
Iteration 2 strengthens it rather than overturning it.

---

## 2. Product architecture principle

The product should be split into four layers:

### Layer 1, capture and workflow
- guided consumer flow
- room-by-room capture
- video/photo upload
- optional manual declarations
- completeness logic

### Layer 2, perception
- detect objects/items
- segment major objects where useful
- estimate room context
- estimate scale/depth cues
- track objects across frames

### Layer 3, move intelligence
- deduplicate detections
- assign room
- estimate category, count, and coarse dimensions
- estimate volume contribution
- estimate packing-material requirements
- surface confidence / missing areas

### Layer 4, quote-ready output
- PDF summary
- JSON / structured inventory
- mover unlock view
- audit/review trail

This matters because many companies over-invest in Layer 2 before Layers 1, 3, and 4 are strong enough.
That is usually a mistake.

---

## 3. Technology candidates that genuinely accelerate MVP

## A. Real-time / batch object detection and segmentation

### Best current use
Use a strong pretrained detection stack, likely YOLO-family, for:
- major household objects
- appliance classes
- TV / monitor / desk / sofa / bed / table / chair / wardrobe / bookcase / refrigerator / washer / dryer / cartons

### Why this accelerates MVP
- fast to implement
- huge ecosystem
- good inference speed
- can run on server or edge
- widely exportable
- lets you start with major items before fine-grained long-tail classes

### Confirmed external signal
Ultralytics emphasizes real-time detection, segmentation, tracking, and deployment across edge/cloud workflows.

### Recommendation
For MVP:
- start with pretrained object detection and, where needed, segmentation
- do not train a giant bespoke model on day one
- only fine-tune after you have real moving-survey data and error logs

### Accuracy reality
Detection alone does **not** give enough for reliable volume measurement.
But it gives an essential first layer.

---

## B. Monocular depth estimation

### Strong candidate
Depth Anything V2

### Why it matters
Depth Anything V2 surfaces several things relevant to us:
- stronger detail than v1
- faster and lighter than diffusion-based alternatives
- metric-depth variants exist
- Core ML support exists
- video and web-adjacent ecosystem support exists

### Important caveat
Depth Anything is excellent as a depth prior.
It is **not** a magic tape measure from arbitrary consumer video on its own.

### Best use in our stack
Use it to:
- estimate relative geometry
- improve object size plausibility
- support room/layout understanding
- augment dimension estimation for large rigid objects
- improve guided warnings like “move closer”, “capture from side”, “need reference view”

### Not ideal use
Do not use it alone to claim exact commercial cube output for every item.
That would be fragile.

### Recommendation
Use monocular depth as a **supporting geometry layer**, not as the sole source of truth.

---

## C. Multi-frame point tracking

### Strong candidate
CoTracker / CoTracker3

### Why it matters
CoTracker is specifically useful because it can:
- track dense points jointly
- handle occlusions better than many independent trackers
- operate in online mode
- support longer videos and streaming scenarios

### Why this is useful for moving surveys
Consumer videos are messy:
- shaky camera motion
- partial occlusion
- items seen from multiple angles
- objects leaving/re-entering view

Tracking helps connect multiple glimpses of the same object across frames.
That can improve:
- deduplication
- persistence of object identity across a room pan
- geometry consistency
- camera-motion reasoning for later reconstruction

### Recommendation
CoTracker is a strong candidate for phase 1.5 / 2 of the perception stack.
It may be too heavy to make the very first prototype depend on, but it is one of the best accelerants for increasing quality without inventing tracking yourself.

---

## D. Structure-from-motion / camera pose recovery

### Strong candidate
VGGSfM

### Why it matters
VGGSfM is interesting because it offers:
- deep structure-from-motion
- camera-pose recovery from image sequences
- 3D point cloud reconstruction
- support for sequential input / videos
- dynamic-object masking guidance
- optional dense depth alignment with Depth Anything V2

### Why this matters to us
This is one of the most interesting building blocks for a non-LiDAR premium measurement path.
It gives a way to move from:
- “we saw a sofa”

into:
- “we have a better estimate of camera motion, object consistency, and scene geometry across frames”

### Big caution
VGGSfM is powerful, but it is not the right foundation for the **very first user-facing MVP** if that MVP must be extremely lean and reliable quickly.

Why:
- more infrastructure complexity
- more compute cost
- more tuning/QA burden
- greater chance of edge-case failures in cluttered homes

### Recommendation
Treat VGGSfM as:
- phase 2 premium geometry engine
- or a background refinement stage for selected surveys / selected rooms / selected large items

Do not make it the gatekeeper for MVP launch.

---

## E. Apple RoomPlan / LiDAR

### Strong candidate for premium accuracy path
Apple RoomPlan is by far one of the most important technologies in this whole space.

### Confirmed signal from Apple research
RoomPlan provides:
- real-time room-layout estimation
- LiDAR + camera fusion
- door/window/wall detection
- 3D object-detection pipeline
- parametric room output
- real-time on-device guidance
- support for major furniture categories

Apple describes:
- room layout estimation
- object detection directly in 3D
- local + global detection components
- real-time scanning on iPhone/iPad

This is very strong.

### Why it matters strategically
If you want superior accuracy eventually, LiDAR is the cleanest consumer-grade path.
It reduces ambiguity dramatically.

### Problem
It is limited by:
- supported Apple hardware
- native app dependency
- not every consumer having compatible devices

### Recommendation
Do **not** make this the only product path.
But absolutely plan for it as:
- premium measurement mode
- high-trust enterprise / mover-reviewed mode
- future differentiator once browser MVP works

### Strong conclusion
Browser-first MVP is still right.
RoomPlan should be a phase 2 accuracy lane, not phase 1 dependency.

---

## F. Live video infrastructure

### Strong candidate
LiveKit or equivalent real-time video platform

### Why it matters
If you later support:
- surveyor-guided sessions
- live consumer walkthroughs
- remote mover review
- real-time coaching

you need stable live media infra, not hacked video calling.

### Why this accelerates speed
LiveKit gives:
- production-grade real-time communications layer
- SDKs across platforms
- support for video, audio, and real-time systems integration

### Recommendation
For phase 1:
- asynchronous upload is enough

For phase 2:
- LiveKit-class infra is likely the right move for guided/live workflows

Do not block MVP on live calling unless the business requires it immediately.

---

## G. Inference portability and deployment

### Strong candidate
ONNX Runtime for inference portability

### Why it matters
A small team benefits a lot from being able to:
- train or adopt models in one ecosystem
- deploy efficiently across hardware targets
- optimize without fully rewriting inference infrastructure

### Recommendation
Design the inference boundary so models can be swapped and exported.
That strongly suggests using ONNX-compatible deployment where practical.

This matters more for long-term maintainability than for initial demo speed, but it is still a good architectural decision.

---

## 4. What should be rules-based first

This is a major part of moving faster.

### Strong rules-first candidates
- branching questionnaire logic
- inaccessible-area declarations
- survey completeness scoring
- room checklist coverage
- packing material recommendations
- special handling flags
- mattress bag recommendations
- TV protection logic
- wardrobe carton logic
- artwork / mirror protection logic
- carton-count heuristics
- access risk flags
- confidence-threshold routing to review

### Why this matters
None of these require exotic ML first.
And these are commercially meaningful outputs.

### Strategic insight
The market probably over-markets AI but still relies heavily on exactly this kind of logic.
That is good for us.

---

## 5. What improves actual accuracy versus just looking clever

## What truly improves accuracy
### 1. Guided capture quality
Better instructions often beat fancier models.
Examples:
- hold steady
- scan room left-to-right and back
- capture tall items fully
- include floor contact points
- step back for large objects
- capture inaccessible spaces separately

### 2. Major-item-first ontology
Accuracy rises when you prioritize large rigid objects that matter most commercially.

### 3. Multi-frame reasoning
Single-frame guesswork is weak.
Multi-frame consistency is much stronger.

### 4. Reference constraints and priors
Known category priors help.
Examples:
- fridges have plausible size bands
- UK king mattress has known dimensions
- washing machines are constrained ranges

### 5. Confidence-aware review
Bad automation hurts trust more than partial automation.

### 6. Better geometry when available
LiDAR, camera-pose recovery, and multi-view alignment all help.

---

## What looks clever but is often lower ROI early
- full dense 3D scene reconstruction for every survey
- custom giant end-to-end model training before enough real data exists
- chasing perfect long-tail item classification
- building native app first just because it feels “serious”
- overfitting to demo-room conditions

---

## 6. Recommended stack by phase

## Phase 1, fastest credible MVP
### Goal
Generate commercially useful survey outputs for consumers and movers quickly.

### Capture
- browser-first mobile web app
- guided room-by-room photo/video upload
- questionnaire + optional branching + manual declarations

### Perception
- pretrained object detector / segmenter for major categories
- coarse room/scene heuristics
- optionally lightweight depth prior for plausibility checks

### Intelligence
- deduplication heuristics
- item ontology
- volume rules for major items
- packing-material rules
- confidence scoring
- missing-area / weak-survey flags

### Output
- survey summary PDF
- structured JSON
- mover preview + unlock flow

### Why this wins
- fastest path to usable product
- lowest engineering drag
- does not depend on fragile geometry perfection

---

## Phase 1.5, quality lift without rebuilding everything
### Add
- CoTracker-based multi-frame consistency for selected flows
- better segmentation for large rigid items
- depth prior integration for better dimension plausibility
- improved duplicate suppression
- better room assignment

### Why
This is where you get noticeably smarter without jumping to full 3D reconstruction.

---

## Phase 2, premium measurement path
### Add
- optional iOS native capture with RoomPlan / LiDAR
- or premium backend refinement using VGGSfM-style geometry for selected surveys
- higher-confidence large-item measurement
- improved spatial layout outputs

### Why
This creates a premium accuracy lane for:
- compatible users
- enterprise workflows
- more complex surveys

---

## 7. Buy / build / borrow guidance

## Borrow / reuse now
- pretrained object detectors / segmenters
- depth foundation models
- tracking models
- real-time media infrastructure
- model runtime / acceleration layer

## Build yourself now
- consumer workflow
- mover unlock workflow
- moving ontology
- item/packing rules engine
- confidence model
- report generation
- audit/review UX
- share and permission model

## Delay custom building
- custom end-to-end CV model
- custom reconstruction framework
- own video stack from scratch
- own mobile-native camera stack unless phase 2 requires it

---

## 8. Competitor technology inference from iteration 1 plus this pass

### Yembo, likely stack shape
Likely:
- mature CV pipeline
- video/image understanding
- object detection and inventory classification
- geometry and business-rule postprocessing
- strong report-generation layer
- likely substantial internal annotation / feedback loops

### Move4U / mover apps, likely stack shape
Likely:
- workflow-first SaaS
- media upload or recording
- manual or semi-manual itemizer logic
- rules-heavy estimate generation
- CRM/operations integration

### VMT, likely stack shape
Likely:
- snapshot or video capture
- some CV-assisted item/estimate logic
- hybrid expert workflow
- emphasis on practicality rather than full autonomy

### Implication
Your best path is not to out-Yembo Yembo on pure CV immediately.
Your best path is:
- be more consumer-native
- be more portable
- be more workflow-smart
- be more confidence-aware
- then selectively add better geometry/measurement where it actually pays off

---

## 9. What technologies should probably be avoided for MVP

Avoid building MVP around:
- diffusion-heavy depth stacks when lighter, faster alternatives exist
- giant custom labeling efforts before enough real-world error data exists
- research-grade 3D reconstruction as a mandatory path for every survey
- device-specific native-only experiences that cut off adoption
- overly brittle live-only survey workflows

---

## 10. The best practical stack recommendation right now

If I had to recommend the most practical technology direction today, it would be:

### Frontend / product
- mobile-first web app
- secure upload
- guided questionnaire and room flow

### Core backend
- object storage
- async workers
- structured survey pipeline
- PDF/JSON output generation

### Vision layer
- pretrained YOLO-style detection / segmentation for major categories
- optional depth prior via Depth Anything V2 for geometry support
- optional multi-frame tracking via CoTracker when needed

### Intelligence layer
- moving ontology
- dimension/volume priors
- packing-material rules engine
- confidence scoring and review routing

### Premium accuracy lane
- future RoomPlan / LiDAR on supported iOS devices
- optional VGGSfM-style background refinement for selected cases

### Live mode later
- LiveKit-class infrastructure when guided sessions matter

This is the stack most likely to be:
- fast enough
- accurate enough to be commercially meaningful
- maintainable by a tiny team
- extensible into something stronger later

---

## 11. Loop-back, where this pass is still weak

To keep this honest, here are the weak spots that need iteration 3.

### Weak spot 1
We still need sharper analysis of:
- what accuracy targets are realistic by stack layer
- how much each layer improves commercial error rates in practice

### Weak spot 2
We still need a fuller answer on:
- how to benchmark major-item measurement accuracy
- how to validate confidence thresholds
- when to trust automation versus escalate to review

### Weak spot 3
We still need deeper consideration of:
- object taxonomy design
- dimension priors by item class
- how to handle ambiguous clutter and duplicates robustly

### Weak spot 4
We still need to define:
- what “superiorly accurate” actually means in business terms
- what minimum thresholds are enough to win mover trust

Those are iteration 3 problems.

---

## 12. Iteration 2 conclusion

The deep-dive reinforces the same big answer, but with more confidence:

### The right stack is hybrid
- pretrained vision
- geometry assistance where useful
- rules where rules are faster and more reliable
- review when confidence is low
- LiDAR as premium path, not mandatory path

### The right MVP is browser-first
Not because it is glamorous, but because it is the fastest route to adoption and real data.

### The right company strategy is lean
Do not build a research lab before you build a product.
Build a smart operational system first, then deepen the AI where error logs prove it matters.

That is the most credible way to ship quickly and still become genuinely strong later.
