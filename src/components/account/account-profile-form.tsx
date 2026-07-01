import { Save, User } from "lucide-react";

type AccountProfileFormProps = {
  action: (formData: FormData) => Promise<void>;
  email: string | null;
  name: string | null;
  phone: string | null;
};

export function AccountProfileForm({
  action,
  email,
  name,
  phone,
}: AccountProfileFormProps) {
  return (
    <section className="h-full rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-soft)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ca-background text-ca-navy-950">
          <User className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-xl font-black text-ca-navy-950">Información personal</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-ca-text-secondary">
            Revisa tus datos de cuenta y actualiza tu teléfono de contacto.
          </p>
        </div>
      </div>

      <form action={action} className="mt-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField
            helper="El nombre no puede modificarse desde esta sección."
            label="Nombre completo"
            value={name || "Nombre no disponible"}
          />
          <ReadOnlyField
            helper="El correo está asociado a tu cuenta."
            label="Correo electrónico"
            value={email || "Correo no disponible"}
          />
        </div>

        <div>
          <label htmlFor="account-phone" className="block text-sm font-black text-ca-navy-950">
            Teléfono
          </label>
          <div className="mt-2 flex min-h-12 overflow-hidden rounded-xl border border-ca-border bg-ca-background transition focus-within:border-ca-navy-950 focus-within:ring-2 focus-within:ring-ca-navy-950/10">
            <span className="flex shrink-0 items-center border-r border-ca-border bg-white px-3 text-sm font-black text-ca-navy-950">
              +503
            </span>
            <input
              autoComplete="tel"
              className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-ca-navy-950 outline-none placeholder:text-ca-text-secondary/60"
              defaultValue={phone ?? ""}
              id="account-phone"
              name="phone"
              placeholder="7000-0000"
              type="tel"
            />
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-ca-text-secondary">
            Este es tu número de contacto para pedidos y notificaciones.
          </p>
        </div>

        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ca-navy-950 px-5 text-sm font-black text-white shadow-[0_8px_18px_rgba(6,25,51,0.16)] transition hover:bg-ca-navy-800 sm:w-auto"
          type="submit"
        >
          <Save className="h-4 w-4" strokeWidth={2} />
          Guardar teléfono
        </button>
      </form>
    </section>
  );
}

function ReadOnlyField({
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm font-black text-ca-navy-950">{label}</p>
      <div
        aria-label={label}
        className="mt-2 flex min-h-12 items-center rounded-xl border border-ca-border bg-ca-background px-3 text-sm font-semibold text-ca-text-secondary"
        role="group"
      >
        <span className="line-clamp-2 break-words">{value}</span>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-ca-text-secondary">{helper}</p>
    </div>
  );
}
