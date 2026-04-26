import React, { useEffect, useState } from 'react';
import { Bell, ShoppingBag, Heart, UserPlus, Package } from 'lucide-react';
import { firebaseService } from '../lib/firebaseService';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

export const Activity: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    
    const loadOrders = async () => {
       const fetched = await firebaseService.getOrders(user.uid);
       setOrders(fetched || []);
       setLoading(false);
    };
    loadOrders();
  }, []);

  return (
    <div className="p-6 pb-24 bg-white min-h-screen text-gray-900">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-brand/[0.03] border border-brand/5 rounded-2xl shadow-sm">
          <Bell className="text-brand" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Activity</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Your Marketplace Logs</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 font-bold uppercase tracking-widest text-gray-300 text-xs italic">Loading history...</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
               <Bell size={24} className="text-gray-200" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Walang Ganap</p>
             <p className="text-[9px] text-gray-300 uppercase mt-1">Umpisahan mong mag-shopping!</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="glass-card p-4 flex gap-4 items-center bg-white border-brand/5 shadow-sm">
              <div className="p-3 bg-brand/[0.04] border border-brand/5 rounded-2xl">
                <Package className="text-brand" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-bold text-gray-700 leading-tight">
                  You ordered <span className="font-black text-brand italic">"{order.itemName}"</span>
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className={cn(
                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest",
                    order.status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                  )}>
                    {order.status}
                  </span>
                  <span className="text-[9px] font-bold text-gray-200 uppercase">
                    {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
