"use client";

import { useMemo, useState, useCallback, memo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Search,
  AlertCircle,
  ChevronDown,
  Sparkles,
  MessageSquare,
  Key,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

import { AIModel } from "@/types";
import { cn } from "@/lib/utils";
import {
  getModelCapabilities,
  getCapabilityColor,
} from "@/lib/model-capabilities";
import { useMutation, useQuery } from "convex/react";
import { useAuthToken } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { ProviderIcon } from "@/components/provider-icons";

// Provider mapping with titles and icons
const PROVIDER_CONFIG = {
  openai: { title: "OpenAI", icon: "openai" },
  anthropic: { title: "Anthropic", icon: "anthropic" },
  google: { title: "Google AI", icon: "google" },
  openrouter: { title: "OpenRouter", icon: "openrouter" },
  polly: { title: "Polly", icon: "polly" },
} as const;

// Polly icon component using the favicon
const PollyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <path d="M16 7h.01"></path>
    <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"></path>
    <path d="m20 7 2 .5-2 .5"></path>
    <path d="M10 18v3"></path>
    <path d="M14 17.75V21"></path>
    <path d="M7 18a6 6 0 0 0 3.84-10.61"></path>
  </svg>
);

// Enhanced ProviderIcon component that handles Polly and standardizes sizing
const EnhancedProviderIcon = ({ provider }: { provider: string }) => {
  if (provider === "polly") {
    return <PollyIcon />;
  }
  return (
    <div className="w-4 h-4 flex items-center justify-center">
      <ProviderIcon provider={provider} />
    </div>
  );
};

