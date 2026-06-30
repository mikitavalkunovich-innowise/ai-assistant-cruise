import type { DemoUser } from "@/lib/types";

export const DEMO_USERS: DemoUser[] = [
  { email: "officer@ncl.demo", password: "demo123", role: "officer", displayName: "Sarah Mitchell" },
  { email: "newhire@ncl.demo", password: "demo123", role: "newhire", displayName: "Marco Silva" },
  { email: "employee@ncl.demo", password: "demo123", role: "employee", displayName: "Anna Kowalski" },
  { email: "manager@ncl.demo", password: "demo123", role: "manager", displayName: "James Chen" },
];

export interface Session {
  email: string;
  role: DemoUser["role"];
  displayName: string;
}

export function validateCredentials(email: string, password: string): Session | null {
  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) return null;
  return { email: user.email, role: user.role, displayName: user.displayName };
}

export const SESSION_COOKIE_NAME = "ncl_demo_session";
