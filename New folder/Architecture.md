# **System Architecture Document (SAD)**

## **Intelligent Land & Property Record Intelligence System**

**Version:** 1.0  
**Architecture Style:** Modular, API-first, event-driven processing  
**Deployment:** Cloud / Government Data Center / NIC-compatible infrastructure  
**Primary Goal:** Digitize → Extract → Validate → Reconcile → Prioritize → Verify → Audit

# **1\. Architecture Overview**

The proposed architecture is designed around one central idea:

**Keep document processing, intelligence, validation, evidence, and human verification as separate components, but connect them through a controlled backend.**

We should **not over-engineer this into 15 microservices or a blockchain-heavy architecture** for the MVP.

A modular backend with asynchronous processing is enough initially. Individual components can later be separated and scaled independently.

### **High-Level Architecture**
┌──────────────────────────────────────────────────────────────┐
│                         USER LAYER                           │
│                                                              │
│  Revenue Officer │ Verification Officer │ Administrator      │
│                         │                                    │
│                  Web Application                             │
└─────────────────────────┬────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│                                                              │
│                    API Gateway / Backend                      │
│                                                              │
│  Authentication │ RBAC │ Document │ Verification │ Dashboard │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Intelligence Engine                       │  │
│  │ OCR/ICR → Extraction → Normalization → Validation      │  │
│  │            → Conflict Detection → Risk Scoring         │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────┬──────────────┬──────────────┬────────────────┘
                │              │              │
                ▼              ▼              ▼
┌────────────────────┐ ┌───────────────┐ ┌─────────────────────┐
│ Document Storage   │ │ PostgreSQL    │ │ Evidence Graph      │
│                    │ │               │ │                     │
│ Original PDFs      │ │ Structured    │ │ Property ↔ Owner    │
│ Images             │ │ Records       │ │ Documents ↔ Events  │
│ Processed pages    │ │ Users         │ │ Mutation ↔ GIS      │
│                    │ │ Audit logs    │ │                     │
└────────────────────┘ └───────────────┘ └─────────────────────┘
                │              │              │
                └──────────────┴──────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │ Integration Layer       │
                  │                         │
                  │ LRMS │ DILRMP │ GIS    │
                  │ Registration │ APIs     │
                  └─────────────────────────┘
# **2\. Recommended Technology Stack**

## **Frontend**

| **Component**     | **Technology**               | **Purpose**                       |
| ----------------- | ---------------------------- | --------------------------------- |
| Web Framework     | **Next.js / React**          | Officer/admin web application     |
| ---               | ---                          | ---                               |
| Language          | **JavaScript**               | Type-safe frontend development    |
| ---               | ---                          | ---                               |
| UI                | **Tailwind CSS + shadcn/ui** | Professional government dashboard |
| ---               | ---                          | ---                               |
| Maps              | **MapLibre GL / OpenLayers** | GIS visualization                 |
| ---               | ---                          | ---                               |
| Charts            | **Recharts**                 | Administrative dashboards         |
| ---               | ---                          | ---                               |
| State Management  | **Zustand**                  | Lightweight application state     |
| ---               | ---                          | ---                               |
| API Communication | **REST + Axios/fetch**       | Backend communication             |
| ---               | ---                          | ---                               |

### **Why?**

The frontend needs to handle:

- Document review
- Tables
- Evidence visualization
- Dashboards
- GIS
- Officer workflows

React/Next.js is more than sufficient.

# **3\. Backend**

## **Recommended**

**Python + FastAPI**

Why Python?

Because the intelligence layer requires:

- OCR
- Computer Vision
- NLP
- ML models
- RAG
- Data processing

Python provides a much stronger ecosystem for these tasks than forcing everything into Node.js.

###

###

###

###

###

###

###

###

###

###

###

###

###

###

###

###

###

###

