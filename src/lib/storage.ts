import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";

// Receipt photos are PRIVATE: they're stored in Vercel Blob with
// access: "private", so the file URL alone is useless. The browser gets them
// through /api/receipts/[expenseId], which checks the session first.
//
// Without a BLOB_READ_WRITE_TOKEN (e.g. on your laptop) we fall back to a local
// folder, but only in development. This is the "strategy" pattern: two
// implementations of the same small interface, chosen at runtime.

type StoredFile = { body: ReadableStream<Uint8Array> | Uint8Array<ArrayBuffer>; contentType: string };

type ReceiptStorage = {
  save(pathname: string, file: File): Promise<void>;
  read(pathname: string): Promise<StoredFile | null>;
  remove(pathname: string): Promise<void>;
};

const blobStorage: ReceiptStorage = {
  async save(pathname, file) {
    await put(pathname, file, { access: "private", contentType: file.type, addRandomSuffix: false });
  },
  async read(pathname) {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return { body: result.stream, contentType: result.blob.contentType };
  },
  async remove(pathname) {
    await del(pathname);
  },
};

// Outside `public/` on purpose, so the files are never served without a check
const LOCAL_DIR = path.join(process.cwd(), ".uploads");

const localStorage: ReceiptStorage = {
  async save(pathname, file) {
    const target = path.join(LOCAL_DIR, pathname);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await file.arrayBuffer()));
  },
  async read(pathname) {
    try {
      const body = new Uint8Array(await readFile(path.join(LOCAL_DIR, pathname)));
      return { body, contentType: "image/jpeg" };
    } catch {
      return null;
    }
  },
  async remove(pathname) {
    await rm(path.join(LOCAL_DIR, pathname), { force: true });
  },
};

function pickStorage(): ReceiptStorage | null {
  if (process.env.BLOB_READ_WRITE_TOKEN) return blobStorage;
  if (process.env.NODE_ENV !== "production" || process.env.LOCAL_UPLOADS === "true") return localStorage;
  return null;
}

const storage = pickStorage();

/** False when there's nowhere to store photos: the UI then hides the camera button. */
export const receiptsEnabled = storage !== null;

export const MAX_RECEIPT_BYTES = 3 * 1024 * 1024;

/** Saves the photo and returns its private pathname, e.g. "receipts/<userId>/<uuid>.jpg". */
export async function saveReceipt(userId: string, file: File): Promise<string> {
  if (!storage) throw new Error("Receipt storage is not configured");
  const pathname = `receipts/${userId}/${randomUUID()}.jpg`;
  await storage.save(pathname, file);
  return pathname;
}

export async function readReceipt(pathname: string): Promise<StoredFile | null> {
  return storage ? storage.read(pathname) : null;
}

export async function deleteReceipt(pathname: string): Promise<void> {
  // A photo that fails to delete must never block deleting the expense itself
  await storage?.remove(pathname).catch(() => undefined);
}
