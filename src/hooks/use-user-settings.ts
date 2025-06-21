import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useUserSettings(userId?: Id<"users">) {
  return useQuery(api.userSettings.getUserSettings, { userId });
}

export function useUserSettingsMutations() {
  const updateUserSettings = useMutation(api.userSettings.updateUserSettings);
  const togglePersonasEnabled = useMutation(
    api.userSettings.togglePersonasEnabled
  );

  return {
    updateUserSettings,
    togglePersonasEnabled,
  };
}
