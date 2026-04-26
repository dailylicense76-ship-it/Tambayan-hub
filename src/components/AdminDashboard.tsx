import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Megaphone, 
  Users,
  Lock,
  ChevronLeft,
  ShieldAlert,
  Trash2,
  CheckCircle,
  Package,
  Truck
} from 'lucide-react';
import { firebaseService } from '../lib/firebaseService';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from './Logo';

export const AdminDashboard: React.FC = () => {
  const [adTitle, setAdTitle] = useState('');
  const [adUrl, setAdUrl] = useState('');
  const [adType, setAdType] = useState<'image' | 'video'>('image');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'ads' | 'moderation' | 'orders'>('ads');
  const [reports, setReports] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
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

  useEffect(() => {
    if (!isAdmin) return;

    const unsubReports = firebaseService.subscribeReports((data) => {
      setReports(data);
    });

    const unsubOrders = firebaseService.subscribeAllOrders((data) => {
      setOrders(data);
    });

    return () => {
      unsubReports();
      unsubOrders();
    };
  }, [isAdmin]);

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

  const handleResolveReport = async (reportId: string) => {
    try {
      await firebaseService.resolveReport(reportId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemovePost = async (reportId: string, postId: string) => {
    if (window.confirm('Sigurado ka bang buburahin itong post?')) {
      try {
        await firebaseService.deletePost(postId);
        await firebaseService.resolveReport(reportId);
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-brand font-black uppercase">Checking credentials...</div>;
  if (!isAdmin) return null;

  return (
    <div className="pb-24 px-4 pt-6 bg-white min-h-screen text-gray-900">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="p-2 hover:bg-brand/5 rounded-full text-brand transition-colors">
            <ChevronLeft />
          </Link>
          <Logo size="md" />
        </div>
        <div className="flex items-center gap-2 glass bg-brand/5 px-3 py-1.5 rounded-full border-brand/20">
          <ShieldCheck size={14} className="text-brand" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand">Boss Level</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-6 border-brand/20 bg-brand/[0.02]">
          <div className="flex items-center gap-3 mb-4">
            <Package className="text-brand" size={18} />
            <h3 className="font-black uppercase tracking-widest text-[10px]">Sales Volume</h3>
          </div>
          <p className="text-3xl font-black tracking-tighter text-gray-900">
            ₱{orders.reduce((sum, o) => sum + (o.price || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="glass-card p-6 border-red-500/20 bg-red-500/[0.02]">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="text-red-500" size={18} />
            <h3 className="font-black uppercase tracking-widest text-[10px]">Reports pending</h3>
          </div>
          <p className="text-3xl font-black tracking-tighter text-red-500">
            {reports.length}
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-8 glass bg-gray-50 p-1 rounded-2xl">
        <button 
          onClick={() => setActiveTab('ads')}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'ads' ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-gray-400 hover:text-gray-600"
          )}
        >
          Ads
        </button>
        <button 
          onClick={() => setActiveTab('moderation')}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            activeTab === 'moderation' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-gray-400 hover:text-gray-600"
          )}
        >
          Moderation {reports.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'orders' ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-gray-400 hover:text-gray-600"
          )}
        >
          Orders
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'ads' && (
          <motion.div 
            key="ads"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 border-brand/10"
          >
            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="text-brand" size={20} />
              <h3 className="font-black uppercase tracking-widest text-xs">Create Global Ad</h3>
            </div>
            
            <form onSubmit={handleAddAd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ad Title</label>
                <input 
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="Promo Headline..." 
                  className="w-full glass bg-gray-50 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset URL</label>
                <input 
                  value={adUrl}
                  onChange={(e) => setAdUrl(e.target.value)}
                  placeholder="https://..." 
                  className="w-full glass bg-gray-50 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Media</label>
                  <select 
                    value={adType}
                    onChange={(e) => setAdType(e.target.value as 'image' | 'video')}
                    className="w-full glass bg-gray-100 p-4 rounded-xl focus:outline-none text-sm font-bold"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price Label</label>
                  <input 
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="₱ 0" 
                    className="w-full glass bg-gray-50 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                  />
                </div>
              </div>

              <button type="submit" className="w-full btn-primary mt-4 py-5">
                Publish to Tambayan
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === 'moderation' && (
          <motion.div 
            key="mod"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {reports.length === 0 ? (
              <div className="glass-card p-12 text-center border-dashed bg-gray-50">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-500" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Malinis ang Tambayan</p>
                <p className="text-[10px] text-gray-300 mt-1 uppercase">No pending reports for today</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="glass-card p-5 border-red-500/10">
                  <div className="flex gap-5">
                    <img src={report.postContent?.image} className="w-24 h-24 rounded-2xl object-cover bg-gray-100" alt="" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-tighter mb-1">Violation Report</p>
                          <h4 className="font-bold text-gray-900 leading-tight">@{report.postContent?.userHandle}</h4>
                          <p className="text-[10px] text-gray-400 italic">" {report.postContent?.text} "</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase bg-red-100 text-red-600 px-3 py-1 rounded-full">
                            {report.reason}
                          </span>
                          <p className="text-[9px] text-gray-400 mt-2 uppercase font-bold">
                            By User {report.reporterId.slice(0, 5)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRemovePost(report.id, report.postId)}
                          className="flex-1 btn-primary bg-red-500 hover:bg-red-600 text-[9px] py-2.5 rounded-xl shadow-red-500/10"
                        >
                          <Trash2 size={12} className="inline mr-1" /> Remove Post
                        </button>
                        <button 
                          onClick={() => handleResolveReport(report.id)}
                          className="flex-1 btn-secondary text-gray-400 border-gray-200 hover:bg-gray-50 text-[9px] py-2.5 rounded-xl"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="bg-brand/5 p-4 rounded-2xl mb-4">
               <p className="text-[10px] font-black uppercase text-brand tracking-widest mb-1 flex items-center gap-2">
                 <Truck size={12} /> Fulfillment Queue
               </p>
               <p className="text-[9px] text-brand/60 uppercase">Admins monitor COD success rates for platform integrity</p>
            </div>
            
            {orders.map((order) => (
              <div key={order.id} className="glass-card p-4 flex justify-between items-center bg-white">
                <div>
                  <h4 className="font-black text-gray-900 uppercase text-[12px]">{order.itemName}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    ₱{order.price?.toLocaleString()} • {order.buyerName}
                  </p>
                </div>
                <div className="text-right">
                   <span className="text-[10px] font-black px-3 py-1 rounded-full bg-brand/10 text-brand uppercase italic">
                     {order.status}
                   </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12 p-6 glass rounded-2xl border-brand/5 bg-brand/[0.01] text-gray-300 text-[10px]">
        <p className="font-black mb-1 uppercase tracking-widest flex items-center gap-1 text-brand/40">
          <Lock size={12} /> System Authenticated
        </p>
        <p className="font-bold">SESSION_ID: {auth.currentUser?.uid.slice(0, 16)}</p>
        <p className="font-bold uppercase tracking-tighter">Enterprise Moderation Suite v4.0</p>
      </div>
    </div>
  );
};
