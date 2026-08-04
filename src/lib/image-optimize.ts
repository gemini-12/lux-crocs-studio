export type PreparedImage = {
  filename: string;
  contentType: "image/webp";
  dataBase64: string;
  thumbBase64: string;
  previewUrl: string;
};

const ACCEPTED = ["image/png", "image/webp", "image/jpeg"];

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(blob);
  });
}

async function render(bitmap: ImageBitmap, max: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not optimise the image."))),
      "image/webp",
      quality,
    ),
  );
}

/** Resize + convert to WebP in the browser, and build a thumbnail. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error("Only PNG, WEBP or JPEG images are supported.");
  }
  const bitmap = await createImageBitmap(file);
  const [main, thumb] = await Promise.all([render(bitmap, 1600, 0.92), render(bitmap, 400, 0.8)]);
  bitmap.close();
  const base = file.name.replace(/\.[^.]+$/, "");
  return {
    filename: `${base}.webp`,
    contentType: "image/webp",
    dataBase64: await toBase64(main),
    thumbBase64: await toBase64(thumb),
    previewUrl: URL.createObjectURL(main),
  };
}

export function thumbUrl(url: string) {
  return url.startsWith("/api/public/media/")
    ? url.replace("/api/public/media/", "/api/public/media/thumb-")
    : url;
}
