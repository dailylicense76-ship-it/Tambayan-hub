import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Facebook, Github } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (provider: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-sm h-fit z-[60] glass-card p-8 flex flex-col items-center"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
              <X size={24} />
            </button>

            <div className="w-16 h-16 bg-brand/20 rounded-2xl flex items-center justify-center mb-6">
              <div className="w-8 h-8 bg-brand rounded-lg shadow-lg shadow-brand/40" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Welcome to Tambayan</h2>
            <p className="text-center text-white/60 text-sm mb-8">
              Join the marketplace. Log in to place your order and track your flex.
            </p>

            <div className="w-full space-y-3">
              <button 
                onClick={() => onSuccess('Google')}
                className="w-full glass hover:bg-white/10 flex items-center justify-center gap-3 py-3 rounded-xl transition-all"
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  className="w-5 h-5" 
                  referrerPolicy="no-referrer"
                />
                Continue with Google
              </button>
              
              <button 
                onClick={() => onSuccess('Facebook')}
                className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 flex items-center justify-center gap-3 py-3 rounded-xl transition-all"
              >
                <Facebook size={20} fill="white" />
                Continue with Facebook
              </button>

              <button 
                onClick={() => onSuccess('Email')}
                className="w-full glass hover:bg-white/10 flex items-center justify-center gap-3 py-3 rounded-xl transition-all"
              >
                <Mail size={20} />
                Continue with Email
              </button>
            </div>

            <p className="mt-8 text-[11px] text-white/30 text-center px-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
