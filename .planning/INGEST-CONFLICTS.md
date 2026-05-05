## Conflict Detection Report

Mode: merge
Docs processed: 21 classification files across 3 ingest runs (timestamps 19:20, 07:14, 15:30)
  Deduplicated to 7 unique sources — most recent file per source_path used (15:30 run)
  1 ADR LOCKED (.specify/memory/constitution.md)
  2 SPEC (spec.md, actor-flows.md)
  4 DOC (competitive-edge.md, psychiatry-sessions-india.md, requirements.md checklist, gaps.md)
Precedence order applied: ADR > SPEC > PRD > DOC
Cycle detection: no cycles detected in cross-reference graph
Generated: 2026-05-05 (supersedes 2026-05-04 merge run report)

Note on duplicate classification files: CLASSIFICATIONS_DIR contains 21 JSON files for 7
unique source paths (three ingest runs with different hashes). All versions of each
classification agree on type, confidence, locked status, and precedence. No conflict between
classification versions. Synthesis used the most recent classification for each source path
(15:30 run). All 7 classifications: confidence high. No UNKNOWN-confidence-low documents.

---

### BLOCKERS (0)

No blockers detected.

There is exactly one ADR in the ingest set (.specify/memory/constitution.md) and it is
LOCKED. No other ADR exists to produce a LOCKED-vs-LOCKED contradiction. The constitution
is unchanged from the prior ingest run (still v1.1.0, ratified 2026-05-01).

No SPEC content was found to contradict any LOCKED ADR decision. All Session 16 changes
were reviewed against the 17 LOCKED decisions:

FR-036 reversal (prescriptions excluded from export): Consistent with DEC-001 (data
portability). The approved session notes remain in the export, satisfying MHCA 2017 Form A
access rights. No ADR contradiction. Prescription PDFs remain accessible individually from
appointment history — patient access is preserved, just not bundled.

FR-017a (patient progress dashboard): Consistent with DEC-003 (no automated clinical
diagnosis — all data sourced from psychiatrist-approved records; no clinical inference),
DEC-012 (personalisation, making progress visible), and DEC-009 (no hardcoded logic —
data is dynamically sourced from existing records).

FR-048 (medication initiation safety net): Consistent with DEC-003 (notification is
a booking prompt, not a clinical recommendation), DEC-014 (personalised, event-driven
notification), DEC-002 (audit-logged), and DEC-009 (timing configurable in
PlatformConfiguration, not hardcoded).

FR-021b update (WhatsApp button template + adherence events): Consistent with DEC-014
(adaptive notification), DEC-009 (no hardcoded logic). Adherence events are confirmation
data only — non-response is unconfirmed, not non-adherent. No clinical interpretation
performed by the platform (DEC-003 satisfied).

FR-007 update (session-type fee on match cards): Consistent with DEC-013 (matching engine
must factor fees into the match display), DEC-012 (fee transparency aligns with
personalisation). Already captured in CONSTRAINT-028.

FR-015b update (treatment consent checkbox): Consistent with DEC-010 (MHCA 2017 compliance —
per-session treatment consent documentation is a Form B-1 requirement), DEC-002 (audit log).

FR-033 update (export jobs in admin dashboard): Consistent with DEC-001 (data portability
oversight), DEC-006 (operational visibility), DEC-003 (no clinical data visible in admin
dashboard).

No UNKNOWN-confidence-low documents in the ingest set. All 21 classification files report
confidence: "high". No duplicate source path disagreements on type or confidence.

---

### WARNINGS (0)

No warnings.

The prior WARNING from the 2026-05-04 synthesis run (actor-flows.md Idea 11 option 3 —
in-platform psychiatrist inbox messaging) has been downgraded to INFO and resolved.

competitive-edge.md now explicitly marks Idea 11 ("I Need Help Now" Button) with status
DEFERRED TO v2. This document is DOC-classified (lowest precedence). The SPEC-classified
actor-flows.md frames Idea 11 as a UX suggestion, not a formal requirement — no FR exists.
The competitive-edge.md DEFERRED status means the planner has no ambiguous inclusion
signal to act on. There is nothing in the current ingest set that could be interpreted as
a requirement to build Idea 11 in v1. The prior WARNING condition — "if the planner adopts
Idea 11, option 3 requires a spec amendment" — is moot because the feature is deferred.

The downgrade from WARNING to INFO is recorded below in the INFO bucket.

---

### INFO (7)

