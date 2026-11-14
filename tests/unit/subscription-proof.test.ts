import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "test-secret-that-is-definitely-longer-than-32-chars";
const TOKEN = "11111111-1111-4111-8111-111111111111";

// The module caches its signing key, so load a fresh copy per test.
async function loadProof() {
  vi.resetModules();
  return import("@/lib/subscription-proof");
}

describe("subscription proof", () => {
  beforeEach(() => vi.stubEnv("SUBSCRIPTION_PROOF_SECRET", SECRET));
  afterEach(() => vi.unstubAllEnvs());

  it("round-trips: a fresh proof verifies for its token", async () => {
    const { createProof, verifyProof } = await loadProof();
    const proof = await createProof(TOKEN);
    expect(proof).toMatch(/^\d+\.[A-Za-z0-9_-]+$/);
    expect(await verifyProof(TOKEN, proof as string)).toBe(true);
  });

  it("is bound to its token", async () => {
    const { createProof, verifyProof } = await loadProof();
    const proof = (await createProof(TOKEN)) as string;
    expect(
      await verifyProof("22222222-2222-4222-8222-222222222222", proof),
    ).toBe(false);
  });

  it("rejects a tampered expiry or signature", async () => {
    const { createProof, verifyProof } = await loadProof();
    const proof = (await createProof(TOKEN)) as string;
    const [expires, signature] = proof.split(".");
    expect(
      await verifyProof(TOKEN, `${Number(expires) + 3600}.${signature}`),
    ).toBe(false);
    expect(await verifyProof(TOKEN, `${expires}.${signature}x`)).toBe(false);
    expect(await verifyProof(TOKEN, "not-a-proof")).toBe(false);
  });

  it("expires after the TTL", async () => {
    const { createProof, verifyProof, PROOF_TTL_SECONDS } = await loadProof();
    const now = Date.now();
    const proof = (await createProof(TOKEN, now)) as string;
    expect(
      await verifyProof(TOKEN, proof, now + (PROOF_TTL_SECONDS - 1) * 1000),
    ).toBe(true);
    expect(
      await verifyProof(TOKEN, proof, now + (PROOF_TTL_SECONDS + 1) * 1000),
    ).toBe(false);
  });

  it("is disabled (never verifies) without a strong secret", async () => {
    vi.stubEnv("SUBSCRIPTION_PROOF_SECRET", "too-short");
    const { createProof, verifyProof } = await loadProof();
    expect(await createProof(TOKEN)).toBeNull();
    expect(await verifyProof(TOKEN, "9999999999.abc")).toBe(false);
  });
});
