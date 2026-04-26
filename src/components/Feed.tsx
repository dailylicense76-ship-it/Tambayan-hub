import React, { useEffect, useState } from 'react';
import { PostCard } from './PostCard';
import { firebaseService } from '../lib/firebaseService';
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
    <div className="px-4 py-6 pb-24 touch-pan-y">
      <div className="flex gap-4 mb-8 overflow-x-auto hide-scrollbar">
        {['All', 'Sneakers', 'Tech', 'Fashion', 'Art', 'Collectibles'].map((cat) => (
          <button 
            key={cat} 
            className="whitespace-nowrap glass px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-brand transition-all"
          >
            {cat}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-white/40 mb-4 italic">No posts yet...</p>
          <button onClick={seedData} className="btn-secondary flex items-center gap-2">
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
              user={{ name: post.userName, handle: post.userHandle, avatar: post.userAvatar }}
              content={{ image: post.image, text: post.text }}
              stats={post.stats}
              commerce={post.commerce}
              mediaType={post.mediaType}
              onOrderClick={onOrderClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
