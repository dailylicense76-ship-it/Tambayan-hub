import React from 'react';
import { Home, Compass, PlusSquare, MessageSquare, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Compass, path: '/discover', label: 'Explore' },
    { icon: PlusSquare, path: '/post', label: 'Flex', isSpecial: true },
    { icon: MessageSquare, path: '/chats', label: 'Chats' },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="relative z-40 w-full bg-white/95 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] pb-[env(safe-area-inset-bottom,1.5rem)] md:rounded-b-[40px] md:pb-6">
      {navItems.map((item) => (
        <Link 
          key={item.label}
          to={item.path}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-300 relative group",
            location.pathname === item.path ? "text-brand" : "text-gray-400 hover:text-brand/60",
            item.isSpecial && "bg-brand text-white p-3.5 rounded-2xl shadow-xl shadow-brand/30 -mt-8 border-4 border-white hover:scale-110 active:scale-95"
          )}
        >
          {location.pathname === item.path && !item.isSpecial && (
            <span className="absolute -top-3 w-1 h-1 bg-brand rounded-full" />
          )}
          <item.icon size={item.isSpecial ? 24 : 22} strokeWidth={item.isSpecial || location.pathname === item.path ? 3 : 2.5} />
        </Link>
      ))}
    </nav>
  );
};
