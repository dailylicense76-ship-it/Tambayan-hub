import React, { useState, useEffect } from 'react';
import { Search, Bell, ShoppingBag, User, Download, Radio, X, Heart, MessageCircle, Coins } from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { firebaseService } from '../lib/firebaseService';

interface NavbarProps {
  onAuthClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onAuthClick }) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    let unsub = () => {};
    if (user) {
      unsub = firebaseService.subscribeNotifications(user.uid, (data) => {
        setNotifications(data);
      });
    } else {
      setNotifications([]);
    }
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchFocused(false);
    }
  };

  const handleGoLive = () => {
    if (!user) return onAuthClick();
    alert("Live Selling feature is coming soon! Get your items ready to flex!");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xl px-4 py-3 border-b border-gray-100/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo size="sm" />
          
          {/* Desktop Search */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex relative group">
            <div className={cn(
              "flex items-center gap-3 px-4 py-2 bg-gray-50 border transition-all duration-300 rounded-2xl",
              isSearchFocused ? "border-brand ring-4 ring-brand/5 w-[320px] bg-white" : "border-transparent w-[240px] hover:bg-gray-100"
            )}>
              <Search size={18} className={cn("transition-colors", isSearchFocused ? "text-brand" : "text-gray-400")} />
              <input 
                type="text" 
                placeholder="Find some legit flex..."
                className="bg-transparent border-none focus:outline-none text-xs font-bold text-gray-900 w-full placeholder:text-gray-300"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Install App Button (PWA) */}
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-brand text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-brand/90 transition-colors"
            >
              <Download size={12} />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}

          {/* Go Live Button */}
          <button 
            onClick={handleGoLive}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-colors relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-red-500/20 w-0 group-hover:w-full transition-all duration-500 ease-out" />
            <Radio size={14} className="text-red-500 animate-pulse" />
            <span>Live</span>
          </button>

          {/* Mobile Search Trigger */}
          <button 
            onClick={() => navigate('/discover')}
            className="md:hidden p-2 text-gray-400 hover:text-brand transition-colors"
          >
            <Search size={22} />
          </button>
          
          <button 
            onClick={() => {
              if (!user) return onAuthClick();
              setShowNotifications(!showNotifications);
            }}
            className="relative p-2 bg-gray-50 rounded-2xl text-gray-400 hover:text-brand hover:bg-brand/5 transition-all group"
          >
            <Bell size={20} />
            {notifications.length > 0 && notifications.some(n => !n.read) && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          <button 
            onClick={() => auth.currentUser ? navigate('/admin') : onAuthClick()}
            className="p-2 bg-gray-50 rounded-2xl text-gray-400 hover:text-brand hover:bg-brand/5 transition-all md:flex hidden"
          >
            <ShoppingBag size={20} />
          </button>
          
          <div className="h-8 w-px bg-gray-100 mx-0.5 hidden md:block" />
          
          <button 
            onClick={() => user ? navigate('/profile') : onAuthClick()}
            className="p-0.5 border-2 border-brand/10 rounded-full overflow-hidden hover:border-brand transition-all relative group"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 bg-gray-100 flex items-center justify-center rounded-full overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-gray-400" />
              )}
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-4 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-50 max-h-[60vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Latest Flex Updates</h4>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
            </div>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-gray-900 leading-snug">
                    Welcome to Tambayan Hub! Legit flex starts here.
                  </p>
                  <span className="text-[8px] text-brand uppercase font-black mt-1 block">System Notice</span>
                </div>
              ) : (
                notifications.map((notif: any) => (
                  <div key={notif.id} className="p-3 bg-gray-50 rounded-2xl flex gap-3 items-start cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => {
                    setShowNotifications(false);
                    if(notif.postId) navigate(`/post/${notif.postId}`);
                  }}>
                    {notif.type === 'like' && <Heart size={16} className="text-brand shrink-0 mt-0.5 fill-brand" />}
                    {notif.type === 'comment' && <MessageCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />}
                    {notif.type === 'follow' && <User size={16} className="text-green-500 shrink-0 mt-0.5" />}
                    {notif.type === 'gift' && <Coins size={16} className="text-orange-500 shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-[11px] font-bold text-gray-900 leading-snug">
                        {notif.type === 'like' && `${notif.fromName} liked your flex.`}
                        {notif.type === 'comment' && `${notif.fromName} commented: "${notif.text}"`}
                        {notif.type === 'follow' && `${notif.fromName} started following you.`}
                        {notif.type === 'gift' && `${notif.fromName} sent you ${notif.amount} Tambayan Coins!`}
                      </p>
                      <span className="text-[8px] text-gray-400 uppercase font-bold mt-1 block">
                        {notif.createdAt?.toDate()?.toLocaleTimeString() || 'Just now'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
