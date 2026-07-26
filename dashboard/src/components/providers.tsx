'use client';

import * as React from 'react';
import { ThemeProvider } from 'next-themes';
import { AdminProvider } from '../core/AdminContext';
import { MapProvider } from '../core/MapContext';
import { SignsProvider } from '../core/SignsContext';

export function Providers({ children }: { children: React.ReactNode }) {

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AdminProvider>
        <MapProvider>
          <SignsProvider>
            {children}
          </SignsProvider>
        </MapProvider>
      </AdminProvider>
    </ThemeProvider>
  );
}
