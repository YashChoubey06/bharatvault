import { dashboard } from "./data/dashboard";

export async function getDashboardStats() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return dashboard;
}