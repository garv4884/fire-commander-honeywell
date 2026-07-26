'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  Menu,
  X,
  Cpu,
  Moon,
  Sun,
  Flame,
  TestTubeDiagonal,
  Server,
  Lock,
  Unlock,
  AirVent,
  MonitorPlay,
  FileText,
  Map,
} from "lucide-react";
import { useAdmin } from "../core/AdminContext";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, reqAdmin: false },
  { href: "/simulate", label: "Simulator", icon: TestTubeDiagonal, reqAdmin: false },
  { href: "/signs", label: "Smart Signs", icon: MonitorPlay, reqAdmin: true },
  { href: "/controls", label: "Controls (HVAC)", icon: AirVent, reqAdmin: true },
  { href: "/map-editor", label: "Map Editor", icon: Map, reqAdmin: true },
  { href: "/reports", label: "Reports", icon: FileText, reqAdmin: true },
  { href: "/hardware", label: "Hardware Nodes", icon: Server, reqAdmin: false },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isAdmin, login, logout } = useAdmin();
  const [pass, setPass] = useState('');
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');

  useEffect(() => setOpen(false), [pathname]);

  const currentNav = NAV.find(n => n.href === pathname);
  const isProtected = currentNav?.reqAdmin;
  const showLogin = isProtected && !isAdmin;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(adminPassInput)) {
      alert("Invalid admin password.");
    } else {
      setShowAdminPrompt(false);
      setAdminPassInput('');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="sidebar-shadow sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)] md:flex print:hidden">
        <Brand />

        <div className="px-4 pb-1 pt-3">
          <span className="section-label">Main Menu</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map((n) => (
            <NavItem key={n.href} {...n} active={pathname === n.href} />
          ))}
        </nav>

        <ThemeToggle />
        <AdminToggle
          isAdmin={isAdmin}
          showPrompt={showAdminPrompt}
          setShowPrompt={setShowAdminPrompt}
          passInput={adminPassInput}
          setPassInput={setAdminPassInput}
          onLogin={handleLogin}
          onLogout={logout}
        />
        <EngineStatus />
      </aside>

      {/* Mobile top bar */}
      <div
        className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-panel)]/96 px-4 pt-8 pb-3 backdrop-blur md:hidden print:hidden"
        style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
      >
        <Brand compact />
        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <button onClick={() => setOpen((v) => !v)} aria-label="Menu" className="rounded-full p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-panel-2)] transition">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 top-[52px] z-20 overflow-y-auto bg-[var(--color-panel)] p-4 md:hidden">
          <nav className="space-y-1">
            {NAV.map((n) => (
              <NavItem key={n.href} {...n} active={pathname === n.href} />
            ))}
          </nav>
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <ThemeToggle />
            <AdminToggle
              isAdmin={isAdmin}
              showPrompt={showAdminPrompt}
              setShowPrompt={setShowAdminPrompt}
              passInput={adminPassInput}
              setPassInput={setAdminPassInput}
              onLogin={handleLogin}
              onLogout={logout}
            />
            <EngineStatus />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="grid-bg flex-1 overflow-y-auto overflow-x-hidden px-4 pb-24 pt-[88px] md:px-6 md:pb-10 md:pt-6 print:p-0 print:overflow-visible print:bg-white print:h-auto print:min-h-0">
        <div className="mx-auto w-full min-w-0 max-w-[1400px] h-full">
          {showLogin ? (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto fade-up">
              <div className="card-md p-8 w-full text-center">
                <Lock size={48} className="mx-auto mb-4 text-[var(--color-muted)]" />
                <h2 className="text-xl font-bold text-[var(--color-fg)] mb-2">Admin Access Required</h2>
                <p className="text-sm text-[var(--color-muted)] mb-6">Use the Admin toggle in the sidebar to authenticate.</p>
                <button onClick={() => setShowAdminPrompt(true)} className="btn-primary w-full justify-center">
                  Unlock Admin
                </button>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[var(--color-border)] bg-[var(--color-panel)] z-40 flex justify-around items-center h-[68px] pb-safe px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        {NAV.filter(n => ['/', '/simulate', '/signs', '/reports'].includes(n.href)).map(n => {
          const isActive = pathname === n.href;
          return (
            <Link key={n.href} href={n.href} className={cn("flex flex-col items-center justify-center gap-1 w-full h-full transition-colors", isActive ? "text-[var(--color-accent)]" : "text-[var(--color-muted)] hover:text-[var(--color-fg)]")}>
              <n.icon size={22} className={cn(isActive && "drop-shadow-sm")} />
              <span className="text-[10px] font-semibold tracking-wide">{n.label === 'Smart Signs' ? 'Signs' : n.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", compact ? "" : "px-5 py-5 pb-3")}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
        <Flame size={24} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-[18px] font-bold tracking-wide text-[var(--color-fg)]">Fire Commander</div>
          <div className="text-[10px] font-medium text-[var(--color-muted)]">Dynamic Evacuation Router</div>
        </div>
      )}
      {compact && (
        <div className="text-[14px] font-bold text-[var(--color-fg)]">Fire Commander</div>
      )}
    </Link>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  reqAdmin,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  active: boolean;
  reqAdmin?: boolean;
}) {
  const { isAdmin } = useAdmin();
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-150",
        active
          ? "nav-active-bar bg-[var(--color-panel-2)] text-[var(--color-accent)]"
          : "text-[var(--color-muted)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-fg)]"
      )}
    >
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
          active ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]" : "text-[var(--color-muted)]"
        )}
      >
        <Icon size={18} />
      </span>
      {label}
      {reqAdmin && !isAdmin && <Lock size={12} className="ml-auto text-amber-500/50" />}
    </Link>
  );
}

