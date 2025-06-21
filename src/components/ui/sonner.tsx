"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: undefined,
        error: undefined,
        warning: undefined,
        info: undefined,
        loading: undefined,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:shadow-lg group-[.toaster]:rounded",
          description:
            "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80",
          success:
            "group-[.toaster]:border-emerald-200 group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-900 dark:group-[.toaster]:border-emerald-800 dark:group-[.toaster]:bg-emerald-950 dark:group-[.toaster]:text-emerald-100",
          error:
            "group-[.toaster]:border-red-200 group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900 dark:group-[.toaster]:border-red-800 dark:group-[.toaster]:bg-red-950 dark:group-[.toaster]:text-red-100",
          warning:
            "group-[.toaster]:border-yellow-200 group-[.toaster]:bg-yellow-50 group-[.toaster]:text-yellow-900 dark:group-[.toaster]:border-yellow-800 dark:group-[.toaster]:bg-yellow-950 dark:group-[.toaster]:text-yellow-100",
          info: "group-[.toaster]:border-blue-200 group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-900 dark:group-[.toaster]:border-blue-800 dark:group-[.toaster]:bg-blue-950 dark:group-[.toaster]:text-blue-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
