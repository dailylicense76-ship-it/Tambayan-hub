import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Heart, MessageCircle, Share2, MoreHorizontal, 
  Megaphone, UserPlus, ShieldCheck, MessageSquare, Send, X,
  AlertCircle, Eye, BarChart3, Download, Coins, Bookmark, Star
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { firebaseService } from '../lib/firebaseService';
import { useNavigate } from 'react-router-dom';

interface PostProps {
  id: string;
  user: {
    uid: string;
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
    views?: number;
    shares?: number;
  };
  onOrderClick?: () => void;
}

export const PostCard: React.FC<PostProps> = ({ id, user, content, commerce, stats: initialStats, onOrderClick, mediaType = 'image' }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [localStats, setLocalStats] = useState({
    ...initialStats,
    views: initialStats.views || Math.floor(Math.random() * 5000) + 1200,
    shares: initialStats.shares || Math.floor(Math.random() * 100) + 10
  });
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showHeartPattern, setShowHeartPattern] = useState(false);
  const lastClickTime = useRef(0);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [commentText]);

  useEffect(() => {
    if (mediaType !== 'video' || !videoRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {
              // Auto-play might be blocked, silently ignore
            });
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(videoRef.current);
    
    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, [mediaType]);

  const handleMediaClick = () => {
    const currentTime = new Date().getTime();
    const gap = currentTime - lastClickTime.current;
    
    if (gap > 0 && gap < 300) { // Double click threshold
      if (!isLiked) handleLike();
      setShowHeartPattern(true);
      setTimeout(() => setShowHeartPattern(false), 800);
    }
    lastClickTime.current = currentTime;
  };

  useEffect(() => {
    const checkStatus = async () => {
      if (auth.currentUser) {
        // Check following
        if (user.uid && user.uid !== auth.currentUser.uid) {
          const following = await firebaseService.isFollowing(auth.currentUser.uid, user.uid);
          setIsFollowing(!!following);
        }
        // Check liked
        const liked = await firebaseService.isLiked(id, auth.currentUser.uid);
        setIsLiked(!!liked);
        // Check saved
        const saved = await firebaseService.isPostSaved(auth.currentUser.uid, id);
        setIsSaved(!!saved);
      }
    };
    checkStatus();
  }, [user.uid, id]);

  useEffect(() => {
    if (showComments) {
      const unsub = firebaseService.subscribeComments(id, (data) => {
        setComments(data);
        setLocalStats(prev => ({ ...prev, comments: data.length }));
      });
      return () => unsub();
    }
  }, [id, showComments]);

  const handleSave = async () => {
    if (!auth.currentUser) return onOrderClick?.();
    try {
      const isNowSaved = await firebaseService.toggleSavePost(auth.currentUser.uid, id);
      setIsSaved(isNowSaved);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOrder = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      if (onOrderClick) onOrderClick();
      return;
    }

    if (window.confirm(`Gusto mo bang i-order ang ${commerce?.itemName} sa halagang ₱${commerce?.price?.toLocaleString()} via COD?`)) {
      setOrderLoading(true);
      try {
        await firebaseService.createOrder({
          buyerId: currentUser.uid,
          buyerName: currentUser.displayName,
          sellerId: user.uid,
          itemName: commerce?.itemName,
          price: commerce?.price,
          address: 'Default User Address',
          postId: id,
          sellerName: user.name
        });
        alert('Order placed successfully! Check your notifications.');
      } catch (error) {
        console.error(error);
        alert('Failed to place order.');
      } finally {
        setOrderLoading(false);
      }
    }
  };

  const handleFollow = async () => {
    if (!auth.currentUser) return onOrderClick?.();
    if (user.uid === auth.currentUser.uid) return;

    try {
      await firebaseService.toggleFollow(auth.currentUser.uid, user.uid);
      setIsFollowing(!isFollowing);
      if (!isFollowing) {
        await firebaseService.sendNotification(user.uid, 'follow', {
          fromId: auth.currentUser.uid,
          fromName: auth.currentUser.displayName,
          fromAvatar: auth.currentUser.photoURL
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLike = async () => {
    if (!auth.currentUser) return onOrderClick?.();
    try {
      await firebaseService.toggleLike(id, auth.currentUser.uid);
      setIsLiked(!isLiked);
      setLocalStats(prev => ({ ...prev, likes: prev.likes + (isLiked ? -1 : 1) }));
      
      if (!isLiked && user.uid !== auth.currentUser.uid) {
        await firebaseService.sendNotification(user.uid, 'like', {
          fromId: auth.currentUser.uid,
          fromName: auth.currentUser.displayName,
          postId: id
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !commentText.trim()) return;

    try {
      await firebaseService.addComment(id, {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        userAvatar: auth.currentUser.photoURL,
        text: commentText.trim()
      });
      setCommentText('');
      
      if (user.uid !== auth.currentUser.uid) {
        await firebaseService.sendNotification(user.uid, 'comment', {
          fromId: auth.currentUser.uid,
          fromName: auth.currentUser.displayName,
          postId: id,
          text: commentText.substring(0, 50)
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMessage = async () => {
    if (!auth.currentUser) return onOrderClick?.();
    if (user.uid === auth.currentUser.uid) return;

    try {
      const chatId = await firebaseService.getOrCreateChat(
        auth.currentUser.uid,
        user.uid,
        { displayName: auth.currentUser.displayName, photoURL: auth.currentUser.photoURL },
        { displayName: user.name, photoURL: user.avatar }
      );
      navigate(`/chats?chatId=${chatId}`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Degz Enterprises Flex',
      text: content.text,
      url: `${window.location.origin}/post/${id}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setLocalStats(prev => ({ ...prev, shares: (prev.shares || 0) + 1 }));
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard! Share it with your friends.');
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  };

  const handleGift = async () => {
    if (!auth.currentUser) return onOrderClick?.();
    if (user.uid === auth.currentUser.uid) {
      alert("You can't gift your own post.");
      return;
    }
    
    const amount = 10; // Default gift amount
    if (window.confirm(`Gusto mo bang mag-send ng ${amount} Tambayan Coins kay ${user.name}?`)) {
      try {
        await firebaseService.sendGift(auth.currentUser.uid, user.uid, amount);
        alert(`Successfully sent ${amount} coins! Maraming salamat!`);
        setShowHeartPattern(true);
        setTimeout(() => setShowHeartPattern(false), 800);
        
        await firebaseService.sendNotification(user.uid, 'gift', {
          fromId: auth.currentUser.uid,
          fromName: auth.currentUser.displayName,
          amount: amount
        });
      } catch (error: any) {
        console.error(error);
        if (error.message.includes('Insufficient')) {
          alert('Insufficient Tambayan Coins! Mag top-up sa Profile mo.');
        } else {
          alert('Failed to send gift. Try again later.');
        }
      }
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(content.image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flex-${id}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(content.image, '_blank');
    }
  };

  const handleReport = async () => {
    if (!auth.currentUser) return onOrderClick?.();
    const reason = window.prompt('Bakit mo ni-report ang post na ito? (e.g. Inappropriate, Scam, Spam)');
    if (reason) {
      try {
        await firebaseService.reportPost(id, auth.currentUser.uid, reason, {
          text: content.text,
          image: content.image,
          userHandle: user.handle
        });
        alert('Salamat! Na-receive na ng Boss Admin ang report mo.');
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <>
      <motion.article 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        id={`post-${id}`} 
        className={cn(
          "bg-white sm:border-y md:border border-gray-100 overflow-hidden mb-2 sm:mb-4 relative rounded-none md:rounded-[24px] transition-shadow hover:shadow-xl hover:shadow-black/5",
          commerce?.isSponsored && "bg-brand/[0.02]"
        )}
      >
        {/* Header & Overlay */}
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/profile/${user.uid}`)}>
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-gray-100 bg-gray-50 object-cover" />
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-[14px] text-gray-900 leading-none">{user.name}</h3>
                {commerce?.isSelling && (
                  <div className="flex items-center ml-1 text-[10px] text-brand bg-brand/10 px-1 py-0.5 rounded font-black uppercase tracking-tighter" title="Legit Seller Badge">
                    <ShieldCheck size={12} className="mr-0.5" /> Legit
                  </div>
                )}
                {commerce?.isSponsored && (
                  <span className="ml-1 text-[9px] bg-brand/10 text-brand px-1.5 py-[1px] rounded bg-white border border-brand/20 font-black uppercase tracking-tighter">Ad</span>
                )}
              </div>
              <p className="text-[12px] text-gray-500 font-medium flex items-center gap-1">
                @{user.handle}
                {commerce?.isSelling && <span className="text-[10px] text-yellow-500 flex items-center"><Star size={10} className="fill-yellow-500 mr-0.5"/> 4.9</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {auth.currentUser?.uid !== user.uid && !commerce?.isSponsored && (
              <button 
                onClick={handleFollow}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[12px] font-bold transition-all",
                  isFollowing ? "bg-gray-100 text-gray-600" : "bg-brand/10 text-brand hover:bg-brand/20"
                )}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            <button onClick={handleReport} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-50 transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Caption */}
        <div className="px-4 pb-2">
          <p className="text-[14px] text-gray-800 whitespace-pre-wrap leading-snug">
            {content.text.split(/(#[a-zA-Z0-9]+)/g).map((part, i) => (
              part.startsWith('#') 
                ? <span key={i} className="text-brand font-semibold cursor-pointer hover:underline">{part}</span> 
                : <span key={i}>{part}</span>
            ))}
          </p>
        </div>

        {/* Main Content */}
        <div 
          className="relative w-full max-h-[70vh] bg-black overflow-hidden group cursor-pointer"
          onClick={handleMediaClick}
        >
          {mediaType === 'video' ? (
            <video 
              ref={videoRef}
              src={content.image} 
              className="w-full max-h-[70vh] object-contain" 
              loop 
              muted 
              playsInline
              controls
            />
          ) : (
            <img 
              src={content.image} 
              alt="Post" 
              className="w-full max-h-[70vh] object-contain transition-transform duration-700" 
              referrerPolicy="no-referrer"
            />
          )}

          <AnimatePresence>
            {showHeartPattern && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                exit={{ scale: 2, opacity: 0, rotate: 20 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              >
                <Heart size={100} className="fill-white text-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {commerce?.isSelling && !commerce?.isSponsored && (
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/10 shadow-xl">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-white">Selling</span>
            </div>
          )}
        </div>

        {/* Actions & Info */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <button 
                onClick={handleLike}
                className={cn("flex items-center gap-1.5 transition-colors group", isLiked ? "text-brand" : "text-gray-700 hover:text-brand")}
              >
                <Heart size={26} fill={isLiked ? "currentColor" : "none"} className={cn("transition-transform group-active:scale-90", isLiked && "text-brand")} />
                <span className="text-[13px] font-bold">{localStats.likes}</span>
              </button>
              <button 
                onClick={() => setShowComments(true)}
                className="flex items-center gap-1.5 text-gray-700 hover:text-brand transition-colors group"
              >
                <MessageCircle size={26} className="transition-transform group-active:scale-90" />
                <span className="text-[13px] font-bold">{localStats.comments}</span>
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center gap-1.5 text-gray-700 hover:text-brand transition-colors group"
                title="Share Flex"
              >
                <Share2 size={26} className="transition-transform group-active:scale-90" />
                <span className="text-[13px] font-bold">{localStats.shares || 0}</span>
              </button>
              <button 
                onClick={handleGift}
                className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 transition-colors group ml-2"
                title="Send Gift"
              >
                <Coins size={26} className="transition-transform group-active:scale-90 fill-orange-200" />
                <span className="text-[13px] font-bold">10</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleSave}
                className={cn("transition-colors group", isSaved ? "text-brand" : "text-gray-500 hover:text-brand")}
                title="Save for Later"
              >
                <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} className="transition-transform group-active:scale-90" />
              </button>
              {auth.currentUser?.uid !== user.uid && (
                <button 
                  onClick={handleMessage}
                  className="text-gray-500 hover:text-brand transition-colors bg-gray-100 p-2 rounded-full"
                  title="Direct Message"
                >
                  <MessageSquare size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-gray-400 px-1 hover:text-gray-600 transition-colors">
            <Eye size={14} />
            <span className="text-[11px] font-black tracking-widest">{(localStats.views || 0).toLocaleString()} views</span>
          </div>

          {commerce?.isSelling && (
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between mt-2 border border-brand/10">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none">{commerce.itemName || 'For Sale'}</p>
                <p className="text-lg font-black text-brand leading-none mt-1">₱{commerce.price.toLocaleString()}</p>
              </div>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleOrder}
                disabled={orderLoading}
                className="bg-brand text-white px-5 py-2.5 rounded-lg font-bold text-[12px] flex items-center gap-2 shadow-md shadow-brand/20 disabled:opacity-50"
              >
                {orderLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingBag size={14} />
                    Buy Now
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </motion.article>

      {/* Floating Comments Drawer (TikTok Style) */}
      <AnimatePresence>
        {showComments && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowComments(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 h-[70vh] bg-white z-[101] rounded-t-[32px] flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Comments ({localStats.comments})</h4>
                <button onClick={() => setShowComments(false)} className="p-2 bg-gray-50 rounded-full text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 px-1 custom-scrollbar pb-24">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 opacity-30">
                    <MessageCircle size={48} className="mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No talk yet. Be first.</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                      <img src={comment.userAvatar} className="w-8 h-8 rounded-full bg-gray-100 border border-brand/10" alt="" />
                      <div className="flex-1">
                        <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none group-hover:bg-brand/[0.02] transition-colors">
                          <p className="text-[10px] font-black text-gray-900 mb-1">@{comment.userName?.replace(/\s+/g, '').toLowerCase() || 'tambay'}</p>
                          <p className="text-xs text-gray-700 leading-normal">{comment.text}</p>
                        </div>
                        <div className="flex gap-4 mt-1.5 ml-1">
                          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">
                            {comment.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
                          </span>
                          <button className="text-[9px] font-black text-brand uppercase tracking-tighter">Like</button>
                          <button className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 pb-10">
                <form onSubmit={handlePostComment} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest transition-colors",
                      commentText.length > 250 ? "text-orange-500" : "text-gray-300"
                    )}>
                      {commentText.length} / 280
                    </span>
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                      <textarea 
                        ref={textareaRef}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment as @ka-tambay..."
                        maxLength={280}
                        rows={1}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-4 pr-12 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand resize-none min-h-[48px] max-h-[120px] custom-scrollbar"
                      />
                      <button 
                        type="submit"
                        disabled={!commentText.trim()}
                        className="absolute right-2 bottom-2 p-2 text-brand disabled:opacity-30"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
