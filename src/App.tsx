import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Feed } from './components/Feed';
import { Profile } from './components/Profile';
import { AdminDashboard } from './components/AdminDashboard';
import { Discover } from './components/Discover';
import { Activity } from './components/Activity';
import { CreatePost } from './components/CreatePost';
import { ChatList } from './components/ChatList';
import { AuthModal } from './components/AuthModal';
import { CanvasBackground } from './components/CanvasBackground';
import { ChatWindow } from './components/ChatWindow';
import { PostView } from './components/PostView';
import { Live } from './components/Live';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { cn } from './lib/utils';
import { firebaseService } from './lib/firebaseService';
import { AlertCircle, X, Package, Home, Search, Radio, ShoppingBag } from 'lucide-react';

const RequireAuth: React.FC<{ children: React.ReactNode; user: User | null; loading: boolean; onRequireAuth: () => void }> = ({ children, user, loading, onRequireAuth }) => {
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);

  useEffect(() => {
    if (!user && !loading && !hasAttemptedAuth) {
      onRequireAuth();
      setHasAttemptedAuth(true);
    }
  }, [user, loading, hasAttemptedAuth, onRequireAuth]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh] bg-white">
        <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6 border border-gray-100">
           <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
             <AlertCircle size={32} className="text-gray-200" />
           </motion.div>
        </div>
        <p className="text-gray-400 mb-6 tracking-widest text-[10px] uppercase font-black leading-relaxed">
          Oops! Kelangan mo munang <br/> mag-sign in lods.
        </p>
        <button 
          onClick={onRequireAuth} 
          className="btn-primary w-full shadow-brand/20"
        >
          Sign In Now
        </button>
        <Link to="/" className="mt-4 text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-brand transition-colors">
          Balik muna ako sa Feed
        </Link>
      </div>
    );
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Validate connection to Firestore as per instructions
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [uploadIndicator, setUploadIndicator] = useState<{ progress: number; active: boolean }>({ progress: 0, active: false });

  const handleOrderClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setIsOrderModalOpen(true);
    }
  };

  const startBackgroundUpload = async (file: File, postData: any) => {
    setUploadIndicator({ progress: 5, active: true });
    try {
      const url = await firebaseService.uploadFile(file, 'posts', (p) => {
        setUploadIndicator({ progress: Math.max(5, Math.min(95, Math.round(p))), active: true });
      });
      await firebaseService.createPost({ ...postData, mediaUrl: url });
      setUploadIndicator({ progress: 100, active: true });
      setTimeout(() => setUploadIndicator({ progress: 0, active: false }), 4000);
    } catch (error) {
      console.error('BG Upload Failed:', error);
      setUploadIndicator({ progress: 0, active: false });
      alert('Upload failed in background.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-12 h-12 bg-brand rounded-xl shadow-lg shadow-brand/40"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex justify-center">
      {/* 3D Background */}
      <CanvasBackground />

      {/* Responsive Wrapper */}
      <div className="w-full xl:max-w-screen-2xl h-[100dvh] bg-white/95 backdrop-blur-2xl relative flex flex-col mx-auto overflow-hidden sm:shadow-2xl sm:border-x sm:border-gray-100/50">
        <div className="flex-shrink-0 z-50 w-full relative bg-white border-b border-gray-100">
          <Navbar onAuthClick={() => setIsAuthModalOpen(true)} />
        </div>
        
        <div className="flex-1 flex overflow-hidden relative">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:flex w-72 border-r border-gray-100 flex-col py-6 px-4 bg-white/50 shrink-0">
            <nav className="space-y-1 mb-8">
               <SidebarLink icon={<Home size={20}/>} label="Home Feed" active={location.pathname === '/'} onClick={() => navigate('/')} />
               <SidebarLink icon={<Search size={20}/>} label="Discover" active={location.pathname === '/discover'} onClick={() => navigate('/discover')} />
               <SidebarLink icon={<Radio size={20}/>} label="Live Flex" active={location.pathname === '/live'} onClick={() => navigate('/live')} badge="Live" />
               <SidebarLink icon={<ShoppingBag size={20}/>} label="My Orders" active={location.pathname === '/admin'} onClick={() => user ? navigate('/admin') : setIsAuthModalOpen(true)} />
            </nav>

            <div className="mt-auto">
              <div className="p-4 bg-brand/[0.03] border border-brand/5 rounded-[32px] overflow-hidden relative group">
                <div className="absolute inset-0 bg-brand/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-2">Tambayan Status</p>
                   <p className="text-[11px] font-bold text-gray-900 leading-tight">Laging Legit, Laging Safe. Tambay na!</p>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto relative w-full pb-28 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="min-h-full"
              >
                <Routes location={location}>
                  <Route path="/" element={<Feed onOrderClick={handleOrderClick} />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/activity" element={<Activity />} />
                  <Route path="/live" element={<RequireAuth user={user} loading={loading} onRequireAuth={() => setIsAuthModalOpen(true)}><Live /></RequireAuth>} />
                  <Route path="/chats" element={<RequireAuth user={user} loading={loading} onRequireAuth={() => setIsAuthModalOpen(true)}><ChatList /></RequireAuth>} />
                  <Route path="/post" element={<RequireAuth user={user} loading={loading} onRequireAuth={() => setIsAuthModalOpen(true)}><CreatePost onStartBackgroundUpload={startBackgroundUpload} /></RequireAuth>} />
                  <Route path="/post/:postId" element={<RequireAuth user={user} loading={loading} onRequireAuth={() => setIsAuthModalOpen(true)}><PostView onOrderClick={handleOrderClick} /></RequireAuth>} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
              </motion.div>
            </AnimatePresence>

            <footer className="mt-8 pt-6 pb-6 text-center text-gray-300 border-t border-gray-100 space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">DEGZ FLEX HUB &copy; 2026</p>
              <p className="text-[7px] font-bold uppercase tracking-widest opacity-60">Tambayan Hub Marketplace</p>
            </footer>
          </main>

          {/* Desktop Right Sidebar - Activity / Trending */}
          <aside className="hidden xl:flex w-80 border-l border-gray-100 flex-col p-6 bg-white shrink-0">
             <div className="mb-8">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Trending Flex</h3>
               <div className="space-y-4">
                 {['#SneakerHead', '#LegitFlex', '#CODavailable', '#TambayanVibe'].map(tag => (
                   <div key={tag} className="group cursor-pointer">
                     <p className="text-sm font-black text-gray-900 group-hover:text-brand transition-colors">{tag}</p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase">1.2k FLEXES</p>
                   </div>
                 ))}
               </div>
             </div>

             <div className="p-5 bg-black rounded-[32px] text-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-2">New Feature</p>
                <h4 className="text-lg font-black tracking-tight mb-4">Live Flex Real-time Interaction</h4>
                <button 
                  onClick={() => navigate('/live')} 
                  className="w-full bg-white text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-colors"
                >
                  Explore Now
                </button>
             </div>
          </aside>
        </div>

        {/* Background Progress UI */}
        <AnimatePresence>
          {uploadIndicator.active && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: -80, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[60] w-full max-w-xs px-4 pointer-events-none"
            >
              <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-[24px] p-3 flex items-center gap-3 shadow-2xl shadow-brand/20">
                <div className="relative w-10 h-10 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <circle 
                      cx="20" 
                      cy="20" 
                      r="18" 
                      fill="none" 
                      stroke="#FF2D55" 
                      strokeWidth="3" 
                      strokeDasharray={113} 
                      strokeDashoffset={113 - (113 * uploadIndicator.progress) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-white">{uploadIndicator.progress}%</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-[10px] uppercase tracking-widest truncate">
                    {uploadIndicator.progress === 100 ? 'Post Successful!' : 'Flexing in background...'}
                  </p>
                  <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-brand transition-all duration-300" 
                      style={{ width: `${uploadIndicator.progress}%` }} 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-0 w-full z-50">
          <BottomNav />
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setIsAuthModalOpen(false)}
      />

      <AnimatePresence>
        {isOrderModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsOrderModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Package size={32} />
              </div>
              
              <h3 className="text-xl font-black text-center mb-2 text-gray-900 tracking-tighter">COD Order Confirmation</h3>
              <p className="text-gray-500 text-center text-sm font-bold leading-relaxed mb-6">
                Your flex order request has been received. The seller will contact you for delivery details. Keep flexing!
              </p>
              
              <button 
                onClick={() => setIsOrderModalOpen(false)}
                className="btn-primary w-full shadow-brand/20 py-4"
              >
                Got it, Boss!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarLink: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick: () => void, badge?: string }> = ({ icon, label, active, onClick, badge }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group",
      active ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    )}
  >
    <div className="flex items-center gap-3">
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-white" : "text-gray-400 group-hover:text-brand")}>
        {icon}
      </span>
      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{label}</span>
    </div>
    {badge && (
      <span className={cn(
        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
        active ? "bg-white text-brand" : "bg-red-500 text-white animate-pulse"
      )}>
        {badge}
      </span>
    )}
  </button>
);

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
