"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Check, User } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { Id } from "../../convex/_generated/dataModel";

interface PersonaPickerProps {
  compact?: boolean;
  className?: string;
  selectedPersonaId?: Id<"personas"> | null;
  onPersonaSelect?: (personaId: Id<"personas"> | null) => void;
}

export function PersonaPicker({
  compact = false,
  className,
  selectedPersonaId = null,
  onPersonaSelect,
}: PersonaPickerProps) {
  const userInfo = useUser();
  const personas = useQuery(api.personas.list, { userId: userInfo.user?._id });
  const userPersonaSettings = useQuery(api.personas.getUserPersonaSettings, {
    userId: userInfo.user?._id,
  });

  const [open, setOpen] = useState(false);

  // Filter out disabled personas
  const availablePersonas = personas?.filter(persona => {
    const isDisabled = userPersonaSettings?.some(
      setting => setting.personaId === persona._id && setting.isDisabled
    );
    return !isDisabled;
  });

  const handlePersonaSelect = async (personaId: Id<"personas"> | null) => {
    onPersonaSelect?.(personaId);
    setOpen(false);
  };

  if (!userInfo.user) {
    return null;
  }

  // Find the current persona from the list
  const currentPersona = selectedPersonaId
    ? availablePersonas?.find(p => p._id === selectedPersonaId) || null
    : null;

  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-auto text-xs font-medium text-muted-foreground/80 hover:text-foreground",
              className
            )}
          >
            {currentPersona ? (
              <>
                <span className="mr-1">{currentPersona.icon}</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {currentPersona.name}
                </span>
              </>
            ) : (
              <>
                <User className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="ml-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Persona
                </span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <PersonaList
            personas={availablePersonas}
            currentPersona={currentPersona}
            onPersonaSelect={handlePersonaSelect}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            {currentPersona ? (
              <>
                <span className="text-lg">{currentPersona.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{currentPersona.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {currentPersona.description}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/40">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Default</div>
                  <div className="text-xs text-muted-foreground">
                    Standard AI assistant behavior
                  </div>
                </div>
              </>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <PersonaList
          personas={availablePersonas}
          currentPersona={currentPersona}
          onPersonaSelect={handlePersonaSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

interface PersonaListProps {
  personas:
    | Array<{
        _id: Id<"personas">;
        name: string;
        description: string;
        prompt: string;
        icon?: string;
        isBuiltIn: boolean;
      }>
    | undefined;
  currentPersona: {
    _id: Id<"personas">;
    name: string;
    description: string;
    prompt: string;
    icon?: string;
    isBuiltIn: boolean;
  } | null;
  onPersonaSelect: (personaId: Id<"personas"> | null) => void;
}

function PersonaList({
  personas,
  currentPersona,
  onPersonaSelect,
}: PersonaListProps) {
  // Group personas by built-in vs custom
  const builtInPersonas = personas?.filter(p => p.isBuiltIn) || [];
  const customPersonas = personas?.filter(p => !p.isBuiltIn) || [];

  return (
    <Command>
      <CommandInput placeholder="Search personas..." />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4">
            <User className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">No personas found</p>
              <p className="text-xs text-muted-foreground">
                Try searching or create a custom persona
              </p>
            </div>
          </div>
        </CommandEmpty>

        {/* Default option */}
        <CommandGroup>
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Default
          </div>
          <CommandItem
            value="default"
            onSelect={() => onPersonaSelect(null)}
            className="flex items-center gap-2"
          >
            <span className="text-lg">🤖</span>
            <div className="flex-1">
              <div className="font-medium">Default</div>
              <div className="text-xs text-muted-foreground">
                Standard AI assistant behavior
              </div>
            </div>
            {!currentPersona && (
              <Check className="h-4 w-4 text-accent-emerald" />
            )}
          </CommandItem>
        </CommandGroup>

        {/* Built-in personas */}
        {builtInPersonas.length > 0 && (
          <>
            <div className="h-px bg-border mx-2 my-1" />
            <CommandGroup>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Built-in
                <span className="ml-2 text-xs text-muted-foreground/60">
                  ({builtInPersonas.length} persona
                  {builtInPersonas.length === 1 ? "" : "s"})
                </span>
              </div>
              {builtInPersonas.map(persona => (
                <CommandItem
                  key={persona._id}
                  value={persona.name}
                  onSelect={() => onPersonaSelect(persona._id)}
                  className="flex items-center gap-2"
                >
                  <span className="text-lg">{persona.icon || "🤖"}</span>
                  <div className="flex-1">
                    <div className="font-medium">{persona.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {persona.description}
                    </div>
                  </div>
                  {currentPersona?._id === persona._id && (
                    <Check className="h-4 w-4 text-accent-emerald" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Custom personas */}
        {customPersonas.length > 0 && (
          <>
            <div className="h-px bg-border mx-2 my-1" />
            <CommandGroup>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Custom
                <span className="ml-2 text-xs text-muted-foreground/60">
                  ({customPersonas.length} persona
                  {customPersonas.length === 1 ? "" : "s"})
                </span>
              </div>
              {customPersonas.map(persona => (
                <CommandItem
                  key={persona._id}
                  value={persona.name}
                  onSelect={() => onPersonaSelect(persona._id)}
                  className="flex items-center gap-2"
                >
                  <span className="text-lg">{persona.icon || "🤖"}</span>
                  <div className="flex-1">
                    <div className="font-medium">{persona.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {persona.description}
                    </div>
                  </div>
                  {currentPersona?._id === persona._id && (
                    <Check className="h-4 w-4 text-accent-emerald" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
}
