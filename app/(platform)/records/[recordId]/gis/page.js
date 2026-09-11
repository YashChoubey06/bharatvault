"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Map,
  MapPin,
  Maximize2,
  Layers3,
  Database,
  Ruler,
  CalendarDays,
  Info,
} from "lucide-react";

import { getParcelById } from "@/services/api/parcels";

import styles from "./gis.module.css";

export default function ParcelGISPage() {
  const params = useParams();
  const router = useRouter();

  const recordId = params.recordId;

  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGIS() {
      try {
        setLoading(true);
        setError("");

        const data = await getParcelById(recordId);

        setParcel(data);
      } catch (err) {
        setError(err.message || "Unable to load GIS information.");
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadGIS();
    }
  }, [recordId]);

  const spatialData = useMemo(() => {
    if (!parcel) return null;

    const recordedArea = Number(parcel.recordedArea) || 0;

    const registrationArea =
      parcel.registration?.area !== undefined &&
      parcel.registration?.area !== null
        ? Number(parcel.registration.area)
        : null;

    const gisArea =
      parcel.gis?.area !== undefined &&
      parcel.gis?.area !== null
        ? Number(parcel.gis.area)
        : null;

    const gisDifference =
      gisArea !== null
        ? Math.abs(recordedArea - gisArea)
        : null;

    const registrationDifference =
      registrationArea !== null
        ? Math.abs(recordedArea - registrationArea)
        : null;

    return {
      recordedArea,
      registrationArea,
      gisArea,
      gisDifference,
      registrationDifference,
    };
  }, [parcel]);

  if (loading) {
    return (
      <div className={styles.state}>
        <Clock3 size={20} />
        Loading spatial intelligence...
      </div>
    );
  }

  if (error || !parcel || !parcel.gis) {
    return (
      <div className={styles.state}>
        <AlertTriangle size={20} />

        <span>
          {error || "GIS information not available for this parcel."}
        </span>

        <button
          type="button"
          onClick={() => router.push(`/records/${recordId}`)}
        >
          Back to Record
        </button>
      </div>
    );
  }

  const gis = parcel.gis;

  const hasAreaConflict =
    spatialData.gisDifference !== null &&
    spatialData.gisDifference > 0;

  const polygon = extractPolygon(gis);

  return (
    <div className={styles.page}>
      {/* =========================================
          BACK
      ========================================= */}

      <button
        type="button"
        className={styles.backButton}
        onClick={() => router.push(`/records/${recordId}`)}
      >
        <ArrowLeft size={15} />
        Back to Record
      </button>

      {/* =========================================
          HEADER
      ========================================= */}

      <header className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            LAND RECORDS / PARCEL / GIS
          </div>

          <div className={styles.titleRow}>
            <h1>Spatial Intelligence</h1>

            <span className={styles.parcelBadge}>
              {parcel.id}
            </span>
          </div>

          <p>
            Survey {parcel.surveyNumber}
            {" · "}
            {parcel.village?.name || "Unknown village"}
            {" · "}
            {parcel.village?.district || "Unknown district"}
          </p>
        </div>

        <SpatialStatus conflict={hasAreaConflict} />
      </header>

      {/* =========================================
          SPATIAL SUMMARY
      ========================================= */}

      <section className={styles.summaryGrid}>
        <SummaryCard
          icon={Ruler}
          label="GIS Area"
          value={
            spatialData.gisArea !== null
              ? `${spatialData.gisArea.toFixed(2)} ha`
              : "—"
          }
          description="Cadastral spatial record"
        />

        <SummaryCard
          icon={Database}
          label="RoR Area"
          value={`${spatialData.recordedArea.toFixed(2)} ha`}
          description="Current recorded area"
        />

        <SummaryCard
          icon={MapPin}
          label="Survey Number"
          value={parcel.surveyNumber || "—"}
          description="Spatial parcel identifier"
        />

        <SummaryCard
          icon={CalendarDays}
          label="GIS Updated"
          value={formatDate(gis.updatedAt)}
          description="Latest available spatial update"
        />
      </section>

      {/* =========================================
          AREA RECONCILIATION
      ========================================= */}

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Spatial Reconciliation</h2>

            <p>
              Comparing textual and spatial area evidence
            </p>
          </div>

          <Ruler size={18} />
        </div>

        <div className={styles.areaComparison}>
          <AreaSource
            label="Record of Rights"
            value={spatialData.recordedArea}
            source="RoR"
            status="reference"
          />

          <ComparisonArrow />

          <AreaSource
            label="Registration"
            value={spatialData.registrationArea}
            source="Registration"
            difference={spatialData.registrationDifference}
            status={
              spatialData.registrationDifference > 0
                ? "warning"
                : "verified"
            }
          />

          <ComparisonArrow />

          <AreaSource
            label="Cadastral GIS"
            value={spatialData.gisArea}
            source="GIS"
            difference={spatialData.gisDifference}
            status={hasAreaConflict ? "warning" : "verified"}
          />
        </div>

        {hasAreaConflict ? (
          <div className={styles.conflictNotice}>
            <div className={styles.noticeIcon}>
              <AlertTriangle size={17} />
            </div>

            <div>
              <strong>Spatial area discrepancy detected</strong>

              <p>
                GIS reports{" "}
                <strong>
                  {spatialData.gisArea?.toFixed(2)} ha
                </strong>{" "}
                while the current RoR records{" "}
                <strong>
                  {spatialData.recordedArea.toFixed(2)} ha
                </strong>
                . The difference is{" "}
                <strong>
                  {spatialData.gisDifference?.toFixed(2)} ha
                </strong>
                .
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.successNotice}>
            <CheckCircle2 size={17} />

            <div>
              <strong>Spatial area matches the recorded area</strong>

              <p>
                No area discrepancy was detected between the
                available RoR and GIS evidence.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* =========================================
          MAP + METADATA
      ========================================= */}

      <div className={styles.mainGrid}>
        {/* MAP */}
        <section className={`${styles.card} ${styles.mapCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Parcel Boundary</h2>

              <p>
                Cadastral GIS representation
              </p>
            </div>

            <button
              type="button"
              className={styles.iconButton}
              title="Expand map"
            >
              <Maximize2 size={15} />
            </button>
          </div>

          <div className={styles.mapContainer}>
            <div className={styles.mapGrid} />

            <div className={styles.mapLabel}>
              <Map size={15} />
              Cadastral GIS
            </div>

            {polygon ? (
              <PolygonPreview polygon={polygon} />
            ) : (
              <div className={styles.mapEmpty}>
                <Map size={28} />

                <strong>Spatial geometry available</strong>

                <span>
                  Polygon coordinates are stored in the GIS
                  record.
                </span>
              </div>
            )}

            <div className={styles.mapControls}>
              <button type="button">+</button>
              <button type="button">−</button>
            </div>

            <div className={styles.mapAttribution}>
              Spatial preview · Source: {gis.source || "GIS"}
            </div>
          </div>
        </section>

        {/* METADATA */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>GIS Metadata</h2>

              <p>
                Source and spatial record information
              </p>
            </div>

            <Layers3 size={18} />
          </div>

          <div className={styles.metadataList}>
            <MetadataItem
              label="GIS Record ID"
              value={gis.id}
            />

            <MetadataItem
              label="Survey Number"
              value={gis.surveyNumber || parcel.surveyNumber}
            />

            <MetadataItem
              label="Area"
              value={
                spatialData.gisArea !== null
                  ? `${spatialData.gisArea.toFixed(2)} ha`
                  : "—"
              }
            />

            <MetadataItem
              label="Source"
              value={gis.source || "—"}
            />

            <MetadataItem
              label="Updated At"
              value={formatDate(gis.updatedAt)}
            />

            <MetadataItem
              label="Geometry Type"
              value={getGeometryType(gis)}
            />

            <MetadataItem
              label="Coordinate System"
              value={
                gis.crs ||
                gis.coordinateReferenceSystem ||
                "Not specified"
              }
            />
          </div>
        </section>
      </div>

      {/* =========================================
          COORDINATES
      ========================================= */}

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Spatial Coordinates</h2>

            <p>
              Coordinate evidence associated with the parcel geometry
            </p>
          </div>

          <MapPin size={18} />
        </div>

        <CoordinateTable polygon={polygon} gis={gis} />
      </section>

      {/* =========================================
          INTERPRETATION
      ========================================= */}

      <section className={styles.interpretation}>
        <Info size={16} />

        <div>
          <strong>Spatial interpretation</strong>

          <p>
            GIS evidence is used to identify spatial inconsistencies
            and support officer review. A difference between textual
            and spatial area does not by itself establish ownership
            error, fraud or legal invalidity.
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
}) {
  return (
    <div className={styles.summaryCard}>
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
   SPATIAL STATUS
========================================= */

function SpatialStatus({ conflict }) {
  return (
    <div
      className={`${styles.spatialStatus} ${
        conflict
          ? styles.spatialStatusWarning
          : styles.spatialStatusSuccess
      }`}
    >
      {conflict ? (
        <AlertTriangle size={14} />
      ) : (
        <CheckCircle2 size={14} />
      )}

      <div>
        <strong>
          {conflict
            ? "SPATIAL REVIEW REQUIRED"
            : "SPATIAL CONSISTENT"}
        </strong>

        <span>
          {conflict
            ? "Area discrepancy detected"
            : "No area discrepancy detected"}
        </span>
      </div>
    </div>
  );
}

/* =========================================
   AREA SOURCE
========================================= */

function AreaSource({
  label,
  value,
  source,
  difference,
  status,
}) {
  const isWarning = status === "warning";

  return (
    <div className={styles.areaSource}>
      <div
        className={
          isWarning
            ? styles.areaIconWarning
            : styles.areaIcon
        }
      >
        {isWarning ? (
          <AlertTriangle size={15} />
        ) : (
          <CheckCircle2 size={15} />
        )}
      </div>

      <span>{label}</span>

      <strong>
        {value !== null && value !== undefined
          ? `${Number(value).toFixed(2)} ha`
          : "—"}
      </strong>

      <small>
        {difference !== undefined &&
        difference !== null &&
        difference > 0
          ? `${difference.toFixed(2)} ha difference`
          : source}
      </small>
    </div>
  );
}

/* =========================================
   COMPARISON ARROW
========================================= */

function ComparisonArrow() {
  return (
    <div className={styles.comparisonArrow}>
      →
    </div>
  );
}

/* =========================================
   METADATA
========================================= */

function MetadataItem({ label, value }) {
  return (
    <div className={styles.metadataItem}>
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

/* =========================================
   POLYGON PREVIEW
========================================= */

function PolygonPreview({ polygon }) {
  const points = polygonToSvgPoints(polygon);

  if (!points) {
    return (
      <div className={styles.mapEmpty}>
        <Map size={28} />

        <strong>Geometry available</strong>

        <span>
          Polygon data could not be rendered in preview.
        </span>
      </div>
    );
  }

  return (
    <svg
      className={styles.polygonSvg}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-label="Parcel boundary preview"
    >
      <polygon
        points={points}
        className={styles.polygon}
      />

      <circle
        cx="50"
        cy="50"
        r="1.6"
        className={styles.polygonCenter}
      />
    </svg>
  );
}

/* =========================================
   COORDINATE TABLE
========================================= */

function CoordinateTable({ polygon, gis }) {
  const coordinates = normalizeCoordinates(
    polygon || gis.coordinates || gis.geometry
  );

  if (!coordinates.length) {
    return (
      <div className={styles.empty}>
        Coordinate information is not available.
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.coordinateTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Longitude</th>
            <th>Latitude</th>
          </tr>
        </thead>

        <tbody>
          {coordinates.map((coordinate, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{coordinate[0]}</td>
              <td>{coordinate[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================
   GEOMETRY HELPERS
========================================= */

function extractPolygon(gis) {
  if (!gis) return null;

  if (Array.isArray(gis.polygon)) {
    return gis.polygon;
  }

  if (Array.isArray(gis.coordinates)) {
    return gis.coordinates;
  }

  if (gis.geometry?.coordinates) {
    return gis.geometry.coordinates;
  }

  return null;
}

function normalizeCoordinates(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  let coordinates = value;

  while (
    Array.isArray(coordinates[0]) &&
    Array.isArray(coordinates[0][0])
  ) {
    coordinates = coordinates[0];
  }

  return coordinates.filter(
    (item) =>
      Array.isArray(item) &&
      item.length >= 2 &&
      typeof item[0] === "number" &&
      typeof item[1] === "number"
  );
}

function polygonToSvgPoints(polygon) {
  const coordinates = normalizeCoordinates(polygon);

  if (coordinates.length < 3) {
    return null;
  }

  const xs = coordinates.map((point) => point[0]);
  const ys = coordinates.map((point) => point[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = maxX - minX || 1;
  const height = maxY - minY || 1;

  return coordinates
    .map(([x, y]) => {
      const normalizedX =
        ((x - minX) / width) * 80 + 10;

      const normalizedY =
        90 - ((y - minY) / height) * 80;

      return `${normalizedX},${normalizedY}`;
    })
    .join(" ");
}

function getGeometryType(gis) {
  if (gis.geometry?.type) {
    return gis.geometry.type;
  }

  if (gis.polygon || gis.coordinates) {
    return "Polygon";
  }

  return "Not specified";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
