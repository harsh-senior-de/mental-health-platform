# End-to-End Actor Flows — Mental Health Platform (Feature 001)

**Generated**: 2026-05-04
**Purpose**: Detailed step-by-step flows for each actor to identify friction points and simplification opportunities before planning.

---

## Actor 1: Patient

### Phase 0: Discovery (Pre-Registration)

1. Patient navigates to the platform URL in a browser.
   - Crisis helplines always visible on login page regardless of login state: iCall (9152987821), Vandrevala Foundation (1860-2662-345). (FR-042)
   - No account required to see helpline numbers.

---

### Phase 1: Registration & Consent

2. Patient clicks "Sign Up" → enters mobile number.
   - OTP sent via SMS via primary provider. (FR-001)
   - If primary provider fails to acknowledge within 30 seconds → auto-retry via backup SMS provider. (FR-001i)
   - "Resend OTP" button available after 60 seconds regardless of delivery status.

3. Patient enters 6-digit OTP.
   - OTP expires after 5 minutes. (FR-001a)
   - 3 consecutive wrong OTPs → account locked 15 minutes; remaining time shown on screen. (FR-001a)
   - Requesting a new OTP invalidates the current one immediately. (FR-001a)

4. OTP verified → **Consent Screen** shown before any health data is collected. (FR-005)
   - Plain-language explanation of what data is collected and why (DPDPA 2023).
   - Explicit recording disclosure: *"Your video sessions will be recorded via Zoom. The recording is transcribed and used to generate your care notes, reviewed and approved by your psychiatrist. Stored encrypted for 7 years."*
   - Patient must click "I Agree."
   - **Branch — declines:** Partial account (mobile + OTP record only) deleted immediately. No browse mode. Flow ends. (FR-005)

5. Patient agrees → account created (status: `incomplete-intake`).
   - WhatsApp prompt shown: *"Use this number for WhatsApp notifications too?"* — pre-ticked.
   - Patient can enter a different WhatsApp number or opt out.
   - Helper note: *"Make sure this number is registered on WhatsApp."* No verification performed. (FR-025 / GAP-025 resolution)

---

### Phase 2: Intake Questionnaire

6. Patient taken to the **Intake Questionnaire** immediately after consent. (FR-002)
   - Multi-section form: presenting symptoms, severity, mental health history, current medications, lifestyle factors, psychiatrist preferences (gender, language).
   - Progress auto-saved after each section. (FR-003)

7. Patient completes each section one at a time.
   - **Branch — exits mid-way:** On next login (OTP again), patient resumes exactly at the section where they left off. Nothing is lost. (FR-003)

8. Patient submits all sections.
   - PatientProfile created with all responses in normalised, queryable format. (FR-004)
   - Account status → `active`.
   - Redirected to Matching Flow immediately. (US1-3)

> **Friction point:** If a patient abandons after consent but before finishing intake, the system sends one WhatsApp/SMS nudge at the 48-hour inactivity mark. Account auto-deleted after 30 days of no login. (FR-028, FR-032)

---

### Phase 3: Matching & Slot Selection

9. Patient lands on the **Booking Screen**.
   - First-time patient: only "Find new match" shown.
   - Returning patient: "Previously seen" section (all past psychiatrists, sorted by most recent) + "Find new match" always available. (FR-007, FR-018)

10. Patient taps "Find new match."
    - Matching engine scores all eligible psychiatrists platform-wide using: symptom type, severity, patient preferences (language, gender), availability, and rating percentile. (FR-006)
    - Ineligible psychiatrists excluded from results. (FR-039)
    - Up to 5 ranked results returned within 5 seconds. (SC-002)

11. Patient views the **Match List**.
    - Each card: name, photo, specialisation, languages, session fee (correct for session type), earliest slot, percentile band ("Top 5%", "New", etc.). (FR-007, FR-038)
    - **Branch — all scores below threshold:** List labelled "Closest available." Patient never dead-ended. (FR-010)

12. Patient selects a psychiatrist → selects a time slot.
    - **Real-time availability check** fires on slot selection. (FR-011)
    - **Branch — slot just became unavailable:** Inline error shown; remaining slots displayed; no flow restart needed. (FR-011)
    - **Branch — slot available:** Slot held for 10 minutes during checkout. (FR-011)

