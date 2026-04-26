import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Tag, ShoppingBag, X, Check } from 'lucide-react';
import { firebaseService } from '../lib/firebaseService';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export const CreatePost: React.FC = () => {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSelling, setIsSelling] = useState(false);
  const [price, setPrice] = useState('');
  const [itemName, setItemName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!text || !imageUrl) return alert('Please add a description and image URL');

    setLoading(true);
    try {
      await firebaseService.createPost({
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        userHandle: auth.currentUser.email?.split('@')[0],
        userAvatar: auth.currentUser.photoURL,
        mediaType: 'image',
        image: imageUrl,
        text: text,
        commerce: isSelling ? {
          price: parseFloat(price),
          itemName: itemName || 'Untitled Item',
          isSelling: true
        } : null
      });
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-brand/20 rounded-xl">
          <Camera className="text-brand" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter">Flex your item</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Description</label>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Anong kuwento mo ngayon?"
            className="w-full glass bg-white/5 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand min-h-[120px] text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Image URL</label>
          <input 
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full glass bg-white/5 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
          />
          {imageUrl && (
            <div className="mt-2 rounded-xl overflow-hidden glass aspect-square">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="glass-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className={isSelling ? "text-brand" : "text-white/20"} />
              <span className="text-sm font-bold">Sell this item? (COD)</span>
            </div>
            <button 
              type="button"
              onClick={() => setIsSelling(!isSelling)}
              className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${isSelling ? 'bg-brand' : 'bg-white/10'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all ${isSelling ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {isSelling && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-4 pt-2 border-t border-white/5 overflow-hidden"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Item Name</label>
                <input 
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Nike Air Max"
                  className="w-full glass bg-white/10 p-3 rounded-lg text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Price (₱)</label>
                <input 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full glass bg-white/10 p-3 rounded-lg text-sm"
                />
              </div>
            </motion.div>
          )}
        </div>

        <button 
          disabled={loading}
          type="submit" 
          className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Posting...' : <><Check size={18} /> Post to Feed</>}
        </button>
      </form>
    </div>
  );
};
