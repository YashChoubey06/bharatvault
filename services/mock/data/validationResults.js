export const validationResults = [
  {
    parcelId: "PRC-001",

    checks: [
      {
        check: "DOCUMENT_QUALITY",
        status: "VERIFIED",
        message:
          "All primary documents meet processing quality requirements.",
      },

      {
        check: "RECORD_COMPLETENESS",
        status: "VERIFIED",
        message:
          "Required ownership, parcel and transaction fields are available.",
      },

      {
        check: "OWNER_CONSISTENCY",
        status: "VERIFIED",
        message:
          "Current RoR, mutation and registration identify Suresh Kumar as recorded owner.",
      },

      {
        check: "SURVEY_NUMBER_CONSISTENCY",
        status: "VERIFIED",
        message:
          "Survey number 124/3 is consistent across available records.",
      },

      {
        check: "AREA_CONSISTENCY",
        status: "REVIEW_REQUIRED",
        message:
          "Area differs between RoR and registration records.",
      },

      {
        check: "MUTATION_CONTINUITY",
        status: "VERIFIED",
        message:
          "2021 sale is followed by an approved mutation.",
      },

      {
        check: "REGISTRATION_CONSISTENCY",
        status: "REVIEW_REQUIRED",
        message:
          "Registered area differs from current RoR area by 0.05 hectare.",
      },

      {
        check: "TEXT_GIS_CONSISTENCY",
        status: "HIGH_RISK",
        message:
          "GIS area differs from RoR area by 0.30 hectare.",
      },

      {
        check: "COURT_STATUS",
        status: "REVIEW_REQUIRED",
        message:
          "A pending property boundary dispute is associated with this parcel.",
      },
    ],
  },
];