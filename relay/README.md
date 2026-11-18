# NetherNet relay

This service lets the NetherNet app put a phone on a Minecraft Java server. The phone speaks Bedrock. The relay runs [Geyser](https://geysermc.org/) standalone against the Java server you chose and hands the phone a Bedrock address.

Bedrock servers do not come through here. The app opens those itself.

Geyser is started with `auth-type: online` or `auth-type: offline`. Online mode is Geyser's Microsoft login, for Java servers that check accounts. Offline mode is for servers that do not. Floodgate is not used.

## What you need

- A Linux host with Docker and Docker Compose
- Ports you can reach from the phone:
  - `8787/tcp` for this API
  - `19132-19151` on both TCP and UDP for Geyser

Geyser's Bedrock side uses the main port for RakNet (UDP) and for signaling (TCP), plus the next port for the WebRTC media path. Forward the whole range on both protocols. One session uses a pair of ports, so the default range fits about ten sessions.

Each session is a Java process with a 512 MB heap. Size the machine for how many joins you want at once (`MAX_SESSIONS`).

## Start it

From this directory:

```bash
cp .env.example .env
# Set PUBLIC_HOST to an address the phone can open.
docker compose up -d --build
docker compose logs -f
```

`PUBLIC_HOST` is not the bind address. The process listens on all interfaces. `PUBLIC_HOST` is what gets put in the `minecraft://` link and in Geyser's advertised address. Use your public DNS name, or a LAN IP while you are testing.

```bash
curl -s http://127.0.0.1:8787/health
curl -s http://127.0.0.1:8787/servers
```

Health looks like:

```json
{
  "ok": true,
  "geyser": "ready",
  "java": "ready",
  "sessions": 0,
  "publicHost": "relay.example.com"
}
```

`geyser: missing` means the jar did not land in the image. `java: missing` means `java` is not on `PATH` inside the container. A normal Compose build should have both.

## API

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/health` | Process is up, and whether Java and the Geyser jar are present |
| `GET` | `/servers` | Public servers from `config/public-servers.json` |
| `POST` | `/sessions` | Open a Geyser session for a Java server |
| `GET` | `/sessions/:id` | `starting`, `ready`, `failed`, or `stopped` |
| `DELETE` | `/sessions/:id` | Stop that session |

Create a session:

```bash
curl -s -X POST http://127.0.0.1:8787/sessions \
  -H 'content-type: application/json' \
  -d '{"name":"Trix Islands","host":"play.trix-islands.gg","port":2788,"authMode":"online"}'
```

Leave `port` out and the relay looks up `_minecraft._tcp` for the host, then falls back to `25565`. `play.trix-islands.gg` publishes an SRV record on a port other than 25565, so either let the app resolve it or pass the port the status check returned.

A ready session includes `relayHost` and `relayPort`. That pair is what the app puts in the Minecraft link. Poll `GET /sessions/:id` while `status` is `starting`. Sessions expire after `SESSION_TTL_MS` (20 minutes by default) unless the app keeps asking for status.

If `RELAY_TOKEN` is set, send `Authorization: Bearer <token>` on everything except `/health`. Put the same token in the app's Options screen.

## Public servers

Edit `config/public-servers.json` and restart the container. The app already pins Trix Islands on its own, and it hides a public row that is the same host, port, and edition as a server it already shows.

```json
{
  "id": "example",
  "name": "Example",
  "host": "play.example.com",
  "port": null,
  "edition": "java",
  "featured": false,
  "authMode": "online",
  "description": "Shown under Public in the app."
}
```

`port: null` means "resolve SRV, otherwise the edition's default".

## Config files

Geyser configs are written to `/data/sessions/<id>/config.yml` inside the container (the `relay-data` volume). If a session fails, that directory and `docker compose logs` are the first place to look. Geyser's own config keys change between releases. `src/geyserConfig.ts` is the template.

## Without Compose

You can run the service on the host if Java 21 and a Geyser standalone jar are already there.

```bash
npm install
GEYSER_JAR=/opt/geyser/Geyser-Standalone.jar \
JAVA_BIN=java \
PUBLIC_HOST=127.0.0.1 \
npm start
```

Download the jar from `https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/standalone` if you do not want the image to fetch it.

## If a session fails immediately

Geyser downloads encryption keys from `client.discovery.minecraft-services.net` before it listens. The container needs outbound HTTPS to that host, and to the Java server you are joining. `docker compose logs` and `/data/sessions/<id>/config.yml` show the target it used.

When the request leaves `port` empty, the relay resolves `_minecraft._tcp` with the host's DNS and falls back to DNS-over-HTTPS. `play.trix-islands.gg` is not on port 25565; the SRV record is what you want.

## HTTPS

Put Caddy, nginx, or another proxy in front of port 8787 if the relay is on the public internet. The Bedrock port range is UDP and TCP straight to this process. A normal HTTP proxy does not carry that. Forward those ports on the host firewall to the container.

The iOS app allows plain HTTP so a LAN relay works. Use HTTPS for a relay other people can reach, and set the app's relay address to that `https://` URL.
