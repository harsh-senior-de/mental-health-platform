# Research: Psychiatric Session Design in the Indian Market

**Purpose**: Ground the platform spec in how psychiatric care actually works in India before
finalising session types, booking flows, and clinical workflows.
**Researched**: 2026-05-02
**Sources**: 25+ sources including PMC clinical guidelines, IPS surveys, NIMHANS telepsychiatry
guidelines, Ministry of Health Telemedicine Practice Guidelines 2020, and live competitor
platform analysis.

---

## 1. Competitor Platforms — How They Structure Psychiatric Consultations

### 1.1 Practo

- **Model**: Marketplace aggregator. Psychiatrists set their own fees and session structures.
- **Session types**: No formal new-vs-follow-up distinction enforced by the platform. Individual
  doctors may list different slots at different fees but the platform does not enforce this.
- **Booking flow**: Search → select psychiatrist → choose slot → pay → video/audio/chat inside app →
  e-prescription issued inside app → optional follow-up booking prompt.
- **Duration**: Listed as "active for 60 minutes." In practice: new patients 45–60 min,
  follow-ups 20–30 min — driven by doctor practice, not platform enforcement.
- **Pricing (current market rates)**:
  - Initial: ₹1,500–₹4,600 online; premium metro practices up to ₹6,900
  - Follow-up: ₹1,000–₹3,450 (typically 20–50% lower)
  - Practo Plus: ₹399/month subscription covering unlimited online consultations across 25+ specialties
- **Between-session communication**: Asynchronous doctor chat (24h response window) included.
- **Care plan**: No platform-level care plan. Continuity entirely patient-driven.
- **Prescription**: Digital prescription delivered inside app. Doctor controls format. Must
  include MCI registration number per telemedicine rules.

### 1.2 Lybrate

- **Model**: Similar marketplace aggregator. 150,000+ doctors listed.
- **Session types**: No distinct session-type taxonomy. Single fee per doctor.
- **Differentiator**: Free follow-up consultation within 7 days of initial consultation
  (asynchronous chat window only — not a full video session).
- **Prescription**: E-prescription via app or WhatsApp. Complies with telemedicine guidelines.

### 1.3 MFine (acquired by MediBuddy 2022)

- **Model**: Hospital-network-integrated telemedicine.
- **Booking flow**: Patient answers preliminary symptom questions (triage) → matched to
  psychiatrist → chat/audio/video consultation → e-prescription.
- **Pricing**: Average ₹800 (lower end — reflects hospital-network pricing).
- **Free follow-up**: Within 5–7 days of initial consultation (in-app "consult again" option).
- **Care plan**: No platform-level structure.

### 1.4 DocVita

- **Model**: Curated marketplace with Care Manager concierge model. Premium positioning.
- **Session duration**: States "average 30 minutes" — suggests follow-up-style sessions dominate.
- **Pricing**: Starting ₹1,000, varies by doctor.
- **Distinctive feature**: Psychiatrist sends prescription to DocVita Care Manager → Care Manager
  forwards to patient's WhatsApp. Closest to a managed prescription flow in the market.
- **Platform for sessions**: Google Meet or Zoom (explicitly stated as unrecorded).

### 1.5 RocketHealth ⭐ (Most clinically structured competitor)

- **Model**: Digital-native, vertically integrated mental + sexual health. Not a marketplace.
- **Booking flow**: Symptom survey (5–10 min) → matched psychiatrist profile → pay →
  video session → e-prescription + optional medication home delivery.
- **Session type differentiation** (clearest of all platforms surveyed):
  - **Initial consultation**: 45–60 min, video mandatory, full history + provisional diagnosis. ₹1,800+
  - **Follow-up consultations**: 20–30 min, lower price, audio/video/text per guidelines
- **Care plan**: Post-session follow-up booking prompt integrated. Between-session messaging
  to care team available.
- **Prescription**: E-prescription issued; optionally fulfilled via home delivery (discreet packaging).
- **Key insight**: Only platform with a formal initial-vs-follow-up distinction enforced as
  product SKUs. This is the direct model to learn from.

### 1.6 DocGenie ⭐ (Only subscription/care-plan model found)

