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
    <nav className="fixed bottom-0 z-40 w-full max-w-[480px] bg-white/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-t border-brand/5 pb-8 shadow-[0_-8px_30px_rgb(0,0,0,0.06)]">
      {navItems.map((item) => (
        <Link 
          key={item.label}
          to={item.path}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-300",
            location.pathname === item.path ? "text-brand" : "text-gray-300 hover:text-brand/60",
            item.isSpecial && "bg-brand text-white p-2.5 rounded-2xl shadow-lg shadow-brand/20 -mt-8 translate-y-2 border-4 border-white"
          )}
        >
          <item.icon size={22} strokeWidth={item.isSpecial || location.pathname === item.path ? 3 : 2} />
        </Link>
      ))}
    </nav>
  );
};
