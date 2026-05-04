# Spec Gaps Tracker: 001-patient-psychiatrist-match

**Purpose**: Track all identified gaps, assumptions, and unresolved decisions in the spec.
Clarification sessions MUST read this file first and resolve OPEN gaps in priority order
before asking new questions.

**Last Updated**: 2026-05-03
**Total Gaps**: 50
**Resolved**: 35
**Open Critical**: 3
**Open Important**: 9
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
**Status**: RESOLVED
**Session**: 2026-05-02
**Answer**: One platform-owned Zoom Business account. All meetings created under the
platform's single account. Patients and psychiatrists join as external participants.
No per-psychiatrist OAuth or sub-accounts. All transcript webhooks on this single account.
**FRs Updated**: FR-002, FR-015, FR-015c
**Entities Updated**: Appointment (Zoom meeting ID)

---

### GAP-003: Data Export / Portability
**Status**: RESOLVED
**Session**: 2026-05-02
**Answer**: Async package delivery. Patient requests export from profile settings; platform
delivers secure time-limited download link via WhatsApp + SMS within 72 hours. Includes:
intake responses, care recommendations, appointment history, notification preferences. Raw
transcripts excluded. Download link expires 48 hours. New FR-036 added.
**FRs Updated**: FR-036 added
**Entities Updated**: None

---

### GAP-004: TOTP Recovery Mechanism
**Status**: RESOLVED
**Session**: 2026-05-02
**Answer**: Admin-mediated reset. User contacts Platform Admin who verifies identity
out-of-band, resets TOTP enrollment from admin portal. On next login user must re-enroll.
Every reset logged as immutable audit event (admin, timestamp, account affected).
**FRs Updated**: FR-001b updated
**Entities Updated**: None

---

### GAP-005: Session Fee / Pricing Model
**Status**: RESOLVED
**Session**: 2026-05-02
**Answer**: Agency sets one fixed fee per psychiatrist. No variation by session type.
Fee locked into Payment record at booking confirmation — subsequent agency changes do not
affect confirmed bookings. See GAP-033 for deferred per-session-type pricing question.
**FRs Updated**: FR-007, FR-011a, FR-023a added
**Entities Updated**: PsychiatristProfile (fee field), Payment (fee-at-booking field)

---

### GAP-006: Failed Password Attempt Lockout (Non-Patient Roles)
**Status**: RESOLVED
**Session**: 2026-05-02
**Answer**: Same lockout as patient OTP. After 3 consecutive failed password attempts,
account locked for 15 minutes. Remaining lockout time displayed to user. Parameters
stored in PlatformConfiguration, editable by Platform Admins.
**FRs Updated**: FR-001b updated
**Entities Updated**: None

---

## IMPORTANT Gaps (resolve after all CRITICAL are done)

### GAP-007: Appointment Reminder Timing When Booking < 48h from Session
**Status**: RESOLVED
**Session**: 2026-05-02
**Answer**: Three reminders (48h, 2h, 15min before session). Only future-window reminders
are scheduled at booking time — past windows skipped entirely. All window values stored
in PlatformConfiguration, editable by Platform Admins.
**FRs Updated**: FR-019 updated
**Entities Updated**: None

---

### GAP-008: Daily Notification Frequency Cap
**Status**: RESOLVED
**Session**: 2026-05-02
**Answer**: Default cap of 3 Tier 3 WhatsApp notifications per day. Patients can raise
or lower. Cap stored in PlatformConfiguration, editable by Platform Admins. Tier 2
booking reminders and OTPs do not count toward this cap.
**FRs Updated**: FR-020, FR-021a updated
**Entities Updated**: NotificationPreference (daily cap field)

---

### GAP-009: Password Strength Requirements (Non-Patient Roles)
**Status**: RESOLVED
**Session**: 2026-05-02
**Answer**: Minimum 12 characters, at least one uppercase letter, one number, one special
character. Policy stored in PlatformConfiguration, editable by Platform Admins.
**FRs Updated**: FR-001b updated
**Entities Updated**: None

