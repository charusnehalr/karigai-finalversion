"use client";

import { QueryProvider } from "@/components/providers/QueryProvider";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-paper">{children}</div>
    </QueryProvider>
  );
}
