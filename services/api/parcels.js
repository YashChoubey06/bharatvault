import api from "./client";
export const getParcels = async () => (await api.get("/parcels")).data;
export const getParcelById = async id => (await api.get("/parcels/"+encodeURIComponent(id))).data;
export const searchParcels = async search => (await api.get("/parcels",{params:{search}})).data;
export const createParcel = async data => (await api.post("/parcels",data)).data;
export const removeParcel = async id => (await api.delete("/parcels/"+encodeURIComponent(id))).data;
export const saveParcelGIS = async (id,data) => (await api.put("/parcels/"+encodeURIComponent(id)+"/gis",data)).data;
