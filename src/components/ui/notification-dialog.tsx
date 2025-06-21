"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  type?: "success" | "error" | "warning" | "info";
  actionText?: string;
  onAction?: () => void;
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    className: "text-coral-500",
  },
  error: {
    icon: XCircle,
    className: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    className: "text-yellow-500",
  },
  info: {
    icon: Info,
    className: "text-blue-500",
  },
};

export function NotificationDialog({
  open,
  onOpenChange,
  title,
  description,
  type = "info",
  actionText = "OK",
  onAction,
}: NotificationDialogProps) {
  const handleAction = () => {
    onAction?.();
    onOpenChange(false);
  };

  const IconComponent = typeConfig[type].icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <IconComponent
              className={`h-5 w-5 ${typeConfig[type].className}`}
            />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="ml-8">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleAction}>
            {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