function EngineStatus() {
  return (
    <div className="border-t border-[var(--color-border)] p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center text-[11px] text-[var(--color-muted)] font-medium">
          <div className="flex items-center gap-1.5"><Cpu size={14} /> Algorithm Engine</div>
        </div>
        <div className="flex items-center justify-between">
           <span className="text-xs font-bold text-[var(--color-fg)]">Dijkstra Core</span>
           <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
             <span className="h-1.5 w-1.5 rounded-full pulse-dot bg-emerald-500" />
             Active
           </span>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  if (compact) {
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle theme"
        className="rounded-full p-2 text-[var(--color-muted)] transition hover:bg-[var(--color-panel-2)]"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    );
  }

  return (
    <div className="px-4 pb-4">
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-2)] p-2.5 text-xs transition hover:border-[var(--color-accent)]/40"
      >
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-panel)] text-[var(--color-muted)] shadow-sm">
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="font-semibold text-[var(--color-fg)]">
            {isDark ? "Light Mode" : "Dark Mode"}
          </span>
          <span className="text-[10px] text-[var(--color-muted)] mt-0.5">
            {isDark ? "Switch to light theme" : "Switch to dark theme"}
          </span>
        </div>
      </button>
    </div>
  );
}

function AdminToggle({
  isAdmin, showPrompt, setShowPrompt, passInput, setPassInput, onLogin, onLogout,
}: {
  isAdmin: boolean;
  showPrompt: boolean;
  setShowPrompt: (v: boolean) => void;
  passInput: string;
  setPassInput: (v: string) => void;
  onLogin: (e: React.FormEvent) => void;
  onLogout: () => void;
}) {
  return (
    <div className="px-4 pb-2">
      {!showPrompt ? (
        <button
          onClick={() => isAdmin ? onLogout() : setShowPrompt(true)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border p-2.5 text-xs transition",
            isAdmin
              ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15"
              : "border-[var(--color-border)] bg-[var(--color-panel-2)] hover:border-amber-500/40"
          )}
        >
          <div className={cn("grid h-7 w-7 place-items-center rounded-lg shadow-sm", isAdmin ? "bg-emerald-500/20 text-emerald-500" : "bg-[var(--color-panel)] text-amber-500")}>
            {isAdmin ? <Unlock size={14} /> : <Lock size={14} />}
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className={cn("font-semibold", isAdmin ? "text-emerald-500" : "text-[var(--color-fg)]")}>
              {isAdmin ? "Admin Active" : "Admin Mode"}
            </span>
            <span className="text-[10px] text-[var(--color-muted)] mt-0.5">
              {isAdmin ? "Click to logout" : "Click to authenticate"}
            </span>
          </div>
          {isAdmin && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 pulse-dot" />}
        </button>
      ) : (
        <form onSubmit={onLogin} className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-amber-500 mb-1">
            <Lock size={12} /> Enter Admin Password
          </div>
          <input
            type="password"
            placeholder="Password"
            value={passInput}
            onChange={e => setPassInput(e.target.value)}
            autoFocus
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-2.5 py-1.5 text-xs text-[var(--color-fg)] outline-none focus:border-amber-500"
          />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 rounded-lg bg-amber-500 px-2 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition">
              Login
            </button>
            <button type="button" onClick={() => setShowPrompt(false)} className="flex-1 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs font-bold text-[var(--color-muted)] hover:bg-[var(--color-panel-2)] transition">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
