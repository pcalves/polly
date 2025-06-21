"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ParrotLogoProps {
  isThinking?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const COMPANION_EMOJIS = [
  "✨", // sparkles - for AI magic
  "🎲", // dice - for randomness/stochastic
  "💭", // thought bubble - for thinking
  "🌈", // rainbow - for diversity of models
  "🎯", // target - for accuracy
  "🔮", // crystal ball - for predictions
  "💫", // dizzy - for intelligence
  "🎪", // circus tent - for the "variety show" of models
  "🎨", // palette - for creativity
  "🚀", // rocket - for speed/advancement
];

function ThinkingDots() {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label="AI thinking"
    >
      {[0, 1, 2].map(index => (
        <span
          key={index}
          className="inline-block w-1 h-1 bg-current rounded-full"
          style={{
            animation: "thinkingPulse 1.4s infinite ease-in-out",
            animationDelay: `${index * 200}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function ParrotLogo({
  isThinking = false,
  className,
  size = "md",
}: ParrotLogoProps) {
  const [companionEmoji, setCompanionEmoji] = useState(COMPANION_EMOJIS[0]);
  const [isVisible, setIsVisible] = useState(true);

  // Randomize companion emoji on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * COMPANION_EMOJIS.length);
    setCompanionEmoji(COMPANION_EMOJIS[randomIndex]);
  }, []);

  // Function to change companion emoji with fade effect
  const changeCompanionEmoji = () => {
    setIsVisible(false);
    setTimeout(() => {
      const currentIndex = COMPANION_EMOJIS.indexOf(companionEmoji);
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * COMPANION_EMOJIS.length);
      } while (newIndex === currentIndex && COMPANION_EMOJIS.length > 1);

      setCompanionEmoji(COMPANION_EMOJIS[newIndex]);
      setIsVisible(true);
    }, 100);
  };

  // Expose the change function globally for when messages are sent
  useEffect(() => {
    const handleMessageSent = () => changeCompanionEmoji();
    window.addEventListener("parrot-logo-change", handleMessageSent);
    return () =>
      window.removeEventListener("parrot-logo-change", handleMessageSent);
  }, [companionEmoji]);

  const sizeClasses = useMemo(() => {
    const sizes = {
      sm: "text-base gap-1", // ~16px
      md: "text-xl gap-1.5", // ~20px
      lg: "text-2xl gap-2", // ~24px
    };
    return sizes[size];
  }, [size]);

  return (
    <div
      className={cn("flex items-center", sizeClasses, className)}
      aria-label="Polly AI Chat"
    >
      <span className="text-current" role="img" aria-label="Parrot">
        🦜
      </span>
      <span
        className={cn(
          "text-current transition-opacity duration-200 flex items-center",
          isVisible ? "opacity-100" : "opacity-0"
        )}
      >
        {isThinking ? <ThinkingDots /> : companionEmoji}
      </span>
    </div>
  );
}

// Helper function to trigger emoji change from anywhere in the app
export function triggerParrotLogoChange() {
  window.dispatchEvent(new CustomEvent("parrot-logo-change"));
}
