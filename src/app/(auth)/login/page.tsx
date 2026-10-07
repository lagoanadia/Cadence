import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/components/auth-form";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { oauthProviders } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in" };

// Auth.js sends the user back here with ?error=… when an OAuth login fails
const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email already has a Cadence account with a password. Log in with your email and password.",
  AccessDenied: "Access was denied. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const errorMessage =
    typeof error === "string" ? (ERROR_MESSAGES[error] ?? "Something went wrong. Please try again.") : null;

  return (
    <div className="flex flex-col gap-4">
      {errorMessage && <p className="rounded-[10px] bg-danger/10 px-3.5 py-2.5 text-[15px] text-danger">{errorMessage}</p>}
      <OAuthButtons google={oauthProviders.google} github={oauthProviders.github} />
      <AuthForm mode="login" />
    </div>
  );
}
