"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRagLab = pathname.startsWith("/rag-lab");

  if (isRagLab) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </>
  );
}
