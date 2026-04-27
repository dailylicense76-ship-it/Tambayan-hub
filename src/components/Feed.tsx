import React, { useEffect, useState } from 'react';
import { PostCard } from './PostCard';
import { firebaseService } from '../lib/firebaseService';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { PlusCircle, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export const Feed: React.FC<{ onOrderClick: () => void }> = ({ onOrderClick }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [tick, setTick] = useState(Date.now());
  const navigate = useNavigate();

  // Force re-render every 5 seconds to actively filter dead streams from the UI
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

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

  useEffect(() => {
    const q = query(collection(db, 'liveStreams'), where('status', '==', 'live'));
    const unsub = onSnapshot(q, (snap) => {
       const streams = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
       
       // Filter out old "ghost" duplicates created by addDoc (where id != hostId)
       // and deduplicate by hostId just to be completely safe.
       // ALSO filter by heartbeat (updatedAt must be within last 20 seconds)
       const now = Date.now();
       const validStreams = streams.filter(s => {
         // Streams without updatedAt are from the old bugged schema, hide them
         const isRecent = s.updatedAt ? (now - s.updatedAt < 60000) : false;
         return s.id === s.hostId && isRecent;
       });
       
       const uniqueStreams = Array.from(new Map(validStreams.map(s => [s.hostId, s])).values());
       
       setLiveStreams(uniqueStreams);
    }, (error) => {
      console.error("Error in live streams onSnapshot:", error);
    });
    return () => unsub();
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
    <div className="min-h-full bg-[#f0f0f2]">
      {/* Top Tabs */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100 flex items-center justify-center py-0 shadow-sm">
          <div className="flex gap-4 px-4 w-full max-w-lg mx-auto justify-center">
            {['Following', 'For You'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-') as any)}
                className={cn(
                  "text-[11px] font-black uppercase tracking-[0.3em] transition-all py-5 border-b-2",
                  activeTab === tab.toLowerCase().replace(' ', '-') ? "text-brand border-brand" : "text-gray-400 border-transparent hover:text-gray-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
      </div>

      {/* Stories / Highlights Bar */}
      <div className="py-4 border-b border-gray-100 flex gap-4 overflow-x-auto custom-scrollbar bg-white px-2">
        <div className="flex flex-col items-center gap-1.5 shrink-0 ml-2" onClick={() => navigate('/post')}>
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 p-0.5 relative group cursor-pointer hover:border-brand transition-colors">
            <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
               <img src={postImg} className="w-full h-full object-cover" alt="Your Story" />
            </div>
            <div className="absolute right-0 bottom-0 bg-brand text-white rounded-full p-1 border-2 border-white shadow-sm transition-transform group-hover:scale-110">
              <PlusCircle size={12} strokeWidth={3} />
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-500">Go Live/Flex</span>
        </div>
        
        {/* Render active Live Streams */}
        {liveStreams.filter(stream => stream.updatedAt && (tick - stream.updatedAt < 20000)).map((stream) => (
          <div key={stream.id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer" onClick={() => navigate(`/live?streamId=${stream.id}&mode=viewer`)}>
            <div className="w-16 h-16 rounded-full border-[3px] border-red-500 p-0.5 relative group transition-transform hover:scale-105 shadow-md shadow-red-500/20">
              <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-white">
                 <img src={stream.hostPhoto || 'https://api.dicebear.com/7.x/avataaars/svg?seed=live'} className="w-full h-full object-cover" alt={stream.hostName} />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded animate-pulse">Live</div>
            </div>
            <span className="text-[10px] font-bold text-brand truncate w-16 text-center mt-1">{stream.hostName}</span>
          </div>
        ))}

        {/* Render active stories from users in the feed */}
        {Array.from(new Set(posts.map(p => p.userId))).slice(0, 8).map((uid) => {
          const userPost = posts.find(p => p.userId === uid);
          if (!userPost || uid === 'system') return null;
          return (
            <div key={uid} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
              <div className="w-16 h-16 rounded-full border-[3px] border-brand p-0.5 relative group transition-transform hover:scale-105">
                <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                   <img src={userPost.userAvatar} className="w-full h-full object-cover" alt={userPost.userName} />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-900 truncate w-16 text-center">{userPost.userHandle || userPost.userName}</span>
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-screen-xl mx-auto px-0 sm:px-4 lg:px-8">
        {posts.length > 0 && (
          <div className="flex gap-2 mb-2 pt-4 px-4 overflow-x-auto custom-scrollbar pb-2">
            {Array.from(new Set(['All', ...posts.flatMap(p => p.text?.match(/#[a-zA-Z0-9]+/g) || []).map(t => t.replace('#', ''))])).slice(0, 8).map((cat) => (
              <button 
                key={cat} 
                className="whitespace-nowrap bg-white text-gray-600 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all shadow-sm border border-gray-100 hover:bg-gray-50 hover:border-brand/30 active:scale-95"
              >
                {cat}
              </button>
            ))}
          </div>
        )}

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-8">
          <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mb-8 shadow-xl border border-gray-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-brand/5 animate-pulse" />
            {activeTab === 'following' && !auth.currentUser ? (
              <AlertCircle size={40} className="text-brand/20 relative z-10" />
            ) : (
              <PlusCircle size={40} className="text-brand/20 relative z-10" />
            )}
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8 leading-relaxed max-w-xs">
            {activeTab === 'following' && !auth.currentUser 
              ? "Kelangan mo munang mag-sign in \npara makita ang flex ng tropa mo."
              : "Walang flex dito sa ngayon lods. Be the first to trend!"}
          </p>
          
          {activeTab === 'following' && !auth.currentUser ? (
            <button 
              onClick={onOrderClick}
              className="btn-primary px-12 py-5 shadow-brand/20 group"
            >
              <span className="group-hover:scale-105 transition-transform inline-block">Sign In to Follow</span>
            </button>
          ) : (
            <button onClick={() => navigate('/post')} className="text-[10px] font-black text-brand uppercase tracking-[0.4em] hover:opacity-70 transition-opacity border-b-2 border-brand/20 pb-1">
              Start Flexing Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-[120px] pt-2">
          {posts.map((post, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx % 3 * 0.1 }}
              key={post.id} 
              className="mb-0 sm:mb-2"
            >
              <PostCard 
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
            </motion.div>
          ))}
          
          <div className="col-span-full py-16 text-center">
            <div className="w-12 h-1 bg-gray-200 mx-auto mb-8 rounded-full opacity-30" />
            <p className="text-[11px] font-black uppercase tracking-[.6em] text-gray-300">
              Degz Enterprises &copy; 2026
            </p>
            <p className="text-[9px] font-bold text-gray-200 mt-2 uppercase tracking-widest">Tambayan Hub Legit Marketplace</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
