"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  LockKeyhole,
  ArrowRight,
  Eye,
  EyeOff,
  UserRoundCheck,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import styles from "./page.module.css";

const DEMO_CREDENTIALS = {
  email: "officer@bharatvault.gov",
  password: "BharatVault-Local-2026",
};

export default function LoginPage() {
  const router = useRouter();

  const { login, loading } = useAuth();

  const [email, setEmail] = useState(
    "officer@bharatvault.gov"
  );

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [credentialsFilled, setCredentialsFilled] =
    useState(false);

  function fillDemoCredentials() {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError("");
    setCredentialsFilled(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    try {
      await login(email, password);

      router.push("/dashboard");
    } catch (err) {
      setError(
        err?.message ||
          "Unable to sign in. Please try again."
      );
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGrid} />

      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          <div className={styles.brandIcon}>
            <ShieldCheck size={22} />
          </div>

          <div>
            <strong>Bharat Vault</strong>
            <span>Land Record Intelligence</span>
          </div>
        </Link>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.securityIcon}>
              <ShieldCheck size={20} />
            </div>

            <div>
              <h1>Sign in to Bharat Vault</h1>

              <p>
                Access your land record verification workspace.
              </p>
            </div>
          </div>

          <form
            className={styles.form}
            onSubmit={handleSubmit}
          >
            <div className={styles.field}>
              <label htmlFor="email">
                Official email
              </label>

              <div className={styles.inputWrapper}>
                <Mail size={17} />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="officer@example.gov"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="password">
                  Password
                </label>

                <span>Local account</span>
              </div>

              <div className={styles.inputWrapper}>
                <LockKeyhole size={17} />

                <input
                  id="password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  required
                />

                <button
                  type="button"
                  className={styles.passwordButton}
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className={styles.demoNotice}>
            <div className={styles.demoNoticeHeader}>
              <div>
                <strong>Local MVP demo account</strong>

                <span>
                  Fill the demo username and password, then sign in.
                </span>
              </div>

              <button
                type="button"
                className={styles.demoButton}
                onClick={fillDemoCredentials}
              >
                <UserRoundCheck size={16} />
                {credentialsFilled
                  ? "Credentials filled"
                  : "Fill demo credentials"}
              </button>
            </div>

            <small>
              Documents and OCR stay on this computer. Sample parcels are synthetic.
            </small>
          </div>
        </section>

        <p className={styles.footerText}>
          Bharat Vault · Evidence-driven land record
          intelligence
        </p>
      </div>
    </main>
  );
}
