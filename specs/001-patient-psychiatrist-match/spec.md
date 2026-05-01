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
- Q: How long is patient data retained, and what happens on a deletion request? → A: Patient data is retained for 7 years from the date of last platform activity, then automatically purged. On a deletion request, all PII (name, contact, payment details) is deleted immediately. Clinical records (intake responses, transcripts, care recommendations) are anonymised — identifiers replaced with a pseudonymous ID — and retained for audit and legal purposes. Deletion requests are processed within 72 hours. The platform creates a Zoom meeting via the Zoom API when a booking is confirmed and includes the join link in the confirmation. After the session, Zoom sends a webhook with the cloud recording and auto-transcript to the platform. The transcript is used to generate a draft care recommendation that the psychiatrist reviews and approves before it updates the patient profile.

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

1. **Given** a patient with a medication recommendation on their profile, **When** their
   preferred reminder time arrives, **Then** they receive a push/SMS notification with
   the medication name, dosage, and a single-tap confirmation.
2. **Given** a patient whose notification preferences have changed (e.g., prefers reminders
   at 8 AM not 7 AM), **When** they update their preferences, **Then** all future
   notifications shift to the new schedule within 24 hours.
3. **Given** a patient with an activity recommendation (e.g., "30-minute walk"), **When**
   the scheduled time arrives, **Then** they receive a contextual nudge, not a generic
   broadcast message.
4. **Given** a patient who has an upcoming follow-up appointment, **When** 48 hours and
   2 hours before the appointment, **Then** they receive a reminder with the psychiatrist's
   name, time, and a link to join or prepare.
5. **Given** a patient who has opted out of a notification category (e.g., activity nudges),
   **When** the system schedules notifications, **Then** that category is suppressed and
   only opted-in categories are sent.

---

### Edge Cases

- What happens when a patient abandons the intake questionnaire mid-way and never returns?
- How does the system handle a psychiatrist becoming unavailable after a booking is confirmed?
- When no psychiatrist scores above the match threshold: the system shows the best available with a "closest available" label — the patient is never dead-ended (resolved: FR-010).
- What if a patient has no recommendations yet — are notifications silenced or do they
  receive onboarding-type nudges?
- What happens when the notification delivery channel (push or SMS) fails?
- How are duplicate bookings prevented if a patient taps "confirm" twice?

---

## Requirements *(mandatory)*

### Functional Requirements

**Patient Onboarding & Intake**

- **FR-001**: The system MUST allow patients to register using a mobile number or email address
  with OTP-based verification.
- **FR-002**: The system MUST present a structured intake questionnaire covering: presenting
  symptoms, symptom severity, mental health history, current medications, lifestyle factors,
  and psychiatrist preferences (gender, language). All sessions are conducted via Zoom video
  call; the platform generates the meeting link automatically upon booking confirmation.
- **FR-003**: The system MUST save questionnaire progress after each section so that a patient
  who exits mid-way can resume from the same point on next login.
- **FR-004**: The system MUST create a structured patient profile upon intake completion,
  storing all responses in a queryable, normalized format.
- **FR-005**: The system MUST require explicit consent from the patient before storing any
  sensitive health data, with a clear explanation of what is stored and why.

**Availability Management**

- **FR-024**: Agency admins MUST be able to create, update, and block time slots for any
  psychiatrist on the platform. Changes MUST take effect immediately for new bookings.
- **FR-025**: Each psychiatrist MUST be able to create, update, and block their own time
  slots directly, without requiring agency admin intervention.
- **FR-026**: When a slot that has an existing confirmed booking is blocked or deleted by
  either an agency admin or the psychiatrist, the system MUST automatically notify the
  affected patient, mark the appointment as cancelled, and prompt the patient to rebook.
- **FR-027**: Agency admins MUST NOT be able to view or modify patient clinical data
  (intake responses, care recommendations, session transcripts) — their access is limited
  to psychiatrist profiles and availability management only.

**Psychiatrist Matching**

- **FR-006**: The system MUST score and rank all available psychiatrists for a given patient
  using a configurable algorithm that factors in: symptom type, severity level, patient
  preferences (language, gender), and psychiatrist availability.
- **FR-007**: The system MUST present the top matches (maximum 5) to the patient with
  name, photo, specialization, languages, session fee, and earliest available slot.
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
  The slot MUST be temporarily held (reserved) for a maximum of 10 minutes during checkout
  to prevent it from being booked by another patient simultaneously.
- **FR-011a**: Payment MUST be collected via Razorpay before the booking is confirmed.
  On payment success, the platform MUST: (1) mark the slot as booked, (2) automatically
  create a Zoom meeting via the Zoom API, and (3) send a confirmation with the Zoom join
  link to both patient and psychiatrist.
- **FR-011b**: If payment fails or the 10-minute hold expires, the slot MUST be released
  back to available inventory and the patient shown an appropriate message.
- **FR-012**: The system MUST allow patients to cancel or reschedule an appointment.
  Cancellations made ≥24 hours before the session MUST trigger a full refund via Razorpay
  and release the slot. Cancellations within 24 hours are non-refundable; the slot is
  still released for rebooking by other patients.
- **FR-013**: Psychiatrists MUST be able to view the intake summary and full patient profile
  before a scheduled session.
- **FR-014**: Psychiatrists MUST only be able to access the profiles of patients assigned to
  them — no lateral access to other patients' records.

**Long-Term Patient Profile**

