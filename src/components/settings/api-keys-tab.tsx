"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";
import { ProviderIcon } from "@/components/provider-icons";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { validateApiKey } from "@/lib/validation";
import { useUser } from "@/hooks/use-user";
import {
  useUserSettings,
  useUserSettingsMutations,
} from "@/hooks/use-user-settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsHeader } from "./settings-header";

type ApiProvider = "openai" | "anthropic" | "google" | "openrouter";

const API_KEY_INFO = {
  openai: {
    name: "OpenAI",
    url: "https://platform.openai.com/api-keys",
    placeholder: "sk-...",
  },
  anthropic: {
    name: "Anthropic",
    url: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-...",
  },
  google: {
    name: "Google",
    url: "https://makersuite.google.com/app/apikey",
    placeholder: "AI...",
  },
  openrouter: {
    name: "OpenRouter",
    url: "https://openrouter.ai/keys",
    placeholder: "sk-or-...",
  },
};

function getProviderCardStyle(provider: string, isConnected: boolean) {
  const baseStyle = "p-4 rounded-lg border transition-all duration-200";

  if (isConnected) {
    return `${baseStyle} border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50`;
  }

  return `${baseStyle} border-border bg-card hover:bg-muted/50`;
}

export function ApiKeysTab() {
  const { user } = useUser();
  const userSettings = useUserSettings(user?._id);
  const { updateUserSettings } = useUserSettingsMutations();
  const apiKeys = useQuery(api.apiKeys.getUserApiKeys);
  const storeKeyMutation = useMutation(api.apiKeys.storeApiKey);
  const removeKeyMutation = useMutation(api.apiKeys.removeApiKey);

  // Check if user has OpenRouter API key
  const hasOpenRouterKey = apiKeys?.some(
    key => key.provider === "openrouter" && key.hasKey
  );

  const handleOpenRouterSortingChange = async (value: string) => {
    try {
      await updateUserSettings({
        openRouterSorting: value as
          | "default"
          | "price"
          | "throughput"
          | "latency",
      });
      toast.success("OpenRouter Settings Updated", {
        description: "Your provider sorting preference has been saved.",
      });
    } catch (error) {
      console.error("Failed to update OpenRouter settings:", error);
      toast.error("Error", {
        description: "Failed to update settings. Please try again.",
      });
    }
  };

  const handleApiKeySubmit = async (
    provider: ApiProvider,
    formData: FormData
  ) => {
    const key = formData.get(`${provider}-key`) as string;

    if (key?.trim()) {
      // Validate on client side first
      if (!validateApiKey(provider, key.trim())) {
        toast.error("Invalid API Key", {
          description: `Please enter a valid ${API_KEY_INFO[provider].name} API key.`,
        });
        return;
      }

      try {
        await storeKeyMutation({
          provider,
          rawKey: key.trim(),
        });

        toast.success("API Key Saved", {
          description: `Your ${API_KEY_INFO[provider].name} API key has been securely stored.`,
        });
      } catch (error) {
        toast.error("Error", {
          description:
            error instanceof Error
              ? error.message
              : "Failed to save API key. Please try again.",
        });
      }
    }
  };

  const handleApiKeyRemove = async (provider: ApiProvider) => {
    try {
      await removeKeyMutation({ provider });

      toast.success("API Key Removed", {
        description: `Your ${API_KEY_INFO[provider].name} API key has been removed.`,
      });
    } catch {
      toast.error("Error", {
        description: "Failed to remove API key. Please try again.",
      });
    }
  };

  // Show loading state
  if (apiKeys === undefined) {
    return (
      <div className="space-y-6">
        <SettingsHeader
          title="API Keys"
          description="Configure your API keys to use different AI providers. Keys are securely encrypted and stored."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(
            Object.entries(API_KEY_INFO) as Array<
              [ApiProvider, (typeof API_KEY_INFO)[ApiProvider]]
            >
          ).map(([provider]) => (
            <div
              key={provider}
              className="p-4 rounded-lg border border-muted/40 bg-card animate-pulse"
            >
              <div className="h-20 bg-muted/20 rounded mb-4"></div>
              <div className="h-10 bg-muted/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="API Keys"
        description="Configure your API keys to use different AI providers. Keys are securely encrypted and stored across all your devices."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(
          Object.entries(API_KEY_INFO) as Array<
            [ApiProvider, (typeof API_KEY_INFO)[ApiProvider]]
          >
        ).map(([provider, info]) => {
          const keyInfo = apiKeys.find(key => key.provider === provider);
          const isConnected = keyInfo?.hasKey || false;

          return (
            <div
              key={provider}
              className={`${getProviderCardStyle(provider, isConnected)} flex flex-col h-full justify-between`}
            >
              <div className="flex items-start justify-between mb-4 flex-shrink-0">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 flex justify-center shrink-0">
                    <ProviderIcon provider={provider} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={provider}
                        className="text-base font-medium"
                      >
                        {info.name}
                      </Label>
                      {isConnected && (
                        <span className="text-xs text-green-700 dark:text-green-300 font-medium bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800/50">
                          Connected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!isConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 px-3 text-xs shrink-0 ml-3"
                  >
                    <a
                      href={info.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5"
                    >
                      Get key
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>

              <div className="mt-auto">
                {isConnected ? (
                  <div className="flex gap-2 flex-shrink-0">
                    <div className="flex-1">
                      <Input
                        id={provider}
                        type="text"
                        placeholder={`Current: ${keyInfo?.partialKey || info.placeholder.replace(/\./g, "•")}`}
                        className="font-mono text-sm"
                        disabled
                      />
                    </div>
                    <Button
                      onClick={() =>
                        handleApiKeyRemove(provider as ApiProvider)
                      }
                      size="sm"
                      className="px-4"
                      variant="destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <form
                    action={formData =>
                      handleApiKeySubmit(provider as ApiProvider, formData)
                    }
                    className="flex gap-2 flex-shrink-0"
                  >
                    <div className="flex-1">
                      <Input
                        id={provider}
                        name={`${provider}-key`}
                        type="password"
                        placeholder={info.placeholder}
                        className="font-mono text-sm"
                        required
                      />
                    </div>
                    <Button type="submit" size="sm" variant="emerald">
                      Save
                    </Button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* OpenRouter Provider Settings */}
      {hasOpenRouterKey && (
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 flex justify-center shrink-0">
              <ProviderIcon provider="openrouter" />
            </div>
            <h3 className="text-sm font-medium">OpenRouter Provider Sorting</h3>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose how OpenRouter routes your requests across providers.{" "}
              <a
                href="https://openrouter.ai/docs/features/provider-routing#provider-sorting"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Learn more
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>

            <div className="space-y-2">
              <Label htmlFor="openrouter-sorting" className="text-sm">
                Sorting Strategy
              </Label>
              <Select
                value={userSettings?.openRouterSorting ?? "default"}
                onValueChange={handleOpenRouterSortingChange}
                disabled={!userSettings}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">
                    Default Load Balancing
                  </SelectItem>
                  <SelectItem value="price">Lowest Price</SelectItem>
                  <SelectItem value="throughput">Highest Throughput</SelectItem>
                  <SelectItem value="latency">Lowest Latency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
