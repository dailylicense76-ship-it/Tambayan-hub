import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  PlusCircle, 
  BarChart3, 
  Video, 
  Image as ImageIcon, 
  Megaphone, 
  Eye, 
  Trash2 
} from 'lucide-react';
import { firebaseService } from '../lib/firebaseService';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [adTitle, setAdTitle] = useState('');
  const [adUrl, setAdUrl] = useState('');
  const [adType, setAdType] = useState<'image' | 'video'>('image');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.currentUser) {
        const status = await firebaseService.checkIsAdmin(auth.currentUser.uid);
        if (!status) {
          alert('Access Denied. You are not an admin.');
          navigate('/');
        } else {
          setIsAdmin(true);
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await firebaseService.createPost({
        userId: auth.currentUser.uid,
        userName: 'Tambayan Admin',
        userHandle: 'admin',
        userAvatar: auth.currentUser.photoURL || '',
        mediaType: adType,
        image: adUrl,
        text: adTitle,
        commerce: {
          price: parseFloat(price) || 0,
          itemName: adTitle,
          isSelling: !!price,
          isSponsored: true
        }
      });

      alert(`Ad "${adTitle}" published to Global Feed!`);
      setAdTitle('');
      setAdUrl('');
      setPrice('');
    } catch (error) {
      console.error(error);
      alert('Failed to publish ad. Check console.');
    }
  };

  if (loading) return <div className="p-10 text-center">Checking credentials...</div>;
  if (!isAdmin) return null;

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-brand/20 rounded-2xl">
          <ShieldCheck className="text-brand" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Boss Panel</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Post as Official</p>
        </div>
      </div>

      {/* Add Ad Form */}
      <div className="glass-card p-6 mb-8 border-brand/20">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle size={20} className="text-brand" />
          <h3 className="font-bold">Inject Global Ad / Video</h3>
        </div>

        <form onSubmit={handleAddAd} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase">Content Type</label>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setAdType('image')}
                className={cn(
                  "flex-1 py-3 glass rounded-xl flex items-center justify-center gap-2 transition-all",
                  adType === 'image' ? "border-brand bg-brand/10 text-brand" : "text-white/40"
                )}
              >
                <ImageIcon size={18} /> Image
              </button>
              <button 
                type="button"
                onClick={() => setAdType('video')}
                className={cn(
                  "flex-1 py-3 glass rounded-xl flex items-center justify-center gap-2 transition-all",
                  adType === 'video' ? "border-brand bg-brand/10 text-brand" : "text-white/40"
                )}
              >
                <Video size={18} /> Video
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Ad Title / Description</label>
            <input 
              required
              value={adTitle}
              onChange={(e) => setAdTitle(e.target.value)}
              placeholder="e.g. New Year Sale - 50% Off!" 
              className="w-full glass bg-white/5 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Media URL ({adType === 'video' ? 'MP4' : 'JPG/PNG'})</label>
            <input 
              required
              value={adUrl}
              onChange={(e) => setAdUrl(e.target.value)}
              placeholder="https://..." 
              className="w-full glass bg-white/5 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Pricing (Optional)</label>
            <input 
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g 999" 
              className="w-full glass bg-white/5 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
            />
          </div>

          <button type="submit" className="w-full btn-primary mt-4 py-4 flex items-center justify-center gap-2">
            <Megaphone size={18} />
            Publish to Global Feed
          </button>
        </form>
      </div>

      <div className="p-4 glass rounded-xl border-amber-500/20 text-amber-500/80 text-xs">
        <p className="font-bold mb-1 uppercase tracking-widest">Admin Notice:</p>
        <p>To access this panel, your UID must be added to the <code>admins</code> collection in Firebase Console manually by the developer.</p>
      </div>
    </div>
  );
};
