"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  MapPin,
  User,
  FileText,
  ShieldAlert,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  getParcels,
  searchParcels,
} from "@/services/api/parcels";

import styles from "./parcels.module.css";

function normalizeRisk(parcel) {
  return (
    parcel.risk?.level ||
    parcel.risk?.riskLevel ||
    parcel.riskLevel ||
    parcel.risk?.category ||
    "UNKNOWN"
  ).toUpperCase();
}

function normalizeStatus(parcel) {
  return (
    parcel.status ||
    parcel.recordStatus ||
    parcel.verificationStatus ||
    "ACTIVE"
  ).toUpperCase();
}

function getOwnerName(parcel) {
  if (parcel.owner?.name) {
    return parcel.owner.name;
  }

  return (
    parcel.currentRecordedOwner ||
    parcel.ownerName ||
    "Unknown Owner"
  );
}

function getVillageName(parcel) {
  return (
    parcel.village?.name ||
    parcel.villageName ||
    "Unknown Village"
  );
}

function getArea(parcel) {
  return (
    parcel.recordedArea ??
    parcel.area ??
    parcel.totalArea ??
    parcel.risk?.recordedArea ??
    null
  );
}

function getAreaUnit(parcel) {
  return parcel.areaUnit || "ha";
}

function riskRank(risk) {
  const ranks = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    UNKNOWN: 0,
  };

  return ranks[risk] || 0;
}