---

### GAP-010: Who Creates AgencyAdmin and PlatformAdmin Accounts
**Status**: RESOLVED
**Session**: 2026-05-02
**Answer**: Platform Admin creates all non-patient accounts. Platform Admin creates all
PlatformAdmin accounts and the first AgencyAdmin per agency. Multiple AgencyAdmins per
agency allowed — additional ones created by existing AgencyAdmin or Platform Admin.
Psychiatrist accounts created by any AgencyAdmin of the same agency.
**FRs Updated**: FR-001b, FR-027 updated
**Entities Updated**: None

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
**Status**: RESOLVED
**Session**: 12 Q1
**Answer**: 3-month rolling window. Psychiatrists cannot publish slots more than 3 months
ahead. Patients can book any published slot. Limit stored in PlatformConfiguration.
FR-024 and FR-025 updated with horizon constraint.
**FRs Updated**: FR-024, FR-025
**Entities Updated**: PlatformConfiguration (max horizon setting)

---

### GAP-021: Overlapping Slots for Same Psychiatrist
**Status**: RESOLVED
**Session**: 12 Q2
**Answer**: Blocked at slot creation time. System rejects any new slot overlapping an
existing open or booked slot for the same psychiatrist. Error shown immediately with
conflict identified. FR-024 and FR-025 updated.
**FRs Updated**: FR-024, FR-025
**Entities Updated**: None

---

### GAP-022: Non-Refundable Cancellation UX
**Status**: RESOLVED
**Session**: 12 Q3
**Answer**: Explicit confirmation modal required before proceeding. Shows exact fee amount
forfeited and no-refund statement. Patient must confirm — no single-tap non-refundable
cancellation possible. FR-012 updated.
**FRs Updated**: FR-012
**Entities Updated**: None

---

### GAP-023: Stale Match List — Slot Already Gone
**Status**: RESOLVED
**Session**: 12 Q4
**Answer**: Real-time availability check at slot selection. Inline error shown with
remaining slots for the same psychiatrist. Patient stays on same screen. FR-011 updated.
**FRs Updated**: FR-011
**Entities Updated**: None

---

### GAP-024: Psychiatrist Visibility of Own Rating / Feedback Signal
**Status**: RESOLVED
**Session**: 12 Q5
**Answer**: Hidden by default — no legal obligation to show. Platform Admin has a toggle
(PlatformConfiguration) to enable psychiatrist visibility of their own aggregate score,
percentile band, and session count only. Individual patient ratings never shown to
psychiatrists regardless of toggle state.
**FRs Updated**: FR-038
**Affected Entities**: PlatformConfiguration (psychiatrist rating visibility toggle)

---

## LOW PRIORITY Gaps — Session 9 Scan

### GAP-025: WhatsApp Number Verification at Entry
**Status**: RESOLVED
**Session**: 13 Q5
**Answer**: No verification — store as entered. Helper note shown: "Make sure this number
is registered on WhatsApp." SMS to primary mobile is the guaranteed fallback for all
critical communication; silent WhatsApp failure is acceptable.
**FRs Updated**: FR-001 unchanged
**Entities Updated**: None

---

### GAP-026: Consent Denial at Registration
**Status**: RESOLVED
**Session**: 13 Q6
**Answer**: Hard gate — no consent, no access. Declining deletes the partial account
immediately. No browse-only mode. Consent screen shown before any intake data is collected.
DPDPA 2023 requires informed consent before processing sensitive personal data.
**FRs Updated**: FR-005 updated
**Entities Updated**: None

---

