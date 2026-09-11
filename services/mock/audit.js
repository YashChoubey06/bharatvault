import { auditLogs } from "./data";

export async function getAuditLogs() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return auditLogs;
}

export async function getAuditLogsByEntity(entityId) {
  await new Promise((resolve) => setTimeout(resolve, 250));

  return auditLogs.filter(
    (log) => log.entityId === entityId
  );
}