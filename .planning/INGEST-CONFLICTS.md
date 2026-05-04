## Conflict Detection Report

Mode: merge
Docs processed: 7 (1 ADR LOCKED, 2 SPEC, 4 DOC)
Precedence order applied: ADR > SPEC > PRD > DOC
Cycle detection: no cycles detected in cross-reference graph
Generated: 2026-05-04 (supersedes 2026-05-03 new-run report)

---

### BLOCKERS (0)

No blockers detected.

There is exactly one ADR in the ingest set (.specify/memory/constitution.md) and it is
LOCKED. No other ADR exists to produce a LOCKED-vs-LOCKED contradiction. The constitution
is unchanged from the prior ingest run (still v1.1.0, ratified 2026-05-01).

No SPEC content was found to contradict the LOCKED ADR decisions. All 52 spec gaps are
now resolved and none of the resolutions contradict any constitution principle. In
particular:

GAP-033 resolution (three-tier pricing): Consistent with DEC-009 (no hardcoded logic —
fees stored in PlatformConfiguration and editable), DEC-013 (matching engine must factor
fees into the match display), and DEC-012 (fee transparency aligns with personalisation).

GAP-034 resolution (Form B-1 fields): Consistent with DEC-010 (MHCA 2017 compliance),
DEC-003 (clinical safety), and DEC-002 (immutable audit logs retained 7 years).

GAP-026 resolution (hard consent gate): Consistent with DEC-001 (explicit informed consent
before processing sensitive data), DEC-010 (DPDPA 2023 compliance).

No UNKNOWN-confidence-low documents in the ingest set. All 7 classification files report
confidence: "high".

---

### WARNINGS (1)

[WARNING] actor-flows.md introduces an in-platform psychiatrist inbox messaging element
not present in the spec
  Found: specs/001-patient-psychiatrist-match/actor-flows.md (UX Improvement Opportunities,
  Idea 11 — "I Need Help Now" Button, option 3): "Send a message to Dr. [Name] — a
  pre-composed message sent to psychiatrist's in-platform inbox."
  Found: No corresponding FR exists anywhere in specs/001-patient-psychiatrist-match/spec.md.
  No in-platform messaging inbox entity or service is defined in the spec.
  Found: competitive-edge.md (Idea 11, v1 section) also describes this element as the third
  option in the "I Need Help Now" modal.
  Impact: If planned or built, this introduces: a new service boundary (messaging service),
  a new PHI-carrying data model (MessageRecord or equivalent), a new RBAC surface (patients
  sending unsolicited messages to psychiatrists without an active booking), and psychiatrist
  clinical liability (receiving messages outside a booked session without a defined response
  obligation). Under DEC-003, this feature would require a clinical safety review before
  shipping. Under DEC-001 and DEC-011, the message content would be PHI requiring
  encryption and RBAC scoping. Under DEC-007, it requires a new versioned API and service
  boundary.
  Source for found item: specs/001-patient-psychiatrist-match/actor-flows.md (UX section);
  specs/001-patient-psychiatrist-match/competitive-edge.md (Idea 11)
  Classification context: competitive-edge.md is DOC (lowest precedence); actor-flows.md
  is SPEC but frames this as a UX suggestion, not a requirement. Neither doc produces a
  formal FR. This item is intentionally not extracted into requirements intel and does not
  block synthesis.
  Action required: If the planner adopts Idea 11, scope it to options 1 and 2 only
  (crisis helplines — already in spec via CONSTRAINT-030 and FR-042; Urgent Review
  routing — already in spec via FR-042). Option 3 (psychiatrist inbox messaging) requires
  a dedicated spec amendment with a clinical safety review component before any planning
  work. Do not plan or implement option 3 without an approved spec.

---

### INFO (5)

[INFO] Auto-resolved: SPEC self-update on pricing model (GAP-033)
  Previous state: Prior synthesis (2026-05-03) extracted REQ-availability-management
  with acceptance criterion: "A psychiatrist profile has exactly one fee field; multiple
  fees per psychiatrist are rejected." This was sourced from the spec's Session 2026-05-02
  clarification stating "exactly one fixed session fee per psychiatrist."
  Previous state: REQUIREMENTS.md (downstream output) also contained the single-fee model.
  Current state: specs/001-patient-psychiatrist-match/spec.md (FR-023a, updated in
  Session 13 Q2 / GAP-033 resolution) now mandates three separate fees per psychiatrist —
  one each for Initial Assessment, Follow-Up, and Urgent Review — set by the Agency Admin.
  The per-session-type fee is displayed on the match list and locked into the Payment
  record at booking confirmation. Bulk update is supported.
  Resolution: Current SPEC version supersedes prior SPEC version for FR-023a. No LOCKED
  ADR is contradicted. REQ-availability-management has been updated in intel/requirements.md
  to reflect three fees per psychiatrist. CONSTRAINT-028 (new) captures the three-fee
  schema requirement. The prior single-fee acceptance criterion has been removed.
  Downstream note: REQUIREMENTS.md (a downstream output file, not an ingest source) still
  contains the old single-fee language. The roadmapper must regenerate REQUIREMENTS.md
  from the updated intel to pick up this change.
  Source for prior state: REQUIREMENTS.md (REQ-availability-management, 2026-05-03)
  Source for current state: specs/001-patient-psychiatrist-match/spec.md (FR-023a,
  GAP-033 resolution, Session 13)

