"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import EvidenceViewer from "@/components/records/EvidenceViewer";
import { getParcelById } from "@/services/api/parcels";

import styles from "./evidence.module.css";

export default function EvidencePage() {
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
        setParcel(await getParcelById(recordId));
      } catch (err) {
        setError(err.message || "Unable to load parcel evidence.");
      } finally {
        setLoading(false);
      }
    }

    if (recordId) loadParcel();
  }, [recordId]);

  if (loading) {
    return <div className={styles.state}>Loading evidence viewer...</div>;
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

  return (
    <>
      <div className={styles.routeBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.push(`/records/${recordId}`)}
        >
          <ArrowLeft size={15} />
          Back to Parcel
        </button>
      </div>
      <EvidenceViewer parcel={parcel} />
    </>
  );
}
