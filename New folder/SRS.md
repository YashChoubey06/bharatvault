# **Software Requirements Specification (SRS)**

## **Intelligent Land & Property Record Intelligence System**

**Version:** 1.0  
**Project Type:** AI-Assisted Government Land Record Intelligence Platform  
**Primary Users:** Revenue Officers, Verification Officers, Digitization Operators, Department Administrators  
**System Objective:** Digitize, validate, reconcile, explain, and prioritize land/property records while keeping authorized officers in control of final verification.

# **1\. Introduction**

## **1.1 Purpose**

This SRS defines the functional, non-functional, security, data, validation, and operational requirements for the **Intelligent Land & Property Record Intelligence System**.

The system will process historical land records such as scanned documents, handwritten registers, PDFs, registration records, mutation records, and cadastral/GIS information.

The system will:

**Extract → Validate → Reconcile → Detect Conflicts → Assess Risk → Assist Officer → Record Decision**

The system is intended to operate as an **intelligence and validation layer over existing government land-record systems**, not as a replacement for authoritative government databases.

## **1.2 Scope**

The system shall provide:

1. Secure document upload.
2. Document classification and preprocessing.
3. Printed and handwritten OCR/ICR.
4. Multilingual field extraction.
5. Field-level confidence scoring.
6. Evidence-linked extraction.
7. Multi-source record reconciliation.
8. Conflict detection.
9. Risk-based case prioritization.
10. Parcel/property timeline.
11. Parcel/property evidence graph.
12. Human-assisted verification.
13. Evidence-grounded RAG assistant.
14. Audit and provenance tracking.
15. Administrative dashboard.
16. API-based integration capability.

# **2\. System Actors**

| **Role**                         | **Description**                                          |
| -------------------------------- | -------------------------------------------------------- |
| **System Administrator**         | Manages users, roles, configuration and system health    |
| ---                              | ---                                                      |
| **Digitization Operator**        | Uploads and manages documents for processing             |
| ---                              | ---                                                      |
| **Verification Officer**         | Reviews AI extraction and resolves low-confidence fields |
| ---                              | ---                                                      |
| **Revenue/Land Officer**         | Investigates conflicts and approves/corrects records     |
| ---                              | ---                                                      |
| **Department Administrator**     | Monitors district/department-level processing and risk   |
| ---                              | ---                                                      |
| **Authorized Government System** | Exchanges data through approved APIs                     |
| ---                              | ---                                                      |
| **Citizen/Landowner**            | Future controlled consumer of permitted information      |
| ---                              | ---                                                      |

# **3\. Role-Based Permissions**

### **Permission Matrix**

| **Function**          | **System Admin** | **Digitization Operator** | **Verification Officer** | **Revenue Officer** | **Dept. Admin** |
| --------------------- | ---------------- | ------------------------- | ------------------------ | ------------------- | --------------- |
| Login                 | ✅               | ✅                        | ✅                       | ✅                  | ✅              |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| Upload Document       | ✅               | ✅                        | ✅                       | ✅                  | Optional        |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| View Documents        | ✅               | Own/Assigned              | Assigned                 | Authorized          | Authorized      |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| Run Processing        | ✅               | ✅                        | ✅                       | ✅                  | ❌              |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| View OCR Results      | ✅               | ✅                        | ✅                       | ✅                  | Summary         |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| Correct OCR Fields    | ✅               | ❌                        | ✅                       | ✅                  | ❌              |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| Approve Record        | ❌               | ❌                        | ✅                       | ✅                  | ❌              |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| Investigate Conflicts | ✅               | ❌                        | ✅                       | ✅                  | View            |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| View Evidence Graph   | ✅               | Assigned                  | ✅                       | ✅                  | View            |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| View Risk Queue       | ✅               | ❌                        | ✅                       | ✅                  | ✅              |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| Manage Users          | ✅               | ❌                        | ❌                       | ❌                  | ❌              |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| View Audit Trail      | ✅               | Limited                   | Assigned                 | Authorized          | Authorized      |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| System Configuration  | ✅               | ❌                        | ❌                       | ❌                  | ❌              |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |
| Dashboard             | Full             | Processing                | Assigned                 | Operational         | Department      |
| ---                   | ---              | ---                       | ---                      | ---                 | ---             |