---

### Phase 4: Payment & Booking Confirmation

13. Patient reaches the **Checkout Screen**.
    - Shows: psychiatrist name + MCI reg number, session type, date/time, fee (locked at this moment), Razorpay payment widget. (FR-023a, FR-019)

14. Patient completes payment.
    - "Confirm" button disabled on first click (prevents double-submit). (FR-011d)
    - Server-side idempotency key per order ensures exactly one charge. (FR-011d)

15. Payment confirmation — three paths, whichever fires first: (FR-011a)
    - **Path 1 (real-time):** Razorpay returns HMAC-SHA256 signed response; backend verifies → booking confirmed immediately.
    - **Path 2 (async webhook):** Fires for cases where browser crashed post-payment.
    - **Path 3 (safety net):** Reconciliation job runs every 15 minutes for non-terminal orders >10 minutes old.

16. On payment success → Zoom meeting created via API (up to 3 retries). (FR-011e)
    - **Branch — all Zoom retries fail:** Booking cancelled, full Razorpay refund issued automatically, patient notified via SMS + WhatsApp, psychiatrist notified in-platform. Patient must try booking again. (FR-011e)

17. Booking confirmed:
    - Confirmation screen shows booking reference, psychiatrist name + MCI number, date/time, session type, **Zoom join link prominently**. (FR-013a, FR-017)
    - SMS confirmation sent. WhatsApp confirmation sent if enabled (with Zoom join link). (FR-019)
    - GST invoice auto-generated (`MHP/2026-27/00001` format) and delivered to patient. (FR-041)
    - Reminder windows queued: 48h, 2h, 15min before session. Past windows skipped. (FR-019)

---

### Phase 5: Pre-Session Management

18. **Cancel ≥24 hours before session:**
    - Full Razorpay refund issued immediately. Slot released. Patient notified. (FR-012)

19. **Cancel <24 hours before session:**
    - **Confirmation modal** shows exact fee to be forfeited. Patient must explicitly confirm. (FR-012)
    - On confirm: cancelled, slot released, no refund. (FR-012)

20. **Reschedule:**
    - Same cancel-and-refund rules apply (≥24h = refund, <24h = no refund).
    - After cancellation, patient routed immediately to slot-selection for same psychiatrist pre-selected. New booking created as fresh appointment. (FR-012)

21. **Edit intake responses:**
    - Patient edits any intake field from profile settings.
    - Edit timestamped; full edit history retained.
    - In-platform notification sent to any psychiatrist with an active access window for this patient. (FR-004a)

---

### Phase 6: Session Day

22. Patient receives reminders at 48h, 2h, 15min before session (whichever were queued at booking). SMS always; WhatsApp if enabled — includes Zoom join link. (FR-019)

23. Patient clicks Zoom join link from dashboard or WhatsApp/SMS.
    - Joins as external participant — no Zoom account required.
    - Session recorded and transcribed automatically by Zoom cloud.

24. **Branch — patient no-show (paid but never joined):**
    - Zoom webhook fires at meeting end; platform checks participant data. No patient presence → `no-show-by-patient` status set. (FR-047)
    - Fee is non-refundable.
    - WhatsApp nudge 1 sent 24h later: *"We missed you... rebook when ready: [link]."*
    - WhatsApp nudge 2 sent 7 days later if no new booking made: *"It's been a week... your mental health matters: [link]."*
    - No further nudges after nudge 2. Both nudges respect daily notification cap. (FR-047)

---

### Phase 7: Post-Session Feedback

25. Feedback prompt appears on patient's next page load after session ends. (FR-037)
    - 1–5 star rating + structured qualitative questions.
    - Patient can skip once; prompt reappears on next login. Second skip = recorded as skipped. (FR-037)

26. Submitted feedback linked to the Appointment record.
    - Not visible to the psychiatrist or to the patient — only admins can see raw ratings. (FR-037, FR-038)

---

### Phase 8: Post-Session Care

27. Patient views their **Profile / Care History** page.
    - Full timeline: all past sessions, approved care recommendations from all psychiatrists, active care plan. (FR-017)

