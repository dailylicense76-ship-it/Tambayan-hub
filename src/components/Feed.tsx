import React, { useEffect, useState } from 'react';
import { PostCard } from './PostCard';
import { firebaseService } from '../lib/firebaseService';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { PlusCircle } from 'lucide-react';

export const Feed: React.FC<{ onOrderClick: () => void }> = ({ onOrderClick }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribePosts((newPosts) => {
      setPosts(newPosts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
    <div className="pb-24 bg-white min-h-screen">
      {/* Stories / Highlights Bar (TikTok Style) */}
      <div className="px-4 py-8 border-b border-gray-100 flex gap-5 overflow-x-auto hide-scrollbar bg-gray-50/30">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="w-16 h-16 rounded-full border-2 border-brand p-0.5 relative group cursor-pointer">
            <div className="w-full h-full rounded-full border border-gray-100 bg-white flex items-center justify-center p-1 overflow-hidden">
               <img src={postImg} className="w-full h-full rounded-full object-cover" alt="" />
            </div>
            <div className="absolute bottom-0 right-0 bg-brand text-white rounded-full p-1 border-2 border-white shadow-lg">
              <PlusCircle size={10} strokeWidth={3} />
            </div>
          </div>
          <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">Flex Ko</span>
        </div>
        {[
          { name: 'Boss Degz', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
          { name: 'Kano', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100' },
          { name: 'Chanda', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' },
          { name: 'Baste', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100' },
          { name: 'Liza', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100' }
        ].map((story, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-16 h-16 rounded-full border-2 border-brand p-0.5 bg-gradient-to-tr from-brand to-pink-500 shadow-md">
               <img src={story.img} className="w-full h-full rounded-full object-cover border-2 border-white" alt="" />
            </div>
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">{story.name.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      <div className="px-4 py-8">
        <div className="flex gap-4 mb-10 overflow-x-auto hide-scrollbar pb-2">
          {['All', 'Sneakers', 'Tech', 'Fashion', 'Art', 'Collectibles'].map((cat) => (
            <button 
              key={cat} 
              className="whitespace-nowrap bg-gray-50 text-gray-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all shadow-sm border border-gray-100"
            >
              {cat}
            </button>
          ))}
        </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-400 mb-4 italic font-bold">No posts found...</p>
          <button onClick={seedData} className="btn-secondary flex items-center gap-2 border-brand/20 bg-brand/5 text-brand">
            <PlusCircle size={18} />
            Seed Initial Posts
          </button>
        </div>
      ) : (
        <div className="space-y-6">
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
