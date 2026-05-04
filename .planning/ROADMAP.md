# Roadmap: Mental Health Platform India

## Overview

This roadmap takes the platform from scaffolding to a fully compliant, production-ready
mental health service for India. Ten phases deliver progressively richer capabilities:
secure multi-role authentication first, then intake and matching, then booking and payment,
then clinical session delivery, then the notification engine, then billing and data
governance, then admin portals, and finally a dedicated regulatory compliance review and
a performance and accessibility polish pass. Feature 001 (patient-psychiatrist-match) spans
Phases 2 through 5 and is the first active feature in planning.

---

## Phases

**Phase Numbering:**
- Integer phases (1, 2, ..., 10): Planned milestone work for v1
- Decimal phases (e.g., 3.1): Urgent insertions — created via /gsd-insert-phase

- [ ] **Phase 1: Foundation** - Project scaffolding, shared infrastructure, observability, secrets, and CI/CD
- [ ] **Phase 2: Patient Registration and Auth** - OTP patient login, non-patient TOTP auth, consent, and PlatformConfiguration store
- [ ] **Phase 3: Intake, Matching, and Booking** - Intake questionnaire, psychiatrist matching engine, availability management, appointment booking and payment
- [ ] **Phase 4: Session Delivery and Clinical Records** - Zoom integration, transcripts, CareRecommendations, e-prescription, List C drug block, care history
- [ ] **Phase 5: Notifications and Care Continuity** - Three-tier personalised notification engine, WhatsApp/SMS delivery, per-patient scheduling
- [ ] **Phase 6: Billing and Data Governance** - GST invoice generation, Razorpay records, patient data export, data lifecycle and deletion
- [ ] **Phase 7: Agency and Admin Portals** - AgencyAdmin portal, PlatformAdmin portal, multi-agency management, ops dashboards
- [ ] **Phase 8: Post-Session Feedback and Ratings** - Session feedback collection, rating aggregation, psychiatrist eligibility rules
- [ ] **Phase 9: Regulatory Compliance Review** - MHCA 2017 Form B-1 audit, DPDPA 2023 sign-off, Telemedicine Guidelines verification, clinical safety review
- [ ] **Phase 10: Polish, Performance, and Scale** - WCAG 2.1 AA audit, i18n hooks validation, load testing to 500 concurrent, scale-path verification to 5,000

---

## Phase Details

### Phase 1: Foundation
**Goal**: The project infrastructure is operational — developers can build, test, deploy, and observe services against a shared foundation with all security baselines in place
**Depends on**: Nothing (first phase)
**Requirements**: None (cross-cutting infrastructure — prerequisites for all phases)
**Success Criteria** (what must be TRUE):
  1. A new developer can clone the repo, run a single setup command, and have all services running locally with no manual secret configuration
  2. All services emit structured JSON logs with correlation IDs; no PHI appears in any log output in any environment
  3. CI pipeline runs on every PR: linting, tests (≥80% coverage gate), dependency CVE scan, and build
  4. Secrets are sourced from the secrets manager in all environments; no credentials exist in version control
  5. Database migrations run automatically on deploy; PostgreSQL schema is version-controlled and reversible
**Plans**: TBD

