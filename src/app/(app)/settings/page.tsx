import { ChevronLeft, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "@/features/auth/actions";
import { SettingsForm } from "@/features/settings/settings-form";
import { auth } from "@/lib/auth";
import { getUserSettings, requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const userId = await requireUserId();
  const [session, settings] = await Promise.all([auth(), getUserSettings(userId)]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/more" className="-ml-1 inline-flex items-center gap-1 text-sm text-muted">
          <ChevronLeft className="size-4" />
          More
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Settings</h1>
      </header>

      <section className="rounded-2xl bg-surface p-4">
        <p className="font-medium">{session?.user.name ?? "You"}</p>
        <p className="text-sm text-muted">{session?.user.email}</p>
      </section>

      <SettingsForm
        timezone={settings.timezone}
        weekStartsOn={settings.weekStartsOn}
        timezones={Intl.supportedValuesOf("timeZone")}
      />

      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm font-medium text-danger"
        >
          <LogOut className="size-4" />
          Log out
        </button>
      </form>
    </div>
  );
}
