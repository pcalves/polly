import { SettingsHeader } from "@/components/settings/settings-header";
import { SettingsContainer } from "@/components/settings/settings-container";

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SettingsHeader
        backLink="/settings/personas"
        backText="Back to Personas"
      />
      <SettingsContainer>{children}</SettingsContainer>
    </div>
  );
}
