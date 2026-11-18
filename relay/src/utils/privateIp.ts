import { isIPv4, isIPv6 } from 'node:net';

/** Returns true when the host resolves to a non-routable / local address pattern. */
export function isPrivateOrLocalHost(host: string): boolean {
  const h = host.trim().toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) {
    return true;
  }

  if (isIPv4(h)) {
    const parts = h.split('.').map((p) => Number.parseInt(p, 10));
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }

  if (isIPv6(h)) {
    if (h === '::1') return true;
    if (h.startsWith('fc') || h.startsWith('fd')) return true; // unique local
    if (h.startsWith('fe80')) return true; // link-local
    return false;
  }

  return false;
}