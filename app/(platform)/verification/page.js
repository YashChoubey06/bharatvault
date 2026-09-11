"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  Clock3,
  ArrowUpRight,
  Filter,
  RefreshCw,
  UserRound,
  Map,
  FileWarning,
} from "lucide-react";

import { getVerificationCases } from "@/services/api/verification";

import styles from "./verification.module.css";

export default function VerificationPage() {
  const router = useRouter();

  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCases() {
    try {
      setLoading(true);
      setError("");

      const data = await getVerificationCases();
      setCases(data || []);
    } catch (err) {
      setError(err.message || "Unable to load verification cases.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase();

    return cases.filter((item) => {
      const parcel = item.parcel;
      const assignedUser = item.assignedUser;

      const matchesSearch =
        !term ||
        item.id?.toLowerCase().includes(term) ||
        item.parcelId?.toLowerCase().includes(term) ||
        parcel?.surveyNumber?.toLowerCase().includes(term) ||
        parcel?.currentRecordedOwner
          ?.toLowerCase()
          .includes(term) ||
        assignedUser?.name?.toLowerCase().includes(term);

      const matchesRisk =
        riskFilter === "ALL" ||
        item.priority?.toUpperCase() === riskFilter ||
        item.riskLevel?.toUpperCase() === riskFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status?.toUpperCase() === statusFilter;

      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [cases, search, riskFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: cases.length,

      pending: cases.filter(
        (item) => item.status?.toUpperCase() === "PENDING_REVIEW"
      ).length,

      high: cases.filter(
        (item) =>
          item.priority?.toUpperCase() === "HIGH" ||
          item.riskLevel?.toUpperCase() === "HIGH"
      ).length,

      critical: cases.filter(
        (item) =>
          item.priority?.toUpperCase() === "CRITICAL" ||
          item.riskLevel?.toUpperCase() === "CRITICAL"
      ).length,
    };
  }, [cases]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            HUMAN-IN-THE-LOOP VERIFICATION
          </div>

          <h1>Verification Queue</h1>

          <p>
            Review AI-detected inconsistencies and make
            evidence-assisted verification decisions.
          </p>
        </div>

        <button
          className={styles.refreshButton}
          onClick={loadCases}
          disabled={loading}
        >
          <RefreshCw
            size={15}
            className={loading ? styles.spinning : ""}
          />
          Refresh
        </button>
      </header>

      {/* Stats */}
      <section className={styles.statsGrid}>
        <StatCard
          icon={<ShieldCheck size={19} />}
          label="Total Cases"
          value={stats.total}
          description="Verification cases"
        />

        <StatCard
          icon={<Clock3 size={19} />}
          label="Pending Review"
          value={stats.pending}
          description="Awaiting officer action"
        />

        <StatCard
          icon={<AlertTriangle size={19} />}
          label="High Priority"
          value={stats.high}
          description="Requires attention"
        />

        <StatCard
          icon={<FileWarning size={19} />}
          label="Critical"
          value={stats.critical}
          description="Immediate review"
        />
      </section>

      {/* Main Card */}
      <section className={styles.mainCard}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} />

            <input
              type="text"
              placeholder="Search case, parcel, survey or owner..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className={styles.filters}>
            <div className={styles.filterControl}>
              <Filter size={14} />

              <select
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(event.target.value)
                }
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <select
              className={styles.statusSelect}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="ALL">All Status</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadCases} />
        ) : filteredCases.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>CASE</th>
                  <th>PARCEL</th>
                  <th>RISK</th>
                  <th>REASON</th>
                  <th>ASSIGNED OFFICER</th>
                  <th>STATUS</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredCases.map((item) => (
                  <VerificationRow
                    key={item.id}
                    item={item}
                    onOpen={() =>
                      router.push(`/verification/${item.id}`)
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Explanation */}
      <section className={styles.infoBanner}>
        <div className={styles.infoIcon}>
          <ShieldCheck size={18} />
        </div>

        <div>
          <h3>Officer decision remains final</h3>

          <p>
            Bharat Vault uses AI to identify inconsistencies,
            organize supporting evidence and prioritize cases.
            The system does not independently declare fraud,
            ownership or legal title.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------
   Stat Card
--------------------------------------------------------- */

function StatCard({ icon, label, value, description }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Verification Row
--------------------------------------------------------- */

function VerificationRow({ item, onOpen }) {
  const parcel = item.parcel;
  const assignedUser = item.assignedUser;

  const priority =
    item.priority ||
    item.riskLevel ||
    "—";

  const status = item.status || "—";

  const reason =
    item.reason ||
    item.reasons?.[0] ||
    item.description ||
    "Evidence review required";

  return (
    <tr>
      <td>
        <div className={styles.caseCell}>
          <strong>{item.id}</strong>

          {item.createdAt && (
            <span>{formatDate(item.createdAt)}</span>
          )}
        </div>
      </td>

      <td>
        <div className={styles.parcelCell}>
          <Map size={14} />

          <div>
            <strong>{item.parcelId}</strong>

            <span>
              Survey {parcel?.surveyNumber || "—"}
            </span>
          </div>
        </div>
      </td>

      <td>
        <RiskBadge level={priority} />
      </td>

      <td>
        <div className={styles.reasonCell}>
          <span>{reason}</span>
        </div>
      </td>

      <td>
        {assignedUser ? (
          <div className={styles.officerCell}>
            <div className={styles.avatar}>
              <UserRound size={13} />
            </div>

            <div>
              <strong>{assignedUser.name}</strong>

              <span>
                {assignedUser.role || "Revenue Officer"}
              </span>
            </div>
          </div>
        ) : (
          <span className={styles.unassigned}>
            Unassigned
          </span>
        )}
      </td>

      <td>
        <StatusBadge status={status} />
      </td>

      <td>
        <button
          className={styles.openButton}
          onClick={onOpen}
        >
          Open
          <ArrowUpRight size={14} />
        </button>
      </td>
    </tr>
  );
}

/* ---------------------------------------------------------
   Risk Badge
--------------------------------------------------------- */

function RiskBadge({ level }) {
  const normalized = String(level).toUpperCase();

  return (
    <span
      className={`${styles.riskBadge} ${
        styles[`risk_${normalized.toLowerCase()}`] || ""
      }`}
    >
      <span />
      {normalized}
    </span>
  );
}

/* ---------------------------------------------------------
   Status Badge
--------------------------------------------------------- */

function StatusBadge({ status }) {
  const normalized = String(status).toUpperCase();

  const label = normalized
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <span
      className={`${styles.statusBadge} ${
        normalized === "PENDING_REVIEW"
          ? styles.statusPending
          : normalized === "VERIFIED"
            ? styles.statusVerified
            : normalized === "REJECTED"
              ? styles.statusRejected
              : ""
      }`}
    >
      {label}
    </span>
  );
}

/* ---------------------------------------------------------
   Loading
--------------------------------------------------------- */

function LoadingState() {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>Loading verification cases...</p>
    </div>
  );
}

/* ---------------------------------------------------------
   Error
--------------------------------------------------------- */

function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.empty}>
      <AlertTriangle size={24} />

      <h3>Unable to load cases</h3>

      <p>{message}</p>

      <button onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

/* ---------------------------------------------------------
   Empty
--------------------------------------------------------- */

function EmptyState({ search }) {
  return (
    <div className={styles.empty}>
      <Search size={24} />

      <h3>No verification cases found</h3>

      <p>
        {search
          ? "Try a different search term."
          : "There are currently no cases matching these filters."}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------
   Date
--------------------------------------------------------- */

function formatDate(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}
