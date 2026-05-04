## Conflict Detection Report

Mode: new
Docs processed: 5 (1 ADR/LOCKED, 1 SPEC, 3 DOC)
Precedence order applied: ADR > SPEC > PRD > DOC
Cycle detection: no cycles detected in cross-reference graph
Generated: 2026-05-03

---

### BLOCKERS (0)

No blockers detected.

There is exactly one ADR in the ingest set (.specify/memory/constitution.md) and it is
LOCKED. No other ADR exists to produce a LOCKED-vs-LOCKED contradiction. No SPEC content
was found to contradict the LOCKED ADR decisions. All SPEC FRs are consistent with the
constitution's non-negotiable principles (see INFO section for details of the one alignment
check requiring planning-phase attention). No UNKNOWN-confidence-low documents were found —
all five classification files report confidence: "high".

---

### WARNINGS (3)

[WARNING] Open spec gap GAP-033 — Competing pricing models not yet resolved in spec
  Found: specs/001-patient-psychiatrist-match/spec.md (FR-023a) defines one fixed session
  fee per psychiatrist with no variation by session type.
  Found: specs/001-patient-psychiatrist-match/research/psychiatry-sessions-india.md
  (Section 1.5, 2.3) documents that all Indian platforms charge 20–50% more for Initial
  Assessment sessions than for Follow-Up sessions, with RocketHealth enforcing this as
  distinct product SKUs.
  Impact: The spec's single-fee model and the research's session-type-tiered pricing norm
  are not yet reconciled. If the planning phase adopts session-type pricing, FR-023a,
  FR-007, and FR-011a require amendment. If single-fee is confirmed as intentional, this
  gap should be explicitly closed with a rationale.
  Status: GAP-033 is OPEN in the gaps tracker with no planned session assigned.
  Sources: specs/001-patient-psychiatrist-match/spec.md (FR-023a) vs.
           specs/001-patient-psychiatrist-match/research/psychiatry-sessions-india.md
           (Sections 1.5, 2.3)
  → Assign a session to resolve GAP-033 before routing to planning, or explicitly close it
    with a decision to retain single-fee and document the rationale.

[WARNING] Open spec gap GAP-034 — MHCA 2017 Form B-1 compliance not yet modelled
  Found: specs/001-patient-psychiatrist-match/spec.md (FR-015, FR-015b) defines
  CareRecommendation as the post-session clinical note entity capturing medication details,
  activity prescriptions, follow-up dates, and free-text notes.
  Found: specs/001-patient-psychiatrist-match/research/psychiatry-sessions-india.md
  (Section 5) documents that each psychiatric session must produce a Form B-1 outpatient
  record under the Mental Healthcare (State) Rules 2018 with mandatory content that goes
  beyond the current CareRecommendation: type of treatment/therapy, duration and goals,
  techniques used, clinical observations, progress notes, capacity assessment, risk/benefit
  discussions, and consent status.
  Impact: The current spec does not fully satisfy the MHCA 2017 outpatient documentation
  mandate. The constitution (DEC-010) requires all features involving clinical data to be
  reviewed for compliance with MHCA 2017 before shipping. This gap may require a new
  SessionRecord entity or extension of CareRecommendation to capture all mandatory Form B-1
  fields. Shipping without resolving this creates legal compliance risk.
  Status: GAP-034 is OPEN in the gaps tracker with no planned session assigned.
  Sources: specs/001-patient-psychiatrist-match/spec.md (FR-015, FR-015b) vs.
           specs/001-patient-psychiatrist-match/research/psychiatry-sessions-india.md
           (Section 5) vs. .specify/memory/constitution.md (DEC-010 — MHCA 2017 compliance)
  → Resolve GAP-034 before the plan phase. This is a legal compliance gap under MHCA 2017
    that the constitution requires be addressed before shipping.