### **Backend responsibilities**

                Authentication
                     ↓
                Authorization
                     ↓
                 DOCUMENTS
                     ↓
              OCR / ICR
                     ↓
              FIELD EXTRACTION
                     ↓
             EVIDENCE LINKING
                     ↓
             NORMALIZATION
                     ↓
          ┌─────────────────────┐
          │ VALIDATION ENGINE   │
          │                     │
          │ Completeness        │
          │ Identity            │
          │ Parcel              │
          │ Transaction         │
          │ Historical          │
          │ Spatial             │
          └──────────┬──────────┘
                     ↓
          MULTI-SOURCE RECONCILIATION
                     ↓
              CONFLICT ENGINE
                     ↓
          ┌──────────────────────┐
          │ RECORD HEALTH        │
          │ +                    │
          │ RISK ENGINE          │
          └──────────┬───────────┘
                     ↓
          PARCEL INTELLIGENCE
              WORKSPACE
                     ↓
             OFFICER REVIEW
                     ↓
              DECISION
                     ↓
             AUDIT TRAIL

## **Parcel Intelligence Workspace**

It should be something like:
Parcel Intelligence Workspace
        ↓
Property Summary
        ↓
Record Health
        ↓
Validation Checks
        ↓
Source-to-Source Comparison
        ↓
Detected Conflicts
        ↓
Risk Assessment
        ↓
Ownership Timeline
        ↓
GIS Evidence
        ↓
Officer Decision

This is important because **this is where your innovation becomes visible to the evaluator.**

# **4\. AI / OCR Layer**

The AI layer should be **model-agnostic**.

### **Components**

| **Function**            | **Recommended Technology**          |
| ----------------------- | ----------------------------------- |
| OCR                     | PaddleOCR / Tesseract               |
| ---                     | ---                                 |
| Handwriting             | TrOCR or suitable handwriting model |
| ---                     | ---                                 |
| Image Processing        | OpenCV                              |
| ---                     | ---                                 |
| NLP                     | Hugging Face Transformers           |
| ---                     | ---                                 |
| Entity Extraction       | Transformer/LLM + rules             |
| ---                     | ---                                 |
| Document Classification | ML/Transformer model                |
| ---                     | ---                                 |
| Embeddings              | Sentence Transformers               |
| ---                     | ---                                 |
| RAG                     | LlamaIndex or LangChain             |
| ---                     | ---                                 |
| Vector Search           | pgvector                            |
| ---                     | ---                                 |

### **Important architecture principle**

Do not make the entire system dependent on one LLM.

For example:

OCR

↓

Structured Extraction

↓

Rules + ML

↓

Validation

↓

LLM only where useful

The system should use deterministic rules for deterministic problems.

# **5\. Document Processing Pipeline**

A document should move through a controlled processing pipeline.

Upload

↓

File Validation

↓

Virus/Security Check

↓

Image Preprocessing

↓

Document Classification

↓

OCR / ICR

↓

Text + Layout Extraction

↓

Field Extraction

↓

Normalization

↓

Confidence Scoring

↓

Evidence Linking

↓

Validation

### **Example**

A scanned document contains:

Khasra No. 124/2  
Area: 2.5 hectares  
Owner: Ramesh Kumar

The system stores:

Field: Khasra Number

Value: 124/2

Confidence: 95%

Page: 4

Bounding Box: \[x1,y1,x2,y2\]

Document ID: DOC-001

# **6\. Database Architecture**

## **Primary Database: PostgreSQL**

PostgreSQL should be the **system of record** for structured application data.

It stores:

- Users
- Roles
- Properties
- Parcels
- Owners
- Transactions
- Mutations
- Extracted fields
- Conflicts
- Risk scores
- Verification decisions
- Audit metadata

### **Why PostgreSQL?**

Because the system contains highly structured and relational information.

Example:

Property

│

├── Owners

├── Documents

├── Transactions

├── Mutations

└── Verification Records

PostgreSQL handles this naturally.

# **7\. Document Storage**

Do **not** store large PDFs/images directly inside PostgreSQL.

Use object storage.

