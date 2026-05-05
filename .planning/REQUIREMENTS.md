# Requirements

Feature: 001-patient-psychiatrist-match
Source: specs/001-patient-psychiatrist-match/spec.md (fully clarified, 16 sessions, all 62 gaps closed)
Extracted: 2026-05-03
Last updated: 2026-05-05 (merge run — 4 requirements added, 12 updated; Session 16 main + GAP-053–062 UX review)
Status: All v1 requirements ready for planning

---

## Authentication and Account Management

### REQ-patient-registration
**Source**: FR-001
**Description**: Patients register and log in using mobile number with OTP-based verification
only. No password is set or stored at any point. Every login requires a fresh OTP received
via SMS. During registration, patient is offered a WhatsApp notification opt-in checkbox.
**v1**: Yes

### REQ-patient-profile-setup
**Source**: FR-001k
**Description**: Immediately after a patient's first OTP verification (new registration only),
a mandatory one-page profile setup form collects: full name (required), date of birth
(required), and address (street, city, state, PIN code — all required). The patient must
complete this form before the consent screen or intake questionnaire. Skipped on all
subsequent logins. Fields stored on PatientProfile and auto-populated onto prescriptions
(FR-043) without re-prompting the patient.
**v1**: Yes

### REQ-otp-security
**Source**: FR-001a
**Description**: OTP expiry (5 min), lockout (3 failed attempts → 15-minute lockout), and
invalidation (new OTP request immediately invalidates previous OTP) rules for patient auth.
**v1**: Yes

### REQ-otp-sms-failover
**Source**: FR-001i
**Description**: Automatic failover to backup SMS provider if primary fails within 30
seconds. "Resend OTP" available after 60 seconds. All SMS delivery attempts audit-logged
without logging the OTP value.
**v1**: Yes

### REQ-account-inaccessibility-on-number-loss
**Source**: FR-001j
**Description**: In v1, account is bound exclusively to registered mobile number. Patient
entity primary key must be a UUID (not mobile number) to enable future number updates.
Login screen shows clear message directing patients with lost numbers to support.
**v1**: Yes

### REQ-session-expiry
**Source**: FR-001c
**Description**: Authenticated web sessions expire after 30 minutes of inactivity or 8-hour
absolute maximum, whichever comes first. Applies to all roles. Expiry redirects user to
login with a clear message.
**v1**: Yes

### REQ-non-patient-auth
**Source**: FR-001b
**Description**: Psychiatrists, agency admins, and platform admins authenticate via email +
password + TOTP (mandatory, non-disableable). Accounts are platform-created and activated
via a time-limited one-time email link. TOTP setup completes during activation.
**v1**: Yes

### REQ-password-reset-non-patient
**Source**: FR-001d
**Description**: Non-patient users reset password via a 30-minute time-limited email link.
After reset, the active session is invalidated. TOTP is not reset during a password reset.
**v1**: Yes

### REQ-account-provisioning
**Source**: FR-001h
**Description**: Strict provisioning hierarchy: PlatformAdmins create other PlatformAdmins
and first AgencyAdmin per agency. AgencyAdmins create additional AgencyAdmins and
Psychiatrists for their own agency. All creation triggers a time-limited activation email
(default 24h) for password and TOTP enrollment. Psychiatrist profile activation requires
only mandatory fields (name, MCI registration number, email); optional profile fields
(photo, bio, languages, specialisation) may be completed post-activation. A psychiatrist
profile is hidden from the patient-facing matching pool until the Agency Admin has set at
least one session-type fee and the psychiatrist has published at least one availability slot.
**v1**: Yes

### REQ-password-policy
**Source**: FR-001g
**Description**: Non-patient passwords must have ≥12 characters, one uppercase letter, one
digit, one special character. Policy enforced at activation, reset, and change. Rules stored
in PlatformConfiguration and editable by Platform Admins.
**v1**: Yes

### REQ-account-lockout-non-patient
**Source**: FR-001f
**Description**: 3 consecutive failed password attempts lock the non-patient account for
15 minutes. Remaining lockout time is displayed. Threshold and duration in
PlatformConfiguration.
**v1**: Yes

