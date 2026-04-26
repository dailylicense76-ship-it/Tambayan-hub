import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
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
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase';
import { AlertCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

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

  const handleOrderClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      // In a real app, this would show the COD Order Form
      alert('Coming Soon: COD Order Confirmation for ' + user.displayName);
    }
  };

  const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);

    useEffect(() => {
      if (!user && !loading && !hasAttemptedAuth) {
        setIsAuthModalOpen(true);
        setHasAttemptedAuth(true);
      }
    }, [user, loading, hasAttemptedAuth]);

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
            onClick={() => setIsAuthModalOpen(true)} 
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
      <div className="w-full h-[100dvh] md:h-[calc(100vh-2rem)] bg-white shadow-2xl relative flex flex-col md:max-w-[420px] mx-auto md:my-4 md:rounded-[40px] md:border-[8px] border-gray-900 overflow-hidden">
        <div className="flex-shrink-0 z-50 w-full relative bg-white">
          <Navbar onAuthClick={() => setIsAuthModalOpen(true)} />
        </div>
        
        <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#f0f0f2]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes location={location}>
                <Route path="/" element={<Feed onOrderClick={handleOrderClick} />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/chats" element={<RequireAuth><ChatList /></RequireAuth>} />
                <Route path="/post" element={<RequireAuth><CreatePost /></RequireAuth>} />
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

        <div className="flex-shrink-0 w-full z-50">
          <BottomNav />
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
