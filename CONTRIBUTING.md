# Contributing to NetherNet

Thank you for helping improve NetherNet. This project is maintained under the **Notfoundjs** author policy: commits, releases, and published packages should credit **Notfoundjs** unless you are explicitly contributing on behalf of another maintainer listed in release notes.

## Scope

NetherNet is split into:

- **Expo app** — `src/app/`, `src/components/`, `assets/`, root Expo config
- **Shared library** — `src/lib/` and `src/lib/__tests__/`
- **Relay** — `relay/` (`@nethernet/relay`)

Keep changes focused on one area when possible. Cross-cutting API changes must update `docs/INTEGRATION.md` and both sides of the contract.

## Prerequisites

- Node.js ≥ 20
- npm
- For relay development: Geyser (JAR or Docker) and a reachable `PUBLIC_HOST` for Bedrock testing

## Setup

```bash
git clone <repository-url>
cd NetherNet
npm install
npm install --prefix relay
cp relay/.env.example relay/.env
# edit relay/.env — at minimum PUBLIC_HOST
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run typecheck` | Typecheck shared lib / app TypeScript |
| `npm test` | Jest for `src/lib` |
| `npm run typecheck:relay` | `tsc` build in `relay/` |
| `npm run test:relay` | Jest in `relay/` |
| `npm run test:all` | Lib + relay tests |
| `npm run start` | Expo dev server (when configured) |
| `npm run export` | Expo static export (when configured) |

## Commit messages

- Use clear, imperative subject lines (`fix relay port pool leak`, `document session reuse`).
- Mention relay vs app vs lib in the body when it is not obvious.
- Sign commits as **Notfoundjs** when you are the author:

  ```bash
  git config user.name "Notfoundjs"
  git config user.email "you@example.com"   # use your contact email
  ```

## Pull requests

1. Branch from `main` or the active feature branch naming convention (`cursor/<topic>-<id>`).
2. Run `npm run typecheck`, `npm test`, and relay checks before opening a PR.
3. Describe user-visible behavior and any relay API changes.
4. Do not commit secrets, Geyser session dirs (`relay/sessions/`, `relay/.geyser-sessions/`), or local `.env` files.

## Code style

- **TypeScript** with `strict` settings; match existing patterns in each package.
- **Tests** for non-trivial logic in `src/lib/__tests__` and `relay/__tests__`.
- No unrelated refactors in the same PR as a feature fix.

## Security

- The relay blocks private/loopback Java targets by default (`ALLOW_PRIVATE_TARGETS=false`).
- When `RELAY_API_TOKEN` is set, session routes require that token.
- Report security issues privately to the maintainers; do not open public issues for undisclosed vulnerabilities.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).