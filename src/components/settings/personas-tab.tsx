"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EnhancedMarkdown } from "@/components/ui/enhanced-markdown";
import { Trash2, User, Edit3, FileText } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/hooks/use-user";
import {
  useUserSettings,
  useUserSettingsMutations,
} from "@/hooks/use-user-settings";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { SettingsHeader } from "./settings-header";
import Link from "next/link";

export function PersonasTab() {
  const userInfo = useUser();
  const personas = useQuery(api.personas.list, { userId: userInfo.user?._id });
  const allBuiltInPersonas = useQuery(api.personas.listAllBuiltIn);
  const userPersonaSettings = useQuery(api.personas.getUserPersonaSettings, {
    userId: userInfo.user?._id,
  });
  const userSettings = useUserSettings(userInfo.user?._id);
  const removePersona = useMutation(api.personas.remove);
  const toggleBuiltInPersona = useMutation(api.personas.toggleBuiltInPersona);
  const { togglePersonasEnabled } = useUserSettingsMutations();

  const [deletingPersona, setDeletingPersona] = useState<Id<"personas"> | null>(
    null
  );

  const handleDeletePersona = useCallback(async () => {
    if (!deletingPersona) return;

    try {
      await removePersona({ id: deletingPersona });
      setDeletingPersona(null);
    } catch (error) {
      console.error("Failed to delete persona:", error);
    }
  }, [deletingPersona, removePersona]);

  const handleToggleBuiltInPersona = useCallback(
    async (personaId: Id<"personas">, isDisabled: boolean) => {
      try {
        await toggleBuiltInPersona({ personaId, isDisabled });
      } catch (error) {
        console.error("Failed to toggle built-in persona:", error);
      }
    },
    [toggleBuiltInPersona]
  );

  const isPersonaDisabled = useCallback(
    (personaId: Id<"personas">) => {
      return (
        userPersonaSettings?.some(
          setting => setting.personaId === personaId && setting.isDisabled
        ) || false
      );
    },
    [userPersonaSettings]
  );

  const handleTogglePersonasGlobally = useCallback(
    async (enabled: boolean) => {
      try {
        await togglePersonasEnabled({ enabled });
      } catch (error) {
        console.error("Failed to toggle personas globally:", error);
      }
    },
    [togglePersonasEnabled]
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <SettingsHeader
            title="Personas"
            description="Manage custom system prompts for different conversation styles"
          />
          <div className="flex gap-2 shrink-0">
            <Link href="/settings/personas/new">
              <Button variant="emerald">Create Persona</Button>
            </Link>
          </div>
        </div>

        {/* Global Personas Toggle */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-base">Enable Personas</h3>
              <p className="text-sm text-muted-foreground">
                Turn personas on or off completely. When disabled, the persona
                picker will be hidden from the chat interface.
              </p>
            </div>
            <Switch
              checked={userSettings?.personasEnabled !== false}
              onCheckedChange={handleTogglePersonasGlobally}
            />
          </div>
        </div>

        {/* Show the rest only if personas are enabled */}
        {userSettings?.personasEnabled !== false && (
          <>
            {/* Built-in Personas Management */}
            {allBuiltInPersonas && allBuiltInPersonas.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Built-in Personas</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allBuiltInPersonas.map(persona => {
                    const disabled = isPersonaDisabled(persona._id);
                    return (
                      <div
                        key={persona._id}
                        className={cn(
                          "border rounded-lg p-3 transition-opacity",
                          disabled && "opacity-60"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <span className="text-lg flex-shrink-0">
                              {persona.icon || "🤖"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm truncate">
                                {persona.name}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {persona.description}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={!disabled}
                            onCheckedChange={checked =>
                              handleToggleBuiltInPersona(persona._id, !checked)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User Custom Personas */}
            {personas && personas.filter(p => !p.isBuiltIn).length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Custom Personas</h3>
                  <p className="text-sm text-muted-foreground">
                    Your custom system prompts for different conversation styles
                  </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {personas
                    .filter(persona => !persona.isBuiltIn)
                    .map(persona => (
                      <div
                        key={persona._id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-xl flex-shrink-0">
                              {persona.icon || "🤖"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm">
                                {persona.name}
                              </h4>
                              {persona.description && (
                                <p className="text-xs text-muted-foreground">
                                  {persona.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Dialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <FileText className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  View system prompt
                                </TooltipContent>
                              </Tooltip>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <span className="text-lg">
                                      {persona.icon || "🤖"}
                                    </span>
                                    {persona.name} - System Prompt
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 overflow-auto p-4 bg-muted/20 rounded-lg">
                                  <EnhancedMarkdown>
                                    {persona.prompt}
                                  </EnhancedMarkdown>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/settings/personas/${persona._id}/edit`}
                                >
                                  <Button variant="ghost" size="sm">
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>Edit persona</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setDeletingPersona(persona._id)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete persona</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Empty State for Custom Personas */}
            {personas && personas.filter(p => !p.isBuiltIn).length === 0 && (
              <div className="text-center py-8 border rounded-lg border-dashed">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Custom Personas
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create your first custom persona to define specialized AI
                  behavior
                </p>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation */}
        <ConfirmationDialog
          open={!!deletingPersona}
          onOpenChange={open => !open && setDeletingPersona(null)}
          title="Delete Persona"
          description="Are you sure you want to delete this persona? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeletePersona}
        />
      </div>
    </TooltipProvider>
  );
}