# **4\. Functional Requirements**

## **FR-01 — User Authentication**

**Requirement:  
**The system shall authenticate every user before granting access to protected functionality.

### **Acceptance Criteria**

- Unauthenticated users shall not access protected pages.
- Invalid credentials shall result in authentication failure.
- Successful authentication shall create an authenticated session/token.
- The system shall record successful and failed login events.

# **5\. FR-02 — Role-Based Authorization**

The system shall enforce permissions according to the user's assigned role.

### **Acceptance Criteria**

- A user shall only access functionality permitted to their role.
- Unauthorized API requests shall return an authorization error.
- A digitization operator shall not be able to approve a final record.
- A normal user shall not be able to modify audit records.

# **6\. FR-03 — Document Upload**

The system shall allow authorized users to upload supported land-record documents.

### **Supported formats**

- PDF
- JPG/JPEG
- PNG
- TIFF

### **Requirements**

Each uploaded document shall receive:

- Unique document ID
- Original filename
- Upload timestamp
- Uploader ID
- Document type/status
- Processing status

### **Acceptance Criteria**

A valid document shall be stored and assigned a unique identifier.

Unsupported files shall be rejected before processing.

# **7\. FR-04 — Document Validation**

The system shall validate uploaded documents before processing.

### **Validation Rules**

The system shall check:

- File type
- File size
- File readability
- Corruption
- Empty documents
- Page count

### **Example**

Valid PDF

↓

Accepted

Corrupted PDF

↓

Rejected

↓

"Document could not be processed."

# **8\. FR-05 — Document Classification**

The system shall classify documents into supported categories where possible.

Examples:

- Record of Rights
- Mutation Record
- Registration/Sale Document
- Historical Record
- Cadastral/GIS-related document

If classification confidence is below the configured threshold:

**Document Type: Unknown — Manual Review Required**

# **9\. FR-06 — OCR/ICR Processing**

The system shall extract machine-readable text from scanned and handwritten documents.

### **Requirements**

- Printed text shall be processed using OCR.
- Handwritten content shall be processed using ICR/handwriting recognition where supported.
- The system shall preserve page-level association.
- Processing failures shall not destroy the original document.

# **10\. FR-07 — Multilingual Processing**

The system shall support configurable language models for supported Indian languages.

For the MVP, the supported languages shall be explicitly configured rather than claiming universal Indian-language support.

### **Acceptance Criteria**

For a supported language:

- The document shall be processed.
- Extracted text shall be associated with its page.
- Unsupported languages shall be identified and routed for manual processing.

# **11\. FR-08 — Land-Record Field Extraction**

The system shall extract supported land-record fields.

### **Core Fields**

| **Field**            | **Example**  |
| -------------------- | ------------ |
| Owner Name           | Ramesh Kumar |
| ---                  | ---          |
| Survey/Khasra No.    | 124/2        |
| ---                  | ---          |
| Khata No.            | K-458        |
| ---                  | ---          |
| Area                 | 2.5 ha       |
| ---                  | ---          |
| Village              | Rampur       |
| ---                  | ---          |
| Tehsil               | Kota         |
| ---                  | ---          |
| District             | Kota         |
| ---                  | ---          |
| Land Classification  | Agricultural |
| ---                  | ---          |
| Registration Details | REG-2021-45  |
| ---                  | ---          |
| Mutation Details     | MUT-2022-19  |
| ---                  | ---          |

The system shall allow fields to be missing when the source document does not contain them.

# **12\. FR-09 — Field-Level Confidence Scoring**