// Memoized model item component
const ModelItem = memo(
  ({
    model,
    onSelect,
  }: {
    model: AIModel;
    onSelect: (value: string) => void;
  }) => {
    const capabilities = useMemo(() => getModelCapabilities(model), [model]);

    const handleSelect = useCallback(() => {
      onSelect(model.modelId);
    }, [model.modelId, onSelect]);

    return (
      <CommandItem
        key={model.modelId}
        value={`${model.name} ${model.provider} ${model.modelId}`}
        onSelect={handleSelect}
        className="py-2.5 px-3 cursor-pointer"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {model.free && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 shrink-0"
              >
                Free
              </Badge>
            )}
            <span className={cn("font-medium text-sm truncate")}>
              {model.name}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {capabilities.length > 0 &&
              capabilities.slice(0, 4).map((capability, index) => {
                const IconComponent = capability.icon;
                return (
                  <Tooltip
                    key={`${model.modelId}-${capability.label}-${index}`}
                  >
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-help">
                        <IconComponent
                          className={cn(
                            "w-3.5 h-3.5",
                            getCapabilityColor(capability.label)
                          )}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <div>
                        <div className="font-semibold text-foreground">
                          {capability.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {capability.description}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
          </div>
        </div>
      </CommandItem>
    );
  }
);

ModelItem.displayName = "ModelItem";

interface ModelPickerProps {
  className?: string;
}

function ModelPickerComponent({ className }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const token = useAuthToken();
  const router = useRouter();

  const userModelsByProvider = useQuery(api.userModels.getUserModelsByProvider);
  const selectedModel = useQuery(api.userModels.getUserSelectedModel);
  const selectModelMutation = useMutation(api.userModels.selectModel);

  // Check if user is authenticated
  const isAuthenticated = !!token;

  // Simple display name getter
  const displayName = useMemo(() => {
    if (!isAuthenticated) {
      return "Gemini 2.5 Flash Lite";
    }
    return selectedModel?.name || "Select model";
  }, [selectedModel, isAuthenticated]);

  // Handle model selection
  const handleSelect = useCallback(
    (modelId: string) => {
      selectModelMutation({ modelId });
      setOpen(false);
    },
    [selectModelMutation]
  );

  // Show loading state
  if (!userModelsByProvider && isAuthenticated) {
    return (
      <Button
        variant="ghost"
        className={cn(
          "h-auto text-xs font-medium text-muted-foreground/80 group disabled:opacity-60",
          className
        )}
        disabled
      >
        <span className="text-xs font-medium text-muted-foreground transition-colors">
          Loading models...
        </span>
        <ChevronDown className="ml-1.5 h-3 w-3 text-muted-foreground transition-colors shrink-0" />
      </Button>
    );
  }

  // Anonymous user case - show default model but allow opening for upsell
  if (!isAuthenticated) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-auto text-xs font-medium text-muted-foreground/80 hover:text-foreground group",
              className
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-500 transition-colors" />
            <span className="ml-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
              {displayName}
            </span>
            <ChevronDown
              className={cn(
                "ml-1.5 h-3 w-3 text-muted-foreground group-hover:text-foreground transition-all duration-200 shrink-0",
                open && "rotate-180"
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[480px] p-0 overflow-hidden"
          align="start"
          side="top"
          sideOffset={8}
          alignOffset={-12}
        >
          {/* Subtle background overlay */}
          <div className="absolute inset-0 bg-accent-emerald/3 pointer-events-none" />

          <div className="relative p-8 text-center">
            {/* Sparkle icon with consistent accent color */}
            <div className="w-16 h-16 rounded-full bg-accent-emerald flex items-center justify-center mx-auto mb-5 shadow-lg shadow-accent-emerald/25">
              <Sparkles className="h-8 w-8 text-white" />
            </div>

            {/* Refined headline */}
            <h3 className="text-lg font-bold mb-2 text-foreground">
              Unlock Premium Features
            </h3>

            {/* Professional description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 font-medium">
              Sign in to access increased message limits, bring your own API
              keys, and unlock advanced features for a better AI experience.
            </p>

            {/* Feature cards - improved colors */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/40 hover:border-accent-emerald/40 hover:bg-accent-emerald/5 dark:hover:bg-accent-emerald/10 transition-colors duration-200">
                <div className="w-10 h-10 rounded-full bg-accent-emerald flex items-center justify-center shadow-md">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-base font-bold text-foreground">
                    Higher Message Limits
                  </div>
                  <div className="text-sm text-muted-foreground">
                    More conversations per day
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/40 hover:border-accent-emerald/40 hover:bg-accent-emerald/5 dark:hover:bg-accent-emerald/10 transition-colors duration-200">
                <div className="w-10 h-10 rounded-full bg-accent-emerald flex items-center justify-center shadow-md">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-base font-bold text-foreground">
                    Bring Your Own API Keys
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Connect your own OpenAI, Anthropic & Google keys
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/40 hover:border-accent-emerald/40 hover:bg-accent-emerald/5 dark:hover:bg-accent-emerald/10 transition-colors duration-200">
                <div className="w-10 h-10 rounded-full bg-accent-emerald flex items-center justify-center shadow-md">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-base font-bold text-foreground">
                    Advanced Features
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Custom personas, conversation sharing & more
                  </div>
                </div>
              </div>
            </div>

            {/* CTA button with consistent accent color */}
            <Button
              size="full-lg"
              variant="emerald"
              className="text-base font-semibold py-4"
              onClick={() => router.push("/auth")}
            >
              Sign In
            </Button>

            {/* Incentive text with consistent colors */}
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              <span className="text-accent-emerald font-semibold">
                Free to sign up
              </span>{" "}
              •{" "}
              <span className="text-accent-emerald/80 font-semibold">
                No credit card required
              </span>
            </p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Show initial setup message if no models are stored (signed-in users)
  if (userModelsByProvider?.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-auto text-xs font-medium text-muted-foreground/80 group disabled:opacity-60",
              className
            )}
            disabled
          >
            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground transition-colors" />
            <span className="ml-1.5 text-xs font-medium text-muted-foreground transition-colors">
              Configure models
            </span>
            <ChevronDown className="ml-1.5 h-3 w-3 text-muted-foreground transition-colors shrink-0" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Go to Settings → Models to load available models</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto text-xs font-medium text-muted-foreground/80 hover:text-foreground group",
            className
          )}
        >
          {selectedModel?.free && (
            <Badge
              variant="secondary"
              className="mr-2 text-[10px] px-1.5 py-0 h-5 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
            >
              Free
            </Badge>
          )}
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
            {displayName}
          </span>
          <ChevronDown
            className={cn(
              "ml-1.5 h-3 w-3 text-muted-foreground group-hover:text-foreground transition-all duration-200 shrink-0",
              open && "rotate-180"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0"
        align="start"
        side="top"
        sideOffset={8}
        alignOffset={-12}
      >
        <Command>
          <CommandInput placeholder="Search models..." className="h-9" />
          <CommandList className="max-h-[350px]">
            <CommandEmpty>
              <div className="p-4 text-center">
                <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  No models found
                </p>
                <p className="text-xs text-muted-foreground">
                  Try adjusting your search terms
                </p>
              </div>
            </CommandEmpty>

            {userModelsByProvider?.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No models available
                </p>
                <p className="text-xs text-muted-foreground">
                  Add API keys and configure models in Settings
                </p>
              </div>
            ) : (
              userModelsByProvider?.map((provider, providerIndex) => {
                const providerConfig =
                  PROVIDER_CONFIG[provider.id as keyof typeof PROVIDER_CONFIG];
                const providerTitle = providerConfig?.title || provider.name;
                const providerIcon = providerConfig?.icon || provider.id;

                return (
                  <CommandGroup key={provider.id}>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <EnhancedProviderIcon provider={providerIcon} />
                      <span className="text-xs font-medium text-muted-foreground">
                        {providerTitle}
                      </span>
                    </div>
                    {provider.models.map((model: AIModel) => (
                      <ModelItem
                        key={model.modelId}
                        model={model}
                        onSelect={handleSelect}
                      />
                    ))}
                    {providerIndex < userModelsByProvider.length - 1 && (
                      <div className="h-px bg-border mx-2 my-1" />
                    )}
                  </CommandGroup>
                );
              }) || []
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export const ModelPicker = memo(ModelPickerComponent);
