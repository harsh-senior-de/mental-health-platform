# Data Model: Patient Intake, Psychiatrist Matching & Personalized Care

## Core Identity

### Patient

- `id` UUID primary key
- `mobile_number_encrypted`
- `status`: `otp_pending`, `profile_pending`, `consent_pending`, `incomplete_intake`, `active`, `deleted`
- `created_at`, `updated_at`, `last_login_at`

### PatientProfile

- `patient_id`
- `full_name_encrypted`
- `date_of_birth_encrypted`
- `address_encrypted`
- `whatsapp_number_encrypted`
- `whatsapp_enabled`
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

## Consent and Intake

### ConsentRecord

- `id`
- `patient_id`
- `consent_text_version`
- `recording_disclosure_accepted`
- `accepted_at`
- `declined_at` nullable

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
- `answer_value_encrypted`
- `submitted_at`

### IntakeEditHistory

- `id`
- `patient_id`
- `question_code`
- `previous_answer_encrypted`
- `new_answer_encrypted`
- `edited_at`

## Psychiatrists and Availability

### PsychiatristProfile

- `staff_user_id`
- `agency_id`
- `full_name_encrypted`
- `mci_registration_number_encrypted`
- `qualifications`
- `specialisations`
- `languages`
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

### AvailabilitySlot

- `id`
- `psychiatrist_id`
- `session_type`
- `starts_at`
- `duration_minutes`
- `status`: `available`, `held`, `booked`, `blocked`
- `hold_expires_at`

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

### Payment

- `id`
- `appointment_id`
- `razorpay_order_id`
- `razorpay_payment_id`
- `status`
- `amount_paise`
- `invoice_number`
- `refund_status`

### ZoomMeeting

- `id`
- `appointment_id`
- `provider_meeting_id`
- `join_url_encrypted`
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
- `treatment_type`
- `consent_confirmed`
- `symptom_trajectory`
- `next_follow_up_date`
- `approved_at`

### Prescription

- `id`
- `appointment_id`
- `patient_id`
- `psychiatrist_id`
- `status`: `draft`, `finalised`
- `pdf_url_encrypted`
- `finalised_at`

### PrescriptionMedication

- `id`
- `prescription_id`
- `generic_name_uppercase`
- `dosage`
- `frequency`
- `duration`
- `route`
- `special_instructions_encrypted`

### SessionFeedback

- `id`
- `appointment_id`
- `patient_id`
- `rating`
- `qualitative_answers_encrypted`
- `status`: `submitted`, `skipped`

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

### AdherenceConfirmation

- `id`
- `patient_id`
- `prescription_medication_id`
- `confirmed_at`

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
- `NotificationJob` references patient and optionally appointment, prescription, or care recommendation by redacted metadata.