Each extracted field shall have a confidence score.

Example:

Owner Name 96%

Khasra Number 94%

Area 61% ⚠

Village 97%

### **Acceptance Criteria**

- Every successfully extracted field shall have a confidence score.
- Scores shall be normalized to a defined range, e.g. 0–100.
- Fields below the configured threshold shall be flagged for review.

# **13\. FR-10 — Evidence-Linked Extraction**

Every extracted field shall maintain a reference to its source.

### **Minimum evidence metadata**

Document ID

Page Number

Bounding Box / Region

Extracted Value

Confidence

Extraction Timestamp

### **Acceptance Criteria**

When the officer selects an extracted field:

The system shall display the corresponding document page and highlight the source region where technically possible.

This requirement is **critical** because the system must answer:

**"Where did this value come from?"**

### **FR-10A — Record Completeness**

The system shall identify expected and available evidence associated with a parcel/property and indicate missing or unavailable records.

Example:

RoR ✓

Mutation ✓

Registration ✓

GIS ✕

Historical RoR ⚠

# **14\. FR-11 — Data Normalization**

The system shall normalize extracted data before cross-source comparison.

Examples:

2.5 hectare

2.50 ha

2.5 Hectares

should be represented consistently for comparison.

Names, dates, units and identifiers shall be normalized without destroying the original source value.

### **Important rule**

The system shall retain:

**Original Value + Normalized Value**

rather than replacing the original evidence.

# **15\. FR-12 — Property/Parcel Matching**

The system shall identify records that potentially refer to the same parcel/property.

Matching may use:

- Survey/Khasra number
- Khata number
- Village
- Owner information
- Geographic information
- Other configured identifiers

### **Acceptance Criteria**

The system shall provide a match confidence or matching explanation where deterministic matching is not possible.

Low-confidence matches shall not automatically be treated as confirmed matches.

# **16\. FR-13 — Multi-Source Validation**

The system shall compare information across authorized sources.

### **Sources**

RoR

-

Registration

-

Mutation

-

GIS/Cadastral

-

Historical Records

### **Example**

RoR:

Owner = Ramesh

Registration:

Buyer = Suresh

Mutation:

Owner = Ramesh

The system shall generate:

**Ownership information conflict detected.**

It shall identify the source of each conflicting value.

### **FR-13A — Validation Check Framework**

The system shall execute configurable validation checks for document quality, record completeness, owner consistency, parcel identifiers, area consistency, transaction continuity, historical continuity, duplicate records, dispute status and spatial consistency.

### **FR-13B — Validation Result Classification**

The system shall classify validation results as Verified, Informational, Review Required, High Risk or Critical based on configurable rules.

### **FR-13C — Explainable Validation**

The system shall provide the underlying values, sources and rules responsible for each validation result.

### **FR-13D — Source-to-Source Comparison**

The system shall compare corresponding fields across authorized records and identify discrepancies between source values.

# **17\. FR-14 — Conflict Detection**

The system shall detect configured conflict types.

### **Initial conflict types**

1. Owner mismatch
2. Area mismatch
3. Khasra/survey mismatch
4. Mutation inconsistency
5. Registration inconsistency
6. Duplicate property/parcel candidate
7. Missing expected transaction/mutation relationship
8. Historical ownership discontinuity
9. Text-GIS inconsistency

# **18\. FR-15 — Explainable Conflict Detection**

For every detected conflict, the system shall provide an explanation.

### **Required structure**

CONFLICT:

Area mismatch

Source A:

RoR → 2.5 hectares

Source B:

GIS → 2.2 hectares

Difference:

0.3 hectares

Status:

Requires Investigation

### **Acceptance Criteria**

An officer shall be able to determine:

- What conflicts?
- Which sources conflict?
- What are the values?
- Why was the case flagged?

without inspecting raw system logs.

# **19\. FR-16 — Text-GIS Consistency Check**