- **Model**: Subscription-based, bundled therapy + psychiatry per month.
- **Subscription tiers**:

  | Plan | Price/month | Psychologist sessions | Psychiatrist sessions | Feedback calls |
  |------|-----------|-----------------------|----------------------|----------------|
  | Basic | ₹7,500 | 4 | 1 | 8 |
  | Superior | ₹9,500 | 6 | 1 | 12 |
  | Premium | ₹12,500 | 8 | 2 | 12 |

- **Key insight**: Only platform with formalized, subscription-based care plan combining
  therapy + psychiatry. A coordinator handles all scheduling post-enrollment.

### 1.7 Amaha (formerly InnerHour)

- **Model**: Vertically integrated clinical platform (founded by a psychiatrist). Offers
  self-care tools, peer support, therapy, and psychiatric care online and in-person.
- **Scale**: 110+ psychiatrists and therapists; 35,000+ sessions per year; 15+ Indian languages.
- **Physical centres**: Mumbai, Bangalore, Delhi NCR alongside online.
- **Pricing**: Not publicly disclosed.
- **Key insight**: Most clinical of all platforms. Uses proprietary clinical protocols and
  peer supervision. Closest to the quality target for our platform.

### 1.8 Market-Wide Pattern Summary

| Feature | Practo | Lybrate | MFine | DocVita | RocketHealth | DocGenie | Amaha |
|---------|--------|---------|-------|---------|--------------|----------|-------|
| New vs. follow-up distinction | No (doctor-led) | No | No | No | **Yes** | Plan-based | Unknown |
| Tiered pricing new/follow-up | Doctor-set | Doctor-set | No | No | **Yes** | Plan-based | Unknown |
| Intake questionnaire before booking | No | Basic | Yes | No | **Yes** | Yes | Yes |
| Structured care plan | No | No | No | No | Partial | **Yes** | Yes |
| Subscription/package model | Plus plan | No | No | No | Therapy only | **Yes** | Unknown |
| Between-session messaging | 24h chat | No | 5–7 day free | WhatsApp | Yes (care team) | Via coordinator | Unknown |
| Prescription + delivery | In-app | In-app/WhatsApp | In-app | WhatsApp via Care Manager | **In-app + home delivery** | Unknown | Unknown |

**Critical market gap**: No major Indian platform formally structures the clinical flow into
named session types enforced at the product level. New-vs-follow-up exists in pricing norms
and duration but is not enforced as distinct product SKUs — except RocketHealth.

---

## 2. Clinical Workflow — How Indian Psychiatrists Actually Work

### 2.1 Initial Consultation (First Visit) — 45–60 Minutes

Per the IPS Consensus on Psychiatry History and Diagnostic Formulation (Jan 2025):

1. **Sociodemographic details** — name, age, gender, education, occupation, marital status,
   religion, family type, locality
2. **Presenting complaints** — verbatim patient/informant report; duration; sequence of onset;
   functional impairment assessment
3. **History of presenting illness** — chronology, symptom course (episodic vs. continuous),
   precipitants, prior help-seeking, prior treatments and response
4. **Negative history** — ruling out competing diagnoses (especially substance use)
5. **Past psychiatric history** — prior episodes, diagnoses, hospitalisations, treatments
6. **Past medical history** — physical comorbidities, surgeries, current medications
7. **Family history** — psychiatric illness in first-degree relatives; family treatment response
   (directly guides medication selection)
8. **Personal history** — birth and development, education, occupational history, relationships
9. **Premorbid personality** — personality traits before illness onset
10. **Substance use history** — alcohol, tobacco, recreational drugs
11. **Mental Status Examination (MSE)** — standardised per IPS Consensus across 10 domains:
    appearance, attitude/behaviour, speech, mood, affect, thought process, thought content,
    perception, cognition, insight and judgment. Must be conducted in patient's language.
12. **Physical examination** — where clinically indicated
13. **Investigations ordered** — standard baseline: hemogram, fasting glucose, thyroid
    function, LFT/RFT, lipid profile, ECG; brain CT/MRI when indicated
14. **Provisional/differential diagnosis** — using ICD-10 (Indian standard) or DSM-5
15. **Diagnostic formulation** — 10–20 sentence biopsychosocial formulation
16. **Treatment plan** — pharmacological + non-pharmacological + psychoeducation for
    patient and family