[INFO] Auto-resolved: SPEC self-update on data export scope — prescription PDFs now included
  Previous state: intel/constraints.md CONSTRAINT-026 stated "Prescription PDFs are
  clinical records, not patient-authored data. They are excluded from the patient data
  export package (FR-036)."
  Previous state: intel/requirements.md REQ-data-export listed the export as including
  intake responses, care recommendations, appointment history, notification preferences,
  and patient's own SessionFeedback records. Prescription PDFs were not in this list.
  Current state: specs/001-patient-psychiatrist-match/spec.md (FR-036, updated per
  GAP-041 resolution in Session 14 Q6) now includes all issued prescription PDFs in the
  export package. The data export was unified to satisfy both DPDPA 2023 data portability
  rights and MHCA 2017 Section 25 Form A clinical records access rights in a single 72-hour
  flow. Raw Zoom transcripts remain excluded (intermediate artifact, not formal clinical
  record).
  Resolution: Current SPEC version supersedes prior SPEC version for FR-036. No LOCKED
  ADR is contradicted — DEC-001 requires data portability, and including prescription PDFs
  strengthens compliance with DEC-010 (MHCA 2017 Form A access right). CONSTRAINT-026 has
  been updated in intel/constraints.md. REQ-data-export has been updated in
  intel/requirements.md to include prescription PDFs.
  Source for prior state: intel/constraints.md (CONSTRAINT-026, 2026-05-03)
  Source for current state: specs/001-patient-psychiatrist-match/spec.md (FR-036,
  GAP-041 resolution, Session 14)

[INFO] Auto-resolved: SPEC self-update on consent denial (GAP-026)
  Previous state: intel/requirements.md REQ-explicit-consent contained an open-gap note:
  "GAP-026 open — no branch defined for consent denial flow. Resolve before Phase 2
  implementation." ROADMAP.md Phase 2 carried the same open-gap annotation. PROJECT.md
  Open Gaps table listed GAP-026 as LOW priority open.
  Current state: specs/001-patient-psychiatrist-match/spec.md (FR-005, updated in
  Session 13 Q6 / GAP-026 resolution) now specifies: consent is a hard gate — if the
  patient declines, their partial account (mobile number and OTP record only) is deleted
  immediately. No partial access or browse-only mode. No consent, no platform access.
  Resolution: GAP-026 resolved in the SPEC. No LOCKED ADR is contradicted — this
  strengthens alignment with DEC-001 (explicit informed consent) and DEC-010 (DPDPA 2023).
  REQ-explicit-consent and CONSTRAINT-031 (new) updated in intel. The open-gap annotations
  in PROJECT.md and ROADMAP.md reflect the old state and should be removed by the roadmapper
  on next PROJECT.md and ROADMAP.md regeneration.
  Source: specs/001-patient-psychiatrist-match/spec.md (FR-005, GAP-026 resolution)

[INFO] Auto-resolved: SPEC self-update on GST invoice sequential numbering (GAP-027)
  Previous state: intel/requirements.md REQ-gst-invoice had an open-gap note: "GAP-027
  open — sequential invoice numbering required under GST law for B2C supplies." ROADMAP.md
  Open Gap Annotations table listed GAP-027 for Phase 6. PROJECT.md Open Gaps table listed
  GAP-027 as LOW priority open.
  Current state: specs/001-patient-psychiatrist-match/spec.md (FR-041, updated in
  Session 13 Q7 / GAP-027 resolution) now specifies: invoice number format is
  [PREFIX]/[FY]/[SEQUENCE] (e.g., MHP/2026-27/00001); auto-incrementing, gapless, resets
  April 1 each financial year; prefix configurable in PlatformConfiguration; invoice_number
  field on Payment entity is immutable once issued.
  Resolution: GAP-027 resolved in the SPEC. No LOCKED ADR is contradicted. REQ-gst-invoice
  updated in intel. The open-gap annotations in PROJECT.md, ROADMAP.md, and STATE.md
  reflect the old state and should be removed by the roadmapper on next regeneration.
  Source: specs/001-patient-psychiatrist-match/spec.md (FR-041, GAP-027 resolution)

[INFO] Auto-resolved: SPEC self-update on MHCA 2017 Form B-1 compliance (GAP-034)
  Previous state: intel/constraints.md Open Regulatory Gaps section stated GAP-034 was
  open and "may require a new SessionRecord entity or extension of CareRecommendation."
  PROJECT.md Open Gaps table listed GAP-034 as IMPORTANT (legal) with the same caveat.
  ROADMAP.md Phase 4 and Phase 9 notes carried the unresolved GAP-034 annotation.
  Current state: specs/001-patient-psychiatrist-match/spec.md (FR-015b, updated across
  Sessions 13–15 / GAP-034, GAP-039, GAP-044, GAP-046, GAP-047, GAP-051 resolutions) now
  extends CareRecommendation with all Form B-1 mandatory fields. No new entity is required.
  The extensions cover: presenting complaints, clinical observations, treatment type, consent
  status, identity verification checkbox (audit-logged), investigations ordered (free-text),
  Mental Status Examination (MSE free-text), Subjective SOAP section for Follow-Up and Urgent
  Review, advance directive and nominated representative (read-only from PatientProfile), and
  a Form B-1 completion declaration checkbox required before any session record can be approved.
  Resolution: GAP-034 resolved in the SPEC. No LOCKED ADR is contradicted — this strengthens
  alignment with DEC-010 (MHCA 2017 compliance) and DEC-002 (immutable records retained
  7 years). CONSTRAINT-029 (new) captures the extended schema requirement. The open-gap
  annotations in PROJECT.md, ROADMAP.md, and STATE.md should be removed by the roadmapper
  on next regeneration.
  Note: The ROADMAP.md Phase 9 success criterion "Every psychiatric session produces
  documentation satisfying MHCA 2017 Form B-1 mandatory fields" remains valid and is now
  implementable without a new entity.
  Source: specs/001-patient-psychiatrist-match/spec.md (FR-015b, GAP-034 and related
  resolutions, Sessions 13–15)
