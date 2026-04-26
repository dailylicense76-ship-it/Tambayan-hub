import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Facebook } from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  UserCredential
} from 'firebase/auth';
import { firebaseService } from '../lib/firebaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credential: UserCredential) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const handleLogin = async (provider: 'google' | 'facebook' | 'email') => {
    try {
      let result: UserCredential;
      if (provider === 'google') {
        const googleProvider = new GoogleAuthProvider();
        result = await signInWithPopup(auth, googleProvider);
      } else if (provider === 'facebook') {
        const facebookProvider = new FacebookAuthProvider();
        result = await signInWithPopup(auth, facebookProvider);
      } else {
        // Email login logic could go here if needed
        return;
      }

      // Initialize user profile in Firestore
      await firebaseService.saveUserProfile({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        handle: result.user.email?.split('@')[0] || `user_${result.user.uid.slice(0, 5)}`,
        createdAt: new Date().toISOString()
      });

      onSuccess(result);
    } catch (error) {
      console.error('Login Error:', error);
      alert('Login failed. Please try again.');
    }
  };

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
                onClick={() => handleLogin('google')}
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
                onClick={() => handleLogin('facebook')}
                className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 flex items-center justify-center gap-3 py-3 rounded-xl transition-all"
              >
                <Facebook size={20} fill="white" />
                Continue with Facebook
              </button>

              <button 
                disabled
                className="w-full glass opacity-50 flex items-center justify-center gap-3 py-3 rounded-xl transition-all cursor-not-allowed"
              >
                <Mail size={20} />
                Continue with Email (Coming Soon)
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