[INFO] Auto-resolved: SPEC self-update — FR-036 REVERSAL, prescription PDFs excluded
from export package (Session 16 supersedes Session 14)
  Previous state (Session 14, GAP-041 resolution): specs/001-patient-psychiatrist-match/
  spec.md (FR-036) included all issued prescription PDFs in the patient data export package,
  unifying DPDPA 2023 data portability rights and MHCA 2017 Section 25 Form A clinical
  records access rights. This was captured as the current state in the 2026-05-04 synthesis
  run. intel/requirements.md REQ-data-export and intel/constraints.md CONSTRAINT-019 and
  CONSTRAINT-026 all reflected prescription inclusion.
  Current state (Session 16 Q1): specs/001-patient-psychiatrist-match/spec.md (FR-036)
  now excludes prescription PDFs from the export package. Rationale in spec: prescriptions
  are formal clinical documents, not patient-authored data; patients access them individually
  as downloads from their appointment history page. The approved session notes
  (CareRecommendation records) are the formal clinical record included in the export.
  Resolution: Current SPEC version supersedes prior SPEC version for FR-036. No LOCKED ADR
  is contradicted — DEC-001 requires data portability; the export still contains all approved
  clinical records (session notes); prescriptions remain individually accessible from
  appointment history; MHCA 2017 Form A access is satisfied by the approved session notes
  plus individual prescription access. REQ-data-export, CONSTRAINT-019, and CONSTRAINT-026
  updated in intel files to reflect exclusion.
  Downstream note: REQUIREMENTS.md (downstream output) still contains the prior inclusion
  language. The roadmapper must regenerate REQUIREMENTS.md from updated intel.
  Source for prior state: intel/requirements.md (REQ-data-export, 2026-05-04 run)
  Source for prior state: intel/constraints.md (CONSTRAINT-026, 2026-05-04 run)
  Source for current state: specs/001-patient-psychiatrist-match/spec.md (FR-036,
  Session 16 Q1)

[INFO] Auto-resolved: SPEC self-update — FR-015b treatment consent checkbox replaces
"consent status confirmation" field (Session 16 supersedes prior)
  Previous state: intel/requirements.md REQ-session-transcript-and-care-recommendation
  listed "consent status confirmation" as a required field in FR-015b. This was the language
  used through Session 15.
  Current state: specs/001-patient-psychiatrist-match/spec.md (FR-015b, Session 16 Q3)
  replaces this with an explicit treatment consent checkbox with prescribed wording: "The
  patient has given verbal consent to the treatment discussed in this session." This satisfies
  MHCA 2017's requirement to document consent to treatment at each clinical encounter.
  Distinct from: recording consent (captured once at registration, FR-005) and identity
  verification (separate checkbox, FR-015b).
  Resolution: Current SPEC version supersedes prior SPEC version for FR-015b consent field.
  No LOCKED ADR contradicted — this strengthens alignment with DEC-010 (MHCA 2017 per-session
  consent documentation). REQ-session-transcript-and-care-recommendation and CONSTRAINT-029
  updated in intel files.
  Source for prior state: intel/requirements.md (REQ-session-transcript-and-care-recommendation,
  2026-05-04 run)
  Source for current state: specs/001-patient-psychiatrist-match/spec.md (FR-015b,
  Session 16 Q3)

[INFO] Auto-resolved: SPEC self-update — FR-021b now includes WhatsApp button template
and adherence confirmation events (Session 16 supersedes prior)
  Previous state: intel/requirements.md REQ-medication-reminders described FR-021b as
  a daily Tier 3 WhatsApp reminder with no confirmation mechanism. There was no adherence
  tracking in the prior spec version.
  Current state: specs/001-patient-psychiatrist-match/spec.md (FR-021b, Session 16 Q2)
  adds a WhatsApp Business API button template with a "Mark as taken" quick-reply button.
  Patient tap records an adherence confirmation event (medication ID, patient ID, timestamp).
  Non-response = unconfirmed (not counted as non-adherent). Adherence confirmation events
  are the data source for the FR-017a medication adherence streak.
  Resolution: Current SPEC version supersedes prior for FR-021b. No LOCKED ADR contradicted.
  REQ-medication-reminders updated in intel. CONSTRAINT-034 (new) captures the WhatsApp
  button template approval requirement.
  Source for prior state: intel/requirements.md (REQ-medication-reminders, 2026-05-04 run)
  Source for current state: specs/001-patient-psychiatrist-match/spec.md (FR-021b,
  Session 16 Q2)

[INFO] SPEC additive — FR-017a patient progress dashboard (new requirement, no prior conflict)
  No prior version of this requirement existed. FR-017a is a net-new requirement added in
  Session 16 from competitive-edge.md Idea 2 (status: INCLUDED IN SPEC).
  Data sources for FR-017a all already exist in the spec: symptom trajectory from FR-015b
  approved session notes, medication adherence streak from FR-021b adherence confirmation
  events (new in Session 16), sessions completed counter from Appointment records,
  recommended next session from FR-046 CareRecommendation.next_follow_up_date.
  No LOCKED ADR contradicted. DEC-003 satisfied — no automated clinical inference; all data
  is psychiatrist-approved. REQ-patient-progress-dashboard added to intel/requirements.md.
  CONSTRAINT-033 (new) captures the sourcing and non-inference constraints.
  Source: specs/001-patient-psychiatrist-match/spec.md (FR-017a, Session 16)
  Source: specs/001-patient-psychiatrist-match/competitive-edge.md (Idea 2, INCLUDED IN SPEC)

