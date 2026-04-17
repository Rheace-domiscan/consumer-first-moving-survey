# Competitor Matrix
## Iteration 1, Consumer-First Moving Survey Platform
**Date:** 2026-04-16

## Purpose
This is the first proper competitor mapping pass for the consumer-first moving survey platform.

Important:
- This document distinguishes between **confirmed facts**, **likely inference**, and **speculation**.
- This is intentionally a first-pass matrix, not the final word.
- The purpose is to map the field, identify product patterns, and expose whitespace.

---

## Category map

### Category A, mover-first AI/virtual survey platforms
These are closest to the original Yembo-style market.
They are sold primarily to movers/relocation companies.

### Category B, mover-first pre-move survey / estimate apps
These digitize the survey and estimate workflow, often with self-survey add-ons.

### Category C, consumer-facing lead / quote marketplaces
These capture demand and route users to movers, but do not appear to center on a portable consumer-owned survey asset.

### Category D, mover-branded self-survey pages
These are important because they validate consumer willingness to self-capture move data, even if the platform underneath is not consumer-owned.

### Category E, adjacent consumer inventory / moving apps
These are not direct competitors yet, but they matter because they can influence user expectations around inventory capture and portability.

---

## Matrix

| Competitor | Category | Primary customer | Core product pattern | Consumer self-survey? | Portable consumer-owned asset? | AI / automation signal | Confirmed evidence | Likely technology inference | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Yembo | A | Movers, insurance | AI-powered virtual property inspection and inventory generation | Yes, in some workflows | No clear evidence consumer owns portable survey independently | High | AI-powered property inspections, automated inventory generation, fast estimates | Computer vision on video, cloud processing, domain-specific inventory models, likely human review around edges | Strong benchmark for automation and report quality |
| Voxme Virtual Moving Survey | A/B | Movers / surveyors | Two-way video survey, cloud recording, CRM-integrated reports | Consumer joins guided session | No clear evidence | Low to medium, mostly workflow automation from surfaced evidence | Video survey via app/web, cloud recording, CRM integration, survey reports with photos | WebRTC/video calling, cloud storage, CRM/reporting stack | Strong workflow product, not obviously strong AI moat from surfaced evidence |
| Move4U SurveyVideo | B | Moving companies | Recorded virtual estimate + self-survey + itemizer integration | Yes | No clear evidence | Medium for estimation workflow, not clearly AI-heavy | Virtual estimate, recorded streaming call, self-survey app, uploads photos/videos, ISO-certified itemizer | Video capture + cloud backend + rules/itemization engine + business system integration | Strong indication rules/itemizer matter as much as AI |
| Virtual Moving Technologies (VMT) | A/B | Movers / relocation companies | Virtual survey with DIY or service-assisted model | Yes | No clear evidence | Medium to high marketing signal via “Snapshot AI Turbo” | DIY or survey-team-assisted, smart snapshots, precise estimates, accuracy/speed claims | Snapshot-based capture, likely CV-assisted item/volume inference, hybrid expert workflow | Hybrid model is strategically important, likely closer to commercially realistic than full automation |
| SmartMoving Pre-move Survey | B | Movers | On-site/pre-move survey app | Not clearly consumer-first | No | Low from surfaced evidence | App-store description suggests fast/simple pre-move estimates | Mobile app + CRM/estimate workflow | Likely operations software, not deep AI |
| Mover Survey | B | Movers | Comprehensive onsite estimating app with inventory and CRM | No clear consumer-first signal | No | Low from surfaced evidence | Inventory, pictures, offline capability, moving CRM | Traditional mobile field app + sync + CRM | Strong evidence many competitors are still workflow-first, not AI-first |
| MoveMan Survey | B | Movers | Item volume calculation and survey workflow | Possibly independent use | No | Low to medium | Calculates item volumes, capture images, record quantities | Manual item catalog + rules-based volume logic | Reinforces that rules-based volume estimation is still common |
| Move Survey Quote Pro | B | Movers | Digitized survey, estimation, and quotation process | No clear evidence | No | Low | Pre-move survey/quotation app for moving companies | Workflow SaaS, likely standard mobile/web stack | Probably not a true direct competitor to consumer-first model |
| AnyVan | C | Consumers | Instant-price marketplace / logistics matching | Consumer enters move details | No | Low visible AI signal from surfaced pages | Instant prices, marketplace-like matching, transport optimization story | Pricing engine, marketplace routing, network optimization | Major demand-capture competitor, but not portable survey product |
| Compare My Move | C | Consumers | Quote comparison and company matching | Form-based intake | No | Low | Fill form, get matched with up to 6 companies | Lead routing platform + partner verification + form workflow | Strong funnel competitor, weak direct survey/intelligence layer |
| Legit Removals self-survey | D | Consumers of single mover | Mover-owned self-survey | Yes | No | Low | Self-survey property if preferred not to speak to surveyor | White-label survey workflow or simple form/media flow | Important validation of user behavior |
| Best Rated Removals self-survey | D | Consumers of single mover | Mover-owned self-survey quote flow | Yes | No | Low | Fast, effortless self-survey for quote | Likely white-label survey flow | Again validates self-survey demand |
| Gmoves self-survey video | D | Consumers of single mover | User records own video survey | Yes | No | Low | Guide to use smartphone to record own survey video | Simple upload/video intake | Important because it shows behavior already exists without great productization |
| Pickfords video survey | D/Ajacent | Consumers / corporate relocation customers | Surveyor-led video survey | Limited self-capture | No | Low visible AI signal | Remote full assessment of home contents to determine volume | Live video + surveyor workflow | Traditional relocation incumbents are digitizing service layer |
| Gerson virtual video survey | D/Ajacent | Consumers / relocation customers | Expert-led video move consultation | Limited self-capture | No | Low | Free video survey, quote in 24-48h | Live video workflow + manual estimate process | Service-heavy model, not product-led |
| Squared Away moving use case | E | Consumers | Inventory tracking across locations | Not a moving-survey product | Potentially yes, but not mover-oriented | Medium AI/organization brand signal | Track what you own and where it is | Consumer inventory platform + organization layer | Interesting adjacent angle if consumers get used to structured belongings data |
| Everspruce / similar moving inventory apps | E | Consumers | Personal moving inventory management | Yes, manual/catalog style | Yes, but not mover-native | Low to medium | Catalog items, share categorized lists | Consumer inventory app + manual entry + media | Important adjacent expectation setter rather than direct threat |

