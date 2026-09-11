import api from "./client";
export const getDashboardStats = async () => (await api.get("/dashboard")).data;
