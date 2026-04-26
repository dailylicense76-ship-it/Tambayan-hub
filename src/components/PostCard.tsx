import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Heart, MessageCircle, Share2, MoreHorizontal, Megaphone } from 'lucide-react';
import { cn } from '../lib/utils';

interface PostProps {
  id: string;
  user: {
    name: string;
    handle: string;
    avatar: string;
  };
  content: {
    image: string;
    text: string;
  };
  commerce?: {
    price: number;
    itemName: string;
    isSelling: boolean;
    isSponsored?: boolean;
  };
  mediaType?: 'image' | 'video';
  stats: {
    likes: number;
    comments: number;
  };
  onOrderClick?: () => void;
}

export const PostCard: React.FC<PostProps> = ({ user, content, commerce, stats, onOrderClick, mediaType = 'image' }) => {
  return (
    <article id={`post-${user.handle}`} className={cn(
      "glass-card mb-6 overflow-hidden",
      commerce?.isSponsored && "border-brand/40 shadow-brand/10"
    )}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-white/20" referrerPolicy="no-referrer" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">{user.name}</h3>
              {commerce?.isSponsored && (
                <span className="text-[10px] bg-brand/20 text-brand px-2 py-0.5 rounded-full font-black uppercase italic tracking-tighter">Ad</span>
              )}
            </div>
            <p className="text-xs text-white/50">@{user.handle}</p>
          </div>
        </div>
        <button className="text-white/50 hover:text-white transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative aspect-square bg-white/5 overflow-hidden">
        {mediaType === 'video' ? (
          <video 
            src={content.image} 
            className="w-full h-full object-cover" 
            autoPlay 
            loop 
            muted 
            playsInline
          />
        ) : (
          <img 
            src={content.image} 
            alt={content.text} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
        )}
        
        {commerce?.isSelling && !commerce?.isSponsored && (
          <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Selling Mode</span>
          </div>
        )}

        {commerce?.isSponsored && (
          <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
            <Megaphone size={12} className="text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Featured by Boss Admin</span>
          </div>
        )}
      </div>

      {/* Actions & Info */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
              <Heart size={22} />
              <span className="text-xs font-medium">{stats.likes}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-brand transition-colors">
              <MessageCircle size={22} />
              <span className="text-xs font-medium">{stats.comments}</span>
            </button>
            <button className="hover:text-brand transition-colors">
              <Share2 size={22} />
            </button>
          </div>
          
          {commerce?.isSelling && (
            <div className="text-right">
              <p className="text-[10px] text-white/50 uppercase tracking-tighter">Starting from</p>
              <p className="text-lg font-bold text-brand">₱{commerce.price.toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm">
            <span className="font-bold mr-2 text-white">{user.handle}</span>
            {content.text}
          </p>
        </div>

        {commerce?.isSelling && (
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={onOrderClick}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <ShoppingBag size={18} />
            Order via COD
          </motion.button>
        )}
      </div>
    </article>
  );
};
