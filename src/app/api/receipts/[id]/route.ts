import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readReceipt } from "@/lib/storage";

/**
 * Serves a receipt photo, but only to its owner.
 * This is a Route Handler: a plain HTTP endpoint (GET /api/receipts/<expenseId>)
 * instead of a page. We look the expense up by id AND userId, so guessing
 * another user's expense id returns 404.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/receipts/[id]">) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const expense = await db.expense.findFirst({ where: { id, userId }, select: { receiptPath: true } });
  if (!expense?.receiptPath) return new Response("Not found", { status: 404 });

  const file = await readReceipt(expense.receiptPath);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file.body, {
    headers: {
      "Content-Type": file.contentType,
      // "private": browsers may cache it, shared caches (CDNs) must not
      "Cache-Control": "private, max-age=3600",
    },
  });
}
