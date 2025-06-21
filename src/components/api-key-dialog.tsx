"use client";

import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff, ExternalLink } from "lucide-react";
import { APIKeys } from "@/types";
import { getStoredApiKeys, storeApiKey, removeApiKey, validateApiKey, maskApiKey } from "@/lib/api-keys";

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
    name: "Google AI",
    url: "https://makersuite.google.com/app/apikey",
    placeholder: "AI...",
  },
  openrouter: {
    name: "OpenRouter",
    url: "https://openrouter.ai/keys",
    placeholder: "sk-or-...",
  },
};

interface ApiKeyDialogProps {
  children?: React.ReactNode;
}

export function ApiKeyDialog({ children }: ApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<APIKeys>(getStoredApiKeys());
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [tempKeys, setTempKeys] = useState<APIKeys>({});

  const handleSave = (provider: keyof APIKeys, key: string) => {
    if (key) {
      if (validateApiKey(provider, key)) {
        storeApiKey(provider, key);
        setApiKeys(prev => ({ ...prev, [provider]: key }));
        setTempKeys(prev => ({ ...prev, [provider]: "" }));
      } else {
        alert(`Invalid ${API_KEY_INFO[provider].name} API key format`);
        return;
      }
    } else {
      removeApiKey(provider);
      setApiKeys(prev => {
        const updated = { ...prev };
        delete updated[provider];
        return updated;
      });
    }
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            API Keys
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>API Keys</DialogTitle>
          <DialogDescription>
            Configure your API keys to use different AI providers. Keys are stored locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(API_KEY_INFO).map(([provider, info]) => {
            const typedProvider = provider as keyof APIKeys;
            const currentKey = apiKeys[typedProvider];
            const tempKey = tempKeys[typedProvider] ?? "";
            const showKey = showKeys[provider] ?? false;

            return (
              <div key={provider} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={provider}>{info.name}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-6 px-2 text-xs"
                  >
                    <a
                      href={info.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      Get key
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={provider}
                      type={showKey ? "text" : "password"}
                      placeholder={currentKey ? maskApiKey(currentKey) : info.placeholder}
                      value={tempKey}
                      onChange={(e) => setTempKeys(prev => ({
                        ...prev,
                        [provider]: e.target.value
                      }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleShowKey(provider)}
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <Button
                    onClick={() => handleSave(typedProvider, tempKey)}
                    disabled={!tempKey && !currentKey}
                    variant={tempKey ? "default" : "destructive"}
                    size="sm"
                  >
                    {tempKey ? "Save" : currentKey ? "Remove" : "Save"}
                  </Button>
                </div>

                {currentKey && !tempKey && (
                  <p className="text-xs text-muted-foreground">
                    Current: {maskApiKey(currentKey)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>API keys are stored locally in your browser and never sent to our servers.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}