# NetherNet relay

HTTP control plane for Bedrock → Java sessions. Each session binds a UDP port from **19132–19232** and starts a **Geyser** instance (standalone JAR or `ghcr.io/geysermc/geyser` via Docker) with a per-session `config.yml`.

## Quick start

```bash
cd relay
cp .env.example .env
# Set PUBLIC_HOST to the hostname Bedrock clients use to reach this host
npm install
npm run dev
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PUBLIC_HOST` | `127.0.0.1` | Hostname/IP advertised as `bedrockHost` in API responses |
| `RELAY_API_TOKEN` | _(unset)_ | When set, `/v1/sessions` requires `Authorization: Bearer <token>` or `X-API-Token` |
| `PORT` | `8787` | HTTP listen port |
| `GEYSER_MODE` | `standalone` | `standalone` (Java `-jar geyser.jar`) or `docker` |
| `GEYSER_JAR_PATH` | `./geyser.jar` | Standalone Geyser jar path |
| `PORT_POOL_MIN` / `PORT_POOL_MAX` | `19132` / `19232` | Bedrock bind port pool |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | `60000` / `60` | Per-IP HTTP rate limit |
| `ALLOW_PRIVATE_TARGETS` | `false` | Allow `javaHost` values in private/loopback ranges |

## HTTP API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Liveness + `freePorts` + `geyserMode` |
| `GET` | `/servers` | No | Featured catalog from `config/public-servers.json` |
| `POST` | `/v1/sessions` | Optional token | Create (or reuse) a relay session |
| `GET` | `/v1/sessions/:id` | Optional token | Session metadata |
| `DELETE` | `/v1/sessions/:id` | Optional token | Stop Geyser and free the port |

### `POST /v1/sessions` body

```json
{
  "javaHost": "play.trix-islands.gg",
  "javaPort": 2788,
  "authMode": "online",
  "reuse": true
}
```

- `authMode`: `online` (default) or `offline` (Floodgate-style offline Java auth).
- `reuse`: default `true` — same `javaHost` + `javaPort` + `authMode` returns the existing session.

### Response (201)

```json
{
  "id": "…",
  "javaHost": "play.trix-islands.gg",
  "javaPort": 2788,
  "authMode": "online",
  "bedrockHost": "<PUBLIC_HOST>",
  "bedrockPort": 19132,
  "publicHost": "<PUBLIC_HOST>",
  "createdAt": "…",
  "targetKey": "play.trix-islands.gg:2788:online"
}
```

Bedrock clients add server **`bedrockHost:bedrockPort`**.

## Featured server

`config/public-servers.json` features **Trix Islands** at `play.trix-islands.gg` (Java port **2788**, common SRV target).

## Docker

```bash
docker compose up --build
```

- Set `PUBLIC_HOST` in `.env` to your public IP or DNS name.
- Default `GEYSER_MODE=docker` in compose runs `ghcr.io/geysermc/geyser` with configs mounted from `.geyser-sessions`.
- Map the full UDP range `19132-19232/udp` on the host for many concurrent sessions.

For standalone mode inside the image, set `GEYSER_MODE=standalone` and place `geyser.jar` in the image or mount.

## Tests

```bash
npm test
```

Uses `FakeGeyserLauncher` — no real Geyser or Docker required.