[INFO] SPEC additive — FR-048 medication initiation safety net (new requirement, no prior conflict)
  No prior version of this requirement existed. FR-048 is a net-new requirement added in
  Session 16 from competitive-edge.md Idea 3 (status: INCLUDED IN SPEC).
  The feature builds on existing Prescription entity (FR-043) and WhatsApp notification
  infrastructure (FR-021). Prescription comparison logic is new. Psychiatrist dashboard
  notification surface is new.
  No LOCKED ADR contradicted. DEC-003 satisfied — patient nudge is a booking prompt, not
  a clinical recommendation; no automated treatment decision made. DEC-002 satisfied —
  both trigger events are audit-logged. DEC-009 satisfied — timing defaults stored in
  PlatformConfiguration, not hardcoded. REQ-medication-initiation-safety-net added to
  intel/requirements.md. CONSTRAINT-032 (new) captures the prescription comparison and
  trigger rules.
  Source: specs/001-patient-psychiatrist-match/spec.md (FR-048, Session 16)
  Source: specs/001-patient-psychiatrist-match/competitive-edge.md (Idea 3, INCLUDED IN SPEC)

[INFO] Auto-resolved: SPEC self-update — FR-007 match card fee logic updated
(session-type-aware fee replaces generic fee display)
  Previous state: intel/requirements.md REQ-psychiatrist-matching described the fee on
  match cards as "the fee for the applicable session type" with a note that this was captured
  as an acceptance criterion, but the explicit per-card logic (Follow-Up fee for "Previously
  seen" cards; Initial Assessment vs Follow-Up fee for "Find new match" cards based on prior
  session history) was not fully specified.
  Current state: specs/001-patient-psychiatrist-match/spec.md (FR-007, Session 16 update)
  explicitly specifies: "Previously seen" cards show Follow-Up fee for any returning patient;
  "Find new match" cards show Initial Assessment fee for patients with no prior completed
  session with that specific psychiatrist, and Follow-Up fee for patients with at least one
  prior completed session with that psychiatrist. Fee shown must equal exact fee at checkout.
  Resolution: Current SPEC version supersedes prior for FR-007. No LOCKED ADR contradicted.
  REQ-psychiatrist-matching updated in intel to reflect explicit per-card fee logic.
  Source for prior state: intel/requirements.md (REQ-psychiatrist-matching, 2026-05-04 run)
  Source for current state: specs/001-patient-psychiatrist-match/spec.md (FR-007,
  Session 16)
  Source: specs/001-patient-psychiatrist-match/competitive-edge.md (Idea 9, INCLUDED IN SPEC)

[INFO] Idea 11 in-platform psychiatrist inbox messaging — prior WARNING downgraded to INFO;
no longer actionable
  Prior WARNING from 2026-05-04 synthesis run: actor-flows.md Idea 11 option 3 referenced
  an in-platform psychiatrist inbox messaging element. The WARNING noted this had no
  corresponding spec FR, would introduce new service boundaries, PHI-carrying data models,
  new RBAC surfaces, and clinical liability concerns. The WARNING directed the planner to
  scope only options 1 and 2 of Idea 11 for v1 consideration and to require a spec amendment
  before any work on option 3.
  Current state: specs/001-patient-psychiatrist-match/competitive-edge.md now explicitly
  marks Idea 11 ("I Need Help Now" Button — all options including option 3) with status
  DEFERRED TO v2. competitive-edge.md is DOC-classified (lowest precedence). actor-flows.md
  is SPEC-classified but frames Idea 11 as a UX suggestion, not a formal requirement — no
  FR exists in spec.md for any part of Idea 11.
  Resolution: The prior WARNING condition is moot. There is no v1 requirement for the "I
  Need Help Now" button in any form. The crisis helpline numbers are already captured in
  CONSTRAINT-030 (FR-042) and displayed permanently on login page, booking page, and patient
  dashboard. The Urgent Review routing is already specced in FR-042. In-platform messaging
  remains unspecced and deferred. No action required by the planner.
  Source for prior WARNING: .planning/INGEST-CONFLICTS.md (2026-05-04 run, WARNINGS section)
  Source for current state: specs/001-patient-psychiatrist-match/competitive-edge.md
  (Idea 11, DEFERRED TO v2 status label)

---

## Downstream Notes for gsd-roadmapper

The following downstream output files contain stale information that must be updated:

1. REQUIREMENTS.md — REQ-data-export still includes prescription PDFs (stale — Session 16
   reversal excludes them). REQ-session-transcript-and-care-recommendation uses old "consent
   status confirmation" wording instead of explicit treatment consent checkbox. REQ-medication-
   reminders does not include the WhatsApp button template or adherence confirmation events.
   REQ-patient-progress-dashboard (FR-017a) and REQ-medication-initiation-safety-net (FR-048)
   are new and must be added. REQ-platform-configuration-store is missing 4 new params.
   REQ-platform-admin-portal is missing the export jobs view.

2. PROJECT.md — should note that competitive-edge.md Idea 11 is now DEFERRED TO v2 and
   no "I Need Help Now" button is in scope for v1.

3. ROADMAP.md — Phase 5 must add REQ-patient-progress-dashboard and REQ-medication-
   initiation-safety-net. The prior open-gap annotations (GAP-026, GAP-027, GAP-033,
   GAP-034) should already be removed from the 2026-05-04 run; confirm removal.

4. STATE.md — same gap annotation updates as ROADMAP.md.