Where GIS/cadastral information is available, the system shall compare relevant textual property information with spatial information.

Examples:

- Parcel identifier mismatch
- Area discrepancy
- Missing corresponding parcel
- Boundary/property relationship inconsistency

The system shall flag inconsistencies but **shall not automatically change cadastral boundaries**.

# **20\. FR-17 — Risk Scoring**

The system shall calculate a configurable risk score based on detected conditions.

Possible factors:

OCR uncertainty

-

Owner conflict

-

Area mismatch

-

Mutation inconsistency

-

GIS inconsistency

-

Historical inconsistency

### **Output**

LOW

MEDIUM

HIGH

CRITICAL

### **Acceptance Criteria**

- Every validated case shall have a risk status.
- Risk factors shall be visible.
- Changing a risk factor shall recalculate the risk according to configured rules.

### **FR-17A — Record Health Assessment**

The system shall calculate a configurable record-health indicator based on factors such as document quality, completeness, cross-source consistency, historical continuity and spatial consistency.

Keep this separate from **risk scoring**.

# **21\. FR-18 — Risk-Based Case Queue**

The system shall present cases in priority order.

Example:

CRITICAL 12

HIGH 48

MEDIUM 126

LOW 1,420

Officers shall be able to filter by:

- Risk
- District
- Village
- Conflict type
- Status
- Assigned officer
- Date

# **22\. FR-19 — Human Verification**

Authorized officers shall be able to:

- Review extracted fields
- Inspect evidence
- Approve fields
- Correct fields
- Reject extraction
- Add remarks

### **Acceptance Criteria**

A corrected field shall not overwrite the original AI result without preserving the previous value.

# **23\. FR-20 — Approval Workflow**

The workflow shall support:

AI Processed

↓

Pending Review

↓

Officer Reviewed

↓

Approved

or:

Pending Review

↓

Correction Required

↓

Corrected

↓

Approved

# **24\. FR-21 — Property/Parcel Timeline**

The system shall display available historical events chronologically.

Example:

1995 → Original Record

2005 → Mutation

2014 → Sale Registration

2015 → Mutation Update

2024 → Current Record

Each event shall link to its source where available.

# **25\. FR-22 — Evidence Graph**

The system shall represent relationships between:

Property

Owner

Document

Transaction

Mutation

GIS Parcel

Dispute/Case

### **Acceptance Criteria**

Selecting a property shall show its related entities and their relationships.

# **26\. FR-23 — RAG Evidence Assistant**

The system shall provide an optional evidence-grounded assistant for authorized officers.

The Evidence Assistant shall answer questions only using authorized evidence associated with the selected parcel/property and shall provide source references for factual claims.

| **ID**      | **Requirement**                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| **FR-23**   | The system shall provide an Evidence Assistant using Retrieval-Augmented Generation (RAG).                          |
| ---         | ---                                                                                                                 |
| **FR-23.1** | The assistant shall retrieve information only from authorized records associated with the selected parcel/property. |
| ---         | ---                                                                                                                 |
| **FR-23.2** | The assistant shall provide source references for factual claims.                                                   |
| ---         | ---                                                                                                                 |
| **FR-23.3** | The assistant shall not provide legal ownership determinations or replace the authorized officer's decision.        |
| ---         | ---                                                                                                                 |
| **FR-23.4** | If sufficient evidence is unavailable, the assistant shall clearly state that no supporting evidence was found.     |
| ---         | ---                                                                                                                 |
| **FR-23.5** | Access to evidence shall respect the user's role and permissions.                                                   |
| ---         | ---                                                                                                                 |

Example:

"Why is this property high risk?"

The assistant shall retrieve relevant evidence before generating an answer.

**Important:** Don't put RAG inside the core validation engine. Your architecture should be:

**Documents → OCR → Extraction → Evidence → Validation/Reconciliation → Conflict/Risk**

and separately:

**Officer Question → RAG → Authorized Evidence → Answer + Sources**