### GAP-027: GST Invoice Sequential Numbering
**Status**: RESOLVED
**Session**: 13 Q7
**Answer**: Format `[PREFIX]/[FY]/[SEQUENCE]` (e.g., MHP/2026-27/00001). Auto-incrementing,
gapless, resets April 1 each financial year. Prefix configurable by Platform Admin in
PlatformConfiguration. invoice_number field on Payment entity, immutable once issued.
**FRs Updated**: FR-041 updated
**Entities Updated**: Payment (invoice_number field)

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
**Status**: RESOLVED
**Session**: 13 Q1
**Answer**: Psychiatrist sets a recommended follow-up interval (1w/2w/4w/6w/8w/3m/6m or
specific date) in the session notes form. Platform sends Tier 3 WhatsApp nudge to patient
on that date with a direct booking link. Nudge suppressed if patient already has a future
confirmed booking. Phase labels not exposed in UI. next_follow_up_date field on
CareRecommendation wired to notification system via FR-046.
**FRs Updated**: FR-046 added
**Entities Updated**: CareRecommendation (next_follow_up_date wired to notification system)

---

### GAP-033: Pricing Differentiation by Session Type
**Status**: RESOLVED
**Session**: 13 Q2
**Answer**: Three separate fees per psychiatrist (Initial Assessment, Follow-Up,
Crisis/Urgent) set by Agency Admin. Agency Admins can bulk-update fees for all
psychiatrists in their agency; Platform Admins can bulk-update platform-wide.
Individual overrides remain available after bulk update. Fees locked at booking.
**FRs Updated**: FR-023a updated
**Entities Updated**: PsychiatristProfile (3 fee fields replacing 1)

---

### GAP-034: MHCA 2017 Form B-1 Session Documentation Compliance
**Status**: RESOLVED
**Session**: 13 Q3
**Answer**: FR-015b expanded with all Form B-1 required fields. Required: presenting
complaints, clinical observations, treatment type, consent status. Optional: history
summary, techniques, capacity assessment, risk/benefit notes. Psychiatrist must check
Form B-1 completion declaration before approving session record. Record retained 7 years
as Form B-1 equivalent. No new entity needed — CareRecommendation extended.
**FRs Updated**: FR-015b updated
**Entities Updated**: CareRecommendation (additional Form B-1 fields)

---

### GAP-035: No Caregiver Consultation Type
**Status**: RESOLVED
**Session**: 13 Q4
**Answer**: Deferred to v2. Target users are self-referring adults; caregiver consultation
is more common in institutional settings. Complexity (consent, identity verification) not
justified for a rare v1 use case. Already captured in Future Readiness → Additional
Session Types (v2). session_type is string enum in v1 — adding this type in v2 requires
no schema migration.
**FRs Updated**: None
**Entities Updated**: None

---

## CRITICAL Gaps — Research vs. Spec Cross-Reference (2026-05-04)

### GAP-036: List B Drug Enforcement Missing
**Status**: OPEN
**Session**: TBD
**Impact**: Regulatory violation. Telepsychiatry Operational Guidelines 2020 define List B
drugs (pregabalin, gabapentin, certain antipsychotic add-ons) that can only be prescribed
in follow-up sessions after at least one prior video consultation. The spec enforces List C
(FR-044) but has zero coverage of List B. A psychiatrist could legally violate the
guidelines by prescribing a List B drug in a patient's first session.
**Affected FRs**: FR-044 — needs List B enforcement added
**Affected Entities**: Prescription, PlatformConfiguration (List B drug list)
**Research ref**: Section 3.1

---

### GAP-037: Crisis Pathway for New Patients — Constitution Violation
**Status**: OPEN
**Session**: TBD
**Impact**: Constitution violation. FR-042 requires a completed Initial Assessment before
a Crisis/Urgent booking. A brand-new patient presenting in crisis cannot use the
Crisis/Urgent path — they must book a standard Initial Assessment and wait for a slot.
The constitution states "Crisis pathways always reachable." This design may directly
violate that principle for first-time users.
**Affected FRs**: FR-042 — Crisis/Urgent access rules need review
**Affected Entities**: Appointment (session_type eligibility rules)
**Research ref**: Section 6.1

---

