"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ExternalLink,
  MapPin,
  Database,
  ShieldCheck,
  ScanText,
  Trash2,
} from "lucide-react";

import { getDocumentById, retryDocument, removeDocument } from "@/services/api/documents";
import Link from "next/link";
import ManualFieldMapping from "@/components/records/ManualFieldMapping";
import styles from "./document-detail.module.css";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatus(status) {
  const value = String(status || "").toUpperCase();

  if (
    value.includes("COMPLETE") ||
    value.includes("VERIFIED") ||
    value.includes("SUCCESS")
  ) {
    return {
      label: status || "Completed",
      type: "success",
      icon: CheckCircle2,
    };
  }

  if (
    value.includes("PROCESS") ||
    value.includes("PENDING") ||
    value.includes("REVIEW")
  ) {
    return {
      label: status || "Processing",
      type: "pending",
      icon: Clock3,
    };
  }

  if (
    value.includes("FAILED") ||
    value.includes("ERROR") ||
    value.includes("REJECT")
  ) {
    return {
      label: status || "Attention Required",
      type: "danger",
      icon: AlertTriangle,
    };
  }

  return {
    label: status || "Available",
    type: "neutral",
    icon: FileText,
  };
}

function getConfidenceClass(confidence) {
  const value = Number(confidence);

  if (value >= 90) return styles.confidenceHigh;
  if (value >= 70) return styles.confidenceMedium;

  return styles.confidenceLow;
}

function getConfidenceLabel(confidence) {
  const value = Number(confidence);

  if (value >= 90) return "High";
  if (value >= 70) return "Medium";

  return "Low";
}

function getFieldName(item) {
  return (
    item.field ||
    item.fieldName ||
    item.name ||
    item.key ||
    "Extracted Field"
  );
}

