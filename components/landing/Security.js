import {
  LockKeyhole,
  FileCheck2,
  Link2,
  ShieldCheck,
} from "lucide-react";

import styles from "./Security.module.css";

const securityItems = [
  {
    icon: LockKeyhole,
    title: "Controlled Access",
    text: "Role-aware access keeps sensitive records available only to authorized users.",
  },
  {
    icon: FileCheck2,
    title: "Evidence Provenance",
    text: "Verification findings remain connected to their supporting source evidence.",
  },
  {
    icon: Link2,
    title: "Tamper-Evident Audit",
    text: "Hash-linked audit records make unauthorized changes detectable.",
  },
];

export default function Security() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <div className={styles.eyebrow}>TRUST & SECURITY</div>

          <h2>
            Every decision should have
            <span> an evidence trail.</span>
          </h2>

          <p>
            Bharat Vault is designed around traceability, controlled access
            and accountable human verification.
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.items}>
            {securityItems.map((item) => {
              const Icon = item.icon;

              return (
                <article className={styles.item} key={item.title}>
                  <div className={styles.icon}>
                    <Icon size={19} />
                  </div>

                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className={styles.auditCard}>
            <div className={styles.auditHeader}>
              <div>
                <span>VERIFICATION AUDIT</span>
                <strong>Evidence trail</strong>
              </div>

              <ShieldCheck size={22} />
            </div>

            <div className={styles.auditChain}>
              <AuditNode
                title="Document uploaded"
                hash="8f3a...91c2"
              />

              <div className={styles.chainLine} />

              <AuditNode
                title="OCR completed"
                hash="31d7...ac08"
              />

              <div className={styles.chainLine} />

              <AuditNode
                title="Validation assessed"
                hash="a29c...7bd1"
              />

              <div className={styles.chainLine} />

              <AuditNode
                title="Officer review"
                hash="pending"
                pending
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuditNode({ title, hash, pending }) {
  return (
    <div className={styles.auditNode}>
      <div
        className={`${styles.nodeDot} ${
          pending ? styles.pending : ""
        }`}
      />

      <div>
        <strong>{title}</strong>
        <span>{hash}</span>
      </div>
    </div>
  );
}