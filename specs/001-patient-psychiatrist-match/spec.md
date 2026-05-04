# Feature Specification: Mental Health Platform — Patient Intake, Psychiatrist Matching & Personalized Care

**Feature Branch**: `001-patient-psychiatrist-match`
**Created**: 2026-05-01
**Status**: Draft
**Input**: User description: "Hims & Hers Mental Health India Edition — a platform where patients log in, answer detailed mental health intake questionnaires, and are matched with the right psychiatrist from a partner agency. The platform does two things: (a) match patients to the best-fit psychiatrist based on their specific needs and facilitate bookings through the platform, with the agency's psychiatrists using the platform to access patient info; (b) build a long-term patient profile with memory of their history and psychiatrist recommendations, driving personalized notifications (medication reminders, walk reminders, etc.) timed to each individual's preferences."

## Clarifications

### Session 2026-05-01

- Q: What is the actual format of a psychiatry session on this platform? → A: Video call only via Zoom. The platform creates a Zoom meeting via the Zoom API when a booking is confirmed and includes the join link in the confirmation. After the session, Zoom sends a webhook with the transcript; the transcript generates a draft care recommendation that the psychiatrist reviews and approves before it updates the patient profile.
- Q: Who controls and updates a psychiatrist's available time slots on the platform? → A: Both the agency admin and each psychiatrist. Agency admins can create, update, and block slots for any psychiatrist on the platform. Psychiatrists can manage their own slots directly. All changes take effect immediately for new bookings.
- Q: When and how does the patient pay for a session? → A: Patient pays on the platform at booking time via Razorpay. The slot is held temporarily during checkout but confirmed only after payment succeeds. If payment fails the slot is released. Cancellations made ≥24 hours before the session receive a full refund via Razorpay; cancellations within 24 hours are non-refundable.
- Q: What happens when the matching engine finds no strong match for a patient? → A: The system always shows the best available psychiatrists regardless of match score. When scores fall below a defined threshold, the list is shown with a visible "closest available" indicator so the patient understands these are not ideal matches. The patient can still book any of them.
- Q: How long is patient data retained, and what happens on a deletion request? → A: Patient data is retained for 7 years from the date of last platform activity, then automatically purged. On a deletion request, all PII (name, contact, payment details) is deleted immediately. Clinical records (intake responses, transcripts, care recommendations) are anonymised — identifiers replaced with a pseudonymous ID — and retained for audit and legal purposes. Deletion requests are processed within 72 hours.

### Session 2026-05-02

- Q: How do returning patients log in after account creation? → A: OTP on every login — no password. Patient enters their mobile number, receives an OTP via SMS, and is logged in. No password is set or stored.
- Q: Can a patient have more than one active psychiatrist at the same time? → A: Superseded — see Session 2026-05-02 GAP-001 entry. The "active relationship" concept has been removed entirely in favour of a booking-driven access model.
- Q: What is the expected initial user scale and uptime requirement? → A: Up to 500 concurrent users at launch. 99.5% uptime target (~3.6 hours downtime per month). System must be architected to scale to 10× (5,000 concurrent users) without a structural rewrite.
- Q: What happens when a psychiatrist cancels a confirmed appointment? → A: A full Razorpay refund is always issued to the patient regardless of how close to the session the cancellation happens. The patient is notified via SMS and WhatsApp (if enabled) with a direct link to rebook. The slot is released back to availability.
- Q: What is the platform type and how are notifications delivered? → A: Web application only — no mobile app.
- Q: What happens when a session ends but Zoom delivers no transcript? → A: The psychiatrist is notified within the platform that no transcript was received and is prompted to enter recommendations manually. The failure is logged in the audit trail. No blocking or retry — manual entry via FR-015b serves as the complete fallback.
- Q: Is there a separate internal platform operator role, and what can they access? → A: Yes — a Platform Admin role for the platform's own operations team. Platform Admins have access to system health dashboards (deletion job queue, payment reconciliation flags, Zoom transcript failures, WhatsApp delivery failures, audit logs). They have zero access to patient clinical data (intake, transcripts, recommendations). They can trigger manual refunds and perform account-level actions (deactivate accounts, resolve reconciliation flags). This is the admin for the platform operator's service — distinct from the agency's AgencyAdmin.
- Q: What happens if Razorpay's webhook fails to arrive after a patient is charged? → A: Three-path confirmation strategy with a customer-first guarantee. Path 1 (primary): after payment, Razorpay returns a cryptographically signed response to the browser; the backend verifies the HMAC-SHA256 signature immediately — if valid, booking is confirmed in real-time without waiting for a webhook. Path 2 (backup): webhook fires asynchronously for cases where the browser crashed or network dropped after payment. Path 3 (safety net): a scheduled reconciliation job runs every 15 minutes, queries Razorpay for all platform orders in a non-terminal state older than 10 minutes, and resolves them — PAID triggers booking completion, FAILED/EXPIRED releases the slot. Customer protection guarantee: if payment is confirmed as succeeded by any path but booking cannot be completed for any reason, an immediate automatic refund is issued. The patient is notified via SMS and WhatsApp. Customer money is never held without a confirmed booking.
- Q: Can a psychiatrist read the full raw Zoom transcript text for their assigned patients, or only the structured approved recommendations? → A: Own sessions only (Option C).
- Q: When a patient requests a new OTP while the previous one has not yet expired, what happens to the old OTP? → A: Immediately invalidated (Option A). Issuing a new OTP cancels the previous one regardless of its remaining validity window. Only the most recently issued OTP is ever valid at any point in time.
- Q: How is MFA implemented for psychiatrists, agency admins, and platform admins — TOTP, SMS OTP, or optional? → A: TOTP via authenticator app (Option A), mandatory for all non-patient roles. During account activation (first login), psychiatrists, agency admins, and platform admins MUST set up a TOTP authenticator (Google Authenticator, Authy, or equivalent). Every subsequent login requires email + password followed by a valid TOTP code. MFA is not optional for these roles — it is enforced at the platform level.
- Q: What does "reschedule" mean mechanically — a dedicated flow mutating the booking, or a guided cancel-then-rebook? → A: Guided cancel-then-rebook (Option B). "Reschedule" is a UX shortcut that cancels the current booking applying standard refund rules (FR-012), then immediately routes the patient to the slot-selection screen with the same psychiatrist pre-selected. No separate rescheduling state machine exists. The cancelled appointment is marked with status cancelled-by-patient (rescheduled) in the patient's history to distinguish it from a pure cancellation.
- Q: If the Zoom API call fails at booking confirmation time (after payment is collected), what should happen? → A: Retry then cancel (modified Option B). On booking confirmation, the platform attempts to create a Zoom meeting via the API. If it fails, the platform retries up to 3 times. If all retries fail: cancel the booking, issue an immediate full Razorpay refund, notify the patient via SMS and WhatsApp (if enabled) explaining the failure and that their money has been returned, notify the psychiatrist via in-platform notification, and log the failure as a measurable operational metric. No manual link fallback — if Zoom creation cannot complete automatically, the booking does not proceed.
- Q: Should the intake questionnaire be editable and visible to patients after completion? → A: Yes. Patients can view and edit their intake responses at any time from their profile. When a patient edits their intake, their psychiatrist (any psychiatrist with an active access window) is notified in-platform. Edit history is retained for clinical continuity. Specific questions are provided by clinical advisors and are out of scope for this spec.
- Q: How should post-session feedback work, and how do ratings affect psychiatrist eligibility and matching? → A: Feedback prompt appears immediately in the web app after session completion is detected (via Zoom webhook). Patient rates the session 1–5 and answers structured qualitative dimensions. Raw ratings are never shown to patients — they see a percentile ranking (Top 5%, Top 10%, etc.) on the match list. Raw ratings are visible to Platform Admins and Agency Admins only. Ratings are a weighted factor in the matching algorithm. Eligibility rules (configurable in PlatformConfiguration): ≥5 sessions with avg rating < 2.0 → ineligible for new patient bookings; ≥10 sessions with avg rating < 3.0 → ineligible. Existing confirmed bookings with ineligible psychiatrists are honoured. Weekly patient effectiveness check-ins deferred to v2.
- Q: Who creates AgencyAdmin and PlatformAdmin accounts, and can there be multiple AgencyAdmins per agency? → A: Platform Admin creates all non-patient accounts (Option B). Platform Admin creates all PlatformAdmin accounts and the first AgencyAdmin for each agency. Multiple AgencyAdmins per agency are permitted — additional AgencyAdmins can be created by an existing AgencyAdmin for that agency or by a Platform Admin. Psychiatrist accounts are created by any AgencyAdmin of the same agency.
- Q: What password policy applies to non-patient roles? → A: Minimum 12 characters with at least one uppercase letter, one number, and one special character (Option B). Policy stored in PlatformConfiguration and editable by Platform Admins.
- Q: What is the default maximum number of Tier 3 care reminder notifications per day? → A: Default cap of 3 per day (Option B). Platform default is 3 Tier 3 WhatsApp notifications per day. Patients can raise or lower this cap from their notification preferences. Cap value stored in PlatformConfiguration and editable by Platform Admins. Tier 2 booking reminders and OTPs do not count toward this cap.
- Q: When a booking is placed close to the session time, which appointment reminders fire? → A: Three reminders total (48h, 2h, 15min before session). Only reminders still in the future at the time of booking confirmation are scheduled — past windows are skipped entirely. Booking placed 6h before: 2h and 15min reminders fire. Booking placed 30min before: only 15min fires. Booking placed 10min before: no reminders fire. All reminder windows stored in PlatformConfiguration and editable by Platform Admins.
- Q: What happens when a psychiatrist or admin enters an incorrect password repeatedly? → A: Same lockout as patient OTP (Option A). After 3 consecutive failed password attempts, the account is locked for 15 minutes. The remaining lockout time MUST be displayed. Parameters stored in PlatformConfiguration and editable by Platform Admins.
- Q: Who sets each psychiatrist's session fee, and can one psychiatrist have multiple rates? → A: Agency sets the fee per psychiatrist (Option B). Each psychiatrist has exactly one fixed session fee set by the agency admin on the psychiatrist's profile — no variable rates by session type, time, or any other factor. The fee displayed at booking is locked into the Payment record at the moment the booking is confirmed; subsequent fee changes by the agency do not affect existing confirmed bookings.
- Q: How does a non-patient user recover TOTP access when they lose their authenticator device? → A: Admin-mediated reset (Option B). The user contacts a Platform Admin who verifies their identity via out-of-band confirmation, then resets the TOTP enrollment from the Platform Admin portal. On next login the user must re-enroll TOTP before accessing the platform. Every TOTP reset is logged as an immutable audit event recording the admin who performed it, the timestamp, and the account affected.
- Q: What can a patient export and how is it delivered? → A: Async package delivery (Option B). Patient requests a full data export from their profile settings. The platform prepares the package asynchronously and delivers a secure time-limited download link via WhatsApp (if enabled) and SMS within 72 hours. The export includes all data the patient owns: intake responses, care recommendations, appointment history, and notification preferences. Raw session transcripts are excluded — those belong to the clinical record, not the patient's portable data. The download link expires after 48 hours.
- Q: Whose Zoom account is used to create session meetings? → A: One platform-owned Zoom Business account (Option A). All meetings are created under the platform's single Zoom account. Patients and psychiatrists join as external participants via the generated meeting link. No per-psychiatrist OAuth or sub-accounts. All transcript webhooks are received on this single account.
- Q: How do follow-up bookings work, and what is the psychiatrist access model for patient data? → A: GAP-001 full resolution. (1) Booking model — Urban Company pattern, no "active relationship" concept. The booking screen shows a "Previously seen" section listing all psychiatrists the patient has ever booked with, sorted by most recent, for direct one-tap rebooking. "Find new match" is always visible alongside it and runs the full matching flow. No constraint on booking multiple psychiatrists simultaneously. (2) Access model — strictly per-pair for raw transcripts: a psychiatrist can only read transcripts from sessions they personally conducted. Structured care recommendations (medications, activities, follow-up dates) from all psychiatrists are visible to any psychiatrist who has a booking with the patient within the last 3 months (configurable). Intake questionnaire responses are also visible to any such psychiatrist. (3) Access expiry — a psychiatrist's access to a patient's profile and transcripts automatically expires 3 months after the last completed session with no new booking. The clock resets on each new booking. (4) All platform time-based values (access expiry, OTP duration, session timeout, slot hold, etc.) are stored in a PlatformConfiguration entity editable by Platform Admins — no hardcoded thresholds anywhere in the system.
- Q: How long is the raw Zoom session transcript retained after the psychiatrist reviews the draft recommendation? → A: The raw transcript is retained for 7 years alongside other clinical records (Option B), subject to the same anonymisation pipeline when a patient deletion job runs. Only the pseudonymous ID replaces patient identifiers; the transcript text itself is retained for audit and clinical continuity purposes.
- Q: What happens when a psychiatrist is deactivated mid-relationship with active patients and confirmed bookings? → A: Immediate hard deactivation (Option A). All upcoming confirmed bookings for that psychiatrist are cancelled immediately. A full Razorpay refund is issued for each cancelled booking. Each affected patient is notified via SMS and WhatsApp (if enabled) with the cancellation reason provided by the admin at the time of deactivation, plus a direct link to the matching flow to rebook with a new psychiatrist.
- Q: What happens to a patient account stuck in incomplete-intake status indefinitely? → A: Send one WhatsApp nudge (if number provided) or SMS after 48 hours of inactivity reminding them to complete intake. If the account remains incomplete after 30 days of no login, it is automatically and permanently deleted along with all associated data.
- Q: What are the OTP expiry and lockout parameters? → A: OTP expires after 5 minutes. After 3 consecutive failed attempts the patient is locked out for 15 minutes before they can request a new OTP.
- Q: How long before an authenticated web session expires? → A: 30-minute idle timeout; 8-hour absolute maximum regardless of activity. Applies to all user roles. On expiry the user is redirected to login with a clear message.
- Q: How is duplicate booking prevented if a patient submits the confirm button twice? → A: The confirm button is disabled immediately on first click (UI-level). A server-side idempotency key tied to the Razorpay order ID ensures that even if the request reaches the server twice, only one charge is processed and one booking is created.
- Q: When a patient has no upcoming confirmed bookings, can they immediately book any psychiatrist without any prior action? → A: Yes, fully open. No upcoming bookings — including patients who have never booked — means no restriction of any kind. The patient proceeds directly to the "Previously seen" or "Find new match" flow with no prerequisite steps.
- Q: Should the intake questionnaire be editable by patients after completion? → A: Yes. Patients can view and edit their intake responses at any time from their profile. Psychiatrists with an active access window are notified in-platform when edits are made. Edit history is retained for clinical continuity.
- Q: How should post-session feedback and psychiatrist ratings work? → A: Feedback prompt appears immediately in the web app after session completion (via Zoom webhook). Patient rates 1–5 and answers structured qualitative dimensions. Raw ratings are visible to Platform Admins and Agency Admins only. Patients see percentile rankings (Top 5%, Top 10%, etc.). Ratings are a weighted factor in matching. Eligibility thresholds: ≥5 sessions avg < 2.0 → ineligible; ≥10 sessions avg < 3.0 → ineligible. Existing confirmed bookings with ineligible psychiatrists are honoured. Unrated psychiatrists shown as "New" on match list.
- Q: What refund timeline message is shown to patients when a refund is triggered? → A: "Refund initiated — expect it within 5–7 business days." All refund notification paths updated to state the refund has been initiated with explicit 5–7 business day arrival timeline.
- Q: If an OTP SMS fails to deliver, what should happen? → A: Automatic failover to a backup SMS provider within 30 seconds of primary failure. "Resend OTP" option available after 60 seconds regardless of delivery status. FR-001i added.
- Q: How does a patient recover their account if they lose access to their registered phone number? → A: V1 — account is inaccessible; patient must create a new account. Clear message on login screen directs them to support. FR-001j added. V2 — admin-mediated recovery with out-of-band identity verification. Patient entity MUST use a UUID as primary key (not mobile number) to enable future number updates without data loss.
- Q: Should a patient's own submitted SessionFeedback be included in their data export? → A: Yes — patient-authored feedback (rating + qualitative answers) is their personal data and is included in the export under DPDPA 2023. FR-036 updated.
- Q: When a patient updates notification preferences, do already-queued Tier 3 reminders update immediately? → A: Yes — all pending Tier 3 reminders are cancelled and rescheduled immediately to match new preferences, including same-day reminders. FR-020 and US4 updated.
- Q: Does the psychiatrist portal show the Zoom join link for upcoming appointments? → A: Yes — both the psychiatrist portal (FR-013a added) and the patient portal (FR-017 updated) MUST prominently display the Zoom join link for each upcoming confirmed appointment.
- Q: Must the platform generate GST-compliant tax invoices per session? → A: Yes — FR-041 added. Platform generates a GST invoice per confirmed paid booking containing booking ref, session date/time, psychiatrist name, fee, GST amount and rate, and GSTIN. Delivered to patient within 24 hours of payment. GSTIN ownership (platform vs. agency) is a pre-implementation decision requiring CA confirmation — deferred to planning phase.
- Q: How should all data deletion scenarios be handled — on-demand, abandoned accounts, and 7-year expiry? → A:

