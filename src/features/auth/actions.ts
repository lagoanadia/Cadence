"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorState, type FormState, formValue, validationError } from "@/lib/form";
import { setupNewUser } from "@/lib/new-user";

const registerSchema = z.object({
  name: z.string().min(1, "Tell us your name").max(60),
  email: z.email("Enter a valid email").transform((email) => email.toLowerCase()),
  password: z.string().min(8, "Use at least 8 characters").max(100),
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return errorState("An account with this email already exists. Try logging in.");

  // Never store the password itself: bcrypt turns it into a one-way hash.
  // 12 is the "cost": higher = slower to compute = harder to brute-force.
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({ data: { name, email, passwordHash } });
  await setupNewUser(user.id);

  // signIn() redirects by throwing a special error, so it must be the last call
  await signIn("credentials", { email, password, redirectTo: "/today" });
  return { status: "success" };
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/today",
    });
    return { status: "success" };
  } catch (error) {
    // Wrong email/password → show a message. Anything else (including the
    // redirect "error" that signIn throws on success) must be re-thrown.
    if (error instanceof AuthError) return errorState("Wrong email or password.");
    throw error;
  }
}

export async function oauthSignInAction(provider: "google" | "github"): Promise<void> {
  await signIn(provider, { redirectTo: "/today" });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