### **Recommended**

- S3-compatible object storage
- MinIO for self-hosted deployment
- AWS S3 / Azure Blob / government-approved equivalent for production

### **Storage structure**

documents/

└── district/

└── village/

└── property/

├── original/

├── processed/

└── thumbnails/

### **Original documents must be immutable.**

The system should preserve the original evidence even after corrections.

# **8\. Evidence Storage**

Every extracted field should maintain evidence metadata.

Extraction

│

├── Field

├── Value

├── Confidence

├── Document ID

├── Page Number

├── Bounding Box

└── Model Version

This allows the officer to move from:

**"Owner = Ramesh Kumar"**

to:

**Document → Page 4 → Exact source region**

# **9\. Evidence Graph**

For the MVP, you have two practical choices.

### **Option A — PostgreSQL relationships**

Start with PostgreSQL relationships.

### **Option B — Neo4j**

Use Neo4j when graph-based investigation becomes a major feature.

For your project, I recommend:

**PostgreSQL as the primary database + Neo4j for the Evidence Graph.**

But don't make Neo4j mandatory for every operation.

### **Graph**
             ┌──────────┐
             │  Owner   │
             └────┬─────┘
                  │ owns
                  ▼
             ┌──────────┐
             │ Property │
             └────┬─────┘
        ┌─────────┼─────────┐
        ▼         ▼         ▼
    Document   Mutation  Transaction
        │
        ▼
     Evidence
This makes investigation easier.

# **10\. GIS Architecture**

For spatial information:

### **Recommended**

**PostGIS**

PostGIS extends PostgreSQL with geographic/spatial capabilities.

It can store:

- Parcel boundaries
- Coordinates
- Geometry
- Spatial relationships
- Area calculations

### **Example**

Extracted Khasra No.

-

GIS Parcel ID

-

GIS Area

↓

Spatial Consistency Check

Example result:

Text Record Area = 2.5 ha  
GIS Area = 2.2 ha  
⚠️ Area discrepancy detected

# **11\. Validation Engine**

The validation engine is one of the most important components.

It should combine:

### **Rule-based validation**

Area < 0

↓

INVALID

### **Cross-source validation**

RoR Owner ≠ Registration Owner

↓

CONFLICT

### **Temporal validation**

Mutation Date

↓

Transaction Date

↓

Check sequence

### **Spatial validation**

Textual Parcel

↕

GIS Parcel

↓

Compare

### **Validation Check Center**

├── Document Quality

├── Record Completeness

├── Owner Consistency

├── Khasra Consistency

├── Khata Consistency

├── Area Consistency

├── Mutation Continuity

├── Registration Consistency

├── Historical Continuity

├── Text-GIS Consistency

├── Duplicate Detection

└── Dispute Status

# **12\. Risk Engine**

The risk engine converts multiple signals into a priority.

Example:
Low OCR Confidence       +10
Owner Conflict           +30
Area Conflict            +20
GIS Conflict             +20
Historical Conflict      +15
Pending Dispute          +25
                         ───
                         120
Then:

0–20 → LOW

21–50 → MEDIUM

51–80 → HIGH

81+ → CRITICAL

**These numbers are examples.** The actual scoring weights should be configurable and validated experimentally.

The system should show **why** the score was generated.

### **Record Health Score**

**Record Health ≠ Risk**.

For example:

Record Health = 72/100  
Risk = HIGH

means the record has several quality/consistency problems and therefore needs investigation.

We should add this distinction:

Validation Results

↓

Record Health Assessment

↓

Risk Assessment

↓

Officer Priority

# **13\. RAG Architecture**

RAG should be used as an **evidence assistant**, not as the validation engine.

### **Flow**
Officer Question
       ↓
Authorization Check
       ↓
Retrieve Relevant Evidence
       ↓
Documents / Fields / Conflicts / Timeline
       ↓
Vector + Metadata Search
       ↓
LLM
       ↓
Grounded Answer
       ↓