### Session 2026-05-03

- Q: Which session types should the platform support at v1 launch? → A: Three types — Initial Assessment, Follow-Up, and Urgent Review. Initial Assessment is mandatory for any patient's first consultation with any psychiatrist on the platform and MUST be conducted via video only (Telemedicine Practice Guidelines 2020). Follow-Up covers all subsequent standard consultations; any consultation mode is permitted. Urgent Review is an emergency booking that bypasses normal slot selection, is video-preferred, and is available to patients who have already completed at least one Initial Assessment. FR-042 added; AvailabilitySlot and Appointment entities updated with session_type field.
- Q: Which consultation modes should the platform support for Follow-Up sessions at v1? → A: Video only — all three session types (Initial Assessment, Follow-Up, Urgent Review) use Zoom video exclusively in v1. No audio-only or text-based modes in v1. Audio-only and text-based consultation modes deferred to v2 — see Future Readiness. FR-042 updated to remove mode differentiation; all sessions are Zoom video calls.
- Q: What happens when a patient tries to book a slot that was taken while they were browsing? → A: Real-time availability check at slot selection. When a patient taps a slot to proceed to checkout, the platform checks availability at that moment. If the slot is already booked or held by another patient, an inline error is shown: "This slot is no longer available — please choose another" and the psychiatrist's remaining available slots are displayed. The patient remains on the same screen. FR-011 updated with this pre-checkout availability check.
- Q: What UX is shown before a non-refundable cancellation is finalised? → A: Explicit confirmation modal shown before proceeding. When a patient cancels within 24 hours of their session, the platform MUST display a confirmation step stating the exact fee amount that will be lost and that the cancellation is non-refundable before any action is taken. The patient must explicitly confirm to proceed. FR-012 updated with this pre-confirmation requirement.
- Q: How should overlapping slots for the same psychiatrist be handled? → A: Blocked at creation time. The system rejects any new slot whose time window overlaps an existing open or booked slot for the same psychiatrist. The user (psychiatrist or agency admin) sees an immediate error identifying the conflict. FR-024 and FR-025 updated with overlap prevention rule.
- Q: How far ahead can psychiatrists publish slots and patients book? → A: 3-month rolling window for slot publication. Psychiatrists cannot create availability slots more than 3 months from today. Patients can book any published slot within that window. Both limits stored in PlatformConfiguration, editable by Platform Admins. FR-024 and FR-025 updated.
- Q: Should a psychiatrist be notified when they become ineligible for new bookings due to low ratings? → A: No — psychiatrists are not notified of ineligibility. Agency Admins and Platform Admins are notified as per FR-039 (unchanged). Additionally, all rating-related thresholds and display settings MUST be configurable by Platform Admins via the admin dashboard UI — not just a backend config store. This includes: eligibility rule thresholds (min sessions + avg rating cutoffs), percentile band labels and boundaries, and matching algorithm rating weight. FR-039 and FR-038 updated to reference Platform Admin dashboard configuration UI. FR-033 updated to include rating configuration panel.
- Q: What happens when a patient no-shows a confirmed session (pays but never joins)? → A: Booking marked no-show-by-patient. Fee is non-refundable — patient paid and chose not to attend without cancelling, same outcome as a within-24h cancellation. Psychiatrist is prompted after meeting ends: "Patient did not attend — add session notes or skip." Psychiatrist can still add a session note and recommendation. FR-015 and FR-015b apply unchanged. Appointment status no-show-by-patient added.
- Q: What happens when a psychiatrist no-shows a confirmed session? → A: Auto-detect via Zoom webhook participant data. When a meeting ends, the platform checks whether the psychiatrist joined at any point. If not, the booking is flagged as a psychiatrist no-show. The refund behaviour is governed by a PlatformConfiguration toggle (default: auto-refund). In auto-refund mode: full Razorpay refund issued immediately, patient notified via SMS + WhatsApp with apology and rebook link, Agency Admin and Platform Admin alerted. In manual-review mode: patient is immediately notified that the issue has been detected and is under review; Platform Admin is alerted with a 24h SLA to decide and issue the refund manually via the admin portal. FR-045 added; PlatformConfiguration updated with no-show refund mode toggle.
- Q: Does v1 support one agency or multiple agencies, and what is the matching pool scope? → A: Multi-agency from day one. The matching pool for patients spans all eligible psychiatrists across all agencies. AgencyAdmins are scoped to their own agency — they can only see and manage psychiatrists belonging to their agency. Psychiatrists belong to exactly one agency. The Agency entity is a first-class entity with an agency_id foreign key on PsychiatristProfile. FR-006 updated to clarify the matching pool is platform-wide across all agencies. FR-027 updated to clarify AgencyAdmin data isolation is agency-scoped. Agency entity added.
- Q: How long is each session type, and can psychiatrists configure durations? → A: Fixed per session type — no per-psychiatrist variation. Initial Assessment = 60 minutes, Follow-Up = 30 minutes, Urgent Review = 60 minutes. Duration is derived from session_type at slot creation — psychiatrists do not pick duration when creating a slot. All default durations stored in PlatformConfiguration, editable by Platform Admins. AvailabilitySlot records the duration at creation time. FR-042 updated with duration rules; FR-035 (PlatformConfiguration) updated; FR-015c updated to reference session-type-derived end time.
- Q: Can a psychiatrist see any signal about their own rating or performance? → A: No by default — psychiatrist rating visibility is off unless explicitly enabled by Platform Admin. There is no legal obligation under the Mental Healthcare Act 2017 or Telemedicine Practice Guidelines 2020 to show ratings to psychiatrists. The platform takes a conservative default: psychiatrists see nothing about their own ratings. Platform Admins can enable psychiatrist rating visibility via a toggle in the Platform Admin dashboard (stored in PlatformConfiguration). When enabled, the psychiatrist sees only their aggregate average score, percentile band, and session count — no individual patient ratings under any circumstance. FR-038 updated.
- Q: How does the e-prescription workflow work, and what is the platform's obligation? → A: The platform provides an e-prescription tool that the psychiatrist uses after each session. This is legally distinct from session notes (CareRecommendation). A prescription is a formal document the patient takes to a pharmacy. All competitors (Practo, Lybrate, mfine, RocketHealth) generate e-prescriptions inside the platform. Mandatory fields per Telemedicine Practice Guidelines 2020: psychiatrist full name + MCI registration number, patient name/age/address/ID verification record, drugs in CAPITAL LETTERS with dosage/frequency/duration/route, digital or photographed wet signature, date of consultation. The platform retains a copy in the patient's clinical record. Prescription PDF is delivered to the patient via an in-platform download link and WhatsApp (if enabled). List C drugs (alprazolam, diazepam, lorazepam, zolpidem, methylphenidate) are prohibited from telemedicine prescriptions by law — the platform MUST hard-block any attempt to add a List C drug to a prescription and display a clear warning naming the drug and the legal restriction. PsychiatristProfile updated with MCI registration number field. New Prescription entity added. FR-043 (e-prescription generation), FR-044 (List C hard block) added. A single centralised Data Lifecycle Service handles all three via a typed job queue. All jobs execute the same two-phase pipeline: Phase 1 erases PII, Phase 2 anonymises clinical records. Job types are: On-Demand (72h SLA, patient confirmed), Abandoned (24h SLA, no confirmation), Expiry (24h SLA, daily scan). Every job produces a PII-free audit entry retained permanently. An internal dashboard shows job status for platform admins. All users access the platform via browser. Notifications are split into three tiers: (1) OTP/authentication — SMS to mobile number, always required; (2) Booking confirmations — SMS to mobile number, plus WhatsApp if enabled; (3) Care reminders (medication, activity, follow-up nudges) — WhatsApp only. During registration, after entering their mobile number, patients see a single checkbox: "Use this number for WhatsApp notifications too?" (checked by default, same UX pattern as "billing = shipping address"). If unchecked, they may enter a different WhatsApp number or leave it blank to opt out. WhatsApp notifications can be toggled on/off at any time from the patient's profile settings (default: on).

### Session 2026-05-04