function getFieldValue(item) {
  return (
    item.value ??
    item.extractedValue ??
    item.text ??
    item.content ??
    "—"
  );
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();

  const documentId = params?.documentId;

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleRemove() {
    if (!window.confirm("Remove this document from the parcel? Its original file and audit history will be retained locally.")) return;
    setDeleting(true);
    setError("");
    try {
      const result = await removeDocument(documentId);
      router.push(`/records/${result.parcelId}`);
    } catch (err) {
      setError(err.message || "Could not remove document.");
      setDeleting(false);
    }
  }

  useEffect(() => {
    async function loadDocument() {
      if (!documentId) return;

      try {
        setLoading(true);
        setError("");

        const data = await getDocumentById(documentId);
        setDocument(data);
      } catch (err) {
        setError(err.message || "Failed to load document.");
      } finally {
        setLoading(false);
      }
    }

    loadDocument();
  }, [documentId]);

  useEffect(() => {
    if (!["QUEUED","PROCESSING"].includes(document?.ocrStatus)) return;
    const timer=setInterval(()=>getDocumentById(documentId).then(setDocument).catch(err=>setError(err.message)),2000);
    return ()=>clearInterval(timer);
  }, [documentId,document?.ocrStatus]);

  const extractions = useMemo(() => document?.extractions || [], [document?.extractions]);
  const evidence = document?.evidence || [];

  const averageConfidence = useMemo(() => {
    if (!extractions.length) return null;

    const values = extractions
      .map((item) => Number(item.confidence))
      .filter((value) => Number.isFinite(value));

    if (!values.length) return null;

    return (
      values.reduce((sum, value) => sum + value, 0) /
      values.length
    ).toFixed(1);
  }, [extractions]);

  const highConfidenceCount = useMemo(() => {
    return extractions.filter(
      (item) => Number(item.confidence) >= 90
    ).length;
  }, [extractions]);

  if (loading) {
    return (
      <div className={styles.stateCard}>
        <div className={styles.loader} />
        <p>Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.back()}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className={styles.errorCard}>
          <AlertTriangle size={22} />
          <div>
            <strong>Unable to load document</strong>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!document) return null;

  const status = getStatus(
    document.ocrStatus || document.status
  );

  const StatusIcon = status.icon;

  const documentTitle =
    document.title ||
    document.documentType ||
    document.type ||
    "Land Record Document";

  return (
    <div className={styles.page}>
      <button
        type="button"
        className={styles.backButton}
        onClick={() => router.push("/documents")}
      >
        <ArrowLeft size={16} />
        Documents
      </button>

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.documentIcon}>
            <FileText size={24} />
          </div>

          <div>
            <div className={styles.eyebrow}>
              SOURCE DOCUMENT
            </div>

            <h1>{documentTitle}</h1>

            <div className={styles.documentMeta}>
              <span>{document.id}</span>

              {document.documentNumber && (
                <>
                  <span>•</span>
                  <span>{document.documentNumber}</span>
                </>
              )}

              {document.language && (
                <>
                  <span>•</span>
                  <span>{document.language}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={`${styles.status} ${status.type === "success" ? styles.statusSuccess : status.type === "pending" ? styles.statusPending : status.type === "danger" ? styles.statusDanger : styles.statusNeutral}`}>
            <StatusIcon size={15} />{status.label}
          </div>
          <button type="button" className={styles.dangerButton} onClick={handleRemove} disabled={deleting || ["QUEUED","PROCESSING"].includes(document.ocrStatus)} title={["QUEUED","PROCESSING"].includes(document.ocrStatus) ? "Wait for OCR to finish" : "Remove from parcel"}>
            <Trash2 size={15}/>{deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </header>

      {/* SUMMARY */}
      <div className={styles.card} style={{padding:16}}>
        <p role="status">Local processing: {document.ocrStatus} · {document.processedPages || 0} / {document.pages} pages</p>
        {document.error && <p role="alert">{document.error}</p>}
        {document.ocrStatus === "FAILED" && <button onClick={async()=>{try {await retryDocument(documentId);setDocument(await getDocumentById(documentId));} catch(err){setError(err.message);}}}>Retry local OCR</button>}
        <Link href={`/records/${document.parcelId}/evidence`}>Open Evidence Viewer →</Link>
        {document.ocrStatus === "REVIEW_REQUIRED" && <p>No supported label-based fields were detected. Inspect the original and raw OCR text; upload a clearer source if needed.</p>}
        {document.rawText && <details><summary>Raw OCR text</summary><pre style={{whiteSpace:"pre-wrap"}}>{document.rawText}</pre></details>}
        <ManualFieldMapping document={document} onSaved={async()=>setDocument(await getDocumentById(documentId))}/>
      </div>
      <section className={styles.summaryGrid}>
        <SummaryCard
          icon={ScanText}
          label="Extracted Fields"
          value={extractions.length}
        />

        <SummaryCard
          icon={CheckCircle2}
          label="High Confidence"
          value={highConfidenceCount}
        />

        <SummaryCard
          icon={ShieldCheck}
          label="Average Confidence"
          value={
            averageConfidence !== null
              ? `${averageConfidence}%`
              : "—"
          }
        />

        <SummaryCard
          icon={Database}
          label="Evidence Items"
          value={evidence.length}
        />
      </section>

      <div className={styles.contentGrid}>
        {/* LEFT */}
        <main className={styles.mainColumn}>
          {/* DOCUMENT INFORMATION */}
          <section className={styles.card}>
            <SectionTitle
              icon={FileText}
              title="Document Information"
              description="Metadata associated with the source record."
            />

            <div className={styles.infoGrid}>
              <InfoItem
                label="Document Type"
                value={
                  document.documentType ||
                  document.type ||
                  "—"
                }
              />

              <InfoItem
                label="Document ID"
                value={document.id}
              />

              <InfoItem
                label="Document Number"
                value={document.documentNumber}
              />

              <InfoItem
                label="Language"
                value={document.language}
              />

              <InfoItem
                label="Source"
                value={document.source}
              />

              <InfoItem
                label="Document Date"
                value={formatDate(
                  document.documentDate || document.date
                )}
              />

              <InfoItem
                label="Uploaded At"
                value={formatDateTime(document.uploadedAt)}
              />

              <InfoItem
                label="Parcel"
                value={document.parcelId}
                mono
              />
            </div>
          </section>

          {/* OCR EXTRACTIONS */}
          <section className={styles.card}>
            <SectionTitle
              icon={ScanText}
              title="OCR & Extracted Information"
              description="Fields extracted from the document by the intelligence pipeline."
            />

            {extractions.length === 0 ? (
              <div className={styles.emptyState}>
                <ScanText size={25} />
                <p>No extracted fields available.</p>
              </div>
            ) : (
              <div className={styles.extractionList}>
                {extractions.map((item, index) => {
                  const confidence = Number(
                    item.confidence
                  );

                  const confidenceLabel =
                    getConfidenceLabel(confidence);

                  return (
                    <div
                      className={styles.extractionRow}
                      key={item.id || index}
                    >
                      <div className={styles.fieldInfo}>
                        <span className={styles.fieldName}>
                          {getFieldName(item)}
                        </span>

                        <strong>
                          {String(getFieldValue(item))}
                        </strong>
                      </div>

                      <div className={styles.confidenceBlock}>
                        <span
                          className={`${styles.confidenceBadge} ${getConfidenceClass(
                            confidence
                          )}`}
                        >
                          {Number.isFinite(confidence)
                            ? `${confidence.toFixed(1)}%`
                            : "—"}
                        </span>

                        <span className={styles.confidenceLabel}>
                          {confidenceLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* EVIDENCE */}
          <section className={styles.card}>
            <SectionTitle
              icon={MapPin}
              title="Evidence Provenance"
              description="Trace each extracted value back to its source location."
            />

            {evidence.length === 0 ? (
              <div className={styles.emptyState}>
                <MapPin size={25} />
                <p>No evidence references available.</p>
              </div>
            ) : (
              <div className={styles.evidenceList}>
                {evidence.map((item, index) => {
                  const confidence = Number(
                    item.confidence
                  );

                  return (
                    <div
                      className={styles.evidenceCard}
                      key={item.id || index}
                    >
                      <div className={styles.evidenceHeader}>
                        <div>
                          <span className={styles.evidenceType}>
                            {item.evidenceType ||
                              item.type ||
                              "FIELD EVIDENCE"}
                          </span>

                          <h3>
                            {item.field ||
                              item.fieldName ||
                              "Extracted Field"}
                          </h3>
                        </div>

                        <span
                          className={`${styles.confidenceBadge} ${getConfidenceClass(
                            confidence
                          )}`}
                        >
                          {Number.isFinite(confidence)
                            ? `${confidence.toFixed(1)}%`
                            : "—"}
                        </span>
                      </div>

                      <div className={styles.evidenceValue}>
                        {item.value ??
                          item.extractedValue ??
                          item.text ??
                          "—"}
                      </div>

                      <div className={styles.evidenceMeta}>
                        <div>
                          <span>Source</span>
                          <strong>
                            {item.documentId ||
                              document.id}
                          </strong>
                        </div>

                        <div>
                          <span>Page</span>
                          <strong>
                            {item.page ?? "—"}
                          </strong>
                        </div>

                        <div>
                          <span>Evidence ID</span>
                          <strong>
                            {item.id || "—"}
                          </strong>
                        </div>

                        {item.bbox && (
                          <div>
                            <span>Bounding Box</span>
                            <strong className={styles.mono}>
                              {Array.isArray(item.bbox)
                                ? item.bbox.join(", ")
                                : String(item.bbox)}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {/* RIGHT */}
        <aside className={styles.sideColumn}>
          {/* SOURCE PREVIEW */}
          <section className={styles.card}>
            <SectionTitle
              icon={FileText}
              title="Source Preview"
              description="Original record reference."
            />

            <div className={styles.documentPreview}>
              <FileText size={38} />

              <strong>{documentTitle}</strong>

              <span>
                {document.language || "Source record"}
              </span>

              <button
                type="button"
                className={styles.previewButton}
                onClick={() => {
                  if (document.fileUrl) {
                    window.open(
                      document.fileUrl,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }
                }}
                disabled={!document.fileUrl}
              >
                <ExternalLink size={14} />
                {document.fileUrl
                  ? "Open Source"
                  : "Preview Unavailable"}
              </button>
            </div>
          </section>

          {/* PARCEL LINK */}
          <section className={styles.card}>
            <SectionTitle
              icon={Database}
              title="Linked Parcel"
              description="Entity associated with this document."
            />

            {document.parcelId ? (
              <button
                type="button"
                className={styles.parcelLink}
                onClick={() =>
                  router.push(
                    `/records/${document.parcelId}`
                  )
                }
              >
                <div>
                  <span>Parcel ID</span>
                  <strong>{document.parcelId}</strong>
                </div>

                <ExternalLink size={15} />
              </button>
            ) : (
              <div className={styles.notAvailable}>
                No parcel linked.
              </div>
            )}
          </section>

          {/* PROCESSING */}
          <section className={styles.card}>
            <SectionTitle
              icon={ShieldCheck}
              title="Processing Information"
              description="Traceability of the document intelligence pipeline."
            />

            <div className={styles.processingList}>
              <ProcessItem
                label="Document Ingested"
                value="Complete"
                success
              />

              <ProcessItem
                label="OCR Processing"
                value={
                  document.ocrStatus ||
                  document.status ||
                  "Complete"
                }
                success
              />

              <ProcessItem
                label="Field Extraction"
                value={
                  extractions.length
                    ? `${extractions.length} fields`
                    : "No fields"
                }
                success={extractions.length > 0}
              />

              <ProcessItem
                label="Evidence Linking"
                value={
                  evidence.length
                    ? `${evidence.length} references`
                    : "No references"
                }
                success={evidence.length > 0}
              />
            </div>
          </section>

          {/* NOTE */}
          <div className={styles.note}>
            <ShieldCheck size={17} />

            <div>
              <strong>Evidence-first processing</strong>

              <p>
                OCR output is treated as extracted evidence,
                not as a final legal determination. Officers
                verify important information against the
                originating record.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryIcon}>
        <Icon size={18} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className={styles.sectionTitle}>
      <div className={styles.sectionTitleIcon}>
        <Icon size={17} />
      </div>

      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function InfoItem({ label, value, mono = false }) {
  return (
    <div className={styles.infoItem}>
      <span>{label}</span>

      <strong className={mono ? styles.mono : ""}>
        {value || "—"}
      </strong>
    </div>
  );
}

function ProcessItem({ label, value, success }) {
  return (
    <div className={styles.processItem}>
      <div
        className={
          success
            ? styles.processSuccess
            : styles.processNeutral
        }
      >
        {success ? (
          <CheckCircle2 size={14} />
        ) : (
          <Clock3 size={14} />
        )}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