28. Patient downloads **e-prescription** (if psychiatrist issued one).
    - Download link in appointment history. (FR-043)
    - WhatsApp delivery: *"Your prescription from Dr. [Name] (MCI Reg: [number]) is ready — [link]."* (FR-043)

29. Patient sees **My Medications** section in profile.
    - Lists each active medication from finalised prescriptions. (FR-021b)
    - For each medication, patient can set a daily reminder time (e.g., 08:00).
    - Platform sends Tier 3 WhatsApp reminder daily at that time: *"Time for your ESCITALOPRAM — 10mg, once daily. Prescribed by Dr. [Name]."*
    - Reminder runs automatically for the prescription duration then stops. Patient can update or cancel at any time. (FR-021b)

---

### Phase 9: Long-Term Ongoing Care

30. Tier 3 WhatsApp notifications drive long-term engagement:
    - Medication reminders, activity nudges, follow-up prompts — WhatsApp only, never SMS.
    - Only if patient has WhatsApp number + global WhatsApp toggle on. (FR-021)
    - Personalised to each patient's preferred times — not a platform-wide schedule. (FR-020)
    - Default daily cap: 3 Tier 3 messages/day (patient-adjustable). (FR-020)

31. Patient manages notification preferences from profile settings:
    - Toggle WhatsApp globally on/off. (FR-021)
    - Opt in/out per Tier 3 category independently. (FR-021a)
    - Change preferred delivery times. Changes take effect within minutes — already-queued same-day reminders are rescheduled. (FR-020)

32. Follow-up nudge arrives on recommended date:
    - *"Dr. [Name] recommended your next session around now. Ready to book? [link pre-filtered to that psychiatrist]."*
    - Suppressed if patient already has a confirmed future booking with any psychiatrist. (FR-046)

---

### Phase 10: Rebooking (Returning Patient)

33. Patient returns to Booking Screen.
    - "Previously seen" section: one-tap to slot selection for a prior psychiatrist — no re-running of matching algorithm. (FR-007, FR-018)

34. Patient wants an **Urgent Review** (acute deterioration):
    - Available only if patient has ≥1 prior completed Initial Assessment. (FR-042)
    - Bypasses normal matching — shows next available slot across all eligible psychiatrists immediately.
    - Normal payment and Zoom-creation flows apply unchanged. (FR-042)

35. Access window: if no booking within 3 months (configurable), psychiatrist's access to this patient's data expires automatically. Restored on any new confirmed booking. (FR-018a)

---

### Phase 11: Data Rights

36. **Request records:**
    - Profile Settings → "Request My Records."
    - One button covers both DPDPA 2023 data portability and MHCA 2017 Section 25 clinical records access (Form A equivalent). (FR-036)
    - Immediate on-screen acknowledgement. Within 72h: secure time-limited download link via WhatsApp + SMS.
    - Export includes: intake responses, all approved session notes, all prescription PDFs, appointment history, notification preferences, own SessionFeedback records.
    - Download link expires after 48h. (FR-036)

37. **Delete account:**
    - Profile Settings → "Delete My Account."
    - Consequences clearly shown: PII deleted, clinical records anonymised and retained.
    - Data Lifecycle Service enqueues deletion job. Within 72h: Phase 1 (PII erasure) + Phase 2 (anonymisation) complete.
    - Patient notified via WhatsApp/SMS on completion. Account inaccessible from that point. (FR-028, FR-029, FR-031)

---

## Actor 2: Psychiatrist

### Phase 0: Account Activation (One-Time)

1. Agency Admin creates the psychiatrist's account. Platform sends a **one-time activation email** with a time-limited setup link (default: 24h). (FR-001h)

2. Psychiatrist clicks activation link.
   - **Branch — link expired:** Contact Agency Admin to resend.

3. Sets password (12+ chars, uppercase, number, special character). (FR-001g)

4. **TOTP setup screen** — QR code displayed for Google Authenticator / Authy. Psychiatrist scans and enters 6-digit code to confirm enrollment. Activation not complete until valid TOTP entered. (FR-001b)

5. Activation complete → logged in.

---

### Phase 1: Every Subsequent Login

