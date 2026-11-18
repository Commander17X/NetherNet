export function targetKey(javaHost: string, javaPort: number, authMode: string): string {
  const host = javaHost.trim().toLowerCase();
  return `${host}:${javaPort}:${authMode}`;
}