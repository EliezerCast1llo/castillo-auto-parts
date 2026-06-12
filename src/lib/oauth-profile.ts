type OAuthProfile = {
  email_verified?: unknown;
};

export function isGoogleEmailVerified(profile: unknown): boolean {
  if (!profile || typeof profile !== "object") return false;

  return (profile as OAuthProfile).email_verified === true;
}

export function canSignInWithOAuthProfile(input: {
  provider?: string | null;
  profile?: unknown;
}): boolean {
  if (input.provider !== "google") return true;

  return isGoogleEmailVerified(input.profile);
}
