"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export default function PlatformGuard({ children }) {
  const router = useRouter();

  const {
    loading,
    isAuthenticated,
  } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [
    loading,
    isAuthenticated,
    router,
  ]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-background)",
          color: "var(--color-text-secondary)",
        }}
      >
        Loading Bharat Vault...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}