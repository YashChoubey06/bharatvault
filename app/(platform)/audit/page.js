"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  FileText,
  UserCheck,
  BrainCircuit,
  AlertTriangle,
  ClipboardCheck,
  ChevronDown,
} from "lucide-react";

import { getAuditLogs } from "@/services/api/audit";

import styles from "./audit.module.css";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionLabel(action) {
  const labels = {
    DOCUMENT_UPLOADED: "Document Uploaded",
    OCR_COMPLETED: "OCR Completed",
    VALIDATION_COMPLETED: "Validation Completed",
    RISK_ASSESSED: "Risk Assessed",
    CASE_ASSIGNED: "Case Assigned",
    CASE_DECISION_RECORDED: "Case Decision Recorded",
  };

  return labels[action] || action || "System Action";
}

function getActionIcon(action) {
  if (action?.includes("DOCUMENT")) {
    return FileText;
  }

  if (action?.includes("OCR")) {
    return BrainCircuit;
  }

  if (action?.includes("VALIDATION")) {
    return ClipboardCheck;
  }

  if (action?.includes("RISK")) {
    return AlertTriangle;
  }

  if (
    action?.includes("CASE") &&
    action?.includes("ASSIGNED")
  ) {
    return UserCheck;
  }

  if (action?.includes("DECISION")) {
    return ShieldCheck;
  }

  return ShieldCheck;
}

