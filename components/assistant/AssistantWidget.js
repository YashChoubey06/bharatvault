"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, X } from "lucide-react";
import AssistantPanel from "./AssistantPanel";
import styles from "./assistant.module.css";

export default function AssistantWidget({ parcelId }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const routeParcelId = pathname?.match(/^\/records\/([^/]+)/)?.[1];
  const activeParcelId = parcelId || (routeParcelId ? decodeURIComponent(routeParcelId) : "");

  if (!activeParcelId) return null;

  return (
    <>
      {open && (
        <AssistantPanel
          parcelId={activeParcelId}
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