### Phase 2: Patient Registration and Auth
**Goal**: All four user roles can securely authenticate and manage their accounts; patients can provide informed consent; all configurable platform thresholds live in an admin-editable store
**Depends on**: Phase 1
**Requirements**: REQ-patient-registration, REQ-otp-security, REQ-otp-sms-failover, REQ-account-inaccessibility-on-number-loss, REQ-session-expiry, REQ-non-patient-auth, REQ-password-reset-non-patient, REQ-account-provisioning, REQ-password-policy, REQ-account-lockout-non-patient, REQ-totp-recovery, REQ-explicit-consent, REQ-intake-questionnaire (consent step only), REQ-platform-configuration-store
**Success Criteria** (what must be TRUE):
  1. A patient can register with a mobile number, receive an OTP via SMS, verify it, and reach the intake start screen — the entire flow completes under 2 minutes
  2. A patient cannot complete more than 3 failed OTP attempts without triggering a 15-minute lockout; requesting a new OTP immediately invalidates the previous one
  3. A psychiatrist, agency admin, or platform admin can activate their account via a time-limited email link, set a password meeting policy, and enroll TOTP before gaining any access
  4. All non-patient account sessions expire after 30 minutes of inactivity or 8 hours absolute; the user is redirected to login with a clear expiry message
  5. Explicit informed consent is presented and recorded before any sensitive health data is stored; a patient who has not consented cannot proceed to intake
  6. A Platform Admin can update any PlatformConfiguration value (e.g., OTP expiry, lockout duration) from the admin UI and the change takes effect immediately without a deployment

> **Note:** GAP-026 (consent denial branch) must be resolved before implementing the consent screen in this phase.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Intake, Matching, and Booking
**Goal**: A patient can complete the intake questionnaire, receive a ranked list of matched psychiatrists, select one, pay, and receive a confirmed appointment with a Zoom link
**Depends on**: Phase 2
**Requirements**: REQ-intake-questionnaire, REQ-intake-editability, REQ-psychiatrist-matching, REQ-availability-management, REQ-appointment-booking, REQ-session-types, REQ-cancellation-refund, REQ-no-show-handling
**Success Criteria** (what must be TRUE):
  1. A patient completing intake receives a ranked match list of up to 5 psychiatrists within 5 seconds; the list never shows a dead-end — "closest available" is shown when scores fall below threshold
  2. A patient can select a psychiatrist, choose a slot, pay via Razorpay, and receive booking confirmation (with Zoom link) on screen within 5 seconds of payment completion
  3. A patient who has previously booked sees "Previously seen" psychiatrists sorted by recency; a "Find new match" option runs the full algorithm
  4. Double-booking is impossible — two concurrent booking attempts for the same slot result in exactly one confirmed booking and one graceful failure
  5. A cancellation made ≥24 hours before the session issues a full Razorpay refund; a cancellation made <24 hours shows the exact fee forfeited before the patient can confirm
  6. Agency admins and psychiatrists can create, block, and delete availability slots within the configurable publication horizon; overlap creation is prevented at submission

> **Note:** GAP-033 (one fixed fee vs. session-type-tiered pricing) must be resolved before planning this phase.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Session Delivery and Clinical Records
**Goal**: Psychiatrists can conduct Zoom sessions, review transcript-generated draft recommendations, approve or write care notes, issue e-prescriptions (with List C blocked), and patients can view their complete care history
**Depends on**: Phase 3
**Requirements**: REQ-psychiatrist-data-access, REQ-session-transcript-and-care-recommendation, REQ-e-prescription, REQ-list-c-drug-block, REQ-patient-care-history
**Success Criteria** (what must be TRUE):
  1. A psychiatrist can open a patient record and view the complete intake summary and prior CareRecommendations within 10 seconds
  2. After a session ends, a Zoom transcript webhook generates a structured draft CareRecommendation; the psychiatrist can review and approve it; no change reaches the patient record without explicit approval
  3. Attempting to prescribe any List C drug produces an immediate hard block naming the specific drug and citing the legal restriction; no override path exists
  4. A completed prescription PDF is downloadable by the patient from their appointment history and sent via WhatsApp if enabled; the prescribing psychiatrist's MCI registration number appears on every prescription
  5. A patient can view their full care history — all sessions, approved recommendations, and prescription records — in a chronological timeline from their portal
  6. Psychiatrist access to a patient's record automatically expires 3 months after the last completed session with no new booking; a new booking restores access

