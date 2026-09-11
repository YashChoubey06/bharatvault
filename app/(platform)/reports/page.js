"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  ShieldAlert,
  ClipboardCheck,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  getReportSummary,
  getRiskDistribution,
  getValidationDistribution,
  getRiskReport,
  getConflictReport,
  getValidationReport,
} from "@/services/api/reports";

import styles from "./reports.module.css";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function normalizeRiskData(data) {
  if (data && !Array.isArray(data)) data=Object.entries(data).map(([name,value])=>({name,value}));
  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    name:
      item.name ||
      item.label ||
      item.riskLevel ||
      item.level ||
      "Unknown",
    value:
      Number(
        item.value ??
          item.count ??
          item.total ??
          item.records ??
          0
      ),
  }));
}

function normalizeValidationData(data) {
  if (data && !Array.isArray(data)) data=Object.entries(data).map(([name,value])=>({name,value}));
  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    name:
      item.name ||
      item.label ||
      item.status ||
      item.result ||
      "Unknown",
    value:
      Number(
        item.value ??
          item.count ??
          item.total ??
          item.records ??
          0
      ),
  }));
}

function getRiskLabel(item) {
  return (
    item.riskLevel ||
    item.level ||
    item.category ||
    "Unknown"
  );
}

function getConflictType(item) {
  return (
    item.conflictType ||
    item.type ||
    item.category ||
    item.name ||
    "Record Conflict"
  );
}

