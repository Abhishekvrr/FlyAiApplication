# Flyy AI — Privacy-Preserving Customer Data Platform (CDP) & Cryptographic Vault

<div align="center">

![Flyy AI Banner](docs/images/banner.jpg)

**Enterprise-Grade Zero-Plaintext Customer Data Platform, PII Discovery Engine, and Cryptographic Privacy Vault**

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Cryptography](https://img.shields.io/badge/Encryption-AES--256--GCM%20%7C%20FF1%20FPE-critical?style=for-the-badge&logo=shield)](https://csrc.nist.gov)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[Features](#key-capabilities) • [Architecture](#system-architecture) • [How to Use](#how-to-use-the-application) • [Dashboard Modules](#dashboard-modules--screens) • [API Guide](#api-reference) • [Evaluation Tour](#5-minute-evaluation-workflow)

---

</div>

## 📌 Table of Contents

- [Executive Summary](#executive-summary)
- [System Architecture](#system-architecture)
  - [Architectural Flowchart](#architectural-flowchart)
  - [Multi-Schema Database Isolation](#multi-schema-database-isolation)
- [Key Capabilities & Security Guarantees](#key-capabilities--security-guarantees)
- [Dashboard Modules & Screens](#dashboard-modules--screens)
- [Prerequisites](#prerequisites)
- [How to Use the Application](#how-to-use-the-application)
  - [Method 1: Local Native Setup (Recommended for Development)](#method-1-local-native-setup)
  - [Method 2: Docker Compose Setup](#method-2-docker-compose-setup)
- [5-Minute Evaluation Workflow](#5-minute-evaluation-workflow)
- [Role-Based Access Control (RBAC) Matrix](#role-based-access-control-rbac-matrix)
- [API Reference](#api-reference)
- [Testing & Quality Verification](#testing--quality-verification)
- [Project Directory Structure](#project-directory-structure)
- [Regulatory & Compliance Alignment](#regulatory--compliance-alignment)
- [License](#license)

---

## 🚀 Executive Summary

Modern enterprises need customer data for real-time analytics, machine learning, and personalized marketing. However, storing and circulating raw **Personally Identifiable Information (PII)** creates massive regulatory liabilities (GDPR, HIPAA, CCPA, DPDP) and severe data breach risks.

**Flyy AI CDP** bridges this divide by introducing a **Zero-Plaintext Architecture**:
1. **Raw PII enters only once** at the ingestion perimeter.
2. **Deterministic Tokenization & Format-Preserving Encryption (FF1)** isolate sensitive fields (names, emails, phone numbers) before data ever touches analytics or downstream marketing tables.
3. Downstream systems run campaigns, segment audiences, and process webhooks **strictly against encrypted tokens**.
4. Detokenization is strictly sequestered within a hardware-isolated cryptographic vault, accessible solely through **Justified Dual-Custody Reveal APIs** with immutable audit logs.

---

## 🏛️ System Architecture

<div align="center">

![Privacy-Preserving CDP Pipeline](docs/images/pipeline_architecture.jpg)

</div>

### Architectural Flowchart

```mermaid
flowchart LR
    subgraph INGESTION["1. Raw Data Perimeter"]
        RawSource[("source_store.customers\n(Raw PII)")]
        PresidioEngine["PII Discovery & Profiling\n(Presidio / Entropy / Regex)"]
    end

    subgraph VAULT["2. Cryptographic Privacy Gateway"]
        Gateway{"Privacy Gateway Engine"}
        FPE["FF1 FPE Engine\n(10-digit Phone Numbers)"]
        AES["AES-256-GCM Vault\n(Names, Emails, Identifiers)"]
        VaultStore[("vault_store.token_vault\n(Encrypted Mappings)")]
    end

    subgraph DOWNSTREAM["3. Protected Analytics & Action Layer"]
        ProtectedStore[("protected_store.customers_protected\n(De-identified / Zero Plaintext)")]
        CampaignService["Marketing Campaigns\n(Dispatches via Token Proxy)"]
        Mailpit["Mailpit Mock SMTP\n(Safe Email Simulation)"]
        Webhooks["Outbound Webhook Proxy\n(Bounce Tracking)"]
    end

    subgraph GOVERNANCE["4. Governance & Audit"]
        AuditStore[("audit_store.audit_logs\n(Immutable Audit Trail)")]
        PBAC{"Policy-Based Access Control\n(Role + Justification Check)"}
        AuditedReveal["Audited Justified Reveal\n(Authorized De-anonymization)"]
    end

    RawSource --> PresidioEngine
    PresidioEngine --> Gateway
    Gateway --> FPE & AES
    AES <--> VaultStore
    Gateway --> ProtectedStore
    ProtectedStore --> CampaignService
    CampaignService --> Mailpit
    ProtectedStore --> Webhooks
    Gateway -. Log Action .-> AuditStore
    ProtectedStore -. Reveal Request .-> PBAC
    PBAC --> VaultStore
    VaultStore --> AuditedReveal
    AuditedReveal -. Log Detokenization .-> AuditStore
```

### Multi-Schema Database Isolation

The platform enforces strict schema segregation within PostgreSQL:

| Schema Name | Purpose | Accessibility | Data Classification |
| :--- | :--- | :--- | :--- |
| `source_store` | Staging area for incoming raw records | Ingestion workers only | **Raw PII** (Restricted) |
| `protected_store` | Analytics, dashboards, segmentation, BI | Downstream apps, Marketers, Analysts | **Tokenized / FPE Protected** |
| `vault_store` | Maps irreversible/reversible tokens to AES-256 ciphertexts | Privacy Gateway ONLY | **Restricted Vault** |
| `audit_store` | Cryptographically signed operational event logs | Compliance Officers, Auditors | **Immutable Audit Logs** |
| `meta_store` | Privacy configuration, policies, and PBAC rules | Admin / Privacy Officers | **Configuration** |

---

## 🔒 Key Capabilities & Security Guarantees

### 1. Automated PII Discovery & Entropy Analysis
- Integrates **Microsoft Presidio Analyzer** paired with heuristic entropy analyzers and pattern recognizers.
- Automatically scans columns to classify `PHONE_NUMBER`, `EMAIL_ADDRESS`, `PERSON_NAME`, `CREDIT_CARD`, `IP_ADDRESS`, and `GOVERNMENT_ID`.
- Computes statistical confidence scores and recommends optimal cryptographic treatment (`TOKENIZE`, `FPE`, `MASK`, or `PASS_THROUGH`).

### 2. NIST SP 800-38G Format-Preserving Encryption (FF1)
- Uses **PyFFX (Feistel Finite Set Encryption)** over radix-10 alphabet.
- Converts a 10-digit mobile number (e.g. `9876543210`) into an encrypted 10-digit numeric string (e.g. `5218904732`).
- Preserves relational formatting, column data types, and database indexability without exposing plain numbers.

### 3. Reversible Deterministic Tokenization (AES-256-GCM)
- Employs **AES-256 in Galois/Counter Mode (GCM)** with 96-bit randomized initialization vectors (IVs) and 128-bit authentication tags.
- Yields unique tokens (e.g., `TOK_EM_9d7a2e...`) allowing SQL `JOIN`, `GROUP BY`, and deduplication across schemas without disclosing raw values.

### 4. Zero-Plaintext Campaign Execution
- Marketers create and trigger email campaigns targeting customer segments (e.g., "Enterprise", "High Value").
- The campaign worker consumes **only email tokens**.
- The gateway's internal dispatch proxy detokenizes the recipient in volatile memory, dispatches the email to SMTP (**Mailpit**), and cleanses memory immediately.

### 5. Policy-Based Access Control (PBAC) & Dual-Custody Reveal
- Raw data can never be viewed arbitrarily.
- A user requesting de-anonymization must supply:
  - **Valid Session & Role** (`ADMIN` or `COMPLIANCE_OFFICER`).
  - **Mandatory Business Justification** (e.g., `Law Enforcement Subpoena #8491` or `GDPR Subject Access Request`).
  - **Single Customer Target ID**.
- Every reveal event is instantly recorded in `audit_store.audit_logs`.

---

## 🖥️ Dashboard Modules & Screens

The responsive React + Vite single-page application provides 9 dedicated modules:

| Screen | Icon | Purpose | Key Actions |
| :--- | :---: | :--- | :--- |
| **Architecture** | 🏗️ | Live topological boundary explorer | Visualizes multi-schema flow and cryptographic boundaries. |
| **PII Discovery** | 🔍 | Automated attribute profiling | Triggers real-time PII scans, views confidence scores, and preview masks. |
| **Policy Engine** | 🛡️ | Privacy transformation configuration | Configures field-level policies (`TOKENIZE`, `FPE`, `MASK`, `PASS`). |
| **Batch Ingestion**| ⚡ | High-throughput batch worker | Ingests source customer batches with chunking and failure isolation. |
| **Customers** | 👥 | Dual-view customer database | Compares protected tokenized customer views against restricted vault data. |
| **Campaigns** | 🚀 | Privacy-safe campaign execution | Dispatches marketing emails via Mailpit using token proxies. |
| **Webhooks** | 🪝 | Outbound webhook & bounce listener | Simulates external vendor webhook dispatches and email bounce updates. |
| **Audited Reveal** | 🔓 | Justified de-anonymization modal | Controlled reveal screen with role check and mandatory justification audit. |
| **Governance** | 📜 | Real-time audit trail and compliance | Inspects tamper-evident audit logs, action statistics, and export logs. |

---

## ⚙️ Prerequisites

Ensure you have the following installed on your machine:

- **Python**: Version `3.10` or higher (`python --version`)
- **Node.js**: Version `18.0.0` or higher (`node -v`) and `npm`
- **Database & Services**:
  - **Option 1**: Docker Desktop installed and running.
  - **Option 2**: PostgreSQL 15 and Mailpit installed locally.

---

## 📖 How to Use the Application

### Method 1: Local Native Setup

#### Step 1: Clone the Repository
```bash
git clone https://github.com/Abhishekvrr/FlyAiApplication.git
cd FlyAiApplication
```

#### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```ini
DATABASE_URL=postgresql://cdp_admin:cdp_secure_pass@localhost:5432/cdp_platform
VAULT_MASTER_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
FPE_KEY=2b7e151628aed2a6abf7158809cf4f3c
SMTP_HOST=localhost
SMTP_PORT=1025
WEBHOOK_SIGNING_SECRET=whsec_flyy_mock_secret_key_2026
```

#### Step 3: Start Infrastructure (PostgreSQL & Mailpit)
Run the automated background service starter:
```powershell
# Windows
python scripts\start_services.py
```
*This launches PostgreSQL on port `5432` and Mailpit on ports `1025` (SMTP) and `8025` (Web UI).*

#### Step 4: Seed Sample Customer Data
Populate `source_store.customers` with 50 realistic customer records:
```bash
python scripts/seed_source.py
```

#### Step 5: Start the FastAPI Backend Gateway
In a terminal, start the Privacy Gateway API:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Health: `http://localhost:8000/health`
- Interactive Swagger UI: `http://localhost:8000/docs`

#### Step 6: Start the Frontend React Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: **`http://localhost:5173`**

---

### Method 2: Docker Compose Setup

Run the full infrastructure stack in isolated containers:
```bash
# Start PostgreSQL and Mailpit
docker-compose up -d

# Seed the database
python scripts/seed_source.py

# Run FastAPI and Frontend
uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

---

## ⏱️ 5-Minute Evaluation Workflow

Follow this step-by-step path to test all core security and functional flows:

```
[1. Start Guided Tour] ➔ [2. Scan PII Discovery] ➔ [3. Run Batch Pipeline]
        │
        ▼
[4. Inspect Protected Customers] ➔ [5. Trigger Privacy Campaign] ➔ [6. Check Mailpit]
        │
        ▼
[7. Attempt Justified Reveal] ➔ [8. Verify Audit Trail in Governance]
```

### 1. Launch the 13-Point Interactive Tour
- Open `http://localhost:5173`.
- Click the **"Guided Tour"** button in the top navigation bar.
- Step through the 13 checkpoints explaining each privacy layer, schema separation, and cryptographic control.

### 2. Discover PII in Raw Ingestion
- Click the **"Discovery"** tab.
- Click **"Run Automated PII Scan"**.
- View how the engine automatically detects:
  - `email` ➔ `EMAIL_ADDRESS` (Confidence: 100%, Recommendation: `TOKENIZE`)
  - `mobile` ➔ `PHONE_NUMBER` (Confidence: 85%, Recommendation: `FPE`)
  - `name` ➔ `PERSON_NAME` (Confidence: 85%, Recommendation: `TOKENIZE`)

### 3. Run Cryptographic Batch Ingestion
- Switch to the **"Batch Pipeline"** tab.
- Select chunk size `25` and click **"Execute Batch Pipeline"**.
- Watch the progress bar as 50 raw customer records are tokenized and encrypted in sub-second time.

### 4. Verify Zero Plaintext in Protected Customers
- Navigate to the **"Customers"** tab.
- Observe the **Protected Customer Store**:
  - Email addresses are deterministic tokens (`TOK_EM_...`).
  - Mobile numbers are converted via FF1 format-preserving encryption (`987654...` ➔ `542918...`).
  - **Zero plaintext PII is accessible to this screen.**

### 5. Execute a Privacy-Safe Campaign
- Go to the **"Campaigns"** tab.
- Select Audience Segment: `Premium`.
- Enter Campaign Subject: `Exclusive VIP Privacy Offer`.
- Click **"Dispatch Campaign"**. The platform sends emails using only customer tokens.

### 6. Verify Email Delivery in Mailpit
- Open your browser to `http://localhost:8025`.
- Inspect the received emails in Mailpit's inbox to verify the recipient detokenization was handled securely at the proxy border.

### 7. Perform an Audited De-anonymization (Reveal)
- Switch your role in the top header to **`ADMIN`** or **`COMPLIANCE_OFFICER`**.
- Go to the **"Audited Reveal"** tab.
- Enter Customer ID (e.g. `C001`) and enter a mandatory justification (e.g., `Court Subpoena #1092`).
- Click **"Submit Justified Reveal Request"** to decrypt and view the authorized record.

### 8. Inspect the Immutable Audit Trail
- Click the **"Governance"** tab.
- Notice that the reveal action, along with the timestamp, role, customer ID, and exact business justification, is permanently logged.

---

## 👥 Role-Based Access Control (RBAC) Matrix

Switch roles in the top-right header dropdown to evaluate permission boundaries:

| Role | View Protected Data | Run Batch Pipelines | Trigger Campaigns | Execute Audited Reveal | View Audit Logs |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ *(with justification)* | ✅ |
| **COMPLIANCE_OFFICER**| ✅ | ❌ | ❌ | ✅ *(with justification)* | ✅ |
| **DATA_ENGINEER** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **MARKETER** | ✅ *(tokens only)* | ❌ | ✅ | ❌ | ❌ |

---

## 📡 API Reference

Explore the full interactive documentation at `http://localhost:8000/docs`.

| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Service health status check | Public |
| `POST`| `/api/discover` | Profiles PII in source tables with confidence scoring | Data Engineer, Admin |
| `POST`| `/api/batch/run` | Executes cryptographic batch ingestion pipeline | Data Engineer, Admin |
| `GET` | `/api/customers` | Returns protected, tokenized customer records | All Authenticated |
| `POST`| `/api/customers` | Ingests a new single customer record into vault & protected store | Admin, Ingestion API |
| `POST`| `/api/actions/campaign` | Dispatches email campaigns via token-resolved SMTP proxy | Marketer, Admin |
| `POST`| `/api/actions/webhook/bounce`| Ingests email bounce events and marks protected customer records | Webhook Service |
| `POST`| `/api/reveal` | Policy-based de-anonymization requiring justification | Compliance, Admin |
| `GET` | `/api/audit/logs` | Retrieves tamper-evident operational audit logs | Compliance, Admin |
| `GET` | `/api/audit/stats` | Aggregated metrics on detokenization, batches, and campaigns | Compliance, Admin |
| `GET` | `/api/policies` | Lists active column tokenization and encryption policies | Admin |

---

## 🧪 Testing & Quality Verification

Flyy AI features an automated test suite verifying all cryptographic primitives and API routes.

### Run Crypto Unit Tests
```bash
python -m pytest tests/test_crypto.py -v
```
**Tests Covered:**
- `test_fpe_phone_preservation`: Verifies 10-digit format preservation and round-trip decryption.
- `test_fpe_phone_cleaning_and_validation`: Tests phone sanitization and edge-case validation.
- `test_vault_aes_gcm_encryption`: Verifies 256-bit GCM cipher integrity and authentication tags.
- `test_deterministic_token_generation`: Confirms relational consistency of generated tokens.
- `test_pii_discovery_scanner`: Validates Presidio classification and confidence thresholds.

### Run API Integration Tests
*(Requires PostgreSQL server to be running)*
```bash
python -m pytest tests/test_api.py -v
```

---

## 📂 Project Directory Structure

```
Flyy_Ai/
├── app/
│   ├── api/                     # FastAPI Route Controllers
│   │   ├── actions.py           # Campaign execution & bounce webhooks
│   │   ├── audit.py             # Tamper-evident audit trail endpoints
│   │   ├── auth.py              # User authentication & role verification
│   │   ├── batch.py             # Batch ingestion pipeline endpoints
│   │   ├── customers.py         # Protected & vaulted customer queries
│   │   ├── discovery.py         # Automated PII discovery profiling
│   │   ├── policies.py          # Privacy rule definitions
│   │   ├── privacy_settings.py  # Global vault settings
│   │   └── reveal.py            # PBAC Justified Reveal API
│   ├── crypto/                  # Core Cryptographic Vault Primitives
│   │   ├── fpe.py               # NIST FF1 Format-Preserving Encryption
│   │   ├── tokenizer.py         # Deterministic / Non-Deterministic Tokenizer
│   │   └── vault_crypto.py      # AES-256-GCM Vault Encryption
│   ├── db/                      # Database engine & session management
│   │   └── session.py
│   ├── discovery/               # PII Inspection Engine
│   │   └── pii_engine.py        # Presidio + Regex + Entropy Scanners
│   ├── pipeline/                # ETL & Stream Ingestion Pipeline
│   │   └── ingestion.py
│   └── main.py                  # Application entry point & CORS
│
├── frontend/                    # Modern React 18 + Vite + Tailwind CSS Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/            # Authentication & session modals
│   │   │   ├── customers/       # Add customer & table components
│   │   │   ├── onboarding/      # Interactive hero explainer banner
│   │   │   ├── settings/        # Privacy settings modal
│   │   │   ├── tabs/            # 9 Evaluation screens (Architecture, Discovery, etc.)
│   │   │   ├── GuidedTourModal.jsx # 13-Point Guided Evaluation Walkthrough
│   │   │   ├── Header.jsx       # Global header with role-switch dropdown
│   │   │   └── Navigation.jsx   # Tabbed evaluation navigation bar
│   │   ├── context/             # React Context for Auth and Roles
│   │   ├── services/            # Axios API client
│   │   └── App.jsx              # Main React container
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── docker/                      # Container configs
│   └── init.sql                 # Multi-schema database initialization
├── docker-compose.yml           # PostgreSQL 15 & Mailpit orchestration
├── docs/                        # Documentation & Visual Assets
│   └── images/
│       ├── banner.jpg           # High-resolution platform banner
│       └── pipeline_architecture.jpg # Pipeline infographic diagram
├── scripts/                     # Operational & Utility Scripts
│   ├── seed_source.py           # Seeds 50 realistic customer records
│   ├── setup_infra.py           # Downloads & sets up local Postgres/Mailpit
│   ├── start_services.py        # Launches background services
│   └── verify_api.py            # Smoke test verification script
├── tests/                       # Pytest Suite
│   ├── test_api.py              # API & integration tests
│   └── test_crypto.py           # Unit tests for FPE, AES-GCM, and Tokens
├── .env.example                 # Template for environment configuration
├── requirements.txt             # Python backend dependencies
└── README.md                    # Project documentation
```

---

## 📜 Regulatory & Compliance Alignment

Flyy AI is designed from the ground up to satisfy stringent international data privacy standards:

- **GDPR (General Data Protection Regulation)**:
  - *Article 25 (Data Protection by Design and by Default)*: Data is pseudonymized at ingestion.
  - *Article 32 (Security of Processing)*: Zero plaintext storage in analytics layers.
- **HIPAA Safe Harbor**:
  - Eliminates all 18 direct identifiers from analytical query surfaces.
- **PCI-DSS v4.0 Requirement 3**:
  - Protects stored account and cardholder data via format-preserving cryptographic tokens.
- **CCPA / CPRA (California Consumer Privacy Act)**:
  - Limits exposure of sensitive personal information while enabling operational utility.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

<div align="center">

**Built with ❤️ for privacy-first modern data engineering.**

</div>