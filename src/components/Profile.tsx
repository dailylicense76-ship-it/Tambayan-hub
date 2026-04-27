import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Grid, CheckCircle2, Truck, AlertCircle, ShieldCheck, LogOut, Users, Coins, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { firebaseService } from '../lib/firebaseService';
import { cn } from '../lib/utils';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'flex' | 'orders'>('flex');
  const [orders, setOrders] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ following: 0, followers: 0 });
  const [coins, setCoins] = useState(0);
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      const fetchedOrders = await firebaseService.getOrders(user.uid, true);
      setOrders(fetchedOrders || []);
      
      const adminStatus = await firebaseService.checkIsAdmin(user.uid);
      setIsAdmin(!!adminStatus);

      // Fetch follow stats
      const followingQuery = query(collection(db, 'follows'), where('followerId', '==', user.uid));
      const followersQuery = query(collection(db, 'follows'), where('followingId', '==', user.uid));
      
      const [followingSnap, followersSnap] = await Promise.all([
        getDocs(followingQuery),
        getDocs(followersQuery)
      ]);
      
      setStats({
        following: followingSnap.size,
        followers: followersSnap.size
      });
    };

    const unsubWallet = firebaseService.subscribeWallet(user.uid, setCoins);

    loadData();

    return () => unsubWallet();
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleTopUp = async () => {
    if (!user) return;
    const amount = parseInt(prompt("Enter amount to top up (e.g. 100):") || "0", 10);
    if (amount > 0) {
      await firebaseService.topUpWallet(user.uid, amount);
      alert(`Successfully added ${amount} Tambayan Coins!`);
    }
  };

  const handleUpdateStatus = async (orderId: string) => {
    await firebaseService.updateOrderStatus(orderId, 'shipped');
    const updatedOrders = await firebaseService.getOrders(user!.uid, true);
    setOrders(updatedOrders || []);
  };

  if (!user) return null;

  return (
    <div className="pb-24 bg-white min-h-screen text-gray-900">
      {/* Profile Header */}
      <div className="p-6 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full border-4 border-brand p-1 bg-white">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              className="w-full h-full rounded-full bg-gray-50 object-cover" 
              alt="Avatar"
              referrerPolicy="no-referrer"
            />
          </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute bottom-1 right-1 bg-brand p-1.5 rounded-full border-4 border-white shadow-sm"
          >
            <ShieldCheck size={14} className="text-white" />
          </motion.div>
        </div>
        
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{user.displayName}</h2>
        <p className="text-gray-400 text-sm mb-6 flex items-center gap-1 font-bold">
          @{user.email?.split('@')[0]}
          <CheckCircle2 size={12} className="text-brand" />
        </p>

        {/* Wallet Section */}
        <div className="w-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 mb-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
             <Coins size={100} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Tambayan Balance</p>
          <div className="flex justify-between items-end">
            <h3 className="text-3xl font-black tracking-tighter flex items-center gap-2">
              <Coins size={24} className="fill-yellow-300 text-yellow-500" />
              {coins.toLocaleString()}
            </h3>
            <button 
              onClick={handleTopUp}
              className="bg-white text-orange-600 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-sm hover:scale-105 transition-transform"
            >
              <Plus size={14} /> Top Up
            </button>
          </div>
        </div>

        <div className="flex gap-8 mb-8 w-full justify-center">
          <div className="text-center">
            <p className="text-lg font-black tracking-tighter text-gray-900">{stats.followers}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black tracking-tighter text-gray-900">{stats.following}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Following</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black tracking-tighter text-gray-900">0</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Flexes</p>
          </div>
        </div>

        {isAdmin && (
          <Link to="/admin" className="w-full btn-secondary text-[10px] mb-3 flex items-center justify-center gap-2 border-brand/20 bg-brand/5 shadow-sm">
            <ShieldCheck size={18} className="text-brand" />
            Boss Panel (Admin)
          </Link>
        )}
        
        <div className="flex gap-4 w-full mb-6">
          <button className="flex-1 btn-secondary text-[10px]">Edit Profile</button>
          <button onClick={handleLogout} className="btn-secondary p-3 text-red-500 border-red-100 flex items-center justify-center">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-gray-100">
        <button 
          onClick={() => setActiveTab('flex')}
          className={cn(
            "flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-all",
            activeTab === 'flex' ? "border-brand text-brand" : "border-transparent text-gray-300"
          )}
        >
          <Grid size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">My Flex</span>
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={cn(
            "flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-all",
            activeTab === 'orders' ? "border-brand text-brand" : "border-transparent text-gray-300"
          )}
        >
          <Package size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Fulfillment</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 bg-gray-50 min-h-[400px]">
        {activeTab === 'flex' ? (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center">
                <Grid size={24} className="text-gray-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="py-20 text-center">
                <Package size={48} className="text-gray-200 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Walang orders to fulfill</p>
              </div>
            ) : orders.map((order) => (
              <div key={order.id} className="glass-card p-5 space-y-4 bg-white shadow-sm border-brand/5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-[12px] text-brand uppercase italic">#{order.id.slice(0, 8)}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest tracking-tighter">Buyer: {order.buyerName}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                    order.status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                  )}>
                    {order.status}
                  </div>
                </div>

                <div className="flex gap-4 p-3 bg-gray-50 rounded-2xl items-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Package size={20} className="text-brand/30" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 leading-tight">{order.itemName}</p>
                    <p className="text-xs font-black text-brand tracking-tighter italic">₱{order.price?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <div className="flex gap-2 items-start text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                    <Truck size={14} className="shrink-0 text-brand" />
                    <p>{order.address}</p>
                  </div>
                  {order.note && (
                    <div className="flex gap-2 items-start text-[10px] text-gray-400 italic">
                      <AlertCircle size={14} className="shrink-0" />
                      <p>{order.note}</p>
                    </div>
                  )}
                </div>

                {order.status === 'pending' && (
                  <button 
                    onClick={() => handleUpdateStatus(order.id)}
                    className="w-full btn-primary py-3 text-[10px]"
                  >
                    Mark as Shipped (Confirm Order)
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