### **Mandatory Requirements**

- Answers shall be based on authorized system evidence.
- Relevant source documents shall be displayed.
- The assistant shall distinguish evidence from inference.
- The assistant shall not make a legal ownership determination.

### **Example**

"The property is flagged because the RoR lists Ramesh as owner while the registration record identifies Suresh as buyer. The mutation record still lists Ramesh."

**Sources:** RoR Page 4, Registration Page 2, Mutation Page 1.

# **27\. FR-24 — Audit Trail**

The system shall record significant actions.

### **Audit event**

User

Action

Timestamp

Record ID

Field

Previous Value

New Value

Reason/Remark

Evidence Reference

Example:

Officer: O-102

Field: Owner Name

Old: Ramesh Kumar

New: Ramesh Kumar Singh

Evidence: RoR Page 4

Time: 14:32

# **28\. FR-25 — Tamper-Evident Audit Trail**

Audit events shall be protected against undetected modification.

For the prototype, a hash-chain mechanism may be used:

Record 1 Hash

↓

Record 2 Hash

↓

Record 3 Hash

↓

Record 4 Hash

Any unauthorized modification to an earlier record should cause the integrity verification to fail.

### **Important**

The system shall describe this as **tamper-evident**, not absolutely "tamper-proof."

# **29\. FR-26 — Dashboard**

The dashboard shall display:

- Documents processed
- Documents pending
- Verification queue
- Conflicts detected
- Risk distribution
- Verification progress
- Processing errors

The dashboard shall allow filtering by authorized administrative scope.

# **30\. FR-27 — API Integration**

The system shall provide authenticated APIs for integration with authorized systems.

Potential integrations:

- LRMS
- DILRMP-related systems
- Registration systems
- GIS/cadastral systems
- Other authorized government databases

### **Requirements**

- Authentication
- Request validation
- Authorization
- Rate limiting
- Logging
- Error responses
- API versioning

# **31\. FR-28 — Data Import/Export**

Authorized administrators shall be able to import structured datasets for prototype/operational processing.

Supported formats may include:

- CSV
- JSON
- API responses

Exports shall respect the user's authorization scope.

### **FR-29 — Parcel Monitoring**

The system shall support monitoring of selected parcels/properties for configured changes in ownership, mutation, registration, dispute or other authorized data sources.

# **32\. Business Rules**

## **BR-01 — AI Is Not the Legal Authority**

The system shall never automatically declare legal ownership solely based on AI output.

**AI = Decision Support  **
** Authorized Officer = Final Administrative Verification **

## **BR-02 — Evidence Must Be Preserved**

The original document shall never be replaced by extracted text.

## **BR-03 — Original and Corrected Values**

When an officer changes a value:

Original AI Value

-

Officer Corrected Value

-

Evidence

-

Officer

-

Timestamp

shall be retained.

## **BR-04 — Low Confidence Requires Review**

If:

Confidence < Configured Threshold

the field shall be marked:

**Needs Review**

## **BR-05 — Conflict Does Not Mean Fraud**

A detected discrepancy shall be classified as:

**Inconsistency / Investigation Required**

rather than automatically being labeled fraud.

## **BR-06 — High-Risk Cases Require Human Investigation**

High/Critical risk records shall enter the officer investigation queue.

## **BR-07 — No Automatic Destructive Updates**

The system shall not automatically overwrite authoritative government records.

## **BR-08 — Source Priority Must Be Configurable**

Where source precedence is legally or administratively defined, it shall be configurable by authorized administrators.

The system shall not hard-code assumptions such as:

"GIS is always correct."

# **33\. Data Requirements**

## **33.1 Document Entity**

Document ID

Document Type

File Location

File Hash

Language

Page Count

Upload User

Upload Timestamp

Processing Status

## **33.2 Property/Parcel Entity**

Property ID

Parcel/Khasra Number

Khata Number

Village

Tehsil

District

Area

