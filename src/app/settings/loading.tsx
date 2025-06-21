import { Spinner } from "@/components/spinner";

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <Spinner />
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    </div>
  );
}
