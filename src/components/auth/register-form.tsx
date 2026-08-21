"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { Check, X } from "lucide-react";
import { registerAction } from "@/lib/actions/auth-register";

type Props = {
  nextPath: string;
  errorMessage: string;
};

/**
 * Una regla de contraseña: si se cumple, y con qué clave se nombra.
 *
 * La clave y no el texto, por lo mismo que el resto de la serie: la regla es
 * lógica —se evalúa— y su nombre es copy. Mezclarlas obligaba a traducir dentro
 * de la función que decide.
 */
type Req = { key: "minLength" | "uppercase" | "symbol" | "match"; met: boolean };

function getRequirements(password: string, confirm: string): Req[] {
  return [
    { key: "minLength", met: password.length >= 8 },
    { key: "uppercase", met: /[A-Z]/.test(password) },
    { key: "symbol", met: /[^a-zA-Z0-9]/.test(password) },
    { key: "match", met: password.length > 0 && password === confirm },
  ];
}

function isValidName(name: string) {
  return name.length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/.test(name.trim());
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function RegisterForm({ nextPath, errorMessage }: Props) {
  const t = useTranslations("Auth.register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false });

  const requirements = getRequirements(password, confirm);
  const nameValid = isValidName(name);
  const emailValid = isValidEmail(email);

  const inputClass = (valid: boolean, wasTouched: boolean) =>
    `mt-2 h-11 w-full rounded-xl border bg-ca-background px-3 text-sm outline-none transition focus:ring-2 ${
      wasTouched && !valid
        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
        : wasTouched && valid
          ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
          : "border-ca-border focus:border-ca-navy-950 focus:ring-ca-navy-950/10"
    }`;

  return (
    <form action={registerAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />

      {errorMessage ? (
        <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
          {errorMessage}
        </div>
      ) : null}

      {/* Nombre */}
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-ca-navy-950">
          {t("fullName")}
        </label>
        <input
          id="name"
          name="name"
          required
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          className={inputClass(nameValid, touched.name)}
        />
        {touched.name && !nameValid && (
          <p className="mt-1 text-xs text-red-500">
            {t("nameHelper")}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-bold text-ca-navy-950">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          className={inputClass(emailValid, touched.email)}
        />
        {touched.email && !emailValid && (
          <p className="mt-1 text-xs text-red-500">
            {t("emailHelper")}
          </p>
        )}
      </div>

      {/* Contraseña */}
      <div>
        <label htmlFor="password" className="block text-sm font-bold text-ca-navy-950">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          required
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none transition focus:border-ca-navy-950 focus:ring-2 focus:ring-ca-navy-950/10"
        />
      </div>

      {/* Confirmar contraseña */}
      <div>
        <label htmlFor="passwordConfirm" className="block text-sm font-bold text-ca-navy-950">
          {t("confirmPassword")}
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          required
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none transition focus:border-ca-navy-950 focus:ring-2 focus:ring-ca-navy-950/10"
        />
      </div>

      {/* Requisitos de contraseña */}
      {password.length > 0 || confirm.length > 0 ? (
        <ul className="space-y-1.5 rounded-xl border border-ca-border bg-ca-background px-4 py-3">
          {requirements.map((req) => (
            <li key={req.key} className="flex items-center gap-2 text-xs font-semibold">
              {req.met ? (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              ) : (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-400 text-white">
                  <X className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
              <span className={req.met ? "text-emerald-700" : "text-red-500"}>
                {t(`rule.${req.key}`)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Teléfono */}
      <div>
        <label htmlFor="phone" className="block text-sm font-bold text-ca-navy-950">
          {t("phone")}{" "}
          <span className="font-normal text-ca-text-secondary">{t("optional")}</span>
        </label>
        <div className="mt-2 flex h-11 overflow-hidden rounded-xl border border-ca-border bg-ca-background focus-within:border-ca-navy-950 focus-within:ring-2 focus-within:ring-ca-navy-950/10 transition">
          <span className="flex items-center border-r border-ca-border bg-white px-3 text-sm font-bold text-ca-navy-950 select-none">
            +503
          </span>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel-national"
            placeholder="7000-0000"
            pattern="[0-9]{4}-?[0-9]{4}"
            maxLength={9}
            className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-ca-text-secondary/50"
          />
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex h-[52px] w-full items-center justify-center rounded-[14px] bg-ca-navy-950 text-sm font-black text-white shadow-ca-button-hover transition hover:bg-ca-navy-800"
      >
        {t("submit")}
      </button>

      <p className="text-center text-sm text-ca-text-secondary">
        {t("haveAccount")}{" "}
        <Link
          href={{ pathname: "/auth/login", query: { next: nextPath } }}
          className="font-bold text-ca-blue-700 hover:underline"
        >
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
