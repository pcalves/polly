"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { EmojiClickData } from "emoji-picker-react";
import { SettingsHeader } from "@/components/settings/settings-header";
import {
  PersonaForm,
  PersonaFormData,
} from "@/components/settings/persona-form";

export default function EditPersonaPage() {
  const router = useRouter();
  const params = useParams();
  const personaId = params.id as Id<"personas">;

  const persona = useQuery(api.personas.get, { id: personaId });
  const updatePersona = useMutation(api.personas.update);

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State to hold form data - null until persona loads
  const [formData, setFormData] = useState<PersonaFormData | null>(null);

  // Initialize form data when persona loads
  useEffect(() => {
    if (persona && !formData) {
      setFormData({
        name: persona.name,
        description: persona.description || "",
        prompt: persona.prompt,
        icon: persona.icon || "🤖",
      });
    }
  }, [persona, formData]);

  const handleUpdatePersona = async () => {
    if (!formData || !formData.name.trim() || !formData.prompt.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await updatePersona({
        id: personaId,
        name: formData.name,
        description: formData.description,
        prompt: formData.prompt,
        icon: formData.icon,
      });

      router.push("/settings/personas");
    } catch (error) {
      console.error("Failed to update persona:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (!formData) return;
    setFormData(prev => (prev ? { ...prev, icon: emojiData.emoji } : null));
    setIsEmojiPickerOpen(false);
  };

  const isFormValid =
    formData && formData.name.trim() && formData.prompt.trim();

  // Show loading state while persona is being fetched or form data is being initialized
  if (persona === undefined || !formData) {
    return (
      <div className="space-y-8">
        <SettingsHeader
          title="Edit Persona"
          description="Update your AI assistant's personality and style"
        />
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="h-6 bg-muted rounded w-40"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-48"></div>
            <div className="h-80 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if persona not found
  if (persona === null) {
    return (
      <div className="space-y-8">
        <SettingsHeader
          title="Persona Not Found"
          description="The persona you're trying to edit doesn't exist or you don't have permission to edit it."
        />
        <div className="text-center">
          <Button onClick={() => router.push("/settings/personas")}>
            Back to Personas
          </Button>
        </div>
      </div>
    );
  }

  // Now we know formData is not null, so we can safely render the form
  return (
    <div className="space-y-8">
      <SettingsHeader
        title="Edit Persona"
        description="Update your AI assistant's personality and style"
      />

      {/* Form */}
      <PersonaForm
        formData={formData}
        setFormData={
          setFormData as React.Dispatch<React.SetStateAction<PersonaFormData>>
        }
        isEmojiPickerOpen={isEmojiPickerOpen}
        setIsEmojiPickerOpen={setIsEmojiPickerOpen}
        handleEmojiClick={handleEmojiClick}
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          size="default"
          onClick={() => router.push("/settings/personas")}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          size="default"
          onClick={handleUpdatePersona}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
