const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MAX_EDGE = 512;

export function parseFavicon(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  let payload = trimmed;
  if (/^data:/i.test(trimmed)) {
    const match = /^data:image\/png;base64,([A-Za-z0-9+/=\s]+)$/i.exec(trimmed);
    if (!match?.[1]) {
      return null;
    }
    payload = match[1];
  }

  const base64 = payload.replace(/\s/g, "");
  if (base64.length < 32 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return null;
  }

  const bytes = decodeBase64(base64);
  if (!bytes || !isPng(bytes)) {
    return null;
  }

  return `data:image/png;base64,${base64}`;
}

function decodeBase64(input: string): Uint8Array | null {
  try {
    const binary = globalThis.atob(input);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < 24) {
    return false;
  }
  for (let index = 0; index < PNG_SIGNATURE.length; index += 1) {
    if (bytes[index] !== PNG_SIGNATURE[index]) {
      return false;
    }
  }
  const ihdr = String.fromCharCode(bytes[12] ?? 0, bytes[13] ?? 0, bytes[14] ?? 0, bytes[15] ?? 0);
  if (ihdr !== "IHDR") {
    return false;
  }
  const width = readUint32(bytes, 16);
  const height = readUint32(bytes, 20);
  return width >= 1 && height >= 1 && width <= MAX_EDGE && height <= MAX_EDGE;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) * 0x1000000 +
      ((bytes[offset + 1] ?? 0) << 16) +
      ((bytes[offset + 2] ?? 0) << 8) +
      (bytes[offset + 3] ?? 0)) >>>
    0
  );
}