> **Note:** GAP-034 (MHCA 2017 Form B-1 compliance) must be resolved before planning this phase. The CareRecommendation entity may require a new SessionRecord entity to capture all mandatory fields.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Notifications and Care Continuity
**Goal**: Patients receive timely, personalised notifications across all three tiers — OTP/auth, booking reminders, and care reminders — delivered within ±5 minutes of their stated preferred time with ≥95% delivery success
**Depends on**: Phase 4
**Requirements**: REQ-personalised-notifications
**Success Criteria** (what must be TRUE):
  1. Booking reminder notifications (48h, 2h, 15min before session) are delivered via SMS and WhatsApp (if enabled) within ±5 minutes of the target time for ≥95% of active patients
  2. Tier 3 care reminders (medication, activity nudge, follow-up prompt) are delivered at each patient's individually configured preferred time, not a platform-wide schedule
  3. When a patient updates their notification preferences, all pending Tier 3 reminders are cancelled and rescheduled immediately; the daily cap is respected
  4. WhatsApp delivery failures are audit-logged; no SMS fallback occurs for Tier 3; SMS fallback does occur for Tier 2 if WhatsApp fails
  5. A patient can opt out of any notification category from their profile; opted-out categories stop immediately with no pending deliveries

> **Note:** GAP-025 (WhatsApp number verification at entry) and GAP-026 (consent denial branch) must be resolved before implementing this phase.
**Plans**: TBD

### Phase 6: Billing and Data Governance
**Goal**: Every paid booking produces a GST-compliant invoice within 24 hours; patients can export their data or request deletion with legally-required SLA compliance; the data lifecycle service handles automated cleanup at scale
**Depends on**: Phase 3 (payment records), Phase 5 (WhatsApp delivery for export link)
**Requirements**: REQ-gst-invoice, REQ-data-lifecycle, REQ-data-export
**Success Criteria** (what must be TRUE):
  1. A GST-compliant tax invoice is generated for every confirmed paid booking and delivered to the patient (or available in booking history) within 24 hours of payment confirmation
  2. A patient who requests data export receives a secure time-limited download link (valid 48 hours) via WhatsApp and SMS within 72 hours; the export contains intake responses, care recommendations, appointment history, and notification preferences — but not raw transcripts or prescription PDFs
  3. A patient account deletion request is fully processed (PII erased, clinical records pseudonymised) within 72 hours; no patient PII is accessible after completion
  4. The Data Lifecycle Service processes abandoned account cleanup (30-day no-login + incomplete intake) and data expiry (7-year threshold) automatically; job status is visible to Platform Admins with no PII exposed
  5. Platform Admins can view the deletion job dashboard, filter by job type and SLA status, and see no PII in any field

> **Note:** GAP-027 (GST sequential invoice numbering) and CONSTRAINT-024 (GSTIN ownership — platform vs. agency) must be resolved before implementing the invoicing flow in this phase.
**Plans**: TBD

### Phase 7: Agency and Admin Portals
**Goal**: Agency admins can fully manage their psychiatrists and availability; platform admins can perform all operational actions; the multi-agency model is fully operational with correct RBAC scoping
**Depends on**: Phase 6
**Requirements**: REQ-platform-admin-portal, REQ-agency-management
**Success Criteria** (what must be TRUE):
  1. An AgencyAdmin can view, create, and deactivate psychiatrists for their own agency only; attempting to access another agency's psychiatrists returns an authorisation error
  2. An AgencyAdmin can set and update the fee for each psychiatrist; the fee is locked into the Payment record at booking time
  3. A PlatformAdmin can deactivate a psychiatrist account, triggering immediate cancellation and full refund for all upcoming bookings with patient notification
  4. A PlatformAdmin can perform a TOTP reset for a non-patient account; the action is audit-logged; the user must re-enroll TOTP before any access is granted
  5. The PlatformAdmin portal shows the matching weights panel and rating eligibility thresholds panel; changes take effect immediately and are audit-logged; no clinical patient data is visible to Platform Admins under any circumstance
