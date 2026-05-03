# Spec Gaps Tracker: 001-patient-psychiatrist-match

**Purpose**: Track all identified gaps, assumptions, and unresolved decisions in the spec.
Clarification sessions MUST read this file first and resolve OPEN gaps in priority order
before asking new questions.

**Last Updated**: 2026-05-03
**Total Gaps**: 35
**Resolved**: 14
**Open Critical**: 6
**Open Important**: 12
**Open Low**: 3

---

## How to Use

When running `/speckit-clarify`, read this file first. Pick the topmost OPEN gaps by
severity and resolve them — do not re-scan the spec for new gaps until all OPEN gaps
here are RESOLVED. Mark each gap RESOLVED once a clarification answer has been integrated
into the spec and the corresponding FR/entity updated.

---

## CRITICAL Gaps (resolve first)

### GAP-001: Follow-up / Repeat Bookings
**Status**: RESOLVED
**Session**: 6 Q1
**Answer**: Urban Company booking model. "Previously seen" section for direct rebook +
"Find new match" always available. No active relationship concept. No simultaneous
booking constraint. Access is booking-driven with 3-month configurable expiry window.
Transcripts per-pair only; care recommendations shared across all psychiatrists with
active access window. All thresholds in PlatformConfiguration (admin-editable).
**FRs Updated**: FR-007, FR-013, FR-014, FR-018, FR-018a, FR-034, FR-035 added
**Entities Updated**: PatientProfile, PlatformConfiguration added

---

### GAP-002: Zoom Account Ownership
**Status**: OPEN
**Session**: 6 (Q2)
**Impact**: Fundamental Zoom API architecture. Three very different integration approaches
depending on answer: (a) one platform Zoom account for all meetings, (b) per-psychiatrist
OAuth, (c) platform Zoom Business with sub-accounts per psychiatrist.
**Affected FRs**: FR-002, FR-011a, FR-011e, FR-015, FR-015c
**Affected Entities**: Appointment (Zoom meeting ID), SessionTranscript

---

