import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Send, MoreVertical, ShieldCheck } from 'lucide-react';
import { firebaseService } from '../lib/firebaseService';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

interface ChatWindowProps {
  chatId: string;
  onBack: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, onBack }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatData, setChatData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Load messages
    const unsubscribeMessages = firebaseService.subscribeMessages(chatId, (data) => {
      setMessages(data);
    });

    // Load chat metadata (to get other participant's name/avatar)
    // We can also subscribe to the specific chat doc if needed for presence/typing
    
    return () => unsubscribeMessages();
  }, [chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      await firebaseService.sendMessage(chatId, auth.currentUser.uid, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark flex flex-col max-w-md mx-auto h-full">
      {/* Header */}
      <div className="glass p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
              <ShieldCheck size={18} className="text-brand" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tighter">Tambayan Chat</p>
              <p className="text-[10px] text-green-500 uppercase font-black tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Legit Transaction
              </p>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-white/5 rounded-full">
          <MoreVertical size={20} className="text-white/40" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <div className="text-center py-4">
          <div className="inline-block p-2 glass rounded-lg bg-brand/10 border-brand/20">
            <p className="text-[10px] uppercase font-black tracking-widest text-brand">Buyer-Seller Protection Active</p>
            <p className="text-[9px] text-white/40">Keep transactions within the hub for COD safety</p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.senderId === auth.currentUser?.uid;
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className={cn(
                  "flex",
                  isMe ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm shadow-xl",
                  isMe 
                    ? "bg-brand text-white rounded-br-none" 
                    : "glass bg-white/10 text-white rounded-bl-none"
                )}>
                  {msg.text}
                  <div className={cn(
                    "text-[9px] mt-1 opacity-50",
                    isMe ? "text-right" : "text-left"
                  )}>
                    {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 bg-[#0f172a] border-t border-white/5">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Anong masasabi mo?"
            className="flex-1 glass bg-white/5 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3 bg-brand rounded-xl shadow-lg shadow-brand/20 disabled:opacity-50 disabled:shadow-none"
          >
            <Send size={20} className="text-white" />
          </button>
        </form>
      </div>
    </div>
  );
};