Source References
Example:

**Officer:** Why is this property high risk?

System:

The property is high risk because the RoR lists Ramesh Kumar as owner while the registration record identifies Suresh Kumar as the buyer. The mutation record has not been updated.

Then:

**Sources:** RoR Page 4, Registration Page 2, Mutation Page 1.

# **14\. API Architecture**

Use REST APIs for the MVP.

### **Main API groups**

/api/auth

/api/users

/api/documents

/api/processing

/api/properties

/api/extractions

/api/validation

/api/conflicts

/api/risk

/api/evidence

/api/verification

/api/audit

/api/dashboard

/api/integrations

/api/rag

# **15\. External Integration Architecture**

The system should use an **adapter-based integration layer**.
                 Our System
                     │
              Integration Layer
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
      LRMS          GIS       Registration
       │             │             │
    Adapter       Adapter        Adapter

This prevents external system changes from breaking the core application.

### **Important**

For your prototype, use:

**Mock APIs / sample datasets**

where real government APIs are unavailable.

Don't pretend that your prototype has live government access if it doesn't.

# **16\. Authentication**

### **Recommended**

**OAuth 2.0 / OpenID Connect**

For MVP:

- Keycloak can provide self-hosted identity management.
- JWT access tokens can be used between frontend and backend.

### **Flow**
User
 ↓
Login
 ↓
Identity Provider
 ↓
Access Token
 ↓
Backend
 ↓
Role + Permission Check
 ↓
Resource

# **17\. Authorization**

Use **RBAC — Role-Based Access Control**.

Example:
Revenue Officer
      ↓
District A
      ↓
Can access
District A records

While:
District B Officer
      ↓
District A record
      ↓
ACCESS DENIED

Authorization must be enforced by the backend, not just hidden in the frontend.

# **18\. Security Architecture**

### **Security layers**
HTTPS
  ↓
Authentication
  ↓
Authorization
  ↓
API Validation
  ↓
Application Security
  ↓
Database Security
  ↓
Encrypted Storage
  ↓
Audit Trail
### **Security controls**

- TLS/HTTPS
- RBAC
- Secure password hashing
- JWT/OIDC
- Encryption at rest
- Input validation
- API rate limiting
- Secure file handling
- Audit logging
- Secrets management
- Database access control

# **19\. Audit Architecture**

Every important action produces an audit event.
Officer
   ↓
Corrects Owner
   ↓
Audit Service
   ↓
Audit Record
   ↓
Hash
   ↓
Next Audit Record
The audit trail should be **tamper-evident**.

The hash chain allows the system to detect unauthorized alteration of historical audit events.

# **20\. Asynchronous Processing**

OCR and AI processing may take seconds or minutes.

Therefore, don't process everything inside the user's HTTP request.

Use:

### **Redis + Celery**

User Upload
     ↓
FastAPI
     ↓
Job Queue
     ↓
Redis
     ↓
Celery Worker
     ↓
OCR / AI
     ↓
Database
     ↓
Notification

The UI can display:

Processing...

████████░░ 80%

Estimated status:

OCR Complete

Extraction Running

# **21\. Frontend Data Flow**
Officer
   ↓
Web Dashboard
   ↓
Next.js
   ↓
FastAPI
   ↓
Authentication
   ↓
Business Logic
   ↓
Database / Storage / AI
   ↓
Result
   ↓
Dashboard
# **22\. Complete Data Flow**

This is the most important architecture flow for your presentation.
┌──────────────┐
│ Land Record  │
│ PDF / Image  │
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ Document Upload │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ OCR / ICR       │
│ + Preprocessing │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Field Extraction│
│ + Confidence    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Evidence Linking│
│ Page + BBox     │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Multi-Source        │
│ Reconciliation      │
└──────┬──────────────┘
       │
       ├──────────────┐
       ▼              ▼
