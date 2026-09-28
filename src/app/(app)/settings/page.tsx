import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { PrivateModeRow } from "@/features/areas/components/area-controls";
import { signOutAction } from "@/features/auth/actions";
import { SettingsForm } from "@/features/settings/settings-form";
import { auth } from "@/lib/auth";
import { getUserSettings, requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const userId = await requireUserId();
  const [session, settings] = await Promise.all([auth(), getUserSettings(userId)]);
  const name = session?.user.name ?? "You";

  return (
    <div className="flex flex-col gap-7">
      <PageHeader title="Settings" back={{ href: "/today", label: "Today" }} />

      <section className="ios-list flex items-center gap-3 p-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--c-blue)] to-[var(--c-violet)] text-[22px] font-semibold text-white">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block text-[20px] font-semibold">{name}</span>
          <span className="block truncate text-[15px] text-muted">{session?.user.email}</span>
        </span>
      </section>

      <PrivateModeRow privateMode={settings.privateMode} />

      <SettingsForm
        timezone={settings.timezone}
        weekStartsOn={settings.weekStartsOn}
        timezones={Intl.supportedValuesOf("timeZone")}
      />

      <form action={signOutAction}>
        <button
          type="submit"
          className="ios-list flex w-full items-center justify-center gap-2 px-4 py-3 text-[17px] text-danger active:bg-surface-2"
        >
          <LogOut className="size-5" />
          Log out
        </button>
      </form>
    </div>
  );
}