### REQ-totp-recovery
**Source**: FR-001e
**Description**: TOTP reset is performed exclusively by a Platform Admin via the admin
portal after out-of-band identity verification. Every reset produces an immutable audit
log entry. User must re-enroll TOTP before accessing any functionality after reset.
**v1**: Yes

---

## Patient Intake and Consent

### REQ-explicit-consent
**Source**: FR-005
**Description**: Explicit informed consent must be obtained before storing any sensitive
health data, with clear explanation of what is stored and why. Consent is a hard gate —
if the patient declines, their partial account (mobile number and OTP record only) is
deleted immediately. No partial access, browse-only mode, or grace period. No consent,
no platform access.
**v1**: Yes

### REQ-intake-questionnaire
**Source**: FR-002, FR-003, FR-004
**Description**: Structured intake questionnaire covering presenting symptoms, severity,
mental health history, current medications, lifestyle factors, and psychiatrist preferences
(gender, language). Each section displays a section counter ("Section 2 of 6") and an
estimated completion time for the remaining sections. Progress saved after each section
(resumable). A patient who exits mid-questionnaire is deep-linked directly back to the
last incomplete section on next login — no re-answering completed sections, no
hunting through the intake from the start. Completion creates a normalised, queryable
patient profile and redirects to matching.
**v1**: Yes

### REQ-intake-editability
**Source**: FR-004a
**Description**: Patients can view and edit intake responses at any time from their profile.
Each edit is timestamped; full edit history is retained. All psychiatrists with an active
booking window for that patient receive an in-platform notification on any edit.
**v1**: Yes

---

## Psychiatrist Matching

### REQ-psychiatrist-matching
**Source**: FR-006, FR-007, FR-008, FR-009, FR-010, FR-010a
**Description**: Scoring-based matching engine across all eligible psychiatrists from all
active agencies. Factors: symptom type, severity, patient preferences (language, gender),
availability, and rating percentile. All factor weights in PlatformConfiguration. Booking
screen shows "Previously seen" (prior bookings, sorted by most recent — each card shows
percentile rank and Follow-Up fee, the correct session-type fee for a returning patient)
and "Find new match" (full algorithm, up to 5 ranked results — each card shows the
session-type fee that applies: Initial Assessment fee for patients with no prior completed
session with that psychiatrist; Follow-Up fee for patients with at least one prior completed
session with that psychiatrist). The fee shown on every match card is the exact fee charged
at checkout — no adjustment, no surprise. Never shows a dead-end — "closest available"
label used when scores fall below configurable threshold. Idempotent booking prevents
double-booking.
**v1**: Yes

---

## Availability Management

### REQ-availability-management
**Source**: FR-023a, FR-024, FR-025, FR-026
**Description**: Three session-type fees per psychiatrist (Initial Assessment, Follow-Up,
Urgent Review) set by the Agency Admin; bulk update supported. Fees locked into the Payment
record at booking confirmation and displayed on the match list. Slots created by agency
admins or psychiatrists within a configurable maximum horizon (default 3 months). Overlap
prevention at creation. When a booked slot is blocked or deleted, affected patient is
notified, appointment is cancelled, and patient is prompted to rebook.
**v1**: Yes

---

## Appointment Booking and Payment

### REQ-appointment-booking
**Source**: FR-011, FR-011a, FR-011b, FR-011c, FR-011d, FR-011e
**Description**: Real-time availability check at slot selection. Slot held up to 10 minutes
during checkout; a visible countdown timer is displayed throughout checkout, with a 2-minute
warning alert ("Only 2 minutes left to complete payment — your slot will be released").
Razorpay INR payment with three-path confirmation (HMAC signature, webhook, reconciliation
job every 15 min). Payment confirmed but booking cannot complete → immediate full refund.
Zoom meeting created on booking confirmation (up to 3 retries; on all-retry failure: cancel
booking, full refund, notify patient and psychiatrist, log as operational metric).
Server-side idempotency key prevents duplicate charges.
**v1**: Yes

### REQ-session-types
**Source**: FR-042
**Description**: Three session types: Initial Assessment (60 min; patient's first consultation;
video only; auto-assigned), Follow-Up (30 min; all subsequent consultations after at least
one completed Initial Assessment), Crisis/Urgent (60 min; emergency; available only after one
completed Initial Assessment; bypasses normal matching; shows next available slot across all
eligible psychiatrists). Durations derived from session_type via PlatformConfiguration.
session_type displayed in all booking confirmations, appointment views, and session records.
**v1**: Yes