6. Enters email + password.
   - 3 consecutive wrong passwords → 15-min lockout; remaining time displayed. (FR-001f)

7. On correct password → TOTP screen. Enters current code from authenticator app.

8. Session active.
   - Idle timeout: 30 min without activity → redirected to login. (FR-001c)
   - Absolute timeout: 8 hours → redirected to login. (FR-001c)

9. **TOTP device lost:** Contacts Platform Admin out-of-band. Platform Admin resets TOTP. Psychiatrist must re-enroll on next login. Reset audit-logged permanently. (FR-001e)

10. **Forgot password:** Time-limited reset link sent to email (expires 30 min). Sets new password. Active session invalidated. (FR-001d)

---

### Phase 2: Managing Availability

11. Navigates to **Availability Calendar** — views existing slots (open, booked, blocked) across the rolling 3-month horizon. (FR-025)

12. Creates a new availability slot:
    - Selects date, start time, session type (Initial Assessment / Follow-Up / Urgent Review).
    - Duration auto-derived from PlatformConfiguration — psychiatrist does not set it manually. (FR-042)
    - **Branch — slot overlaps existing slot:** Rejected immediately with error identifying the conflict. (FR-025)
    - **Branch — beyond 3-month horizon:** Rejected. (FR-025)
    - On success: slot available for patient booking immediately.

13. Blocks or updates an existing slot:
    - If a confirmed booking exists on that slot → system auto-cancels the booking, issues full Razorpay refund to the patient, and notifies the patient with a rebook link. (FR-026, FR-012a)

---

### Phase 3: Pre-Session Preparation

14. Opens **Upcoming Appointments** view.
    - Lists all confirmed future sessions. For each: patient name, session type, date/time, **Zoom join link prominently shown**. (FR-013a)

15. Opens a patient's profile before the session. (FR-013)
    - Sees: intake questionnaire responses, structured care recommendations from all psychiatrists within the access window, raw Zoom transcripts from sessions **this psychiatrist personally conducted only**. (FR-013, FR-018a)
    - MHCA 2017 fields shown read-only: advance directive, nominated representative name + contact (if patient has set them). (FR-015b)
    - **Access rule:** Only accessible if the psychiatrist has a booking with this patient within the configured access window (default: 3 months). (FR-014, FR-018a)

---

### Phase 4: Conducting the Session

16. Clicks Zoom join link from Upcoming Appointments view. Joins as external participant.

17. **Psychiatrist no-show (never joins):**
    - Zoom webhook fires at meeting end; platform checks participant data.
    - No psychiatrist presence → `no-show-by-psychiatrist` status set. (FR-045)
    - **Auto-refund mode (default):** Full Razorpay refund to patient immediately. Patient notified via SMS + WhatsApp with apology + rebook link. Agency Admin + Platform Admin alerted in-platform. (FR-045)
    - **Manual-review mode:** Patient notified issue is under review. Platform Admin has 24h SLA to resolve. (FR-045)

---

### Phase 5: Post-Session Documentation

18. Session ends → Zoom sends transcript via webhook.
    - Platform generates a **draft CareRecommendation** from transcript: medications mentioned, activities discussed, follow-up date. (FR-015)
    - Draft surfaced to psychiatrist in the patient's session record for review.

19. **Branch — no transcript received within 60 minutes of session end:**
    - Notice displayed: transcript not received; prompt to enter recommendations manually. (FR-015c)
    - Failure logged in audit trail. No retry attempted. (FR-015c)

