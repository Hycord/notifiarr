"use client";
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import * as React from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  function toggleMobile() {
    setMobileOpen((o) => !o);
  }

  return (
    <div className="min-h-screen w-full md:pl-64 overflow-x-hidden">
      <Sidebar />
      <Header mobileOpen={mobileOpen} onToggleMobile={toggleMobile} />
      <main className="mt-16 w-full px-4 sm:px-6 py-6 transition-[padding,margin]">{children}</main>
    </div>
  );
}