### REQ-cancellation-refund
**Source**: FR-012, FR-012a, FR-012b
**Description**: Cancellations ≥24h before session: full Razorpay refund. Cancellations
<24h: non-refundable; confirmation modal must show exact fee forfeited and offer a
"Reschedule instead?" option before the patient can confirm cancellation. Rescheduling =
guided cancel-then-rebook (no separate state machine). Psychiatrist cancellations always
issue full refund. Psychiatrist deactivation: before deactivation is confirmed, Platform
Admin sees an impact preview (number of upcoming confirmed bookings, total refund amount
in INR, affected dates and session types); Platform Admin must type the psychiatrist's MCI
registration number to confirm deactivation. On confirmation: immediate cancel and full
refund for all upcoming bookings; patients notified with admin-supplied reason and rebook
link. All refund notifications state "5–7 business days".
**v1**: Yes

### REQ-no-show-handling
**Source**: FR-045, FR-047
**Description**: Psychiatrist no-show auto-detected via Zoom webhook participant data.
Refund governed by PlatformConfiguration toggle (default: auto-refund mode). Auto mode:
immediate full refund, patient notified via SMS + WhatsApp with rebook link, Agency Admin
and Platform Admin alerted. Manual-review mode: 24-hour SLA for Platform Admin decision.
Both modes: no-show event is audit-logged. Patient no-show: appointment marked
no-show-by-patient; fee non-refundable; psychiatrist prompted to add notes or skip.
A two-nudge re-engagement sequence is sent via WhatsApp: Nudge 1 (24h after no-show —
configurable) re-engagement message with rebook link; Nudge 2 (7 days after no-show —
configurable) second re-engagement message, only if no new confirmed booking exists at
send time. Both nudges respect the daily notification cap. No further nudges after Nudge 2.
Both nudge events are audit-logged. Nudge timings configurable in PlatformConfiguration.
**v1**: Yes

---

## Session Delivery and Clinical Records

### REQ-psychiatrist-data-access
**Source**: FR-013, FR-013a, FR-014, FR-018, FR-018a
**Description**: Psychiatrists access: patient intake responses, structured CareRecommendations
from all psychiatrists within access window, and raw Zoom transcripts for their own sessions
only. Psychiatrist portal shows upcoming appointments with Zoom join link prominently. Access
expires 3 months (default, configurable) after last completed session with no new booking.
Booking-driven access model; no "active relationship" concept.
**v1**: Yes

