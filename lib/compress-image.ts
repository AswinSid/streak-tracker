// Client-side screenshot compression. Output is always <= maxBytes (default 100 KB),
// usually 50 to 100 KB. WebP when the browser can encode it, JPEG otherwise.

export type CompressedImage = {
  blob: Blob;
  type: "image/webp" | "image/jpeg";
  width: number;
  height: number;
};

const MAX_SIDE = 1280;
const MIN_SIDE = 320;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Older Safari: fall back to an <img> element.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function compressImage(file: File, maxBytes = 100 * 1024): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) throw new Error("NOT_AN_IMAGE");

  const source = await decode(file);
  const srcW = "naturalWidth" in source ? source.naturalWidth : source.width;
  const srcH = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (!srcW || !srcH) throw new Error("NOT_AN_IMAGE");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("COMPRESSION_FAILED");

  // Probe WebP encoding support once.
  canvas.width = canvas.height = 1;
  const probe = await canvasToBlob(canvas, "image/webp", 0.8);
  const type: CompressedImage["type"] = probe?.type === "image/webp" ? "image/webp" : "image/jpeg";

  let scale = Math.min(1, MAX_SIDE / Math.max(srcW, srcH));

  while (true) {
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, w, h);

    for (let q = 0.82; q >= 0.4; q -= 0.07) {
      const blob = await canvasToBlob(canvas, type, q);
      if (blob && blob.size <= maxBytes) {
        if ("close" in source) source.close();
        return { blob, type, width: w, height: h };
      }
    }

    if (Math.max(w, h) <= MIN_SIDE) break;
    scale *= 0.85;
  }

  if ("close" in source) source.close();
  throw new Error("COMPRESSION_FAILED");
}
