import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Users, Heart, Share2, MessageCircle, Send, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Live: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{user: string; text: string}[]>([
    {user: "lodi_cakes", text: "mine 100!"},
    {user: "degz_reseller", text: "legit ba to boss?"},
    {user: "hype_beast", text: "up up up"},
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if(inputText.trim()){
      setMessages([...messages, {user: "You", text: inputText}]);
      setInputText("");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Mock Live Video Video  */}
      <img 
        src="https://images.unsplash.com/photo-1542291026-7eec264c27ff" 
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        alt="Live Selling mockup"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      
      {/* Top Bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start z-10 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-black/40 backdrop-blur-md rounded-full p-1 pr-3 flex items-center gap-2 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center overflow-hidden border border-white/20">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=seller1" alt="Seller" className="w-full h-full object-cover"/>
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-bold text-white leading-none">Shoe Kings Ph</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[8px] font-black text-white px-1 bg-red-500 rounded uppercase tracking-widest leading-none py-0.5">Live</span>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
            <Users size={12} className="text-white drop-shadow-md" />
            <span className="text-[10px] font-black text-white tracking-widest drop-shadow-md">3.2k</span>
          </div>
        </div>

        <button onClick={() => navigate(-1)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:text-white hover:bg-black/60 transition-colors">
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
              key={i} 
              className="bg-black/40 backdrop-blur-sm rounded-xl py-1.5 px-3 max-w-[80%] border border-white/10 inline-flex flex-col"
            >
              <span className="text-[10px] font-bold text-white/50">{msg.user}</span>
              <span className="text-xs font-bold text-white shadow-black/50">{msg.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Product Card Pin */}
        <div className="bg-white/95 backdrop-blur-xl p-3 rounded-2xl flex items-center gap-3 shadow-2xl relative overflow-hidden group border border-white/20">
          <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200">
            <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff" alt="Nike" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1 text-[9px] font-black uppercase tracking-widest text-brand">
              <ShoppingBag size={10} />
              <span>Current Item</span>
            </div>
            <p className="text-xs font-black text-gray-900 leading-tight">Nike Air Max 90 "Infrared"</p>
            <p className="text-lg font-black text-brand tracking-tighter">₱6,500</p>
          </div>
          <button className="bg-black text-white px-4 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-gray-800 transition-colors shadow-xl active:scale-95">
            Mine
          </button>
        </div>

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
            <button className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-black/60 transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
