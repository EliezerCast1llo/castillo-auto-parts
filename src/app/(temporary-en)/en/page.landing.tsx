import { headers } from "next/headers";
import { LandingContent, LandingStructuredData } from "../../(temporary)/landing-content";

export const dynamic = "force-dynamic";

export default async function EnglishLandingPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <LandingStructuredData locale="en" nonce={nonce} />
      <LandingContent locale="en" otherHref="/" otherLabel="ES" />
    </>
  );
}
