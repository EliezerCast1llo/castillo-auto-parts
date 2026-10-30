import { MapPin } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteHeader } from "@/components/site-header";
import { requireAdminRole } from "@/lib/admin-auth";
import { defaultPickupLocation, DEFAULT_LOCATION_CODE } from "@/lib/fulfillment";
import { db } from "@/lib/db";
import { updateShippingPromotion, updatePickupSettings } from "./actions";
import { defaultLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

type AdminSettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Admin ajustes | Castillo Auto Parts",
};

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
  const adminUser = await requireAdminRole("ADMIN");
  await ensureFulfillmentDefaults();

  const params = searchParams ? await searchParams : {};
  const status = firstValue(params.estado);
  const statusMessage = getStatusMessage(status);
  const [pickupLocation, promotion] = await Promise.all([
    db.inventoryLocation.findUnique({ where: { code: DEFAULT_LOCATION_CODE } }),
    db.shippingPromotion.findUnique({ where: { id: "national" } }),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={defaultLocale} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-md border border-border bg-card p-5">
          <p className="text-sm font-semibold text-success">Admin protegido</p>
          <div className="mt-1 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-2xl font-bold text-primary">Ajustes de entrega</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Configura el retiro en bodega y la promoción de envío nacional. El costo de paquetería lo absorbe la tienda cuando la promoción está activa.
              </p>
            </div>
            <AdminNav active="settings" user={adminUser} />
          </div>
        </section>

        {statusMessage ? (
          <AdminSettingsNotice isError={isErrorStatus(status)} message={statusMessage} />
        ) : null}

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <section className="rounded-md border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-primary">Retiro en bodega</h2>
              </div>

              <form action={updatePickupSettings} className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <SettingsField
                    defaultValue={pickupLocation?.name ?? defaultPickupLocation.name}
                    label="Nombre"
                    name="name"
                    required
                  />
                  <SettingsField
                    defaultValue={pickupLocation?.address ?? defaultPickupLocation.address}
                    label="Dirección"
                    name="address"
                    required
                  />
                  <SettingsField
                    defaultValue={decimalToString(pickupLocation?.latitude) ?? String(defaultPickupLocation.latitude ?? "")}
                    label="Latitud"
                    name="latitude"
                  />
                  <SettingsField
                    defaultValue={decimalToString(pickupLocation?.longitude) ?? String(defaultPickupLocation.longitude ?? "")}
                    label="Longitud"
                    name="longitude"
                  />
                </div>
                <SettingsTextarea
                  defaultValue={pickupLocation?.pickupHours ?? defaultPickupLocation.pickupHours}
                  label="Horario"
                  name="pickupHours"
                  rows={2}
                />
                <SettingsTextarea
                  defaultValue={
                    pickupLocation?.pickupInstructions ?? defaultPickupLocation.pickupInstructions
                  }
                  label="Instrucciones"
                  name="pickupInstructions"
                  rows={3}
                />
                <button className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white">
                  Guardar retiro
                </button>
              </form>
            </section>

            <section className="rounded-md border border-border bg-card p-5">
              <h2 className="text-lg font-bold text-primary">Promoción de envío gratis</h2>
              <p className="mt-2 text-sm">Apagada por defecto. La tienda paga la tarifa real y el cliente paga $0 cuando cumple el mínimo de productos.</p>
              <form action={updateShippingPromotion} className="mt-4 space-y-4">
                <label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="enabled" value="true" defaultChecked={promotion?.enabled ?? false} /> Activar promoción</label>
                <SettingsField label="Compra mínima USD (con IVA, sin envío)" name="minimumSubtotal" type="number" min="0" step="0.01" defaultValue={((promotion?.minimumSubtotalCents ?? 0) / 100).toFixed(2)} required />
                <button className="min-h-11 rounded-md bg-primary px-4 font-semibold text-white">Guardar promoción</button>
              </form>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function SettingsField({
  defaultValue,
  label,
  name,
  required,
  type = "text",
  ...props
}: {
  defaultValue?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-md border border-border bg-card px-3 text-sm"
        defaultValue={defaultValue}
        name={name}
        required={required}
        type={type}
        {...props}
      />
    </label>
  );
}

function SettingsTextarea({
  defaultValue,
  label,
  name,
  rows,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  rows: number;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <textarea
        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
        defaultValue={defaultValue}
        name={name}
        rows={rows}
      />
    </label>
  );
}

function AdminSettingsNotice({ isError, message }: { isError: boolean; message: string }) {
  return (
    <div
      className={`mt-5 rounded-md p-3 text-sm font-semibold ${
        isError ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
      }`}
    >
      {message}
    </div>
  );
}

async function ensureFulfillmentDefaults() {
  const location = await db.inventoryLocation.findUnique({
    where: { code: DEFAULT_LOCATION_CODE },
    select: { id: true },
  });

  if (!location) {
    await db.inventoryLocation.create({
      data: {
        address: defaultPickupLocation.address,
        code: DEFAULT_LOCATION_CODE,
        isActive: true,
        isDefault: true,
        latitude: defaultPickupLocation.latitude,
        longitude: defaultPickupLocation.longitude,
        name: defaultPickupLocation.name,
        pickupHours: defaultPickupLocation.pickupHours,
        pickupInstructions: defaultPickupLocation.pickupInstructions,
      },
    });
  }

}

function decimalToString(value: { toString: () => string } | null | undefined) {
  return value ? value.toString() : undefined;
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    promotion_updated: "Promoción actualizada.",
    invalid_promotion: "Indica un monto mínimo válido.",
    duplicate: "Ya existe una zona con ese slug.",
    invalid_pickup: "Revisa los datos de retiro.",
    invalid_zone: "Revisa los datos de la zona.",
    pickup_error: "No se pudieron guardar los datos de retiro.",
    pickup_updated: "Datos de retiro actualizados.",
    zone_created: "Zona creada.",
    zone_error: "No se pudo guardar la zona.",
    zone_updated: "Zona actualizada.",
  };

  return messages[status] ?? "";
}

function isErrorStatus(status: string) {
  return ["invalid_promotion", "duplicate", "invalid_pickup", "invalid_zone", "pickup_error", "zone_error"].includes(status);
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
