import api from "./client";
export const getDocuments = async () => (await api.get("/documents")).data;
export const getDocumentById = async id => (await api.get("/documents/"+encodeURIComponent(id))).data;
export const getDocumentsByParcel = async id => (await api.get("/parcels/"+encodeURIComponent(id)+"/documents")).data;
export const getDocumentExtractions = async id => (await api.get("/documents/"+encodeURIComponent(id)+"/extractions")).data;
export const uploadDocument = async data => (await api.post("/documents",data,{headers:{"Content-Type":"multipart/form-data"}})).data;
export const retryDocument = async id => (await api.post("/documents/"+encodeURIComponent(id)+"/process")).data;