20. Psychiatrist opens the **Session Notes Form** (MHCA 2017 Form B-1 equivalent). (FR-015b)

    **Required fields (cannot approve without completing):**
    - Presenting complaints summary.
    - Clinical observations / progress notes.
    - Treatment type: pharmacological / psychotherapy / combined.
    - Consent status confirmation.
    - Identity verification checkbox: *"I have verbally confirmed this patient's name and date of birth at the start of this session."* — mandatory; audit-logged with timestamp. (FR-015b, FR-047)

    **Optional fields:**
    - History summary, techniques used, capacity assessment notes, risk/benefit notes.
    - Mental Status Examination (MSE) — single free-text area for all 10 domains (appearance, behaviour, speech, mood, affect, thought process, thought content, perception, cognition, insight/judgment). Distinct labeled field, not merged with clinical observations. (FR-015b)

    **For Follow-Up and Urgent Review sessions only — Subjective (Patient Self-Report) section (all optional):**
    - Medication adherence: dropdown (Yes / Partial / No) + free-text notes.
    - Side effects reported: free text.
    - Symptom trajectory since last visit: dropdown (Improved / Stable / Worsened).
    - Sleep quality, appetite, significant life events since last visit: free text. (FR-015b)

    **Pre-populated / editable fields:**
    - Medication name, dosage, frequency, activity type from prior records.
    - Recommended next session interval: dropdown (1w / 2w / 4w / 6w / 8w / 3m / 6m) or specific date. (FR-046)

    **Pre-populated read-only fields (from PatientProfile):**
    - Advance directive (if any).
    - Nominated representative name + contact (if any). (FR-015b)

21. Psychiatrist edits draft recommendation fields as needed.

22. Checks the **Form B-1 completion declaration** checkbox — mandatory before approving. (FR-015b)

23. Approves session record.
    - Appended to patient's permanent care record, timestamped and attributed to this psychiatrist.
    - Retained as Form B-1 equivalent for 7 years. (FR-015b, FR-016)

> **Friction point:** Two separate post-session workflows exist — (A) session notes form and (B) e-prescription tool. Both may be needed after the same session but require separate navigation. Consider a unified post-session checklist screen that guides the psychiatrist through both in sequence.

---

### Phase 6: E-Prescription (Optional per Session)

24. Psychiatrist opens the **E-Prescription Tool** from the session record. (FR-043)
    - Auto-populated: psychiatrist full name, qualifications, MCI registration number, clinic/affiliation. (FR-043)
    - Auto-populated: patient name, age, address, ID verification record. (FR-043)

25. Psychiatrist types a drug name.
    - **List C hard block:** If the name matches any List C drug (alprazolam, diazepam, lorazepam, zolpidem, methylphenidate, modafinil, phenobarbitone, depot antipsychotics, etc.): (FR-044)
      - Entry blocked immediately — cannot be added under any circumstance.
      - Warning names the specific drug; suggests in-person referral.
      - Blocked attempt audit-logged. No override possible.
    - **List B informational panel:** Always visible while composing — lists List B drugs and states they may only be prescribed after at least one completed prior video consultation. Informational only; no automated enforcement in v1. (FR-044)

26. Adds permitted medications: generic drug name (stored and displayed in CAPITAL LETTERS), dosage, frequency, duration, route of administration, optional special instructions. (FR-043)

27. Confirms (digitally signs) the prescription.
    - Prescription record created and linked to the Appointment.
    - PDF generated and stored (retained 7 years).
    - PDF download link available to patient in appointment history.
    - PDF link sent to patient via WhatsApp: *"Your prescription from Dr. [Name] (MCI Reg: [number]) is ready — [link]."* (FR-043)
    - **Auto-trigger:** If the session notes "Recommended next session" field is blank → auto-populated with "2 weeks" + inline note: *"Default set to 2 weeks — recommended after new medication initiation."* Psychiatrist can change or clear. (FR-043, FR-046)

28. Can amend the prescription within 24 hours of finalisation to correct errors. Original version retained in audit history. (FR-043)

---

### Phase 7: Rating Visibility (If Enabled)

29. If Platform Admin has toggled on psychiatrist rating visibility (off by default):
    - Psychiatrist sees on their profile dashboard: aggregate average score, percentile band ("Top 10%"), total session count.
    - Individual patient ratings never visible under any circumstance. (FR-038)
    - Psychiatrist is **never notified** if they become ineligible for new bookings — only Agency Admin and Platform Admin are notified. Existing confirmed bookings are still honoured. (FR-039)

---

## Actor 3: Agency Admin

### Phase 0: Account Activation (One-Time)

1. A Platform Admin creates the first Agency Admin account for a new agency. Additional Agency Admin accounts can be created by an existing Agency Admin of that agency or by a Platform Admin. (FR-001h)
   - Activation email sent with time-limited setup link (default: 24h).

