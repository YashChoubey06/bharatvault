"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Files,
  Map,
  ClipboardCheck,
  BarChart3,
  History,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import styles from "./Sidebar.module.css";

const navigation = [
  {
    section: "WORKSPACE",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Records",
        href: "/records",
        icon: FileText,
      },
      {
        label: "Documents",
        href: "/documents",
        icon: Files,
      },
      {
        label: "Parcels",
        href: "/parcels",
        icon: Map,
      },
      {
        label: "Verification",
        href: "/verification",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    section: "INSIGHTS",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
      {
        label: "Audit Trail",
        href: "/audit",
        icon: History,
      },
    ],
  },
];

export default function Sidebar({
  mobileOpen,
  onClose,
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [logoutError,setLogoutError] = useState("");

  return (
    <>
      {mobileOpen && (
        <button
          className={styles.overlay}
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`${styles.sidebar} ${
          mobileOpen ? styles.mobileOpen : ""
        }`}
      >
        <div className={styles.header}>
          <Link
            href="/dashboard"
            className={styles.brand}
            onClick={onClose}
          >
            <div className={styles.brandIcon}>
              <ShieldCheck size={20} />
            </div>

            <div>
              <strong>Bharat Vault</strong>
              <span>Land Intelligence</span>
            </div>
          </Link>

          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.navigation}>
          {navigation.map((group) => (
            <div
              className={styles.navGroup}
              key={group.section}
            >
              <span className={styles.groupTitle}>
                {group.section}
              </span>

              <div className={styles.navItems}>
                {group.items.map((item) => {
                  const Icon = item.icon;

                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`${styles.navItem} ${
                        active ? styles.active : ""
                      }`}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {user?.name?.charAt(0) || "U"}
            </div>

            <div className={styles.userInfo}>
              <strong>{user?.name || "User"}</strong>
              <span>{user?.role || "Officer"}</span>
            </div>

            <button type="button" className={styles.logoutButton} aria-label="Sign out" title="Sign out" onClick={async()=>{try {await logout();} catch(err){setLogoutError(err.message);}}}>↪</button>
          </div>

          <div className={styles.version}>
            Bharat Vault v0.1 · Local MVP
          </div>
          {logoutError && <p role="alert">{logoutError}</p>}
        </div>
      </aside>
    </>
  );
}
