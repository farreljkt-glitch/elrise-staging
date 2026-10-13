# P0 verified proxy and private selfie access

**Reason:** Incoming HTTP `X-Real-IP` is user-controlled unless overwritten and authenticated by an actual reverse proxy. A configured list of proxy IPs without the remote TCP peer address does not prove a header is genuine.

## Deployment contract (must pass before IP attendance is activated)

- Reverse proxy / load balancer must be the **only process reachable** on Next app port 3000, ideally Node listens on `127.0.0.1`.
- Generate independent strong `PROXY_TRUST_SECRET` (at least 32 unpredictable bytes), available to both the application environment and proxy configuration. **Never** expose the secret to browsers; **never** include actual value in repository/CI logs.
- At ingress, strip any original client `X-Elrise-Proxy-Secret` and `X-Real-IP` headers. Then proxy must set `X-Elrise-Proxy-Secret` to the configured secret and `X-Real-IP` to the vetted edge client IP. For Nginx terminating the public connection, `$remote_addr` is appropriate *only if trusted CDN/proxy forwarding was separately and correctly configured*. Validate using the backend test IP and a forged client header.
- If the secret is absent, too short, incorrect, or IP invalid, Elrise treats client IP as `null`: IP-only office presence **fails closed**, GPS_OR_IP cannot fall back to unverified IP, and login throttling falls back to email-global buckets. Add gateway-level rate limiting separately (P1).
- Keep `AUTH_SECRET` separate and rotate proxy secret with coordinated proxy/app deploy. Prevent untrusted internal traffic on port 3000.
- `/api/uploads/:id` checks tenant + assigned project for ADMIN_PROJECT; only SUPERADMIN, proper Admin PT and photo owner employee retain authorized access.
- Geographic device reports and watermark are NOT cryptographic proof of actual presence; after complete check-in/check-out, Admin review is still required for payroll.
- CI uses **synthetic** proxy secret and MySQL. No Gajiku production calls.
