# Spec Gaps Tracker: 001-patient-psychiatrist-match

**Purpose**: Track all identified gaps, assumptions, and unresolved decisions in the spec.
Clarification sessions MUST read this file first and resolve OPEN gaps in priority order
before asking new questions.

**Last Updated**: 2026-05-03
**Total Gaps**: 50
**Resolved**: 50
**Open Critical**: 0
**Open Important**: 0
**Open Low**: 0
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
60 min, Follow-Up = 30 min, Urgent Review = 60 min. Duration recorded on AvailabilitySlot
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
on platform), Follow-Up (any mode, all subsequent standard sessions), Urgent Review (video-
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
Urgent Review) set by Agency Admin. Agency Admins can bulk-update fees for all
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
**Status**: RESOLVED
**Session**: 14 Q1
**Answer**: No automated enforcement in v1 — drug database/formulary required for clean
enforcement and deferred to v2. V1 approach: prescription tool shows a static regulatory
reference panel (always visible while composing) listing List B drugs and their restriction
("may only be prescribed after at least one prior video consultation"). Panel is
informational only. List B reference list stored in PlatformConfiguration, editable by
Platform Admins. Automated contextual block (based on session history) deferred to v2.
**FRs Updated**: FR-044 updated (List B reference panel added)
**Entities Updated**: PlatformConfiguration (List B drug list added)

---

### GAP-037: Crisis Pathway for New Patients — Constitution Violation
**Status**: RESOLVED
**Session**: 14 Q2
**Answer**: Platform is not a crisis intervention service — consistent with Telemedicine
Practice Guidelines 2020 which direct emergency presentations to emergency facilities, not
telemedicine. "Urgent Review" session type renamed to "Urgent Review" — available only to
returning patients (≥1 prior completed session) for acute deterioration. New patients in
crisis are served by always-visible national helpline numbers (iCall, Vandrevala Foundation)
displayed on login page, booking page, and patient dashboard. Constitution principle
"Crisis pathways always reachable" satisfied by permanent helpline display, not platform
session type.
**FRs Updated**: FR-042 updated (rename + helpline display requirement added)
**Entities Updated**: None (session_type enum value rename: Urgent Review → Urgent Review)

---

### GAP-038: Session Recording Consent Not Explicit
**Status**: RESOLVED
**Session**: 14 Q3
**Answer**: Recording disclosure added to the existing FR-005 registration consent screen
(Option B — no separate pre-session screen). Consent text explicitly states sessions are
recorded via Zoom, transcript used to generate care notes reviewed by psychiatrist, stored
encrypted 7 years. Patient consent record captures recording consent with timestamp. Full
consent text accessible from patient profile at any time. Satisfies DPDPA 2023 informed
consent requirement for processing of sensitive personal data.
**FRs Updated**: FR-005 updated
**Entities Updated**: Patient (consent record — recording consent timestamp)

---

## IMPORTANT Gaps — Research vs. Spec Cross-Reference (2026-05-04)

### GAP-039: Advance Directive and Nominated Representative Missing from Form B-1
**Status**: RESOLVED
**Session**: 14 Q4
**Answer**: Two optional fields added to PatientProfile (`advance_directive`,
`nominated_representative_name`, `nominated_representative_contact`). Patient sets them
from profile settings. Session notes form (FR-015b) shows them as pre-populated read-only
fields at every session for Form B-1 documentation. No platform permissions or automated
actions — documentation only. Nominated representative has no platform access and does
not join sessions (platform is direct consultation only).
**FRs Updated**: FR-015b updated
**Entities Updated**: PatientProfile (advance_directive + nominated_representative fields)

---

### GAP-040: Patient No-Show — No Re-engagement Nudge
**Status**: RESOLVED
**Session**: 14 Q5
**Answer**: Two-nudge re-engagement sequence added as FR-047. Nudge 1: 24h after no-show
("we missed you, rebook when ready"). Nudge 2: 7 days later if no new booking made
("it's been a week, your mental health matters"). Nudge 2 suppressed if patient books
between nudge 1 and 7-day mark. Both respect daily notification cap (FR-020). No further
nudges after nudge 2. Both events audit-logged.
**FRs Updated**: FR-047 added
**Entities Updated**: None (reuses existing NotificationEvent and WhatsApp delivery)

---

