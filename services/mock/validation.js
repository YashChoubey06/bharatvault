import {
  validationResults,
  conflicts,
  evidence,
  riskScores,
} from "./data";

export async function getValidationByParcel(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 350));

  console.log("Requested parcelId:", parcelId);
  console.log("Available validation results:", validationResults);

  const validation = validationResults.find(
    (item) => String(item.parcelId).trim() === String(parcelId).trim()
  );

  console.log("Found validation:", validation);

  if (!validation) {
    throw new Error(
      `Validation result not found for parcel: ${parcelId}`
    );
  }

  return validation;
}

export async function getConflictsByParcel(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return conflicts.filter(
    (item) => item.parcelId === parcelId
  );
}

export async function getEvidenceByParcel(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return evidence.filter(
    (item) =>
      item.entityType === "PARCEL" &&
      item.entityId === parcelId
  );
}

export async function getRiskByParcel(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const risk = riskScores.find(
    (item) => item.parcelId === parcelId
  );

  if (!risk) {
    throw new Error("Risk assessment not found.");
  }

  return risk;
}

export async function getParcelIntelligence(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const validation = validationResults.find(
    (item) => item.parcelId === parcelId
  );

  const parcelConflicts = conflicts.filter(
    (item) => item.parcelId === parcelId
  );

  const parcelEvidence = evidence.filter(
    (item) =>
      item.entityType === "PARCEL" &&
      item.entityId === parcelId
  );

  const risk = riskScores.find(
    (item) => item.parcelId === parcelId
  );

  return {
    validation,
    conflicts: parcelConflicts,
    evidence: parcelEvidence,
    risk,
  };
}