import api from "./client";
export const getAuditLogs = async () => (await api.get("/audit")).data;
export const getAuditLogsByEntity = async entityId => (await api.get("/audit",{params:{entityId}})).data;
