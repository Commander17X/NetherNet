# App ↔ relay integration

This document is the contract between the **Expo app** (`src/lib`, `src/app`) and the **NetherNet relay** (`relay/`). Update it whenever either side changes session shape, env vars, or join behavior.

## Responsibilities

| Component | Owns |
|-----------|------|
| `src/lib/relayClient.ts` | HTTP client for relay session lifecycle |
| `src/lib/join.ts` | Bedrock `minecraft://` deep links |
| `src/lib/status.ts`, `motd.ts`, `address.ts` | Java server discovery before relay |
| `relay/src/app.ts` | Express routes, rate limits, auth middleware |
| `relay/src/services/SessionManager.ts` | Session reuse, validation, port binding |
| `relay/src/services/GeyserLauncher.ts` | Per-session Geyser config and process |

## Session lifecycle

```text
App                          Relay                         Geyser
 |  GET /servers (optional)     |                            |
 |--------------------------->|                            |
 |  POST /v1/sessions          |                            |
 |--------------------------->| allocate UDP port           |
 |                            | start Geyser -------------->|
 |<---------------------------| bedrockHost, bedrockPort    |
 |  addExternalServer URL      |                            |
 |  (Bedrock client)           |                            |
 |==========================================================>|
 |                            |        Java javaHost:port   |
```

### Create session

**Request:** `POST /v1/sessions`

```json
{
  "javaHost": "play.trix-islands.gg",
  "javaPort": 2788,
  "authMode": "online",
  "reuse": true
}
```

| Field | Notes |
|-------|--------|
| `javaHost` | Java Edition hostname or IP (public targets only unless relay allows private) |
| `javaPort` | Java TCP port (SRV-resolved port from lib helpers when applicable) |
| `authMode` | `online` (default) or `offline` |
| `reuse` | Default `true`; same target returns existing session |

**Response (201):** includes `bedrockHost`, `bedrockPort`, `id`, `targetKey`, timestamps. Bedrock must use **`bedrockHost:bedrockPort`**, not `javaHost`.

The mobile `RelayClient` in `src/lib` should stay aligned with these field names and paths. If the client layer uses different property names internally, map them at the HTTP boundary only.

### Join step

After a session exists:

1. `buildAddExternalServerUrl` / `buildAddExternalServerUrlFromParsed` in `src/lib/join.ts` encode `name|host:port` for `minecraft://?addExternalServer=…`.
2. Use the relay-returned **`bedrockHost`** and **`bedrockPort`** as the external server endpoint.
3. Display name can come from MOTD/status (`src/lib/motd.ts`, `status.ts`) or the featured catalog.

### Teardown

`DELETE /v1/sessions/:id` stops Geyser and frees the UDP port. The app should delete when the user leaves or abandons a session if the product requires strict cleanup (relay may also expire idle sessions in future versions).

## Authentication

When `RELAY_API_TOKEN` is set on the relay:

- Send `Authorization: Bearer <token>` **or** `X-API-Token: <token>` on `/v1/sessions` routes.
- The app should read the token from secure storage / build-time config, not hard-code in source.

## Discovery before relay

Typical app flow:

1. User enters hostname or picks from `GET /servers` (featured list from `relay/config/public-servers.json`).
2. `src/lib` resolves SRV, queries status APIs, normalizes MOTD.
3. User confirms; app calls `POST /v1/sessions` with resolved `javaHost` / `javaPort`.
4. App presents join UI with deep link.

## Environment pairing

| App | Relay |
|-----|--------|
| `EXPO_PUBLIC_RELAY_URL` (or equivalent) | `PORT` (HTTP, default 8787) |
| Optional token in app config | `RELAY_API_TOKEN` |
| N/A | `PUBLIC_HOST` — must be reachable by Bedrock clients for `bedrockHost` |

## Error handling

- Relay validation errors → 4xx with message body; map to user-visible copy in the app.
- Port pool exhausted → relay returns an error; app should suggest retry or another relay instance.
- Private Java host when disallowed → 4xx; app should explain that only public servers are supported on this relay.

## Testing integration locally

1. Start relay: `npm run dev:relay` from repo root (see `relay/.env`).
2. Point the app dev build at `http://<lan-ip>:8787` (or tunneled URL).
3. Create a session against a known public Java server (e.g. featured Trix Islands).
4. Open the generated `minecraft://` link on a Bedrock device on the same network path to the relay UDP ports.

## CI expectations

- Root: `tsc`, Jest (`src/lib`), Expo `export` when `app.json` / `app.config.*` exists.
- `relay/`: `tsc`, Jest (`relay/__tests__`).

See `.github/workflows/ci.yml`.