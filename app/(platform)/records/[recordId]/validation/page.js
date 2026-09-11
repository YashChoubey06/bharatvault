"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  FileCheck2,
  Map,
  Scale,
  UserCheck,
  History,
  Info,
} from "lucide-react";

import { getParcelById } from "@/services/api/parcels";
import {
  getValidationByParcel,
  getConflictsByParcel,
  /*getRiskByParcel,*/
} from "@/services/api/validation";

import styles from "./validation.module.css";

export default function ParcelValidationPage() {
  const params = useParams();
  const router = useRouter();

  const recordId = params.recordId;

  const [parcel, setParcel] = useState(null);
  const [validation, setValidation] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [risk, setRisk] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadValidation() {
      try {
        setLoading(true);
        setError("");

        const [parcelData, validationData, conflictsData, riskData] =
          await Promise.all([
            getParcelById(recordId),
            getValidationByParcel(recordId),
            getConflictsByParcel(recordId),
            /*getRiskByParcel(/*recordId),*/
          ]);

        setParcel(parcelData);
        setValidation(validationData);
        setConflicts(conflictsData);
        setRisk(parcelData.risk || null);
      } catch (err) {
        setError(err.message || "Unable to load validation results.");
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadValidation();
    }
  }, [recordId]);

  if (loading) {
    return (
      <div className={styles.state}>
        <Clock3 size={20} />
        Loading validation intelligence...
      </div>
    );
  }

  if (error || !parcel || !validation) {
    return (
      <div className={styles.state}>
        <AlertTriangle size={20} />

        <span>{error || "Validation data not found."}</span>

        <button
          type="button"
          onClick={() => router.push(`/records/${recordId}`)}
        >
          Back to Record
        </button>
      </div>
    );
  }

  const checks = validation.checks || [];

  const passedChecks = checks.filter(
    (check) =>
      check.status === "PASS" ||
      check.status === "PASSED" ||
      check.result === "PASS"
  ).length;

  const warningChecks = checks.filter(
    (check) =>
      check.status === "WARNING" ||
      check.status === "WARN" ||
      check.result === "WARNING"
  ).length;

  const failedChecks = checks.filter(
    (check) =>
      check.status === "FAIL" ||
      check.status === "FAILED" ||
      check.result === "FAIL"
  ).length;

  const overallStatus =
    failedChecks > 0
      ? "REVIEW REQUIRED"
      : warningChecks > 0
        ? "REVIEW REQUIRED"
        : "VALIDATED";

  return (
    <div className={styles.page}>
      {/* Back */}
      <button
        type="button"
        className={styles.backButton}
        onClick={() => router.push(`/records/${recordId}`)}
      >
        <ArrowLeft size={15} />
        Back to Record
      </button>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            LAND RECORDS / PARCEL / VALIDATION
          </div>

          <div className={styles.titleRow}>
            <h1>Validation Results</h1>

            <StatusBadge status={overallStatus} />
          </div>

          <p>
            {parcel.id} · Survey {parcel.surveyNumber} ·{" "}
            {parcel.village?.name || "Unknown village"}
          </p>
        </div>

        <div className={styles.riskBox}>
          <span>Risk Score</span>

          <strong>{risk?.riskScore ?? "—"}</strong>

          <small>
            {parcel.riskLevel || "UNKNOWN"} PRIORITY
          </small>
        </div>
      </header>

      {/* Summary */}
      <section className={styles.summaryGrid}>
        <SummaryCard
          icon={FileCheck2}
          label="Total Checks"
          value={checks.length}
          description="Validation rules evaluated"
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Passed"
          value={passedChecks}
          description="No conflict detected"
          variant="success"
        />

        <SummaryCard
          icon={AlertTriangle}
          label="Warnings"
          value={warningChecks}
          description="Requires attention"
          variant="warning"
        />

        <SummaryCard
          icon={ShieldAlert}
          label="Failed"
          value={failedChecks}
          description="Review required"
          variant="danger"
        />
      </section>

      {/* Overall assessment */}
      <section className={styles.assessmentCard}>
        <div className={styles.assessmentIcon}>
          {overallStatus === "VALIDATED" ? (
            <CheckCircle2 size={22} />
          ) : (
            <AlertTriangle size={22} />
          )}
        </div>

        <div className={styles.assessmentContent}>
          <div className={styles.assessmentHeader}>
            <div>
              <span className={styles.sectionEyebrow}>
                SYSTEM ASSESSMENT
              </span>

              <h2>{overallStatus}</h2>
            </div>

            <span className={styles.confidence}>
              Validation Confidence{" "}
              <strong>
                {formatConfidence(validation.overallConfidence)}
              </strong>
            </span>
          </div>

          <p>
            The validation engine compared available textual,
            transactional, spatial and historical evidence for this
            parcel. Any detected inconsistency is surfaced for officer
            review rather than treated as a legal or fraud determination.
          </p>
        </div>
      </section>

      {/* Validation checks */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Validation Checks</h2>
            <p>
              Field-level and cross-source consistency checks
            </p>
          </div>

          <ShieldAlert size={18} />
        </div>

        <div className={styles.checkList}>
          {checks.length > 0 ? (
            checks.map((check, index) => (
              <ValidationCheck
                key={check.id || check.checkId || index}
                check={check}
              />
            ))
          ) : (
            <div className={styles.empty}>
              No validation checks available.
            </div>
          )}
        </div>
      </section>

      {/* Conflicts */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Detected Conflicts</h2>
            <p>
              Differences identified across independent evidence sources
            </p>
          </div>

          <AlertTriangle size={18} />
        </div>

        {conflicts.length > 0 ? (
          <div className={styles.conflictList}>
            {conflicts.map((conflict, index) => (
              <ConflictCard
                key={conflict.id || index}
                conflict={conflict}
              />
            ))}
          </div>
        ) : (
          <div className={styles.noConflict}>
            <CheckCircle2 size={18} />

            <div>
              <strong>No conflicts detected</strong>
              <span>
                Available evidence is currently consistent across
                evaluated sources.
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Risk factors */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Risk Contribution</h2>
            <p>
              Signals contributing to investigation priority
            </p>
          </div>

          <Scale size={18} />
        </div>

        <div className={styles.riskFactors}>
          {risk?.factors?.length > 0 ? (
            risk.factors.map((factor, index) => (
              <RiskFactor
                key={factor.factor || index}
                factor={factor}
              />
            ))
          ) : (
            <div className={styles.empty}>
              No risk factors available.
            </div>
          )}
        </div>
      </section>

      {/* Officer action */}
      <section className={styles.actionCard}>
        <div className={styles.actionIcon}>
          <UserCheck size={20} />
        </div>

        <div className={styles.actionContent}>
          <span className={styles.sectionEyebrow}>
            RECOMMENDED ACTION
          </span>

          <h2>Officer Review Required</h2>

          <p>
            Review the conflicting evidence sources, inspect the original
            documents and verify the parcel before taking an administrative
            decision.
          </p>
        </div>

        <button
          type="button"
          className={styles.reviewButton}
          onClick={() => router.push("/verification")}
        >
          Open Verification Queue
        </button>
      </section>

      {/* Methodology */}
      <section className={styles.methodology}>
        <Info size={16} />

        <div>
          <strong>How validation works</strong>

          <p>
            Bharat Vault does not determine legal ownership or declare
            fraud. It reconciles available evidence, identifies
            inconsistencies and assigns investigation priority so that
            authorized officers can make evidence-assisted decisions.
          </p>
        </div>
      </section>
    </div>
  );
}

/* =========================================
   SUMMARY CARD
========================================= */

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  variant = "",
}) {
  return (
    <div className={`${styles.summaryCard} ${styles[variant]}`}>
      <div className={styles.summaryIcon}>
        <Icon size={17} />
      </div>

      <span>{label}</span>

      <strong>{value}</strong>

      <small>{description}</small>
    </div>
  );
}

/* =========================================
   VALIDATION CHECK
========================================= */

function ValidationCheck({ check }) {
  const status = normalizeStatus(check.status || check.result);

  const warning =
    status === "WARNING" ||
    status === "REVIEW" ||
    status === "FAIL";

  return (
    <div className={styles.checkRow}>
      <div
        className={
          warning
            ? styles.checkIconWarning
            : styles.checkIconSuccess
        }
      >
        {warning ? (
          <AlertTriangle size={16} />
        ) : (
          <CheckCircle2 size={16} />
        )}
      </div>

      <div className={styles.checkMain}>
        <div className={styles.checkTitle}>
          <strong>
            {check.name ||
              check.checkName ||
              check.type ||
              "Validation Check"}
          </strong>

          <StatusBadge status={status} />
        </div>

        <p>
          {check.description ||
            check.message ||
            "Validation rule evaluated successfully."}
        </p>

        {(check.source || check.field || check.value) && (
          <div className={styles.checkMeta}>
            {check.field && (
              <span>
                Field: <strong>{check.field}</strong>
              </span>
            )}

            {check.source && (
              <span>
                Source: <strong>{check.source}</strong>
              </span>
            )}

            {check.value !== undefined && (
              <span>
                Value: <strong>{String(check.value)}</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================
   CONFLICT CARD
========================================= */

function ConflictCard({ conflict }) {
  return (
    <div className={styles.conflictCard}>
      <div className={styles.conflictHeader}>
        <div className={styles.conflictIcon}>
          <AlertTriangle size={17} />
        </div>

        <div>
          <strong>
            {conflict.title ||
              conflict.type ||
              conflict.conflictType ||
              "Evidence Conflict"}
          </strong>

          <span>
            {conflict.severity
              ? `${conflict.severity} severity`
              : "Requires review"}
          </span>
        </div>

        {conflict.severity && (
          <span className={styles.severity}>
            {conflict.severity}
          </span>
        )}
      </div>

      <p>
        {conflict.description ||
          conflict.message ||
          "A difference was identified between available evidence sources."}
      </p>

      <div className={styles.conflictValues}>
        <ConflictValue
          label={conflict.sourceA || "Source A"}
          value={
            conflict.valueA ??
            conflict.sourceAValue ??
            conflict.expectedValue ??
            "—"
          }
        />

        <div className={styles.conflictArrow}>≠</div>

        <ConflictValue
          label={conflict.sourceB || "Source B"}
          value={
            conflict.valueB ??
            conflict.sourceBValue ??
            conflict.actualValue ??
            "—"
          }
        />
      </div>
    </div>
  );
}

function ConflictValue({ label, value }) {
  return (
    <div className={styles.conflictValue}>
      <span>{label}</span>
      <strong>{String(value)}</strong>
    </div>
  );
}

/* =========================================
   RISK FACTOR
========================================= */

function RiskFactor({ factor }) {
  const impact = Number(factor.impact) || 0;

  return (
    <div className={styles.riskFactor}>
      <div>
        <span>{factor.factor}</span>

        {factor.description && (
          <small>{factor.description}</small>
        )}
      </div>

      <div className={styles.impact}>
        <div className={styles.impactBar}>
          <span
            style={{
              width: `${Math.min(Math.max(impact, 0), 100)}%`,
            }}
          />
        </div>

        <strong>+{impact}</strong>
      </div>
    </div>
  );
}

/* =========================================
   STATUS BADGE
========================================= */

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  let Icon = CheckCircle2;

  if (
    normalized === "WARNING" ||
    normalized === "REVIEW REQUIRED" ||
    normalized === "FAIL"
  ) {
    Icon = AlertTriangle;
  }

  if (normalized === "PENDING") {
    Icon = Clock3;
  }

  return (
    <span
      className={`${styles.statusBadge} ${
        styles[`status${normalized.replaceAll(" ", "")}`] || ""
      }`}
    >
      <Icon size={12} />
      {normalized}
    </span>
  );
}

/* =========================================
   HELPERS
========================================= */

function normalizeStatus(status) {
  if (!status) return "UNKNOWN";

  const value = String(status)
    .trim()
    .toUpperCase()
    .replaceAll("_", " ");

  if (value === "PASS" || value === "PASSED") {
    return "PASSED";
  }

  if (value === "FAIL" || value === "FAILED") {
    return "FAIL";
  }

  if (value === "WARN") {
    return "WARNING";
  }

  return value;
}

function formatConfidence(value) {
  if (value === undefined || value === null) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  if (number <= 1) {
    return `${Math.round(number * 100)}%`;
  }

  return `${Math.round(number)}%`;
}
