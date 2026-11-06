import Link from "next/link";
import { randomUUID } from "node:crypto";
import { requireAdminRole } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { boxfulConfig } from "@/lib/boxful/config";
import { boxfulCatalog } from "@/lib/boxful/provider";
import { municipalitiesByDepartment } from "@/data/el-salvador";
import { deleteBoxfulLocation, recordBoxfulTopup, saveBoxfulLocation } from "./actions";
export const dynamic = "force-dynamic";
export default async function BoxfulAdmin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireAdminRole("ADMIN", "ACCOUNTING");
  const query = await searchParams;
  let catalog: Awaited<ReturnType<typeof boxfulCatalog>> = [];
  let locations: Awaited<ReturnType<typeof db.boxfulLocation.findMany>> = [];
  let balance: number | null = null;
  try {
    const config = boxfulConfig();
    locations = await db.boxfulLocation.findMany({ where: { accountScope: config.scope }, orderBy: [{ department: "asc" }, { municipality: "asc" }, { district: "asc" }] });
    balance = (await db.boxfulBalanceEntry.aggregate({ where: { accountScope: config.scope }, _sum: { amountCents: true } }))._sum.amountCents ?? 0;
    if (user.role === "ADMIN" && query.department) catalog = await boxfulCatalog();
  } catch { /* Names-only configuration notice; never display provider/credential errors. */ }
  const department = query.department && Object.hasOwn(municipalitiesByDepartment, query.department) ? query.department : "";
  const state = catalog.find((s) => s.name === department);
  return <main className="mx-auto max-w-4xl space-y-6 p-6">
    <Link href="/admin/orders" className="underline">Volver a órdenes</Link>
    <h1 className="text-2xl font-bold">Boxful</h1>
    {query.estado ? <p role="status">{query.estado === "saved" ? "Cambios guardados." : "No se pudo guardar. Revisa la configuración y los datos."}</p> : null}
    <p>Saldo estimado: {balance === null ? "No disponible" : `$${(balance / 100).toFixed(2)}`}. Recargas registradas menos costo cotizado de guías creadas; puede diferir del saldo de Boxful.</p>
    <form action={recordBoxfulTopup} className="space-x-3 rounded-xl border p-4">
      <input type="hidden" name="id" value={randomUUID()} />
      <label>Recarga confirmada (centavos USD) <input name="amountCents" type="number" min="1" max="100000000" required className="border p-2" /></label>
      <button className="rounded bg-ca-navy-950 p-3 text-white">Registrar recarga</button>
    </form>
    {user.role === "ADMIN" ? <section className="space-y-4">
      <h2 className="text-xl font-bold">Distritos verificados</h2>
      <p>Confirma que el distrito pertenece al municipio seleccionado. Los IDs se toman del catálogo de esta cuenta y entorno, nunca de ejemplos.</p>
      <form className="space-x-3">
        <label>Departamento <select name="department" defaultValue={department} className="border p-2"><option value="">Selecciona</option>{Object.keys(municipalitiesByDepartment).map((d) => <option key={d}>{d}</option>)}</select></label>
        <button className="border p-2">Consultar catálogo</button>
      </form>
      {state ? <form action={saveBoxfulLocation} className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
        <input type="hidden" name="department" value={department} /><input type="hidden" name="stateId" value={state.id} />
        <label>Municipio <select name="municipality" required className="w-full border p-2">{municipalitiesByDepartment[department].map((m) => <option key={m}>{m}</option>)}</select></label>
        <label>Distrito en Boxful <select name="cityId" required className="w-full border p-2">{state.Cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <button className="rounded bg-ca-navy-950 p-3 text-white">Confirmo el mapeo y guardar</button>
      </form> : department ? <p role="alert">Catálogo no disponible. Revisa las credenciales QA y el acceso a la API.</p> : null}
      <ul className="space-y-3">{locations.map((l) => <li key={l.id} className="flex justify-between gap-4 rounded border p-3"><span>{l.department} / {l.municipality} / {l.district}</span><form action={deleteBoxfulLocation}><input type="hidden" name="id" value={l.id} /><button className="underline">Quitar</button></form></li>)}</ul>
    </section> : null}
  </main>;
}
