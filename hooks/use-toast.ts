"use client";

import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";
import { ToastContext, type ToasterToast } from "./toast-context";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [state, dispatch] = React.useReducer(
    (state: State, action: Action): State => {
      switch (action.type) {
        case actionTypes.ADD_TOAST:
          return {
            ...state,
            toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
          };
        case actionTypes.UPDATE_TOAST:
          return {
            ...state,
            toasts: state.toasts.map((t) =>
              t.id === action.toast.id ? { ...t, ...action.toast } : t,
            ),
          };
        case actionTypes.DISMISS_TOAST: {
          const { toastId } = action;
          if (toastId) {
            addToRemoveQueue(toastId);
          } else {
            state.toasts.forEach((toast) => addToRemoveQueue(toast.id));
          }
          return {
            ...state,
            toasts: state.toasts.map((t) =>
              t.id === toastId || toastId === undefined
                ? { ...t, open: false }
                : t,
            ),
          };
        }
        case actionTypes.REMOVE_TOAST:
          if (action.toastId === undefined) {
            return { ...state, toasts: [] };
          }
          return {
            ...state,
            toasts: state.toasts.filter((t) => t.id !== action.toastId),
          };
        default:
          return state;
      }
    },
    { toasts: [] },
  );

  const addToRemoveQueue = React.useCallback((toastId: string) => {
    if (toastTimeouts.has(toastId)) return;
    const timeout = setTimeout(() => {
      toastTimeouts.delete(toastId);
      dispatch({ type: actionTypes.REMOVE_TOAST, toastId });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
  }, []);

  const addToast = React.useCallback((toast: Omit<ToasterToast, "id">) => {
    const id = genId();
    dispatch({ type: actionTypes.ADD_TOAST, toast: { ...toast, id } });
  }, []);

  const updateToast = React.useCallback(
    (toast: Pick<ToasterToast, "id"> & Partial<ToasterToast>) => {
      dispatch({ type: actionTypes.UPDATE_TOAST, toast });
    },
    [],
  );

  const dismissToast = React.useCallback((toastId?: string) => {
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId });
  }, []);

  const removeToast = React.useCallback((toastId?: string) => {
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId });
  }, []);

  return React.createElement(
    ToastContext.Provider,
    {
      value: {
        toasts: state.toasts,
        addToast,
        updateToast,
        dismissToast,
        removeToast,
      },
    },
    children,
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