---

## Main patterns emerging from iteration 1

## Pattern 1, the market is crowded with mover-first workflow tools
The strongest confirmed pattern is that many products in this space are really:
- survey digitization tools
- CRM/estimate workflow tools
- video-call + recording tools
- rules/itemizer tools

This matters because it means not every incumbent is actually an advanced AI competitor.
A lot of the category is still workflow software with some estimation logic.

### Implication
You do not need impossible frontier AI to be competitive with much of the field.
You need:
- better consumer entry point
- better structured data handoff
- credible automation where it matters most
- tighter packaging and trust

---

## Pattern 2, self-survey behavior is already validated
There is strong evidence that movers already ask consumers to:
- record their own survey videos
- upload photos
- complete self-survey forms

### Implication
The behavioral leap is not:
- “will users ever do self-surveys?”

The leap is:
- “can a consumer-first portable survey asset become more useful than today’s mover-owned intake flows?”

That is much more achievable.

---

## Pattern 3, the consumer-owned portable asset still appears underdeveloped
From this first pass, I do not see a strong dominant player positioned as:
- create one structured move survey
- own it as a consumer
- share it across movers/storage providers
- mover pays to unlock/use it

### Confidence
Moderate.
This is still an iteration-1 conclusion, not final proof.

---

## Pattern 4, rules engines are quietly more important than marketing pages admit
Move4U explicitly surfaces an itemizer and ISO-certified estimation tool.
Several mover apps talk about item volume calculation and quotation workflow rather than “AI magic”.

