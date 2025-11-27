'use client';

import Link from 'next/link';
import { Github } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

type RepoLinkProps = {
  repo: string; // e.g. "owner/name"
  label?: string;
};

async function fetchStarCount(repo: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

export function RepoLink({ repo, label }: RepoLinkProps) {
  const { data: stars } = useQuery({
    queryKey: ['github-stars', repo],
    queryFn: () => fetchStarCount(repo),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // keep in cache a bit longer
    refetchOnWindowFocus: false,
  });
  const href = `https://github.com/${repo}`;
  return (
    <Link href={href} target="_blank" className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border hover:bg-muted">
      <Github className="h-3 w-3" />
      <span className="font-medium leading-none">{label || repo}</span>
      {stars != null && (
        <span className="text-[10px] text-muted-foreground leading-none">★ {stars}</span>
      )}
    </Link>
  );
}

export function GithubStarsBar() {
  const ircNotify = 'hycord/irc-notify';
  const notifiarr = 'hycord/notifiarr';
  return (
    <div className="flex flex-col items-start gap-1">
      <RepoLink repo={ircNotify} label="irc-notify" />
      <RepoLink repo={notifiarr} label="notifiarr" />
    </div>
  );
}