[WARNING] Open spec gaps GAP-025, GAP-026, GAP-027 — Low-priority gaps not yet resolved
  Found: The following LOW-priority gaps remain OPEN with no session assigned in the gaps
  tracker, and they affect correctness or legal compliance of delivered FRs:

  GAP-025: WhatsApp number verification at entry. When a patient enters a separate WhatsApp
  number (different from their mobile number), it is stored with no active verification step.
  An invalid or mistyped number results in silent notification failure with no recovery path
  other than the patient manually editing their preferences. Affected: FR-001,
  NotificationPreference entity.

  GAP-026: Consent denial at registration. FR-005 requires explicit consent before storing
  sensitive health data. The spec defines no branch for what happens when a patient refuses
  consent — can they proceed without consenting? Or is consent mandatory to use the platform
  at all? A missing branch here creates an undefined state in the registration flow. Affected:
  FR-005, Patient entity (consent status field).

  GAP-027: GST invoice sequential numbering. GST law in India requires invoices to carry
  sequential invoice numbers for B2C supplies. FR-041 lists required invoice fields but omits
  a sequential invoice number series. This is a legal requirement. Affected: FR-041,
  Payment entity (invoice number field).

  Impact: While LOW priority, GAP-025 and GAP-027 have legal/compliance dimensions.
  GAP-026 has a UX architecture dimension. None block routing to planning, but the planner
  should note these are unresolved in the spec they are planning against.
  Sources: specs/001-patient-psychiatrist-match/checklists/gaps.md (GAP-025, GAP-026,
           GAP-027)
  → Close these gaps during the plan phase or prior to implementation; document resolutions
    in the spec before any corresponding FR is implemented.

---

### INFO (4)

[INFO] Auto-resolved: SPEC consistent with LOCKED ADR on automated clinical decisions
  Note: specs/001-patient-psychiatrist-match/spec.md (FR-015, FR-015a) specifies that
  the Zoom transcript is used to generate a draft recommendation only, and that the
  psychiatrist must explicitly review and approve before anything is written to the patient
  record. This is fully consistent with .specify/memory/constitution.md (DEC-003, DEC-011)
  prohibiting automated clinical diagnosis or treatment recommendations. No conflict.

[INFO] Auto-resolved: SPEC consistent with LOCKED ADR on data export and DPDPA 2023
  Note: specs/001-patient-psychiatrist-match/spec.md (FR-036) defines a patient data export
  mechanism satisfying the constitution's data portability requirement (DEC-001: "Users MUST
  be able to export and delete their data at any time") and DPDPA 2023. The export explicitly
  includes patient-authored SessionFeedback records under DPDPA 2023 (resolved via GAP-003).
  No conflict.

[INFO] Auto-resolved: SPEC consistent with LOCKED ADR on no hardcoded logic
  Note: All business rules, thresholds, and notification parameters in
  specs/001-patient-psychiatrist-match/spec.md are defined as PlatformConfiguration values
  editable by Platform Admins without a code change (FR-035). This is fully consistent with
  .specify/memory/constitution.md (DEC-009, DEC-012) prohibiting hardcoded business logic.
  No conflict.

[INFO] DOC research gap noted — treatment phase tracking
  Note: specs/001-patient-psychiatrist-match/research/psychiatry-sessions-india.md
  (Section 4.1) documents the IPS three-phase treatment model (Acute/Continuation/
  Maintenance) with recommended session frequency guidance per phase. The spec
  (specs/001-patient-psychiatrist-match/spec.md) does not model treatment phases. This
  is captured as GAP-032 in the gaps tracker and is noted as a platform differentiation
  opportunity. As a DOC-source observation against a SPEC-source scope gap, this is not
  a precedence conflict — it is an additive research finding. It does not contradict any
  existing SPEC requirement; it identifies a clinical capability not yet included in scope.
  Downstream planners should note this when designing the CareRecommendation and
  PatientProfile entities for extensibility.
  Sources: specs/001-patient-psychiatrist-match/research/psychiatry-sessions-india.md
           (Section 4.1) vs. specs/001-patient-psychiatrist-match/checklists/gaps.md
           (GAP-032)
