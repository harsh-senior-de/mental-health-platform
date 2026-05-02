# Spec Gaps Tracker: 001-patient-psychiatrist-match

**Purpose**: Track all identified gaps, assumptions, and unresolved decisions in the spec.
Clarification sessions MUST read this file first and resolve OPEN gaps in priority order
before asking new questions.

**Last Updated**: 2026-05-02
**Total Gaps**: 14
**Resolved**: 14
**Open Critical**: 0
**Open Important**: 0

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
