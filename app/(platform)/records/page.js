"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

import { getParcels } from "@/services/api/parcels";

import styles from "./records.module.css";

export default function RecordsPage() {
  const router = useRouter();

  const [parcels, setParcels] = useState([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [villageFilter, setVillageFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadParcels() {
      try {
        setLoading(true);
        setError("");

        const data = await getParcels();
        setParcels(data);
      } catch (err) {
        setError(
          err.message || "Unable to load land records."
        );
      } finally {
        setLoading(false);
      }
    }

    loadParcels();
  }, []);

  const villages = useMemo(() => {
    const uniqueVillages = parcels
      .map((parcel) => parcel.village?.name)
      .filter(Boolean);

    return [...new Set(uniqueVillages)];
  }, [parcels]);

  const filteredParcels = useMemo(() => {
    const term = search.trim().toLowerCase();

    return parcels.filter((parcel) => {
      const matchesSearch =
        !term ||
        parcel.id?.toLowerCase().includes(term) ||
        parcel.surveyNumber
          ?.toLowerCase()
          .includes(term) ||
        parcel.khataNumber
          ?.toLowerCase()
          .includes(term) ||
        parcel.currentRecordedOwner
          ?.toLowerCase()
          .includes(term);

      const matchesRisk =
        riskFilter === "ALL" ||
        parcel.riskLevel === riskFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        parcel.status === statusFilter;

      const matchesVillage =
        villageFilter === "ALL" ||
        parcel.village?.name === villageFilter;

      return (
        matchesSearch &&
        matchesRisk &&
        matchesStatus &&
        matchesVillage
      );
    });
  }, [
    parcels,
    search,
    riskFilter,
    statusFilter,
    villageFilter,
  ]);

  function clearFilters() {
    setSearch("");
    setRiskFilter("ALL");
    setStatusFilter("ALL");
    setVillageFilter("ALL");
  }

  function openParcel(parcelId) {
    router.push(`/records/${parcelId}`);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>
            LAND RECORD MANAGEMENT
          </div>

          <h1>Land Records</h1>

          <p>
            Search, review and investigate digitized land
            records across available sources.
          </p>
        </div>

        <div className={styles.headerMeta}>
          <div className={styles.recordCount}>
            <span>Total Records</span>
            <strong>{parcels.length}</strong>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={17} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search survey number, khata, owner or parcel ID..."
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className={styles.clearSearch}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className={styles.filters}>
          <div className={styles.filterItem}>
            <SlidersHorizontal size={14} />

            <select
              value={villageFilter}
              onChange={(event) =>
                setVillageFilter(event.target.value)
              }
            >
              <option value="ALL">All Villages</option>

              {villages.map((village) => (
                <option
                  key={village}
                  value={village}
                >
                  {village}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(event.target.value)
              }
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="CRITICAL">
                Critical Risk
              </option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="REVIEW_REQUIRED">
                Review Required
              </option>
              <option value="PROCESSING">
                Processing
              </option>
            </select>
          </div>

          {(search ||
            riskFilter !== "ALL" ||
            statusFilter !== "ALL" ||
            villageFilter !== "ALL") && (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results summary */}
      <div className={styles.resultsBar}>
        <div>
          Showing{" "}
          <strong>{filteredParcels.length}</strong>{" "}
          of {parcels.length} records
        </div>

        <div className={styles.resultsHint}>
          <ShieldCheck size={14} />
          Evidence-linked records
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.stateCard}>
          <RefreshCw
            size={20}
            className={styles.spinner}
          />

          <span>Loading land records...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className={styles.errorCard}>
          <AlertTriangle size={20} />

          <div>
            <strong>Unable to load records</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        filteredParcels.length === 0 && (
          <div className={styles.emptyCard}>
            <Search size={24} />

            <h3>No records found</h3>

            <p>
              Try changing your search term or clearing
              the active filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

      {/* Desktop table */}
      {!loading &&
        !error &&
        filteredParcels.length > 0 && (
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Parcel</th>
                    <th>Location</th>
                    <th>Recorded Owner</th>
                    <th>Area</th>
                    <th>Record Health</th>
                    <th>Risk</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredParcels.map((parcel) => (
                    <tr
                      key={parcel.id}
                      onClick={() =>
                        openParcel(parcel.id)
                      }
                    >
                      {/* Parcel */}
                      <td>
                        <div className={styles.parcelCell}>
                          <strong>{parcel.id}</strong>

                          <span>
                            Survey {parcel.surveyNumber}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td>
                        <div className={styles.locationCell}>
                          <MapPin size={14} />

                          <div>
                            <strong>
                              {parcel.village?.name ||
                                "Unknown"}
                            </strong>

                            <span>
                              {parcel.village?.district ||
                                "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td>
                        <div className={styles.ownerCell}>
                          {parcel.currentRecordedOwner}
                        </div>
                      </td>

                      {/* Area */}
                      <td>
                        <div className={styles.areaCell}>
                          <strong>
                            {Number(
                              parcel.recordedArea
                            ).toFixed(2)}
                          </strong>

                          <span>ha</span>
                        </div>
                      </td>

                      {/* Health */}
                      <td>
                        <HealthIndicator
                          value={parcel.healthScore}
                        />
                      </td>

                      {/* Risk */}
                      <td>
                        <RiskBadge
                          level={parcel.riskLevel}
                        />
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge
                          status={parcel.status}
                        />
                      </td>

                      {/* Action */}
                      <td>
                        <button
                          type="button"
                          className={styles.viewButton}
                          onClick={(event) => {
                            event.stopPropagation();
                            openParcel(parcel.id);
                          }}
                          aria-label={`Open ${parcel.id}`}
                        >
                          <ChevronRight size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}

/* ---------------------------------------
   Health Indicator
--------------------------------------- */

function HealthIndicator({ value }) {
  const score = Number(value) || 0;

  return (
    <div className={styles.health}>
      <div className={styles.healthTop}>
        <span>{score}</span>
        <small>/ 100</small>
      </div>

      <div className={styles.healthBar}>
        <div
          className={styles.healthFill}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------
   Risk Badge
--------------------------------------- */

function RiskBadge({ level }) {
  const normalized = level || "UNKNOWN";

  return (
    <span
      className={`${styles.riskBadge} ${
        styles[`risk${normalized}`] || ""
      }`}
    >
      {normalized === "HIGH" ||
      normalized === "CRITICAL" ? (
        <AlertTriangle size={12} />
      ) : normalized === "LOW" ? (
        <CheckCircle2 size={12} />
      ) : (
        <Clock3 size={12} />
      )}

      {normalized}
    </span>
  );
}

/* ---------------------------------------
   Status Badge
--------------------------------------- */

function StatusBadge({ status }) {
  const labels = {
    VERIFIED: "Verified",
    REVIEW_REQUIRED: "Review Required",
    PROCESSING: "Processing",
  };

  return (
    <span
      className={`${styles.statusBadge} ${
        styles[`status${status}`] || ""
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
