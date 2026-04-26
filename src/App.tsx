import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
    useEffect(() => {
      if (!user && !loading) {
        setIsAuthModalOpen(true);
      }
    }, [user, loading]);

    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
          <p className="text-white/40 mb-4 tracking-widest text-xs uppercase font-bold">Sign in to access this page</p>
          <button onClick={() => setIsAuthModalOpen(true)} className="btn-primary">Sign In</button>
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

      {/* Mobile Wrapper */}
      <div className="w-full max-w-[480px] min-h-screen glass-card shadow-brand/10 border-x border-white/5 relative overflow-hidden flex flex-col">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto hide-scrollbar">
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
        </main>

        <footer className="mt-20 p-8 text-center text-white/10 border-t border-white/5 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[.3em] font-mono">&copy; 2026 DEGZ ENTERPRISES</p>
          <p className="text-[8px] font-bold uppercase tracking-widest">Licensed to Tambayan Hub Marketplace</p>
        </footer>

        <BottomNav />
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
