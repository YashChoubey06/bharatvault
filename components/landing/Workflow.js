import {
  Upload,
  ScanText,
  GitCompare,
  Gauge,
  UserCheck,
} from "lucide-react";

import styles from "./Workflow.module.css";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Collect Evidence",
    text: "Bring together scanned records and authorized source data.",
  },
  {
    number: "02",
    icon: ScanText,
    title: "Extract & Link",
    text: "OCR, multilingual extraction and field-level evidence linking.",
  },
  {
    number: "03",
    icon: GitCompare,
    title: "Reconcile Sources",
    text: "Compare textual, transactional, spatial and historical evidence.",
  },
  {
    number: "04",
    icon: Gauge,
    title: "Assess Risk",
    text: "Identify inconsistencies and prioritize records for review.",
  },
  {
    number: "05",
    icon: UserCheck,
    title: "Verify with Evidence",
    text: "Officers review findings and make the final verification decision.",
  },
];

export default function Workflow() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <div className={styles.eyebrow}>HOW IT WORKS</div>

          <h2>
            One parcel.
            <span> Multiple evidence signals.</span>
          </h2>

          <p>
            Bharat Vault creates a traceable verification workflow from
            document ingestion to officer review.
          </p>
        </div>

        <div className={styles.workflow}>
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div className={styles.step} key={step.number}>
                <div className={styles.stepNumber}>{step.number}</div>

                <div className={styles.icon}>
                  <Icon size={20} />
                </div>

                <h3>{step.title}</h3>

                <p>{step.text}</p>

                {index < steps.length - 1 && (
                  <div className={styles.connector} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}