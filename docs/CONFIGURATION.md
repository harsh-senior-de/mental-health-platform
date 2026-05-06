<!-- generated-by: gsd-doc-writer -->
# Configuration

This document describes all configurable settings for the Mental Health Platform. The platform
uses a `PlatformConfiguration` entity stored in the primary PostgreSQL database. All values are
editable by Platform Admins via the admin dashboard — no setting requires a code change or
redeployment.

No configuration values are hardcoded in application code. This is a non-negotiable
architectural constraint (see `constitution.md`).

---

## Environment Variables

No `.env.example` or environment variable files exist in the repository yet — the tech stack
will be confirmed during the planning phase (`/speckit-plan`). The variables below are derived
from mandatory infrastructure integrations documented in the feature specification.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Required | — | PostgreSQL primary database connection string (TLS enforced) |
| `DATABASE_ENCRYPTION_KEY` | Required | — | AES-256 key for PHI encryption at rest |
| `RAZORPAY_KEY_ID` | Required | — | Razorpay API key ID for payment processing |
| `RAZORPAY_KEY_SECRET` | Required | — | Razorpay API key secret for HMAC-SHA256 signature verification |
| `RAZORPAY_WEBHOOK_SECRET` | Required | — | Razorpay webhook signing secret for payload validation |
| `ZOOM_ACCOUNT_ID` | Required | — | Platform-owned Zoom Business account ID |
| `ZOOM_CLIENT_ID` | Required | — | Zoom Server-to-Server OAuth client ID |
| `ZOOM_CLIENT_SECRET` | Required | — | Zoom Server-to-Server OAuth client secret |
| `ZOOM_WEBHOOK_SECRET` | Required | — | Zoom webhook secret for payload signature verification |
| `SMS_PROVIDER_API_KEY` | Required | — | Primary SMS provider API key (OTP and booking confirmations) |
| `SMS_PROVIDER_BACKUP_API_KEY` | Required | — | Backup SMS provider API key (automatic failover within 30s) |
| `WHATSAPP_BUSINESS_API_TOKEN` | Required | — | WhatsApp Business API bearer token for Tier 2 and Tier 3 notifications |
| `WHATSAPP_PHONE_NUMBER_ID` | Required | — | WhatsApp Business phone number ID |
| `SESSION_SECRET` | Required | — | Secret for signing authenticated web sessions |
| `JWT_SECRET` | Required | — | <!-- VERIFY: confirm whether JWT or server-side sessions are used once tech stack is decided in planning --> |
| `NODE_ENV` | Optional | `production` | Runtime environment (`development`, `test`, `production`) |
| `PORT` | Optional | <!-- VERIFY: default port to be confirmed in planning --> | HTTP server listen port |
| `LOG_LEVEL` | Optional | `info` | Structured log level (`debug`, `info`, `warn`, `error`) |
| `RECONCILIATION_INTERVAL_MS` | Optional | `900000` | Payment reconciliation job interval in milliseconds (default: 15 minutes) |

**Security requirement**: No secret variable may be committed to version control. A secrets
manager must be used in all environments (see `constitution.md` — Security & Compliance
Requirements).

---

## PlatformConfiguration — Runtime Settings

`PlatformConfiguration` is the authoritative store for all business logic parameters. Every
value in this table is editable by Platform Admins via the admin dashboard without code
changes or redeployment.

### Authentication & Session Security

| Setting | Default | Description |
|---------|---------|-------------|
| `otp_expiry_seconds` | `300` | OTP validity window in seconds (5 minutes) |
| `otp_failed_attempt_limit` | `3` | Consecutive failed OTP attempts before patient lockout |
| `otp_lockout_duration_seconds` | `900` | Patient lockout duration after failed OTP limit (15 minutes) |
| `otp_resend_cooldown_seconds` | `60` | Minimum wait before a patient can request a new OTP |
| `password_min_length` | `12` | Minimum password length for non-patient roles |
| `password_require_uppercase` | `true` | Password must contain at least one uppercase letter |
| `password_require_number` | `true` | Password must contain at least one number |
| `password_require_special_char` | `true` | Password must contain at least one special character |
| `password_failed_attempt_limit` | `3` | Consecutive failed password attempts before account lockout (non-patient roles) |
| `password_lockout_duration_seconds` | `900` | Account lockout duration after failed password limit (15 minutes) |
| `session_idle_timeout_seconds` | `1800` | Web session idle timeout in seconds (30 minutes; all roles) |
| `session_absolute_timeout_seconds` | `28800` | Web session absolute maximum in seconds (8 hours; all roles) |

