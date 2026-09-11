const DEMO_SESSION_KEY = "bharat-vault-demo-session";

import { users } from "./data/users";

export async function loginDemo(email, password) {
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const user = users.find(
    (item) => item.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    throw new Error("Invalid demo credentials.");
  }

  if (typeof window !== "undefined") {
    sessionStorage.setItem(DEMO_SESSION_KEY, user.id);
  }

  return {
    user,
    token: "demo-session-token",
  };
}

export async function logoutDemo() {
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  }

  return true;
}

export async function getDemoUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const userId = sessionStorage.getItem(DEMO_SESSION_KEY);

  if (!userId) {
    return null;
  }

  const user = users.find((item) => item.id === userId);

  return user || null;
}