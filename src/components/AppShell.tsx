import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileSpreadsheet,
  Languages,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Settings,
  Trash2,
  TrendingUp,
  UserCircle,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tDict } from '../lib/i18n';
import { BrandLogo } from './BrandLogo';

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const { user, vendor, language, setLanguage, signOut } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dict = tDict(language);

  const primaryLinks = [
    { to: '/dashboard', label: dict.nav.dashboard, icon: LayoutDashboard },
    { to: '/forecast', label: dict.nav.forecast, icon: TrendingUp },
    { to: '/inventory', label: dict.nav.inventory, icon: Package },
    { to: '/sales', label: dict.nav.sales, icon: BarChart3 },
    { to: '/waste', label: dict.nav.waste, icon: Trash2 },
    { to: '/locations', label: dict.nav.locations, icon: MapPin },
    { to: '/reports', label: dict.nav.reports, icon: FileSpreadsheet },
  ];

  const secondaryLinks = [
    { to: '/profile', label: dict.nav.profile, icon: UserCircle },
    { to: '/settings', label: dict.nav.settings, icon: Settings },
  ];

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between py-5">
      <div>
        <div className="px-5 pb-6 border-b border-white/8">
          <Link to="/dashboard" className="block focus:outline-none">
            <BrandLogo showSubtext />
          </Link>
        </div>

        <nav className="mt-5 px-3 space-y-1" aria-label="Primary Workspace">
          {primaryLinks.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#A3E635]/12 text-[#A3E635]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#A3E635]' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 pt-5 px-3 border-t border-white/8 space-y-1">
          {secondaryLinks.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#A3E635]/12 text-[#A3E635]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#A3E635]' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4 border-t border-white/8">
        <div className="mb-3 px-1">
          <p className="text-sm font-semibold text-white truncate">
            {vendor?.businessName || 'My Stall'}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {vendor?.zone || 'Lucknow'} · {vendor?.ownerName || user?.name}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors whitespace-nowrap"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{dict.nav.signOut}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-white/8 bg-[#0E1629] sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-68 max-w-[82vw] bg-[#0E1629] border-r border-white/10 h-full overflow-y-auto">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 border-b border-white/8 bg-[#0B1120]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-base sm:text-lg font-bold text-white truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden sm:block text-xs text-slate-400 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="inline-flex items-center rounded-lg border border-white/10 bg-[#111A2E] p-0.5">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  language === 'en'
                    ? 'bg-[#A3E635] text-[#0B1120] font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap inline-flex items-center gap-1 ${
                  language === 'hi'
                    ? 'bg-[#A3E635] text-[#0B1120] font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Languages className="h-3 w-3" />
                <span>हिं</span>
              </button>
            </div>
            {actions}
          </div>
        </header>

        {user?.isDemo && (
          <div className="border-b border-[#A3E635]/20 bg-[#A3E635]/8 px-4 sm:px-6 lg:px-8 py-2 text-xs text-[#D9F99D]">
            {dict.dashboard.demoBanner}
          </div>
        )}

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