2. Agency Admin clicks activation link → sets password (12+ chars, uppercase, number, special character) → sets up TOTP authenticator. Activation not complete until valid TOTP entered. (FR-001b, FR-001g)

3. Every subsequent login: email + password → TOTP. Same lockout, session timeout, and password reset rules as Psychiatrist. (FR-001c, FR-001d, FR-001f)

---

### Phase 1: Creating Psychiatrist Accounts

4. Navigates to **Agency Portal → Psychiatrists**.
   - All psychiatrists shown belong exclusively to this agency. Agency Admin cannot view or manage psychiatrists from other agencies. (FR-027)

5. Clicks "Add Psychiatrist" and fills in the profile:
   - Full name, qualifications, MCI registration number (mandatory).
   - Clinic/affiliation name, specialisations, languages spoken.
   - Three session fees: Initial Assessment, Follow-Up, Urgent Review. (FR-023a)
   - Photo.

6. Submits → psychiatrist account created → activation email sent to psychiatrist. (FR-001h)

---

### Phase 2: Managing Session Fees

7. Updates fees per psychiatrist individually (three fees per psychiatrist). (FR-023a)
   - Changes take effect for new bookings immediately.
   - No retroactive effect on confirmed bookings.

8. **Bulk fee update** for all psychiatrists in the agency:
   - Single action to change one fee type (e.g., Follow-Up) across all psychiatrists in the agency. (FR-023a)
   - Individual overrides still possible after bulk update.
   - No effect on confirmed bookings.

---

### Phase 3: Managing Availability Slots

9. Opens a psychiatrist's calendar within their agency.

10. Creates a slot for a psychiatrist:
    - Selects date, start time, session type. Duration auto-derived. (FR-024, FR-042)
    - **Branch — overlap or beyond 3-month horizon:** Rejected with error. (FR-024)
    - On success: slot immediately available for patient booking.

11. Blocks or deletes an existing slot:
    - If a confirmed booking exists → auto-cancelled, full Razorpay refund to patient, patient notified via SMS + WhatsApp with rebook link. (FR-026, FR-012a)

12. Cancels a confirmed appointment:
    - Full Razorpay refund always issued regardless of timing. Slot released. Patient notified. (FR-012a)

---

### Phase 4: Performance & Notifications

13. Views each psychiatrist's aggregated ratings (average, session count, rating distribution) and eligibility status. (FR-038, FR-039)

14. Receives in-platform notification when any psychiatrist in their agency becomes ineligible for new bookings (rating threshold crossed). (FR-039)

15. Receives in-platform notification for every psychiatrist no-show event in their agency, regardless of refund mode. (FR-045)

---

### Phase 5: Deactivating a Psychiatrist

16. Agency Admin (or Platform Admin) deactivates a psychiatrist:
    - Enters a cancellation reason.
    - **Immediate hard deactivation:** All upcoming confirmed bookings for this psychiatrist are cancelled. (FR-012b)
    - Full Razorpay refund issued for each cancelled booking.
    - Each affected patient notified via SMS + WhatsApp with the admin-supplied reason, "refund initiated — 5–7 business days", and a direct link to rebook. (FR-012b)
    - Historical session records and approved care recommendations from this psychiatrist remain in patient care history, accessible to any future psychiatrist the patient matches with. (FR-012b)

> **Friction point:** Deactivation is immediate and irreversible in its downstream effects — no "graceful wind-down" option in v1. A single action triggers mass cancellations instantly. The UI should prominently warn before this action.

---

### Phase 6: Data Access Boundaries

17. Agency Admin has **zero access to patient clinical data at any time:**
    - No intake responses, no care recommendations, no session transcripts. (FR-027)
    - Scope is limited to: psychiatrist profiles, availability, and fees within their own agency only. (FR-027)

---

## Actor 4: Platform Admin

### Phase 0: Account Activation (One-Time)

1. An existing Platform Admin creates a new Platform Admin account. Platform Admin is the only role that can create other Platform Admin accounts. (FR-001h)
   - Activation email sent with time-limited setup link (default: 24h).

2. New Platform Admin: sets password → sets up TOTP. Same requirements as other non-patient roles. (FR-001b, FR-001g)