### REQ-session-transcript-and-care-recommendation
**Source**: FR-015, FR-015a, FR-015b, FR-015c, FR-015d, FR-016
**Description**: After each session, Zoom transcript received via webhook generates a
structured draft CareRecommendation for psychiatrist review. No automated update to patient
profile without explicit psychiatrist approval. If no transcript within 60 minutes of
session end: psychiatrist notified, prompted to enter manually, failure audit-logged.
Psychiatrists can also add recommendations manually. All approved recommendations appended
to patient's permanent record, timestamped and attributed. Raw transcripts retained 7 years,
anonymised (not deleted) when deletion job runs. CareRecommendation captures all mandatory
MHCA 2017 Form B-1 fields: presenting complaints, clinical observations, treatment type,
treatment consent checkbox ("The patient has given verbal consent to the treatment discussed
in this session" — satisfies MHCA 2017 per-session consent documentation requirement),
identity verification checkbox (audit-logged), investigations ordered, MSE (distinct free-text
area), Subjective SOAP (Follow-Up/Urgent Review only), advance directive reference, and Form
B-1 declaration checkbox required before approval. After a session note is approved, the
platform immediately presents the psychiatrist with a mandatory prompt: "Issue Prescription"
or "No prescription needed" — this prompt cannot be dismissed; it records the prescription
decision for the session.
**v1**: Yes

### REQ-e-prescription
**Source**: FR-043
**Description**: E-prescription tool accessible from session record after session ends.
Mandatory fields auto-populated from PsychiatristProfile (name, qualifications, MCI number,
clinic) and PatientProfile (name, age, address, ID verification record). Generic drug names
stored and displayed in CAPITAL LETTERS. Psychiatrist confirmation acts as digital signature.
Prescription PDF downloadable from patient's appointment history and sent via WhatsApp if
enabled. Retained 7 years. Amendments allowed within 24 hours; original retained in audit
history. Prescription is optional per session. Upon prescription finalisation, a prompt is
shown to the patient the next time they view their profile: "Would you like to set up a daily
reminder for [DRUG NAME]?" — one prompt per newly prescribed medication; patient can set a
reminder time or dismiss. This prompt surfaces the FR-021b medication reminder opt-in
without requiring the patient to navigate to settings manually.
**v1**: Yes

### REQ-list-c-drug-block
**Source**: FR-044
**Description**: Hard block on all List C drugs (e.g., alprazolam, diazepam, lorazepam,
zolpidem, methylphenidate, modafinil, phenobarbitone, depot antipsychotics). Block is
immediate, no override, no bypass. Warning names the specific drug and cites the legal
restriction. Blocked attempts audit-logged. List C maintained in PlatformConfiguration.
**v1**: Yes

### REQ-patient-care-history
**Source**: FR-017
**Description**: Patient portal shows complete care history — all past sessions and
recommendations in a timeline view. Zoom join link prominently displayed for each upcoming
confirmed appointment.
**v1**: Yes

### REQ-pre-session-digest
**Source**: FR-016a
**Description**: When a psychiatrist opens a patient's profile in the psychiatrist portal,
a collapsible "Pre-Session Digest" panel is displayed at the top of the patient view. The
panel contains: last session date and key care recommendations from that session, any
intake questionnaire changes the patient has made since the last session (flagged with
change date), currently active medications from the latest finalised prescription, and
follow-up status (whether the patient has booked a follow-up as recommended). The panel
is collapsed by default on first open; the psychiatrist can expand it. It is only shown
when the patient has at least one prior approved session on the platform. Read-only.
**v1**: Yes

---

## Post-Session Feedback and Ratings

### REQ-post-session-feedback
**Source**: FR-037, FR-038, FR-039, FR-040
**Description**: Feedback prompt surfaced after session completion (Zoom webhook). Patient
can skip once; reappears on next login until submitted or explicitly dismissed a second time.
Collects 1–5 star rating and structured qualitative dimensions. Raw ratings visible only to
Platform Admins and Agency Admins. Patients see percentile band (e.g., "Top 5%") on match
list. Psychiatrists see their own aggregate signal (average, percentile, trend) only when
enabled by Platform Admin. Configurable eligibility rules automatically remove psychiatrists
from new-patient matching pool when rating falls below thresholds. Existing bookings
honoured. Psychiatrists not notified of ineligibility status. New psychiatrists shown as
"New". All thresholds and band boundaries configurable by Platform Admins via dashboard UI.
**v1**: Yes

---

## Notifications

### REQ-personalised-notifications
**Source**: FR-019, FR-020, FR-021, FR-021a, FR-022, FR-023
**Description**: Three-tier system. Tier 1 (OTP/Auth): SMS always; not configurable. Tier 2
(Booking confirmations and reminders): SMS + WhatsApp if enabled; reminders at 48h, 2h, 15min
before session; only future windows queued at booking time. Tier 3 (Care reminders —
medication reminders, activity nudges, follow-up prompts): WhatsApp only; requires resolved
WhatsApp number and WhatsApp toggled on; not sent to patients with no active care plan.
Care reminder timing fully per-patient; no platform-wide schedule. On preference update, all
pending Tier 3 reminders cancelled and rescheduled immediately. Daily cap on Tier 3
(default 3, patient-adjustable). WhatsApp delivery failures audit-logged; no SMS fallback
for Tier 3. WhatsApp number stored as entered with helper note shown; SMS is fallback if
WhatsApp number is invalid (GAP-025 resolved).
**v1**: Yes

### REQ-follow-up-nudge
**Source**: FR-046
**Description**: When approving a CareRecommendation, the psychiatrist sets a follow-up
interval (e.g., "2 weeks", "1 month") via an interval picker. The platform fires a
WhatsApp nudge to the patient at the configured interval after the session date, prompting
them to book their next appointment. Fires only if the patient has no confirmed upcoming
booking with any psychiatrist at the time the nudge is scheduled to send.
**v1**: Yes

### REQ-medication-reminders
**Source**: FR-021b
**Description**: Per-medication opt-in daily reminder. Upon prescription finalisation,
each medication appears in the patient's "My Medications" profile section. For each
medication the patient may set a daily reminder time. If set, the platform sends a daily
WhatsApp reminder at that time using a WhatsApp Business API button template. The message
includes the generic drug name (CAPITAL LETTERS), dosage, frequency, and prescribing
psychiatrist's name, plus a single quick-reply button: "Mark as taken". Patient tap of
"Mark as taken" records an adherence confirmation event (medication ID, patient ID,
timestamp). Non-response = unconfirmed — not counted as non-adherent. Adherence
confirmation events are the data source for the FR-017a medication adherence streak.
Reminders stop automatically on the final day of the prescription duration. Patient can
update or cancel reminder settings at any time from their profile. Reminders respect the
daily Tier 3 cap and the global WhatsApp toggle. The WhatsApp button template must be
Meta/WhatsApp-approved before launch (CONSTRAINT-034).
**v1**: Yes

### REQ-patient-progress-dashboard
**Source**: FR-017a
**Description**: The patient dashboard includes a "Your Progress" view — a plain-language
longitudinal summary of the patient's care journey. No clinical jargon, no automated
diagnosis, no AI-generated assessments. Four components: (1) Symptom trajectory — per-session
indicator (Improved / Stable / Worsened) sourced from approved session notes, presented as a
simple visual timeline; (2) Medication adherence streak — consecutive days on which the
patient tapped "Mark as taken" on at least one medication reminder (FR-021b adherence
confirmation events); days with no active reminder excluded from streak; (3) Sessions
completed counter — total number of approved sessions; (4) Recommended next session —
date from the most recent approved session note, displayed as "Dr. [Name] recommends
checking in around [date]" with a direct "Book now" link. Not shown until the patient has
at least one approved session. No population benchmarking, no automated prognosis.
**v1**: Yes

### REQ-medication-initiation-safety-net
**Source**: FR-048
**Description**: When a prescription is finalised, the platform compares its medications
against all prior approved prescriptions for the same patient. Medications not present in
any prior prescription are classified as "new initiations." For each new initiation, two
triggers fire: (a) Patient WhatsApp nudge 7 days after prescription finalisation — "You've
been on [DRUG NAME] for a week. How are you feeling? Dr. [Name] (MCI Reg: [number])
recommended a check-in around now — [booking link]." Suppressed if patient already has a
confirmed upcoming booking at send time. (b) Psychiatrist dashboard notification from day 7
until patient books follow-up or 30 days elapse — "Medication initiation review due:
[Patient first name] — [DRUG NAME] initiated [date]. [Book link]." Drug comparison is
case-insensitive and normalised. Both trigger events are audit-logged. No trigger fired for
medications already in any prior prescription. Patient nudge delay (default 7 days) and
psychiatrist notification expiry (default 30 days) are configurable in PlatformConfiguration.
**v1**: Yes

---

## Billing and Invoicing

### REQ-gst-invoice
**Source**: FR-041
**Description**: GST-compliant tax invoice generated for every confirmed paid booking.
Mandatory fields: booking reference, session date and time, psychiatrist name, session fee,
applicable GST amount and rate, GSTIN of issuing entity, and sequential invoice number in
format `[PREFIX]/[FY]/[SEQUENCE]` (e.g., `MHP/2026-27/00001`). Invoice number is
auto-incrementing, gapless, resets April 1 each financial year; prefix configurable in
PlatformConfiguration; invoice_number field on Payment entity is immutable once issued.
Delivered to patient within 24 hours of payment confirmation or available from booking history.
Pre-implementation decision required: GSTIN ownership (platform company vs. agency) must
be confirmed with a chartered accountant before implementation (CONSTRAINT-024).
**v1**: Yes

---

## Data Governance

### REQ-data-lifecycle
**Source**: FR-028, FR-029, FR-030, FR-031, FR-032
**Description**: Centralised Data Lifecycle Service using a typed job queue. Three types:
On-Demand (patient-initiated, 72h SLA, single nudge at 48h inactivity if WhatsApp present),
Abandoned Account Cleanup (30-day no-login + incomplete intake, 24h SLA, 48h nudge first),
Data Expiry (daily scan, last activity >7 years, 24h SLA). When a patient initiates an
on-demand deletion from their profile settings, before the deletion request is confirmed
the platform displays a "Download your records first" prompt with a one-tap trigger for the
FR-036 data export — so the patient can retrieve their data before it is deleted. The patient
can then confirm deletion or cancel. Two-phase pipeline: Phase 1 — PII erasure (name,
mobile, WhatsApp, email, payment details, device tokens, raw identifiers in logs); Phase 2
— Clinical Record Anonymisation (patient identifiers replaced with pseudonymous ID; records
retained 7 years). Every job produces a PII-free audit entry retained permanently. Job queue
status (pending, processing, completed, SLA-breached by type) exposed to Platform Admins;
no PII visible.
**v1**: Yes

### REQ-data-export
**Source**: FR-036
**Description**: Patient self-service data export from profile settings satisfying both DPDPA
2023 data portability rights and MHCA 2017 Section 25 Form A patient records access rights
in a single unified flow. Async export job enqueued; patient receives immediate on-screen
acknowledgement; secure time-limited download link delivered via WhatsApp (if enabled) and
SMS within 72 hours. Export includes: intake questionnaire responses, all approved session
notes / care recommendations (all psychiatrists), appointment history, notification
preferences, and the patient's own submitted SessionFeedback records. Raw Zoom transcripts
are excluded (intermediate artifact, not formal clinical record). Prescription PDFs are
excluded — prescriptions are formal clinical documents (not patient-authored data); patients
access them individually as downloads from their appointment history page (FR-043). Download
link expires after 48 hours. Export jobs are visible in the Platform Admin deletion dashboard.
**v1**: Yes

---

## Platform Configuration

### REQ-platform-configuration-store
**Source**: FR-035
**Description**: All platform time-based thresholds and configurable limits stored in a
PlatformConfiguration store editable by Platform Admins without a code change or deployment.
Changes take effect immediately. Covers: psychiatrist access window, OTP expiry, lockout
thresholds, session timeouts, slot hold duration, Zoom transcript wait window, reconciliation
job interval, abandoned account thresholds, retention periods, password policy, activation
link expiry, appointment reminder intervals, daily Tier 3 cap, rating eligibility rules,
matching weights, percentile band labels, match result list size, score thresholds, session
type durations, slot publication horizon, no-show refund mode, List C drug list,
patient no-show re-engagement nudge 1 delay (default: 24 hours after no-show),
patient no-show re-engagement nudge 2 delay (default: 7 days after no-show),
medication initiation patient nudge delay (default: 7 days after prescription finalisation),
medication initiation psychiatrist notification expiry (default: 30 days if no follow-up
booked), and all other configurable values throughout the spec.
**v1**: Yes

---

## Admin Portals

### REQ-platform-admin-portal
**Source**: FR-033, FR-034
**Description**: Platform Admin portal for internal ops staff only. Capabilities: deletion
job dashboard (no PII; includes patient data export job statuses — pending, processing,
completed, enqueue timestamp, completion timestamp; no patient PII visible), payment
reconciliation flags, Zoom transcript failure logs, WhatsApp and SMS delivery failure logs,
manual Razorpay refunds, account deactivation, TOTP reset (audit-logged), PlatformAdmin
and first AgencyAdmin account creation, rating and matching settings panel (eligibility
thresholds, percentile band labels, matching weights — immediate effect, audit-logged), and
a unified alert triage panel at the top of the Operations Dashboard — surfaces no-show
decisions pending action, patient deletion SLA warnings, and failed refunds requiring
manual intervention, sorted by urgency with SLA countdown per item. Zero access to
patient clinical data under any circumstance.
**v1**: Yes

### REQ-agency-management
**Source**: FR-027, Agency entity
**Description**: Multi-agency support from day one. Agency entity with name, contact details,
and active/inactive status. Psychiatrists belong to exactly one agency. AgencyAdmins scoped
to one agency — view and manage only their own agency's psychiatrists and availability.
AgencyAdmins cannot access patient clinical data or other agencies' psychiatrists. Matching
pool is platform-wide across all active agencies.
**v1**: Yes

---

## Success Criteria (Non-Functional Acceptance)

### REQ-success-criteria
**Source**: SC-001 through SC-018
**Description**: Measurable performance and reliability targets for v1 launch.
- SC-001: New patient completes registration and full intake in under 10 minutes
- SC-002: First ranked match list returned within 5 seconds of intake completion
- SC-003: 90% of patients who begin intake complete it within a single session or across resumed sessions within 48 hours
- SC-004: Booking from match selection to confirmation completable in under 3 minutes
- SC-005: Psychiatrist accesses patient's complete intake summary and history within 10 seconds of opening the patient record
- SC-006: Psychiatrist reviews and approves a transcript-generated draft CareRecommendation in under 2 minutes for a standard session
- SC-007: Personalised notifications delivered within ±5 minutes of patient's stated preferred time
- SC-008: Notification delivery success rate ≥95% across all active patients
- SC-009: Zero instances of double-booking a psychiatrist for the same time slot
- SC-010: All patient data access events recorded in audit log and retrievable by compliance teams within 24 hours
- SC-011: Patient account deletion requests fully processed within 72 hours
- SC-012: No patient PII accessible after deletion request completion
- SC-013: Platform supports ≥500 concurrent users without performance degradation
- SC-014: Platform availability ≥99.5% measured monthly
- SC-015: System architecture supports scaling to 5,000 concurrent users without structural changes
- SC-016: Zero instances of a patient being charged without either a confirmed booking or an automatic full refund within 15 minutes
- SC-017: Booking confirmation displayed to patient within 5 seconds of payment completion (Path 1)
- SC-018: Zoom meeting creation failures logged as operational metrics and reviewable by Platform Admins
**v1**: Yes

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-patient-registration | Phase 1 | Pending |
| REQ-otp-security | Phase 1 | Pending |
| REQ-otp-sms-failover | Phase 1 | Pending |
| REQ-account-inaccessibility-on-number-loss | Phase 1 | Pending |
| REQ-session-expiry | Phase 1 | Pending |
| REQ-non-patient-auth | Phase 1 | Pending |
| REQ-password-reset-non-patient | Phase 1 | Pending |
| REQ-account-provisioning | Phase 1 | Pending |
| REQ-password-policy | Phase 1 | Pending |
| REQ-account-lockout-non-patient | Phase 1 | Pending |
| REQ-totp-recovery | Phase 1 | Pending |
| REQ-patient-profile-setup | Phase 2 | Pending |
| REQ-explicit-consent | Phase 2 | Pending |
| REQ-intake-questionnaire | Phase 2 | Pending |
| REQ-intake-editability | Phase 2 | Pending |
| REQ-platform-configuration-store | Phase 2 | Pending |
| REQ-availability-management | Phase 3 | Pending |
| REQ-psychiatrist-matching | Phase 3 | Pending |
| REQ-appointment-booking | Phase 3 | Pending |
| REQ-session-types | Phase 3 | Pending |
| REQ-cancellation-refund | Phase 3 | Pending |
| REQ-no-show-handling | Phase 3 | Pending |
| REQ-psychiatrist-data-access | Phase 4 | Pending |
| REQ-session-transcript-and-care-recommendation | Phase 4 | Pending |
| REQ-e-prescription | Phase 4 | Pending |
| REQ-list-c-drug-block | Phase 4 | Pending |
| REQ-patient-care-history | Phase 4 | Pending |
| REQ-pre-session-digest | Phase 4 | Pending |
| REQ-post-session-feedback | Phase 8 | Pending |
| REQ-personalised-notifications | Phase 5 | Pending |
| REQ-follow-up-nudge | Phase 5 | Pending |
| REQ-medication-reminders | Phase 5 | Pending |
| REQ-patient-progress-dashboard | Phase 5 | Pending |
| REQ-medication-initiation-safety-net | Phase 5 | Pending |
| REQ-gst-invoice | Phase 6 | Pending |
| REQ-data-lifecycle | Phase 6 | Pending |
| REQ-data-export | Phase 6 | Pending |
| REQ-platform-admin-portal | Phase 7 | Pending |
| REQ-agency-management | Phase 7 | Pending |
| REQ-success-criteria | All phases | Pending |
