'use client';

import React, { useEffect, useRef } from 'react';
import { Info, AlertTriangle, Flame, List } from 'lucide-react';
import type { EventLogEntry } from '../core/types';
import { cn } from '../lib/utils';

interface Props {
  events: EventLogEntry[];
}

const LEVEL_STYLES: Record<string, { indicator: string; text: string; Icon: React.ElementType }> = {
  INFO:     { indicator: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]', text: 'text-blue-600 dark:text-blue-400', Icon: Info },
  WARNING:  { indicator: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]', text: 'text-amber-600 dark:text-amber-400', Icon: AlertTriangle },
  CRITICAL: { indicator: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]', text: 'text-red-600 dark:text-red-400', Icon: Flame },
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

export default function EventTimeline({ events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = bottomRef.current?.parentElement;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [events.length]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--color-fg)]">
          <List size={16} className="text-[var(--color-muted)]" />
          <span className="text-[13px] font-bold tracking-wide">Event Log</span>
        </div>
        <span className="rounded-md bg-[var(--color-panel-2)] px-2 py-1 text-[10px] font-medium text-[var(--color-muted)] border border-[var(--color-border)]">
          {events.length} events
        </span>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--color-muted)]">
            No events yet. Start a simulation to see activity.
          </div>
        ) : (
          events.slice(-50).map((evt, i) => {
            const style = LEVEL_STYLES[evt.level] ?? LEVEL_STYLES.INFO;
            return (
              <div
                key={evt.id}
                className={cn(
                  "relative flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] shadow-sm p-3 transition-colors hover:border-[var(--color-accent)]/30",
                  i === events.length - 1 ? 'fade-up' : ''
                )}
              >
                {/* Left Indicator Line */}
                <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-r-md", style.indicator)} />

                {/* Icon */}
                <div className={cn("ml-1 mt-0.5 shrink-0", style.text)}>
                  <style.Icon size={16} />
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    {evt.zoneLabel ? (
                      <span className={cn("text-[11px] font-bold tracking-wide uppercase", style.text)}>
                        {evt.zoneLabel}
                      </span>
                    ) : (
                      <span className={cn("text-[11px] font-bold tracking-wide uppercase", style.text)}>
                        System
                      </span>
                    )}
                    <span className="shrink-0 text-[10px] font-medium text-[var(--color-muted)]">
                      {formatTime(evt.timestamp)}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-[var(--color-fg)] leading-relaxed">
                    {evt.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
