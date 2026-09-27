import { handlers } from "@/lib/auth";

// Auth.js handles every /api/auth/* URL (sign-in, callbacks from Google/GitHub, sign-out…)
export const { GET, POST } = handlers;