- Q: Does the GST invoice need a sequential invoice number series? → A: Yes — GST law requires it. Invoice number format: `[PREFIX]/[FY]/[SEQUENCE]` (e.g., MHP/2026-27/00001). Auto-incrementing, gapless, resets April 1 each financial year. Prefix configurable by Platform Admins in PlatformConfiguration. invoice_number field added to Payment entity, immutable once issued. FR-041 updated.
- Q: What happens if a patient denies consent at registration? → A: Hard gate — no consent, no platform access. If the patient declines, their partial account is deleted immediately and they cannot proceed. No browse-only or partial-access mode. Consent screen shown before any intake data is collected, per DPDPA 2023. FR-005 updated.
- Q: Should a separate WhatsApp number entered at registration be verified before saving? → A: No verification — store as entered. A helper note is displayed: "Make sure this number is registered on WhatsApp." Silent WhatsApp failure is acceptable since SMS to the primary mobile number is the guaranteed fallback for all critical communication (OTPs, booking confirmations). FR-001 unchanged.
- Q: Should v1 support caregiver consultations (patient authorises a family member to attend on their behalf)? → A: Deferred to v2. Target users are self-referring tech-comfortable adults; caregiver consultations are more common in institutional settings. The authorisation flow (consent management, caregiver identity verification) adds complexity for a rare v1 use case. Caregiver Consultation already listed in Future Readiness → Additional Session Types (v2). session_type stored as string enum in v1 so the type can be added in v2 without schema migration. GAP-035 resolved.
- Q: Does the session notes form meet MHCA 2017 Form B-1 legal documentation requirements? → A: No — FR-015b expanded to add all missing Form B-1 fields. Required (must complete before approving): presenting complaints summary, clinical observations/progress notes, treatment type, consent status. Optional: history summary, techniques used, capacity assessment, risk/benefit notes. Pre-populated/editable: medications, activity, recommended next session date. Psychiatrist must check a Form B-1 completion declaration before approving. Session record serves as the platform's Form B-1 equivalent, retained 7 years. FR-015b updated.
- Q: Should fees vary by session type, and who can change them? → A: Three separate fees per psychiatrist — one each for Initial Assessment, Follow-Up, and Urgent Review — set by the Agency Admin. Both Agency Admins (for their agency's psychiatrists) and Platform Admins (platform-wide) can bulk-update fees for all psychiatrists in one action. Individual per-psychiatrist overrides remain available after a bulk update. Fees locked into Payment record at booking; no confirmed bookings affected by subsequent changes. FR-023a updated.
- Q: Should the platform guide patients on when to come back for their next session? → A: Yes — psychiatrist sets a recommended follow-up date after each session, and the platform WhatsApp-nudges the patient when that date arrives. The phase labels (Acute/Continuation/Maintenance) are not exposed in the UI — the psychiatrist simply picks a recommended interval (1 week, 2 weeks, 4 weeks, 6 weeks, 8 weeks, 3 months, 6 months, or a specific date) from the session notes form. When the date arrives, the platform sends a Tier 3 WhatsApp nudge: "Dr. [Name] recommended your next session around now — [Book Now link]." The nudge is suppressed if the patient already has a confirmed future booking. The next_follow_up_date field already exists on CareRecommendation — FR-046 wires it to the notification system. GAP-032 resolved.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Patient Onboarding & Intake Questionnaire (Priority: P1)

A new user signs up on the platform, completes a detailed mental health intake questionnaire,
and the system builds an initial patient profile from their responses.

**Why this priority**: Without a complete intake profile, no matching or personalization is
possible. This is the entry point for every other feature on the platform.

**Independent Test**: A new user can register, complete the full intake flow, and have their
profile created with all questionnaire responses stored — verifiable without any
psychiatrist or notification feature being built.

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they sign up with their mobile number or email and verify
   their identity, **Then** they are taken to the intake questionnaire and their account is
   created with a pending-intake status.
2. **Given** a patient on the intake questionnaire, **When** they answer all sections (symptoms,
   severity, preferences, history), **Then** their responses are saved incrementally so
   progress is never lost on session drop.
3. **Given** a patient who has completed the intake, **When** they submit, **Then** a structured
   patient profile is created and the patient is redirected to the matching flow.
4. **Given** a patient who partially completed the intake, **When** they log back in,
   **Then** they resume from where they left off without re-answering completed sections.

---

### User Story 2 — Psychiatrist Matching & Appointment Booking (Priority: P1)

The system matches a patient to a ranked list of available psychiatrists from the partner
agency, and the patient books their first appointment through the platform.

**Why this priority**: Matching and booking is the core revenue and clinical delivery flow.
It must work end-to-end before any other feature ships.

**Independent Test**: A patient with a completed intake profile can view a ranked list of
matched psychiatrists and confirm a booking — verifiable independently of the notification
or long-term memory features.

**Acceptance Scenarios**:

1. **Given** a patient with a completed intake profile, **When** the matching engine runs,
   **Then** they see a ranked list of at most 5 psychiatrists, each showing name, photo,
   specialization, languages spoken, and earliest available slot.
2. **Given** a patient viewing their matches, **When** they select a psychiatrist and choose
   a time slot, **Then** the slot is temporarily held and the patient is taken to Razorpay
   checkout. On successful payment, the booking is confirmed, a Zoom meeting link is
   generated, and both patient and psychiatrist receive a confirmation with the join link.
3. **Given** a psychiatrist logged in to the platform, **When** a patient books their slot,
   **Then** the psychiatrist can view the patient's intake summary and profile before
   the appointment.
4. **Given** a patient who wants to reschedule, **When** they cancel at least 24 hours in
   advance, **Then** the slot is released and they can select a new time without penalty.
5. **Given** a patient whose preferred psychiatrist has no availability in the next 7 days,
   **When** they view matches, **Then** the system surfaces the next available slot date
   and offers alternatives.

---

### User Story 3 — Long-Term Patient Profile & Psychiatrist Recommendations (Priority: P2)

After appointments, the psychiatrist records recommendations (medications, activities,
follow-up schedule) into the platform. The patient profile is updated with this history
and grows richer over time.

**Why this priority**: The long-term memory layer differentiates this platform from a simple
booking tool. It enables continuity of care but depends on the booking flow (US2) being live.

**Independent Test**: A psychiatrist can log in after an appointment, add a recommendation
(medication name, dosage, timing), and the patient's profile reflects this — testable
without the notification engine being active.

**Acceptance Scenarios**:

1. **Given** a psychiatrist who has completed a session, **When** they open the patient's
   record, **Then** they see the full intake history plus notes from all prior sessions.
2. **Given** a psychiatrist entering post-session recommendations, **When** they submit
   (medication, activity, follow-up date, notes), **Then** the recommendation is appended
   to the patient's permanent record and timestamped.
3. **Given** a patient logging in, **When** they view their profile, **Then** they see a
   timeline of all past sessions, recommendations received, and their current care plan.
4. **Given** a patient's profile updated with a new recommendation, **When** the notification
   engine queries the profile, **Then** it can retrieve the full structured care plan
   including medication names, dosages, and preferred activity times.

---

### User Story 4 — Personalized, Adaptive Notifications (Priority: P2)

The platform sends each patient personalized notifications — medication reminders, activity
nudges, follow-up prompts — timed to their individual preferences and care plan.

**Why this priority**: Notifications drive long-term engagement and adherence, but they depend
on the care plan (US3) existing in the patient profile.

**Independent Test**: A patient with at least one recommendation on their profile receives
correctly timed, personalized notifications matching their care plan and stated preferences
— testable without the matching or onboarding flows being re-run.

**Acceptance Scenarios**:

1. **Given** a patient with a medication recommendation, a resolved WhatsApp number, and
   WhatsApp notifications toggled on, **When** their preferred reminder time arrives,
   **Then** they receive a WhatsApp message with the medication name, dosage, and a prompt
   to confirm they have taken it.
2. **Given** a patient whose notification preferences have changed (e.g., prefers reminders
   at 8 AM not 7 AM), **When** they update their preferences, **Then** all pending
   (not yet delivered) Tier 3 reminders are cancelled and rescheduled immediately to
   match the new preference — including any queued for the same day.
3. **Given** a patient with an activity recommendation (e.g., "30-minute walk"), **When**
   the scheduled time arrives, **Then** they receive a contextual nudge, not a generic
   broadcast message.
4. **Given** a patient with an upcoming appointment, **When** 48 hours, 2 hours, and
   15 minutes before the session (for whichever windows are still in the future at booking
   time), **Then** they receive an SMS booking reminder to their mobile number, and
   additionally a WhatsApp message with the Zoom join link if WhatsApp notifications are
   enabled on their profile.
5. **Given** a patient who has opted out of a notification category (e.g., activity nudges),
   **When** the system schedules notifications, **Then** that category is suppressed and
   only opted-in categories are sent.

---

### Edge Cases

- Patient abandons intake and never returns: one WhatsApp/SMS nudge sent after 48 hours of inactivity; account and all data permanently deleted after 30 days of no login (resolved: FR-032).
- Psychiatrist cancels a confirmed booking: full refund always issued, slot released, patient notified via SMS + WhatsApp with a rebook link (resolved: FR-012a).
- When no psychiatrist scores above the match threshold: the system shows the best available with a "closest available" label — the patient is never dead-ended (resolved: FR-010).
- Patient with no care plan yet: no care-related notifications sent; only appointment booking confirmations and reminders are sent via WhatsApp if a WhatsApp number is registered (resolved: FR-023).
- Patient with no WhatsApp number: no notifications of any kind. The platform informs the patient at registration and in their profile settings that notifications require a WhatsApp number (resolved: FR-001, FR-019).
- WhatsApp delivery failure: failure is logged in the audit trail and surfaced in the patient's profile; no retry or fallback channel (resolved: FR-022).
- Double-tap confirm: the confirm button is disabled on first click; a server-side idempotency key per checkout session ensures only one Razorpay charge and one booking are ever created (resolved: FR-011c).
- Psychiatrist deactivated with active patients: all upcoming confirmed bookings are immediately cancelled, a full refund is issued for each, and affected patients are notified with the admin-supplied cancellation reason and a rebook link (resolved: FR-012b).
- Patient wants to book a previously seen psychiatrist: shown directly in "Previously seen" section; taps name → slot picker → payment; no matching flow re-run (resolved: FR-007, FR-018).
- Patient's access window expires (no session in 3 months): psychiatrist automatically loses access to patient profile and transcripts; patient can rebook at any time which restores access (resolved: FR-014, FR-018a).
- Zoom meeting creation fails after payment collected: platform retries up to 3 times; if all fail, booking is cancelled, full refund issued, patient and psychiatrist notified, failure logged as operational metric (resolved: FR-011e).

---

## Requirements *(mandatory)*

### Functional Requirements

**Patient Onboarding & Intake**

- **FR-001**: The system MUST allow patients to register and log in using their mobile number
  with OTP-based verification only — no password is set or stored at any point. Every login
  requires the patient to enter their mobile number and verify a fresh OTP received via SMS.
  During registration, immediately after mobile number entry, the system MUST display a
  checkbox pre-ticked by default — "Use this number for WhatsApp notifications too?" If
  unchecked, the patient may enter a different WhatsApp number or leave it blank to opt out.
  The resolved WhatsApp number is stored on the patient's profile and can be updated at any
  time from their profile settings.
- **FR-001a**: OTPs MUST expire after 5 minutes from the time of issue. A patient who enters
  an incorrect OTP 3 consecutive times MUST be locked out for 15 minutes before a new OTP
  can be requested. The lockout duration and remaining time MUST be displayed to the patient.
  If a patient requests a new OTP before the current one has expired, the previous OTP MUST
  be immediately and irrevocably invalidated — only the most recently issued OTP is valid
  at any point in time. The 5-minute expiry window resets from the moment the new OTP is
  issued.
- **FR-001j**: In v1, a patient's account is bound exclusively to their registered mobile
  number. If a patient loses access to that number, their account becomes inaccessible —
  no self-service or admin-mediated account recovery exists in v1. The platform MUST
  display a clear message on the login screen directing patients who have lost their number
  to contact support. Support can only advise the patient to create a new account.
  Admin-mediated mobile number recovery (with out-of-band identity verification) is
  deferred to v2 — see Future Readiness.
- **FR-001i**: OTP SMS delivery MUST use a primary SMS provider with automatic failover to a
  backup SMS provider. If the primary provider fails to deliver within 30 seconds (no delivery
  acknowledgement received), the platform MUST automatically resend the same OTP via the
  backup provider. The patient sees a single "Resend OTP" option on the login screen; this
  option MUST become available after 60 seconds regardless of delivery status, allowing the
  patient to trigger a fresh OTP if neither provider delivered. Both primary and backup SMS
  provider integrations MUST be specified and configured before launch; the specific provider
  choices are a planning-phase decision. All SMS delivery attempts (provider used, timestamp,
  delivery status) MUST be logged in the audit trail without logging the OTP value itself.
- **FR-001c**: Authenticated web sessions MUST expire after 30 minutes of user inactivity,
  or after 8 hours of total session duration — whichever comes first. This applies to all
  user roles (patients, psychiatrists, agency admins). On expiry, the user MUST be
  redirected to the login page with a clear message that their session has ended.
- **FR-001b**: Psychiatrists, agency admins, and platform admins MUST log in using email
  address and password followed by a TOTP code from an authenticator app (Google
  Authenticator, Authy, or equivalent). MFA is mandatory and cannot be disabled for these
  roles. Accounts are created by the platform (not self-registered) and activated via a
  one-time email link. During account activation, the user MUST set up their TOTP
  authenticator by scanning a QR code — activation is not complete until TOTP setup is
  confirmed with a valid code. Every subsequent login requires all three factors in sequence:
  email address → password → TOTP code. No OTP via SMS applies to these roles.
- **FR-001d**: Non-patient users (psychiatrists, agency admins, platform admins) MUST be
  able to reset their password via a time-limited link sent to their registered email address.
  The reset link MUST expire after 30 minutes. After a password reset, the active session
  MUST be invalidated and the user MUST log in again with their new password and TOTP code.
  TOTP is not reset during a password reset — the same authenticator app setup remains valid.
- **FR-001h**: Non-patient account provisioning follows a strict hierarchy:
  (1) PlatformAdmin accounts are created exclusively by existing Platform Admins via the
  Platform Admin portal.
  (2) The first AgencyAdmin account for a new agency is created by a Platform Admin.
  Additional AgencyAdmin accounts for an existing agency may be created by any existing
  AgencyAdmin of that agency or by a Platform Admin.
  (3) Psychiatrist accounts are created by any AgencyAdmin of the same agency.
  All account creation triggers a one-time activation email containing a time-limited
  setup link (expiry per PlatformConfiguration, default: 24 hours) through which the
  user sets their password and completes TOTP enrollment. Accounts cannot be used until
  activation is complete.
- **FR-001g**: Passwords for non-patient roles MUST meet the following minimum requirements:
  at least 12 characters, containing at least one uppercase letter, one numeric digit, and
  one special character. The platform MUST enforce these requirements at account activation,
  password reset, and any password change. Password strength rules are stored in
  PlatformConfiguration and are editable by Platform Admins.
- **FR-001f**: After 3 consecutive failed password attempts, a non-patient user account
  (psychiatrist, agency admin, platform admin) MUST be locked for 15 minutes. During
  lockout, no login attempts are accepted regardless of correctness. The remaining lockout
  duration MUST be displayed to the user. Lockout attempt threshold and duration are stored
  in PlatformConfiguration and are editable by Platform Admins.
- **FR-001e**: If a non-patient user loses access to their TOTP authenticator device, their
  TOTP enrollment MUST be reset exclusively by a Platform Admin via the Platform Admin portal
  (FR-033). The Platform Admin MUST verify the user's identity via out-of-band confirmation
  before performing the reset. On next login after a TOTP reset, the user MUST re-enroll
  a new TOTP authenticator before accessing any platform functionality. Every TOTP reset
  MUST generate an immutable audit log entry recording: the account reset, the Platform Admin
  who performed it, and the timestamp.
- **FR-002**: The system MUST present a structured intake questionnaire covering: presenting
  symptoms, symptom severity, mental health history, current medications, lifestyle factors,
  and psychiatrist preferences (gender, language). The platform supports three session types
  (FR-042); consultation mode constraints per session type apply from booking through to
  Zoom meeting creation.
- **FR-003**: The system MUST save questionnaire progress after each section so that a patient
  who exits mid-way can resume from the same point on next login.
- **FR-004**: The system MUST create a structured patient profile upon intake completion,
  storing all responses in a queryable, normalized format.
- **FR-004a**: Patients MUST be able to view their complete intake questionnaire responses
  at any time from their profile. Patients MUST be able to edit any intake response after
  initial submission. Each edit MUST be timestamped and the full edit history retained for
  clinical continuity. When a patient edits their intake, the platform MUST send an
  in-platform notification to all psychiatrists who currently have an active access window
  for that patient (per FR-018a), informing them that the patient's intake has been updated.
- **FR-005**: The system MUST require explicit consent from the patient before storing any
  sensitive health data, with a clear explanation of what is collected and why (DPDPA 2023
  requirement). Consent is a hard gate — if the patient declines, they cannot proceed and
  their partial account (mobile number and OTP record only) is deleted immediately. No
  partial access or browse-only mode exists without consent. The consent screen MUST be
  shown before any intake data is collected.

  The consent screen MUST include an explicit disclosure of session recording: "Your video
  sessions will be recorded via Zoom. The recording is transcribed and used to generate
  your care notes, which are reviewed and approved by your psychiatrist before being saved
  to your profile. Recordings and transcripts are stored encrypted and retained for 7 years
  in accordance with clinical record-keeping obligations." This disclosure satisfies the
  DPDPA 2023 requirement for informed consent before processing sensitive personal data
  (session recordings). The patient's consent record MUST capture that recording consent
  was given, with timestamp. The full consent text MUST remain accessible to the patient
  from their profile settings at any time.

**Session Types**

- **FR-042**: The platform MUST support exactly three session types at v1 launch. All sessions
  are conducted via Zoom video call — no audio-only or text-based modes exist in v1.
  Each booking and each availability slot MUST carry an explicit session_type field.
  The three types and their rules are:

  - **Initial Assessment**: The patient's first consultation with any psychiatrist on the
    platform. The platform MUST automatically classify a booking as Initial Assessment when
    the patient has no prior completed session on the platform with any psychiatrist.

  - **Follow-Up**: All subsequent consultations after the patient has completed at least
    one Initial Assessment. Used for all standard review appointments.

  - **Urgent Review**: Available only to patients who have completed at least one prior
    Initial Assessment. Intended for acute deterioration or safety concerns in an existing
    patient — not a general-purpose emergency or crisis service. Urgent Review bookings
    bypass the normal matching flow — the patient is shown the next available slot across
    all eligible psychiatrists regardless of prior matching history. Normal payment and
    Zoom-creation flows apply unchanged.

  The platform is not a crisis intervention service and does not offer emergency psychiatric
  care to first-time users. This is consistent with Telemedicine Practice Guidelines 2020,
  which direct telemedicine providers to refer emergency presentations to appropriate
  emergency facilities rather than handle them via telemedicine. The platform MUST display
  national crisis helpline numbers (iCall: 9152987821, Vandrevala Foundation: 1860-2662-345,
  iCall WhatsApp: configured in PlatformConfiguration) prominently on: the login/registration
  page, the booking page, and the patient dashboard. These numbers MUST be visible to all
  users at all times — logged in or not.

  Each session type has a fixed duration derived from PlatformConfiguration at slot creation
  time — psychiatrists do not configure duration individually:
  - Initial Assessment: 60 minutes (default)
  - Follow-Up: 30 minutes (default)
  - Urgent Review: 60 minutes (default)

  The slot duration MUST be recorded on the AvailabilitySlot and the Appointment at
  creation/booking time. The Zoom meeting MUST be created with the corresponding duration.
  The session end time (used by FR-015c transcript wait and FR-019 reminders) is calculated
  as slot start time + recorded duration.

  The session_type MUST be displayed to both the patient and psychiatrist in all booking
  confirmation messages, appointment views, and session records. All session_type values
  and their default durations are stored in PlatformConfiguration and editable by Platform
  Admins without a code change.

**No-Show Handling**

- **FR-045**: The platform MUST detect psychiatrist no-shows automatically using Zoom webhook
  participant data. When a Zoom meeting ends, the platform MUST check whether the psychiatrist
  joined the meeting at any point during its duration. If the psychiatrist is not present in
  the participant list when the meeting ends, the Appointment MUST be marked with status
  no-show-by-psychiatrist.

  The subsequent refund behaviour is governed by a PlatformConfiguration toggle
  (psychiatrist_no_show_refund_mode, default: auto):

  - **Auto mode** (default): A full Razorpay refund is issued immediately and automatically.
    The patient is notified via SMS and WhatsApp (if enabled) with an apology, confirmation
    that their refund has been initiated and will reach their account within 5–7 business
    days, and a direct link to rebook. The psychiatrist's Agency Admin and the Platform Admin
    are alerted via in-platform notification.

  - **Manual review mode**: No automatic refund is issued. The patient is immediately
    notified via SMS and WhatsApp (if enabled) that the issue has been detected and is under
    review. The Platform Admin receives an in-platform alert with a 24-hour SLA to review
    the case and issue the refund manually via the admin portal (FR-033). Once the Platform
    Admin issues the refund, the patient is notified with the standard refund message.

- **FR-046**: The session notes form (FR-015b) MUST include a "Recommended next session"
  field where the psychiatrist selects an interval (1 week, 2 weeks, 4 weeks, 6 weeks,
  8 weeks, 3 months, 6 months) or a specific date. This field is optional — the
  psychiatrist may leave it blank. When set, it populates the next_follow_up_date field
  on the CareRecommendation record. The platform MUST send a Tier 3 WhatsApp nudge to
  the patient on the recommended date (nudge timing configurable in PlatformConfiguration,
  default: send on the day itself). Nudge text: "Dr. [Name] recommended your next session
  around now. Ready to book? [direct booking link pre-filtered to that psychiatrist]."
  The nudge MUST be suppressed if the patient already has a confirmed future booking with
  any psychiatrist at the time of sending. The patient can dismiss the nudge without
  affecting their general notification preferences. Phase labels (Acute/Continuation/
  Maintenance) are not shown in the UI — the psychiatrist uses the interval picker only.

  In both modes, the no-show event MUST be audit-logged with: appointment reference,
  psychiatrist ID, session date/time, detection method (Zoom participant data), and
  resolution (auto-refunded or manual-review). The Agency Admin MUST be notified of all
  psychiatrist no-shows in their agency regardless of refund mode.

- **FR-047**: When a patient no-show is detected (Appointment status set to
  no-show-by-patient), the platform MUST send a two-nudge re-engagement sequence via
  WhatsApp (subject to the patient's notification preferences):

  - **Nudge 1** (24 hours after no-show detected): "We missed you at your session
    yesterday. We hope you're okay. Whenever you're ready, you can rebook here: [booking
    link]."
  - **Nudge 2** (7 days after no-show, sent only if the patient has no new confirmed
    booking at the time of sending): "It's been a week since your missed session. Your
    mental health matters — here's your booking link whenever you're ready: [booking link]."

  Nudge 2 MUST be suppressed if the patient books any session between nudge 1 and the
  7-day mark. Both nudges respect the patient's daily notification cap (FR-020). No
  further re-engagement nudges are sent after nudge 2 regardless of outcome. Both nudge
  events MUST be logged in the audit trail (patient ID, appointment reference, nudge
  number, send timestamp, delivery status).

**E-Prescription**

- **FR-043**: After each session, the platform MUST provide the psychiatrist with an
  e-prescription tool to generate a formal prescription document for the patient. This is
  legally distinct from session notes (FR-015b) — a prescription is a regulated document
  the patient takes to a pharmacy. The psychiatrist MUST be able to access the prescription
  tool from the session record immediately after the session ends.

  The prescription tool MUST allow the psychiatrist to enter:
  - One or more medications: generic drug name (stored and displayed in CAPITAL LETTERS),
    dosage, frequency, duration, route of administration, and optional special instructions
  - Free-text clinical notes (optional, for the patient's reference)

  The generated prescription document MUST include all legally mandatory fields:
  - Psychiatrist: full name, qualifications, MCI registration number, and clinic/affiliation
    name — auto-populated from PsychiatristProfile
  - Patient: name, age, address, and a record of the identity verification performed at
    consultation time — auto-populated from PatientProfile
  - Medications: as entered, with generic names displayed in CAPITAL LETTERS
  - Date of consultation (auto-populated)
  - A digital signature field: the psychiatrist MUST confirm the prescription before it is
    finalised; confirmation acts as the digital signature for telemedicine purposes

  Upon finalisation:
  - The prescription is stored as a Prescription record linked to the Appointment
  - A PDF is generated and made available to the patient as a download from their
    appointment history page
  - The PDF link is also sent to the patient via WhatsApp (if enabled) with the message:
    "Your prescription from Dr. [Name] (MCI Reg: [number]) is ready — [download link]"
  - The prescription is retained as part of the patient's clinical record for 7 years,
    subject to the same anonymisation pipeline as other clinical records (FR-029)

  A prescription is optional per session — not every session results in a new prescription.
  Psychiatrists may also amend a prescription within 24 hours of finalisation to correct
  errors; the original version is retained in audit history.

  Upon prescription finalisation, if the session notes form (FR-015b) "Recommended next
  session" field is currently blank, the platform MUST auto-populate it with "2 weeks" and
  display an inline note: "Default set to 2 weeks — recommended after new medication
  initiation." The psychiatrist can change the interval or clear it entirely before
  approving the session record. This links FR-043 and FR-046 to reduce the risk of a
  psychiatrist forgetting to schedule a medication initiation review.

- **FR-044**: The prescription tool MUST enforce a hard block on List C drugs — substances
  prohibited from telemedicine prescribing under the Telepsychiatry Operational Guidelines
  2020 and the Drugs and Cosmetics Act 1940. List C drugs include (but are not limited to):
  alprazolam, diazepam, lorazepam, nitrazepam, chlordiazepoxide, zolpidem, methylphenidate,
  modafinil, phenobarbitone, and depot antipsychotics.

  When a psychiatrist types or selects a List C drug name in the prescription tool, the
  platform MUST:
  1. Immediately block the entry from being saved — it cannot be added to the prescription
     under any circumstance
  2. Display a clear, specific warning message naming the drug and stating it is prohibited
     from telemedicine prescriptions under Indian law
  3. Suggest that the patient be referred for an in-person consultation if this drug is
     clinically required

  There is no override or bypass mechanism — the block is absolute. The blocked attempt
  is logged in the audit trail (drug name, timestamp, psychiatrist, appointment) without
  this constituting a prescription record. The List C drug list MUST be maintained in
  PlatformConfiguration and editable by Platform Admins to accommodate future regulatory
  changes without a code deployment.

  The prescription tool MUST also display a static regulatory reference panel — visible
  at all times while composing a prescription — listing List B drugs and their restriction:
  "The following drugs may only be prescribed after at least one completed prior video
  consultation (Telepsychiatry Operational Guidelines 2020). List B drugs include (but
  are not limited to): pregabalin, gabapentin, [Platform Admin–editable list]." This panel
  is informational only; no automated enforcement of List B restrictions is applied in v1.
  Automated List B enforcement (contextual block based on session history) is deferred to v2.
  The List B drug reference list MUST be maintained in PlatformConfiguration and editable
  by Platform Admins.

**Availability Management**

- **FR-023a**: Each psychiatrist MUST have three session fees (in INR) on their profile —
  one per session type: Initial Assessment, Follow-Up, and Urgent Review. All three fees
  are set by the Agency Admin. The correct fee for the booked session type is displayed to
  the patient on the match list and booking screen. The fee in effect at the moment a
  booking is confirmed MUST be recorded in the Payment record and is immutable — subsequent
  fee changes do not affect any already-confirmed bookings.

  Agency Admins MUST be able to bulk-update fees for all psychiatrists in their agency in
  a single action (e.g., set Follow-Up fee to ₹800 for all psychiatrists in the agency).
  Platform Admins MUST be able to bulk-update fees for all psychiatrists across all
  agencies platform-wide. After a bulk update, individual psychiatrist fees can still be
  overridden per-psychiatrist by the Agency Admin. Bulk updates do not affect any
  already-confirmed bookings.
- **FR-024**: Agency admins MUST be able to create, update, and block time slots for any
  psychiatrist in their agency. Slots MUST NOT be created more than the platform-configured
  maximum horizon ahead of today (default: 3 months, stored in PlatformConfiguration).
  The system MUST reject any slot creation whose time window overlaps an existing open or
  booked slot for the same psychiatrist — the error response MUST identify the conflicting
  slot. Changes MUST take effect immediately for new bookings.
- **FR-025**: Each psychiatrist MUST be able to create, update, and block their own time
  slots directly, without requiring agency admin intervention. The same maximum booking
  horizon and overlap prevention rules apply as in FR-024.
- **FR-026**: When a slot that has an existing confirmed booking is blocked or deleted by
  either an agency admin or the psychiatrist, the system MUST automatically notify the
  affected patient, mark the appointment as cancelled, and prompt the patient to rebook.
- **FR-027**: Agency admins MUST NOT be able to view or modify patient clinical data
  (intake responses, care recommendations, session transcripts) — their access is limited
  to psychiatrist profiles and availability management for their own agency only. An
  AgencyAdmin cannot view or manage psychiatrists belonging to a different agency.

**Psychiatrist Matching**

- **FR-006**: The system MUST score and rank all available psychiatrists for a given patient
  using a configurable algorithm that factors in: symptom type, severity level, patient
  preferences (language, gender), psychiatrist availability, and psychiatrist rating
  percentile (FR-038). The matching pool spans all eligible psychiatrists across all
  agencies on the platform — agency membership does not restrict which psychiatrists a
  patient can be matched with. Psychiatrists who are ineligible per FR-039 MUST be excluded
  from results entirely. All factor weights are stored in PlatformConfiguration.
- **FR-007**: The booking screen MUST show two sections:
  (1) "Previously seen" — all psychiatrists the patient has ever had a confirmed booking
  with, sorted by most recent session date, showing name, photo, specialization, and
  earliest available slot. Tapping any entry goes directly to slot selection and payment
  without re-running the matching algorithm.
  (2) "Find new match" — always visible alongside the "Previously seen" section. Triggers
  the matching algorithm and presents up to 5 ranked psychiatrists with name, photo,
  specialization, languages, session fee, and earliest available slot. For first-time
  patients (no previous bookings), only this section is shown.
  All sessions are Zoom video calls.
- **FR-008**: The system MUST prevent a psychiatrist from being booked by more than one
  patient for the same time slot (idempotent booking).
- **FR-009**: The matching algorithm MUST be configurable without code changes — weights and
  criteria are driven by configuration, not hardcoded logic.
- **FR-010**: The matching engine MUST always return the best available psychiatrists
  regardless of match score — the patient is never shown a dead-end "no results" screen.
  When all match scores fall below a configurable threshold, the results MUST be labelled
  with a "closest available" indicator so the patient is informed these are not ideal fits.
- **FR-010a**: The system MUST surface the next available slot date when no psychiatrist
  has availability within 7 days, and offer those psychiatrists as options with their
  earliest date shown.

**Appointment Booking**

- **FR-011**: The system MUST allow patients to select a time slot and proceed to payment.
  When a patient selects a slot, the platform MUST perform a real-time availability check
  before proceeding to checkout. If the slot is no longer available (booked or held by
  another patient), the platform MUST display an inline error: "This slot is no longer
  available — please choose another" and show the psychiatrist's remaining available slots.
  The patient remains on the same screen with no need to restart the flow. If the slot is
  still available, it MUST be temporarily held (reserved) for a maximum of 10 minutes
  during checkout to prevent it from being booked by another patient simultaneously.
- **FR-011a**: Payment MUST be collected via Razorpay. Booking confirmation uses a
  three-path strategy — whichever path fires first completes the booking:

  - **Path 1 — Signature verification (primary, real-time)**: After the patient pays,
    Razorpay returns a payment_id, order_id, and HMAC-SHA256 signature to the browser.
    The platform backend MUST verify this signature cryptographically using the Razorpay
    secret key. If valid, the booking is confirmed immediately without waiting for a
    webhook. This path handles the normal case and completes in seconds.

  - **Path 2 — Webhook (async backup)**: The platform MUST also listen for Razorpay
    payment webhooks as a backup for cases where the browser crashed or network dropped
    after payment was processed. A confirmed webhook event triggers the same booking
    completion pipeline as Path 1.

  - **Path 3 — Reconciliation job (safety net)**: A scheduled job MUST run every
    15 minutes, querying Razorpay's API for all platform orders in a non-terminal state
    older than 10 minutes. For each: if Razorpay reports PAID, complete the booking
    (or refund if slot is no longer available); if FAILED or EXPIRED, release the slot.

- **FR-011b**: If a payment is confirmed as succeeded by any path but the booking cannot
  be completed for any reason (e.g., slot just became unavailable), the platform MUST
  immediately and automatically issue a full refund via Razorpay's API. The patient MUST
  be notified via SMS and WhatsApp (if enabled) that the booking could not be confirmed
  and their refund has been initiated and will reach their account within 5–7 business
  days. Customer money is never held without a confirmed booking — no exception.

- **FR-011c**: If no payment confirmation arrives via any path within the 10-minute hold
  window (genuine non-payment — abandoned checkout, declined card), the slot MUST be
  released. No refund is issued as no successful charge exists.

- **FR-011d**: The booking confirmation button MUST be disabled immediately on first click
  to prevent duplicate submissions. The system MUST use a server-side idempotency key
  scoped to each Razorpay order so that if the same confirmation request reaches the
  server more than once, exactly one booking and one charge are created.
- **FR-011e**: Upon booking confirmation (triggered by any payment path in FR-011a), the
  platform MUST immediately attempt to create a Zoom meeting via the Zoom API using the
  platform's single Zoom Business account credentials. If the
  initial call fails, the platform MUST retry up to 3 times before treating the creation
  as failed. If all retries are exhausted without a successful Zoom meeting creation, the
  platform MUST: (1) cancel the booking, (2) issue an immediate full Razorpay refund,
  (3) notify the patient via SMS and WhatsApp (if enabled) with a clear explanation that
  the booking could not be completed due to a technical issue and that their refund has been
  initiated and will reach their account within 5–7 business days, (4) send an in-platform
  notification to the psychiatrist that the booking
  attempt failed, and (5) log the failure with timestamp, booking reference, and Zoom error
  details in the audit trail as a trackable operational metric. No manual link fallback is
  permitted — if Zoom meeting creation cannot complete automatically, the booking does not
  proceed under any circumstance.
- **FR-012**: The system MUST allow patients to cancel or reschedule an appointment.
  Cancellations made ≥24 hours before the session MUST trigger a full refund via Razorpay
  and release the slot. The patient MUST be notified via SMS and WhatsApp (if enabled) that
  their refund has been initiated and will reach their account within 5–7 business days.
  Cancellations within 24 hours are non-refundable; the slot is still released for rebooking
  by other patients. Before a within-24h cancellation is finalised, the platform MUST display
  a confirmation step clearly stating the exact session fee amount that will be forfeited and
  that no refund will be issued. The patient MUST explicitly confirm before the cancellation
  proceeds — there is no way to trigger a non-refundable cancellation in a single tap. Rescheduling is a guided cancel-then-rebook flow — there is no separate
  rescheduling state machine. When a patient selects "Reschedule", the platform cancels the
  existing booking applying the standard refund rules above, marks the appointment as
  cancelled-by-patient (rescheduled) in the patient's history, and immediately routes the
  patient to the slot-selection screen with the same psychiatrist pre-selected. The patient
  then books a new slot as a fresh appointment.
- **FR-012a**: Psychiatrists and agency admins MUST be able to cancel a confirmed appointment
  at any time. A psychiatrist-initiated cancellation MUST always trigger: (1) a full Razorpay
  refund to the patient regardless of timing, (2) release of the slot back to availability,
  and (3) an SMS notification to the patient's mobile number plus a WhatsApp message (if
  enabled) containing an apology message, a statement that their refund has been initiated
  and will reach their account within 5–7 business days, and a direct link to rebook with
  any available psychiatrist.
- **FR-012b**: When a psychiatrist account is deactivated by a Platform Admin or Agency Admin,
  the system MUST immediately: (1) cancel all upcoming confirmed bookings linked to that
  psychiatrist, (2) issue a full Razorpay refund for each cancelled booking, and (3) notify
  each affected patient via SMS and WhatsApp (if enabled) with the cancellation reason entered
  by the admin at the time of deactivation, a statement that their refund has been initiated
  and will reach their account within 5–7 business days, and a direct link to the matching
  flow to rebook with a new psychiatrist. The deactivated psychiatrist's historical session records and
  approved care recommendations remain part of the patient's care history and are accessible
  to any new psychiatrist the patient matches with.
- **FR-013**: Psychiatrists MUST be able to view the following for any patient they have
  a booking with (within the platform-configured access window per FR-018a):
  (1) The patient's intake questionnaire responses.
  (2) Structured care recommendations from all psychiatrists who have treated the patient
  (medications, activities, follow-up dates, free-text notes) — regardless of which
  psychiatrist authored them. This is required for clinical safety (avoiding conflicting
  prescriptions).
  (3) Full raw Zoom transcript text for sessions they personally conducted only.
  Raw transcripts from sessions conducted by other psychiatrists MUST NOT be accessible
  under any circumstance — this preserves the confidentiality of prior therapeutic
  relationships.
- **FR-013a**: The psychiatrist portal MUST display an upcoming appointments view listing
  all confirmed future sessions across all their patients. For each upcoming appointment,
  the Zoom join link MUST be prominently shown so the psychiatrist can join directly from
  the platform without needing to locate their confirmation email.
- **FR-014**: Psychiatrists MUST only be able to access patient data for patients with whom
  they have a booking within the platform-configured access window (FR-018a). Access to all
  other patients' data is strictly forbidden — no lateral access. Once the access window
  expires (no new booking within the configured period), all patient data becomes inaccessible
  to that psychiatrist until a new booking is created.

**Long-Term Patient Profile**

- **FR-015**: After each session, the platform MUST receive the session transcript from Zoom
  via webhook and use it to generate a structured draft recommendation (medications mentioned,
  activities discussed, follow-up date) for the psychiatrist to review.
- **FR-015a**: The psychiatrist MUST explicitly review and approve (or edit) the draft before
  any transcript-derived information is written to the patient's care record. No automated
  update to the patient profile is permitted without psychiatrist approval.
- **FR-015d**: The raw session transcript MUST be retained for 7 years from the date of the
  associated session, stored alongside other clinical records. On execution of a Data
  Lifecycle Service deletion job, the transcript MUST undergo the same Phase 2 anonymisation
  as all other clinical records — patient identifiers replaced with a pseudonymous ID and
  the transcript text retained. Transcripts are never deleted before the 7-year period
  regardless of whether the patient ends their relationship, switches psychiatrists, or
  submits a deletion request (in which case anonymisation, not erasure, applies to the
  transcript text).
- **FR-015b**: Psychiatrists MUST also be able to add recommendations manually, independent
  of the transcript. The session notes form MUST collect all fields required for MHCA 2017
  Form B-1 compliance. Required fields (psychiatrist must complete before approving):
  presenting complaints summary, clinical observations / progress notes, treatment type
  (pharmacological / psychotherapy / combined), consent status confirmation, and an
  identity verification checkbox: "I have verbally confirmed this patient's name and date
  of birth at the start of this session" — satisfying the Telemedicine Practice Guidelines
  2020 requirement for active identity confirmation at consultation time. The checkbox is
  mandatory and its completion is audit-logged (timestamp, session reference). Optional
  fields (psychiatrist may leave blank): history summary, techniques used, capacity
  assessment notes, risk/benefit discussion notes, and Mental Status Examination (MSE) —
  a single free-text area for the psychiatrist to document MSE findings across the standard
  10 domains (appearance, behaviour, speech, mood, affect, thought process, thought content,
  perception, cognition, insight/judgment) in their own format. MSE is a distinct labeled
  field separate from "clinical observations / progress notes" to preserve clinical
  distinction; a structured 10-domain MSE form is deferred to v2.

  For Follow-Up and Urgent Review sessions only, the form MUST additionally show a
  Subjective (Patient Self-Report) section with the following optional fields the
  psychiatrist fills in based on what the patient reports at the start of the session:
  - Medication adherence: dropdown (Yes / Partial / No) + free-text notes
  - Side effects reported: free text
  - Symptom trajectory since last visit: dropdown (Improved / Stable / Worsened)
  - Sleep quality: free text (optional)
  - Appetite: free text (optional)
  - Significant life events since last visit: free text (optional)
  This section is not shown for Initial Assessment sessions. All Subjective fields are
  optional — psychiatrist may leave any or all blank.

  Pre-populated fields (auto-filled from profile/prior records, editable): medication
  name, dosage, frequency, activity type, and recommended next session date (FR-046).
  Pre-populated read-only fields (from PatientProfile, not editable in session notes):
  advance directive (if any) and nominated representative name and contact (if any) —
  displayed so the psychiatrist is aware of them at every session for Form B-1
  documentation purposes. The psychiatrist MUST explicitly confirm Form B-1 completion
  by checking a declaration before the session record is approved and written to the
  patient's care record. The session record is stored as the platform's Form B-1
  equivalent and retained for 7 years.
- **FR-015c**: If no transcript is received from Zoom within 60 minutes of a session's
  scheduled end time, the system MUST: (1) display a notice to the psychiatrist on the
  patient's record stating the transcript was not received, (2) prompt them to enter
  recommendations manually via FR-015b, and (3) log the transcript failure with timestamp
  in the audit trail. No retry is attempted; manual entry is the sole fallback.
- **FR-016**: The system MUST append all approved recommendations to the patient's permanent
  record, timestamped and attributed to the psychiatrist who approved them.
- **FR-017**: Patients MUST be able to view their complete care history: all past sessions,
  recommendations, and their current active care plan. For each upcoming confirmed
  appointment, the patient's portal MUST prominently display the Zoom join link so the
  patient can join their session directly from the platform without hunting through
  confirmation messages.
- **FR-018**: The platform MUST use a booking-driven access model — there is no "active
  relationship" concept. A patient may book any psychiatrist at any time: either from the
  "Previously seen" section (all psychiatrists they have ever booked with, sorted by most
  recent session) or from the "Find new match" flow (full matching algorithm). There is no
  constraint preventing a patient from booking multiple psychiatrists simultaneously. When
  a patient has no upcoming confirmed bookings — including patients who have never booked at
  all — there is no prerequisite or required action before booking; they proceed directly to
  the matching or "Previously seen" flow with no restrictions.
- **FR-018a**: Psychiatrist access to patient data is governed by the following rules:
  (1) Raw session transcripts are per-pair only — a psychiatrist can read only transcripts
  from sessions they personally conducted with that patient; transcripts from sessions
  with other psychiatrists are never visible.
  (2) Structured care recommendations (medication details, activity prescriptions, follow-up
  dates, free-text notes) authored by any psychiatrist are visible to any psychiatrist who
  has had a booking with the patient within the platform-configured access window (default:
  3 months from last completed session).
  (3) The patient's intake questionnaire responses are visible to any psychiatrist who has
  had a booking within the same access window.
  (4) A psychiatrist's access to a patient's profile, recommendations, and intake
  automatically expires when no booking exists within the access window. The window resets
  on each new confirmed booking. All access window durations are stored in PlatformConfiguration
  and are editable by Platform Admins without a code change.

**Post-Session Feedback & Psychiatrist Ratings**

- **FR-037**: After each completed session, the platform MUST detect session completion
  via the Zoom webhook and immediately surface a feedback prompt to the patient within
  the web application on their next page load or active session. The prompt MUST display
  immediately — it cannot be deferred indefinitely. The patient MUST be able to skip it
  once; a skipped prompt MUST reappear on the next login until submitted or explicitly
  dismissed a second time (at which point it is recorded as skipped). The feedback form
  MUST collect: a 1–5 star rating and responses to structured qualitative dimensions
  (specific questions defined by clinical advisors, out of scope for this spec). Submitted
  feedback is linked to the specific Appointment record.

- **FR-038**: The platform MUST maintain an aggregated rating profile per psychiatrist,
  computed from all SessionFeedback records linked to their appointments. The aggregated
  rating (average score, session count, rating distribution) MUST be visible to Platform
  Admins and Agency Admins in their respective portals. Psychiatrist visibility of their
  own rating is OFF by default. Platform Admins MAY enable it via a toggle in the Platform
  Admin dashboard (stored in PlatformConfiguration). When enabled, psychiatrists see only
  their aggregate average score, their percentile band, and their total session count on
  their profile dashboard. Individual patient ratings and raw per-session scores MUST NOT
  be shown to psychiatrists under any circumstance, regardless of the toggle state. Raw
  ratings and scores MUST NOT be shown to patients under any circumstance. Patients MUST instead see a percentile
  ranking for each psychiatrist (e.g., "Top 5%", "Top 10%") computed relative to all
  active psychiatrists on the platform. The percentile is displayed on the match list and
  the "Previously seen" section. Percentile band labels and their boundary values (e.g.,
  what score range qualifies as "Top 5%") MUST be configurable by Platform Admins via the
  Platform Admin dashboard — no code change or deployment required to adjust band
  definitions. Defaults are stored in PlatformConfiguration.

- **FR-039**: The platform MUST enforce configurable eligibility rules that automatically
  remove psychiatrists from the new-patient matching pool when their rating falls below
  defined thresholds. All eligibility rules MUST be configurable by Platform Admins via
  a dedicated settings panel in the Platform Admin dashboard — no code change or
  deployment required. Default rules (stored in PlatformConfiguration):
  - Rule 1: ≥5 completed sessions with average rating < 2.0 → ineligible for new patients
  - Rule 2: ≥10 completed sessions with average rating < 3.0 → ineligible for new patients
  Platform Admins MUST be able to add, edit, or remove eligibility rules from the dashboard.
  An ineligible psychiatrist MUST NOT appear in matching results or the "Previously seen"
  section for patients who have not previously booked them. Existing confirmed bookings
  with an ineligible psychiatrist MUST be honoured and completed normally. Agency Admins
  and Platform Admins MUST be notified when a psychiatrist becomes ineligible. The
  psychiatrist themselves is NOT notified of their ineligibility status.

- **FR-040**: Psychiatrist ratings MUST be a weighted factor in the matching algorithm
  (FR-006). The rating weight is configurable in PlatformConfiguration alongside other
  matching weights. Psychiatrists with no completed sessions (no rating yet) MUST still
  appear in matching results and MUST be clearly indicated as "New" to the patient.

**Payments & Tax Compliance**

- **FR-041**: The platform MUST generate a GST-compliant tax invoice for every confirmed
  and paid booking. Indian GST law requires a tax invoice to be issued for all taxable
  services (mental health consultations are a taxable service). The invoice MUST include
  at minimum: a sequential GST invoice number, booking reference, session date and time,
  psychiatrist name, session fee, applicable GST amount and rate, and the GSTIN of the
  issuing entity. The invoice MUST be delivered to the patient (via a link in the booking
  confirmation SMS/WhatsApp message or available for download from their booking history)
  within 24 hours of payment confirmation.

  **Sequential invoice numbering**: GST law requires invoices to carry a unique sequential
  number series. The platform MUST auto-generate invoice numbers in the format
  `[PREFIX]/[FY]/[SEQUENCE]` — e.g., `MHP/2026-27/00001`. The sequence MUST be
  auto-incrementing, gapless, and reset to 00001 on April 1 each financial year. The
  prefix is configurable by Platform Admins (stored in PlatformConfiguration). The
  invoice_number field MUST be stored on the Payment entity and is immutable once issued.

  **Pre-implementation decision required**: The GSTIN on the invoice (platform company vs.
  agency) depends on the legal service-provider structure — whether the platform is the
  merchant of record or an Electronic Commerce Operator acting on behalf of the agency.
  This MUST be confirmed with a chartered accountant before implementation begins. The FR
  is recorded now to ensure the requirement is not missed; the legal structure decision
  will be captured in the implementation plan.

**Data Lifecycle & Deletion**

All data deletion — regardless of trigger — MUST be handled by a single centralised
Data Lifecycle Service. This service maintains a deletion job queue and processes every
deletion request through the same pipeline, ensuring consistent behaviour, auditability,
and compliance across all deletion scenarios.

- **FR-028**: The Data Lifecycle Service MUST support three distinct deletion trigger types,
  each enqueued as a typed job:

  - **Type 1 — On-Demand**: Triggered when a patient submits a self-service deletion
    request from their profile settings. SLA: processed within 72 hours of request.
    Patient receives a WhatsApp/SMS confirmation when complete.

  - **Type 2 — Abandoned Account Cleanup**: Triggered automatically when a patient account
    has been in incomplete-intake status with no login for 30 consecutive days. A single
    reminder notification is sent via WhatsApp (if available) or SMS at the 48-hour
    inactivity mark. If still incomplete at 30 days, a Type 2 job is enqueued. SLA:
    processed within 24 hours of trigger. No patient confirmation is sent (account
    is incomplete; no meaningful care data exists).

  - **Type 3 — Data Expiry**: Triggered automatically when a patient's last platform
    activity date is older than 7 years. A scheduled daily scan identifies eligible
    accounts and enqueues Type 3 jobs. SLA: processed within 24 hours of trigger.

- **FR-029**: Regardless of deletion type, the Data Lifecycle Service MUST execute the
  same two-phase deletion pipeline for every job:

  - **Phase 1 — PII Erasure**: Permanently and irreversibly delete all personally
    identifiable information: name, mobile number, WhatsApp number, email, payment
    details, device tokens, and any raw identifiers in logs or analytics.

  - **Phase 2 — Clinical Record Anonymisation**: Replace all patient identifiers in
    clinical records — intake responses, session transcripts, care recommendations,
    and audit log entries — with a pseudonymous ID that is not stored or derivable
    from any remaining data. Anonymised records are retained for 7 years from the
    date of the associated session for legal and audit purposes, then permanently purged.

- **FR-030**: Every deletion job MUST produce a structured audit entry recording: job type
  (On-Demand / Abandoned / Expiry), pseudonymous patient ID, timestamp of enqueue,
  timestamp of completion, data categories erased, and data categories anonymised.
  This audit entry MUST itself contain no PII and MUST be retained permanently.

- **FR-031**: The platform MUST expose a self-service deletion request option in the
  patient's profile settings, clearly labelled with the consequences (PII deleted,
  clinical records anonymised and retained for compliance). On submission, the patient
  MUST receive an immediate on-screen acknowledgement and a WhatsApp/SMS confirmation
  when the job completes within the 72-hour SLA.

- **FR-033**: The platform MUST provide a Platform Admin portal accessible only to the
  platform operator's internal staff (PlatformAdmin role). Platform Admins MUST be able to:
  (1) view the deletion job dashboard (pending, processing, completed, SLA-breached jobs
  by type — no PII visible); (2) view payment reconciliation flags (unresolved Razorpay
  orders, failed auto-refunds); (3) view Zoom transcript failure logs; (4) view WhatsApp
  and SMS delivery failure logs; (5) manually trigger a Razorpay refund for flagged
  payments; (6) deactivate patient or psychiatrist accounts where required;
  (7) reset TOTP enrollment for any non-patient user who has lost their authenticator
  device — each reset is audit-logged per FR-001e;
  (8) create PlatformAdmin accounts and the first AgencyAdmin account for a new agency
  per FR-001h;
  (9) configure rating and matching settings via a dedicated settings panel: eligibility
  rule thresholds (min sessions + avg rating cutoffs), percentile band labels and
  boundary values, and matching algorithm factor weights — all changes take effect
  immediately without redeployment and are audit-logged.
- **FR-034**: Platform Admins MUST have zero access to patient clinical data — intake
  responses, session transcripts, care recommendations, and session notes are not visible
  in the Platform Admin portal under any circumstance.
- **FR-035**: All platform time-based thresholds and configurable limits MUST be stored in
  a PlatformConfiguration store editable by Platform Admins without a code change or
  deployment. The following values MUST be configurable:
  - Psychiatrist access window after last session (default: 3 months)
  - OTP expiry duration (default: 5 minutes)
  - OTP max failed attempts before lockout (default: 3)
  - OTP lockout duration (default: 15 minutes)
  - Web session idle timeout (default: 30 minutes)
  - Web session absolute timeout (default: 8 hours)
  - Slot hold duration during checkout (default: 10 minutes)
  - Zoom transcript wait window before fallback (default: 60 minutes)
  - Razorpay reconciliation job interval (default: 15 minutes)
  - Abandoned account inactivity nudge delay (default: 48 hours)
  - Abandoned account auto-delete threshold (default: 30 days)
  - Patient data retention period (default: 7 years)
  - Password reset link expiry (default: 30 minutes)
  - Non-patient failed password attempt threshold before lockout (default: 3)
  - Non-patient password lockout duration (default: 15 minutes)
  - Appointment reminder intervals before session (default: 48 hours, 2 hours, 15 minutes)
  - Default daily Tier 3 notification cap per patient (default: 3)
  - Non-patient password minimum length (default: 12)
  - Non-patient password complexity rules (default: uppercase + number + special character required)
  - Account activation link expiry (default: 24 hours)
  - Psychiatrist rating eligibility rules (default: ≥5 sessions + avg < 2.0 → ineligible; ≥10 sessions + avg < 3.0 → ineligible)
  - Matching algorithm factor weights (rating percentile, symptom match, availability, preferences)
  - Rating percentile band labels (default: Top 5%, Top 10%, Top 25%, Top 50%)
  - Match result list size (default: 5)
  - "Closest available" match score threshold (default: configurable per deployment)
  - Session type durations (default: Initial Assessment = 60 min, Follow-Up = 30 min, Urgent Review = 60 min)
  - Maximum slot publication horizon (default: 3 months ahead of today)
  - Psychiatrist no-show refund mode (default: auto; options: auto, manual-review)
  - Psychiatrist no-show manual review SLA (default: 24 hours)
  - List C prohibited drug list (default: alprazolam, diazepam, lorazepam, nitrazepam,
    chlordiazepoxide, zolpidem, methylphenidate, modafinil, phenobarbitone, depot
    antipsychotics — editable by Platform Admins to accommodate regulatory changes)
- **FR-036**: The platform MUST provide a unified self-service records request in the
  patient's profile settings, satisfying two distinct legal obligations in a single flow:
  (1) DPDPA 2023 data portability right, and (2) MHCA 2017 Section 25 right to access
  clinical records (Form A equivalent). One request button covers both — delivering within
  72 hours satisfies the stricter DPDPA deadline and well within the MHCA 2017 15-day
  obligation.

  On request: (1) the platform enqueues an async export job; (2) the patient receives an
  immediate on-screen acknowledgement citing both legal rights being fulfilled; (3) within
  72 hours the platform delivers a secure, time-limited download link via WhatsApp (if
  enabled) and SMS.

  The export package MUST include:
  - Intake questionnaire responses
  - All approved session notes / care recommendations (all psychiatrists)
  - All issued prescriptions (PDF copies)
  - Appointment history
  - Notification preferences
  - The patient's own submitted SessionFeedback records

  Raw Zoom transcripts are excluded — they are intermediate processing artifacts, not
  formal clinical records, and are retained under the Data Lifecycle Service (FR-028).
  The approved session notes (CareRecommendation records) are the formal clinical record
  and are included.

  The download link MUST expire after 48 hours. Export jobs MUST be visible in the Platform
  Admin deletion dashboard (FR-033) for audit purposes.
- **FR-032**: The Data Lifecycle Service MUST expose its job queue status to the Platform
  Admin portal (FR-033), showing pending jobs by type, average processing time, jobs
  completed in the last 30 days, and any jobs that exceeded their SLA. No patient PII
  is visible in this view.

**Personalized Notifications**

- **FR-019**: The notification system operates across three distinct tiers with separate
  delivery channels:
  - **Tier 1 — Authentication (OTP)**: Delivered via SMS to the patient's registered mobile
    number. Always required; not configurable.
  - **Tier 2 — Booking confirmations and reminders**: Delivered via SMS to the patient's
    mobile number. Additionally sent via WhatsApp if the patient has a resolved WhatsApp
    number and WhatsApp notifications are toggled on. Appointment reminders are sent at
    three intervals before the session: 48 hours, 2 hours, and 15 minutes. Only reminders
    whose scheduled time is still in the future at the moment of booking confirmation are
    queued — windows that have already passed are skipped entirely. All reminder intervals
    are stored in PlatformConfiguration and editable by Platform Admins. All Tier 2
    messages that reference a specific psychiatrist MUST include the psychiatrist's MCI
    registration number alongside their name — e.g. "Dr. [Name] (MCI Reg: [number])" —
    as required by the Telemedicine Practice Guidelines 2020.
  - **Tier 3 — Care reminders** (medication reminders, activity nudges, follow-up prompts):
    Delivered via WhatsApp only. Sent exclusively if the patient has a resolved WhatsApp
    number and WhatsApp notifications are toggled on. Never sent via SMS.
- **FR-020**: Care reminder timing (Tier 3) MUST be driven entirely by each patient's
  individual preference settings — no platform-wide schedules. When a patient updates
  their Tier 3 reminder preferences (timing, category opt-in/out, or daily cap), the
  platform MUST immediately cancel all pending (not yet delivered) Tier 3 reminders for
  that patient and reschedule them according to the new preferences — including reminders
  already queued for the same day. Changes take effect within minutes of saving. The
  platform MUST enforce a daily cap on Tier 3 notifications per patient (default: 3 per
  day). Patients MUST be able to raise or lower this cap from their notification
  preferences page. The default cap
  is stored in PlatformConfiguration and is editable by Platform Admins. Tier 2 booking
  reminders and Tier 1 OTPs do not count toward the daily cap.
- **FR-021**: Patients MUST be able to toggle WhatsApp notifications on or off globally
  from their profile settings page (default: on). When toggled off, all Tier 2 WhatsApp
  messages and all Tier 3 care reminders are suppressed. SMS booking confirmations and
  OTPs are unaffected by this toggle.
- **FR-021a**: Patients MUST also be able to opt in or out of each Tier 3 care reminder
  category (medication reminders, activity nudges, appointment follow-up prompts)
  independently, as long as WhatsApp notifications are globally toggled on.

- **FR-021b**: When a prescription is finalised (FR-043), the platform MUST display each
  medication to the patient in their profile under a "My Medications" section. For each
  medication the patient CAN set a daily reminder time (e.g. 08:00). Once set, the
  platform sends a Tier 3 WhatsApp reminder each day at that time: "Time for your
  [DRUG NAME] — [dosage], [frequency]. Prescribed by Dr. [Name]." Reminders run
  automatically for the prescription duration (as entered in FR-043) and stop on the
  final day without requiring any patient action. If the patient does not set a reminder
  time for a medication, no reminder is sent for that medication. The patient can update
  or cancel a reminder from their profile at any time. Multiple active prescriptions with
  overlapping durations each schedule their own independent reminders. All medication
  reminder events are subject to the patient's daily notification cap (FR-020) and the
  global WhatsApp toggle (FR-021).
- **FR-022**: If a WhatsApp message fails to deliver, the system MUST log the failure
  with timestamp and error reason in the audit trail. There is no SMS fallback for
  WhatsApp failures. Failures are surfaced in the patient's profile for manual follow-up.
- **FR-023**: Tier 3 care reminders MUST NOT be sent to patients who have no active care
  plan. Tier 2 booking confirmations are sent regardless of care plan status.

### Key Entities

- **Patient**: Registered user; holds identity, intake responses, consent record,
  notification preferences, and care history.
- **IntakeQuestionnaire**: Structured set of questions grouped into sections; responses
  stored per patient, supports partial completion.
- **PlatformAdmin**: The platform operator's internal operations staff. Has access to
  system health dashboards (deletion job queue, payment reconciliation flags, Zoom
  transcript failures, WhatsApp delivery failures, audit logs) and can trigger manual
  refunds and account-level actions. Has zero access to patient clinical data.
- **Agency**: A partner organisation that supplies psychiatrists to the platform. The
  platform supports multiple agencies simultaneously. Each agency has a name, contact
  details, and an active/inactive status. Psychiatrists belong to exactly one agency.
  AgencyAdmins are scoped to one agency and can only manage that agency's psychiatrists
  and availability. Patients are matched across psychiatrists from all active agencies.
- **AgencyAdmin**: A staff member of a partner agency. Multiple AgencyAdmins per agency
  are permitted. Has permission to manage psychiatrist profiles, availability slots, and
  session fees for their agency, and to create additional AgencyAdmin and Psychiatrist
  accounts within their agency. Cannot access patient clinical data.
- **PsychiatristProfile**: Agency-supplied profile belonging to exactly one Agency.
  Contains: credentials, qualifications, specializations, languages, MCI (Medical Council
  of India) registration number (mandatory — required on all prescriptions and telemedicine
  communications per Telemedicine Practice Guidelines 2020), clinic/affiliation name, session fee (a single fixed INR amount set by
  the agency admin — one fee per psychiatrist, immutable on existing bookings when updated),
  aggregated rating (average score, session count, rating distribution — visible to admins
  only), percentile rank (computed relative to all active psychiatrists — shown to patients),
  and eligibility status (eligible / ineligible per FR-039 rules).
- **AvailabilitySlot**: A defined time window on a psychiatrist's calendar with status
  (open, booked, blocked), session_type (Initial Assessment, Follow-Up, Urgent Review),
  and duration in minutes (derived from session_type via PlatformConfiguration at creation
  time — not set manually). Manageable by both the psychiatrist and agency admin.
- **SessionTranscript**: Full text transcript of a Zoom session received via webhook;
  linked to an Appointment; used to generate a draft CareRecommendation pending
  psychiatrist approval. Retained for 7 years from session date; anonymised (not deleted)
  when a patient deletion job runs.
- **MatchScore**: Computed ranking of a psychiatrist for a given patient; includes
  contributing factors and weights used.
- **Appointment**: A confirmed booking linking one patient to one psychiatrist at a
  specific date/time; has status (scheduled, completed, cancelled-by-patient,
  cancelled-by-patient-rescheduled, cancelled-by-psychiatrist, cancelled-by-deactivation,
  no-show-by-psychiatrist, no-show-by-patient), session_type (Initial Assessment,
  Follow-Up, Urgent Review), and records the Zoom meeting ID and join URL. All sessions
  are Zoom video in v1. The cancelled-by-patient-rescheduled status distinguishes a
  rescheduled cancellation from a pure cancellation. The no-show-by-psychiatrist status
  is set automatically by FR-045 when the psychiatrist's presence is absent from Zoom
  participant data. The no-show-by-patient status is set when the meeting ends with the
  patient absent from Zoom participant data — fee is non-refundable; psychiatrist is
  prompted to add session notes or skip.
- **SessionFeedback**: Patient-submitted feedback linked to a specific Appointment; contains
  a 1–5 star rating and structured qualitative responses; submitted immediately after session
  completion; visible to Platform Admins and Agency Admins only — never to patients or the
  rated psychiatrist directly.
- **CareRecommendation**: A post-session clinical note authored by a psychiatrist: medication
  details (for continuity of care reference only — not a formal prescription), activity
  prescription, follow-up date, free-text notes. Distinct from Prescription (the formal
  legal document issued to the patient for pharmacy dispensing).
- **Prescription**: A formal e-prescription document generated by a psychiatrist via the
  prescription tool (FR-043). Linked to an Appointment. Contains: auto-populated psychiatrist
  fields (name, qualifications, MCI registration number, clinic/affiliation), auto-populated
  patient fields (name, age, address, ID verification record), one or more medication entries
  (generic name in CAPITALS, dosage, frequency, duration, route, special instructions),
  date of consultation, and a finalisation record (acting as digital signature). A PDF
  rendition is generated on finalisation and stored for 7 years. Retained as a clinical
  record and excluded from patient data export (it is a clinical document, not patient-
  authored data).
- **PatientProfile**: Aggregated view of a patient's full history: intake responses, all
  appointments across all psychiatrists (past and upcoming), care recommendations from all
  psychiatrists, and current active care plan. No "active psychiatrist" reference — access
  is determined dynamically by booking recency per FR-018a. Includes two optional MHCA 2017
  fields the patient can set from profile settings: `advance_directive` (free text, nullable)
  and `nominated_representative_name` + `nominated_representative_contact` (text, nullable).
  These carry no platform permissions or automated actions — they are documentation fields
  surfaced to psychiatrists in session notes (FR-015b) for Form B-1 compliance.
- **NotificationPreference**: Per-patient settings: resolved WhatsApp number (nullable —
  same as mobile if checkbox was ticked, different number, or null if opted out);
  global WhatsApp toggle (boolean, default true); preferred delivery times per Tier 3
  category; per-category opt-in/out for medication reminders, activity nudges, and
  follow-up prompts; daily Tier 3 cap (integer, default pulled from PlatformConfiguration,
  patient-adjustable).
- **NotificationEvent**: A single scheduled or delivered notification instance with
  delivery status and retry history.
- **Payment**: Linked to an Appointment; records amount charged (INR, locked at booking
  confirmation from PsychiatristProfile.fee at that moment), currency (INR), Razorpay
  order and payment IDs, status (pending, succeeded, failed, refunded), and timestamps.
- **PlatformConfiguration**: A singleton store of all platform-wide configurable thresholds
  and defaults (access window, OTP settings, timeouts, retention periods, etc.). Editable
  by Platform Admins only. Every value has a documented default. Changes take effect
  immediately without redeployment. All changes are audit-logged.
- **DataDeletionJob**: A queued deletion task with type (On-Demand / Abandoned / Expiry),
  pseudonymous patient reference, enqueue timestamp, status (pending, processing, completed,
  failed), completion timestamp, and a summary of data categories erased and anonymised.
  Contains no PII.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new patient can complete registration and the full intake questionnaire in
  under 10 minutes.
- **SC-002**: A patient receives their first ranked list of psychiatrist matches within
  5 seconds of completing the intake questionnaire.
- **SC-003**: 90% of patients who begin the intake questionnaire complete it within a
  single session or across resumed sessions within 48 hours.
- **SC-004**: Appointment booking (from match selection to confirmation) is completable
  in under 3 minutes.
- **SC-005**: Psychiatrists can access a patient's complete intake summary and history
  within 10 seconds of opening the patient record.
- **SC-006**: A psychiatrist can review, edit if needed, and approve a transcript-generated
  draft care recommendation in under 2 minutes for a standard session.
- **SC-007**: Personalized notifications are delivered within ±5 minutes of the patient's
  stated preferred time.
- **SC-008**: Notification delivery success rate is at or above 95% across all active
  patients.
- **SC-009**: Zero instances of double-booking a psychiatrist for the same time slot.
- **SC-010**: All patient data access events are recorded in an audit log and retrievable
  by compliance teams within 24 hours of the event.
- **SC-011**: Patient account deletion requests are fully processed — PII deleted and
  clinical records anonymised — within 72 hours of the request being submitted.
- **SC-012**: No patient PII is accessible in the system after a deletion request has
  been completed, verifiable via audit log review.
- **SC-013**: The platform supports up to 500 concurrent users without performance
  degradation — all response time targets (SC-001 through SC-007) hold under full load.
- **SC-014**: Platform availability is at or above 99.5% measured monthly (~3.6 hours
  maximum downtime per month), excluding scheduled maintenance windows communicated
  at least 24 hours in advance.
- **SC-015**: The system architecture supports scaling to 5,000 concurrent users without
  requiring structural changes to the data model or service boundaries.
- **SC-016**: Zero instances of a patient being charged via Razorpay without either a
  confirmed booking or an automatic full refund being issued within 15 minutes.
- **SC-017**: In the normal payment flow (Path 1), booking confirmation is displayed to
  the patient within 5 seconds of payment completion on Razorpay.
- **SC-018**: Zoom meeting creation failures (all retries exhausted) are logged as
  operational metrics and are reviewable by Platform Admins in the admin portal. The
  Zoom failure rate (FR-011e failures as a percentage of total confirmed bookings) MUST
  be trackable and visible in the platform operations dashboard.

---

## Assumptions

- Psychiatrists are onboarded to the platform by the partner agency — the platform does not
  handle psychiatrist self-registration or credential verification in this phase.
- Psychiatrist profiles (name, credentials, specialization, languages) are created by the
  agency admin on the platform. Availability slots are managed in real time by both the
  agency admin and the psychiatrist — there is no external calendar sync in v1.
- All sessions are conducted via Zoom video call. The platform creates a Zoom meeting via
  the Zoom API on booking confirmation and receives the session transcript via Zoom webhook
  after the session ends. The transcript is used to generate a draft recommendation;
  the psychiatrist must approve before anything is written to the patient record.
- The platform operates a single Zoom Business account. All session meetings are created
  under this account via the Zoom API. Patients and psychiatrists join as external
  participants via the generated link — no Zoom account is required of either party.
  All transcript webhooks are received on this single account. Zoom cloud recording and
  auto-transcription must be enabled on this account. Transcript quality is subject to
  Zoom's transcription accuracy.
- The platform targets Indian users; regulatory compliance (Mental Healthcare Act 2017,
  DPDPA 2023) is mandatory for all data handling decisions.
- The platform is a web application. No mobile app exists in v1. All users — patients,
  psychiatrists, and agency admins — access the platform via web browser.
- Notifications use three tiers: (1) OTP via SMS to mobile number; (2) booking confirmations
  via SMS to mobile number + WhatsApp if enabled; (3) care reminders via WhatsApp only.
  During registration, patients tick a checkbox "Use this number for WhatsApp notifications
  too?" (pre-ticked). If unchecked they may enter a different WhatsApp number or opt out.
  WhatsApp notifications can be toggled on/off globally from the profile settings page
  (default: on). WhatsApp delivery failures are logged; no SMS fallback exists for
  WhatsApp failures.
- Patients are assumed to have internet access and a WhatsApp account. Offline-first support
  and native mobile app are out of scope for v1.
- Payment is collected at booking time via Razorpay (INR). The slot is held for up to
  10 minutes during checkout. Booking confirmation uses a three-path strategy: (1) real-time
  HMAC-SHA256 signature verification (primary), (2) Razorpay webhook (async backup),
  (3) a 15-minute reconciliation job (safety net). If payment is confirmed but booking
  cannot be completed, an automatic full refund is issued immediately — customer money is
  never held without a confirmed booking. Cancellations ≥24 hours before the session
  receive a full refund; within 24 hours are non-refundable.
- The intake questionnaire content (specific questions and scoring rubrics) is provided by
  clinical advisors; this spec covers the delivery mechanism and data storage, not question
  design.
- Multi-language support (Hindi and regional languages) is planned but the v1 questionnaire
  and UI will be English-first; i18n hooks must be in place from day one.
- All data deletion — on-demand, abandoned account cleanup, and 7-year expiry — is handled
  by a single centralised Data Lifecycle Service using a typed job queue. All jobs run the
  same two-phase pipeline: PII erasure then clinical record anonymisation. Anonymised records
  are retained for 7 years from session date per DPDPA 2023 and Indian medical record law.
- Initial scale target is 500 concurrent users with 99.5% monthly uptime. The system must
  be designed to scale to 5,000 concurrent users without structural rewrites.

---

## Future Readiness

These capabilities are intentionally out of scope for v1 but MUST be considered in
architectural decisions today so they can be added without structural rewrites.

### AI-Powered WhatsApp Companion (v2)

Transform the WhatsApp notification channel into a two-way AI-powered care companion.
Patients would be able to initiate conversations directly in WhatsApp and receive
contextually aware responses grounded in their personal care data.

**What it enables**:
- Medication adherence confirmation ("Did you take your 10mg Escitalopram this morning?")
- Between-session support using psychiatrist-approved coping strategies from care records
- Activity check-ins tied to the patient's specific prescription (e.g., "How was your
  30-minute walk today?")
- Passive crisis signal detection with automatic escalation to crisis resources

**Why deferred to v2**:
- Core booking, matching, and care record features must be stable before this layer is added
- Requires extensive safety testing and guardrails before deployment to vulnerable users
- Regulatory grey area under Mental Healthcare Act 2017 for AI-generated health responses
- Meaningful LLM API cost that is better justified once patient base is established

**What must be designed correctly in v1 to enable v2 without rewrites**:
- Intake responses, care recommendations, and approved psychiatrist notes MUST be stored
  in structured, queryable format (already required by FR-004, FR-016)
- WhatsApp integration MUST use the official Business API (not workarounds) so two-way
  messaging can be enabled by adding an incoming webhook handler
- Patient consent model MUST be extensible to cover AI interaction consent in v2
- The notification preference system MUST be designed as a general-purpose per-patient
  settings store, not a hardcoded notification-only structure

### Weekly Patient Effectiveness Check-ins (v2)

Periodic structured self-assessment sent to patients weekly via WhatsApp, independent
of session frequency. Questions track longitudinal progress on dimensions such as anxiety
level, sleep quality, and mood stability (specific questions defined by clinical advisors).

**What it enables in v2**:
- Patient progress charts visible to the patient and their psychiatrist
- AI-surfaced pattern observations to the psychiatrist (e.g., "anxiety scores trending
  upward over 3 weeks") — observations only, no clinical recommendations
- Earlier detection of deterioration between sessions

**Why deferred**: Requires stable patient base and sufficient data before AI pattern
observations are meaningful. Build the core care record and feedback system in v1 first.

**What must be designed correctly in v1**: The NotificationPreference and notification
delivery infrastructure built for care reminders naturally extends to weekly check-in
delivery. No structural changes required in v2.

### Patient Account Recovery — Mobile Number Change (v2)

Admin-mediated account recovery for patients who have lost access to their registered
mobile number. A Platform Admin verifies the patient's identity via out-of-band
confirmation (e.g., name, email, last booking reference), then updates the registered
mobile number via the admin portal. The patient can then log in with the new number and
receive OTPs normally.

**Why deferred**: PHI access risk requires careful identity verification design before
self-service or admin-mediated recovery can be safely offered. V1 takes the conservative
path — account inaccessible on number loss.

**What must be designed correctly in v1**: The Patient entity's mobile number field MUST
be stored as a mutable field (not used as the primary key) so it can be updated without
creating a new account or losing care history. Patient identity MUST be anchored to a
platform-generated UUID, not the mobile number.

### Multi-Language Support (v2)

Hindi and regional Indian language support for the intake questionnaire and patient-facing
UI. i18n hooks MUST be in place in all user-visible strings from day one of v1 (already
required by the constitution's Accessibility principle).

### Audio-Only and Text-Based Consultation Modes (v2)

V1 supports Zoom video only for all session types. V2 may introduce:
- **Audio-only**: Zoom audio call without video — lower bandwidth, more accessible for
  patients in rural or low-connectivity areas. Permitted for Follow-Up sessions only
  (not Initial Assessment, per Telemedicine Practice Guidelines 2020).
- **Text-based (async chat)**: Asynchronous text exchange within the platform. Suitable
  only for very low-acuity follow-ups; requires clinical advisor input on safe use cases
  before enabling for psychiatric patients.

**What must be designed correctly in v1**: The Appointment.session_type field and
AvailabilitySlot.session_type field introduced in FR-042 MUST be extensible to carry a
separate consultation_mode field in v2 without a schema migration that breaks existing records.

### Additional Session Types (v2)

V1 supports three session types: Initial Assessment, Follow-Up, Urgent Review.
V2 may introduce:
- **Medication Review**: A structured session specifically for reviewing and adjusting
  an existing medication regimen. Distinct from a general Follow-Up in documentation
  requirements and drug prescription scope.
- **Caregiver Consultation**: A session where an authorised caregiver consults on behalf
  of a patient who cannot attend directly (Telepsychiatry Operational Guidelines 2020).
  Requires patient written authorisation stored as a CaregiverAuthorisation record.

**What must be designed correctly in v1**: The session_type field MUST be stored as a
string enum (not a boolean) so additional types can be added in v2 without altering
existing Appointment or AvailabilitySlot records.

### Investigation Report Attachments (v2)

V1 has no file upload mechanism. Psychiatrists ask patients to email investigation reports
(blood tests, ECG, thyroid function, etc.) directly outside the platform; results can be
referenced in the free-text clinical observations field of FR-015b. V2 will introduce a
file attachment feature on session records, covering: secure upload (PDF/image), storage
with AES-256 encryption, virus scanning, 7-year retention, and inclusion in the anonymisation
pipeline (FR-029). The CareRecommendation entity should be designed with a nullable
`attachments` relationship so v2 can add this without a breaking schema change.

### MSE Structured Assessment (v2)

V1 captures Mental Status Examination as a single optional free-text field in FR-015b.
V2 will upgrade this to a structured 10-domain form (appearance, behaviour, speech, mood,
affect, thought process, thought content, perception, cognition, insight/judgment) once
real clinical workflow patterns are established from v1 usage.