### Booking & Scheduling

| Setting | Default | Description |
|---------|---------|-------------|
| `slot_hold_duration_seconds` | <!-- VERIFY: exact hold duration to be defined in planning --> | Duration a slot is held during checkout before release |
| `max_booking_horizon_days` | `90` | Maximum days ahead psychiatrists may publish slots or patients may book (3-month rolling window) |
| `appointment_reminder_windows_minutes` | `[2880, 120, 15]` | Reminder fire windows before session in minutes (48h, 2h, 15min). Only future windows fire at booking time |

### Session Durations

| Setting | Default (minutes) | Description |
|---------|------------------|-------------|
| `session_duration_initial_assessment` | `60` | Duration of Initial Assessment sessions |
| `session_duration_follow_up` | `30` | Duration of Follow-Up sessions |
| `session_duration_urgent_review` | `60` | Duration of Urgent Review sessions |

### Psychiatrist Access & Data Visibility

| Setting | Default | Description |
|---------|---------|-------------|
| `psychiatrist_access_expiry_days` | `90` | Days after last completed session before a psychiatrist's access to a patient's profile expires (3 months) |
| `psychiatrist_rating_visibility_enabled` | `false` | When `true`, psychiatrists can see their own aggregate rating, percentile band, and session count. Individual patient ratings are never shown regardless of this setting |

### Notification Caps (Tier 3 — Care Reminders)

| Setting | Default | Description |
|---------|---------|-------------|
| `tier3_daily_notification_cap` | `3` | Maximum Tier 3 WhatsApp care reminder notifications per patient per day. Tier 2 booking confirmations and OTPs are excluded from this cap. Patients can raise or lower this from notification preferences |

### Psychiatrist Rating & Eligibility

| Setting | Default | Description |
|---------|---------|-------------|
| `rating_eligibility_min_sessions_low` | `5` | Minimum sessions before low-rating eligibility rule activates (first threshold) |
| `rating_eligibility_avg_threshold_low` | `2.0` | Average rating below which a psychiatrist with `rating_eligibility_min_sessions_low` sessions is ineligible for new bookings |
| `rating_eligibility_min_sessions_high` | `10` | Minimum sessions before second eligibility threshold activates |
| `rating_eligibility_avg_threshold_high` | `3.0` | Average rating below which a psychiatrist with `rating_eligibility_min_sessions_high` sessions is ineligible for new bookings |
| `rating_percentile_bands` | See note | Configurable percentile band labels and boundaries displayed to patients on the match list (e.g., "Top 5%", "Top 10%"). Editable via Platform Admin dashboard |
| `matching_rating_weight` | <!-- VERIFY: initial weight value to be defined in planning --> | Weight of patient ratings in the matching algorithm scoring |

**Note**: Existing confirmed bookings with an ineligible psychiatrist are always honoured. The
eligibility rules apply only to new bookings.

### Psychiatrist No-Show Refund Mode

| Setting | Default | Description |
|---------|---------|-------------|
| `psychiatrist_noshow_refund_mode` | `auto` | `auto`: full refund issued immediately when a psychiatrist no-show is detected via Zoom participant data. `manual_review`: patient is notified of detection; Platform Admin has a 24-hour SLA to decide and issue the refund manually |

### Data Lifecycle & Retention

| Setting | Default | Description |
|---------|---------|-------------|
| `data_retention_years` | `7` | Retention period in years for clinical records from the date of last platform activity, then automatic purge |
| `deletion_sla_hours` | `72` | Hours within which a patient deletion request must be processed (PII deleted; clinical records anonymised) |
| `abandoned_account_nudge_days` | `2` | Days of inactivity after registration before a single re-engagement nudge is sent to incomplete-intake accounts |
| `abandoned_account_delete_days` | `30` | Days of inactivity after which an incomplete-intake account is automatically and permanently deleted |
| `data_export_link_expiry_hours` | `48` | Hours before a patient data export download link expires |
| `data_export_delivery_sla_hours` | `72` | SLA for delivering a patient data export package after request |

