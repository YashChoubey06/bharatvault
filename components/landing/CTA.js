import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import styles from "./CTA.module.css";

export default function CTA() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>
            <ShieldCheck size={22} />
          </div>

          <div className={styles.content}>
            <div className={styles.eyebrow}>BHARAT VAULT</div>

            <h2>
              Make land-record verification
              <span> evidence-driven.</span>
            </h2>

            <p>
              Connect fragmented records, surface inconsistencies and give
              officers the evidence they need to investigate with confidence.
            </p>

            <Link href="/dashboard" className={styles.button}>
              Open Platform
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}