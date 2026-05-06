# Data Model: Patient Intake, Psychiatrist Matching & Personalized Care

## Core Identity

### Patient

- `id` UUID primary key
- `mobile_number_encrypted`
- `status`: `otp_pending`, `profile_pending`, `consent_pending`, `incomplete_intake`, `active`, `deleted`
- `created_at`, `updated_at`, `last_login_at`
- `otp_attempts_count` (integer, default 0)
- `otp_locked_until` nullable timestamp

### PatientProfile

- `patient_id`
- `full_name_encrypted`
- `date_of_birth_encrypted`
- `address_encrypted`
- `whatsapp_number_encrypted`
- `whatsapp_enabled`
- `preferred_language` (e.g. "en", "hi", "ta")
- `advance_directive_encrypted` nullable
- `nominated_representative_name_encrypted` nullable
- `nominated_representative_contact_encrypted` nullable
- `created_at`, `updated_at`

### StaffUser

- `id` UUID primary key
- `role`: `psychiatrist`, `agency_admin`, `platform_admin`
- `agency_id` nullable for platform admins
- `email_encrypted`
- `password_hash`
- `totp_secret_encrypted`
- `status`: `invited`, `active`, `locked`, `deactivated`
- `failed_login_count`, `locked_until`

### Agency

- `id`
- `name`
- `status`
- `contact_email_encrypted`
- `contract_start_date`

### SessionToken

- `id` UUID primary key
- `user_id` FK (references Patient.id or StaffUser.id — polymorphic via user_id + user_type)
- `user_type`: `patient`, `staff`
- `token_hash` (SHA-256 of opaque token stored in HttpOnly cookie)
- `created_at`
- `last_active_at`
- `expires_at` (absolute max, from PlatformConfiguration.session_timeout)
- `revoked_at` nullable

## Consent and Intake

### ConsentRecord

- `id`
- `patient_id`
- `consent_text_version`
- `recording_disclosure_accepted`
- `accepted_at`
- `declined_at` nullable

### OtpRecord

- `id` UUID primary key
- `patient_id` FK to Patient.id
- `otp_hash` (bcrypt hash — never stores plaintext)
- `issued_at`
- `expires_at`
- `invalidated_at` nullable (set when a new OTP is issued for same patient)
- `used_at` nullable (set on successful verification)

### IntakeSection

- `id`
- `code`
- `title_i18n_key`
- `sort_order`
- `active`

### IntakeResponse

- `id`
- `patient_id`
- `section_id`
- `question_code`
- `question_version` (e.g. "1.0")
- `answer_value_encrypted`
- `submitted_at`

### IntakeEditHistory

- `id`
- `patient_id`
- `section_id` FK to IntakeSection.id
- `question_code`
- `previous_answer_encrypted`
- `new_answer_encrypted`
- `edited_at`

### IntakeProgress

- `id` UUID primary key
- `patient_id` unique FK to Patient.id
- `last_completed_section_id` nullable FK to IntakeSection.id
- `last_saved_at`
- `status`: `in_progress`, `completed`

## Psychiatrists and Availability

### PsychiatristProfile

- `staff_user_id`
- `agency_id`
- `full_name_encrypted`
- `mci_registration_number_encrypted`
- `qualifications TEXT` (e.g. "MD, DPM")
- `specialisations TEXT[]`
- `languages TEXT[]`
- `photo_url`
- `rating_visibility_enabled`
- `profile_complete`

### PsychiatristFee

- `id`
- `psychiatrist_id`
- `session_type`
- `amount_paise`
- `currency`
- `effective_from`

Unique constraint on `(psychiatrist_id, session_type)`. One fee per session type per psychiatrist.

### AvailabilitySlot

- `id`
- `psychiatrist_id`
- `session_type`
- `starts_at`
- `duration_minutes`
- `status`: `available`, `held`, `booked`, `blocked`
- `hold_expires_at`
- `held_by_patient_id` nullable FK to Patient.id

## Booking and Payments

### Appointment

- `id`
- `patient_id`
- `psychiatrist_id`
- `availability_slot_id`
- `session_type`
- `status`
- `starts_at`, `duration_minutes`
- `zoom_meeting_id`
- `payment_id`
- `cancelled_reason`
- `cancelled_at` nullable
- `rescheduled_from_appointment_id` nullable self-referential FK

