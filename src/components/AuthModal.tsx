import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Facebook } from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { firebaseService } from '../lib/firebaseService';
import { Logo } from './Logo';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credential: UserCredential) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'select' | 'email' | 'phone'>('select');
  const [isSignUp, setIsSignUp] = React.useState(false);
  
  // Email state
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  // Phone state
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [confirmationResult, setConfirmationResult] = React.useState<any>(null);

  React.useEffect(() => {
    // Reset state when modal closes
    if (!isOpen) {
      setAuthMode('select');
      setEmail('');
      setPassword('');
      setPhoneNumber('');
      setVerificationCode('');
      setConfirmationResult(null);
    }
  }, [isOpen]);

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    if (loading) return;
    setLoading(true);
    try {
      let result: UserCredential;
      if (provider === 'google') {
        const googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({ prompt: 'select_account' });
        result = await signInWithPopup(auth, googleProvider);
      } else {
        const facebookProvider = new FacebookAuthProvider();
        result = await signInWithPopup(auth, facebookProvider);
      }
      
      await saveProfile(result.user);
      onSuccess(result);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      let result: UserCredential;
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      await saveProfile(result.user);
      onSuccess(result);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      setupRecaptcha();
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+63${phoneNumber.replace(/^0/, '')}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, (window as any).recaptchaVerifier);
      setConfirmationResult(confirmation);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !confirmationResult) return;
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      await saveProfile(result.user);
      onSuccess(result);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (userResult: any) => {
    await firebaseService.saveUserProfile({
      uid: userResult.uid,
      email: userResult.email,
      displayName: userResult.displayName || `user_${userResult.uid.slice(0, 5)}`,
      photoURL: userResult.photoURL,
      handle: userResult.email?.split('@')[0] || `user_${userResult.uid.slice(0, 5)}`,
      createdAt: new Date().toISOString()
    });
  };

  const handleAuthError = (error: any) => {
    console.error('Auth Error:', error);
    if (error.code === 'auth/unauthorized-domain') {
      alert('Unauthorized Domain: Please add this domain to your Firebase Console.');
    } else if (error.code !== 'auth/popup-closed-by-user') {
      alert(`Authentication failed: ${error.message || 'Unknown error'}.`);
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
            className={cn(
              "fixed inset-0 m-auto w-full max-w-sm h-fit z-[60] glass-card p-8 flex flex-col items-center bg-white border-brand/10 shadow-2xl transition-all",
              loading && "opacity-80 pointer-events-none"
            )}
          >
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-brand transition-all p-3 z-[80] bg-gray-100/50 hover:bg-gray-100 rounded-2xl flex items-center gap-2 group"
              aria-label="Close modal"
            >
              <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Close</span>
              <X size={20} strokeWidth={3} />
            </button>

            <Logo size="lg" className={cn("mb-6", loading && "animate-pulse")} />

            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
              {loading ? "Sandalang Flex..." : "Tuloy Po Kayo!"}
            </h2>
            <p className="text-center text-gray-400 text-sm mb-8 font-bold">
              {loading ? "Inaayos lang namin profile mo, lods." : "Join the community. Log in to place your order and track your flex."}
            </p>

            <div className="w-full space-y-3 relative overflow-hidden">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
                  <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              <AnimatePresence mode="wait">
                {authMode === 'select' && (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3 w-full"
                  >
                    <button 
                      onClick={() => handleSocialLogin('google')}
                      disabled={loading}
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
                      onClick={() => handleSocialLogin('facebook')}
                      disabled={loading}
                      className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 flex items-center justify-center gap-3 py-4 rounded-xl transition-all shadow-md shadow-[#1877F2]/20"
                    >
                      <Facebook size={20} fill="white" className="text-white" />
                      <span className="text-sm font-black uppercase tracking-widest text-white">Continue with Facebook</span>
                    </button>

                    <div className="h-px bg-gray-100 w-full my-4 relative">
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] font-black uppercase text-gray-300">OR</span>
                    </div>

                    <button 
                      onClick={() => setAuthMode('email')}
                      disabled={loading}
                      className="w-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-3 py-4 rounded-xl transition-all"
                    >
                      <Mail size={20} className="text-gray-500" />
                      <span className="text-sm font-black uppercase tracking-widest text-gray-600">Email Login</span>
                    </button>
                    
                    <button 
                      onClick={() => setAuthMode('phone')}
                      disabled={loading}
                      className="w-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-3 py-4 rounded-xl transition-all"
                    >
                      <span className="text-xl">📱</span>
                      <span className="text-sm font-black uppercase tracking-widest text-gray-600">Phone Login</span>
                    </button>
                  </motion.div>
                )}

                {authMode === 'email' && (
                  <motion.form
                    key="email"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleEmailAuth}
                    className="space-y-4 w-full"
                  >
                    <div>
                      <input 
                        type="email" 
                        required
                        placeholder="Email Address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <input 
                        type="password" 
                        required
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand text-white flex items-center justify-center py-4 rounded-xl transition-all shadow-md shadow-brand/20 text-sm font-black uppercase tracking-widest hover:opacity-90"
                    >
                      {isSignUp ? 'Sign Up' : 'Log In'}
                    </button>
                    <div className="flex justify-between items-center px-1">
                      <button 
                        type="button" 
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-[10px] font-bold text-gray-400 hover:text-brand uppercase"
                      >
                        {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setAuthMode('select')}
                        className="text-[10px] font-bold text-gray-400 hover:text-brand uppercase"
                      >
                        Back
                      </button>
                    </div>
                  </motion.form>
                )}

                {authMode === 'phone' && (
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4 w-full"
                  >
                    {!confirmationResult ? (
                      <form onSubmit={handleSendPhoneCode} className="space-y-4">
                        <div>
                          <input 
                            type="tel" 
                            required
                            placeholder="Phone Number (e.g. 0912...)"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand"
                          />
                        </div>
                        <div id="recaptcha-container"></div>
                        <button 
                          type="submit"
                          disabled={loading || phoneNumber.length < 10}
                          className="w-full bg-brand text-white flex items-center justify-center py-4 rounded-xl transition-all shadow-md shadow-brand/20 text-sm font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
                        >
                          Send Code
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyPhoneCode} className="space-y-4">
                        <div>
                          <input 
                            type="text" 
                            required
                            placeholder="6-digit code"
                            value={verificationCode}
                            onChange={e => setVerificationCode(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand tracking-widest text-center"
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={loading || verificationCode.length < 6}
                          className="w-full bg-brand text-white flex items-center justify-center py-4 rounded-xl transition-all shadow-md shadow-brand/20 text-sm font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
                        >
                          Verify Code
                        </button>
                      </form>
                    )}
                    
                    <div className="flex justify-end px-1">
                      <button 
                        type="button" 
                        onClick={() => { setAuthMode('select'); setConfirmationResult(null); }}
                        className="text-[10px] font-bold text-gray-400 hover:text-brand uppercase"
                      >
                        Back
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
