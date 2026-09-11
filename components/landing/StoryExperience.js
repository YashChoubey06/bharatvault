"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpenCheck,
  Building2,
  Check,
  FileSearch,
  Fingerprint,
  Landmark,
  MapPinned,
  ScanLine,
  SearchCheck,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardStats } from "@/services/api/dashboard";
import EvidenceCard from "./EvidenceCard";
import styles from "./StoryExperience.module.css";

const chapters = [
  {
    id: "read",
    label: "Read the source",
    title: "The scan becomes searchable evidence.",
    body: "English and Hindi records are processed locally. Each recognized value keeps its source page, location and confidence instead of becoming an untraceable database entry.",
  },
  {
    id: "extract",
    label: "Extract the fields",
    title: "A value is useful only when its origin stays attached.",
    body: "Owner, survey number, khata, area and mutation details become structured fields. Low-confidence text is kept visible for an officer rather than silently accepted.",
  },
  {
    id: "compare",
    label: "Compare the record",
    title: "Independent sources are placed side by side.",
    body: "The recorded area, registration evidence and cadastral GIS are normalized and compared. A mismatch becomes a specific validation finding with the contributing sources attached.",
  },
  {
    id: "explain",
    label: "Explain the finding",
    title: "The reason for review is written in plain language.",
    body: "The evidence assistant answers within the selected parcel. It cites the record behind its answer and leaves the legal decision with the authorized officer.",
  },
];