export default function ParcelsPage() {
  const router = useRouter();

  const [parcels, setParcels] = useState([]);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  async function loadParcels() {
    try {
      setLoading(true);
      setError("");

      const data = await getParcels();

      setParcels(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load parcels.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(value) {
    setSearch(value);

    if (!value.trim()) {
      const data = await getParcels();
      setParcels(Array.isArray(data) ? data : []);
      return;
    }

    try {
      setSearching(true);

      const data = await searchParcels(value);

      setParcels(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Parcel search failed.");
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    loadParcels();
  }, []);

  const filteredParcels = useMemo(() => {
    return parcels
      .filter((parcel) => {
        const risk = normalizeRisk(parcel);

        const matchesRisk =
          riskFilter === "ALL" ||
          risk === riskFilter;

        const status = normalizeStatus(parcel);

        const matchesStatus =
          statusFilter === "ALL" ||
          status === statusFilter;

        return matchesRisk && matchesStatus;
      })
      .sort(
        (a, b) =>
          riskRank(normalizeRisk(b)) -
          riskRank(normalizeRisk(a))
      );
  }, [parcels, riskFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: parcels.length,

      critical: parcels.filter(
        (parcel) =>
          normalizeRisk(parcel) === "CRITICAL"
      ).length,

      high: parcels.filter(
        (parcel) =>
          normalizeRisk(parcel) === "HIGH"
      ).length,

      review: parcels.filter((parcel) => {
        const risk = normalizeRisk(parcel);

        return (
          risk === "HIGH" ||
          risk === "CRITICAL"
        );
      }).length,
    };
  }, [parcels]);

  function openParcel(parcel) {
    router.push(`/records/${parcel.id}`);
  }

  function clearFilters() {
    setSearch("");
    setRiskFilter("ALL");
    setStatusFilter("ALL");

    getParcels().then((data) => {
      setParcels(Array.isArray(data) ? data : []);
    });
  }

  const hasFilters =
    search ||
    riskFilter !== "ALL" ||
    statusFilter !== "ALL";

  if (loading) {
    return (
      <div className={styles.stateCard}>
        <div className={styles.loader} />
        <p>Loading parcel registry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard}>
          <ShieldAlert size={21} />

          <div>
            <strong>
              Unable to load parcel registry
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={loadParcels}
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
            PARCEL INTELLIGENCE
          </div>

          <h1>Parcel Registry</h1>

          <p>
            Search and inspect parcels using recorded
            ownership, location and risk information.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={loadParcels}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </header>

      {/* STATS */}
      <section className={styles.statsGrid}>
        <StatCard
          icon={MapPin}
          label="Total Parcels"
          value={stats.total}
        />

        <StatCard
          icon={ShieldAlert}
          label="High Risk"
          value={stats.high}
        />

        <StatCard
          icon={ShieldAlert}
          label="Critical"
          value={stats.critical}
          danger
        />

        <StatCard
          icon={FileText}
          label="Priority Review"
          value={stats.review}
        />
      </section>

      {/* SEARCH + FILTER */}
      <section className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} />

          <input
            value={search}
            onChange={(event) =>
              handleSearch(event.target.value)
            }
            placeholder="Search survey number, khata, owner or parcel ID..."
          />

          {searching && (
            <div className={styles.miniLoader} />
          )}

          {search && !searching && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => handleSearch("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterBox}>
            <SlidersHorizontal size={14} />

            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(event.target.value)
              }
            >
              <option value="ALL">
                All Risk Levels
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="LOW">
                Low
              </option>
            </select>
          </div>

          <div className={styles.filterBox}>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="ALL">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="VERIFIED">
                Verified
              </option>

              <option value="REVIEW">
                Review
              </option>
            </select>
          </div>

          {hasFilters && (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={clearFilters}
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* RESULTS META */}
      <div className={styles.resultsMeta}>
        <div>
          Showing{" "}
          <strong>
            {filteredParcels.length}
          </strong>{" "}
          parcels
        </div>

        {search && (
          <span>
            Search:{" "}
            <strong>{search}</strong>
          </span>
        )}
      </div>

      {/* PARCEL TABLE */}
      <section className={styles.tableCard}>
        {filteredParcels.length === 0 ? (
          <div className={styles.emptyState}>
            <Search size={30} />

            <strong>
              No parcels found
            </strong>

            <p>
              Try another search term or remove
              the applied filters.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Parcel</th>
                  <th>Survey / Khata</th>
                  <th>Recorded Owner</th>
                  <th>Location</th>
                  <th>Area</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredParcels.map((parcel) => {
                  const risk =
                    normalizeRisk(parcel);

                  const status =
                    normalizeStatus(parcel);

                  const owner =
                    getOwnerName(parcel);

                  const village =
                    getVillageName(parcel);

                  const area =
                    getArea(parcel);

                  return (
                    <tr
                      key={parcel.id}
                      onClick={() =>
                        openParcel(parcel)
                      }
                      className={styles.tableRow}
                    >
                      <td>
                        <div className={styles.parcelCell}>
                          <div className={styles.parcelIcon}>
                            <MapPin size={15} />
                          </div>

                          <div>
                            <strong>
                              {parcel.id}
                            </strong>

                            <span>
                              Parcel Record
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className={styles.identifierCell}>
                          <strong>
                            {parcel.surveyNumber ||
                              "—"}
                          </strong>

                          <span>
                            Khata{" "}
                            {parcel.khataNumber ||
                              "—"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className={styles.ownerCell}>
                          <User size={13} />

                          <span>{owner}</span>
                        </div>
                      </td>

                      <td>
                        <div className={styles.locationCell}>
                          <span>
                            {village}
                          </span>

                          {parcel.district && (
                            <small>
                              {parcel.district}
                            </small>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className={styles.area}>
                          {area !== null
                            ? `${area} ${getAreaUnit(
                                parcel
                              )}`
                            : "—"}
                        </span>
                      </td>

                      <td>
                        <RiskBadge risk={risk} />
                      </td>

                      <td>
                        <StatusBadge status={status} />
                      </td>

                      <td>
                        <button
                          type="button"
                          className={styles.openButton}
                          onClick={(event) => {
                            event.stopPropagation();
                            openParcel(parcel);
                          }}
                        >
                          Open
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* INFORMATION NOTE */}
      <section className={styles.infoNote}>
        <div className={styles.infoIcon}>
          <ShieldAlert size={17} />
        </div>

        <div>
          <strong>
            Risk is a prioritization signal
          </strong>

          <p>
            Parcel risk helps officers identify records
            that may require closer examination. It does
            not independently establish fraud, ownership
            or legal title.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  danger = false,
}) {
  return (
    <div className={styles.statCard}>
      <div
        className={`${styles.statIcon} ${
          danger ? styles.dangerIcon : ""
        }`}
      >
        <Icon size={17} />
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

function RiskBadge({ risk }) {
  const className = {
    CRITICAL: styles.criticalRisk,
    HIGH: styles.highRisk,
    MEDIUM: styles.mediumRisk,
    LOW: styles.lowRisk,
  }[risk];

  return (
    <span
      className={`${styles.riskBadge} ${
        className || styles.unknownRisk
      }`}
    >
      {risk}
    </span>
  );
}

function StatusBadge({ status }) {
  const className = {
    ACTIVE: styles.activeStatus,
    VERIFIED: styles.verifiedStatus,
    REVIEW: styles.reviewStatus,
  }[status];

  return (
    <span
      className={`${styles.statusBadge} ${
        className || styles.defaultStatus
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