┌─────────────┐  ┌──────────────┐
│ GIS Check   │  │ Historical / │
│             │  │ Transaction  │
└──────┬──────┘  └──────┬───────┘
       │                │
       └───────┬────────┘
               ▼
      ┌────────────────┐
      │ Conflict Engine│
      └───────┬────────┘
              ▼
      ┌────────────────┐
      │ Risk Engine    │
      └───────┬────────┘
              ▼
      ┌────────────────┐
      │ Officer Review │
      └───────┬────────┘
              │
       ┌──────┴───────┐
       ▼              ▼
    Approve         Correct
       │              │
       └──────┬───────┘
              ▼
      ┌────────────────┐
      │ Audit Trail    │
      └────────────────┘

# **23\. Deployment Architecture**

For the **MVP**, keep deployment simple.
                 Internet / Government Network
                           │
                           ▼
                    Reverse Proxy
                           │
                           ▼
                    Frontend Server
                           │
                           ▼
                    Backend Server
                     /           \
                    /             \
                   ▼               ▼
             PostgreSQL         Redis
                  │               │
                  │               ▼
                  │          AI Workers
                  │               │
                  ▼               ▼
              Object Storage    OCR/ML

### **Production evolution**

As workload increases:
Load Balancer
      │
 ┌────┼────┐
 ▼    ▼    ▼
API  API   API
 │    │     │
 └────┼─────┘
      ▼
Database Cluster

AI/OCR workers can scale separately.

# **24\. Recommended Deployment Technology**

### **MVP**

- Docker
- Docker Compose
- Nginx
- PostgreSQL
- Redis
- FastAPI
- Celery
- MinIO
- Next.js

### **Production**

Move toward:

- Kubernetes or managed container orchestration
- Managed PostgreSQL
- Object storage
- Centralized logging
- Monitoring
- Load balancing
- Auto-scaling workers

**Do not start with Kubernetes for the hackathon MVP unless your team already knows it well.** It adds operational complexity without improving your core demonstration.

# **25\. Monitoring**

Use:

### **Prometheus**

Collect:

- API latency
- Request count
- Error rate
- Worker status
- Processing duration
- Database performance

### **Grafana**
System Health
─────────────
API Status          ● Healthy
Database            ● Healthy
OCR Workers         ● Healthy

Documents Today     12,450
Processing          342
Failed              17
Pending Review      1,245
### **Logs**

Use structured application logs.

For a larger production deployment:

- OpenTelemetry
- Loki/ELK-compatible logging
- Centralized alerting

# **26\. Scalability Strategy**

The architecture should scale the **expensive parts independently**.

### **Example**

Suppose document uploads increase dramatically.

Instead of scaling the entire system:

100 Documents

↓

10 OCR Workers

increase only:

1000 Documents

↓

100 OCR Workers

while the main API remains stable.

### **Independent scaling**

| **Component**      | **Scaling**                      |
| ------------------ | -------------------------------- |
| Frontend           | Horizontal                       |
| ---                | ---                              |
| API                | Horizontal                       |
| ---                | ---                              |
| OCR Workers        | Horizontal                       |
| ---                | ---                              |
| Validation Workers | Horizontal                       |
| ---                | ---                              |
| RAG Service        | Horizontal                       |
| ---                | ---                              |
| Database           | Vertical → Read replicas/cluster |
| ---                | ---                              |
| Object Storage     | Elastic                          |
| ---                | ---                              |
| Redis              | Cluster when required            |
| ---                | ---                              |

# **27\. Resilience**

If OCR fails:
OCR Worker Failure
       ↓
Job remains in Queue
       ↓
Retry
       ↓
Another Worker
       ↓
Processing Continues

If GIS API is unavailable:
GIS unavailable
      ↓
Mark GIS validation unavailable
      ↓
Continue other validations
      ↓
Retry GIS later

One external dependency should not bring down the entire platform.

# **28\. Separation of Concerns**

The architecture intentionally separates:
Presentation
     ↓
API
     ↓
Business Logic
     ↓
AI Processing
     ↓