3. Every subsequent login: email + password → TOTP. (FR-001b)

---

### Phase 1: System Setup (Pre-Launch)

4. Navigates to **PlatformConfiguration** and sets all platform-wide defaults before launch. (FR-035)

   Key values:
   - OTP expiry, lockout thresholds, session timeouts.
   - Appointment reminder intervals (default: 48h, 2h, 15min).
   - Daily Tier 3 notification cap per patient (default: 3).
   - Slot hold duration during checkout (default: 10 minutes).
   - Psychiatrist access window (default: 3 months).
   - Maximum slot publication horizon (default: 3 months).
   - Zoom transcript wait window (default: 60 minutes).
   - Razorpay reconciliation job interval (default: 15 minutes).
   - Password complexity rules.
   - Account activation link expiry (default: 24 hours).
   - List C prohibited drug list (pre-loaded with regulatory defaults; editable without code deploy). (FR-044)
   - List B drug reference list (informational panel content). (FR-044)
   - GST invoice number prefix (e.g., "MHP"). (FR-041)
   - Psychiatrist no-show refund mode (default: auto). (FR-045)
   - All session type durations (default: Initial Assessment = 60 min, Follow-Up = 30 min, Urgent Review = 60 min). (FR-042)
   - Follow-up nudge timing (default: send on recommended date itself). (FR-046)

5. Configures **Rating & Matching Settings** in the Platform Admin dashboard:
   - Eligibility rule thresholds (min sessions + avg rating cutoffs). Default: ≥5 sessions + avg < 2.0 → ineligible; ≥10 sessions + avg < 3.0 → ineligible. (FR-039)
   - Matching algorithm factor weights: symptom match, availability, preference, rating percentile. (FR-006, FR-009)
   - Percentile band labels and boundaries ("Top 5%", "Top 10%", etc.). (FR-038)
   - Match result list size (default: 5). (FR-035)
   - "Closest available" match score threshold. (FR-010, FR-035)
   - All changes take effect immediately, audit-logged. (FR-039)

---

### Phase 2: Agency & Account Onboarding

6. Creates the **first Agency Admin** account for each new partner agency. (FR-001h)
   - Enters agency name and contact details.
   - Creates AgencyAdmin account (email) → activation email sent.
   - Once Agency Admin activates, they can create additional Agency Admin + psychiatrist accounts for their agency.

7. Creates additional **Platform Admin** accounts as needed. (FR-001h)

---

### Phase 3: Daily Operational Monitoring

8. Opens the **Operations Dashboard** — the primary daily-use view. Contains:

   **Sub-panel A — Deletion Job Dashboard:** (FR-032, FR-033)
   - Pending, processing, completed, and SLA-breached jobs by type (On-Demand, Abandoned, Expiry).
   - Export jobs (FR-036) also visible here for audit.
   - Average processing times; jobs completed last 30 days.
   - No patient PII visible — only pseudonymous IDs, job types, timestamps, status.

   **Sub-panel B — Payment Reconciliation Flags:** (FR-033)
   - Unresolved Razorpay orders, failed auto-refunds, orders the reconciliation job could not resolve.
   - Platform Admin manually triggers a Razorpay refund for flagged payments directly from this panel. (FR-033)

   **Sub-panel C — Zoom Transcript Failures:** (FR-033)
   - Sessions where no transcript was received within the wait window.
   - Zoom failure rate shown as a percentage of total confirmed bookings. (SC-018)

   **Sub-panel D — WhatsApp & SMS Delivery Failure Logs:** (FR-033)
   - Failed WhatsApp/SMS attempts with timestamps and error reasons.
   - Failures also surfaced in affected patients' profiles for manual follow-up. (FR-022)

   **Sub-panel E — Audit Logs:** (FR-033)
   - Searchable and retrievable within 24 hours of any event. (SC-010)
   - Immutable. Events include: TOTP resets, PlatformConfiguration changes, patient data access, identity verification completions, blocked List C drug attempts.
   - No PHI in any audit log entry.

---

### Phase 4: Account-Level Actions