### GAP-041: MHCA 2017 Records Access Right — 15-Day Obligation Not Modelled
**Status**: RESOLVED
**Session**: 14 Q6
**Answer**: FR-036 extended to a unified records request covering both DPDPA 2023 (72h)
and MHCA 2017 Form A (15 days) in one flow. 72h delivery satisfies both deadlines. Package
expanded to include full clinical records: approved session notes, all issued prescriptions,
intake responses, appointment history, feedback records. Raw Zoom transcripts remain
excluded (intermediate artifact, not formal clinical record). Single button in patient
profile settings.
**FRs Updated**: FR-036 updated
**Entities Updated**: None

---

### GAP-042: Auto Follow-Up Suggestion After New Prescription Not Wired
**Status**: RESOLVED
**Session**: 14 Q7
**Answer**: FR-043 updated — upon prescription finalisation, if the session notes
"Recommended next session" field is blank, auto-populate it with "2 weeks" and show
inline note "Default set to 2 weeks — recommended after new medication initiation."
Psychiatrist can change or clear it. Links FR-043 and FR-046 to reduce missed medication
initiation review risk.
**FRs Updated**: FR-043 updated
**Entities Updated**: None

---

### GAP-043: MCI Number Required on WhatsApp Message Content
**Status**: RESOLVED
**Session**: 14 Q8
**Answer**: MCI registration number added to both message types. FR-019 Tier 2: all
messages referencing a specific psychiatrist must use "Dr. [Name] (MCI Reg: [number])"
format. FR-043 prescription delivery WhatsApp template updated to include MCI number.
Satisfies Telemedicine Practice Guidelines 2020.
**FRs Updated**: FR-019, FR-043 updated
**Entities Updated**: None

---

### GAP-044: Mental Status Examination (MSE) Missing from Session Notes
**Status**: RESOLVED
**Session**: 14 Q9
**Answer**: MSE added to FR-015b as a distinct optional free-text area — separate labeled
field from "clinical observations / progress notes" to preserve clinical distinction.
Psychiatrist documents all 10 MSE domains in their own format. Structured 10-domain MSE
form deferred to v2 once real clinical workflow is understood.
**FRs Updated**: FR-015b updated
**Entities Updated**: CareRecommendation (MSE free-text field)

---

### GAP-045: Prescription → Medication Reminder Link Undefined
**Status**: RESOLVED
**Session**: 14 Q10
**Answer**: FR-021b added. On prescription finalisation, medications appear in patient's
"My Medications" profile section. Patient sets daily reminder time per medication (optional).
Platform sends Tier 3 WhatsApp reminder at that time daily for the prescription duration,
then stops automatically. No reminder if patient doesn't set a time. Patient can
update/cancel from profile. Respects daily cap (FR-020) and global WhatsApp toggle (FR-021).
**FRs Updated**: FR-021b added
**Entities Updated**: Prescription (drives reminder schedule); NotificationEvent (medication reminder type)

---

### GAP-046: Patient Self-Report Fields Missing from Follow-Up Notes
**Status**: RESOLVED
**Session**: 14 Q11
**Answer**: Subjective (Patient Self-Report) section added to FR-015b for Follow-Up and
Urgent Review sessions only (not Initial Assessment). Fields: medication adherence
(dropdown + notes), side effects (free text), symptom trajectory (dropdown), sleep
quality, appetite, significant life events. All optional. Psychiatrist fills based on
patient's report at session start.
**FRs Updated**: FR-015b updated
**Entities Updated**: CareRecommendation (Subjective SOAP fields)

---

### GAP-047: Identity Verification at Consultation Time Undefined
**Status**: RESOLVED
**Session**: 14 Q12
**Answer**: Mandatory identity verification checkbox added to FR-015b required fields:
"I have verbally confirmed this patient's name and date of birth at the start of this
session." Psychiatrist cannot approve session record without checking it. Checkbox
completion is audit-logged with timestamp and session reference. Satisfies Telemedicine
Practice Guidelines 2020 active identity confirmation requirement.
**FRs Updated**: FR-015b updated
**Entities Updated**: None (audit log entry)

---

## LOW / REVIEW Gaps — Research vs. Spec Cross-Reference (2026-05-04)

### GAP-048: Video-Only Policy for All v1 Sessions — Review
**Status**: RESOLVED
**Session**: 14 Q13
**Answer**: Confirmed by design — video-only (Zoom) for all three session types in v1.
Audio-only for Follow-Up remains deferred to v2 as already noted in Future Readiness.
No spec change required.
**FRs Updated**: None
**Entities Updated**: None

---

