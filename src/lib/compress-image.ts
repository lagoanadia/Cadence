"use client";

/**
 * Shrinks a photo in the browser before uploading it.
 * A phone photo is often 3–8 MB; resized to 1600px and saved as JPEG it's
 * usually 200–400 KB. Faster upload, less storage, same readability.
 *
 * How: decode the image, draw it smaller on an invisible <canvas>, and export
 * the canvas as a JPEG. createImageBitmap applies the photo's rotation (EXIF)
 * for us, so portrait photos stay upright.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;
  return new File([blob], "receipt.jpg", { type: "image/jpeg" });
}
