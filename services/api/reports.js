import api from "./client";
const report = async name => (await api.get("/reports/"+name)).data;
export const getReportSummary = () => report("summary");
export const getRiskDistribution = () => report("risk-distribution");
export const getValidationDistribution = () => report("validation-distribution");
export const getRiskReport = () => report("risk");
export const getConflictReport = () => report("conflicts");
export const getValidationReport = () => report("validation");
