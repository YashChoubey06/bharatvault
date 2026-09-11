"use client";

import { useState } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import styles from "./PlatformShell.module.css";

export default function PlatformShell({
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  return (
    <div className={styles.shell}>
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <Topbar
        onMenuClick={() => setMobileMenuOpen(true)}
      />

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}