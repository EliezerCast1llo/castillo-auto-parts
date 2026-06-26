import { KeyRound, Lock, ShieldCheck } from "lucide-react";

type AccountPasswordFormProps = {
  action: (formData: FormData) => Promise<void>;
  hasPassword: boolean;
};

export function AccountPasswordForm({ action, hasPassword }: AccountPasswordFormProps) {
  return (
    <section className="rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-soft)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ca-background text-ca-navy-950">
          <Lock className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-xl font-black text-ca-navy-950">Seguridad de la cuenta</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-ca-text-secondary">
            Cambia tu contraseña para mantener protegida tu cuenta.
          </p>
        </div>
      </div>

      {hasPassword ? (
        <form action={action} className="mt-6 space-y-5">
          <PasswordField
            autoComplete="current-password"
            label="Contraseña actual"
            name="currentPassword"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <PasswordField
              autoComplete="new-password"
              helper="Mínimo 8 caracteres."
              label="Nueva contraseña"
              minLength={8}
              name="newPassword"
            />
            <PasswordField
              autoComplete="new-password"
              label="Confirmar contraseña"
              minLength={8}
              name="confirmPassword"
            />
          </div>
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ca-navy-950 bg-white px-5 text-sm font-black text-ca-navy-950 transition hover:bg-ca-navy-950 hover:text-white sm:w-auto"
            type="submit"
          >
            <KeyRound className="h-4 w-4" strokeWidth={2} />
            Cambiar contraseña
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-2xl border border-ca-border bg-ca-background p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ca-navy-950">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="font-black text-ca-navy-950">
                Tu cuenta usa acceso con proveedor externo.
              </p>
              <p className="mt-1 text-sm font-medium leading-6 text-ca-text-secondary">
                Si deseas cambiar la forma de acceso, contacta soporte.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PasswordField({
  autoComplete,
  helper,
  label,
  minLength,
  name,
}: {
  autoComplete: string;
  helper?: string;
  label: string;
  minLength?: number;
  name: string;
}) {
  const id = `account-${name}`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-black text-ca-navy-950">
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className="mt-2 h-12 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm font-semibold text-ca-navy-950 outline-none transition focus:border-ca-navy-950 focus:ring-2 focus:ring-ca-navy-950/10"
        id={id}
        minLength={minLength}
        name={name}
        required
        type="password"
      />
      {helper ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-ca-text-secondary">{helper}</p>
      ) : null}
    </div>
  );
}