function getActionClass(action) {
  if (action?.includes("RISK")) {
    return styles.riskAction;
  }

  if (action?.includes("DECISION")) {
    return styles.decisionAction;
  }

  if (action?.includes("VALIDATION")) {
    return styles.validationAction;
  }

  return styles.defaultAction;
}

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState(null);

  async function loadAuditLogs() {
    try {
      setLoading(true);
      setError("");

      const data = await getAuditLogs();

      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const actionTypes = useMemo(() => {
    return [
      ...new Set(
        logs
          .map((log) => log.action)
          .filter(Boolean)
      ),
    ];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        !term ||
        String(log.id || "")
          .toLowerCase()
          .includes(term) ||
        String(log.entityId || "")
          .toLowerCase()
          .includes(term) ||
        String(log.user || "")
          .toLowerCase()
          .includes(term) ||
        String(log.description || "")
          .toLowerCase()
          .includes(term);

      const matchesAction =
        actionFilter === "ALL" ||
        log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter]);

  const stats = useMemo(() => {
    const uniqueUsers = new Set(
      logs
        .map((item) => item.user)
        .filter(Boolean)
    );

    const riskActions = logs.filter((item) =>
      item.action?.includes("RISK")
    ).length;

    const officerActions = logs.filter(
      (item) =>
        item.action?.includes("CASE") ||
        item.action?.includes("DECISION")
    ).length;

    return {
      total: logs.length,
      users: uniqueUsers.size,
      riskActions,
      officerActions,
    };
  }, [logs]);

  if (loading) {
    return (
      <div className={styles.stateCard}>
        <div className={styles.loader} />
        <p>Loading audit trail...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard}>
          <AlertTriangle size={22} />

          <div>
            <strong>Unable to load audit trail</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={loadAuditLogs}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            SECURITY & GOVERNANCE
          </div>

          <h1>Audit Trail</h1>

          <p>
            Trace important system and officer actions
            across the Bharat Vault verification lifecycle.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={loadAuditLogs}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {/* TRUST BANNER */}
      <section className={styles.trustBanner}>
        <div className={styles.trustIcon}>
          <ShieldCheck size={20} />
        </div>

        <div>
          <strong>Evidence-linked auditability</strong>

          <p>
            Every significant processing and verification
            action is recorded with an actor, timestamp,
            affected entity and action metadata.
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className={styles.statsGrid}>
        <StatCard
          icon={ShieldCheck}
          label="Total Events"
          value={stats.total}
        />

        <StatCard
          icon={UserCheck}
          label="Active Actors"
          value={stats.users}
        />

        <StatCard
          icon={AlertTriangle}
          label="Risk Events"
          value={stats.riskActions}
        />

        <StatCard
          icon={ClipboardCheck}
          label="Officer Actions"
          value={stats.officerActions}
        />
      </section>

      {/* TOOLBAR */}
      <section className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} />

          <input
            type="text"
            placeholder="Search audit ID, entity, user or description..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className={styles.filterBox}>
          <select
            value={actionFilter}
            onChange={(event) =>
              setActionFilter(event.target.value)
            }
          >
            <option value="ALL">
              All Actions
            </option>

            {actionTypes.map((action) => (
              <option
                value={action}
                key={action}
              >
                {getActionLabel(action)}
              </option>
            ))}
          </select>

          <ChevronDown size={15} />
        </div>
      </section>

      {/* RESULT COUNT */}
      <div className={styles.resultMeta}>
        <span>
          Showing{" "}
          <strong>{filteredLogs.length}</strong>{" "}
          of{" "}
          <strong>{logs.length}</strong>{" "}
          audit events
        </span>
      </div>

      {/* AUDIT TABLE */}
      <section className={styles.auditCard}>
        {filteredLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <ShieldCheck size={30} />

            <strong>No audit events found</strong>

            <p>
              Try changing your search or action filter.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor</th>
                  <th>Timestamp</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => {
                  const Icon = getActionIcon(
                    log.action
                  );

                  const expanded =
                    expandedId === log.id;

                  return (
                    <AuditRow
                      key={log.id}
                      log={log}
                      Icon={Icon}
                      expanded={expanded}
                      onToggle={() =>
                        setExpandedId(
                          expanded
                            ? null
                            : log.id
                        )
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* METHODOLOGY */}
      <section className={styles.methodology}>
        <div className={styles.methodologyIcon}>
          <ShieldCheck size={18} />
        </div>

        <div>
          <strong>
            Audit trail design
          </strong>

          <p>
            The demo records the lifecycle of documents,
            OCR processing, validation, risk assessment,
            case assignment and officer decisions. In
            production, these events can be persisted in
            an append-oriented audit store with
            cryptographic hash chaining to provide
            tamper-evident history.
          </p>
        </div>
      </section>
    </div>
  );
}

function AuditRow({
  log,
  Icon,
  expanded,
  onToggle,
}) {
  return (
    <>
      <tr
        className={
          expanded
            ? styles.expandedRow
            : ""
        }
      >
        <td>
          <div className={styles.eventCell}>
            <div
              className={`${styles.actionIcon} ${
                getActionClass(log.action)
              }`}
            >
              <Icon size={15} />
            </div>

            <div>
              <strong>
                {log.id || "AUD-—"}
              </strong>

              <span>
                Audit Event
              </span>
            </div>
          </div>
        </td>

        <td>
          <span className={styles.actionBadge}>
            {getActionLabel(log.action)}
          </span>
        </td>

        <td>
          <span className={styles.entityId}>
            {log.entityId || "—"}
          </span>
        </td>

        <td>
          <span className={styles.actor}>
            {log.user || "SYSTEM"}
          </span>
        </td>

        <td>
          <span className={styles.timestamp}>
            {formatDate(log.timestamp)}
          </span>
        </td>

        <td>
          <button
            type="button"
            className={styles.detailsButton}
            onClick={onToggle}
          >
            {expanded ? "Hide" : "Details"}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className={styles.detailsRow}>
          <td colSpan="6">
            <div className={styles.detailsPanel}>
              <div>
                <span>Description</span>
                <strong>
                  {log.description ||
                    "No description available."}
                </strong>
              </div>

              <div>
                <span>Event ID</span>
                <strong>
                  {log.id || "—"}
                </strong>
              </div>

              <div>
                <span>Entity ID</span>
                <strong>
                  {log.entityId || "—"}
                </strong>
              </div>

              <div>
                <span>Actor</span>
                <strong>
                  {log.user || "SYSTEM"}
                </strong>
              </div>

              {log.metadata && (
                <div className={styles.metadataBlock}>
                  <span>Metadata</span>

                  <pre>
                    {JSON.stringify(
                      log.metadata,
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>
        <Icon size={18} />
      </div>

      <div>
        <span>{label}</span>
        <strong>
          {Number(value || 0).toLocaleString(
            "en-IN"
          )}
        </strong>
      </div>
    </div>
  );
}
