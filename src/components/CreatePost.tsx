import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Tag, ShoppingBag, X, Check, Upload, Play, Film, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { firebaseService } from '../lib/firebaseService';
import { geminiService } from '../services/geminiService';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export const CreatePost: React.FC<{ onStartBackgroundUpload?: (file: File, postData: any) => void }> = ({ onStartBackgroundUpload }) => {
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
    if (!auth.currentUser) return alert('Please log in to share a flex!');
    if (!text || !file) return alert('Please add a description and select a photo or video');

    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    const postPayload: any = {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Legit Seller',
      userHandle: auth.currentUser.email?.split('@')[0],
      userAvatar: auth.currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser.uid}`,
      mediaType,
      text: text,
      createdAt: new Date().toISOString(),
    };

    if (isSelling) {
      postPayload.commerce = {
        price: parseFloat(price) || 0,
        itemName: itemName || 'Untitled Item',
        isSelling: true
      };
    }

    if (onStartBackgroundUpload) {
      onStartBackgroundUpload(file, postPayload);
      navigate('/');
      return;
    }

    // Fallback if no bg handler
    setLoading(true);
    setUploadProgress(0);
    try {
      const downloadUrl = await firebaseService.uploadFile(file, 'posts', (progress) => {
        setUploadProgress(Math.round(progress));
      });
      await firebaseService.createPost({ ...postPayload, image: downloadUrl });
      navigate('/');
    } catch (error) {
      alert('Failed to post');
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
              "relative w-full h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2 group",
              previewUrl ? "border-brand border-solid h-auto max-h-64" : "border-gray-300 bg-gray-50/50 hover:bg-gray-50 hover:border-brand/50"
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
                   <video src={previewUrl} className="w-full h-64 object-contain bg-black" muted loop autoPlay />
                ) : (
                  <img src={previewUrl} className="w-full h-64 object-contain bg-gray-100" alt="Preview" />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl text-gray-900 flex items-center gap-2">
                    <Upload size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Change Media</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center flex flex-col items-center justify-center h-full w-full">
                <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Film size={20} className="text-brand" />
                </div>
                <p className="text-[12px] font-bold text-gray-700 capitalize">Upload Photo/Video</p>
              </div>
            )}
          </div>
        </div>

        {/* Text/Desc Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Say something about your flex</label>
            <button 
              type="button"
              onClick={async () => {
                const aiCaption = await geminiService.generateCaption(text);
                setText(aiCaption);
              }}
              className="flex items-center gap-1.5 text-[10px] font-black text-brand uppercase tracking-widest hover:opacity-70 transition-opacity bg-brand/5 px-3 py-1.5 rounded-xl border border-brand/10"
            >
              <Sparkles size={12} />
              AI Flex Help
            </button>
          </div>
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
          {loading && (
            <div 
              className="absolute inset-0 bg-black/10 transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }} 
            />
          )}
          {loading ? (
            <div className="flex items-center gap-2 relative z-10">
              <Loader2 className="animate-spin" size={18} />
              <span>{uploadProgress < 100 ? `Uploading ${uploadProgress}%...` : 'Finishing...'}</span>
            </div>
          ) : (
            <>
              <Check size={20} strokeWidth={3} className="relative z-10" />
              <span className="relative z-10">Post to Feed</span>
            </>
          )}
        </button>
      </form>

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-xs bg-white rounded-[32px] p-8 shadow-2xl flex flex-col items-center justify-center gap-4 border border-gray-100">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-gray-100 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                  <circle 
                    className="text-brand stroke-current transition-all duration-300 ease-out" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    strokeDasharray={251.2} 
                    strokeDashoffset={251.2 - (251.2 * uploadProgress) / 100}
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-gray-900">{uploadProgress}%</span>
                </div>
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tighter">
                {uploadProgress < 10 ? 'Initializing...' : uploadProgress > 90 ? 'Finishing Up...' : 'Uploading Flex...'}
              </h3>
              <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-widest leading-relaxed">
                Please don't close or switch tabs while we process your post.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
