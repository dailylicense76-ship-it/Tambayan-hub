import React from 'react';
import { Home, Compass, PlusSquare, Heart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Compass, path: '/discover', label: 'Explore' },
    { icon: PlusSquare, path: '/post', label: 'Flex' },
    { icon: Heart, path: '/activity', label: 'Likes' },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 z-40 w-full max-w-[480px] glass px-6 py-4 flex items-center justify-between border-t border-white/5 pb-8">
      {navItems.map((item) => (
        <Link 
          key={item.label}
          to={item.path}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-300",
            location.pathname === item.path ? "text-brand scale-110" : "text-white/40 hover:text-white/60"
          )}
        >
          <item.icon size={24} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
        </Link>
      ))}
    </nav>
  );
};
