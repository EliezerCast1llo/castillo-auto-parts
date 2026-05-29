import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Protege todas las rutas /account/**
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login?next=/account");
  }
  return <>{children}</>;
}
