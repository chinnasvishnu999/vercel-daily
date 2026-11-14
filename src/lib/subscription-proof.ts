/**
 * Short-lived, signed proof that a subscription token was verified with the
 * API. Verifying a subscription costs a ~1.5s API call, so after one
 * successful check the proxy issues this proof and trusts it until it
 * expires. Revocations are therefore picked up within PROOF_TTL_SECONDS.
 *
 * Format: `<expiresAtUnixSeconds>.<base64url(HMAC-SHA256(secret, token.exp))>`
 * The token is part of the signed message, so a proof can't be reused for a
 * different token, and it can't be forged or extended without the secret.
 *
 * Uses Web Crypto only, so it runs in the proxy and in Server Actions.
 */
export const PROOF_COOKIE = "vd_subscription_proof";
export const PROOF_TTL_SECONDS = 10 * 60;

const encoder = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> | null {
  const secret = process.env.SUBSCRIPTION_PROOF_SECRET;
  // Without a secret, proofs are disabled and every request is verified.
  if (!secret || secret.length < 32) return null;
  keyPromise ??= crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return keyPromise;
}

function toBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

export async function createProof(
  token: string,
  now = Date.now(),
): Promise<string | null> {
  const key = getKey();
  if (!key) return null;
  const expiresAt = Math.floor(now / 1000) + PROOF_TTL_SECONDS;
  const signature = await crypto.subtle.sign(
    "HMAC",
    await key,
    encoder.encode(`${token}.${expiresAt}`),
  );
  return `${expiresAt}.${toBase64Url(signature)}`;
}

export async function verifyProof(
  token: string,
  proof: string,
  now = Date.now(),
): Promise<boolean> {
  const key = getKey();
  if (!key) return false;

  const [expires, signature, ...rest] = proof.split(".");
  if (!expires || !signature || rest.length > 0) return false;

  const expiresAt = Number(expires);
  if (!Number.isInteger(expiresAt) || expiresAt * 1000 <= now) return false;

  const bytes = fromBase64Url(signature);
  if (!bytes) return false;

  // crypto.subtle.verify compares signatures in constant time.
  return crypto.subtle.verify(
    "HMAC",
    await key,
    bytes,
    encoder.encode(`${token}.${expiresAt}`),
  );
}

export const proofCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: PROOF_TTL_SECONDS,
} as const;
