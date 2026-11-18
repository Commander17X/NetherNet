# Parallel build coordination

Branch: `cursor/nethernet-expo-485b`

| Area | Owner | Paths |
|------|--------|--------|
| Core lib | Subagent A | `src/lib/`, `src/lib/__tests__/` |
| Expo UI | Subagent B | `src/app/`, `src/components/`, `assets/` |
| Relay | Subagent C | `relay/` |
| CI & docs | Subagent D | `README.md`, `CONTRIBUTING.md`, `.github/` |

Sibling cloud agent: [Build NetherNet iOS app + Java relay](https://cursor.com/agents/bc-2ef27338-df6c-5ca9-9d04-4d14187c613c)

Featured server: `play.trix-islands.gg` (Java, often port 2788 via SRV).