**Online-specific (telemedicine first consultation)**: Identity confirmation is the first
step. Psychiatrist must reach a provisional diagnosis before prescribing. Physical examination
is replaced by collateral history and video MSE.

### 2.2 Follow-Up Consultation — 20–30 Minutes

**Standard agenda**:
- Status check since last visit
- Medication adherence
- Side effects and tolerability
- Symptom trajectory (better/worse/same)
- Life events or stressors since last visit
- Brief focused MSE (change from baseline)
- Medication adjustment decision (dose/switch/add-on)
- Next follow-up scheduling
- Between-visit instructions

**Documentation format (SOAP notes)**:
- **S (Subjective)**: Patient self-report — symptoms, mood, sleep, appetite, side effects,
  life events
- **O (Objective)**: Brief MSE findings, vitals if relevant
- **A (Assessment)**: Clinical impression, diagnosis phase, treatment response
- **P (Plan)**: Medication adjustments, labs, next session, psychoeducation

### 2.3 Session Type Taxonomy (Clinical Reality vs. Platform Reality)

There is no formal regulatory taxonomy of session types in India. In practice:

| Session Type | When Used | Typical Duration | Mode Required |
|---|---|---|---|
| Initial / comprehensive assessment | First contact with new patient | 45–60 min | **Video mandatory** (regulatory) |
| Medication initiation review | 1–2 weeks post-new-medication start | 15–30 min | Any mode |
| Follow-up / review | Ongoing care, stable/improving patient | 20–30 min | Any mode |
| Medication review (stable phase) | Monthly–quarterly for stable patients | 15–20 min | Any mode |
| Crisis / urgent review | Acute deterioration or safety concern | 30–60 min | Video preferred |
| Caregiver consultation | When patient cannot attend | 20–30 min | Requires patient's written authorisation (per Telepsychiatry Guidelines 2020) |

**Platform implication**: Our spec currently treats all sessions identically. This is
clinically incorrect and creates regulatory risk (first consultations must be video).

### 2.4 Between-Session Communication

- 73.4% of Indian psychiatrists deliver prescriptions via email/WhatsApp (IPS survey data)
- WhatsApp is the dominant between-session communication channel in actual practice
- Telemedicine Guidelines 2020 permit asynchronous text-based follow-up but **require video
  for initial consultations when new medications are being prescribed for the first time**

---

## 3. Prescription and Medication Management

### 3.1 Drug Classification for Telemedicine (Telepsychiatry Operational Guidelines 2020)

**List A — Prescribable in First + Follow-Up Consultations via Telemedicine**
- First consultation requires live, simultaneous video consultation
- Follow-ups: any mode permitted
- Examples:
  - Antidepressants: escitalopram, sertraline, fluoxetine, paroxetine, venlafaxine, duloxetine, mirtazapine, imipramine
  - Antipsychotics: haloperidol, risperidone, olanzapine, quetiapine, aripiprazole
  - Mood stabilisers: lithium carbonate, carbamazepine, valproate, lamotrigine
  - Limited benzodiazepines: clonazepam, clobazam (exception)
  - Non-BZD anxiolytics: buspirone, hydroxyzine
  - Cognitive enhancers: donepezil, memantine, rivastigmine
  - Non-stimulant ADHD: atomoxetine

**List B — Follow-Up Only (at least one prior in-person or video consultation required)**
- Add-on medications to optimise treatment
- Any mode permitted for the follow-up itself
- Examples: pregabalin, gabapentin, certain antipsychotic add-ons

**List C — Prohibited from Telemedicine Prescribing**
- Schedule X drugs under Drugs and Cosmetics Act 1940 + NDPS Act substances
- **Specific prohibited drugs (critical for clinical workflow)**:
  - Most benzodiazepines: **diazepam, lorazepam, alprazolam (Alprax), nitrazepam, chlordiazepoxide** — extremely commonly prescribed in India; cannot be prescribed online
  - Z-drugs: **zolpidem**
  - Stimulants: **methylphenidate, modafinil**
  - Opioids: morphine, buprenorphine, methadone
  - Phenobarbitone
  - Depot antipsychotics

> **Critical clinical gap in current spec**: Alprazolam (Alprax/Restyl) is one of the most
> commonly prescribed anxiolytics in India. A patient presenting with severe anxiety may need
> a benzodiazepine that the psychiatrist **legally cannot prescribe via telemedicine**. The
> platform must either surface this limitation or require an in-person visit path.