9. **Deactivates a psychiatrist account:**
   - Enters cancellation reason.
   - Immediate hard deactivation: all upcoming confirmed bookings cancelled, full refunds issued, patients notified. (FR-012b)
   - Same effects as Agency Admin deactivation but Platform Admin can act across all agencies.

10. **Resets TOTP** for any non-patient user who has lost their authenticator:
    - Verifies identity via out-of-band confirmation (email, phone call, etc.).
    - Performs reset from admin portal.
    - Immutable audit log created: account, admin who reset it, timestamp. (FR-001e)
    - User must re-enroll new TOTP on next login.

---

### Phase 5: Rating & Eligibility Management

11. Receives **in-platform notification** when any psychiatrist (across all agencies) becomes ineligible for new bookings due to rating threshold being crossed. (FR-039)

12. Reviews the psychiatrist's aggregated rating data in the admin portal. (FR-038)

13. Adjusts eligibility rules via the settings panel — changes take effect immediately. (FR-039)

14. Decides whether to enable **psychiatrist rating visibility** (off by default):
    - If toggled on: psychiatrists see their aggregate average, percentile band, total session count only — no individual patient scores. (FR-038)
    - Toggle stored in PlatformConfiguration. (FR-038)

---

### Phase 6: GST Invoice Management

15. Configures the GST invoice number prefix (e.g., "MHP") in PlatformConfiguration. (FR-041)
    - Format: `[PREFIX]/[FY]/[SEQUENCE]` (e.g., `MHP/2026-27/00001`).
    - Sequence auto-increments, gapless, resets April 1 each financial year.

16. Confirms with chartered accountant (before implementation): whether GSTIN on invoices belongs to the platform company or the agency (Electronic Commerce Operator structure). This is a legal determination — flagged in the spec, not yet resolved. (FR-041)

---

### Phase 7: Bulk Fee Management

17. Can **bulk-update session fees for all psychiatrists across all agencies platform-wide** in a single action. (FR-023a)
    - Scope: platform-wide (vs. Agency Admin scope: their agency only).
    - Individual overrides remain available after bulk update.
    - No effect on confirmed bookings.

---

### Phase 8: Ongoing PlatformConfiguration Changes

18. Updates any PlatformConfiguration value at any time (e.g., adjusting the Tier 3 daily cap, changing reminder intervals, updating the List C drug list for regulatory changes).
    - All changes take effect immediately without code deployment. (FR-035)
    - All changes audit-logged. (FR-035)

---

## Cross-Cutting Friction Points

The following friction points were identified across all four actor flows. These represent opportunities to simplify the user experience before planning begins.

| # | Actor | Friction Point | Severity |
|---|-------|----------------|----------|
| 1 | Psychiatrist | Two separate post-session workflows: session notes form (FR-015b) + e-prescription tool (FR-043). Both may be needed after the same session but are separate navigational workflows. Consider a unified post-session checklist screen. | High |
| 2 | All non-patient | TOTP loss is a Platform Admin bottleneck. Any user who loses their authenticator must contact Platform Admin out-of-band. The identity verification step has zero platform tooling — entirely manual. | Medium |
| 3 | Agency Admin | Psychiatrist deactivation is immediate and irreversible — one action triggers mass cancellations across all upcoming bookings. No soft-deactivation or wind-down period in v1. UI must prominently warn. | Medium |
| 4 | Patient | No WhatsApp number = zero care reminders. Tier 3 is WhatsApp-only with no SMS fallback. Patients who opt out at registration receive no medication reminders, activity nudges, or follow-up prompts. No recovery path in v1. | Medium |
| 5 | Patient | Mobile number loss = account loss. Patient who loses their mobile SIM loses their account permanently in v1. No recovery path. | Medium |
| 6 | Psychiatrist | Eligibility change is silent to the psychiatrist. They are never told they are ineligible for new bookings — only admins are notified. Existing bookings still honoured. Intentional but creates a poor experience. | Low |
| 7 | Platform Admin | GSTIN ownership (platform company vs. agency) is not yet resolved — a pre-implementation blocker for FR-041 that must be confirmed with a CA before planning. | Blocker |
| 8 | Psychiatrist | No-show detection relies entirely on Zoom webhook participant data quality. A Zoom webhook failure could silently miss a no-show event. | Low |
