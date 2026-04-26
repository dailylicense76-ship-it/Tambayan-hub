import React, { useEffect, useState } from 'react';
import { Search, Grid, TrendingUp } from 'lucide-react';
import { firebaseService } from '../lib/firebaseService';

export const Discover: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      const allPosts = await firebaseService.getPosts();
      // Filter for items with commerce/isSelling
      setPosts(allPosts?.filter(p => p.commerce?.isSelling) || []);
      setLoading(false);
    };
    loadItems();
  }, []);

  return (
    <div className="p-4 pb-24">
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
        <input 
          placeholder="Mag-search ng mga legit flex..."
          className="w-full glass bg-white/5 py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
        />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={18} className="text-brand" />
        <h3 className="font-bold text-sm uppercase tracking-widest text-white/60">Legit Marketplace</h3>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="aspect-square glass rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {posts.map((post) => (
            <div key={post.id} className="glass-card overflow-hidden group">
              <div className="aspect-square relative">
                <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                  <span className="glass px-2 py-1 rounded text-[10px] font-bold text-brand">₱{post.commerce.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-2">
                <p className="text-[10px] font-bold truncate text-white/50">{post.commerce.itemName}</p>
                <div className="flex items-center gap-1 mt-1">
                  <img src={post.userAvatar} className="w-3 h-3 rounded-full" alt="" />
                  <span className="text-[9px] text-white/30 truncate">@{post.userHandle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
