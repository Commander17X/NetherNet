# Contributing

Thanks for looking at NetherNet. Issues and pull requests are welcome.

## Before you open a pull request

- Run `npm test`, `npm run typecheck`, and `npm run lint` in the repo root.
- Run `npm test` and `npm run typecheck` in `relay/`.
- Keep changes focused. A pull request that fixes one thing is easier to review than a mixed bag.
- Don't add Mojang or Minecraft textures, sounds, or fonts. NetherNet draws its own interface.

## Where things live

- `shared/` is plain TypeScript used by the app and the relay: addresses, MOTD parsing, SRV records, status decoding.
- `src/` is the Expo app.
- `relay/` is the service that starts Geyser for Java servers.

If you change how an address, MOTD, or status payload is read, add a unit test next to the existing ones. Real response samples are more useful than invented ones.

## Relay changes

Geyser's config shape moves with Geyser releases. If a session fails on startup, read `relay/data/sessions/<id>/` logs (or `docker compose logs`) and adjust `renderGeyserConfig` rather than guessing. Auth stays `online` or `offline`. Floodgate is intentionally not a mode here.
