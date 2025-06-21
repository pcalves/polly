"use client";

import { useState, useCallback } from "react";

interface NotificationOptions {
  title: string;
  description: string;
  type?: "success" | "error" | "warning" | "info";
  actionText?: string;
}

export function useNotificationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<NotificationOptions>({
    title: "",
    description: "",
  });
  const [onActionCallback, setOnActionCallback] = useState<(() => void) | null>(
    null
  );

  const notify = useCallback(
    (opts: NotificationOptions, onAction?: () => void) => {
      setOptions(opts);
      setOnActionCallback(() => onAction);
      setIsOpen(true);
    },
    []
  );

  const handleAction = useCallback(() => {
    onActionCallback?.();
    setIsOpen(false);
  }, [onActionCallback]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return {
    isOpen,
    options,
    notify,
    handleAction,
    handleOpenChange,
  };
}
