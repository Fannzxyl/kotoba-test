import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, BookOpen, Upload, Zap, Layers, Gamepad2 } from 'lucide-react';
import { ThemePicker } from './ThemePicker';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen relative overflow-hidden text-gray-100 font-sans">
      {/* Animated Background Blobs */}
      {/* Animated Background Blobs - Optimized for Mobile */}
      <div className="fixed top-[-10%] left-[-10%] w-64 h-64 md:w-96 md:h-96 bg-primary rounded-full liquid-blob opacity-20 md:opacity-30 blur-[60px] md:blur-[120px]"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-secondary rounded-full liquid-blob opacity-15 md:opacity-20 blur-[60px] md:blur-[120px]" style={{ animationDelay: '2s' }}></div>

      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              KataSensei
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-1 sm:gap-2">
              <NavLink to="/" active={isActive('/')} icon={<LayoutGrid size={18} />}>
                Dashboard
              </NavLink>
              <NavLink to="/study" active={isActive('/study')} icon={<BookOpen size={18} />}>
                Study
              </NavLink>
              <NavLink to="/decks" active={isActive('/decks')} icon={<Layers size={18} />}>
                Decks
              </NavLink>
              <NavLink to="/arcade" active={isActive('/arcade')} icon={<Gamepad2 size={18} />}>
                Arcade
              </NavLink>
              <NavLink to="/import" active={isActive('/import')} icon={<Upload size={18} />}>
                Import
              </NavLink>
            </div>

            <ThemePicker />
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-[#1a1a24]/90 backdrop-blur-md border-t border-white/10 safe-area-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          <MobileNavLink to="/" active={isActive('/')} icon={<LayoutGrid size={20} />} label="Home" />
          <MobileNavLink to="/decks" active={isActive('/decks')} icon={<Layers size={20} />} label="Decks" />
          <div className="relative -top-5">
            <Link to="/study" className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/40 border-4 border-[#13131a]">
              <BookOpen size={24} />
            </Link>
          </div>
          <MobileNavLink to="/arcade" active={isActive('/arcade')} icon={<Gamepad2 size={20} />} label="Arcade" />
          <MobileNavLink to="/import" active={isActive('/import')} icon={<Upload size={20} />} label="Import" />
        </div>
      </nav>

      <main className="pt-24 pb-20 md:pb-12 px-4 max-w-6xl mx-auto relative z-10">
        {children}
      </main>
    </div>
  );
};

const NavLink: React.FC<{ to: string; active: boolean; icon: React.ReactNode; children: React.ReactNode }> = ({ to, active, icon, children }) => (
  <Link
    to={to}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium
      ${active
        ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] border border-white/10'
        : 'text-gray-400 hover:text-white hover:bg-white/5'}
    `}
  >
    {icon}
    <span className="hidden lg:inline">{children}</span>
  </Link>
);

const MobileNavLink: React.FC<{ to: string; active: boolean; icon: React.ReactNode; label: string }> = ({ to, active, icon, label }) => (
  <Link
    to={to}
    className={`
      flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all w-16
      ${active ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}
    `}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </Link>
);