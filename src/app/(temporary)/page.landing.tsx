import { headers } from "next/headers";
import { LandingContent, LandingStructuredData } from "./landing-content";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <LandingStructuredData locale="es" nonce={nonce} />
      <LandingContent locale="es" otherHref="/en" otherLabel="EN" />
    </>
  );
}