**Plans**: TBD
**UI hint**: yes

### Phase 8: Post-Session Feedback and Ratings
**Goal**: Patients can submit structured session feedback; rating aggregates inform psychiatrist visibility in the matching pool; eligibility rules automatically manage match pool inclusion
**Depends on**: Phase 4 (sessions complete), Phase 7 (Platform Admin controls rating settings)
**Requirements**: REQ-post-session-feedback
**Success Criteria** (what must be TRUE):
  1. After a session ends, a feedback prompt appears on the patient's next login; it can be skipped once and is dismissed permanently after a second explicit dismissal
  2. Raw star ratings are visible only to Platform Admins and Agency Admins; patients see only a percentile band (e.g., "Top 5%") on the match list
  3. A psychiatrist whose aggregate rating falls below the Platform Admin-configured eligibility threshold is automatically removed from new-patient matching; their existing confirmed bookings are not cancelled
  4. A Platform Admin can update eligibility thresholds, percentile band labels, and band boundaries from the portal; changes take effect immediately and are audit-logged
  5. New psychiatrists (no prior ratings) are labelled "New" on the match list; no rating signal is displayed until sufficient data exists
**Plans**: TBD
**UI hint**: yes

### Phase 9: Regulatory Compliance Review
**Goal**: The platform satisfies its full set of regulatory obligations — MHCA 2017, DPDPA 2023, Telemedicine Practice Guidelines 2020, and Telepsychiatry Operational Guidelines 2020 — as confirmed by structured review against each obligation before go-live
**Depends on**: Phases 1 through 8 (requires complete feature set to audit)
**Requirements**: REQ-success-criteria (SC-010, SC-011, SC-012 specifically)
**Success Criteria** (what must be TRUE):
  1. Every psychiatric session produces documentation satisfying MHCA 2017 Form B-1 mandatory fields; a gap analysis has been reviewed and resolved with legal sign-off
  2. All patient data access events are recorded in the audit log and retrievable by compliance teams within 24 hours (SC-010)
  3. The DPDPA 2023 patient rights checklist (export, deletion, consent, portability) is verified end-to-end against implemented flows with no outstanding gaps
  4. All telemedicine prescriptions comply with Telemedicine Practice Guidelines 2020: MCI registration number present, no List C drugs dispensed, Initial Assessment video-only rule enforced
  5. A clinical safety review of all user-facing features is documented; crisis pathways are confirmed reachable without authentication, subscription, or paywall gates

> **Note:** GAP-034 (MHCA 2017 Form B-1) must be fully resolved and any resulting schema changes implemented before this phase can close.
**Plans**: TBD

### Phase 10: Polish, Performance, and Scale
**Goal**: The platform meets every non-functional acceptance criterion: WCAG 2.1 AA across all interfaces, i18n hooks validated in all user-visible strings, 500 concurrent users under load with 99.5% uptime, and the architecture demonstrably scales to 5,000 without structural changes
**Depends on**: Phases 1 through 9 (requires complete, stable feature set)
**Requirements**: REQ-success-criteria (SC-001 through SC-009, SC-013 through SC-018)
**Success Criteria** (what must be TRUE):
  1. All patient-facing and staff-facing UI passes a WCAG 2.1 AA automated audit with zero critical violations; screen reader manual testing confirms key flows are accessible
  2. Every user-visible string in every interface uses an i18n key; no hardcoded display strings exist in any component or template
  3. Load test at 500 concurrent users confirms: match list returned within 5 seconds, booking confirmation within 5 seconds of payment, p95 API latency under 500ms on critical paths
  4. Platform availability meets ≥99.5% monthly uptime under simulated sustained load
  5. An architectural review confirms that scaling to 5,000 concurrent users requires no structural rewrites to data models or service boundaries; horizontal scaling paths are documented
