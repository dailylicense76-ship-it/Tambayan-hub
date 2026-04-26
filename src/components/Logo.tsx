import React from 'react';
import { Tent, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 'md', showText = true }) => {
  const iconSize = {
    sm: 16,
    md: 24,
    lg: 32
  }[size];

  const containerSize = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl'
  }[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "bg-brand relative flex items-center justify-center shadow-lg shadow-brand/20 overflow-hidden",
        containerSize
      )}>
        {/* Abstract Hub/Roof Pattern */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black/10 rounded-full" />
        
        <div className="relative">
          <Tent size={iconSize} className="text-white" strokeWidth={2.5} />
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-brand/10">
             <ShoppingBag size={iconSize/2} className="text-brand" strokeWidth={3} />
          </div>
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col -space-y-1">
          <h1 className={cn(
            "font-black tracking-tighter uppercase italic text-gray-900",
            size === 'sm' ? "text-base" : size === 'md' ? "text-xl" : "text-3xl"
          )}>
            Tambayan<span className="text-brand">Hub</span>
          </h1>
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400 leading-none">
            Legit Marketplace
          </p>
        </div>
      )}
    </div>
  );
};