Validation
     ↓
Data
     ↓
Integration

This means:

Changing the OCR model should not require rewriting the dashboard.

Changing the GIS provider should not require rewriting the risk engine.

Changing the frontend should not affect document processing.

# **29\. Recommended Technology Stack — Final**

| **Layer**       | **Recommended Technology**                              |
| --------------- | ------------------------------------------------------- |
| Frontend        | **Next.js + React + TypeScript**                        |
| ---             | ---                                                     |
| UI              | **Tailwind CSS + shadcn/ui**                            |
| ---             | ---                                                     |
| Backend         | **Python + FastAPI**                                    |
| ---             | ---                                                     |
| AI/ML           | **PyTorch + Hugging Face**                              |
| ---             | ---                                                     |
| OCR             | **PaddleOCR + TrOCR**                                   |
| ---             | ---                                                     |
| Computer Vision | **OpenCV**                                              |
| ---             | ---                                                     |
| NLP             | **Transformers**                                        |
| ---             | ---                                                     |
| RAG             | **LlamaIndex/LangChain + pgvector**                     |
| ---             | ---                                                     |
| Primary DB      | **PostgreSQL**                                          |
| ---             | ---                                                     |
| Spatial DB      | **PostGIS**                                             |
| ---             | ---                                                     |
| Graph           | **Neo4j** _(optional/for evidence graph)_               |
| ---             | ---                                                     |
| Cache/Queue     | **Redis**                                               |
| ---             | ---                                                     |
| Background Jobs | **Celery**                                              |
| ---             | ---                                                     |
| File Storage    | **S3 / MinIO**                                          |
| ---             | ---                                                     |
| Authentication  | **Keycloak + OAuth2/OIDC**                              |
| ---             | ---                                                     |
| API             | **REST / JSON**                                         |
| ---             | ---                                                     |
| Containers      | **Docker**                                              |
| ---             | ---                                                     |
| Reverse Proxy   | **Nginx**                                               |
| ---             | ---                                                     |
| Monitoring      | **Prometheus + Grafana**                                |
| ---             | ---                                                     |
| Logging         | **Structured Logs / OpenTelemetry**                     |
| ---             | ---                                                     |
| Deployment MVP  | **Docker Compose**                                      |
| ---             | ---                                                     |
| Production      | **Kubernetes / Government-approved container platform** |
| ---             | ---                                                     |

# **30\. Why This Architecture Is Practical**

The architecture deliberately avoids unnecessary complexity.

### **We are NOT doing:**

❌ 20 microservices  
❌ Blockchain as the primary database  
❌ Kubernetes from day one  
❌ LLM for every operation  
❌ Separate database for every module  
❌ Real-time processing where asynchronous processing is better

### **We ARE doing:**

✅ Modular backend  
✅ PostgreSQL as system of record  
✅ Object storage for documents  
✅ Async OCR/AI workers  
✅ Evidence-linked extraction  
✅ Multi-source reconciliation  
✅ PostGIS for spatial validation  
✅ Neo4j where graph investigation adds value  
✅ RAG for evidence-grounded investigation  
✅ RBAC  
✅ Tamper-evident audit trail  
✅ API-first integration  
✅ Horizontal scaling path

# **31\. Architectural USP**

The strongest architectural point for your SIH presentation is not the technology stack.

It is this:

**The architecture creates an Evidence-to-Decision pipeline.**

DOCUMENT
   ↓
EXTRACTED DATA
   ↓
SOURCE EVIDENCE
   ↓
CROSS-SOURCE RECONCILIATION
   ↓
CONFLICT
   ↓
RISK
   ↓
OFFICER INVESTIGATION
   ↓
VERIFIED DECISION
   ↓
AUDIT TRAIL

This is what differentiates your system from a **simple OCR digitization platform**.

The architecture therefore supports your core proposition:

**"We don't just digitize land records; we make the digitized records traceable, cross-verifiable, explainable, and actionable for administrators."**