### 3.2 Valid Telemedicine Prescription Format (Mandatory Fields)

**Doctor fields (all mandatory)**:
- Full name, designation, qualification
- Medical Council of India (MCI) Registration Number — must appear on prescriptions, websites, emails, and WhatsApp messages
- Clinic/affiliation name and address

**Patient fields**:
- Name, age, address, phone and/or email
- ID verification record

**Medication fields**:
- Generic drug names in **CAPITAL LETTERS** (mandatory; brand name optional alongside)
- Dose, frequency, duration, route of administration
- Special instructions

**Format**:
- Digital (e-prescription) or photographed/scanned signed physical prescription
- Transmitted via email, WhatsApp, or any messaging platform
- Must carry doctor's digital or photographed wet signature
- Must include date of consultation

**Platform obligation**: The platform must provide the technical mechanism for the psychiatrist
to generate and transmit prescriptions, and must retain a copy in the patient's clinical record.

---

## 4. Session Frequency and Care Continuity Patterns

### 4.1 Three-Phase Treatment Model (IPS Clinical Practice Guidelines)

**Phase 1 — Acute Phase**
- **Goal**: Achieve remission (elimination or significant reduction of active symptoms)
- **Duration**: 6–12 weeks from treatment initiation; significant improvement expected within 4–6 weeks
- **Visit frequency**:
  - Week 1–2 post-medication start: review within 1–2 weeks
  - Thereafter: every 2–4 weeks until stabilisation
  - High-risk patients (antipsychotics/mood stabilisers): within 1 week
  - Post-hospital discharge: follow-up within 1 week (mandated)

**Phase 2 — Continuation Phase**
- **Goal**: Prevent relapse; consolidate gains
- **Duration**: 16–24 weeks (total 6–9 months from treatment initiation for depression/anxiety;
  longer for schizophrenia/bipolar)
- **Visit frequency**: Every 4–6 weeks
- **Stability markers**: No active symptoms, no suicidality, medication adherence maintained,
  functional recovery

**Phase 3 — Maintenance Phase**
- **Goal**: Prevent recurrence; optimise long-term functioning
- **Duration**:
  - First-episode depression with full remission: 6–12 months then taper
  - Recurrent episodes (2+): 2–5 years
  - 3+ relapses or schizophrenia/bipolar: typically indefinite
- **Visit frequency**: Monthly for therapy; every 1–3 months for medication reviews in stable patients;
  every 3–6 months for very stable long-term patients

### 4.2 Stability Criteria

A patient is considered stable when:
- Active psychiatric symptoms resolved or sub-clinical
- No suicidal ideation or safety concerns
- Medication tolerance established (no unmanageable side effects)
- Social/occupational functioning recovering or recovered
- Consistent medication adherence
- No new psychiatric crises in prior 4–6 weeks

### 4.3 Typical Treatment Duration by Condition

| Condition | Acute Phase | Continuation | Maintenance |
|---|---|---|---|
| First-episode depression | 6–8 weeks | 16–24 weeks | 6–12 months post-remission, then taper |
| Recurrent depression (2+ episodes) | 6–8 weeks | 24 weeks | 2–5 years |
| Generalised anxiety disorder | 6–8 weeks | 24 weeks | 1–2 years |
| Schizophrenia (first episode) | 8–12 weeks | 6 months | 1–2 years minimum; often indefinite |
| Bipolar disorder | Episode-dependent | 6 months | Indefinite in most cases |
| OCD | 8–12 weeks | 6 months | 1–2 years; often long-term |

### 4.4 Real-World Telepsychiatry Follow-Up Patterns (NIMHANS TAC Clinic Data)

- 67.77% of telepsychiatry patients had 1–3 consultations total in a follow-up period
- 13.33% had 4–6 consultations
- 18.7% had 7+ consultations
- Clinical outcomes: 94.4% of schizophrenia patients, 81.71% of bipolar patients showed improvement
  using a stepped-down frequency model (weekly → fortnightly → monthly)

---

## 5. MHCA 2017 Documentation Requirements

For all outpatient psychiatric services, Form B records are mandated:
- Form B-1: Outpatient record
- Form B-2: Inpatient record
- Form B-3: Therapy record
- Form B-4: Psychological assessment record

