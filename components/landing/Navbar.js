"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

import styles from "./Navbar.module.css";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenu = () => {
    setMobileOpen(false);
  };

  return (
    <header className={styles.navbar}>
      <a className={styles.skipLink} href="#main-story">Skip to main story</a>
      <div className={styles.inner}>
        {/* Brand */}
        <Link href="/" className={styles.brand} onClick={closeMenu}>
          <div className={styles.brandIcon}>
            <ShieldCheck size={22} strokeWidth={2.2} />
          </div>

          <div className={styles.brandText}>
            <span className={styles.brandName}>Bharat Vault</span>
            <span className={styles.brandTagline}>
              Land Record Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <Link href="/#why" className={styles.navLink}>
            Why it matters
          </Link>

          <Link href="/#how-it-works" className={styles.navLink}>
            How It Works
          </Link>

          <Link href="/#proof" className={styles.navLink}>
            Who it serves
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className={styles.desktopActions}>
          <Link href="/login" className={styles.secondaryButton}>
            Sign In
          </Link>

          <Link href="/dashboard" className={styles.primaryButton}>
            Open Platform
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNav}>
            <Link
              href="/#why"
              className={styles.mobileNavLink}
              onClick={closeMenu}
            >
              Why it matters
            </Link>

            <Link
              href="/#how-it-works"
              className={styles.mobileNavLink}
              onClick={closeMenu}
            >
              How it works
            </Link>

            <Link
              href="/#proof"
              className={styles.mobileNavLink}
              onClick={closeMenu}
            >
              Who it serves
            </Link>
          </nav>

          <div className={styles.mobileActions}>
            <Link
              href="/login"
              className={styles.secondaryButton}
              onClick={closeMenu}
            >
              Sign In
            </Link>

            <Link
              href="/dashboard"
              className={styles.primaryButton}
              onClick={closeMenu}
            >
              Open Platform
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
