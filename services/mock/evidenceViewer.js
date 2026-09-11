const formatArea = (value) => `${Number(value || 0).toFixed(2)} ha`;

const fieldLabel = {
  currentOwner: "Current Primary Owner",
  registeredBuyer: "Registered Buyer",
  recordedArea: "Total Parcel Area",
  gisArea: "Calculated GIS Area",
  surveyNumber: "Khasra / Survey Number",
  mutationStatus: "Mutation Entry Status",
};

function documentFor(parcel, id, overrides) {
  return {
    id,
    name: overrides.name,
    type: overrides.type,
    pages: overrides.pages,
    year: overrides.year,
    parcelId: parcel.id,
    previewTitle: overrides.previewTitle,
    previewSubtitle: overrides.previewSubtitle,
    ...overrides,
  };
}

export function getEvidenceViewerWorkspace(parcel) {
  const recordedArea = Number(parcel.recordedArea || 0);
  const registrationArea = Number(parcel.registration?.area ?? recordedArea);
  const gisArea = Number(parcel.gis?.area ?? recordedArea);
  const areaDifference = Math.abs(recordedArea - registrationArea);
  const gisDifference = Math.abs(recordedArea - gisArea);
  const mutationStatus = parcel.mutation?.status || "No mutation entry found";

  const documents = [
    documentFor(parcel, "ror", {
      name: `RoR_Jamabandi_${parcel.surveyNumber.replace("/", "_")}_2024.pdf`,
      type: "Record of Rights",
      pages: 4,
      year: 2024,
      previewTitle: "REVENUE DEPARTMENT — FORM 4",
      previewSubtitle: "Record of Rights (Jamabandi) / Current holding register",
    }),
    documentFor(parcel, "registration", {
      name: `Registration_Deed_${parcel.surveyNumber.replace("/", "_")}_2021.pdf`,
      type: "Registration deed",
      pages: 8,
      year: 2021,
      previewTitle: "SUB-REGISTRAR OFFICE — SALE DEED",
      previewSubtitle: "Registered transfer instrument / certified copy",
    }),
    documentFor(parcel, "gis", {
      name: `Cadastral_GIS_${parcel.surveyNumber.replace("/", "_")}_2024.png`,
      type: "Cadastral GIS extract",
      pages: 1,
      year: 2024,
      previewTitle: "CADASTRAL GIS — PARCEL MEASUREMENT",
      previewSubtitle: "Spatial evidence extract / parcel geometry report",
    }),
    documentFor(parcel, "mutation", {
      name: `Mutation_Order_${parcel.surveyNumber.replace("/", "_")}_2021.pdf`,
      type: "Mutation order",
      pages: 3,
      year: 2021,
      previewTitle: "REVENUE DEPARTMENT — MUTATION ORDER",
      previewSubtitle: "Mutation register / ownership change order",
    }),
  ];

  const fields = [
    {
      id: "currentOwner",
      label: fieldLabel.currentOwner,
      value: parcel.currentRecordedOwner || "Not available",
      confidence: 97,
      documentId: "ror",
      page: 4,
      state: "verified",
      source: documents[0].name,
      extractedAt: "10 Sep 2026, 10:42 IST",
      validation: "Matches the current RoR and mutation order.",
      bbox: { left: 19, top: 49, width: 54, height: 7 },
    },
    {
      id: "registeredBuyer",
      label: fieldLabel.registeredBuyer,
      value: parcel.registration?.buyer || parcel.currentRecordedOwner || "Not available",
      confidence: 92,
      documentId: "registration",
      page: 2,
      state: "verified",
      source: documents[1].name,
      extractedAt: "10 Sep 2026, 10:47 IST",
      validation: "Buyer name aligns with the latest ownership record.",
      bbox: { left: 20, top: 57, width: 58, height: 7 },
    },
    {
      id: "recordedArea",
      label: fieldLabel.recordedArea,
      value: formatArea(recordedArea),
      confidence: 94,
      documentId: "ror",
      page: 4,
      state: areaDifference > 0.02 ? "warning" : "verified",
      source: documents[0].name,
      extractedAt: "10 Sep 2026, 10:43 IST",
      validation:
        areaDifference > 0.02
          ? "Differs from the registered deed area."
          : "Consistent across available textual records.",
      conflicts:
        areaDifference > 0.02
          ? [`Registration deed: ${formatArea(registrationArea)}`]
          : [],
      bbox: { left: 19, top: 64, width: 42, height: 7 },
    },
    {
      id: "gisArea",
      label: fieldLabel.gisArea,
      value: formatArea(gisArea),
      confidence: gisDifference > 0.15 ? 78 : 91,
      documentId: "gis",
      page: 1,
      state: gisDifference > 0.15 ? "warning" : "verified",
      source: documents[2].name,
      extractedAt: "10 Sep 2026, 11:03 IST",
      validation:
        gisDifference > 0.15
          ? "GIS polygon needs officer review against RoR area."
          : "GIS measurement is within the configured tolerance.",
      conflicts:
        gisDifference > 0.15
          ? [`Record of Rights: ${formatArea(recordedArea)}`]
          : [],
      bbox: { left: 23, top: 47, width: 48, height: 8 },
    },
    {
      id: "surveyNumber",
      label: fieldLabel.surveyNumber,
      value: parcel.surveyNumber || "Not available",
      confidence: 98,
      documentId: "ror",
      page: 4,
      state: "verified",
      source: documents[0].name,
      extractedAt: "10 Sep 2026, 10:41 IST",
      validation: "Matches the parcel identifier in linked source records.",
      bbox: { left: 64, top: 39, width: 18, height: 7 },
    },
    {
      id: "mutationStatus",
      label: fieldLabel.mutationStatus,
      value: mutationStatus.replace(/_/g, " "),
      confidence: mutationStatus === "APPROVED" ? 88 : 63,
      documentId: "mutation",
      page: 1,
      state: mutationStatus === "APPROVED" ? "verified" : "warning",
      source: documents[3].name,
      extractedAt: "10 Sep 2026, 10:56 IST",
      validation:
        mutationStatus === "APPROVED"
          ? "Mutation status is approved in the latest order."
          : "Mutation status is incomplete or requires source confirmation.",
      bbox: { left: 19, top: 67, width: 52, height: 7 },
    },
  ];

  return { documents, fields };
}

export function getFieldLabel(fieldId) {
  return fieldLabel[fieldId] || fieldId;
}
