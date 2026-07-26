'use client';

import React, { useState } from 'react';
import { useAdmin } from '../../core/AdminContext';
import { Shield, ShieldAlert, LogOut, CheckCircle, Map } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { isAdmin, login, logout } = useAdmin();
  const [pass, setPass] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(pass)) {
      alert("Invalid admin password. Try 'admin123'");
    }
    setPass('');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-10">
      <div className="flex flex-col gap-4 fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">Admin Portal</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Manage elevated system permissions and access critical building controls.
          </p>
        </div>
      </div>
      
      <div className="card-md p-8 fade-up text-center max-w-md mx-auto w-full" style={{ animationDelay: '0.1s' }}>
        {isAdmin ? (
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-fg)] mb-2">Access Granted</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">You currently have full administrative privileges for the Fire Commander system.</p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link href="/admin/map" className="btn-primary flex-1 justify-center">
                <Map size={16} /> Open Map Editor
              </Link>
              <button onClick={logout} className="btn-secondary flex-1 justify-center text-red-500 hover:border-red-500/50 hover:bg-red-500/10">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-500">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-fg)] mb-2">Elevated Access Required</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">Enter the administrative password to gain full control.</p>
            <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full">
              <input
                type="password"
                placeholder="Password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]"
              />
              <button type="submit" className="btn-primary w-full justify-center">
                Authenticate
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
