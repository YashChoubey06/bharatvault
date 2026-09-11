"use client";

import {
  Menu,
  Bell,
  Search,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import styles from "./Topbar.module.css";

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          className={styles.menuButton}
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className={styles.search}>
          <Search size={16} />

          <input
            type="search"
            placeholder="Search parcel, survey or owner..."
          />

          <span>⌘ K</span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.environment}>
          LOCAL MVP
        </div>

        <button
          className={styles.iconButton}
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className={styles.notificationDot} />
        </button>

        <div className={styles.user}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0) || "U"}
          </div>

          <div className={styles.userText}>
            <strong>{user?.name || "Officer"}</strong>
            <span>{user?.role || "User"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
