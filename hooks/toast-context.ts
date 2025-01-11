import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

export const ToastContext = React.createContext<{
  toasts: ToasterToast[];
  addToast: (toast: Omit<ToasterToast, "id">) => void;
  updateToast: (
    toast: Pick<ToasterToast, "id"> & Partial<ToasterToast>
  ) => void;
  dismissToast: (toastId?: string) => void;
  removeToast: (toastId?: string) => void;
} | null>(null);