**Minimum content per encounter (outpatient)**:
- Registration number and sociodemographic data
- Presenting complaints
- History
- Advance directive and nominated representative information
- Investigation reports
- Treatment advice
- Psychological assessment (if done)
- Therapy session notes (if done)

**Session-level documentation must include**:
- Type of treatment/therapy
- Duration and goals
- Techniques used
- Clinical observations
- Progress notes
- Capacity assessment (when relevant)
- Risk/benefit discussions
- Consent status

**Patient data access right**: Patient can request records via Form A; must be provided within 15 days.

---

## 6. Implications for Platform Design

### 6.1 Session Types the Platform Must Support

The current spec treats all sessions as identical. Based on research, six distinct session types
exist in Indian psychiatric practice:

| # | Session Type | Duration | Mode Constraint | When Triggered |
|---|---|---|---|---|
| 1 | Initial / Comprehensive Assessment | 45–60 min | **Video only** (regulatory) | Patient's first-ever booking |
| 2 | Medication Initiation Review | 15–30 min | Any mode | 1–2 weeks after first prescription |
| 3 | Follow-Up / Review | 20–30 min | Any mode | Ongoing care during acute phase |
| 4 | Medication Review (Stable) | 15–20 min | Any mode | Monthly/quarterly once stable |
| 5 | Crisis / Urgent | 30–60 min | Video preferred | Acute deterioration or safety concern |
| 6 | Caregiver Consultation | 20–30 min | Any mode | Patient authorises caregiver to attend |

### 6.2 Regulatory Constraints the Platform Must Enforce

- **Initial consultation = video only**: Cannot allow audio/text-only for a patient's
  first appointment. This is a Telemedicine Guidelines 2020 requirement.
- **List C drugs cannot be prescribed online**: Platform must support psychiatrists in
  flagging or excluding these from e-prescription tooling (alprazolam is most critical).
- **All prescriptions must include MCI registration number**: Platform must capture and
  display this on generated prescriptions.
- **Form B-1 record per session**: Each session must produce a structured record compliant
  with MHCA 2017 minimum content requirements.

### 6.3 Follow-Up Scheduling the Platform Should Automate

- After initial assessment: suggest follow-up in 2–4 weeks
- After any new medication initiation: trigger 1–2 week medication initiation review
- Stable patients: suggest monthly or bi-monthly cadence
- No-show detection should trigger patient re-engagement (high dropout is documented in Indian telepsychiatry)

### 6.4 Gaps This Creates in the Current Spec

1. **No session type concept** — all bookings are treated identically; regulatory differentiation
   (video-only for first consultations) is not enforced
2. **No mode selection** — the spec assumes Zoom video for all sessions; audio/text modes are
   clinically and regulatorily permitted for follow-ups but not for first consultations
3. **No prescription workflow** — the spec references care recommendations but has no FR for
   e-prescription generation, MCI number capture, or List C drug constraints
4. **No treatment phase tracking** — no concept of acute/continuation/maintenance phases;
   no automatic follow-up scheduling based on clinical phase
5. **No caregiver consultation type** — MHCA 2017 / Telepsychiatry Guidelines 2020 define
   a specific caregiver consultation authorisation format
6. **No MHCA 2017 Form B-1 compliance** — session documentation requirements not captured

---

## 7. Sources

- Telemedicine Practice Guidelines India 2020 (Board of Governors, MCI / Ministry of Health)
- Telepsychiatry Operational Guidelines 2020 (IPS + NIMHANS + Telemedicine Society of India)
- IPS Consensus Statement on Psychiatry History and Diagnostic Formulation (Jan 2025)
- IPS Clinical Practice Guidelines for Management of Depression
- Mental Healthcare Act 2017 and Mental Healthcare (State) Rules 2018
- NIMHANS Tele-Psychiatric After Care (TAC) Clinic study (PMC7234568)
- IPS Survey on Current Telepsychiatry Practice in India (PMC9290427)
- RocketHealth online psychiatrist consultation guide (2026)
- Practo Delhi psychiatrist listing (live)
- DocVita, MFine, Lybrate, DocGenie, TalktoAngel, Amaha platform reviews
- Srinivasai IMSS Detailed Psychiatry Medications List for online prescription
