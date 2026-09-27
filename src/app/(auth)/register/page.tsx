import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/components/auth-form";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { oauthProviders } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-4">
      <OAuthButtons google={oauthProviders.google} github={oauthProviders.github} />
      <AuthForm mode="register" />
    </div>
  );
}
