import "server-only";

import { z } from "zod";
import { env } from "@/lib/env";

/** Error returned by the API (`{ success: false, error: { code, message } }`). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const ErrorEnvelope = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

type ApiRequest = {
  method?: "GET" | "POST" | "DELETE";
  headers?: Record<string, string>;
};

/**
 * Typed fetch for the Vercel Daily News API.
 * Adds the bypass token, unwraps the response envelope and validates `data`
 * against `schema`. Returns the parsed data plus the raw Response (some
 * endpoints return values in headers, like the subscription token).
 */
export async function apiRequest<T extends z.ZodType>(
  path: string,
  schema: T,
  { method = "GET", headers }: ApiRequest = {},
): Promise<{ data: z.infer<T>; meta: unknown; response: Response }> {
  const response = await fetch(`${env.VERCEL_DAILY_API_URL}${path}`, {
    method,
    headers: {
      accept: "application/json",
      "x-vercel-protection-bypass": env.VERCEL_DAILY_API_BYPASS_TOKEN,
      ...headers,
    },
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = ErrorEnvelope.safeParse(body);
    throw new ApiError(
      response.status,
      parsed.success ? parsed.data.error.code : "HTTP_ERROR",
      parsed.success
        ? parsed.data.error.message
        : `Request to ${path} failed with ${response.status}`,
    );
  }

  const envelope = z
    .object({
      success: z.literal(true),
      data: z.unknown(),
      meta: z.unknown().optional(),
    })
    .parse(body);
  const data: z.output<T> = schema.parse(envelope.data);

  return { data, meta: envelope.meta, response };
}
