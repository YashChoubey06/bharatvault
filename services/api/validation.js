import api from "./client";
const section = async (id,name) => (await api.get("/parcels/"+encodeURIComponent(id)+"/"+name)).data;
export const getValidationByParcel = id => section(id,"validation");
export const getConflictsByParcel = id => section(id,"conflicts");
export const getEvidenceByParcel = id => section(id,"evidence");
export const getRiskByParcel = id => section(id,"risk");
export const getParcelIntelligence = id => section(id,"intelligence");
export const getEvidenceViewerWorkspace = id => section(id,"workspace");
export const reviewEvidence = async (id,data) => (await api.patch("/fields/"+encodeURIComponent(id),data)).data;
