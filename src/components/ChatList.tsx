import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Search, User, ChevronRight } from 'lucide-react';
import { firebaseService } from '../lib/firebaseService';
import { auth } from '../lib/firebase';
import { ChatWindow } from './ChatWindow';

export const ChatList: React.FC = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = firebaseService.subscribeChats(user.uid, (data) => {
      setChats(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (selectedChatId) {
    return <ChatWindow chatId={selectedChatId} onBack={() => setSelectedChatId(null)} />;
  }

  return (
    <div className="p-6 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-brand/20 rounded-xl">
          <MessageSquare className="text-brand" size={24} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter">Messages</h2>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
        <input 
          placeholder="Mag-hanap ng ka-tambayan..."
          className="w-full glass bg-white/5 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 opacity-20 text-xs uppercase tracking-widest">Loading Chats...</div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-white/20">
             <MessageSquare size={48} className="mb-4 opacity-10" />
             <p className="text-sm font-bold uppercase tracking-widest">Walang Message</p>
             <p className="text-xs">Umpisahan mong mag-flex at mag-message sa iba!</p>
          </div>
        ) : (
          chats.map((chat) => {
            const otherUserId = chat.participants.find((p: string) => p !== auth.currentUser?.uid);
            const otherUser = chat.participantData?.[otherUserId];
            
            return (
              <motion.div 
                key={chat.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedChatId(chat.id)}
                className="glass-card p-4 flex gap-4 items-center cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="relative">
                  <img src={otherUser?.photoURL || ''} className="w-12 h-12 rounded-full object-cover border border-white/10" alt="" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-sm truncate">{otherUser?.displayName || 'Ka-Tambayan'}</h3>
                    <span className="text-[10px] text-white/20">
                      {chat.updatedAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 truncate italic">{chat.lastMessage || 'Start a conversation'}</p>
                </div>
                <ChevronRight size={16} className="text-white/10" />
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
