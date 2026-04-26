import React, { useEffect, useState } from 'react';
import { PostCard } from './PostCard';
import { firebaseService } from '../lib/firebaseService';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { PlusCircle, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const Feed: React.FC<{ onOrderClick: () => void }> = ({ onOrderClick }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');
  const [followedIds, setFollowedIds] = useState<string[]>([]);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const setupFeed = async () => {
      setLoading(true);
      if (activeTab === 'for-you') {
        unsubscribe = firebaseService.subscribePosts((newPosts) => {
          setPosts(newPosts);
          setLoading(false);
        });
      } else {
        if (auth.currentUser) {
          const ids = await firebaseService.getFollowingIds(auth.currentUser.uid);
          setFollowedIds(ids || []);
          unsubscribe = firebaseService.subscribeFollowingPosts(auth.currentUser.uid, ids || [], (newPosts) => {
            setPosts(newPosts);
            setLoading(false);
          });
        } else {
          setPosts([]);
          setLoading(false);
        }
      }
    };

    setupFeed();
    return () => unsubscribe();
  }, [activeTab]);

  const seedData = async () => {
    const SAMPLE_POSTS = [
      {
        userId: 'system',
        userName: 'Sneaker King',
        userHandle: 'sneaker_king',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        mediaType: 'image',
        image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800',
        text: 'Just got these rare Air Jordan 1s. Thinking of letting them go for the right price! #SneakerHead #Jordan1',
        commerce: { price: 15500, itemName: 'Air Jordan 1 Retro High', isSelling: true }
      },
      {
        userId: 'system',
        userName: 'Tambayan Official',
        userHandle: 'tambayan_ads',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        mediaType: 'video',
        image: 'https://assets.mixkit.co/videos/preview/mixkit-shopping-mall-escalator-4354-large.mp4',
        text: 'Experience the new way to shop. Direct from sellers, delivered via COD. Join the marketplace today! #Marketplace #COD',
        commerce: { price: 0, itemName: 'Platform Ad', isSelling: false, isSponsored: true }
      }
    ];

    for (const post of SAMPLE_POSTS) {
      await firebaseService.createPost(post);
    }
  };

  const postImg = auth.currentUser?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tambay';

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="glass-card aspect-square animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-[#f0f0f2]">
      {/* Top Tabs */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 flex items-center justify-center py-0 shadow-sm">
        <div className="flex gap-8 px-4 w-full max-w-lg mx-auto justify-center">
          <button 
            onClick={() => setActiveTab('for-you')}
            className={cn(
              "text-[13px] font-black uppercase tracking-widest transition-all py-5 border-b-2",
              activeTab === 'for-you' ? "text-brand border-brand" : "text-gray-400 border-transparent hover:text-gray-600"
            )}
          >
            For You
          </button>
          <button 
            onClick={() => setActiveTab('following')}
            className={cn(
              "text-[13px] font-black uppercase tracking-widest transition-all py-5 border-b-2",
              activeTab === 'following' ? "text-brand border-brand" : "text-gray-400 border-transparent hover:text-gray-600"
            )}
          >
            Following
          </button>
        </div>
      </div>

      {/* Stories / Highlights Bar (TikTok Style) */}
      <div className="py-4 border-b border-gray-100 flex gap-4 overflow-x-auto custom-scrollbar bg-white px-2">
        <div className="flex flex-col items-center gap-1.5 shrink-0 ml-2">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 p-0.5 relative group cursor-pointer hover:border-brand transition-colors">
            <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
               <img src={postImg} className="w-full h-full object-cover" alt="Your Story" />
            </div>
            <div className="absolute right-0 bottom-0 bg-brand text-white rounded-full p-1 border-2 border-white shadow-sm transition-transform group-hover:scale-110">
              <PlusCircle size={12} strokeWidth={3} />
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-500">Add Story</span>
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto">
        {posts.length > 0 && (
          <div className="flex gap-2 mb-2 pt-4 px-4 overflow-x-auto custom-scrollbar pb-2">
            {Array.from(new Set(['All', ...posts.flatMap(p => p.text?.match(/#[a-zA-Z0-9]+/g) || []).map(t => t.replace('#', ''))])).slice(0, 8).map((cat) => (
              <button 
                key={cat} 
                className="whitespace-nowrap bg-white text-gray-600 px-4 py-2 rounded-full text-[11px] font-bold transition-all shadow-sm border border-gray-100 hover:bg-gray-50"
              >
                {cat}
              </button>
            ))}
          </div>
        )}

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-8">
          <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
            {activeTab === 'following' && !auth.currentUser ? (
              <AlertCircle size={32} className="text-gray-200" />
            ) : (
              <PlusCircle size={32} className="text-gray-200" />
            )}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 leading-relaxed">
            {activeTab === 'following' && !auth.currentUser 
              ? "Kelangan mo munang mag-sign in \npara makita ang flex ng tropa mo."
              : "Walang flex dito sa ngayon..."}
          </p>
          
          {activeTab === 'following' && !auth.currentUser ? (
            <button 
              onClick={onOrderClick}
              className="btn-primary w-full shadow-brand/20"
            >
              Sign In to Follow
            </button>
          ) : (
            <p className="text-[9px] font-bold text-gray-200 uppercase tracking-[0.3em]">
              Maging una sa pag-flex!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6 pt-2">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              id={post.id}
              user={{ 
                uid: post.userId,
                name: post.userName, 
                handle: post.userHandle, 
                avatar: post.userAvatar 
              }}
              content={{ image: post.image, text: post.text }}
              stats={post.stats}
              commerce={post.commerce}
              mediaType={post.mediaType}
              onOrderClick={onOrderClick}
            />
          ))}
          
          <div className="py-12 text-center">
            <p className="text-[10px] font-black uppercase tracking-[.4em] text-gray-300">
              Degz Enterprises &copy; 2024
            </p>
            <p className="text-[8px] font-bold text-gray-200 mt-1 uppercase">Tambayan Hub Legit Marketplace License</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