### GAP-049: Medication Initiation Review as Distinct Session Type
**Status**: RESOLVED
**Session**: 14 Q14
**Answer**: Kept merged into Follow-Up by design. Session mechanics are identical
(Zoom, same notes form, same payment flow). 4th session type adds enum, fee, and
availability complexity with no v1 functional benefit. Psychiatrist context (2-week
auto-suggested interval post-prescription via FR-042/FR-043) is sufficient signal.
Distinct session type deferred to v2.
**FRs Updated**: None
**Entities Updated**: None

---

### GAP-050: Investigation Reports Attachment Not Modelled
**Status**: RESOLVED
**Session**: 14 Q15
**Answer**: Deferred to v2. In v1, psychiatrists ask patients to email investigation
reports directly — outside the platform. Psychiatrist can reference results in the
free-text clinical observations field of FR-015b. File upload infrastructure (storage,
validation, encryption, retention, anonymisation) is a meaningful build not justified
for v1. Added to Future Readiness section.
**FRs Updated**: None (Future Readiness note added)
**Entities Updated**: None

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
| GAP-028 | RESOLVED | Session 10 Q1 | Three types: Initial Assessment (video-only), Follow-Up (any mode), Urgent Review (video-preferred); FR-042 added |
| GAP-029 | RESOLVED | Session 10 Q2 | Video only in v1; audio-only + text-based modes deferred to v2 Future Readiness |
| GAP-030 | RESOLVED | Session 10 Q3 | E-prescription tool added; FR-043; MCI reg number on PsychiatristProfile; Prescription entity added |
| GAP-031 | RESOLVED | Session 10 Q3 | List C hard block; FR-044; List C list in PlatformConfiguration |
| GAP-032 | RESOLVED | Session 13 Q1 | Follow-up interval picker in session notes; WhatsApp nudge on date; FR-046 added |
| GAP-033 | RESOLVED | Session 13 Q2 | 3 fees per psychiatrist by session type; bulk update for Agency Admin + Platform Admin; FR-023a |
| GAP-034 | RESOLVED | Session 13 Q3 | FR-015b expanded with Form B-1 fields; declaration checkbox before approval; 7-year retention |
| GAP-035 | RESOLVED | Session 13 Q4 | Deferred to v2; string enum session_type in v1 enables no-migration addition later |
| GAP-036 | RESOLVED | Session 14 Q1 | No v1 enforcement (deferred to v2); static List B reference panel in prescription tool; PlatformConfiguration |
| GAP-037 | RESOLVED | Session 14 Q2 | Renamed to Urgent Review (returning patients only); helplines always visible; not a crisis service; FR-042 |
| GAP-038 | RESOLVED | Session 14 Q3 | Recording disclosure added to FR-005 consent screen; consent record timestamps it; DPDPA 2023 satisfied |
| GAP-039 | RESOLVED | Session 14 Q4 | Optional profile fields for advance directive + nominated rep; read-only in session notes; documentation only |
| GAP-040 | RESOLVED | Session 14 Q5 | Two-nudge re-engagement: 24h + 7 days (suppressed if booked); FR-047 added |
| GAP-041 | RESOLVED | Session 14 Q6 | FR-036 unified: covers DPDPA + MHCA Form A in one 72h flow; package expanded to full clinical records |
| GAP-042 | RESOLVED | Session 14 Q7 | FR-043 auto-populates "2 weeks" in follow-up field on prescription finalisation if blank; psychiatrist can override |
| GAP-043 | RESOLVED | Session 14 Q8 | MCI Reg added to FR-019 Tier 2 messages and FR-043 prescription WhatsApp template |
| GAP-044 | RESOLVED | Session 14 Q9 | MSE added to FR-015b as optional free-text area; distinct from clinical observations; structured form deferred to v2 |
| GAP-045 | RESOLVED | Session 14 Q10 | FR-021b added; patient sets reminder time per medication; auto-runs for prescription duration; FR-021/FR-043 linked |
| GAP-046 | RESOLVED | Session 14 Q11 | Subjective SOAP section added to FR-015b for Follow-Up/Urgent Review; adherence, side effects, trajectory, sleep, appetite, life events |
| GAP-047 | RESOLVED | Session 14 Q12 | Mandatory identity verification checkbox in FR-015b; audit-logged; satisfies Telemedicine Guidelines 2020 |
| GAP-048 | RESOLVED | Session 14 Q13 | Confirmed video-only for all v1 session types; audio-only Follow-Up deferred to v2 |
| GAP-049 | RESOLVED | Session 14 Q14 | Kept merged into Follow-Up; 4th session type deferred to v2; mechanics identical in v1 |
| GAP-050 | RESOLVED | Session 14 Q15 | Deferred to v2; v1 psychiatrist asks patient to email reports; results noted in free-text clinical observations |