Land Classification

GIS Reference

## **33.3 Owner Entity**

Owner ID

Name

Relationship/Ownership Type

Associated Property

Source Document

Validity Period

## **33.4 Transaction Entity**

Transaction ID

Property ID

Transaction Type

Date

Buyer

Seller

Registration Reference

Source Document

## **33.5 Mutation Entity**

Mutation ID

Property ID

Mutation Type

Date

Previous Owner

New Owner

Status

Source Document

## **33.6 Extraction Entity**

Extraction ID

Document ID

Field Name

Original Value

Normalized Value

Confidence Score

Page

Bounding Box

Model/Processor

Timestamp

## **33.7 Conflict Entity**

Conflict ID

Property ID

Conflict Type

Source A

Value A

Source B

Value B

Severity

Explanation

Status

## **33.8 Verification Entity**

Verification ID

Property ID

Officer ID

Action

Previous Value

New Value

Remark

Evidence

Timestamp

# **34\. Data Validation Requirements**

## **DV-01 — Mandatory Identifiers**

A property record shall contain at least one valid identifying attribute before reconciliation is attempted.

Possible identifiers:

- Khasra/survey number
- Khata number
- Authoritative property ID

## **DV-02 — Area Validation**

Area values shall:

- Contain a valid numeric component.
- Have a recognized unit.
- Be normalized to a standard unit for comparison.

## **DV-03 — Date Validation**

Dates shall be validated for:

- Correct format
- Valid calendar date
- Logical sequence where applicable

Example:

Mutation date cannot be treated as occurring before the transaction it references without generating an inconsistency warning.

## **DV-04 — Duplicate Detection**

Potential duplicate records shall be flagged when configured identifying fields strongly match.

The system shall not automatically delete duplicates.

# **35\. Authentication Requirements**

The system shall support secure authentication.

### **MVP**

- Username/password or approved institutional authentication
- Secure password storage
- Session/token management
- Logout
- Account lockout/rate limiting after repeated failures

### **Future**

- Government SSO
- Multi-factor authentication
- Enterprise identity provider integration

# **36\. Authorization Requirements**

Authorization shall be enforced at:

1. UI level
2. API level
3. Data level

Example:

A district officer should not automatically see records outside their authorized district.

The backend shall enforce this even if a user attempts to bypass the UI.

# **37\. Security Requirements**

## **SEC-01 — Encryption**

Sensitive data shall be encrypted:

- During transmission using secure protocols.
- At rest where supported by the infrastructure.

## **SEC-02 — Password Security**

Passwords shall never be stored as plaintext.

## **SEC-03 — API Security**

APIs shall implement:

- Authentication
- Authorization
- Input validation
- Rate limiting
- Request logging

## **SEC-04 — File Security**

Uploaded files shall be validated and safely stored.

The system shall prevent unauthorized execution of uploaded content.

## **SEC-05 — Audit Protection**

Normal users shall not be able to edit or delete historical audit events.

## **SEC-06 — Data Isolation**

Users shall only access records within their assigned authorization scope.

## **SEC-07 — AI Security**

The RAG assistant shall not expose documents that the requesting user is not authorized to access.

# **38\. Error Handling Requirements**

The system shall provide meaningful errors instead of technical stack traces.

### **Example**

**Bad:**

NullPointerException at line 438

**Good:**

**Unable to process document. The uploaded PDF appears to be corrupted. Please upload a valid copy.**

## **Error Categories**

| **Error**             | **System Response**                                |
| --------------------- | -------------------------------------------------- |
| Invalid file          | Reject + explanation                               |
| ---                   | ---                                                |
| Corrupted file        | Reject + retry option                              |
| ---                   | ---                                                |
| OCR failure           | Mark processing failed + preserve original         |
| ---                   | ---                                                |
| Unsupported language  | Mark manual processing required                    |
| ---                   | ---                                                |
| API unavailable       | Retry + show integration status                    |
| ---                   | ---                                                |
| Database unavailable  | Fail safely + alert system                         |
| ---                   | ---                                                |
| Unauthorized request  | Return access denied                               |
| ---                   | ---                                                |
| RAG retrieval failure | Show "Evidence could not be retrieved"             |
| ---                   | ---                                                |
| GIS unavailable       | Continue non-GIS validation + mark GIS unavailable |
| ---                   | ---                                                |

