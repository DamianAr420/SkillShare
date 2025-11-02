import { reactive } from "vue";

export type ToastType = "success" | "error" | "warning" | "info" | "default";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const toasts = reactive<Toast[]>([]);
let counter = 0;

export function useToast() {
  function showToast(
    msg: string,
    type: ToastType = "default",
    duration = 3000
  ) {
    const id = counter++;
    toasts.push({ id, message: msg, type });

    setTimeout(() => {
      const index = toasts.findIndex((t) => t.id === id);
      if (index !== -1) toasts.splice(index, 1);
    }, duration);
  }

  return { toasts, showToast };
}
