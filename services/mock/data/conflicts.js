export const conflicts = [
  {
    id: "CON-001",

    parcelId: "PRC-001",

    type: "AREA_MISMATCH",

    severity: "MEDIUM",

    field: "area",

    sources: [
      {
        source: "RoR",
        value: "2.50 hectare",
      },
      {
        source: "Registration",
        value: "2.45 hectare",
      },
    ],

    difference: "0.05 hectare",

    status: "OPEN",
  },

  {
    id: "CON-002",

    parcelId: "PRC-001",

    type: "TEXT_GIS_AREA_MISMATCH",

    severity: "HIGH",

    field: "area",

    sources: [
      {
        source: "RoR",
        value: "2.50 hectare",
      },
      {
        source: "GIS",
        value: "2.20 hectare",
      },
    ],

    difference: "0.30 hectare",

    status: "OPEN",
  },

  {
    id: "CON-003",

    parcelId: "PRC-001",

    type: "DISPUTE_SIGNAL",

    severity: "MEDIUM",

    field: "court_status",

    sources: [
      {
        source: "District Court",
        value: "Pending",
      },
    ],

    status: "OPEN",
  },
];