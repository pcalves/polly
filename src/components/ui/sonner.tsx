"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/hooks/use-theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: null,
        error: null,
        warning: null,
        info: null,
        loading: null,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-sm font-ui text-body-sm",
          description:
            "group-[.toast]:text-muted-foreground group-[.toast]:text-body-sm group-[.toast]:leading-relaxed",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-body-sm group-[.toast]:transition-all group-[.toast]:duration-200",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80 group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-body-sm group-[.toast]:transition-all group-[.toast]:duration-200",
          success:
            "group-[.toaster]:border-accent-emerald/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-emerald-50/80 group-[.toaster]:to-emerald-100/40 group-[.toaster]:text-emerald-900 group-[.toaster]:shadow-emerald-200/50 dark:group-[.toaster]:border-accent-emerald/40 dark:group-[.toaster]:from-emerald-950/60 dark:group-[.toaster]:to-emerald-900/20 dark:group-[.toaster]:text-emerald-100 dark:group-[.toaster]:shadow-emerald-500/20",
          error:
            "group-[.toaster]:border-red-300/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-red-50/80 group-[.toaster]:to-red-100/40 group-[.toaster]:text-red-900 group-[.toaster]:shadow-red-200/50 dark:group-[.toaster]:border-red-400/40 dark:group-[.toaster]:from-red-950/60 dark:group-[.toaster]:to-red-900/20 dark:group-[.toaster]:text-red-100 dark:group-[.toaster]:shadow-red-500/20",
          warning:
            "group-[.toaster]:border-accent-yellow/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-yellow-50/80 group-[.toaster]:to-yellow-100/40 group-[.toaster]:text-yellow-900 group-[.toaster]:shadow-yellow-200/50 dark:group-[.toaster]:border-accent-yellow/40 dark:group-[.toaster]:from-yellow-950/60 dark:group-[.toaster]:to-yellow-900/20 dark:group-[.toaster]:text-yellow-100 dark:group-[.toaster]:shadow-yellow-500/20",
          info: "group-[.toaster]:border-accent-blue/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-blue-50/80 group-[.toaster]:to-blue-100/40 group-[.toaster]:text-blue-900 group-[.toaster]:shadow-blue-200/50 dark:group-[.toaster]:border-accent-blue/40 dark:group-[.toaster]:from-blue-950/60 dark:group-[.toaster]:to-blue-900/20 dark:group-[.toaster]:text-blue-100 dark:group-[.toaster]:shadow-blue-500/20",
        },
      }}
      position="bottom-right"
      richColors={false}
      {...props}
    />
  );
};

export { Toaster };