### Implication
A serious chunk of real market value likely comes from:
- item ontology
- room logic
- volume rules
- packaging rules
- quote workflow integration

not just from advanced CV.

This is strategically excellent for your MVP because rules are faster to ship than a giant custom AI system.

---

## Pattern 5, hybrid human + software models are common for a reason
VMT explicitly offers both:
- do-it-yourself
- survey team conducted

This is important.
It suggests commercially successful systems often avoid a pure-automation bet.

### Implication
Your future product should likely support:
- consumer self-capture
- mover review
- possibly guided expert review or audit mode

That is more credible than promising fully autonomous perfection from day one.

---

## Where your proposed product is different

Your direction currently appears differentiated on four axes:

### 1. Consumer owns the survey first
Not simply participating in a mover-owned flow.

### 2. Portable data pack
PDF + structured JSON + reusable share flow.

### 3. Richer move intelligence
Not just lead form data, but inventory/volume/packing/access notes.

### 4. Monetization from quote-readiness, not just lead resale
Mover pays to unlock useful operational data.

That is not the same as:
- AnyVan
- Compare My Move
- Yembo
- Move4U
- Voxme

It sits across their gaps.

---

## Confirmed facts vs likely inference

## Confirmed facts from surfaced evidence
- Yembo positions around AI-powered virtual property inspections and automated inventory/assessment workflows.
- Voxme offers cloud-recorded video surveys integrated into CRM workflows.
- Move4U offers virtual estimates, self-surveys, media upload, and an itemizer/volume-estimation workflow.
- VMT offers DIY and assisted virtual surveys and claims smart snapshot-based estimate accuracy.
- AnyVan is a consumer-facing logistics/removals marketplace with instant pricing and matching-like behavior.
- Compare My Move is a consumer quote comparison platform that matches users with providers via form intake.
- Multiple movers already offer self-survey/self-video flows directly to consumers.

## Likely inference
- Many survey competitors are more workflow-heavy than AI-heavy.
- Rules/itemizer logic is a major hidden source of estimation quality in the market.
- Consumer-owned portability remains relatively underserved.
- Hybrid review workflows are commercially important because fully autonomous accuracy is still hard.

## Speculation requiring more support
- The exact computer vision depth of VMT and Yembo beyond their marketing positioning.
- Whether any hidden global player already offers the full consumer-owned portable survey model at meaningful scale.
- Which exact app frameworks, CV models, or infrastructure competitors are using under the hood.

---

## Gaps to attack in iteration 2
These are the weak points that need another loop.

### Gap 1, deeper global competitor coverage
Need broader pass across:
- US relocation tech
- Australia / New Zealand movers
- India moving-tech vendors
- UAE / Gulf relocation tools
- European removal-tech vendors

### Gap 2, better technology inference
Need stronger evidence on likely stack choices:
- live video stack
- mobile app stack
- cloud recording architecture
- AI/CV sophistication versus manual/rules-first workflow

### Gap 3, consumer-side adjacent products
Need stronger mapping of:
- home inventory apps
- insurance inventory apps
- moving checklist/inventory products
- relocation concierge products

### Gap 4, pricing/revenue signals
Need clearer data on:
- per-lead models
- SaaS subscription models
- unlock economics
- white-label vs platform economics

---

## Iteration 1 conclusion
The first-pass competitive read is encouraging.

The field is real, but fragmented across:
- mover-first workflow software
- video survey tools
- manual/rules-heavy estimate tools
- lead marketplaces
- isolated mover-owned self-survey experiences

The strongest apparent whitespace remains:

**a consumer-owned, reusable moving survey passport with structured outputs that movers/storage firms pay to unlock because it saves quote time and improves quote quality.**

That is still only a first-pass conclusion.
The next pass must now go deeper into:
- technology acceleration
- accuracy architecture
- where superior accuracy actually comes from in practice
- which parts should be AI, rules, or human review
