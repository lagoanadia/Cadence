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
        <p className="text-3xl font-semibold tracking-tight">Cadence</p>
        <p className="mt-1 text-sm text-muted">One calm place for everything you care about.</p>
      </div>
      {children}
    </main>
  );
}
