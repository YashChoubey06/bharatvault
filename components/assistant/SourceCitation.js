"use client";

import { FileText, MapPin } from "lucide-react";
import Link from "next/link";
import styles from "./assistant.module.css";

export default function SourceCitation({ source }) {
  return (
    <div className={styles.sourceItem}>
      <div className={styles.sourceIcon}>
        {source.sourceType === "GIS" ? (
          <MapPin size={13} />
        ) : (
          <FileText size={13} />
        )}
      </div>

      <div className={styles.sourceContent}>
        <strong>
          {source.documentName ||
            source.documentId ||
            source.source ||
            "Evidence source"}
        </strong>

        <span>
          {source.parcelId && source.id && <Link href={`/records/${encodeURIComponent(source.parcelId)}/evidence?field=${encodeURIComponent(source.id)}`}>View source evidence → </Link>}
          {source.field && `${source.field} · `}
          {source.page !== null &&
            source.page !== undefined &&
            `Page ${source.page}`}
        </span>

        {source.confidence !== undefined && (
          <small>
            Confidence:{" "}
            {Math.round(Number(source.confidence) * 100)}%
          </small>
        )}
      </div>
    </div>
  );
}