### GAP-038: Session Recording Consent Not Explicit
**Status**: OPEN
**Session**: TBD
**Impact**: DPDPA 2023 / regulatory gap. The platform records every session via Zoom and
uses the transcript to generate care recommendations (FR-015). Patients must give
informed consent specifically for session recording and transcription — this is processing
of sensitive personal data under DPDPA 2023. FR-005 covers health data consent generically
but does not mention that sessions are recorded and transcribed. DocVita explicitly states
its sessions are "unrecorded" — our approach is the opposite and must be consented to.
**Affected FRs**: FR-005 — needs explicit recording consent clause
**Affected Entities**: Patient (consent record)
**Research ref**: Section 1.4 (DocVita explicitly unrecorded)

---

## IMPORTANT Gaps — Research vs. Spec Cross-Reference (2026-05-04)

### GAP-039: Advance Directive and Nominated Representative Missing from Form B-1
**Status**: OPEN
**Session**: TBD
**Impact**: MHCA 2017 legal requirement. Form B-1 requires "advance directive and nominated
representative information" per encounter. Under MHCA 2017 (Sections 5–12), every
psychiatric patient has a legal right to make an advance directive and nominate a
representative. FR-015b's expanded field list does not include either. This is a legal
right, not just a documentation field.
**Affected FRs**: FR-015b — needs advance directive and nominated rep fields
**Affected Entities**: CareRecommendation, PatientProfile (advance directive and rep fields)
**Research ref**: Section 5

---

### GAP-040: Patient No-Show — No Re-engagement Nudge
**Status**: OPEN
**Session**: TBD
**Impact**: Clinical continuity. Research (Section 6.3) explicitly states "no-show detection
should trigger patient re-engagement — high dropout documented in Indian telepsychiatry."
The spec marks patient no-shows as no-show-by-patient status but sends zero re-engagement
notification. Given the 67.77% dropout stat, this is a direct missed opportunity to reduce
churn that the platform already has the infrastructure for.
**Affected FRs**: New FR required for patient no-show re-engagement notification
**Affected Entities**: Appointment (no-show-by-patient status), NotificationEvent
**Research ref**: Section 4.4, 6.3

---

### GAP-041: MHCA 2017 Records Access Right — 15-Day Obligation Not Modelled
**Status**: OPEN
**Session**: TBD
**Impact**: Legal compliance. MHCA 2017 gives patients the right to request their clinical
records via Form A; the provider must respond within 15 days. The spec covers DPDPA 2023
data export (FR-036, 72h) but this is a separate and distinct legal obligation under
MHCA 2017 covering clinical records. The two rights have different scopes (patient-owned
data vs. full clinical record) and different timelines (72h vs. 15 days).
**Affected FRs**: FR-036 — needs MHCA Form A records access path alongside DPDPA export
**Affected Entities**: None new — existing clinical records already stored
**Research ref**: Section 5

---

### GAP-042: Auto Follow-Up Suggestion After New Prescription Not Wired
**Status**: OPEN
**Session**: TBD
**Impact**: Clinical safety. Research (Section 6.3): "After any new medication initiation:
trigger 1–2 week medication initiation review." FR-046 is purely manual — psychiatrist
manually picks a follow-up interval in session notes. There is no link between FR-043
(prescription finalised) and FR-046 (follow-up interval). When a new prescription is
created, the session notes form should auto-suggest "1–2 weeks" as the recommended
follow-up interval.
**Affected FRs**: FR-043, FR-046 — need to be linked
**Affected Entities**: Prescription, CareRecommendation
**Research ref**: Section 6.3

---

### GAP-043: MCI Number Required on WhatsApp Message Content
**Status**: OPEN
**Session**: TBD
**Impact**: Regulatory. Research (Section 3.2): MCI registration number must appear on
"prescriptions, websites, emails, and WhatsApp messages." The spec captures MCI reg on
prescription PDFs (FR-043) but WhatsApp message content (prescription delivery message,
session confirmations sent from the platform on behalf of a psychiatrist) does not include
the MCI number. This is a Telemedicine Guidelines 2020 requirement.
**Affected FRs**: FR-043, FR-019 — prescription WhatsApp message and session-related
messages need MCI number in content
**Affected Entities**: None new
**Research ref**: Section 3.2

---

