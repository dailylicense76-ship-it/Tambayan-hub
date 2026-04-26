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
import { Logo } from './Logo';

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
            className="fixed inset-0 m-auto w-full max-w-sm h-fit z-[60] glass-card p-8 flex flex-col items-center bg-white border-brand/10 shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-brand transition-colors">
              <X size={24} />
            </button>

            <Logo size="lg" className="mb-6" />

            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Tuloy Po Kayo!</h2>
            <p className="text-center text-gray-400 text-sm mb-8 font-bold">
              Join the community. Log in to place your order and track your flex.
            </p>

            <div className="w-full space-y-3">
              <button 
                onClick={() => handleLogin('google')}
                className="w-full bg-white border border-gray-100 shadow-sm hover:bg-gray-50 flex items-center justify-center gap-3 py-4 rounded-xl transition-all"
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  className="w-5 h-5" 
                  referrerPolicy="no-referrer"
                />
                <span className="text-sm font-black uppercase tracking-widest text-gray-700">Continue with Google</span>
              </button>
              
              <button 
                onClick={() => handleLogin('facebook')}
                className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 flex items-center justify-center gap-3 py-4 rounded-xl transition-all shadow-md shadow-[#1877F2]/20"
              >
                <Facebook size={20} fill="white" className="text-white" />
                <span className="text-sm font-black uppercase tracking-widest text-white">Continue with Facebook</span>
              </button>

              <button 
                disabled
                className="w-full bg-gray-50 opacity-50 flex items-center justify-center gap-3 py-4 rounded-xl transition-all cursor-not-allowed"
              >
                <Mail size={20} className="text-gray-300" />
                <span className="text-sm font-black uppercase tracking-widest text-gray-300">Email Login (Soon)</span>
              </button>
            </div>

            <p className="mt-8 text-[10px] text-gray-300 text-center px-4 font-bold uppercase tracking-widest leading-relaxed">
              Degz Enterprises &copy; 2024<br/>
              By continuing, you agree to our Terms.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
