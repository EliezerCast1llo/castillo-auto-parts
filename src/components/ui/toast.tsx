"use client";

import {
 createContext,
 useCallback,
 useContext,
 useMemo,
 useRef,
 useState,
 type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";

type ToastItem = {
 id: number;
 message: string;
 tone: ToastTone;
};

type ToastContextValue = {
 showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3500;

export function useToast() {
 const context = useContext(ToastContext);
 if (!context) {
 throw new Error("useToast debe usarse dentro de <ToastProvider>");
 }
 return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
 const [toasts, setToasts] = useState<ToastItem[]>([]);
 const nextIdRef = useRef(0);

 const showToast = useCallback((message: string, tone: ToastTone = "success") => {
 const id = ++nextIdRef.current;
 setToasts((current) => [...current, { id, message, tone }]);
 setTimeout(() => {
 setToasts((current) => current.filter((toast) => toast.id !== id));
 }, TOAST_DURATION_MS);
 }, []);

 const value = useMemo(() => ({ showToast }), [showToast]);

 return (
 <ToastContext.Provider value={value}>
 {children}

 {/* Stack de toasts */}
 <div
 aria-live="polite"
 className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
 >
 {toasts.map((toast) => (
 <div
 key={toast.id}
 role="status"
 className={cn(
 "pointer-events-auto flex items-center gap-2.5 rounded-ca-control border px-4 py-3 text-sm font-bold shadow-ca-overlay",
 toast.tone === "success"
 ? "border-ca-border bg-ca-navy-950 text-white"
 : "border-red-200 bg-white text-red-700",
 )}
 >
 {toast.tone === "success" ? (
 <CheckCircle2 className="h-4 w-4 shrink-0 text-ca-gold-400" />
 ) : (
 <CircleAlert className="h-4 w-4 shrink-0" />
 )}
 {toast.message}
 </div>
 ))}
 </div>
 </ToastContext.Provider>
 );
}
