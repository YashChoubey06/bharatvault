import apiClient from "./client";

export async function login(email, password) {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });

  return response.data;
}

export async function logout() {
  const response = await apiClient.post("/auth/logout");

  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get("/auth/me");

  return response.data;
}