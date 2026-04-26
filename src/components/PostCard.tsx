import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Heart, MessageCircle, Share2, MoreHorizontal, 
  Megaphone, UserPlus, UserCheck, MessageSquare, Send, X,
  AlertCircle, Eye, BarChart3, Download
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [commentText]);

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
    } catch (error) {
      console.error(error);
    }
  };

  const handleMessage = async () => {
    if (!auth.currentUser) return onOrderClick?.();
    if (user.uid === auth.currentUser.uid) return;

    try {
      await firebaseService.getOrCreateChat(
        auth.currentUser.uid,
        user.uid,
        { displayName: auth.currentUser.displayName, photoURL: auth.currentUser.photoURL },
        { displayName: user.name, photoURL: user.avatar }
      );
      navigate('/chats');
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
          "glass-card mb-6 overflow-hidden border-brand/5 bg-white shadow-sm",
          commerce?.isSponsored && "border-brand/30 shadow-brand/5 bg-brand/[0.02]"
        )}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-brand/10 bg-white" referrerPolicy="no-referrer" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-gray-900">{user.name}</h3>
                {commerce?.isSponsored && (
                  <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-black uppercase italic tracking-tighter">Verified Ad</span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium">@{user.handle}</p>
            </div>
          </div>
          
          {auth.currentUser?.uid !== user.uid && !commerce?.isSponsored && (
            <button 
              onClick={handleFollow}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                isFollowing ? "bg-gray-100 text-gray-400" : "bg-brand text-white shadow-md shadow-brand/20"
              )}
            >
              {isFollowing ? <><UserCheck size={12} /> Kasama</> : <><UserPlus size={12} /> Sali</>}
            </button>
          )}
          
          <button 
            onClick={handleReport}
            className="text-gray-300 hover:text-brand transition-colors p-2"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden group">
          {mediaType === 'video' ? (
            <video 
              ref={videoRef}
              src={content.image} 
              className="w-full h-full object-cover" 
              loop 
              muted 
              playsInline
              controls
            />
          ) : (
            <img 
              src={content.image} 
              alt={content.text} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              referrerPolicy="no-referrer"
            />
          )}
          
          {commerce?.isSelling && !commerce?.isSponsored && (
            <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-full flex items-center gap-2 bg-white/90">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-900">May Tinda</span>
            </div>
          )}

          {commerce?.isSponsored && (
            <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full flex items-center gap-2 bg-brand/10 border-brand/20 animate-pulse">
              <Megaphone size={12} className="text-brand" />
              <span className="text-[10px] font-black uppercase tracking-wider text-brand">BOSS PICK</span>
            </div>
          )}
        </div>

        {/* Actions & Info */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleLike}
                className={cn("flex items-center gap-1.5 transition-colors", isLiked ? "text-brand" : "text-gray-400 hover:text-brand")}
              >
                <Heart size={22} fill={isLiked ? "currentColor" : "none"} />
                <span className="text-xs font-bold text-gray-700">{localStats.likes}</span>
              </button>
              <button 
                onClick={() => setShowComments(true)}
                className="flex items-center gap-1.5 text-gray-400 hover:text-brand transition-colors"
              >
                <MessageCircle size={22} />
                <span className="text-xs font-bold text-gray-700">{localStats.comments}</span>
              </button>
              {auth.currentUser?.uid !== user.uid && (
                <button 
                  onClick={handleMessage}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-brand transition-colors"
                >
                  <MessageSquare size={22} />
                </button>
              )}
              <button 
                onClick={handleShare}
                className="text-gray-400 hover:text-brand transition-colors"
                title="Share Flex"
              >
                <Share2 size={22} />
              </button>
              <button 
                onClick={handleDownload}
                className="text-gray-400 hover:text-brand transition-colors"
                title="Download Flex"
              >
                <Download size={22} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Eye size={16} />
                <span className="text-[10px] font-black text-gray-400">{(localStats.views || 0).toLocaleString()}</span>
              </div>
              
              {commerce?.isSelling && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Presyong Kaibigan</p>
                  <p className="text-lg font-black text-brand">₱{commerce.price.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-800 leading-relaxed">
              <span className="font-black mr-2 text-gray-900 uppercase text-[12px] tracking-tight">{user.handle}</span>
              {content.text}
            </p>
          </div>

          {commerce?.isSelling && (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleOrder}
              disabled={orderLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50 shadow-brand/20"
            >
              {orderLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag size={18} />
                  I-ORDER NA (COD)
                </>
              )}
            </motion.button>
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
