import {
  ScanSearch,
  GitBranch,
  MapPinned,
  History,
  Network,
  UserRoundCheck,
} from "lucide-react";

import styles from "./Capabilities.module.css";

const capabilities = [
  {
    icon: ScanSearch,
    title: "Evidence-linked extraction",
    text: "Every extracted field can retain its source document, page, location and confidence.",
  },
  {
    icon: GitBranch,
    title: "Multi-source validation",
    text: "Compare RoR, registration, mutation, historical and other authorized evidence.",
  },
  {
    icon: MapPinned,
    title: "Text–GIS consistency",
    text: "Surface discrepancies between textual records and spatial parcel evidence.",
  },
  {
    icon: History,
    title: "Ownership timeline",
    text: "Trace recorded ownership changes and transactions across time.",
  },
  {
    icon: Network,
    title: "Parcel evidence graph",
    text: "Connect owners, parcels, documents, transactions, mutations and disputes.",
  },
  {
    icon: UserRoundCheck,
    title: "Human-in-the-loop",
    text: "Keep the officer in control of the final verification decision.",
  },
];

export default function Capabilities() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <div className={styles.eyebrow}>CORE CAPABILITIES</div>

          <h2>
            Intelligence built around
            <span> evidence.</span>
          </h2>

          <p>
            The system does not replace the record or the officer. It makes
            the evidence easier to connect, compare and investigate.
          </p>
        </div>

        <div className={styles.grid}>
          {capabilities.map((item) => {
            const Icon = item.icon;

            return (
              <article className={styles.card} key={item.title}>
                <div className={styles.icon}>
                  <Icon size={19} />
                </div>

                <h3>{item.title}</h3>

                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}