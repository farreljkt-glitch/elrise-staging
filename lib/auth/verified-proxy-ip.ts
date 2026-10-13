import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

/**
 * Next Request has no trusted TCP peer IP. Do NOT trust X-Real-IP alone.
 * Only a reverse proxy that injects a server-side secret may supply this header.
 * The proxy MUST strip user-supplied X-Elrise-Proxy-Secret/X-Real-IP first,
 * and Next must be unreachable directly from the internet.
 */
export function getVerifiedClientIp(
  headers: Pick<Headers,"get">,
  configuredSecret: string | undefined = process.env.PROXY_TRUST_SECRET,
): string | null {
  if (!configuredSecret || Buffer.byteLength(configuredSecret,"utf8") < 32) return null;
  const received = headers.get("x-elrise-proxy-secret");
  if (!received) return null;
  const expectedBytes = Buffer.from(configuredSecret,"utf8");
  const actualBytes = Buffer.from(received,"utf8");
  if (expectedBytes.length !== actualBytes.length ||
      !timingSafeEqual(expectedBytes,actualBytes)) return null;
  const ip = (headers.get("x-real-ip") ?? "").trim();
  return isIP(ip) ? ip : null;
}