### GST Invoice Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `gst_invoice_prefix` | `MHP` | Prefix for GST invoice numbers. Format: `[PREFIX]/[FY]/[SEQUENCE]` (e.g., `MHP/2026-27/00001`) |
| `gst_invoice_sequence_reset_month` | `4` | Calendar month (1-indexed) on which the invoice sequence resets (April = start of Indian financial year) |

### Drug Restriction Lists

| Setting | Default | Description |
|---------|---------|-------------|
| `list_c_drugs` | See note | List of Schedule H1 / List C drugs that are hard-blocked from telemedicine prescriptions. Blocked at the prescription tool UI level with an explanatory warning. Blocked attempts are audit-logged |
| `list_b_drugs` | See note | List B drugs displayed in the prescription tool's static regulatory reference panel (informational only; no automated block in v1) |

**Default List C drugs** (per Telemedicine Practice Guidelines 2020):
`alprazolam`, `diazepam`, `lorazepam`, `nitrazepam`, `chlordiazepoxide`, `zolpidem`,
`methylphenidate`, `modafinil`, `phenobarbitone`, depot antipsychotics.

**List B enforcement** (v1): The platform shows a static reference panel naming List B
drugs and their restriction ("may only be prescribed after at least one prior video
consultation"). Automated contextual enforcement is deferred to v2.

---

## Required vs. Optional Settings

### Settings that cause startup failure if absent

The following environment variables must be present before the application will start:

- `DATABASE_URL` — application cannot connect to the primary data store
- `DATABASE_ENCRYPTION_KEY` — PHI encryption at rest cannot function; startup blocked per constitution
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` — payment processing unavailable
- `RAZORPAY_WEBHOOK_SECRET` — payment webhook signature verification unavailable; booking confirmation unsafe
- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` — session meeting creation unavailable
- `ZOOM_WEBHOOK_SECRET` — transcript and participant webhooks cannot be verified
- `SMS_PROVIDER_API_KEY` — OTP delivery unavailable; patient login impossible
- `SESSION_SECRET` — authenticated sessions cannot be signed

### Settings with defaults

All `PlatformConfiguration` database entries have the defaults listed in the tables above. On
first application startup, the system seeds the `PlatformConfiguration` table with these
defaults if the rows do not already exist.

Optional environment variables (`PORT`, `LOG_LEVEL`, `NODE_ENV`, `RECONCILIATION_INTERVAL_MS`)
fall back to the values shown in the Environment Variables table.

---

## Per-Environment Overrides

No `.env.development`, `.env.production`, or `.env.test` files exist in the repository. All
environment-specific values are injected via the deployment platform's secret manager.

General guidance by environment:

| Environment | Approach |
|-------------|----------|
| **Development** | Local `.env` file (not committed). Developers copy a `.env.example` template (to be added in planning) and fill in dev credentials |
| **Test** | Separate credentials for Razorpay test mode, Zoom sandbox, and SMS/WhatsApp test accounts. `NODE_ENV=test` |
| **Staging** | Full production-equivalent credentials stored in <!-- VERIFY: secrets manager platform to be confirmed in planning --> |
| **Production** | All secrets injected via <!-- VERIFY: secrets manager platform to be confirmed in planning -->. No credentials in version control |

**IST timezone assumption**: All time-based calculations (notification scheduling, slot
availability, appointment reminders, financial year resets) assume IST (Asia/Kolkata,
UTC+5:30). This is a v1 assumption; multi-timezone support is deferred.

---

## Secrets Management

Per the project constitution:

> Credentials, API keys, and certificates MUST NOT be committed to version control. A secrets
> manager MUST be used in all environments.

The specific secrets manager technology will be decided during the planning phase. Until then,
the rule is: no secret value — not even a development default — may appear in any file tracked
by git.

All TOTP seeds and session signing keys are secrets and fall under the same rule.

---

## Related Documentation

- `CLAUDE.md` — development workflow, user roles, and architectural constraints
- `.specify/memory/constitution.md` — non-negotiable principles including privacy, encryption,
  and secrets management obligations
- `specs/001-patient-psychiatrist-match/spec.md` — feature specification containing the full
  `PlatformConfiguration` entity definition and all configurable thresholds
