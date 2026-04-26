import React from 'react';
import { ShoppingBag, Search, Bell } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full glass px-4 py-3 flex items-center justify-between border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-lg shadow-brand/20">
          <div className="w-4 h-4 bg-white/20 rounded-sm rotate-45" />
        </div>
        <h1 className="text-lg font-black tracking-tighter uppercase italic">Tambayan</h1>
      </div>
      
      <div className="flex items-center gap-4 text-white/70">
        <button className="hover:text-brand transition-colors"><Search size={22} /></button>
        <button className="hover:text-brand transition-colors"><Bell size={22} /></button>
        <button className="hover:text-brand transition-colors relative">
          <ShoppingBag size={22} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand rounded-full border-2 border-[#0f172a]" />
        </button>
      </div>
    </header>
  );
};
