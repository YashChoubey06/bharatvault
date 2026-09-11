"use client";
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";

import styles from "./page.module.css";
//import AssistantPanel from "@/components/assistant/AssistantPanel";

const stats = [
  {
    label: "Total Records",
    key: "totalRecords",
    icon: FileText,
  },
  {
    label: "Verified",
    key: "verifiedRecords",
    icon: ShieldCheck,
  },
  {
    label: "Review Required",
    key: "reviewRequired",
    icon: ClipboardCheck,
  },
  {
    label: "High Risk",
    key: "highRisk",
    icon: AlertTriangle,
  },
];

export default function DashboardPage() {
  const [data,setData]=useState(null),[cases,setCases]=useState([]),[error,setError]=useState("");
  useEffect(()=>{Promise.all([getDashboardStats(),getVerificationCases()]).then(([s,c])=>{setData(s);setCases(c.filter(item=>item.status==="PENDING_REVIEW"));}).catch(err=>setError(err.message));},[]);
  return (
    <div className={styles.page}>
      {error && <p role="alert">{error}</p>}
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            LAND RECORD INTELLIGENCE
          </span>

          <h1>Verification Dashboard</h1>
          <p>
            Monitor records, evidence conflicts and
            verification workload.
          </p>
        </div>

        <div className={styles.date}>
          Local MVP · {data?.totalDocuments ?? "—"} source documents
        </div>
      </div>
      

      <section className={styles.stats}>
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className={styles.statCard}
              key={stat.label}
            >
              <div className={styles.statIcon}>
                <Icon size={18} />
              </div>

              <div>
                <span>{stat.label}</span>
                <strong>{data?.[stat.key] ?? "—"}</strong>
              </div>
            </article>
          );
        })}
      </section>
      

      <section className={styles.workspace}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Priority Verification Queue</h2>
              <p>
                Records requiring officer attention.
              </p>
            </div>

            <span className={styles.badge}>
              {cases.length} PENDING
            </span>
          </div>

          <div className={styles.emptyState}>
            <ClipboardCheck size={25} />

            <strong>Verification workspace</strong>
            {cases.slice(0,5).map(item=><Link key={item.id} href={`/verification/${item.id}`}>{item.parcelId} · {item.priority} · {item.parcel?.currentRecordedOwner}</Link>)}

            <p>
              Sample parcels are synthetic. Upload source documents to start validation.
            </p>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Record Health</h2>
              <p>
                Overall quality of processed records.
              </p>
            </div>
          </div>

          <div className={styles.health}>
            <strong>{data?.recordHealth ?? "—"}%</strong>

            <span>
              Mean validation-check completion. This is not OCR accuracy or legal ownership verification.
            </span>
          </div>
        </div>
      </section>
    </div>
    
  );
}
import {useEffect,useState} from "react";
import Link from "next/link";
import {getDashboardStats} from "@/services/api/dashboard";
import {getVerificationCases} from "@/services/api/verification";
