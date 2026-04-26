import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Tag, ShoppingBag, X, Check, Upload, Play, Film, AlertCircle, Loader2 } from 'lucide-react';
import { firebaseService } from '../lib/firebaseService';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export const CreatePost: React.FC = () => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSelling, setIsSelling] = useState(false);
  const [price, setPrice] = useState('');
  const [itemName, setItemName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!text || !file) return alert('Please add a description and select a photo or video');

    setLoading(true);
    try {
      // 1. Upload File
      const downloadUrl = await firebaseService.uploadFile(file);
      
      // 2. Create Post
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      await firebaseService.createPost({
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        userHandle: auth.currentUser.email?.split('@')[0],
        userAvatar: auth.currentUser.photoURL,
        mediaType,
        image: downloadUrl,
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
      alert('Failed to post. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-24 bg-white min-h-screen text-gray-900">
      <div className="flex items-center gap-3 mb-10">
        <div className="p-2.5 bg-brand/[0.03] border border-brand/5 rounded-2xl shadow-sm">
          <Camera className="text-brand" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Flex New Item</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Share your legit flex</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Media Upload Area */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Gallery Content</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative aspect-[4/5] rounded-[32px] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-4 group",
              previewUrl ? "border-brand border-solid" : "border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-brand/20"
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />

            {previewUrl ? (
              <>
                {file?.type.startsWith('video/') ? (
                   <video src={previewUrl} className="w-full h-full object-cover" muted loop autoPlay />
                ) : (
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl text-gray-900 flex items-center gap-2">
                    <Upload size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Change Media</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Film size={28} className="text-brand" />
                </div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Tap to Upload</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Photos or Videos (Max 10MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* Text/Desc Area */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Say something about your flex</label>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Kwento mo na 'yan, lods!"
            className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand min-h-[120px] text-sm font-bold placeholder:text-gray-300 resize-none"
          />
        </div>

        {/* Marketplace Toggle */}
        <div className={cn(
          "p-6 rounded-[32px] transition-all",
          isSelling ? "bg-brand/[0.03] border border-brand/10" : "bg-gray-50 border border-gray-100"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl", isSelling ? "bg-brand text-white" : "bg-gray-200 text-gray-400")}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <span className="text-sm font-black text-gray-900 uppercase tracking-tight">I-tinda ito?</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mt-0.5">List on Legit Marketplace</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIsSelling(!isSelling)}
              className={cn(
                "w-14 h-8 rounded-full transition-all flex items-center px-1.5",
                isSelling ? 'bg-brand' : 'bg-gray-200'
              )}
            >
              <motion.div 
                animate={{ x: isSelling ? 18 : 0 }}
                className="w-5 h-5 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>

          <AnimatePresence>
            {isSelling && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-5 pt-6 mt-6 border-t border-brand/10 overflow-hidden"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Legit Item Name</label>
                  <input 
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Jordan 1 Retro High"
                    className="w-full bg-white border border-brand/10 p-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Presyong Kaibigan (₱)</label>
                  <input 
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border border-brand/10 p-4 rounded-xl text-sm font-black text-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit */}
        <button 
          disabled={loading || !file || !text}
          type="submit" 
          className="w-full btn-primary py-5 flex items-center justify-center gap-3 disabled:opacity-50 shadow-brand/20 relative overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              <span>Posting Real Flex...</span>
            </div>
          ) : (
            <>
              <Check size={20} strokeWidth={3} />
              Post to Feed
            </>
          )}
        </button>
      </form>
    </div>
  );
};
