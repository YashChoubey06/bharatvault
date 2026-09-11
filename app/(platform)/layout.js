import PlatformShell from "@/components/layout/PlatformShell";
import PlatformGuard from "@/components/layout/PlatformGuard";
import AssistantWidget from "@/components/assistant/AssistantWidget";

export default function PlatformLayout({ children }) {
  return (
    <PlatformGuard>
      <PlatformShell>
        {children}

        <AssistantWidget />
      </PlatformShell>
    </PlatformGuard>
  );
}