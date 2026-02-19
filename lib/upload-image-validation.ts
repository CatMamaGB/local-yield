/**
 * Server-side image validation for uploads: magic bytes (file signature) and dimensions.
 * Use in addition to MIME/size checks to block disguised or malformed files.
 */

/** Magic bytes for allowed image types (first few bytes of file). */
const SIGNATURES: { type: string; bytes: number[] }[] = [
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  { type: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
  // WebP: RIFF....WEBP (bytes 0-3 = RIFF, 8-11 = WEBP)
  { type: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // checked with WEBP at 8-11 below
];

const WEBP_MAGIC_AT = [0x57, 0x45, 0x42, 0x50]; // WEBP at offset 8

export const MAX_DIMENSION = 4096;
export const MIN_DIMENSION = 1;

/**
 * Validate file signature (magic bytes). Returns matching MIME or null if no match.
 */
export function validateImageMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  for (const { type, bytes } of SIGNATURES) {
    if (bytes.length <= buffer.length && bytes.every((b, i) => buffer[i] === b)) {
      if (type === "image/webp" && buffer.length >= 12) {
        if (!WEBP_MAGIC_AT.every((b, i) => buffer[8 + i] === b)) continue;
      }
      return type;
    }
  }
  return null;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get image dimensions from buffer. Returns null if not a valid/supported image.
 */
export async function getImageDimensions(buffer: Buffer): Promise<ImageDimensions | null> {
  try {
    const mod = await import("image-size");
    const imageSize = (mod as { imageSize?: (b: Buffer) => { width?: number; height?: number }; default?: (b: Buffer) => { width?: number; height?: number } }).imageSize ?? (mod as { default: (b: Buffer) => { width?: number; height?: number } }).default;
    const dims = imageSize(buffer);
    if (dims?.width != null && dims?.height != null) {
      return { width: dims.width, height: dims.height };
    }
  } catch {
    // Unsupported or corrupt
  }
  return null;
}

/**
 * Validate dimensions are within allowed range. Returns error message or null if valid.
 */
export function validateImageDimensions(dims: ImageDimensions): string | null {
  if (
    dims.width < MIN_DIMENSION ||
    dims.height < MIN_DIMENSION ||
    dims.width > MAX_DIMENSION ||
    dims.height > MAX_DIMENSION
  ) {
    return `Image dimensions must be between ${MIN_DIMENSION} and ${MAX_DIMENSION} px on each side. Got ${dims.width}×${dims.height}.`;
  }
  return null;
}
