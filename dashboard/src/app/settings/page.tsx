'use client';

import React from 'react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-10">
      <div className="flex flex-col gap-4 fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">System Settings</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Configure application preferences and routing behaviors.
          </p>
        </div>
      </div>
      
      <div className="card-md p-6 fade-up" style={{ animationDelay: '0.1s' }}>
        <p className="text-sm text-[var(--color-muted)]">Settings are currently managed via config files in the localized module. UI configuration is disabled in this demo.</p>
      </div>
    </div>
  );
}
