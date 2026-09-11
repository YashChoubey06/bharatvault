import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Map,
  ShieldCheck,
  AlertTriangle,
  Clock3,
} from "lucide-react";

import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.gridPattern} />

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Eyebrow */}
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Evidence-driven land record intelligence
          </div>

          {/* Heading */}
          <h1 className={styles.title}>
            From fragmented records
            <span> to trusted evidence.</span>
          </h1>

          {/* Description */}
          <p className={styles.description}>
            Bharat Vault transforms scanned and historical land records into
            structured, traceable and cross-validated parcel intelligence —
            helping officers identify inconsistencies and prioritize
            verification.
          </p>

          {/* Actions */}
          <div className={styles.actions}>
            <Link href="/dashboard" className={styles.primaryButton}>
              Explore Platform
              <ArrowRight size={17} />
            </Link>

            <Link href="/how-it-works" className={styles.secondaryButton}>
              See How It Works
            </Link>
          </div>

          {/* Trust points */}
          <div className={styles.trustPoints}>
            <div className={styles.trustItem}>
              <CheckCircle2 size={16} />
              Evidence-linked extraction
            </div>

            <div className={styles.trustItem}>
              <CheckCircle2 size={16} />
              Multi-source reconciliation
            </div>

            <div className={styles.trustItem}>
              <CheckCircle2 size={16} />
              Human-in-the-loop verification
            </div>
          </div>
        </div>

        {/* Intelligence Preview */}
        <div className={styles.previewWrapper}>
          <div className={styles.previewGlow} />

          <div className={styles.previewCard}>
            {/* Card Header */}
            <div className={styles.previewHeader}>
              <div>
                <span className={styles.previewLabel}>
                  PARCEL INTELLIGENCE
                </span>

                <h2 className={styles.parcelNumber}>
                  Survey No. 124/3
                </h2>
              </div>

              <div className={styles.riskBadge}>
                <span />
                HIGH RISK
              </div>
            </div>

            {/* Owner */}
            <div className={styles.ownerBlock}>
              <div className={styles.ownerAvatar}>SK</div>

              <div>
                <span className={styles.mutedLabel}>CURRENT RECORDED OWNER</span>
                <strong>Suresh Kumar</strong>
              </div>

              <div className={styles.health}>
                <span className={styles.mutedLabel}>RECORD HEALTH</span>
                <strong>87/100</strong>
              </div>
            </div>

            {/* Evidence rows */}
            <div className={styles.evidenceList}>
              <EvidenceRow
                icon={<FileSearch size={17} />}
                label="RoR"
                value="2.50 ha"
                status="Verified"
                type="verified"
              />

              <EvidenceRow
                icon={<FileSearch size={17} />}
                label="Registration"
                value="2.45 ha"
                status="Review"
                type="review"
              />

              <EvidenceRow
                icon={<Map size={17} />}
                label="GIS"
                value="2.20 ha"
                status="Conflict"
                type="conflict"
              />
            </div>

            {/* Conflict */}
            <div className={styles.conflictBox}>
              <div className={styles.conflictIcon}>
                <AlertTriangle size={17} />
              </div>

              <div>
                <strong>Area consistency requires review</strong>

                <p>
                  Independent sources report different parcel areas.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.previewFooter}>
              <div className={styles.footerMeta}>
                <Clock3 size={14} />
                3 validation signals require review
              </div>

              <ShieldCheck size={18} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EvidenceRow({ icon, label, value, status, type }) {
  return (
    <div className={styles.evidenceRow}>
      <div className={styles.sourceInfo}>
        <div className={styles.sourceIcon}>{icon}</div>

        <div>
          <strong>{label}</strong>
          <span>{value}</span>
        </div>
      </div>

      <span className={`${styles.status} ${styles[type]}`}>
        {status}
      </span>
    </div>
  );
}