### GAP-003: Data Export / Portability
**Status**: OPEN
**Session**: 6 (Q3)
**Impact**: Direct constitution violation ("Users MUST be able to export their data at any
time") and DPDPA 2023 requirement. Zero FRs currently cover this. Needs a defined export
format, trigger, delivery method, and scope (what data is included).
**Affected FRs**: None yet — new FR required
**Affected Entities**: Patient, PatientProfile, CareRecommendation, SessionTranscript

---

### GAP-004: TOTP Recovery Mechanism
**Status**: OPEN
**Session**: 6 (Q4)
**Impact**: Without a recovery path, any psychiatrist/agency admin/platform admin who
loses their authenticator device is permanently locked out. Needs a defined admin-mediated
reset flow — who can reset TOTP, how is identity verified, what audit trail is created.
**Affected FRs**: FR-001b — needs sub-requirement
**Affected Entities**: PsychiatristProfile, AgencyAdmin, PlatformAdmin

---

### GAP-005: Session Fee / Pricing Model
**Status**: OPEN
**Session**: 6 (Q5)
**Impact**: Data model gap. FR-007 shows "session fee" on match list but neither
PsychiatristProfile nor Appointment has a fee field. Need to know: who sets the fee
(agency/psychiatrist/platform), whether it varies per session type, and whether the
fee at booking time is locked in.
**Affected FRs**: FR-007, FR-011a
**Affected Entities**: PsychiatristProfile (fee field missing), Appointment (fee-at-booking missing), Payment

---

### GAP-006: Failed Password Attempt Lockout (Non-Patient Roles)
**Status**: OPEN
**Session**: 7 (Q1)
**Impact**: Security gap. FR-001a defines OTP lockout for patients (3 wrong → 15min lock).
Nothing equivalent for psychiatrists/admins using email+password. High-privilege accounts
with PHI access have no brute-force protection defined.
**Affected FRs**: FR-001b — needs lockout sub-requirement
**Affected Entities**: None (auth behaviour)

---

## IMPORTANT Gaps (resolve after all CRITICAL are done)

### GAP-007: Appointment Reminder Timing When Booking < 48h from Session
**Status**: OPEN
**Session**: 7 (Q2)
**Impact**: Notification engine design. US4 scenario 4 says reminders fire at 48h and 2h
before session. If booking is placed 6h before session, the 48h reminder is impossible.
What fires? Only 2h? Neither if < 2h? Undefined.
**Affected FRs**: FR-019 (Tier 2 booking reminders — timing not specified)
**Affected Entities**: NotificationEvent

---

### GAP-008: Daily Notification Frequency Cap
**Status**: OPEN
**Session**: 7 (Q3)
**Impact**: Notification engine and constitution compliance. Constitution: notifications
"MUST be bounded by per-user preference settings." No default cap defined. A patient
with 3 medications + activity nudge + follow-up prompt could receive 5+ WhatsApp messages
per day. What is the platform default maximum per day?
**Affected FRs**: FR-020, FR-021a
**Affected Entities**: NotificationPreference (cap field missing)

---

### GAP-009: Password Strength Requirements (Non-Patient Roles)
**Status**: OPEN
**Session**: 7 (Q4)
**Impact**: Security specification gap. FR-001b defines email+password for psychiatrists
and admins but sets no minimum length, complexity, or strength rules for accounts that
access PHI.
**Affected FRs**: FR-001b — needs password policy sub-requirement
**Affected Entities**: None (auth behaviour)

---

### GAP-010: Who Creates AgencyAdmin and PlatformAdmin Accounts
**Status**: OPEN
**Session**: 7 (Q5)
**Impact**: Onboarding and access control architecture. Spec says accounts "are created
by the platform (not self-registered)" but the mechanism is undefined. Who creates the
first AgencyAdmin? Who creates PlatformAdmin accounts? Can there be multiple AgencyAdmins
per agency? If the sole AgencyAdmin leaves, the agency is unmanaged.
**Affected FRs**: FR-001b — needs account provisioning sub-requirement
**Affected Entities**: AgencyAdmin, PlatformAdmin

---

### GAP-011: Patient Ending Relationship With No Upcoming Bookings (Never Booked)
**Status**: RESOLVED
**Session**: 8 Q1
**Answer**: Yes, fully open. When a patient has no upcoming confirmed bookings — including
patients who have never booked at all — there is no prerequisite or required action before
making a new booking. They proceed directly to the matching or "Previously seen" flow with
no restrictions.
**FRs Updated**: FR-018 (explicit no-restriction clause added)
**Entities Updated**: None

---

### GAP-012: Refund Timeline Communication to Patient
**Status**: RESOLVED
**Session**: 8 Q2
**Answer**: "Refund initiated — expect it within 5–7 business days." All refund
notifications (FR-011b, FR-011e, FR-012, FR-012a, FR-012b) updated to state that the
refund has been initiated and will reach the patient's account within 5–7 business days.
**FRs Updated**: FR-011b, FR-011e, FR-012, FR-012a, FR-012b
**Entities Updated**: None

---

### GAP-013: Patient Intake Update Post-Match
**Status**: RESOLVED
**Session**: 8 Q3 (resolved as part of broader intake editability discussion)
**Answer**: Patients can view and edit intake at any time from their profile. Psychiatrists
with an active access window are notified in-platform on edits. Edit history is retained.
Initial match is not automatically re-run on edit — patient can manually trigger a new
match by using "Find new match" flow.
**FRs Updated**: FR-004a added
**Entities Updated**: IntakeQuestionnaire (edit history field)

---

### GAP-014: GST Invoice / Receipt Obligation
**Status**: RESOLVED
**Session**: 8 Q3
**Answer**: GST-compliant invoice required per session. FR-041 added capturing the
requirement (booking ref, fee, GST amount, GSTIN, delivery to patient within 24h).
GSTIN ownership (platform vs. agency) deferred to planning — requires CA confirmation
before implementation. Noted as pre-implementation decision in FR-041.
**FRs Updated**: FR-041 added
**Entities Updated**: Payment (invoice reference field to be added in plan)

---

## CRITICAL Gaps — Session 9 Scan

### GAP-015: Session / Slot Duration
**Status**: RESOLVED
**Session**: 11 Q1
**Answer**: Fixed per session type, stored in PlatformConfiguration. Initial Assessment =
60 min, Follow-Up = 30 min, Crisis/Urgent = 60 min. Duration recorded on AvailabilitySlot
and Appointment at creation/booking time. Zoom meeting created with corresponding duration.
Session end time = start + duration (used by FR-015c and FR-019).
**FRs Updated**: FR-042 updated with duration rules; FR-035 updated (PlatformConfiguration)
**Entities Updated**: AvailabilitySlot (duration field added)

---

### GAP-016: Multi-Agency Scope
**Status**: RESOLVED
**Session**: 11 Q2
**Answer**: Multi-agency from day one. Matching pool is platform-wide across all agencies.
AgencyAdmins scoped to their own agency only. Psychiatrists belong to exactly one agency.
Agency is a first-class entity. FR-006 and FR-027 updated; Agency entity added;
PsychiatristProfile updated with agency reference.
**FRs Updated**: FR-006 (platform-wide pool), FR-027 (agency-scoped admin isolation)
**Entities Updated**: Agency entity added; PsychiatristProfile (agency reference)

---

### GAP-017: Psychiatrist No-Show
**Status**: RESOLVED
**Session**: 11 Q3
**Answer**: Auto-detect via Zoom participant data. Refund mode is admin-configurable in
PlatformConfiguration (default: auto-refund). Auto mode: immediate full refund + patient
notification + admin alert. Manual-review mode: patient notified of detection, Platform
Admin has 24h SLA to decide and issue refund. Both modes: audit-logged; Agency Admin
always notified. FR-045 added; Appointment status no-show-by-psychiatrist added.
**FRs Updated**: FR-045 added
**Entities Updated**: Appointment (no-show-by-psychiatrist status); PlatformConfiguration (refund mode toggle)

---

## IMPORTANT Gaps — Session 9 Scan

### GAP-018: Patient No-Show
**Status**: RESOLVED
**Session**: 11 Q4
**Answer**: Booking marked no-show-by-patient via Zoom participant data. Fee non-refundable.
Psychiatrist prompted to add session notes or skip — FR-015 and FR-015b apply unchanged.
Appointment status no-show-by-patient added.
**FRs Updated**: FR-015 (unchanged, applies); Appointment entity updated
**Entities Updated**: Appointment (no-show-by-patient status added)

---

### GAP-019: Psychiatrist Ineligibility — Self-Notification
**Status**: RESOLVED
**Session**: 11 Q5
**Answer**: No psychiatrist notification — by design. Admins are notified as before (FR-039).
All rating thresholds, percentile bands, and matching weights are now configurable via
Platform Admin dashboard UI (not just backend config). FR-038, FR-039, and FR-033 updated.
**FRs Updated**: FR-038 (percentile bands dashboard-configurable), FR-039 (eligibility rules
dashboard-configurable; explicit no-psychiatrist-notification clause), FR-033 (rating config panel added)
**Entities Updated**: None

---

### GAP-020: Maximum Booking Horizon
**Status**: OPEN
**Session**: 11 (Q1)
**Impact**: UI, performance, and clinical continuity. No upper bound is defined on how far
ahead psychiatrists can publish slots or patients can book. Can a psychiatrist publish slots
12 months ahead? Can a patient book 6 months out? Affects calendar display range, slot
indexing performance, and whether long-horizon bookings make clinical sense.
**Affected FRs**: FR-024, FR-025, FR-010a
**Affected Entities**: AvailabilitySlot

---

### GAP-021: Overlapping Slots for Same Psychiatrist
**Status**: OPEN
**Session**: 11 (Q2)
**Impact**: Availability management and double-booking risk. FR-024/FR-025 allow free slot
creation but contain no rule preventing overlapping slots for the same psychiatrist (e.g.,
10:00–11:00 and 10:30–11:30). Once one is booked, does the overlapping slot auto-block?
Or is overlap prevented at creation time? No rule is defined.
**Affected FRs**: FR-024, FR-025, FR-008
**Affected Entities**: AvailabilitySlot

---

### GAP-022: Non-Refundable Cancellation UX
**Status**: OPEN
**Session**: 11 (Q3)
**Impact**: Patient trust and dispute prevention. FR-012 covers the within-24h non-refundable
case mechanically (slot released, no refund) but nothing is said about the patient experience.
Is there a confirmation step ("You are about to lose your session fee — are you sure?") before
the cancellation is finalised? What message does the patient see?
**Affected FRs**: FR-012
**Affected Entities**: Appointment

---

### GAP-023: Stale Match List — Slot Already Gone
**Status**: OPEN
**Session**: 11 (Q4)
**Impact**: Booking UX and patient frustration. A patient views match results, waits 20
minutes, then clicks a slot to book. Another patient booked that slot in the interim. The
slot hold only starts at checkout — not at match-view time. What does the patient see at
slot-selection when the slot they intended to pick is gone?
**Affected FRs**: FR-011, FR-007
**Affected Entities**: AvailabilitySlot, Appointment

---

### GAP-024: Psychiatrist Visibility of Own Rating / Feedback Signal
**Status**: OPEN
**Session**: 11 (Q5)
**Impact**: Psychiatrist experience and quality improvement. FR-038 says raw ratings are
visible to Platform Admins and Agency Admins only. FR-039 notifies admins on ineligibility
but the psychiatrist is blind to all feedback. Does a psychiatrist ever see any signal —
aggregate score, trend, percentile — or are they completely uninformed about their performance?
**Affected FRs**: FR-038, FR-039
**Affected Entities**: PsychiatristProfile (rating visibility rules)

---

## LOW PRIORITY Gaps — Session 9 Scan

### GAP-025: WhatsApp Number Verification at Entry
**Status**: OPEN
**Session**: 12 (Q1)
**Impact**: Notification delivery quality. When a patient enters a separate WhatsApp number
(different from mobile), it's stored as-is with no active verification. An invalid or
mistyped number results in silent notification failure forever. Should there be a
verification ping before the number is saved?
**Affected FRs**: FR-001
**Affected Entities**: NotificationPreference

---

### GAP-026: Consent Denial at Registration
**Status**: OPEN
**Session**: 12 (Q2)
**Impact**: Onboarding flow branch. FR-005 requires explicit consent before storing sensitive
health data. The spec has no branch for consent denial — can a patient proceed without
consenting? Or is consent mandatory to use the platform at all? This determines whether
there is a "blocked" state at registration.
**Affected FRs**: FR-005
**Affected Entities**: Patient (consent status)

---

### GAP-027: GST Invoice Sequential Numbering
**Status**: OPEN
**Session**: 12 (Q3)
**Impact**: Legal compliance. GST law in India requires invoices to carry sequential invoice
numbers (not just a booking reference). FR-041 lists required invoice fields but omits a
sequential invoice number series — this is a legal requirement under GST rules for B2C
supplies.
**Affected FRs**: FR-041
**Affected Entities**: Payment (invoice number field)

---

## CRITICAL Gaps — Research Scan (psychiatry-sessions-india.md)

### GAP-028: No Session Type Differentiation
**Status**: RESOLVED
**Session**: 10 Q1
**Answer**: Three session types at v1: Initial Assessment (video-only mandatory, first consult
on platform), Follow-Up (any mode, all subsequent standard sessions), Crisis/Urgent (video-
preferred, emergency booking bypassing normal slot selection, only for patients with ≥1 prior
completed session). FR-042 added; AvailabilitySlot and Appointment entities updated with
session_type field.
**FRs Updated**: FR-002 updated, FR-042 added
**Entities Updated**: AvailabilitySlot (session_type field), Appointment (session_type + mode fields)

---

### GAP-029: Consultation Mode (Video / Audio / Text) Not Modelled
**Status**: RESOLVED
**Session**: 10 Q2
**Answer**: V1 — video only (Zoom) for all three session types. No audio-only or text-based
modes in v1 to avoid complexity. Audio-only (Follow-Up only) and text-based async chat
deferred to v2 — both added to Future Readiness section with v1 design constraints noted.
**FRs Updated**: FR-042 simplified (video-only clause); FR-002 reference kept clean
**Entities Updated**: Appointment entity — consultation_mode field deferred to v2

---

### GAP-030: No E-Prescription Workflow
**Status**: RESOLVED
**Session**: 10 Q3
**Answer**: E-prescription tool added. Prescription is a formal legal document distinct
from CareRecommendation (session notes). Psychiatrist generates it post-session via the
prescription tool. Mandatory fields auto-populated from PsychiatristProfile (MCI reg number,
name, qualifications, clinic) and PatientProfile. Drugs stored/displayed in CAPITAL LETTERS.
Finalisation acts as digital signature. PDF delivered to patient via platform + WhatsApp.
Retained 7 years as clinical record. MCI registration number added to PsychiatristProfile.
**FRs Updated**: FR-043 added (e-prescription generation); FR-015b clarified as session
notes only (distinct from prescription); CareRecommendation entity description updated
**Entities Updated**: PsychiatristProfile (MCI registration number), new Prescription entity added

---

### GAP-031: List C Drug Prohibition Not Enforced
**Status**: RESOLVED
**Session**: 10 Q3
**Answer**: Hard block enforced. List C drugs (alprazolam, diazepam, lorazepam, nitrazepam,
chlordiazepoxide, zolpidem, methylphenidate, modafinil, phenobarbitone, depot antipsychotics)
cannot be added to a prescription — blocked immediately with a named warning and a suggestion
to refer for in-person consultation. No override possible. Blocked attempts are audit-logged.
List C drug list stored in PlatformConfiguration, editable by Platform Admins.
**FRs Updated**: FR-044 added (List C hard block)
**Entities Updated**: PlatformConfiguration (List C drug list added)

---

## IMPORTANT Gaps — Research Scan (psychiatry-sessions-india.md)

### GAP-032: No Treatment Phase Tracking or Follow-Up Scheduling Suggestions
**Status**: OPEN
**Session**: TBD
**Impact**: Clinical continuity and platform differentiation. All competitors lack this —
it is a key opportunity. IPS Clinical Practice Guidelines define three treatment phases
(Acute: every 2–4 weeks; Continuation: every 4–6 weeks; Maintenance: monthly/quarterly).
The platform currently has no concept of phase, no follow-up frequency suggestion, and
no automation to remind psychiatrists to schedule follow-ups. Without this, continuity
of care depends entirely on patient and psychiatrist memory.
**Affected FRs**: FR-015, FR-016 — new FRs required for phase tracking and follow-up
scheduling suggestions
**Affected Entities**: PatientProfile (treatment phase field), CareRecommendation
(next follow-up date field exists but is not tied to phase logic)
**Research ref**: Section 4.1 of psychiatry-sessions-india.md

---

### GAP-033: Pricing Differentiation by Session Type
**Status**: OPEN
**Session**: TBD
**Impact**: Business model and data model. Research shows initial consultations cost
20–50% more than follow-ups across all Indian platforms (e.g., RocketHealth: ₹1,800+
initial vs. lower for follow-ups). The current spec has one fixed fee per psychiatrist
(FR-023a) with no variation by session type. Should the agency be able to set separate
fees for initial vs. follow-up sessions? This directly affects FR-023a and the Payment entity.
**Affected FRs**: FR-023a, FR-007, FR-011a
**Affected Entities**: PsychiatristProfile (fee structure), Payment
**Research ref**: Section 1.5 and 2.3 of psychiatry-sessions-india.md

---

### GAP-034: MHCA 2017 Form B-1 Session Documentation Compliance
**Status**: OPEN
**Session**: TBD
**Impact**: Legal compliance. Each psychiatric session must produce a Form B-1 outpatient
record under the Mental Healthcare (State) Rules 2018. The minimum content per encounter
goes well beyond what the spec's care recommendation covers: type of treatment/therapy,
duration and goals, techniques used, clinical observations, progress notes, capacity
assessment, risk/benefit discussions, and consent status. The current care recommendation
FR (FR-015, FR-015b) captures medications and activities but misses the structured clinical
record required by law.
**Affected FRs**: FR-015, FR-015b — new FR required for Form B-1 compliance
**Affected Entities**: CareRecommendation (needs additional fields), new entity: SessionRecord
**Research ref**: Section 5 of psychiatry-sessions-india.md

---

### GAP-035: No Caregiver Consultation Type
**Status**: OPEN
**Session**: TBD
**Impact**: Clinical coverage and legal compliance. The Telepsychiatry Operational Guidelines
2020 define a specific "caregiver consultation" type where the patient cannot attend but
authorises a caregiver (family member, carer) to consult on their behalf. This requires
patient written authorisation. It is a distinct session type used frequently in Indian
practice (e.g., for severely unwell patients, elderly patients, or patients in crisis who
cannot engage directly). Not modelled in the spec.
**Affected FRs**: New FR required
**Affected Entities**: Appointment (type field), new: CaregiverAuthorisation
**Research ref**: Section 2.3 of psychiatry-sessions-india.md

---

## DEFERRED Gaps (address in planning phase, not spec)

- **Zoom waiting room**: Is it enabled by default? Can psychiatrists control entry?
- **Multiple simultaneous future bookings**: Can a patient have 3 upcoming sessions booked
  at once? Sensible default is yes; confirm in planning.
- **Psychiatrist exclusivity**: Assumed 1:1 with agency; confirm in planning.
- **Audit log retention wording**: FR-030 says "retained permanently"; constitution says
  "≥7 years." Minor inconsistency — align wording in planning.
- **IST timezone assumption**: All notifications and slots assumed IST. Fine for v1;
  document in planning.
- **Patient payment history view**: Can patients view past invoices in their profile?
  UX detail — address in planning.

---

## Resolution Log

| Gap | Status | Resolved In | Answer Summary |
|-----|--------|-------------|----------------|
| GAP-001 | RESOLVED | Session 6 Q1 | Urban Company model, booking-driven access, 3-month expiry, PlatformConfiguration |
| GAP-002 | RESOLVED | Session 6 Q2 | One platform Zoom Business account; patients and psychiatrists join as external participants |
| GAP-003 | RESOLVED | Session 6 Q3 | Async export package delivered via WhatsApp/SMS within 72h; link expires 48h; excludes raw transcripts; FR-036 added |
| GAP-004 | RESOLVED | Session 6 Q4 | Admin-mediated TOTP reset only; audit-logged; FR-001e added; FR-033 updated |
| GAP-005 | RESOLVED | Session 6 Q5 | Agency sets one fixed fee per psychiatrist; locked into Payment at booking; FR-023a added; PsychiatristProfile and Payment entities updated |
| GAP-006 | RESOLVED | Session 7 Q1 | 3 failed attempts → 15-min lockout; same as patient OTP; PlatformConfiguration entries added; FR-001f added |
| GAP-007 | RESOLVED | Session 7 Q2 | 3 reminders: 48h, 2h, 15min; only future windows fire; all configurable in PlatformConfiguration; FR-019 and US4 updated |
| GAP-008 | RESOLVED | Session 7 Q3 | Default cap 3/day; patient-adjustable; in PlatformConfiguration; FR-020 updated; NotificationPreference entity updated; AI chat noted in Future Readiness |
| GAP-009 | RESOLVED | Session 7 Q4 | Min 12 chars, uppercase + number + special char; PlatformConfiguration; FR-001g added |
| GAP-010 | RESOLVED | Session 7 Q5 | Platform Admin creates all accounts; multiple AgencyAdmins per agency allowed; 24h activation link; FR-001h added; FR-033 updated |
| GAP-011 | RESOLVED | Session 8 Q1 | No upcoming bookings = no restriction; book freely; FR-018 updated |
| GAP-012 | RESOLVED | Session 8 Q2 | "Refund initiated — 5–7 business days" message; all refund FRs updated |
| GAP-013 | RESOLVED | Session 8 Q3 | Editable intake via FR-004a; psychiatrist notified; edit history retained |
| GAP-014 | RESOLVED | Session 8 Q3 | FR-041 added; GSTIN ownership deferred to plan (CA confirmation needed) |
| GAP-015 | RESOLVED | Session 11 Q1 | Fixed durations per type in PlatformConfiguration: Initial=60min, Follow-Up=30min, Crisis=60min |
| GAP-016 | RESOLVED | Session 11 Q2 | Multi-agency; platform-wide matching pool; AgencyAdmin agency-scoped; Agency entity added |
| GAP-017 | RESOLVED | Session 11 Q3 | Auto-detect via Zoom; admin-configurable auto/manual-review refund mode; FR-045 |
| GAP-018 | RESOLVED | Session 11 Q4 | No-show-by-patient status; fee non-refundable; psychiatrist prompted to add notes |
| GAP-019 | RESOLVED | Session 11 Q5 | No psychiatrist notification; all rating/threshold settings via Platform Admin dashboard UI |
| GAP-020 | OPEN | Session 11 Q1 | — |
| GAP-021 | OPEN | Session 11 Q2 | — |
| GAP-022 | OPEN | Session 11 Q3 | — |
| GAP-023 | OPEN | Session 11 Q4 | — |
| GAP-024 | OPEN | Session 11 Q5 | — |
| GAP-025 | OPEN | Session 12 Q1 | — |
| GAP-026 | OPEN | Session 12 Q2 | — |
| GAP-027 | OPEN | Session 12 Q3 | — |
| GAP-028 | RESOLVED | Session 10 Q1 | Three types: Initial Assessment (video-only), Follow-Up (any mode), Crisis/Urgent (video-preferred); FR-042 added |
| GAP-029 | RESOLVED | Session 10 Q2 | Video only in v1; audio-only + text-based modes deferred to v2 Future Readiness |
| GAP-030 | RESOLVED | Session 10 Q3 | E-prescription tool added; FR-043; MCI reg number on PsychiatristProfile; Prescription entity added |
| GAP-031 | RESOLVED | Session 10 Q3 | List C hard block; FR-044; List C list in PlatformConfiguration |
| GAP-032 | OPEN | TBD | — |
| GAP-033 | OPEN | TBD | — |
| GAP-034 | OPEN | TBD | — |
| GAP-035 | OPEN | TBD | — |
