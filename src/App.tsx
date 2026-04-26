import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Feed } from './components/Feed';
import { Profile } from './components/Profile';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { CanvasBackground } from './components/CanvasBackground';

const AppContent: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  const handleOrderClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else {
      // In a real app, this would show the COD Order Form
      alert('Order Form logic goes here! (Authenticated)');
    }
  };

  const handleAuthSuccess = (provider: string) => {
    console.log(`Authenticated with ${provider}`);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
  };

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
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={
                  <div className="flex flex-col items-center justify-center h-[60vh] text-white/20">
                    <p className="text-4xl font-black italic">W.I.P</p>
                    <p className="text-sm">Page under construction</p>
                  </div>
                } />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav />
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess}
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
