"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";
import AssistantPanel from "./AssistantPanel";
import styles from "./assistant.module.css";

export default function AssistantWidget({ parcelId }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <AssistantPanel
          parcelId={parcelId}
          onClose={() => setOpen(false)}
        />
      )}

      <button
        type="button"
        className={`${styles.floatingButton} ${
          open ? styles.floatingButtonOpen : ""
        }`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close Evidence Assistant" : "Open Evidence Assistant"}
      >
        {open ? <X size={21} /> : <Bot size={22} />}

        {!open && <span className={styles.statusDot} />}
      </button>
    </>
  );
}