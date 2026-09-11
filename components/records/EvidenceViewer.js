"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Flag,
  Maximize2,
  RotateCw,
  ScanLine,
  ShieldCheck,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { getEvidenceViewerWorkspace, reviewEvidence } from "@/services/api/validation";

import styles from "./EvidenceViewer.module.css";

const statusCopy = {
  verified: "Verified",
  warning: "Review needed",
  critical: "Serious discrepancy",
};

export default function EvidenceViewer({ parcel }) {
  const [workspace, setWorkspace] = useState({documents: [], fields: []});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({});
  const {user} = useAuth();
  const canReview = ["verification_officer", "revenue_officer"].includes(user?.role);
  const [selectedDocumentId, setSelectedDocumentId] = useState("ror");
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(92);
  const [rotation, setRotation] = useState(0);
  const [showBoxes, setShowBoxes] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fieldStates, setFieldStates] = useState({});
  const [notes, setNotes] = useState({});

  const selectedDocument =
    workspace.documents.find(
      (document) => document.id === selectedDocumentId
    ) || workspace.documents[0];

  const fieldsForDocument = workspace.fields.filter(
    (field) => field.documentId === selectedDocument?.id
  );

  const selectedField = workspace.fields.find(
    (field) => field.id === selectedFieldId
  );

  const getFieldState = (field) =>
    fieldStates[field.id] || field.state;

  useEffect(() => {
    let active = true;
    setLoading(true);
    getEvidenceViewerWorkspace(parcel.id).then(data => {
      if (!active) return;
      setWorkspace(data);
      const fieldId = new URLSearchParams(window.location.search).get("field");
      const linkedField = data.fields.find(field=>field.id===fieldId);
      setSelectedDocumentId(linkedField?.documentId || data.documents[0]?.id || "");
      setSelectedFieldId(linkedField?.id || null); setDrawerOpen(Boolean(linkedField)); setPage(linkedField?.page || 1);
      setFieldStates({}); setNotes({}); setValues({}); setError("");
    }).catch(err => active && setError(err.message)).finally(() => active && setLoading(false));
    return () => {active = false;};
  }, [parcel.id]);

  function selectDocument(documentId) {
    const documentFields = workspace.fields.filter(
      (field) => field.documentId === documentId
    );
    const nextField = documentFields[0];

    setSelectedDocumentId(documentId);
    setSelectedFieldId(nextField?.id || null);
    setPage(nextField?.page || 1);
    setDrawerOpen(Boolean(nextField));
  }

  function selectField(field) {
    if (field.documentId !== selectedDocument?.id) {
      setSelectedDocumentId(field.documentId);
    }

    setSelectedFieldId(field.id);
    setPage(field.page);
    setDrawerOpen(true);
  }

  function changePage(nextPage) {
    const safePage = Math.min(
      Math.max(nextPage, 1),
      selectedDocument.pages
    );
    setPage(safePage);
  }

  async function updateReviewState(nextState) {
    if (!selectedField) return;
    setSaving(true); setError("");
    try {
      await reviewEvidence(selectedField.id, {version:selectedField.version,state:nextState,notes:notes[selectedField.id] ?? selectedField.notes ?? "",value:values[selectedField.id] ?? selectedField.value});
      setWorkspace(await getEvidenceViewerWorkspace(parcel.id));
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  const boxesForPage = fieldsForDocument.filter(
    (field) => field.page === page
  );

  if (loading) {
    return <EvidenceViewerLoading />;
  }

  if (!selectedDocument) return <section className={styles.viewer}><h1>Evidence Viewer · {parcel.id}</h1><p role="status">{error || "No source documents are attached to this parcel yet."}</p><Link href={`/documents/upload?parcelId=${parcel.id}`}>Upload source evidence</Link></section>;

  return (
    <section className={styles.viewer} aria-label="Evidence Viewer">
      {error && <p role="alert" className={styles.reviewError}>{error}</p>}
      <header className={styles.contextHeader}>
        <div className={styles.contextTitle}>
          <div className={styles.eyebrow}>EVIDENCE VIEWER / PARCEL</div>
          <h1>Evidence Viewer</h1>
          <p>
            Inspect extracted fields against their original source records before
            making a verification decision.
          </p>
        </div>

        <div className={styles.contextGrid}>
          <ContextItem label="Parcel ID" value={parcel.id} />
          <ContextItem label="Primary owner" value={parcel.currentRecordedOwner} />
          <ContextItem
            label="Location"
            value={`${parcel.village?.name || "—"}, ${parcel.village?.district || "—"}`}
            detail={parcel.village?.tehsil || "Tehsil unavailable"}
          />
          <ContextItem label="Survey / Khasra" value={parcel.surveyNumber} />
          <ContextItem
            label="Verification"
            value={(workspace.parcel || parcel).recordStatus === "VERIFIED" ? "Verified" : "Review required"}
            status={(workspace.parcel || parcel).recordStatus === "VERIFIED" ? "verified" : "warning"}
          />
          <ContextItem
            label="Last updated"
            value={new Date((workspace.parcel || parcel).updatedAt).toLocaleString("en-IN")}
            detail={parcel.sample ? "Synthetic parcel · local source evidence" : "Local source evidence"}
          />
        </div>
      </header>

      <div className={styles.provenance} aria-label="Evidence provenance chain">
        <span>Evidence chain</span>
        {[
          "Document uploaded",
          "OCR extracted",
          "Field normalized",
          "Cross-source compared",
          "Officer verified",
        ].map((step, index) => (
          <div key={step} className={styles.provenanceStep}>
            <span className={([true, !!selectedDocument.completedAt, fieldsForDocument.some(f=>f.normalizedValue!==null), !!selectedDocument.completedAt, fieldsForDocument.length>0 && fieldsForDocument.every(f=>f.reviewStatus==="VERIFIED")][index]) ? styles.completeDot : styles.pendingDot} />
            {step}
            {index < 4 && <i aria-hidden="true">→</i>}
          </div>
        ))}
      </div>

      <div className={styles.workspace}>
        <aside className={styles.fieldsPanel} aria-label="Extracted fields">
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.panelEyebrow}>SOURCE-LINKED DATA</span>
              <h2>Extracted Fields</h2>
            </div>
            <span className={styles.fieldCount}>{fieldsForDocument.length}</span>
          </div>

          <p className={styles.panelHint}>
            Select a field to locate the corresponding OCR evidence.
          </p>

          <div className={styles.fieldList}>
            {fieldsForDocument.length === 0 ? (
              <EmptyFields />
            ) : (
              fieldsForDocument.map((field) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  selected={field.id === selectedFieldId}
                  state={getFieldState(field)}
                  onSelect={() => selectField(field)}
                />
              ))
            )}
          </div>
        </aside>

        <section className={styles.sourcePanel} aria-label="Source evidence document viewer">
          <div className={styles.sourceToolbar}>
            <label className={styles.documentSelect}>
              <FileText size={16} />
              <span className="srOnly">Source document</span>
              <select
                value={selectedDocument.id}
                onChange={(event) => selectDocument(event.target.value)}
                aria-label="Select source document"
              >
                {workspace.documents.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.name}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.pageControls} aria-label="Page navigation">
              <button
                type="button"
                onClick={() => changePage(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span>Page {page} / {selectedDocument.pages}</span>
              <button
                type="button"
                onClick={() => changePage(page + 1)}
                disabled={page === selectedDocument.pages}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className={styles.toolControls} aria-label="Document view controls">
              <button
                type="button"
                onClick={() => setZoom((value) => Math.max(65, value - 10))}
                aria-label="Zoom out"
              >
                <ZoomOut size={15} />
              </button>
              <span>{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom((value) => Math.min(130, value + 10))}
                aria-label="Zoom in"
              >
                <ZoomIn size={15} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(92)}
                aria-label="Fit document to screen"
              >
                <Maximize2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setRotation((value) => (value + 90) % 360)}
                aria-label="Rotate document"
              >
                <RotateCw size={15} />
              </button>
              <button
                type="button"
                className={showBoxes ? styles.activeControl : ""}
                onClick={() => setShowBoxes((value) => !value)}
                aria-label="Toggle OCR bounding boxes"
                aria-pressed={showBoxes}
              >
                {showBoxes ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
          </div>

          <div className={styles.documentBody}>
            <div className={styles.thumbnailRail} aria-label="Document pages">
              {Array.from({ length: selectedDocument.pages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={pageNumber === page ? styles.activeThumb : styles.thumbnail}
                    onClick={() => changePage(pageNumber)}
                    aria-label={`Open page ${pageNumber}`}
                    aria-pressed={pageNumber === page}
                  >
                    <span>{pageNumber}</span>
                    <i />
                    <i />
                    <i />
                  </button>
                )
              )}
            </div>

            <div className={styles.canvas}>
              <DocumentPreview
                document={selectedDocument}
                parcel={parcel}
                page={page}
                zoom={zoom}
                rotation={rotation}
                boxes={boxesForPage}
                selectedFieldId={selectedFieldId}
                showBoxes={showBoxes}
                getFieldState={getFieldState}
                onSelectField={field => {selectField(field); document.getElementById(`field-${field.id}`)?.focus({preventScroll:true});}}
              />
            </div>
          </div>

          {boxesForPage.length === 0 && (
            <div className={styles.pageEmpty}>
              <ScanLine size={16} />
              No extracted OCR regions are linked to page {page}. Your selected field remains available.
            </div>
          )}
        </section>
      </div>

      {drawerOpen && selectedField && (
        <EvidenceDrawer
          field={selectedField}
          state={getFieldState(selectedField)}
          note={notes[selectedField.id] ?? selectedField.notes ?? ""}
          value={values[selectedField.id] ?? selectedField.value}
          onValueChange={value => setValues(current=>({...current,[selectedField.id]:value}))}
          disabled={saving || !canReview}
          error={error}
          onClose={() => setDrawerOpen(false)}
          onNoteChange={(value) =>
            setNotes((current) => ({ ...current, [selectedField.id]: value }))
          }
          onVerify={() => updateReviewState("verified")}
          onFlag={() => updateReviewState("warning")}
        />
      )}
    </section>
  );
}