### GAP-044: Mental Status Examination (MSE) Missing from Session Notes
**Status**: OPEN
**Session**: TBD
**Impact**: Clinical standard. MSE is a 10-domain structured assessment (appearance,
attitude/behaviour, speech, mood, affect, thought process, thought content, perception,
cognition, insight/judgment) mandatory in Indian psychiatric practice for both initial
and follow-up sessions per IPS Consensus. FR-015b has "clinical observations/progress
notes" as a required field — but MSE is a specific structured assessment, not free-text
observations. These are clinically distinct.
**Affected FRs**: FR-015b — MSE should be at least an optional structured field
**Affected Entities**: CareRecommendation
**Research ref**: Sections 2.1, 2.2

---

### GAP-045: Prescription → Medication Reminder Link Undefined
**Status**: OPEN
**Session**: TBD
**Impact**: Product coherence. The platform promises medication reminders as Tier 3
WhatsApp notifications (FR-021, original user description). FR-043 generates prescriptions
with drug names, dosage, and frequency. But no FR links prescription finalisation to
medication reminder scheduling. How does the notification engine know what to remind about,
at what frequency, for how long? The two systems are completely disconnected in the spec.
**Affected FRs**: FR-021, FR-043 — need explicit connection
**Affected Entities**: Prescription, NotificationEvent
**Research ref**: Section 2.4

---

### GAP-046: Patient Self-Report Fields Missing from Follow-Up Notes
**Status**: OPEN
**Session**: TBD
**Impact**: Clinical completeness. Research (Section 2.2) specifies the standard follow-up
agenda: medication adherence, side effects, symptom trajectory, sleep, appetite, life
events since last visit. These map to the SOAP "Subjective" component. FR-015b's
required/optional fields cover the clinician's observations (Objective, Assessment, Plan)
but miss the patient self-report dimension (Subjective). This is a structured clinical
standard, not a nice-to-have.
**Affected FRs**: FR-015b — Subjective SOAP fields should be added (adherence, side
effects, symptom trajectory, sleep, appetite)
**Affected Entities**: CareRecommendation
**Research ref**: Section 2.2

---

### GAP-047: Identity Verification at Consultation Time Undefined
**Status**: OPEN
**Session**: TBD
**Impact**: Regulatory. Research (Section 2.1): "Identity confirmation is the first step"
of any telemedicine consultation. FR-043 states the prescription auto-populates "a record
of the identity verification performed at consultation time — auto-populated from
PatientProfile." But no FR defines HOW identity is verified during a session. OTP at
login may not be sufficient — the Telemedicine Guidelines 2020 require the psychiatrist
to actively confirm the patient's identity at the start of each session.
**Affected FRs**: FR-043, FR-042 — identity verification step needs to be defined
**Affected Entities**: Appointment, Prescription
**Research ref**: Section 2.1

---

## LOW / REVIEW Gaps — Research vs. Spec Cross-Reference (2026-05-04)

### GAP-048: Video-Only Policy for All v1 Sessions — Review
**Status**: OPEN
**Session**: TBD
**Impact**: Product scope review. Regulatory requirement is video-only for INITIAL
consultations only. Follow-ups are legally permitted via audio or text. The spec chose
video-only for ALL sessions in v1 for simplicity (FR-042). RocketHealth, the most
clinically structured competitor, offers audio/video/text for follow-ups. This eliminates
a legitimate feature for stable follow-up patients — worth consciously confirming.
**Affected FRs**: FR-042 — scope decision, not a bug
**Affected Entities**: None
**Research ref**: Sections 1.5, 2.3

---

### GAP-049: Medication Initiation Review as Distinct Session Type
**Status**: OPEN
**Session**: TBD
**Impact**: Clinical differentiation. Research (Section 2.3) identifies "Medication
Initiation Review" (15–30 min, 1–2 weeks post-new-medication) as a distinct session type
in Indian psychiatric practice. The spec merges it with Follow-Up (30 min). A 10-day
post-antipsychotic-start review is clinically different from a routine 6-week follow-up —
different agenda, different documentation focus, potentially different fee. Worth deciding
if v1 needs a 4th session type or if Follow-Up is sufficient.
**Affected FRs**: FR-042 — may need a 4th session type
**Affected Entities**: AvailabilitySlot, Appointment (session_type enum)
**Research ref**: Section 2.3

