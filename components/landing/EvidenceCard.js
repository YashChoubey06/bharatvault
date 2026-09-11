import Link from "next/link";
import styles from "./EvidenceCard.module.css";

export default function EvidenceCard({
  marker,
  title,
  value,
  note,
  source,
  state = "neutral",
  href,
  icon: Icon,
}) {
  const content = (
    <>
      <span className={styles.marginRule} aria-hidden="true" />
      <div className={styles.cardHead}>
        <span className={styles.marker}>{marker}</span>
        {Icon && <Icon size={20} aria-hidden="true" />}
      </div>
      <h3>{title}</h3>
      {value && <strong className={styles.value}>{value}</strong>}
      <p>{note}</p>
      <footer>
        <span>{source}</span>
        <span className={`${styles.stamp} ${styles[state]}`}>{state}</span>
      </footer>
    </>
  );

  return href ? (
    <Link href={href} className={`${styles.card} ${styles.interactive}`}>
      {content}
    </Link>
  ) : (
    <article className={styles.card}>{content}</article>
  );
}