function getConflictDescription(item) {
  return (
    item.description ||
    item.message ||
    item.reason ||
    "Inconsistency detected between available evidence sources."
  );
}

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [validationDistribution, setValidationDistribution] =
    useState([]);
  const [riskReport, setRiskReport] = useState([]);
  const [conflictReport, setConflictReport] = useState([]);
  const [validationReport, setValidationReport] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const [
        summaryData,
        riskData,
        validationData,
        riskReportData,
        conflictData,
        validationReportData,
      ] = await Promise.all([
        getReportSummary(),
        getRiskDistribution(),
        getValidationDistribution(),
        getRiskReport(),
        getConflictReport(),
        getValidationReport(),
      ]);

      setSummary(summaryData);
      setRiskDistribution(normalizeRiskData(riskData));
      setValidationDistribution(
        normalizeValidationData(validationData)
      );
      setRiskReport(Array.isArray(riskReportData) ? riskReportData : []);
      setConflictReport(
        Array.isArray(conflictData) ? conflictData : []
      );
      setValidationReport(
        Array.isArray(validationReportData)
          ? validationReportData
          : []
      );
    } catch (err) {
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const conflictTypeData = useMemo(() => {
    const counts = {};

    conflictReport.forEach((item) => {
      const type = getConflictType(item);

      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [conflictReport]);

  const highRiskRecords = useMemo(() => {
    return [...riskReport]
      .sort(
        (a, b) =>
          Number(b.score || b.riskScore || 0) -
          Number(a.score || a.riskScore || 0)
      )
      .slice(0, 8);
  }, [riskReport]);

  if (loading) {
    return (
      <div className={styles.stateCard}>
        <div className={styles.loader} />
        <p>Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard}>
          <AlertTriangle size={22} />

          <div>
            <strong>Unable to load reports</strong>
            <p>{error}</p>
          </div>

          <button type="button" onClick={loadReports}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            INTELLIGENCE REPORTING
          </div>

          <h1>Reports</h1>

          <p>
            Monitor record processing, validation outcomes,
            conflicts and risk patterns across Bharat Vault.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={loadReports}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {/* SUMMARY */}
      <section className={styles.summaryGrid}>
        <SummaryCard
          icon={FileCheck2}
          label="Total Records"
          value={formatNumber(summary?.totalRecords)}
        />

        <SummaryCard
          icon={Activity}
          label="Processed"
          value={formatNumber(summary?.processedRecords)}
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Verified"
          value={formatNumber(summary?.verifiedRecords)}
        />

        <SummaryCard
          icon={ClipboardCheck}
          label="Review Required"
          value={formatNumber(summary?.reviewRequired)}
        />

        <SummaryCard
          icon={ShieldAlert}
          label="High Risk"
          value={formatNumber(summary?.highRisk)}
        />

        <SummaryCard
          icon={AlertTriangle}
          label="Critical Risk"
          value={formatNumber(summary?.criticalRisk)}
          danger
        />
      </section>

      {/* CHARTS */}
      <section className={styles.chartGrid}>
        <ChartCard
          title="Risk Distribution"
          description="Records grouped by assessed risk level."
        >
          {riskDistribution.length ? (
            <ResponsiveContainer width="100%" height={290}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  outerRadius={92}
                  innerRadius={55}
                  paddingAngle={2}
                  label={({ name, value }) =>
                    `${name}: ${value}`
                  }
                >
                  {riskDistribution.map((item, index) => (
                    <Cell key={`${item.name}-${index}`} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => [
                    value,
                    "Records",
                  ]}
                />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard
          title="Validation Distribution"
          description="Current validation outcomes across processed records."
        >
          {validationDistribution.length ? (
            <ResponsiveContainer width="100%" height={290}>
              <BarChart
                data={validationDistribution}
                margin={{
                  top: 10,
                  right: 15,
                  left: 0,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />

                <YAxis
                  tick={{ fontSize: 11 }}
                />

                <Tooltip />

                <Bar
                  dataKey="value"
                  name="Records"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </section>

      {/* CONFLICT REPORT */}
      <section className={styles.twoColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Conflict Analysis</h2>
              <p>
                Types of inconsistencies identified by the
                reconciliation engine.
              </p>
            </div>

            <div className={styles.headerMetric}>
              <strong>{conflictReport.length}</strong>
              <span>signals</span>
            </div>
          </div>

          {conflictTypeData.length ? (
            <div className={styles.conflictList}>
              {conflictTypeData.map((item) => {
                const total = conflictReport.length;

                const percentage =
                  total > 0
                    ? Math.round(
                        (item.value / total) * 100
                      )
                    : 0;

                return (
                  <div
                    className={styles.conflictItem}
                    key={item.name}
                  >
                    <div className={styles.conflictTop}>
                      <span>{item.name}</span>
                      <strong>
                        {item.value}
                      </strong>
                    </div>

                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressBar}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <span className={styles.percentage}>
                      {percentage}% of detected conflicts
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyChart />
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Risk Priority Queue</h2>
              <p>
                Highest-risk records requiring officer
                attention.
              </p>
            </div>
          </div>

          {highRiskRecords.length ? (
            <div className={styles.riskTableWrapper}>
              <table className={styles.riskTable}>
                <thead>
                  <tr>
                    <th>Parcel</th>
                    <th>Risk</th>
                    <th>Level</th>
                  </tr>
                </thead>

                <tbody>
                  {highRiskRecords.map((item, index) => {
                    const score = Number(
                      item.score ??
                        item.riskScore ??
                        0
                    );

                    return (
                      <tr key={item.id || index}>
                        <td>
                          <strong>
                            {item.parcelId ||
                              item.entityId ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={
                              styles.scoreBadge
                            }
                          >
                            {score}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              styles.riskBadge
                            }
                          >
                            {getRiskLabel(item)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyChart />
          )}
        </div>
      </section>

      {/* VALIDATION REPORT */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Validation Results</h2>
            <p>
              Detailed validation outcomes generated from
              available evidence sources.
            </p>
          </div>

          <div className={styles.headerMetric}>
            <strong>{validationReport.length}</strong>
            <span>records</span>
          </div>
        </div>

        {validationReport.length ? (
          <div className={styles.validationTableWrapper}>
            <table className={styles.validationTable}>
              <thead>
                <tr>
                  <th>Parcel</th>
                  <th>Overall Result</th>
                  <th>Checks</th>
                  <th>Conflicts</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {validationReport
                  .slice(0, 12)
                  .map((item, index) => {
                    const checks =
                      item.checks ||
                      item.validationChecks ||
                      [];

                    const conflicts =
                      item.conflicts ||
                      item.conflictCount ||
                      [];

                    const result =
                      item.overallResult ||
                      item.result ||
                      item.status ||
                      "—";

                    return (
                      <tr key={item.id || index}>
                        <td>
                          <strong>
                            {item.parcelId ||
                              item.entityId ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          {result}
                        </td>

                        <td>
                          {Array.isArray(checks)
                            ? checks.length
                            : Number(checks || 0)}
                        </td>

                        <td>
                          {Array.isArray(conflicts)
                            ? conflicts.length
                            : Number(conflicts || 0)}
                        </td>

                        <td>
                          <span
                            className={
                              styles.resultBadge
                            }
                          >
                            {result}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyChart />
        )}
      </section>

      {/* EXPLANATION */}
      <section className={styles.methodology}>
        <div className={styles.methodologyIcon}>
          <BarChart3 size={18} />
        </div>

        <div>
          <strong>
            How Bharat Vault generates these reports
          </strong>

          <p>
            Reports are derived from document extraction,
            evidence reconciliation, validation results and
            risk assessment. Risk scores are used to
            prioritize officer review and do not by
            themselves establish fraud, ownership or legal
            title.
          </p>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  danger = false,
}) {
  return (
    <div className={styles.summaryCard}>
      <div
        className={`${styles.summaryIcon} ${
          danger ? styles.summaryDanger : ""
        }`}
      >
        <Icon size={18} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}) {
  return (
    <div className={styles.chartCard}>
      <div className={styles.cardHeader}>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className={styles.chartBody}>
        {children}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className={styles.emptyChart}>
      <BarChart3 size={28} />
      <span>No report data available.</span>
    </div>
  );
}