**Plans**: TBD
**UI hint**: yes

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → ... → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/TBD | Not started | - |
| 2. Patient Registration and Auth | 0/TBD | Not started | - |
| 3. Intake, Matching, and Booking | 0/TBD | Not started | - |
| 4. Session Delivery and Clinical Records | 0/TBD | Not started | - |
| 5. Notifications and Care Continuity | 0/TBD | Not started | - |
| 6. Billing and Data Governance | 0/TBD | Not started | - |
| 7. Agency and Admin Portals | 0/TBD | Not started | - |
| 8. Post-Session Feedback and Ratings | 0/TBD | Not started | - |
| 9. Regulatory Compliance Review | 0/TBD | Not started | - |
| 10. Polish, Performance, and Scale | 0/TBD | Not started | - |

---

## Open Gap Annotations (Resolve Before Relevant Phase)

| Gap | Phase Affected | Priority | Summary |
|-----|---------------|----------|---------|
| GAP-026 | Phase 2 | LOW | Consent denial branch — no flow defined for patient refusing consent at registration |
| GAP-033 | Phase 3 | IMPORTANT (business) | Pricing model — one fixed fee vs. session-type-tiered pricing; Indian competitors charge 20–50% more for Initial Assessment |
| GAP-025 | Phase 5 | LOW | WhatsApp number verification at entry — no active verification when patient enters a different WhatsApp number |
| GAP-027 | Phase 6 | LOW | GST invoice sequential numbering required under GST law for B2C supplies; FR-041 currently omits this field |
| GAP-034 | Phase 4, Phase 9 | IMPORTANT (legal) | MHCA 2017 Form B-1 session documentation compliance — CareRecommendation entity may not capture all mandatory fields |
| GAP-032 | v2 | IMPORTANT | Treatment phase tracking (Acute/Continuation/Maintenance) — deferred to v2 |
| GAP-035 | v2 | IMPORTANT | Caregiver Consultation session type — deferred to v2 |

---

## Coverage Map

All 33 v1 requirements mapped to exactly one phase. No orphaned requirements.

| Requirement | Phase |
|-------------|-------|
| REQ-patient-registration | Phase 2 |
| REQ-otp-security | Phase 2 |
| REQ-otp-sms-failover | Phase 2 |
| REQ-account-inaccessibility-on-number-loss | Phase 2 |
| REQ-session-expiry | Phase 2 |
| REQ-non-patient-auth | Phase 2 |
| REQ-password-reset-non-patient | Phase 2 |
| REQ-account-provisioning | Phase 2 |
| REQ-password-policy | Phase 2 |
| REQ-account-lockout-non-patient | Phase 2 |
| REQ-totp-recovery | Phase 2 |
| REQ-explicit-consent | Phase 2 |
| REQ-platform-configuration-store | Phase 2 |
| REQ-intake-questionnaire | Phase 3 |
| REQ-intake-editability | Phase 3 |
| REQ-psychiatrist-matching | Phase 3 |
| REQ-availability-management | Phase 3 |
| REQ-appointment-booking | Phase 3 |
| REQ-session-types | Phase 3 |
| REQ-cancellation-refund | Phase 3 |
| REQ-no-show-handling | Phase 3 |
| REQ-psychiatrist-data-access | Phase 4 |
| REQ-session-transcript-and-care-recommendation | Phase 4 |
| REQ-e-prescription | Phase 4 |
| REQ-list-c-drug-block | Phase 4 |
| REQ-patient-care-history | Phase 4 |
| REQ-personalised-notifications | Phase 5 |
| REQ-gst-invoice | Phase 6 |
| REQ-data-lifecycle | Phase 6 |
| REQ-data-export | Phase 6 |
| REQ-platform-admin-portal | Phase 7 |
| REQ-agency-management | Phase 7 |
| REQ-post-session-feedback | Phase 8 |
| REQ-success-criteria | Phases 9–10 (NFR acceptance targets) |