function ContextItem({ label, value, detail, status }) {
  return (
    <div className={styles.contextItem}>
      <span>{label}</span>
      <strong className={status ? styles[`context${status}`] : ""}>{value || "—"}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function FieldCard({ field, selected, state, onSelect }) {
  return (
    <button
      type="button"
      className={`${styles.fieldCard} ${selected ? styles.selectedField : ""} ${styles[`field${state}`]}`}
      id={`field-${field.id}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className={styles.fieldCardTop}>
        <span>{field.label}</span>
        <Confidence confidence={field.confidence} state={state} compact />
      </div>
      <strong>{field.value}</strong>
      <div className={styles.fieldCardMeta}>
        <span title={field.source}>{field.source}</span>
        <small>Page {field.page}</small>
      </div>
      <div className={styles.fieldState}>
        <span className={styles[`state${state}`]} />
        {statusCopy[state]}
      </div>
    </button>
  );
}

function Confidence({ confidence, state, compact = false }) {
  return (
    <span className={`${styles.confidence} ${styles[`confidence${state}`]} ${compact ? styles.compactConfidence : ""}`}>
      {confidence}% OCR
    </span>
  );
}

function DocumentPreview({
  document,
  parcel,
  page,
  zoom,
  rotation,
  boxes,
  selectedFieldId,
  showBoxes,
  getFieldState,
  onSelectField,
}) {
  if ((document.processedPages || 0) < page) return <div className={styles.emptyFields} role="status"><Clock3 size={20}/><strong>{document.ocrStatus === "FAILED" ? "Source processing failed" : "Page preview is being prepared"}</strong><Link href={`/documents/${document.id}`}>View processing status</Link></div>;
  return (
    <div className={styles.previewOverflow}>
      <article
        className={styles.sourceImage}
        style={{ transform: `rotate(${rotation}deg) scale(${zoom / 100})` }}
        aria-label={`${document.name}, page ${page}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/v1/documents/${document.id}/pages/${page}`} alt={`Original source: ${document.name}, page ${page}`} />

        {showBoxes && boxes.map((field) => {
          const state = getFieldState(field);
          const selected = field.id === selectedFieldId;

          return (
            <button
              type="button"
              key={field.id}
              className={`${styles.boundingBox} ${styles[`box${state}`]} ${selected ? styles.selectedBox : ""}`}
              style={{
                left: `${field.bbox.left}%`,
                top: `${field.bbox.top}%`,
                width: `${field.bbox.width}%`,
                height: `${field.bbox.height}%`,
              }}
              onClick={() => onSelectField(field)}
              aria-label={`Select ${field.label}, ${field.confidence}% confidence`}
            >
              <span>{field.label} · {field.confidence}%</span>
            </button>
          );
        })}
      </article>
    </div>
  );
}

function EvidenceDrawer({ field, state, note, value, onValueChange, disabled, error, onClose, onNoteChange, onVerify, onFlag }) {
  return (
    <aside className={styles.drawer} aria-label={`${field.label} evidence details`}>
      <div className={styles.drawerHeader}>
        <div>
          <span className={styles.panelEyebrow}>EVIDENCE DETAILS</span>
          <h2>{field.label}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close evidence details">
          <X size={17} />
        </button>
      </div>

      <div className={styles.drawerValue}>
        <span>Extracted value</span>
        <strong>{field.value}</strong>
        <Confidence confidence={field.confidence} state={state} />
      </div>

      <dl className={styles.detailList}>
        <Detail label="Original OCR value (immutable)" value={field.originalValue} />
        <Detail label="Confidence method" value={field.confidenceType} />
        <Detail label="Source document" value={field.source} />
        <Detail label="Page number" value={`Page ${field.page}`} />
        <Detail label="Extraction timestamp" value={field.extractedAt} />
        <Detail label="Validation result" value={field.validation} />
      </dl>

      {field.conflicts?.length > 0 && (
        <div className={styles.conflictBlock}>
          <CircleAlert size={16} />
          <div>
            <strong>Related values</strong>
            {field.conflicts.map((conflict) => <span key={conflict}>{conflict}</span>)}
          </div>
        </div>
      )}

      <label className={styles.notesField}>
        <span>Reviewed value (original is retained)</span>
        <input value={value} onChange={event=>onValueChange(event.target.value)} disabled={disabled} />
      </label>
      <label className={styles.notesField}>
        <span>Officer notes</span>
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Add review context for this evidence..."
        />
      </label>

      <div className={styles.drawerActions}>
        {error && <p role="alert">{error}</p>}
        <button type="button" disabled={disabled} className={styles.verifyAction} onClick={onVerify}>
          <CheckCircle2 size={15} />
          Mark as verified
        </button>
        <button type="button" disabled={disabled} className={styles.reviewAction} onClick={onFlag}>
          <Flag size={15} />
          Flag for review
        </button>
      </div>
    </aside>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function EmptyFields() {
  return (
    <div className={styles.emptyFields}>
      <Clock3 size={18} />
      <strong>No extracted fields</strong>
      <span>OCR fields will appear after document processing completes.</span>
    </div>
  );
}

function EvidenceViewerLoading() {
  return (
    <section className={styles.loadingViewer} aria-label="Loading evidence viewer">
      <div className={styles.loadingHeader}>
        <div />
        <span />
      </div>
      <div className={styles.loadingWorkspace}>
        <div />
        <div />
      </div>
    </section>
  );
}
