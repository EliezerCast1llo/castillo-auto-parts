"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { registerAction } from "@/app/auth/register/actions";

type Props = {
  nextPath: string;
  errorMessage: string;
};

type Req = { label: string; met: boolean };

function getRequirements(password: string, confirm: string): Req[] {
  return [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "Al menos una letra mayúscula", met: /[A-Z]/.test(password) },
    { label: "Al menos un símbolo (!@#$...)", met: /[^a-zA-Z0-9]/.test(password) },
    { label: "Las contraseñas coinciden", met: password.length > 0 && password === confirm },
  ];
}

function isValidName(name: string) {
  return name.length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/.test(name.trim());
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function RegisterForm({ nextPath, errorMessage }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false });

  const requirements = getRequirements(password, confirm);
  const allMet = requirements.every((r) => r.met);
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
          Nombre completo
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
            Solo letras y espacios, mínimo 2 caracteres.
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-bold text-ca-navy-950">
          Correo electrónico
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
            Ingresa un correo válido, ej: usuario@correo.com
          </p>
        )}
      </div>

      {/* Contraseña */}
      <div>
        <label htmlFor="password" className="block text-sm font-bold text-ca-navy-950">
          Contraseña
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
          Confirmar contraseña
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
            <li key={req.label} className="flex items-center gap-2 text-xs font-semibold">
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
                {req.label}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Teléfono */}
      <div>
        <label htmlFor="phone" className="block text-sm font-bold text-ca-navy-950">
          Teléfono{" "}
          <span className="font-normal text-ca-text-secondary">(opcional)</span>
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
        disabled={!allMet || !nameValid || !emailValid}
        className="inline-flex h-[52px] w-full items-center justify-center rounded-[14px] bg-ca-navy-950 text-sm font-black text-white shadow-[0_10px_20px_rgba(6,25,51,0.18)] transition hover:bg-ca-navy-800 disabled:cursor-not-allowed disabled:bg-ca-text-secondary/30 disabled:shadow-none"
      >
        Crear cuenta
      </button>

      <p className="text-center text-sm text-ca-text-secondary">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
          className="font-bold text-ca-blue-700 hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
