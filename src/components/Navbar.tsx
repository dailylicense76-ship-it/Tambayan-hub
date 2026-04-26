import React from 'react';
import { Search, Bell, ShoppingBag } from 'lucide-react';
import { Logo } from './Logo';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-brand/5">
      <Logo size="sm" />
      
      <div className="flex items-center gap-4 text-gray-400">
        <button className="hover:text-brand transition-colors"><Search size={22} /></button>
        <button className="hover:text-brand transition-colors relative">
          <Bell size={22} />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-brand rounded-full" />
        </button>
      </div>
    </header>
  );
};
