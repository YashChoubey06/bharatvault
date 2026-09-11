import api from "./client";
export const getVerificationCases = async () => (await api.get("/verification")).data;
export const getVerificationCase = async id => (await api.get("/verification/"+encodeURIComponent(id))).data;
export const getVerificationCasesByUser = async id => (await getVerificationCases()).filter(c=>c.assignedTo===id);
export const decideVerificationCase = async ({caseId,decision,notes}) => (await api.post("/verification/"+encodeURIComponent(caseId)+"/decision",{decision,notes})).data;