# **39\. Edge Cases**

## **EC-01 — Unreadable Document**

If OCR cannot reliably read a document:

Status = **Manual Review Required**

The system shall not generate fabricated values.

## **EC-02 — Missing Owner Name**

The owner field shall remain:

**Not Available**

rather than generating an inferred name.

## **EC-03 — Multiple Owners**

The system shall support multiple owners where the source record indicates joint ownership.

## **EC-04 — Same Name, Different Person**

The system shall not assume:

"Same name = Same person."

Additional identifiers or evidence shall be required for reliable matching.

## **EC-05 — Conflicting Records**

The system shall display all relevant conflicting values rather than silently choosing one.

## **EC-06 — Missing GIS Data**

The system shall continue non-spatial validation and mark:

**GIS validation unavailable**

rather than failing the entire case.

## **EC-07 — Duplicate Upload**

If the same document is uploaded twice, the system should detect the duplicate using document metadata/hash where appropriate and notify the user.

## **EC-08 — Partial Processing Failure**

If page 3 of a 10-page document fails:

- Successfully processed pages shall be retained.
- Failed page shall be flagged.
- Overall document status shall indicate partial failure.

## **EC-09 — Conflicting Units**

Example:

Source A = 2.5 hectares

Source B = 6.177 acres

The system shall normalize units before determining whether an actual discrepancy exists.

## **EC-10 — RAG Cannot Find Evidence**

The assistant shall respond that sufficient evidence could not be found rather than inventing an answer.

# **40\. Performance Requirements**

## **PR-01 — User Interface**

For normal dashboard operations, the system should return responses within approximately:

**≤ 2 seconds for 95% of normal requests**

excluding heavy document-processing operations.

## **PR-02 — Document Processing**

Document processing shall be asynchronous.

The user shall not be required to keep the browser request open while OCR/AI processing occurs.

## **PR-03 — Concurrent Users**

The MVP shall support a defined test load, for example:

**At least 50 concurrent authenticated users**

without system failure.

The production target shall be determined from actual departmental workload.

## **PR-04 — Scalability**

The architecture shall allow independent scaling of:

- API services
- OCR workers
- Validation workers
- RAG services

# **41\. Reliability Requirements**

The system shall:

- Retry temporary processing failures.
- Preserve original documents.
- Maintain database backups.
- Prevent one failed document from stopping other processing jobs.
- Maintain processing status for every job.

### **Target**

The production architecture should aim for:

**99.5%+ service availability**

subject to infrastructure and government hosting requirements.

# **42\. Availability & Recovery**

The production architecture should support:

Application Failure

↓

Automatic Recovery

↓

Processing Continues

Backups shall be performed according to an approved government data-retention policy.

Recovery objectives such as **RPO/RTO** shall be finalized during deployment planning based on departmental requirements.

# **43\. Audit & Compliance Requirements**

The system shall record:

- Login activity
- Document upload
- Processing
- Extraction
- Corrections
- Approvals
- Conflict resolution
- API access
- Administrative changes

Audit records shall contain:

**Who + What + When + Which Record + Evidence**

# **44\. AI-Specific Requirements**

The AI system shall:

1. Provide confidence scores.
2. Preserve source evidence.
3. Avoid fabricating missing fields.
4. Identify uncertainty.
5. Support human correction.
6. Record model/version information where applicable.
7. Provide evidence for RAG answers.
8. Avoid making legal ownership decisions.
9. Allow model improvement using approved correction data.

