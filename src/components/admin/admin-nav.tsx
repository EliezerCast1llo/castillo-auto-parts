import Link from "next/link";
import type { UserRole } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/admin-user";
import { AdminSessionControls } from "./admin-session-controls";

type AdminNavSection =
  | "audit"
  | "orders"
  | "products"
  | "settings"
  | "stock-alerts"
  | "users";

type AdminNavProps = {
  active: AdminNavSection;
  user: { role: UserRole; name: string | null; email: string };
};

// Secciones visibles según rol
const NAV_ITEMS: {
  id: AdminNavSection;
  label: string;
  href: string;
  roles: UserRole[];
}[] = [
  {
    id: "orders",
    label: "Órdenes",
    href: "/admin/orders",
    roles: ["ADMIN", "SALES", "WAREHOUSE", "SUPPORT", "ACCOUNTING"],
  },
  {
    id: "products",
    label: "Productos",
    href: "/admin/products",
    roles: ["ADMIN", "MARKETING"],
  },
  {
    id: "stock-alerts",
    label: "Avisos",
    href: "/admin/stock-alerts",
    roles: ["ADMIN", "SUPPORT", "WAREHOUSE"],
  },
  {
    id: "settings",
    label: "Ajustes",
    href: "/admin/settings",
    roles: ["ADMIN"],
  },
  {
    id: "audit",
    label: "Auditoría",
    href: "/admin/audit",
    roles: ["ADMIN"],
  },
  {
    id: "users",
    label: "Usuarios",
    href: "/admin/users",
    roles: ["ADMIN"],
  },
];

export function AdminNav({ active, user }: AdminNavProps) {
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const displayName = user.name || user.email;
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <div className="flex flex-col gap-3 sm:items-end">
      {/* Identidad del usuario actual */}
      <div className="flex items-center gap-2 text-right">
        <div>
          <p className="text-sm font-bold text-primary">{displayName}</p>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex flex-wrap gap-2" aria-label="Admin">
          {visibleItems.map((item) => (
            <AdminNavLink key={item.id} active={active === item.id} href={item.href}>
              {item.label}
            </AdminNavLink>
          ))}
        </nav>
        <AdminSessionControls />
      </div>
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