### Payment

- `id`
- `appointment_id`
- `razorpay_order_id`
- `razorpay_payment_id`
- `status`
- `amount_paise`
- `invoice_number`
- `refund_status`
- `refund_amount_paise` nullable
- `refunded_at` nullable
- `razorpay_refund_id` nullable

### ZoomMeeting

- `id`
- `appointment_id`
- `provider_meeting_id`
- `join_url_encrypted`
- `start_url_encrypted` (host join URL, different from patient join_url)
- `created_at`
- `webhook_status`

## Clinical Records

### SessionTranscript

- `id`
- `appointment_id`
- `patient_id`
- `psychiatrist_id`
- `transcript_text_encrypted`
- `received_at`

### CareRecommendation

- `id`
- `appointment_id`
- `patient_id`
- `psychiatrist_id`
- `status`: `draft`, `approved`
- `presenting_complaints_encrypted`
- `clinical_observations_encrypted`
- `treatment_type_encrypted`
- `consent_confirmed`
- `symptom_trajectory_encrypted`
- `next_follow_up_date`
- `approved_at`
- `identity_verified` boolean
- `identity_verified_at` nullable timestamp
- `form_b1_completed_at` nullable timestamp

### Prescription

- `id`
- `appointment_id`
- `patient_id`
- `psychiatrist_id`
- `status`: `draft`, `finalised`
- `pdf_url_encrypted`
- `finalised_at`
- `prescriber_name_snapshot_encrypted`
- `prescriber_registration_number_snapshot_encrypted`

### PrescriptionMedication

- `id`
- `prescription_id`
- `generic_name_uppercase_encrypted`
- `dosage_encrypted`
- `frequency_encrypted`
- `duration_encrypted`
- `route_encrypted`
- `special_instructions_encrypted`
- `discontinued_at` nullable timestamp

### SessionFeedback

- `id`
- `appointment_id`
- `patient_id`
- `rating`
- `qualitative_answers_encrypted`
- `status`: `submitted`, `skipped`

### ListCBlockEvent

- `id` UUID primary key
- `appointment_id`
- `psychiatrist_id`
- `attempted_drug_name_encrypted`
- `blocked_at`

## Notifications, Lifecycle, Audit

### NotificationPreference

- `patient_id`
- `category`
- `enabled`
- `preferred_time`
- `daily_cap`

### NotificationJob

- `id`
- `patient_id`
- `type`
- `channel`
- `scheduled_for`
- `status`
- `provider_message_id`
- `appointment_id` nullable FK
- `prescription_id` nullable FK
- `care_recommendation_id` nullable FK

### AdherenceConfirmation

- `id`
- `patient_id`
- `prescription_medication_id`
- `confirmed_at`
- `status`: `confirmed`, `missed`, `skipped`

### DataLifecycleJob

- `id`
- `patient_id`
- `type`: `on_demand`, `abandoned`, `expiry`
- `status`
- `requested_at`
- `completed_at`

### PlatformConfiguration

- `key`
- `value`
- `updated_by`
- `updated_at`

### AuditLog

- `id`
- `actor_type`
- `actor_id_hash`
- `action`
- `resource_type`
- `resource_id_hash`
- `correlation_id`
- `metadata_redacted`
- `created_at`

## Relationships

- `Agency` has many `StaffUser` and `PsychiatristProfile`.
- `Patient` has one `PatientProfile`, many `IntakeResponse`, many `Appointment`.
- `PsychiatristProfile` has many `AvailabilitySlot`, `Appointment`, and `PsychiatristFee`.
- `Appointment` has one `Payment`, one `ZoomMeeting`, optional `SessionTranscript`, many clinical records.
- `Prescription` has many `PrescriptionMedication`.
- `NotificationJob` optionally references `Appointment`, `Prescription`, or `CareRecommendation` via direct nullable FKs.
- `OtpRecord` belongs to `Patient` (many per patient; only one un-invalidated at a time).
- `IntakeProgress` has a one-to-one relationship with `Patient`.
- `SessionToken` belongs to `Patient` or `StaffUser` (polymorphic via user_id + user_type).
- `ListCBlockEvent` belongs to `Appointment` and `StaffUser` (psychiatrist).
