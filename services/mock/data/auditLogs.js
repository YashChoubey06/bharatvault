export const auditLogs = [
  {
    id: "AUD-001",

    entityId: "DOC-006",

    action: "DOCUMENT_UPLOADED",

    user: "USR-002",

    timestamp: "2026-09-08T09:12:00Z",

    description: "Current RoR document uploaded.",
  },

  {
    id: "AUD-002",

    entityId: "DOC-006",

    action: "OCR_COMPLETED",

    user: "SYSTEM",

    timestamp: "2026-09-08T09:13:18Z",

    description: "OCR and field extraction completed.",
  },

  {
    id: "AUD-003",

    entityId: "PRC-001",

    action: "VALIDATION_COMPLETED",

    user: "SYSTEM",

    timestamp: "2026-09-08T09:13:40Z",

    description: "Multi-source validation completed.",
  },

  {
    id: "AUD-004",

    entityId: "PRC-001",

    action: "RISK_ASSESSED",

    user: "SYSTEM",

    timestamp: "2026-09-08T09:13:42Z",

    description: "Parcel assigned HIGH investigation priority.",
  },

  {
    id: "AUD-005",

    entityId: "CASE-V-001",

    action: "CASE_ASSIGNED",

    user: "USR-003",

    timestamp: "2026-09-08T10:30:00Z",

    description: "Verification case assigned to officer.",
  },
];