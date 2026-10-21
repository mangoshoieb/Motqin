// The backend expects question images as JPEG, so every image is normalised
// here before it's uploaded — whether the student picked it or the AI cut it
// out of a PDF.

const JPEG_QUALITY = 0.9;

const withJpgExtension = (name: string) =>
  `${name.replace(/\.[^./\\]+$/, "") || "image"}.jpg`;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });

// Re-encodes any browser-decodable image as JPEG. JPEG has no alpha, so
// transparent areas are painted white rather than turning black.
export async function toJpegFile(file: File): Promise<File> {
  const name = withJpgExtension(file.name);
  if (file.type === "image/jpeg") {
    return file.name === name ? file : new File([file], name, { type: "image/jpeg" });
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) throw new Error("Could not encode JPEG");
    return new File([blob], name, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Magic-number prefixes of the base64 text, for when the payload carries no
// data-URL header saying what it is.
const BASE64_SIGNATURES: [string, string][] = [
  ["/9j/", "image/jpeg"],
  ["iVBOR", "image/png"],
  ["UklGR", "image/webp"],
  ["R0lGOD", "image/gif"],
];

// Turns the AI's `imageBase64` (bare or a data: URL) into a JPEG File.
export async function base64ToJpegFile(base64: string, name: string): Promise<File | null> {
  const match = base64.match(/^data:([^;]+);base64,([\s\S]*)$/);
  const payload = (match ? match[2] : base64).replace(/\s/g, "");
  if (!payload) return null;

  const type =
    match?.[1] ?? BASE64_SIGNATURES.find(([prefix]) => payload.startsWith(prefix))?.[1] ?? "image/jpeg";

  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return toJpegFile(new File([bytes], name, { type }));
}
