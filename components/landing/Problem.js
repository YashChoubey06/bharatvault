import {
  Files,
  GitCompare,
  History,
  ArrowUpRight,
} from "lucide-react";

import styles from "./Problem.module.css";

const problems = [
  {
    number: "01",
    icon: Files,
    title: "Fragmented Records",
    description:
      "Parcel evidence is distributed across RoR, registration, mutation, maps and historical records.",
  },
  {
    number: "02",
    icon: GitCompare,
    title: "Inconsistent Evidence",
    description:
      "Different sources can report conflicting owners, areas, identifiers or transaction details.",
  },
  {
    number: "03",
    icon: History,
    title: "Disconnected History",
    description:
      "Ownership changes and historical transactions are difficult to trace across independent records.",
  },
];

export default function Problem() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <div className={styles.eyebrow}>THE CHALLENGE</div>

          <h2>
            Digitization is only
            <span> the beginning.</span>
          </h2>

          <p>
            A digital document is not automatically a validated record.
            Bharat Vault focuses on connecting the evidence behind a parcel.
          </p>
        </div>

        <div className={styles.grid}>
          {problems.map((problem) => {
            const Icon = problem.icon;

            return (
              <article className={styles.card} key={problem.number}>
                <div className={styles.cardTop}>
                  <span>{problem.number}</span>

                  <div className={styles.icon}>
                    <Icon size={19} />
                  </div>
                </div>

                <h3>{problem.title}</h3>

                <p>{problem.description}</p>

                <div className={styles.cardArrow}>
                  <ArrowUpRight size={16} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}