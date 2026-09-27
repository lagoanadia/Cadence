import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { type DefaultSession } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { db } from "@/lib/db";
import { setupNewUser } from "@/lib/new-user";

// Tell TypeScript that our session always carries the user's id.
// This is called "module augmentation": we extend a type from a library.
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    // Runs on the server when someone logs in with email + password.
    // Returning null means "wrong credentials".
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;

      const email = parsed.data.email.toLowerCase();
      const user = await db.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, name: user.name, email: user.email, image: user.image };
    },
  }),
];

// OAuth providers are only enabled when their keys exist in .env,
// so the app still works locally without setting them up.
export const oauthProviders = {
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  github: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
};
if (oauthProviders.google) providers.push(Google);
if (oauthProviders.github) providers.push(GitHub);

export const { handlers, auth, signIn, signOut } = NextAuth({
  // The adapter saves Google/GitHub users and their linked accounts in our database
  adapter: PrismaAdapter(db),
  // JWT = the session lives in a signed, encrypted cookie instead of a DB table.
  // Auth.js requires it when the Credentials provider is used.
  session: { strategy: "jwt" },
  providers,
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    // `token.sub` holds the user id; copy it into the session we read in the app
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    // Fired when Auth.js creates a user through Google or GitHub
    async createUser({ user }) {
      if (user.id) await setupNewUser(user.id);
    },
  },
});
