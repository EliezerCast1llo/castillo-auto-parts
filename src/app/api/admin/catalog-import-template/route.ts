import { getAdminUserForHandler } from "@/lib/admin-auth";
import { CSV_COLUMNS, exportCsv } from "@/lib/catalog-csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAdminUserForHandler("ADMIN");
  if ("response" in auth) return auth.response;
  return new Response(exportCsv([CSV_COLUMNS]), { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="catalogo-plantilla.csv"',
    "Cache-Control": "no-store",
  } });
}