- **FR-015**: After each session, the platform MUST receive the session transcript from Zoom
  via webhook and use it to generate a structured draft recommendation (medications mentioned,
  activities discussed, follow-up date) for the psychiatrist to review.
- **FR-015a**: The psychiatrist MUST explicitly review and approve (or edit) the draft before
  any transcript-derived information is written to the patient's care record. No automated
  update to the patient profile is permitted without psychiatrist approval.
- **FR-015b**: Psychiatrists MUST also be able to add recommendations manually, independent
  of the transcript, including: medication name, dosage, frequency, activity type, and
  follow-up date.
- **FR-016**: The system MUST append all approved recommendations to the patient's permanent
  record, timestamped and attributed to the psychiatrist who approved them.
- **FR-017**: Patients MUST be able to view their complete care history: all past sessions,
  recommendations, and their current active care plan.
- **FR-018**: The system MUST maintain long-term continuity — a new psychiatrist onboarded
  to the patient MUST see the full prior session history.

**Data Retention & Deletion**

- **FR-028**: Patient data MUST be retained for 7 years from the date of last platform
  activity. After 7 years of inactivity the system MUST automatically and permanently
  purge all records associated with that patient.
- **FR-029**: On receipt of a patient account deletion request, the system MUST within
  72 hours: (1) permanently delete all PII — name, contact details, payment information,
  device tokens; (2) anonymise all clinical records — intake responses, session transcripts,
  care recommendations, and audit logs — by replacing patient identifiers with a
  pseudonymous ID that cannot be re-linked to the original patient.
- **FR-030**: Anonymised clinical records MUST be retained after deletion for a minimum of
  7 years from the date of the associated session, for audit and legal compliance purposes.
- **FR-031**: The system MUST provide patients with a self-service deletion request option
  within the platform. Patients MUST receive a confirmation when the request is complete.

**Personalized Notifications**

- **FR-019**: The system MUST send personalized notifications via push notification and SMS
  based on each patient's active care plan and stated preferences.
- **FR-020**: Notification timing MUST be driven by the individual patient's preference
  settings — no platform-wide broadcast schedules.
- **FR-021**: Patients MUST be able to opt in or out of each notification category
  (medication reminders, activity nudges, appointment reminders) independently.
- **FR-022**: The notification system MUST retry delivery via an alternative channel if the
  primary channel fails (e.g., fall back from push to SMS).
- **FR-023**: The system MUST NOT send notifications to patients who have no active care
  plan, except for appointment reminders when a booking exists.

### Key Entities

- **Patient**: Registered user; holds identity, intake responses, consent record,
  notification preferences, and care history.
- **IntakeQuestionnaire**: Structured set of questions grouped into sections; responses
  stored per patient, supports partial completion.
- **AgencyAdmin**: A staff member of the partner agency with permission to manage all
  psychiatrist profiles and availability slots. Cannot access patient clinical data.
- **PsychiatristProfile**: Agency-supplied profile: credentials, specializations, languages,
  and assigned patient list.
- **AvailabilitySlot**: A defined time window on a psychiatrist's calendar with status
  (open, booked, blocked). Manageable by both the psychiatrist and agency admin.
- **SessionTranscript**: Full text transcript of a Zoom session received via webhook;
  linked to an Appointment; used to generate a draft CareRecommendation pending
  psychiatrist approval.
- **MatchScore**: Computed ranking of a psychiatrist for a given patient; includes
  contributing factors and weights used.
- **Appointment**: A confirmed booking linking one patient to one psychiatrist at a
  specific date/time; has status (scheduled, completed, cancelled, rescheduled).
- **CareRecommendation**: A post-session record authored by a psychiatrist: medication
  details, activity prescription, follow-up date, free-text notes.
- **PatientProfile**: Aggregated view of a patient's full history: intake, appointments,
  care recommendations, and active care plan.
- **NotificationPreference**: Per-patient, per-category settings: channel (push/SMS),
  preferred times, opt-in/out status.
- **NotificationEvent**: A single scheduled or delivered notification instance with
  delivery status and retry history.
- **Payment**: Linked to an Appointment; records amount, currency (INR), Razorpay order
  and payment IDs, status (pending, succeeded, failed, refunded), and timestamps.

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
- Zoom cloud recording and auto-transcription must be enabled on the Zoom account used
  by the platform. Transcript quality is subject to Zoom's transcription accuracy.
- The platform targets Indian users; regulatory compliance (Mental Healthcare Act 2017,
  DPDPA 2023) is mandatory for all data handling decisions.
- SMS delivery will be handled via an Indian SMS gateway (e.g., Twilio India or MSG91);
  push notifications via a cloud messaging service.
- Patients are assumed to have a smartphone with internet access; offline-first support is
  out of scope for v1.
- Payment is collected at booking time via Razorpay (INR). The slot is held for up to
  10 minutes during checkout and confirmed only after payment succeeds. Cancellations
  ≥24 hours before the session receive a full Razorpay refund; within 24 hours are
  non-refundable. Razorpay webhook events are used to confirm payment status server-side.
- The intake questionnaire content (specific questions and scoring rubrics) is provided by
  clinical advisors; this spec covers the delivery mechanism and data storage, not question
  design.
- Multi-language support (Hindi and regional languages) is planned but the v1 questionnaire
  and UI will be English-first; i18n hooks must be in place from day one.
- Patient data retention is 7 years from last activity per Indian medical record standards
  and DPDPA 2023. PII is deleted within 72 hours of a deletion request; anonymised clinical
  records are retained for the full 7-year window for audit and legal purposes.
