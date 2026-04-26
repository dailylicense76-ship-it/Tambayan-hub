import React, { useEffect, useState } from 'react';
import { Search, TrendingUp, Users, ChevronRight, Hash, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { firebaseService } from '../lib/firebaseService';
import { cn } from '../lib/utils';

export const Discover: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('#AllFlex');

  useEffect(() => {
    // Sync search query if URL changes
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    const loadItems = async () => {
      const allPosts = await firebaseService.getPosts() as any[];
      const filtered = (allPosts || []).filter((p: any) => p.commerce && p.commerce.isSelling);
      setPosts(filtered);
      setLoading(false);
    };
    loadItems();
  }, []);

  const categories = React.useMemo(() => {
    if (posts.length === 0) return [];
    const tags = new Set<string>(['#AllFlex']);
    posts.forEach(p => {
      const foundTags = p.text?.match(/#[a-zA-Z0-9]+/g);
      if (foundTags) foundTags.forEach((tag: string) => tags.add(tag));
    });
    return Array.from(tags).slice(0, 10);
  }, [posts]);

  const topFlexers = Array.from(new Set(posts.map(p => p.userId))).map(userId => {
    const post = posts.find(p => p.userId === userId);
    return {
      userId,
      userName: post?.userName || 'User',
      userAvatar: post?.userAvatar
    };
  }).slice(0, 5);

  const filteredPosts = posts.filter(p => 
    p.commerce?.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 pb-24 bg-white min-h-screen text-gray-900 max-w-lg mx-auto">
      {/* Dynamic Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">Discover</h2>
        <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Legit Hub & Trending</p>
      </div>

      {/* Modern Search */}
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-brand/5 rounded-2xl blur-xl group-focus-within:bg-brand/10 transition-all" />
        <div className="relative flex items-center bg-gray-50 border border-gray-100/50 p-4 rounded-2xl group-focus-within:bg-white group-focus-within:border-brand/20 transition-all">
          <Search className="text-gray-300 mr-4" size={20} />
          <input 
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search items, tags, or flexes..."
            className="w-full bg-transparent focus:outline-none text-sm font-bold text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Trending Rail */}
      {categories.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-brand" />
              <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-900">Trending Now</h3>
            </div>
            <button className="text-[9px] font-black text-gray-300 uppercase hover:text-brand flex items-center gap-1">
              See All <ChevronRight size={10} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar">
            {categories.map(tag => (
              <button 
                key={tag} 
                onClick={() => setActiveCategory(tag)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all",
                  activeCategory === tag 
                    ? "bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-105" 
                    : "bg-gray-50 text-gray-400 border-gray-100 hover:border-brand/30 hover:text-brand"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Flexers */}
      {topFlexers.length > 0 && (
        <div className="mb-10 bg-gray-50/50 rounded-[32px] p-6 border border-gray-100/50">
          <div className="flex items-center gap-2 mb-6">
            <Star size={16} className="text-brand fill-brand" />
            <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-900">Top Flexers</h3>
          </div>
          <div className="flex gap-5 overflow-x-auto hide-scrollbar">
            {topFlexers.map((flexer, i) => (
              <div key={flexer.userId} className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-sm border border-brand/5">
                  {flexer.userAvatar ? (
                    <img src={flexer.userAvatar} className="w-full h-full rounded-xl object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gray-200 animate-pulse" />
                  )}
                </div>
                <span className="text-[9px] font-black text-gray-400 uppercase truncate w-14 text-center">{flexer.userName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid Results */}
      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="aspect-square bg-gray-50 rounded-[32px] animate-pulse" />
          ))
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm group hover:shadow-xl hover:shadow-brand/5 transition-all duration-500"
            >
              <div className="aspect-square relative overflow-hidden">
                <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-3 right-3">
                  <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                    <span className="text-[9px] font-black text-brand">₱{post.commerce?.price?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-black uppercase tracking-tighter truncate text-gray-900 mb-2">{post.commerce?.itemName}</p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-brand/10 flex items-center justify-center">
                    <Users size={10} className="text-brand" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">Verified Seller</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 py-20 text-center">
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest italic">No legit results found...</p>
          </div>
        )}
      </div>
    </div>
  );
};
