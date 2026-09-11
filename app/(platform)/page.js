"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  ArrowRight,
  ShieldAlert,
  Activity,
} from "lucide-react";

import { getDashboardStats } from "@/services/api/dashboard";
import { getVerificationCases } from "@/services/api/verification";
import { getAuditLogs } from "@/services/api/audit";

import styles from "./page.module.css";

function StatCard({ icon: Icon, label, value, description, tone }) {
  return (
    <div className={`${styles.statCard} ${styles[tone]}`}>
      <div className={styles.statTop}>
        <div className={styles.statIcon}>
          <Icon size={20} strokeWidth={2} />
        </div>

        <span className={styles.statLabel}>{label}</span>
      </div>

      <div className={styles.statValue}>{value}</div>

      <div className={styles.statDescription}>
        {description}
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const normalized = level?.toLowerCase();

  return (
    <span
      className={`${styles.riskBadge} ${
        styles[`risk${normalized}`]
      }`}
    >
      {level}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [verificationCases, setVerificationCases] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          dashboardData,
          verificationData,
          auditData,
        ] = await Promise.all([
          getDashboardStats(),
          getVerificationCases(),
          getAuditLogs(),
        ]);

        setStats(dashboardData);
        setVerificationCases(verificationData);
        setAuditLogs(auditData);
      } catch (err) {
        console.error(err);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading Bharat Vault intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <AlertTriangle size={22} />
        <div>
          <strong>Dashboard unavailable</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            LAND RECORD INTELLIGENCE
          </div>

          <h1>Verification Dashboard</h1>

          <p>
            Monitor record processing, validation findings and
            priority verification cases.
          </p>
        </div>

        <div className={styles.headerStatus}>
          <span className={styles.statusDot} />
          System Operational
        </div>
      </div>

      {/* Stats */}
      <section className={styles.statsGrid}>
        <StatCard
          icon={FileText}
          label="Total Records"
          value={stats.totalRecords.toLocaleString()}
          description="Records in the system"
          tone="blue"
        />

        <StatCard
          icon={CheckCircle2}
          label="Verified"
          value={stats.verifiedRecords.toLocaleString()}
          description="Records passing verification"
          tone="green"
        />

        <StatCard
          icon={Clock3}
          label="Review Required"
          value={stats.reviewRequired.toLocaleString()}
          description="Records awaiting officer review"
          tone="amber"
        />

        <StatCard
          icon={ShieldAlert}
          label="High Risk"
          value={stats.highRisk.toLocaleString()}
          description="Priority investigation cases"
          tone="red"
        />
      </section>

      {/* Main Grid */}
      <section className={styles.mainGrid}>
        {/* Verification Queue */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Priority Verification Queue</h2>
              <p>
                Cases requiring evidence-assisted officer review.
              </p>
            </div>

            <Link               href="/verification"
              className={styles.viewAll}
            >
              View all
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className={styles.queue}>
            {verificationCases.length === 0 ? (
              <div className={styles.emptyState}>
                No verification cases found.
              </div>
            ) : (
              verificationCases.map((item) => (
                <div
                  key={item.id}
                  className={styles.queueItem}
                >
                  <div className={styles.queueIcon}>
                    <ShieldAlert size={19} />
                  </div>

                  <div className={styles.queueContent}>
                    <div className={styles.queueTitleRow}>
                      <strong>
                        {item.parcel?.surveyNumber ||
                          "Unknown Parcel"}
                      </strong>

                      <RiskBadge
                        level={item.priority}
                      />
                    </div>

                    <span className={styles.queueMeta}>
                      {item.parcel?.currentRecordedOwner ||
                        "Unknown owner"}
                      {" · "}
                      {item.parcel?.khataNumber ||
                        "No Khata"}
                    </span>

                    <div className={styles.reasonList}>
                      {item.reason.map((reason) => (
                        <span key={reason}>
                          • {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link                     href={`/verification/${item.id}`}
                    className={styles.reviewButton}
                  >
                    Review
                    <ArrowRight size={15} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Record Health */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Record Health</h2>
              <p>
                Overall quality of available parcel evidence.
              </p>
            </div>

            <Activity size={19} />
          </div>

          <div className={styles.healthSection}>
            <div className={styles.healthScore}>
              <span>{stats.recordHealth}</span>
              <small>/ 100</small>
            </div>

            <div className={styles.healthLabel}>
              Good evidence coverage
            </div>

            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${stats.recordHealth}%` }}
              />
            </div>
          </div>

          <div className={styles.healthBreakdown}>
            <div>
              <span>Documents processed</span>
              <strong>
                {stats.processedRecords.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>Processing today</span>
              <strong>
                {stats.processingToday.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>Avg. processing time</span>
              <strong>
                {stats.averageProcessingTime}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Grid */}
      <section className={styles.bottomGrid}>
        {/* Risk Distribution */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Risk Distribution</h2>
              <p>Current parcel risk classification.</p>
            </div>
          </div>

          <div className={styles.riskDistribution}>
            <div className={styles.riskRow}>
              <span>
                <i className={styles.lowDot} />
                Low
              </span>
              <strong>
                {stats.riskDistribution.low.toLocaleString()}
              </strong>
            </div>

            <div className={styles.riskRow}>
              <span>
                <i className={styles.mediumDot} />
                Medium
              </span>
              <strong>
                {stats.riskDistribution.medium.toLocaleString()}
              </strong>
            </div>

            <div className={styles.riskRow}>
              <span>
                <i className={styles.highDot} />
                High
              </span>
              <strong>
                {stats.riskDistribution.high.toLocaleString()}
              </strong>
            </div>

            <div className={styles.riskRow}>
              <span>
                <i className={styles.criticalDot} />
                Critical
              </span>
              <strong>
                {stats.riskDistribution.critical.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Recent Activity</h2>
              <p>Latest system and verification events.</p>
            </div>

            <Link               href="/audit"
              className={styles.viewAll}
            >
              Audit trail
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className={styles.activityList}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className={styles.activityItem}
              >
                <div className={styles.activityDot} />

                <div>
                  <strong>{log.action}</strong>
                  <p>{log.description}</p>
                  <span>
                    {log.user} ·{" "}
                    {new Date(
                      log.timestamp
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