# **45\. Explainability Requirements**

For every important AI-generated result, the system should provide:

RESULT

↓

REASON

↓

SOURCE

↓

EVIDENCE

Example:

**HIGH RISK**

**Reason:** Owner mismatch across RoR and registration records.

**RoR:** Ramesh Kumar — Page 4

**Registration:** Suresh Kumar — Page 2

**Action:** Officer investigation required.

# **46\. Non-Functional Requirements Summary**

| **Category**     | **Requirement**                       |
| ---------------- | ------------------------------------- |
| Security         | Authentication + RBAC + encryption    |
| ---              | ---                                   |
| Reliability      | Fault isolation + retry + backup      |
| ---              | ---                                   |
| Scalability      | Independent horizontal scaling        |
| ---              | ---                                   |
| Performance      | Normal UI requests ≤2 sec target      |
| ---              | ---                                   |
| Auditability     | Complete traceable activity history   |
| ---              | ---                                   |
| Explainability   | Evidence-backed AI outputs            |
| ---              | ---                                   |
| Maintainability  | Modular architecture                  |
| ---              | ---                                   |
| Availability     | 99.5%+ production target              |
| ---              | ---                                   |
| Data Integrity   | Original evidence preserved           |
| ---              | ---                                   |
| Privacy          | Access restricted by role/scope       |
| ---              | ---                                   |
| Interoperability | API-based integration                 |
| ---              | ---                                   |
| Usability        | Officer-focused verification workflow |
| ---              | ---                                   |

# **47\. End-to-End Acceptance Criteria**

The system shall be accepted as an MVP when the following complete scenario succeeds:

### **Test Scenario: Conflicting Land Record**

**Input:**

A scanned historical land record containing:

Owner: Ramesh

Khasra: 124/2

Area: 2.5 ha

is uploaded.

### **Expected behavior**

**1\. Upload**

The document is stored and assigned a unique ID.

**2\. OCR**

The system extracts the available fields.

**3\. Confidence**

Each field receives a confidence score.

**4\. Evidence**

The officer can select:

Owner = Ramesh

and view the exact source page/region.

**5\. Reconciliation**

The system retrieves corresponding sample records:

RoR → Ramesh

Registration → Suresh

Mutation → Ramesh

GIS → 2.2 ha

**6\. Conflict detection**

The system identifies:

Ownership Conflict

Area Conflict

**7\. Risk**

The property is assigned an appropriate risk level based on configured rules.

**8\. Investigation**

The officer sees:

- Conflicting values
- Source documents
- Property timeline
- Evidence graph
- Risk factors

**9\. RAG**

The officer asks:

"Why is this property high risk?"

The system provides an evidence-grounded answer with source references.

**10\. Correction**

The officer corrects an extracted field.

**11\. Audit**

The system records:

Original Value

Corrected Value

Officer

Timestamp

Evidence

**12\. Final status**

The property moves to:

**Verified / Corrected / Investigation Required**

depending on the officer's decision.

# **48\. MVP Requirement Boundary**

To keep the implementation realistic, the following are **not mandatory for MVP acceptance**:

- Nationwide government deployment
- All Indian languages
- Live integration with every state database
- Automatic legal ownership determination
- Automatic court-case resolution
- Automatic cadastral boundary modification
- Nationwide citizen portal
- Loan approval
- Property taxation
- Fully autonomous AI decision-making

# **49\. Final SRS Requirement**

The system's central requirement can be summarized as:

**The system shall transform fragmented land/property records into structured, evidence-linked information; compare authorized sources to identify and explain inconsistencies; prioritize cases based on configurable risk; and provide authorized officers with evidence-assisted tools to verify and correct records while maintaining a complete, tamper-evident audit trail.**

### **Core system principle**

**Don't just digitize the record.**

**Prove where the information came from → compare it with other evidence → identify what doesn't match → explain why → prioritize it → let the authorized officer decide → preserve the complete history.**