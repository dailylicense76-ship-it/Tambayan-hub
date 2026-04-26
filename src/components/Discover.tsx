import React, { useEffect, useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { firebaseService } from '../lib/firebaseService';

export const Discover: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      const allPosts = await firebaseService.getPosts() as any[];
      // Filter for items with commerce/isSelling safely
      const filtered = (allPosts || []).filter((p: any) => p.commerce && p.commerce.isSelling);
      setPosts(filtered);
      setLoading(false);
    };
    loadItems();
  }, []);

  return (
    <div className="p-4 pb-24 bg-white min-h-screen text-gray-900">
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
        <input 
          placeholder="Mag-search ng mga legit flex..."
          className="w-full bg-gray-50 border border-gray-100 py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand text-sm font-bold placeholder:text-gray-300"
        />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={18} className="text-brand" />
        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Marketplace Hub</h3>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6">
        {['#SneakerFlex', '#LegitCheck', '#BudgetPicks', '#RareFinds', '#DegzApparel'].map(tag => (
          <button key={tag} className="whitespace-nowrap px-4 py-2 bg-gray-50 text-[10px] font-black uppercase text-gray-400 rounded-xl border border-gray-100 hover:border-brand/30 hover:text-brand transition-colors">
            {tag}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-50 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {posts.map((post, index) => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card overflow-hidden group bg-white border-brand/5 shadow-sm"
            >
              <div className="aspect-square relative">
                <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-2 left-2 flex">
                  <span className="bg-brand text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg italic">₱{post.commerce?.price?.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-[10px] font-black uppercase tracking-tighter truncate text-gray-900">{post.commerce?.itemName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <img src={post.userAvatar} className="w-4 h-4 rounded-full border border-brand/10" alt="" />
                  <span className="text-[9px] font-bold text-gray-400 truncate">@{post.userHandle}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
