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
    <div className="p-6 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-brand/20 rounded-xl">
          <Bell className="text-brand" size={24} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter">Notifications</h2>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 opacity-20">Loading activity...</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-white/20">
             <Bell size={48} className="mb-4 opacity-10" />
             <p className="text-sm font-bold uppercase tracking-widest">Walang Ganap</p>
             <p className="text-xs">Umpisahan mong mag-shopping para magkaroon ng activity dito!</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="glass-card p-4 flex gap-4 items-center">
              <div className="p-3 glass rounded-xl bg-brand/10">
                <Package className="text-brand" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  You ordered <span className="font-bold text-brand">{order.itemName}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-[9px] font-bold uppercase px-1 rounded",
                    order.status === 'pending' ? "bg-amber-500/20 text-amber-500" : "bg-green-500/20 text-green-500"
                  )}>
                    {order.status}
                  </span>
                  <span className="text-[9px] text-white/20">{new Date(order.createdAt?.toDate()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
