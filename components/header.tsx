"use client";

import { useStatus } from "@/hooks/use-config-queries";
import { Badge } from "@/components/ui/badge";
import { Menu, X } from "lucide-react";
import { navItems } from "@/components/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConnectionStatus } from "@/components/connection-status";
import { GithubStarsBar, RepoLink } from '@/components/github-stars';
import { useEffect, useState } from 'react';

export function Header({
  mobileOpen,
  onToggleMobile,
}: {
  mobileOpen: boolean;
  onToggleMobile: () => void;
}) {
  const { data: status, dataUpdatedAt } = useStatus();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<{[key:string]: boolean}>({ Configuration: false, Reference: false, Management: false, Github: false });
  useEffect(() => {
    try {
      const raw = localStorage.getItem('navGroups');
      if (raw) {
        const parsed = JSON.parse(raw);
        setExpanded((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);
  const toggle = (group: string) => {
    setExpanded(prev => {
      const next = { ...prev, [group]: !prev[group] };
      try { localStorage.setItem('navGroups', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <header className="fixed left-0 md:left-64 right-0 top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleMobile}
          className="md:hidden inline-flex items-center justify-center rounded-md border px-2 py-2 text-sm hover:bg-muted"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
        <Link href="/">
          <h1 className="text-base sm:text-lg font-semibold md:hidden block cursor-pointer hover:opacity-80 transition-opacity">
            Notifiarr
          </h1>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {/* Hide GitHub stars in header on mobile; keep only in drawer */}
        <div className="hidden md:block">
          <GithubStarsBar />
        </div>
        {status && (
          <div className="flex items-center gap-2">
            <ConnectionStatus
              isConnected={status.status.running}
              dataUpdatedAt={dataUpdatedAt}
              showText={false}
            />
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>
                {status.status.clients.enabled} Client
                {status.status.clients.enabled > 1 ? "s" : ""}
              </span>
              <span>
                {status.status.servers.enabled} Server
                {status.status.servers.enabled > 1 ? "s" : ""}
              </span>
              <span>
                {status.status.events.enabled} Event
                {status.status.events.enabled > 1 ? "s" : ""}
              </span>
              <span>
                {status.status.sinks.enabled} Sink
                {status.status.sinks.enabled > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}
      </div>
      {/* Mobile drawer panel */}
      {mobileOpen && (
        <div className="md:hidden absolute left-0 top-16 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto border-b bg-background shadow-lg">
          <nav className="p-2 space-y-2">
            {/* Mobile grouped navigation */}
            <button type="button" onClick={() => toggle('Configuration')} className="w-full flex items-center justify-between px-3 py-1 rounded hover:bg-muted">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Configuration</span>
              <span className="text-xs text-muted-foreground">{expanded.Configuration ? '▾' : '▸'}</span>
            </button>
            {expanded.Configuration && (
              <div className="rounded-md border bg-muted/40 p-1">
              {navItems.filter(i => i.group === 'Configuration').map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onToggleMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 pl-6 text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
              })}
              </div>
            )}
            <button type="button" onClick={() => toggle('Reference')} className="mt-2 w-full flex items-center justify-between px-3 py-1 rounded hover:bg-muted">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Reference</span>
              <span className="text-xs text-muted-foreground">{expanded.Reference ? '▾' : '▸'}</span>
            </button>
            {expanded.Reference && (
              <div className="rounded-md border bg-muted/40 p-1">
              {navItems.filter(i => i.group === 'Reference').map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onToggleMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 pl-6 text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
              })}
              </div>
            )}
            <button type="button" onClick={() => toggle('Management')} className="mt-2 w-full flex items-center justify-between px-3 py-1 rounded hover:bg-muted">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Management</span>
              <span className="text-xs text-muted-foreground">{expanded.Management ? '▾' : '▸'}</span>
            </button>
            {expanded.Management && (
              <div className="rounded-md border bg-muted/40 p-1">
              {navItems.filter(i => i.group === 'Management').map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onToggleMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 pl-6 text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
              })}
              </div>
            )}
            {/* Mobile footer split buttons for GitHub links with star counts and icon - always visible */}
            <div className="mt-2 border-t pt-2 flex items-center gap-1 px-1">
              <div className="flex-1 flex justify-center">
                <RepoLink repo="hycord/notifiarr" label="notifiarr" />
              </div>
              <div className="flex-1 flex justify-center">
                <RepoLink repo="hycord/irc-notify" label="irc-notify" />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
