import { LogOut } from "lucide-react";
import { logoutAdmin } from "@/app/admin/login/actions";

export function AdminSessionControls() {
  return (
    <form action={logoutAdmin}>
      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold text-primary">
        <LogOut className="h-4 w-4" />
        Salir
      </button>
    </form>
  );
}
