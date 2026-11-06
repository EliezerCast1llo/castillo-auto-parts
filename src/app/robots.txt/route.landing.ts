import { landingSiteUrl } from "@/lib/landing-site-url";

// Separate handlers preserve the storefront's metadata routes and dependency isolation.
export const dynamic = "force-static";

/**
 * Rastreadores de asistentes, permitidos explícitamente.
 *
 * `User-Agent: *` ya los cubriría, pero varios de estos solo entran cuando se
 * los nombra, y nombrarlos deja escrito que fue una decisión y no un descuido.
 * El contenido es comercial y público: el objetivo es justamente que el
 * negocio aparezca cuando alguien pregunta por repuestos en El Salvador.
 *
 * `GPTBot` entrena; `OAI-SearchBot` y `ChatGPT-User` buscan y citan. Se
 * permiten los tres, que es lo que hace falta para aparecer **y** para que lo
 * que se diga esté basado en lo que la página dice.
 */
const ASSISTANT_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "Google-Extended",
  "Applebot-Extended",
];

export function GET() {
  const body = [
    "User-Agent: *",
    "Allow: /",
    "",
    ...ASSISTANT_CRAWLERS.flatMap((agent) => [`User-Agent: ${agent}`, "Allow: /", ""]),
    `Sitemap: ${landingSiteUrl()}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
