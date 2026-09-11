import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Bharat Vault | Land Record Intelligence",
  description:
    "Evidence-driven land record intelligence and verification platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}