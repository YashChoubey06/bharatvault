"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Map,
  GitBranch,
  History,
  ShieldAlert,
  Activity,
} from "lucide-react";

import { getParcelById } from "@/services/api/parcels";

import styles from "./record.module.css";

const tabs = [
  {
    label: "Overview",
    icon: Activity,
    path: "",
  },
  {
    label: "Evidence Viewer",
    icon: FileText,
    path: "evidence",
  },
  {
    label: "Validation",
    icon: ShieldAlert,
    path: "validation",
  },
  {
    label: "Timeline",
    icon: History,
    path: "timeline",
  },
  {
    label: "GIS",
    icon: Map,
    path: "gis",
  },
  {
    label: "Evidence Graph",
    icon: GitBranch,
    path: "graph",
  },
];

export default function ParcelRecordPage() {
  const params = useParams();
  const router = useRouter();

  const recordId = params.recordId;

  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadParcel() {
      try {
        setLoading(true);
        setError("");

        const data = await getParcelById(recordId);

        setParcel(data);
      } catch (err) {
        setError(err.message || "Unable to load parcel.");
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadParcel();
    }
  }, [recordId]);

  if (loading) {
    return <div className={styles.state}>Loading parcel intelligence...</div>;
  }

  if (error || !parcel) {
    return (
      <div className={styles.state}>
        <AlertTriangle size={20} />

        <span>{error || "Parcel not found."}</span>

        <button type="button" onClick={() => router.push("/records")}>
          Back to Records
        </button>
      </div>
    );
  }

  const registrationArea = parcel.registration?.area;

  const gisArea = parcel.gis?.area;

  const recordedArea = Number(parcel.recordedArea) || 0;

  const registrationDifference =
    registrationArea !== undefined && registrationArea !== null
      ? Math.abs(recordedArea - Number(registrationArea))
      : null;

  const gisDifference =
    gisArea !== undefined && gisArea !== null
      ? Math.abs(recordedArea - Number(gisArea))
      : null;

  return (
    <div className={styles.page}>
      {/* Back */}
      <button
        type="button"
        className={styles.backButton}
        onClick={() => router.push("/records")}
      >
        <ArrowLeft size={15} />
        Back to Records
      </button>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>LAND RECORDS / PARCEL</div>

          <div className={styles.titleRow}>
            <h1>{parcel.id}</h1>

            <RiskBadge level={parcel.riskLevel} />
          </div>

          <p>
            Survey {parcel.surveyNumber}
            {" · "}
            {parcel.village?.name || "Unknown village"}
            {" · "}
            {parcel.village?.district || "Unknown district"}
          </p>
        </div>

        <div className={styles.headerRisk}>
          <span>Risk Score</span>
          <strong>{parcel.risk?.riskScore ?? "—"}</strong>
          <small>/ 100</small>
        </div>
      </header>

      {/* Navigation */}
      <a href={`/api/v1/parcels/${encodeURIComponent(recordId)}/export`} className={styles.backButton}>Download evidence bundle (JSON)</a>
      <nav className={styles.tabs}>
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.label}
              type="button"
              className={!tab.path ? styles.activeTab : styles.tab}
              onClick={() => {
                if (!tab.path) return;

                router.push(`/records/${recordId}/${tab.path}`);
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main overview */}
      <div className={styles.grid}>
        {/* Parcel summary */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Parcel Summary</h2>
              <p>{parcel.sample ? "Synthetic parcel context — not a government record" : "Parcel context; refer to source evidence for verified values"}</p>
            </div>

            <Map size={18} />
          </div>

          <div className={styles.summaryGrid}>
            <InfoItem
              label="Recorded Owner"
              value={parcel.currentRecordedOwner}
            />

            <InfoItem label="Survey Number" value={parcel.surveyNumber} />

            <InfoItem label="Khata Number" value={parcel.khataNumber} />

            <InfoItem
              label="Recorded Area"
              value={`${recordedArea.toFixed(2)} ha`}
            />

            <InfoItem label="Village" value={parcel.village?.name || "—"} />

            <InfoItem
              label="District"
              value={parcel.village?.district || "—"}
            />
          </div>
        </section>

        {/* Risk */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Risk Assessment</h2>
              <p>Evidence-based prioritization</p>
            </div>

            <ShieldAlert size={18} />
          </div>

          <div className={styles.riskMain}>
            <div
              className={`${styles.riskScore} ${
                styles[`riskScore${parcel.riskLevel}`] || ""
              }`}
            >
              {parcel.risk?.riskScore ?? "—"}
            </div>

            <div>
              <strong>{parcel.riskLevel || "UNKNOWN"} RISK</strong>

              <p>Investigation priority based on available evidence.</p>
            </div>
          </div>

          <div className={styles.factorList}>
            {parcel.risk?.factors?.map((factor) => (
              <div key={factor.factor} className={styles.factor}>
                <AlertTriangle size={13} />

                <span>{factor.factor}</span>

                <strong>+{factor.impact}</strong>
              </div>
            ))}
          </div>

          <div className={styles.reviewNotice}>
            <AlertTriangle size={15} />

            <span>
              Officer review required. Risk score is not a legal or fraud
              determination.
            </span>
          </div>
        </section>
      </div>

      {/* Reconciliation */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Evidence Reconciliation</h2>

            <p>
              Comparing independent sources for survey {parcel.surveyNumber}
            </p>
          </div>

          <FileText size={18} />
        </div>

        <div className={styles.evidenceRows}>
          <EvidenceRow
            source="Parcel context"
            value={recordedArea.toFixed(2)}
            unit="ha"
            status={parcel.recordStatus === "VERIFIED" ? "verified" : "warning"}
            description="Entered area; not independent source evidence"
          />

          <EvidenceRow
            source="Registration"
            value={
              registrationArea !== undefined
                ? Number(registrationArea).toFixed(2)
                : "—"
            }
            unit="ha"
            status={registrationDifference === null || registrationDifference > 0.02 ? "warning" : "verified"}
            description={
              registrationDifference === null ? "No registration area evidence available" : registrationDifference > 0.02
                ? `${registrationDifference.toFixed(2)} ha difference from RoR`
                : "Matches recorded area"
            }
          />

          <EvidenceRow
            source="Cadastral GIS"
            value={gisArea !== undefined ? Number(gisArea).toFixed(2) : "—"}
            unit="ha"
            status={gisDifference === null || gisDifference > 0.02 ? "warning" : "verified"}
            description={
              gisDifference === null ? "No GIS source available" : gisDifference > 0.02
                ? `${gisDifference.toFixed(2)} ha difference from RoR`
                : "Matches recorded area"
            }
          />
        </div>
      </section>

      {/* Ownership + Court */}
      <div className={styles.bottomGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Current Transaction</h2>
              <p>Latest available registration</p>
            </div>
          </div>

          {parcel.registration ? (
            <div className={styles.transaction}>
              <div>
                <span>Seller</span>
                <strong>{parcel.registration.seller}</strong>
              </div>

              <div className={styles.arrow}>→</div>

              <div>
                <span>Buyer</span>
                <strong>{parcel.registration.buyer}</strong>
              </div>

              <div>
                <span>Date</span>
                <strong>{parcel.registration.date}</strong>
              </div>
            </div>
          ) : (
            <div className={styles.noData}>No registration data available.</div>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Dispute Status</h2>
              <p>Available court information</p>
            </div>
          </div>

          {parcel.courtCase ? (
            <div className={styles.courtCase}>
              <div className={styles.courtIcon}>
                <AlertTriangle size={17} />
              </div>

              <div>
                <strong>{parcel.courtCase.caseType}</strong>

                <span>{parcel.courtCase.court}</span>

                <small>Status: {parcel.courtCase.status}</small>
              </div>
            </div>
          ) : (
            <div className={styles.noData}>No court case found.</div>
          )}
        </section>
      </div>

    </div>
  );
}

/* =========================================
   INFO ITEM
========================================= */

function InfoItem({ label, value }) {
  return (
    <div className={styles.infoItem}>
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

/* =========================================
   RISK BADGE
========================================= */

function RiskBadge({ level }) {
  const normalized = level || "UNKNOWN";

  return (
    <span
      className={`${styles.riskBadge} ${styles[`risk${normalized}`] || ""}`}
    >
      {normalized === "HIGH" || normalized === "CRITICAL" ? (
        <AlertTriangle size={13} />
      ) : normalized === "LOW" ? (
        <CheckCircle2 size={13} />
      ) : (
        <Clock3 size={13} />
      )}

      {normalized}
    </span>
  );
}

/* =========================================
   EVIDENCE ROW
========================================= */

function EvidenceRow({ source, value, unit, status, description }) {
  const isWarning = status === "warning";

  return (
    <div className={styles.evidenceRow}>
      <div className={styles.evidenceSource}>
        <div className={isWarning ? styles.warningIcon : styles.successIcon}>
          {isWarning ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
        </div>

        <div>
          <strong>{source}</strong>
          <span>{description}</span>
        </div>
      </div>

      <div className={styles.evidenceValue}>
        <strong>{value}</strong>
        <span>{unit}</span>
      </div>
    </div>
  );
}
