import { useCallback, useEffect, useState } from "react";
import { setThemeCookie, withDisabledAnimations } from "@/lib/theme-utils";
import { useServerTheme } from "@/providers/theme-provider";

export function useTheme() {
  const serverTheme = useServerTheme();
  const [mounted, setMounted] = useState(false);
  const [clientTheme, setClientTheme] = useState<"light" | "dark">(serverTheme);

  useEffect(() => {
    setMounted(true);
    // Read current theme from HTML class
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.classList.contains("dark")
      ? "dark"
      : "light";
    setClientTheme(currentTheme);
  }, []);

  const theme = mounted ? clientTheme : serverTheme;

  const setTheme = useCallback((newTheme: "light" | "dark") => {
    withDisabledAnimations(() => {
      // Update HTML class immediately
      const htmlElement = document.documentElement;
      htmlElement.classList.remove("light", "dark");
      htmlElement.classList.add(newTheme);

      // Update state
      setClientTheme(newTheme);

      // Update cookie
      setThemeCookie(newTheme);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [theme, setTheme]);

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