---

### GAP-050: Investigation Reports Attachment Not Modelled
**Status**: OPEN
**Session**: TBD
**Impact**: Clinical completeness. Form B-1 requires "investigation reports" per encounter.
Psychiatrists commonly order blood tests, ECG, and thyroid function and need to reference
results in session records. The spec has no mechanism for attaching or referencing
investigation reports in a session record. Probably out of v1 scope but worth an explicit
decision.
**Affected FRs**: FR-015b — investigation results field/attachment missing
**Affected Entities**: CareRecommendation
**Research ref**: Sections 2.1, 5

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
| GAP-020 | RESOLVED | Session 12 Q1 | 3-month rolling horizon; FR-024 and FR-025 updated; PlatformConfiguration |
| GAP-021 | RESOLVED | Session 12 Q2 | Overlap blocked at slot creation; error identifies conflict; FR-024, FR-025 |
| GAP-022 | RESOLVED | Session 12 Q3 | Confirmation modal with exact fee shown before non-refundable cancellation; FR-012 |
| GAP-023 | RESOLVED | Session 12 Q4 | Real-time check at slot selection; inline error + remaining slots shown; FR-011 |
| GAP-024 | RESOLVED | Session 12 Q5 | Hidden by default; Platform Admin toggle to enable aggregate view only; FR-038 |
| GAP-025 | RESOLVED | Session 13 Q5 | No verification; helper note shown; SMS is guaranteed fallback |
| GAP-026 | RESOLVED | Session 13 Q6 | Hard gate — decline deletes partial account; no browse mode; FR-005 updated |
| GAP-027 | RESOLVED | Session 13 Q7 | FORMAT PREFIX/FY/SEQ; resets April 1; configurable prefix; Payment.invoice_number; FR-041 |
| GAP-028 | RESOLVED | Session 10 Q1 | Three types: Initial Assessment (video-only), Follow-Up (any mode), Crisis/Urgent (video-preferred); FR-042 added |
| GAP-029 | RESOLVED | Session 10 Q2 | Video only in v1; audio-only + text-based modes deferred to v2 Future Readiness |
| GAP-030 | RESOLVED | Session 10 Q3 | E-prescription tool added; FR-043; MCI reg number on PsychiatristProfile; Prescription entity added |
| GAP-031 | RESOLVED | Session 10 Q3 | List C hard block; FR-044; List C list in PlatformConfiguration |
| GAP-032 | RESOLVED | Session 13 Q1 | Follow-up interval picker in session notes; WhatsApp nudge on date; FR-046 added |
| GAP-033 | RESOLVED | Session 13 Q2 | 3 fees per psychiatrist by session type; bulk update for Agency Admin + Platform Admin; FR-023a |
| GAP-034 | RESOLVED | Session 13 Q3 | FR-015b expanded with Form B-1 fields; declaration checkbox before approval; 7-year retention |
| GAP-035 | RESOLVED | Session 13 Q4 | Deferred to v2; string enum session_type in v1 enables no-migration addition later |
| GAP-036 | OPEN | TBD | — |
| GAP-037 | OPEN | TBD | — |
| GAP-038 | OPEN | TBD | — |
| GAP-039 | OPEN | TBD | — |
| GAP-040 | OPEN | TBD | — |
| GAP-041 | OPEN | TBD | — |
| GAP-042 | OPEN | TBD | — |
| GAP-043 | OPEN | TBD | — |
| GAP-044 | OPEN | TBD | — |
| GAP-045 | OPEN | TBD | — |
| GAP-046 | OPEN | TBD | — |
| GAP-047 | OPEN | TBD | — |
| GAP-048 | OPEN | TBD | — |
| GAP-049 | OPEN | TBD | — |
| GAP-050 | OPEN | TBD | — |
