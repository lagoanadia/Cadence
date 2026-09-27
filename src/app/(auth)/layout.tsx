import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Pages in the (auth) group don't have the app's navigation.
// If you're already logged in, there's nothing to do here.
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (session?.user) redirect("/today");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon, no optimisation needed */}
        <img src="/icons/icon-192.png" alt="" className="mx-auto mb-4 size-20 rounded-[22px] shadow-lg" />
        <p className="large-title">Cadence</p>
        <p className="mt-1 text-[15px] text-muted">One calm place for everything you care about.</p>
      </div>
      {children}
    </main>
  );
}
