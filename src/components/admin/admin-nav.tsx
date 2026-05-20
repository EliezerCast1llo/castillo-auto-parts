import Link from "next/link";
import { AdminSessionControls } from "./admin-session-controls";

type AdminNavProps = {
  active: "orders" | "products" | "settings";
};

export function AdminNav({ active }: AdminNavProps) {
  return (
    <div className="flex flex-col gap-3 sm:items-end">
      <nav className="flex flex-wrap gap-2" aria-label="Admin">
        <AdminNavLink active={active === "orders"} href="/admin/orders">
          Órdenes
        </AdminNavLink>
        <AdminNavLink active={active === "products"} href="/admin/products">
          Productos
        </AdminNavLink>
        <AdminNavLink active={active === "settings"} href="/admin/settings">
          Ajustes
        </AdminNavLink>
      </nav>
      <AdminSessionControls />
    </div>
  );
}

function AdminNavLink({
  active,
  children,
  href,
}: {
  active: boolean;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      className={`inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm font-semibold ${
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-card text-primary"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}
