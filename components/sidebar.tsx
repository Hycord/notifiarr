'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Radio,
  Server,
  Zap,
  Send,
  Settings,
  FileText,
  Activity,
  Braces,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useEffect } from 'react';

export const navItems = [
  // Configuration group
  { href: '/clients', icon: Radio, label: 'Clients', group: 'Configuration' },
  { href: '/servers', icon: Server, label: 'Servers', group: 'Configuration' },
  { href: '/events', icon: Zap, label: 'Events', group: 'Configuration' },
  { href: '/sinks', icon: Send, label: 'Sinks', group: 'Configuration' },
  // Reference group
  { href: '/data-flow', icon: Activity, label: 'Data Flow', group: 'Reference' },
  { href: '/templating', icon: Braces, label: 'Templating', group: 'Reference' },
  // Management group
  { href: '/settings', icon: Settings, label: 'Settings', group: 'Management' },
  { href: '/logs', icon: FileText, label: 'Logs', group: 'Management' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block fixed left-0 top-0 h-screen w-64 border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Radio className="h-6 w-6" />
          <span className="text-xl">Notifiarr</span>
        </Link>
      </div>
      <nav className="space-y-1 p-4">
        {/* Group: Configuration (always expanded on desktop) */}
        <div className="mb-2">
          <div className="w-full flex items-center justify-between px-3 py-1 rounded">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Configuration</span>
          </div>
          <div className="rounded-md border bg-muted/40 p-1">
          {navItems.filter(i => i.group === 'Configuration').map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 pl-6 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
          })}
          </div>
        </div>
        {/* Group: Reference (always expanded on desktop) */}
        <div className="mt-2">
          <div className="w-full flex items-center justify-between px-3 py-1 rounded">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Reference</span>
          </div>
          <div className="rounded-md border bg-muted/40 p-1">
          {navItems.filter(i => i.group === 'Reference').map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 pl-6 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          </div>
        </div>
        {/* Group: Management (always expanded on desktop) */}
        <div className="mt-4">
          <div className="w-full flex items-center justify-between px-3 py-1 rounded">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Management</span>
          </div>
          <div className="rounded-md border bg-muted/40 p-1">
          {navItems.filter(i => i.group === 'Management').map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 pl-6 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          </div>
        </div>
      </nav>
    </aside>
  );
}
