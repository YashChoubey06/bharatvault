# Bharat Vault — local MVP
## What is now functional
The existing Next.js screens use a FastAPI backend, a persistent SQLite database and local file storage. Uploads are processed by a single durable OCR worker using Tesseract with English/Hindi models. No cloud OCR or cloud LLM receives documents.

- Password authentication with hashed passwords, expiring HttpOnly sessions, server-side role/district checks, login throttling and same-origin mutation checks.
- Upload PDF/PNG/JPEG/TIFF, up to 20 MB, 20 pages and 25 megapixels per page. File content is validated; encrypted PDFs are rejected.
- Original files are written once and SHA-256 hashed. Page previews and OCR coordinates share the same pixel frame. Every extraction includes source, page, region, engine confidence and timestamp.
- Label-based English/Hindi field extraction and normalization. Low-confidence, unknown units and missing evidence remain in review.
- Manual mapping of an existing OCR line to a supported field, preserving that line and its location.
- Officer corrections, notes, verification/flags and version conflicts. Original OCR values and earlier revisions are preserved.
- Cross-source owner, survey, khata and area checks; available mutation dates/status and textual GIS-area comparisons. Missing sources are explicitly reported, never fabricated.
- A persisted risk queue, officer decisions, database-backed dashboard/reports, hash-linked append-only audit and local JSON evidence exports.
- Bounded local evidence retrieval with source links. This is not a general-purpose LLM and does not infer missing facts.
- Existing Records, Evidence Viewer, Validation, Timeline, Graph and GIS navigation remains. Views show only available source data.

## Run on this configured computer
Open PowerShell in the repository folder:
`work/BharatVault-git`

```powershell
./start-local.ps1
```

Open http://localhost:3003. Both servers bind to loopback only. Logs are under `backend/data/runtime`.
To stop without deleting documents:
```powershell
./stop-local.ps1
```

For frontend development use `./start-local.ps1 -Dev`. Stop before building; dev and production share `.next`.
After code changes, stop, rebuild, and start:
```powershell
./stop-local.ps1
node node_modules/next/dist/bin/next build --turbopack
./start-local.ps1
```

## Local accounts
The initial password is the value of `BHARAT_BOOTSTRAP_PASSWORD` in the ignored `backend/.env`. It is applied only when the database is first created.

- `officer@bharatvault.gov`: upload, map, review and decide assigned cases.
- `operator@bharatvault.gov`: upload and inspect; cannot verify or approve.
- `admin@bharatvault.gov`: cross-district inspection and upload; cannot approve.

These are local development accounts, not government identities. Replace their shared bootstrap password before adding sensitive records:
```powershell
./backend/.venv/Scripts/python.exe -m backend.manage officer@bharatvault.gov
```
Repeat for the other accounts. The command prompts privately and revokes that account's existing sessions. Editing `.env` alone does not reset an existing account.

## Try the complete workflow
Synthetic PNG scans are in `backend/data/samples`. Generate them again with:
```powershell
./backend/.venv/Scripts/python.exe -m backend.samples
```

1. Upload `sample-ror-english.png` to PRC-001 with English OCR.
2. Wait for completed processing; inspect raw OCR text and open Evidence Viewer.
3. Select a field or its box; compare it with the real scan. Add notes, correct if needed, and verify.
4. Upload `sample-sale-conflict.png` to PRC-001. The 2.50 vs 2.20 hectare source difference creates a real validation conflict.
5. Upload `sample-ror-hindi.png` to PRC-003 with English + Hindi recognition.
6. Review all its fields, then decide CASE-PRC-003 in Verification. Approval is blocked while fields, processing, or material validation checks are unresolved.
7. Reload/restart and confirm reviews, decisions and audit persist.
8. Export the parcel's evidence bundle from its overview.

The scans and initial four parcels are explicitly synthetic. One English source and one field review may already be present from the browser acceptance test. Duplicate original uploads to a parcel return a clear conflict; use the existing source.

## Verification
```powershell
./backend/.venv/Scripts/python.exe -m unittest backend.test_mvp -v
node node_modules/eslint/bin/eslint.js app components context services/api
node node_modules/next/dist/bin/next build --turbopack
```

Five integration/normalization tests cover actual English/Hindi OCR, multi-page PDF rendering, empty scans, duplicate detection, source hashes, preview access, conflicts, manual mapping, corrections/revisions, SQLite persistence, approval constraints, role/district restrictions, login throttling and failed-job retry. The failure/retry test intentionally logs a missing-engine error before recovering. Tests use an isolated temporary database, not your working records.

Browser checks exercised real sign-in, upload and processing, source preview, evidence review persistence across reload and server restart, reports, and a 390px mobile drawer. Passing synthetic tests is NOT a measured accuracy claim on real land records.

## Fresh machine setup
Requires Node.js, Python 3.11+ (tested on 3.13), and Tesseract 5 with `eng` and `hin`.

```powershell
pnpm install
python -m venv backend/.venv
./backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
```

Create `backend/.env` from the example and choose a bootstrap password of at least 10 characters. If Tesseract is installed, set `TESSERACT_CMD` to its executable. Alternatively on Windows with 7-Zip in `C:/Program Files/7-Zip`:
```powershell
./backend/.venv/Scripts/python.exe backend/setup_ocr.py
```
The setup helper downloads the [Tesseract Windows runtime](https://github.com/UB-Mannheim/tesseract/wiki) and [official language models](https://github.com/tesseract-ocr/tessdata_fast) into ignored local tools storage. These downloads are setup-only; OCR has no network calls. Do not run setup on an air-gapped machine without first transferring the runtime and models locally.

## API and persistence
API docs: http://127.0.0.1:8000/docs. Browser requests use same-origin `/api/v1` through Next.js. See `backend/.env.example` for area tolerance, confidence threshold and allowed origins. The external API URL is not needed.

- `backend/data/bharat.sqlite3`: users, sessions, parcel context, jobs, fields/revisions, decisions and audit.
- `backend/data/documents/<id>/original.*`: original source.
- `backend/data/documents/<id>/page-N.png`: processed page preview.
- `backend/data/samples`: synthetic fixtures.
- `backend/data/runtime`: logs and managed server process identifiers.

Back up the entire `backend/data` directory while the servers are stopped. Do not commit it, the OCR runtime, the Python environment, or `.env`. Storage is local but not encrypted by this application; use OS-level disk encryption and appropriate file permissions. The audit hash chain detects edits within the retained chain, but an administrator with disk access can rewrite/truncate the database; it is not an externally anchored or immutable legal record.

## MVP boundaries — important
This is a working local MVP, not a production government deployment.
- Automatic field extraction currently recognizes label/value lines. It is not a trained layout-understanding NLP model. Unfamiliar tables, multi-column registers and handwritten/faded records need further work and real examples.
- OCR confidence is Tesseract's mean word score, not calibrated probability of correctness. Handwriting and real historical-record accuracy are not validated.
- A manual mapping requires an OCR-detected line; a completely blank/unreadable OCR result needs a clearer source or a future manual region-entry workflow.
- No live LRMS/DILRMP/court connection, cadastral map digitization, polygon-area engine, georeferencing, government SSO or legally authoritative ownership determination is claimed. JSON exports provide a local integration starting point. GIS/timeline views remain empty when source information is absent.
- SQLite and one in-process worker target one local MVP instance. Use one uvicorn process, not multiple workers. Production needs a dedicated queue, database migrations/PostgreSQL, stronger account administration, backup/retention controls, malware scanning/resource isolation, HTTPS, operational monitoring and representative accuracy evaluation.
