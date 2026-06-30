"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anchor, Shield, Users, Upload, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { Session } from "@/lib/auth/demo";

export function Navbar() {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => setSession(data.session ?? null))
      .catch(() => setSession(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    setSession(null);
    window.location.href = "/";
  };

  const links = [
    { href: "/hr", label: "HR Hub", icon: Users },
    { href: "/compliance", label: "Compliance", icon: Shield },
    { href: "/admin/upload", label: "Upload", icon: Upload },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ncl-navy">
          <Anchor className="h-6 w-6 text-ncl-blue" />
          <span>NCL AI Assistant</span>
          <span className="rounded bg-ncl-gold/20 px-2 py-0.5 text-xs font-normal text-ncl-gold">
            Prototype
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname.startsWith(href)
                  ? "bg-ncl-blue/10 text-ncl-blue"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:block">{session.displayName}</span>
              <button onClick={handleLogout} className="btn-secondary text-xs">
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-secondary text-xs">
              <LogIn className="h-3.5 w-3.5" />
              Demo Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
