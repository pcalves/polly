"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { EmojiClickData } from "emoji-picker-react";
import { SettingsHeader } from "@/components/settings/settings-header";
import {
  PersonaForm,
  PersonaFormData,
} from "@/components/settings/persona-form";

export default function NewPersonaPage() {
  const router = useRouter();
  const createPersona = useMutation(api.personas.create);

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<PersonaFormData>({
    name: "",
    description: "",
    prompt: "",
    icon: "🤖",
  });

  const handleCreatePersona = async () => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await createPersona({
        name: formData.name,
        description: formData.description,
        prompt: formData.prompt,
        icon: formData.icon,
      });

      router.push("/settings/personas");
    } catch (error) {
      console.error("Failed to create persona:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setFormData(prev => ({ ...prev, icon: emojiData.emoji }));
    setIsEmojiPickerOpen(false);
  };

  const isFormValid = formData.name.trim() && formData.prompt.trim();

  return (
    <div className="space-y-8">
      <SettingsHeader
        title="Create New Persona"
        description="Give your AI assistant a unique personality and style for different types of conversations"
      />

      {/* Form */}
      <PersonaForm
        formData={formData}
        setFormData={setFormData}
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
          onClick={handleCreatePersona}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? "Creating..." : "Create Persona"}
        </Button>
      </div>
    </div>
  );
}
