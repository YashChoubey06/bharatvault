import {
  parcels,
  documents,
  registrations,
  mutations,
  gis,
  courtCases,
  evidence,
  validationResults,
  conflicts,
  riskScores,
  ownershipHistory,
} from "./data";

function normalize(text) {
  return text?.trim().toLowerCase() || "";
}

function getParcelContext(parcelId) {
  const parcel = parcels.find((item) => item.id === parcelId);

  if (!parcel) {
    throw new Error("Parcel not found.");
  }

  return {
    parcel,
    documents: documents.filter(
      (item) => item.parcelId === parcelId
    ),
    registration: registrations.find(
      (item) => item.parcelId === parcelId
    ),
    mutation: mutations.find(
      (item) => item.parcelId === parcelId
    ),
    gis: gis.find(
      (item) => item.parcelId === parcelId
    ),
    courtCase: courtCases.find(
      (item) => item.parcelId === parcelId
    ),
    evidence: evidence.filter(
      (item) => item.entityId === parcelId
    ),
    validation: validationResults.find(
      (item) => item.parcelId === parcelId
    ),
    conflicts: conflicts.filter(
      (item) => item.parcelId === parcelId
    ),
    risk: riskScores.find(
      (item) => item.parcelId === parcelId
    ),
    history: ownershipHistory.find(
      (item) => item.parcelId === parcelId
    ),
  };
}

function buildSources(context) {
  const sources = [];

  if (context.documents.length > 0) {
    context.documents.forEach((document) => {
      sources.push({
        type: "DOCUMENT",
        documentId: document.id,
        title: document.documentType,
        page: null,
      });
    });
  }

  context.evidence.forEach((item) => {
    sources.push({
      type: item.sourceType,
      documentId: item.documentId,
      title: item.sourceType,
      page: item.page,
      field: item.field,
      confidence: item.confidence,
    });
  });

  return sources;
}

function answerAreaQuestion(context) {
  const rorArea = context.parcel.recordedArea;
  const registrationArea = context.registration?.area;
  const gisArea = context.gis?.area;

  const registrationDifference =
    registrationArea !== undefined
      ? Math.abs(rorArea - registrationArea)
      : null;

  const gisDifference =
    gisArea !== undefined
      ? Math.abs(rorArea - gisArea)
      : null;

  return {
    answer: `Three area values are available for survey ${context.parcel.surveyNumber}: RoR shows ${rorArea.toFixed(
      2
    )} hectare, Registration shows ${
      registrationArea?.toFixed(2) ?? "N/A"
    } hectare, and GIS shows ${
      gisArea?.toFixed(2) ?? "N/A"
    } hectare. The RoR vs Registration difference is ${
      registrationDifference?.toFixed(2) ?? "N/A"
    } hectare, while the RoR vs GIS difference is ${
      gisDifference?.toFixed(2) ?? "N/A"
    } hectare.`,
    sources: buildSources(context),
  };
}

function answerOwnerQuestion(context) {
  const owner = context.parcel.currentRecordedOwner;

  return {
    answer: `The current RoR records ${owner} as the recorded owner. The 2021 registration records the buyer as ${context.registration?.buyer}, and the subsequent mutation records the new owner as ${context.mutation?.newOwner}.`,
    sources: buildSources(context),
  };
}

function answerRiskQuestion(context) {
  const risk = context.risk;

  if (!risk) {
    return {
      answer: "No risk assessment is available for this parcel.",
      sources: [],
    };
  }

  const factors = risk.factors
    .map(
      (factor) =>
        `${factor.factor} (+${factor.impact})`
    )
    .join(", ");

  return {
    answer: `This parcel has a ${risk.riskLevel} risk classification with a score of ${risk.riskScore}. The contributing factors are: ${factors}. The system recommendation is officer review. This risk score is an investigation-prioritization signal and is not a legal or fraud determination.`,
    sources: buildSources(context),
  };
}

function answerConflictQuestion(context) {
  if (context.conflicts.length === 0) {
    return {
      answer: "No recorded conflicts were found for this parcel.",
      sources: [],
    };
  }

  const conflictText = context.conflicts
    .map((conflict) => {
      const values = conflict.sources
        .map(
          (source) =>
            `${source.source}: ${source.value}`
        )
        .join(" vs ");

      return `${conflict.type}: ${values}`;
    })
    .join(". ");

  return {
    answer: `The system has identified ${context.conflicts.length} open finding(s). ${conflictText}. These findings require evidence-assisted officer review.`,
    sources: buildSources(context),
  };
}

function answerHistoryQuestion(context) {
  if (!context.history?.events?.length) {
    return {
      answer: "No ownership history is available for this parcel.",
      sources: [],
    };
  }

  const history = context.history.events
    .map(
      (event) =>
        `${event.year}: ${event.eventType} — ${event.recordedOwner}`
    )
    .join(". ");

  return {
    answer: `The available ownership timeline is: ${history}.`,
    sources: buildSources(context),
  };
}

function answerGeneralQuestion(context) {
  return {
    answer: `I found evidence for survey ${context.parcel.surveyNumber}. The recorded owner is ${context.parcel.currentRecordedOwner}, recorded area is ${context.parcel.recordedArea.toFixed(
      2
    )} hectare, and the current parcel risk classification is ${
      context.risk?.riskLevel || "NOT AVAILABLE"
    }. You can ask about area discrepancies, ownership, risk, conflicts, or ownership history.`,
    sources: buildSources(context),
  };
}

export async function askAssistant({
  parcelId,
  question,
}) {
  await new Promise((resolve) => setTimeout(resolve, 700));

  if (!parcelId) {
    throw new Error("Parcel ID is required.");
  }

  if (!question?.trim()) {
    throw new Error("Question is required.");
  }

  const context = getParcelContext(parcelId);
  const normalizedQuestion = normalize(question);

  let result;

  if (
    normalizedQuestion.includes("area") ||
    normalizedQuestion.includes("difference") ||
    normalizedQuestion.includes("discrepancy")
  ) {
    result = answerAreaQuestion(context);
  } else if (
    normalizedQuestion.includes("owner") ||
    normalizedQuestion.includes("ownership")
  ) {
    result = answerOwnerQuestion(context);
  } else if (
    normalizedQuestion.includes("risk") ||
    normalizedQuestion.includes("high risk")
  ) {
    result = answerRiskQuestion(context);
  } else if (
    normalizedQuestion.includes("conflict") ||
    normalizedQuestion.includes("mismatch") ||
    normalizedQuestion.includes("inconsistency")
  ) {
    result = answerConflictQuestion(context);
  } else if (
    normalizedQuestion.includes("history") ||
    normalizedQuestion.includes("timeline") ||
    normalizedQuestion.includes("previous owner")
  ) {
    result = answerHistoryQuestion(context);
  } else {
    result = answerGeneralQuestion(context);
  }

  return {
    id: `MSG-${Date.now()}`,
    parcelId,
    question,
    ...result,
    generatedAt: new Date().toISOString(),
    mode: "DEMO",
  };
}