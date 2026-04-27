import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Users, Heart, Share2, Send, ShoppingBag, Radio, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { collection, doc, addDoc, onSnapshot, setDoc, serverTimestamp, query, orderBy, limit, updateDoc, increment } from 'firebase/firestore';

export const Live: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') as 'host' | 'viewer';
  const streamId = searchParams.get('streamId');

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [viewers, setViewers] = useState(0);
  const [hostDetails, setHostDetails] = useState<any>(null);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(streamId);
  const [isInitializing, setIsInitializing] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const hasInitializedStream = useRef(false);

  const user = auth.currentUser;

  // Sync video ref with stream
  useEffect(() => {
    if (videoRef.current && localStreamRef.current && videoRef.current.srcObject !== localStreamRef.current) {
      videoRef.current.srcObject = localStreamRef.current;
      videoRef.current.play().catch(console.error);
    }
  });

  // Initialize Stream (Host or Viewer)
  useEffect(() => {
    if (!user) return;

    if (mode === 'host' && !currentStreamId && !hasInitializedStream.current) {
      hasInitializedStream.current = true;
      // Setup WebCam and Create Stream Doc
      const startHost = async () => {
        try {
          const mStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = mStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mStream;
            videoRef.current.play().catch(console.error);
          }
          
          const streamRef = doc(db, 'liveStreams', user.uid);
          await setDoc(streamRef, {
            hostId: user.uid,
            hostName: user.displayName || user.email?.split('@')[0],
            hostPhoto: user.photoURL,
            title: `${user.displayName || 'Someone'}'s Top Flex`,
            status: 'live',
            viewerCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: Date.now()
          });
          setCurrentStreamId(user.uid);
          setHostDetails({ name: user.displayName || user.email?.split('@')[0], photo: user.photoURL });
          
          // Small delay to ensure Ref is ready before setting isInitializing to false
          setTimeout(() => setIsInitializing(false), 200);

          // Heartbeat
          const heartbeatMsg = setInterval(() => {
            updateDoc(streamRef, { updatedAt: Date.now() }).catch(console.error);
          }, 10000);
          
          // @ts-ignore
          window.liveStreamHeartbeat = heartbeatMsg;
        } catch (error) {
          console.error("Camera access denied or unavailable", error);
          setErrorStatus("Camera access denied or device not found. Please check permissions and try again.");
          setIsInitializing(false);
        }
      };
      startHost();
    } else if (currentStreamId) {
      // Simulate viewers for mock/viewer mode
      setIsInitializing(false);
    }
    
    return () => {
       if (localStreamRef.current) {
         localStreamRef.current.getTracks().forEach(track => track.stop());
       }
       if (mode === 'host' && currentStreamId) {
         updateDoc(doc(db, 'liveStreams', currentStreamId), { status: 'ended' }).catch(console.error);
         // @ts-ignore
         if (window.liveStreamHeartbeat) clearInterval(window.liveStreamHeartbeat);
       }
    };
  }, [mode, user, currentStreamId, navigate]);

  // Subscribe to Stream Doc & Messages
  useEffect(() => {
    if (!currentStreamId) return;

    // Stream Details
    const unsubStream = onSnapshot(doc(db, 'liveStreams', currentStreamId), (docSnap) => {
       if (docSnap.exists()) {
          const data = docSnap.data();
          setViewers(data.viewerCount || 0);
          if (mode === 'viewer') {
            setHostDetails({ name: data.hostName, photo: data.hostPhoto });
          }
          if (data.status === 'ended') {
            alert('Live stream has ended.');
            navigate('/');
          }
       }
    }, (error) => {
      console.error("Error in stream details onSnapshot:", error);
    });

    // Chat
    const q = query(
      collection(db, 'liveStreams', currentStreamId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
      setMessages(msgs);
    }, (error) => {
      console.error("Error in messages onSnapshot:", error);
    });

    // If viewer, increment viewer count
    if (mode === 'viewer') {
      const streamRef = doc(db, 'liveStreams', currentStreamId);
      updateDoc(streamRef, { viewerCount: increment(1) }).catch(console.error);
    }

    return () => {
      unsubStream();
      unsubMessages();
      if (mode === 'viewer') {
         const streamRef = doc(db, 'liveStreams', currentStreamId);
         updateDoc(streamRef, { viewerCount: increment(-1) }).catch(console.error);
      }
    };
  }, [currentStreamId, mode, navigate]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && currentStreamId && user) {
      await addDoc(collection(db, 'liveStreams', currentStreamId, 'messages'), {
        user: user.displayName || 'Anonymous',
        userId: user.uid,
        text: inputText.trim(),
        createdAt: serverTimestamp()
      });
      setInputText("");
    }
  }

  const handleClose = async () => {
    if (mode === 'host' && currentStreamId) {
      try {
        await updateDoc(doc(db, 'liveStreams', currentStreamId), { status: 'ended' });
      } catch (err) {
        console.error("Could not close stream doc", err);
      }
    }
    navigate(-1);
  }

  if (errorStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 text-center ring-inset ring-brand ring-1">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-red-500">Live Failed</h2>
        <p className="text-gray-400 text-sm font-bold mb-10 max-w-xs">{errorStatus}</p>
        <button onClick={() => navigate(-1)} className="btn-primary w-full max-w-xs py-4">Go Back</button>
      </div>
    );
  }

  if (isInitializing && mode === 'host') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <div className="relative">
           <div className="w-24 h-24 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <Radio size={24} className="text-brand animate-pulse" />
           </div>
        </div>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-brand animate-pulse">Initializing Camera...</p>
        <p className="mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Prepping your flex session</p>
      </div>
    );
  }

  if (isInitializing && !streamId && mode !== 'host') {
    // If just /live without params, ask to host
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
         <div className="w-20 h-20 bg-brand/20 rounded-full flex items-center justify-center mb-6 border border-brand/50 animate-pulse">
           <Radio size={32} className="text-brand" />
         </div>
         <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Start a Live Flex</h2>
         <p className="text-gray-400 text-sm font-bold mb-8">Go live, flex your items, and interact with the community real-time.</p>
         <button onClick={() => navigate('/live?mode=host')} className="btn-primary px-12 py-4">Start Camera</button>
         <button onClick={() => navigate(-1)} className="mt-4 text-xs text-gray-500 font-bold hover:text-white transition-colors">Go Back</button>
       </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Video Background */}
      {mode === 'host' ? (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        // Placeholder for viewers simulating WebRTC stream
        <img 
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          alt="Live Stream"
        />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
      
      {/* Top Bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start z-10 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-black/40 backdrop-blur-md rounded-full p-1 pr-3 flex items-center gap-2 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center overflow-hidden border border-white/20">
               <img src={hostDetails?.photo || "https://api.dicebear.com/7.x/avataaars/svg?seed=seller1"} alt="Seller" className="w-full h-full object-cover"/>
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-bold text-white leading-none">{hostDetails?.name || 'Loading...'}</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[8px] font-black text-white px-1 bg-red-500 rounded uppercase tracking-widest leading-none py-0.5">Live</span>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
            <Users size={12} className="text-white drop-shadow-md" />
            <span className="text-[10px] font-black text-white tracking-widest drop-shadow-md">{viewers}</span>
          </div>
        </div>

        <button onClick={handleClose} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:text-white hover:bg-black/60 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-lg mx-auto pointer-events-none" />

      {/* Bottom Area */}
      <div className="w-full max-w-lg mx-auto p-4 z-10 flex flex-col gap-4">
        {/* Chat Stream */}
        <div className="h-64 overflow-y-auto mb-2 flex flex-col justify-end gap-2 custom-scrollbar mask-image-bottom">
          {messages.map((msg, i) => (
            <motion.div 
              initial={{opacity: 0, x: -10}} 
              animate={{opacity: 1, x: 0}} 
              key={msg.id || i} 
              className="bg-black/40 backdrop-blur-sm rounded-xl py-1.5 px-3 max-w-[80%] border border-white/10 inline-flex flex-col"
            >
              <span className="text-[10px] font-bold text-white/50">{msg.user}</span>
              <span className="text-xs font-bold text-white shadow-black/50">{msg.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Product Card Pin - Dummy for now */}
        {mode === 'viewer' && (
          <div className="bg-white/95 backdrop-blur-xl p-3 rounded-2xl flex items-center gap-3 shadow-2xl relative overflow-hidden group border border-white/20">
            <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200">
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff" alt="Nike" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1 text-[9px] font-black uppercase tracking-widest text-brand">
                <ShoppingBag size={10} />
                <span>Current Item</span>
              </div>
              <p className="text-xs font-black text-gray-900 leading-tight">Featured Flex Item</p>
              <p className="text-lg font-black text-brand tracking-tighter">Live Exclusive</p>
            </div>
            <button className="bg-black text-white px-4 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-gray-800 transition-colors shadow-xl active:scale-95">
              Mine
            </button>
          </div>
        )}

        {/* Input & Actions */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSend} className="flex-1 relative">
            <input 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Say something..." 
              className="w-full bg-black/40 backdrop-blur-md rounded-full px-4 py-3 text-sm text-white placeholder:text-white/50 border border-white/10 focus:outline-none focus:border-brand/50 transition-colors"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand rounded-full text-white hover:scale-105 transition-transform active:scale-95">
              <Send size={14} />
            </button>
          </form>
          <div className="flex items-center gap-2 shrink-0">
            <button className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-black/60 transition-colors hover:text-brand">
              <Heart size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
