import {
  dashboard,
  riskScores,
  conflicts,
  validationResults,
} from "./data";

export async function getReportSummary() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    totalRecords: dashboard.totalRecords,
    processedRecords: dashboard.processedRecords,
    verifiedRecords: dashboard.verifiedRecords,
    reviewRequired: dashboard.reviewRequired,
    highRisk: dashboard.highRisk,
    criticalRisk: dashboard.criticalRisk,
  };
}

export async function getRiskDistribution() {
  await new Promise((resolve) => setTimeout(resolve, 250));

  return dashboard.riskDistribution;
}

export async function getValidationDistribution() {
  await new Promise((resolve) => setTimeout(resolve, 250));

  return dashboard.validationDistribution;
}

export async function getRiskReport() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return riskScores;
}

export async function getConflictReport() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return conflicts;
}

export async function getValidationReport() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return validationResults;
}