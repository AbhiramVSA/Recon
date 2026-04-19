import { create } from 'zustand';
import type { Toast } from '../lib/types';

interface ToastState {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    clearToasts: () => void;
}

function id() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastStore = create<ToastState>()((set, get) => ({
    toasts: [],
    addToast: (toast) => {
        const toastId = id();
        const next = [...get().toasts, { ...toast, id: toastId }];
        const trimmed = next.length > 3 ? next.slice(next.length - 3) : next;
        set({ toasts: trimmed });
        return toastId;
    },
    removeToast: (toastId) => {
        set({ toasts: get().toasts.filter((toast) => toast.id !== toastId) });
    },
    clearToasts: () => set({ toasts: [] }),
}));