export default function StoryExperience() {
  const { user, loading: authLoading } = useAuth();
  const [active, setActive] = useState(0);
  const [stats, setStats] = useState(null);
  const [statsState, setStatsState] = useState("idle");
  const chapterRefs = useRef([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setStatsState("signed-out");
      return;
    }
    setStatsState("loading");
    getDashboardStats()
      .then(data => { setStats(data); setStatsState("ready"); })
      .catch(() => setStatsState("unavailable"));
  }, [authLoading, user]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(Number(visible.target.dataset.chapter));
      },
      { rootMargin: "-28% 0px -46%", threshold: [0.2, 0.45, 0.7] }
    );
    chapterRefs.current.forEach(node => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  function goToChapter(index) {
    setActive(index);
    chapterRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main id="main-story" className={styles.storyRoot}>
      <section id="why" className={styles.hero} aria-labelledby="landing-title">
        <div className={styles.surveyGrid} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>A land record is only as reliable as the evidence behind it.</p>
          <h1 id="landing-title">When two records disagree, the file should show why.</h1>
          <p className={styles.lead}>
            A mutation register from 1987 names one boundary. A digital registry entry from 2020 records another. Bharat Vault reads both, links every extracted field to its source, and shows an officer exactly where the conflict begins.
          </p>
          <div className={styles.heroAction}>
            <Link href="/dashboard" className={styles.primaryAction}>Open the verification workspace</Link>
            <span>Local OCR · English and Hindi · officer reviewed</span>
          </div>
        </div>

        <div className={styles.sourceStack} aria-label="A disagreement between two land-record sources">
          <EvidenceCard marker="Mutation register · 1987" title="Recorded boundary" value="2.50 ha" note="Handwritten entry linked to survey 124/3." source="Register page 18" state="verified" icon={BookOpenCheck} />
          <EvidenceCard marker="Digital registry · 2020" title="Registered extent" value="2.20 ha" note="The later registration reports a smaller parcel area." source="Registration deed page 4" state="conflict" icon={AlertTriangle} />
        </div>
      </section>

      <section className={styles.turn} aria-labelledby="turn-title">
        <span className={styles.turnMark} aria-hidden="true"><SearchCheck size={25} /></span>
        <div>
          <h2 id="turn-title">The system does not replace the record. It makes the record answerable.</h2>
          <p>One traceable path connects the source scan, structured fields, cross-source checks, risk signals and the final human decision.</p>
        </div>
      </section>

      <section id="how-it-works" className={styles.process} aria-labelledby="process-title">
        <header className={styles.processIntro}>
          <p>Follow one parcel through verification</p>
          <h2 id="process-title">From difficult scan to review-ready evidence</h2>
        </header>

        <div className={styles.processGrid}>
          <div className={styles.stageColumn}>
            <RecordStage active={active} onSelect={goToChapter} />
          </div>

          <div className={styles.chapters}>
            {chapters.map((chapter, index) => (
              <article
                key={chapter.id}
                ref={node => { chapterRefs.current[index] = node; }}
                data-chapter={index}
                tabIndex="0"
                onFocus={() => setActive(index)}
                className={`${styles.chapter} ${active === index ? styles.chapterActive : ""}`}
                aria-current={active === index ? "step" : undefined}
              >
                <div className={styles.chapterIcon} aria-hidden="true">
                  {[ScanLine, FileSearch, MapPinned, Fingerprint].map((Icon, iconIndex) => iconIndex === index ? <Icon key={chapter.id} size={21} /> : null)}
                </div>
                <p>{chapter.label}</p>
                <h3>{chapter.title}</h3>
                <div>{chapter.body}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proof" className={styles.proof} aria-labelledby="proof-title">
        <header className={styles.proofHeading}>
          <p>Built for the people who carry the decision</p>
          <h2 id="proof-title">The same evidence, presented for the task at hand.</h2>
        </header>

        <div className={styles.proofGrid}>
          <EvidenceCard marker="Revenue officer" title="Resolve the exception" note="Review flagged values against their exact source before recording a decision." source="Evidence viewer and audit trail" state="review" icon={Landmark} />
          <EvidenceCard marker="Registry clerk" title="Catch the mismatch early" note="Compare registration, mutation and current record details before inconsistency spreads." source="Cross-source validation" state="neutral" icon={Building2} />
          <EvidenceCard marker="Citizen record check" title="Understand what is recorded" note="See which source supports a parcel detail and whether an officer has verified it." source="Traceable parcel record" state="verified" icon={UserRoundCheck} />
        </div>

        <LiveProof stats={stats} state={authLoading ? "loading" : statsState} />
      </section>

      <section className={styles.finalAction} aria-labelledby="final-title">
        <ShieldCheck size={32} aria-hidden="true" />
        <div>
          <h2 id="final-title">Start with the source. End with an accountable decision.</h2>
          <p>Open the local workspace to inspect parcels, process a record and trace every finding back to evidence.</p>
        </div>
        <Link href="/dashboard" className={styles.primaryAction}>Open Bharat Vault</Link>
      </section>
    </main>
  );
}

function RecordStage({ active, onSelect }) {
  return (
    <div className={styles.stickyStage} aria-live="polite">
      <div className={styles.stageProgress} aria-label={`Story progress: ${chapters[active].label}`}>
        {chapters.map((chapter, index) => (
          <button key={chapter.id} type="button" className={index <= active ? styles.progressComplete : ""} onClick={() => onSelect(index)} aria-label={`Show ${chapter.label}`} aria-pressed={active === index}>
            {index < active ? <Check size={13} /> : <span>{index + 1}</span>}
          </button>
        ))}
      </div>

      <div className={`${styles.recordFrame} ${styles[`stage${active}`]}`}>
        <div className={styles.recordTop}>
          <div><span>Revenue record</span><strong>Survey 124/3</strong></div>
          <span className={styles.recordState}>{chapters[active].label}</span>
        </div>

        <div className={styles.documentSheet}>
          <div className={styles.documentHeading}>जमाबंदी / RECORD OF RIGHTS</div>
          <div className={styles.scanText}>
            <span>District: Kota</span><span>Village: Rampura</span><span>Survey: 124/3</span>
            <p>Recorded owner: Suresh Kumar</p><p>Total parcel area: 2.50 hectares</p><p>Mutation status: Pending sanction</p>
          </div>
          <div className={styles.extractBox}><span>Area</span>2.50 hectares <small>94% OCR</small></div>
          <div className={styles.comparePanel}>
            <div><span>Record of Rights</span><strong>2.50 ha</strong></div>
            <div><span>Cadastral GIS</span><strong>2.20 ha</strong></div>
            <p><AlertTriangle size={15} /> 0.30 ha difference requires review</p>
          </div>
          <div className={styles.answerPanel}>
            <span>Evidence assistant</span>
            <p>The parcel is flagged because the recorded area and GIS area differ by 0.30 ha.</p>
            <small>Sources: RoR page 1, cadastral GIS record</small>
          </div>
          <div className={styles.scanBeam} aria-hidden="true" />
        </div>
      </div>

      <div className={styles.reducedSummary}>
        {chapters.map(chapter => <div key={chapter.id}><Check size={15} /><span>{chapter.label}</span></div>)}
      </div>
    </div>
  );
}

function LiveProof({ stats, state }) {
  if (state === "loading") {
    return <div className={styles.liveProof} role="status"><span className={styles.loader} />Checking the local evidence registry…</div>;
  }
  if (state === "ready" && stats) {
    return (
      <div className={styles.liveProof} aria-label="Current local system totals">
        <strong>{stats.totalRecords}</strong><span>parcel records</span>
        <strong>{stats.totalDocuments}</strong><span>source documents</span>
        <strong>{stats.reviewRequired}</strong><span>awaiting review</span>
      </div>
    );
  }
  return <div className={styles.liveProof}><ShieldCheck size={18} /><span>{state === "unavailable" ? "Local totals are temporarily unavailable." : "Sign in to see live totals from this local registry."}</span></div>;
}
