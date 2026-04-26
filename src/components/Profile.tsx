import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Package, Grid, CheckCircle2, Truck, AlertCircle, ShieldCheck, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { firebaseService } from '../lib/firebaseService';
import { cn } from '../lib/utils';

export const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'flex' | 'orders'>('flex');
  const [orders, setOrders] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
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
    };

    loadData();
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleUpdateStatus = async (orderId: string) => {
    await firebaseService.updateOrderStatus(orderId, 'shipped');
    const updatedOrders = await firebaseService.getOrders(user!.uid, true);
    setOrders(updatedOrders || []);
  };

  if (!user) return null;

  return (
    <div className="pb-24">
      {/* Profile Header */}
      <div className="p-6 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full border-4 border-brand p-1">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              className="w-full h-full rounded-full bg-white/10" 
              alt="Avatar"
              referrerPolicy="no-referrer"
            />
          </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute bottom-1 right-1 bg-brand p-1.5 rounded-full border-4 border-[#0f172a]"
          >
            <CheckCircle2 size={14} />
          </motion.div>
        </div>
        
        <h2 className="text-xl font-bold">{user.displayName}</h2>
        <p className="text-white/50 text-sm mb-4">@{user.email?.split('@')[0]}</p>

        {isAdmin && (
          <Link to="/admin" className="w-full btn-secondary text-sm mb-3 flex items-center justify-center gap-2 border-brand/20 bg-brand/5">
            <ShieldCheck size={18} className="text-brand" />
            Boss Panel (Admin)
          </Link>
        )}
        
        <div className="flex gap-4 w-full mb-6">
          <button className="flex-1 btn-secondary text-sm">Edit Profile</button>
          <button onClick={handleLogout} className="btn-secondary p-3 text-red-500">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-white/5">
        <button 
          onClick={() => setActiveTab('flex')}
          className={cn(
            "flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-all",
            activeTab === 'flex' ? "border-brand text-brand" : "border-transparent text-white/40"
          )}
        >
          <Grid size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">My Flex</span>
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={cn(
            "flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-all",
            activeTab === 'orders' ? "border-brand text-brand" : "border-transparent text-white/40"
          )}
        >
          <Package size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Fulfillment</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'flex' ? (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square glass rounded-lg flex items-center justify-center">
                <Grid size={24} className="opacity-10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="py-10 text-center text-white/20">
                <p>No orders to fulfill yet.</p>
              </div>
            ) : orders.map((order) => (
              <div key={order.id} className="glass-card p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-brand">{order.id.slice(0, 8)}</h4>
                    <p className="text-xs text-white/50">{order.buyerName}</p>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter",
                    order.status === 'pending' ? "bg-amber-500/20 text-amber-500" : "bg-green-500/20 text-green-500"
                  )}>
                    {order.status}
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-12 h-12 glass rounded-lg flex items-center justify-center">
                    <Package size={20} className="opacity-20" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{order.itemName}</p>
                    <p className="text-xs font-bold text-brand">₱{order.price?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex gap-2 items-start text-xs text-white/60">
                    <Truck size={14} className="shrink-0" />
                    <p>{order.address}</p>
                  </div>
                  {order.note && (
                    <div className="flex gap-2 items-start text-xs text-white/40 italic">
                      <AlertCircle size={14} className="shrink-0" />
                      <p>{order.note}</p>
                    </div>
                  )}
                </div>

                {order.status === 'pending' && (
                  <button 
                    onClick={() => handleUpdateStatus(order.id)}
                    className="w-full btn-primary py-2 text-xs"
                  >
                    Mark as Shipped
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
