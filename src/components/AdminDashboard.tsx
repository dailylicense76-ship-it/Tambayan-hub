import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Megaphone, 
  Image as ImageIcon, 
  Video, 
  BarChart3, 
  Users,
  Eye, 
  Trash2,
  Lock,
  UserCheck
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
  const [activeTab, setActiveTab] = useState<'ads' | 'users'>('ads');
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
        <div className="p-3 bg-brand rounded-2xl shadow-lg shadow-brand/40">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Boss Panel</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Admin Control Center</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 glass p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('ads')}
          className={cn(
            "flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'ads' ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-white/40 hover:text-white/60"
          )}
        >
          Manage Ads
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={cn(
            "flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'users' ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-white/40 hover:text-white/60"
          )}
        >
          Manage Users
        </button>
      </div>

      {activeTab === 'ads' ? (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Megaphone className="text-brand" size={20} />
            <h3 className="font-bold uppercase tracking-widest text-sm">Create Official Ad</h3>
          </div>
          
          <form onSubmit={handleAddAd} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Ad Headline</label>
              <input 
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="e.g. Free Shipping this Weekend!" 
                className="w-full glass bg-white/5 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Asset URL</label>
              <input 
                value={adUrl}
                onChange={(e) => setAdUrl(e.target.value)}
                placeholder="https://..." 
                className="w-full glass bg-white/5 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Type</label>
                <select 
                   value={adType}
                   onChange={(e) => setAdType(e.target.value as 'image' | 'video')}
                   className="w-full glass bg-white/10 p-4 rounded-xl focus:outline-none text-sm appearance-none"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
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
            </div>

            <button type="submit" className="w-full btn-primary mt-4 py-4 flex items-center justify-center gap-2">
              <Megaphone size={18} />
              Publish to Global Feed
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="text-brand" size={20} />
              <h3 className="font-bold uppercase tracking-widest text-sm">User Management</h3>
            </div>
            
            <div className="space-y-3">
               <div className="p-4 glass rounded-xl border-amber-500/20 text-amber-500/80 text-[10px] mb-4">
                <p className="font-bold mb-1 uppercase tracking-widest flex items-center gap-2"><Lock size={12} /> Security Protocol:</p>
                <p>Firebase client SDKs cannot list all users for security. Use the Firebase Console to manage your <strong>admins</strong> collection and auth users.</p>
              </div>

              <div className="flex items-center justify-between p-3 glass bg-white/5 rounded-xl">
                 <div className="flex items-center gap-3">
                   <img src={auth.currentUser?.photoURL || ''} className="w-8 h-8 rounded-full" alt="" />
                   <div>
                     <p className="text-xs font-bold uppercase tracking-widest">Current Admin</p>
                     <p className="text-[10px] text-white/40">{auth.currentUser?.email}</p>
                   </div>
                 </div>
                 <div className="p-1 px-2 bg-green-500/20 text-green-500 rounded text-[10px] font-bold uppercase tracking-tighter">Verified</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 glass rounded-xl border-white/5 text-white/20 text-[10px]">
        <p className="font-bold mb-1 uppercase tracking-widest flex items-center gap-2">System Log:</p>
        <p>UID: {auth.currentUser?.uid}</p>
        <p>Database: Enterprise Cluster (asia-southeast1)</p>
      </div>
    </div>
  );
};
