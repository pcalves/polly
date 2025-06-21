"use client";

import { useState, useCallback } from "react";

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions>({
    title: "",
    description: "",
  });
  const [onConfirmCallback, setOnConfirmCallback] = useState<
    (() => void) | null
  >(null);
  const [onCancelCallback, setOnCancelCallback] = useState<(() => void) | null>(
    null
  );

  const confirm = useCallback(
    (
      opts: ConfirmationOptions,
      onConfirm: () => void,
      onCancel?: () => void
    ) => {
      setOptions(opts);
      setOnConfirmCallback(() => onConfirm);
      setOnCancelCallback(() => onCancel);
      setIsOpen(true);
    },
    []
  );

  const handleConfirm = useCallback(() => {
    onConfirmCallback?.();
    setIsOpen(false);
  }, [onConfirmCallback]);

  const handleCancel = useCallback(() => {
    onCancelCallback?.();
    setIsOpen(false);
  }, [onCancelCallback]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onCancelCallback?.();
      }
      setIsOpen(open);
    },
    [onCancelCallback]
  );

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel,
    handleOpenChange,
  };
}
