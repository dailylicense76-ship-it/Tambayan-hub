import React, { useState } from 'react';
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
import { cn } from '../lib/utils';

export const AdminDashboard: React.FC = () => {
  const [adTitle, setAdTitle] = useState('');
  const [adUrl, setAdUrl] = useState('');
  const [adType, setAdType] = useState<'image' | 'video'>('image');
  const [price, setPrice] = useState('');

  const stats = [
    { label: 'Total Users', value: '1,284', icon: <BarChart3 className="text-blue-400" /> },
    { label: 'Active Ads', value: '12', icon: <Megaphone className="text-amber-400" /> },
    { label: 'Daily Revenue', value: '₱42,500', icon: <ShieldCheck className="text-green-400" /> },
  ];

  const handleAddAd = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Ad "${adTitle}" (${adType}) added to Global Feed!`);
    setAdTitle('');
    setAdUrl('');
    setPrice('');
  };

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-brand/20 rounded-2xl">
          <ShieldCheck className="text-brand" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Boss Panel</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Admin Control Center</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="glass-card p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              {stat.icon}
            </div>
          </motion.div>
        ))}
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g ₱999" 
              className="w-full glass bg-white/5 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
            />
          </div>

          <button type="submit" className="w-full btn-primary mt-4 py-4 flex items-center justify-center gap-2">
            <Megaphone size={18} />
            Publish Ads to Global Feed
          </button>
        </form>
      </div>

      {/* Manage Existing Posts */}
      <h3 className="font-bold mb-4 px-2">Active Advertisements</h3>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="glass-card p-3 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/5 rounded-lg shrink-0 overflow-hidden">
               <div className="w-full h-full flex items-center justify-center">
                 {i === 1 ? <Video size={20} className="text-white/20" /> : <ImageIcon size={20} className="text-white/20" /> }
               </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Featured Gadget {i}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-[10px] text-white/40"><Eye size={10} /> 1.2k</span>
                <span className="text-[10px] text-brand uppercase font-black italic">Active</span>
              </div>
            </div>
            <button className="p-2 text-white/20 hover:text-red-500 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
