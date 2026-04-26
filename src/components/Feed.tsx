import React from 'react';
import { PostCard } from './PostCard';

const SAMPLE_POSTS = [
  {
    id: '1',
    user: {
      name: 'Sneaker King',
      handle: 'sneaker_king',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    },
    content: {
      image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800',
      text: 'Just got these rare Air Jordan 1s. Thinking of letting them go for the right price! #SneakerHead #Jordan1',
    },
    commerce: {
      price: 15500,
      itemName: 'Air Jordan 1 Retro High',
      isSelling: true,
    },
    stats: {
      likes: 1240,
      comments: 42,
    }
  },
  {
    id: '2',
    user: {
      name: 'Artsy Jace',
      handle: 'jace_art',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jace',
    },
    content: {
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800',
      text: 'Morning sketches in the park. The light today is just perfect. ✨ #ArtLife #Sketches',
    },
    stats: {
      likes: 856,
      comments: 15,
    }
  },
  {
    id: '3',
    user: {
      name: 'Tech Haven',
      handle: 'techhaven_ph',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tech',
    },
    content: {
      image: 'https://images.unsplash.com/photo-1526733158272-a1b415e714b1?auto=format&fit=crop&q=80&w=800',
      text: 'Wireless mechanical keyboard. Custom switches, buttery smooth. COD Available! #MechanicalKeyboard #Setup',
    },
    commerce: {
      price: 4800,
      itemName: 'KBD67 Lite Custom',
      isSelling: true,
    },
    stats: {
      likes: 3200,
      comments: 128,
    }
  }
];

interface FeedProps {
  onOrderClick: () => void;
}

export const Feed: React.FC<FeedProps> = ({ onOrderClick }) => {
  return (
    <div className="px-4 py-6 pb-24 touch-pan-y">
      <div className="flex gap-4 mb-8 overflow-x-auto hide-scrollbar">
        {['All', 'Sneakers', 'Tech', 'Fashion', 'Art', 'Collectibles'].map((cat) => (
          <button 
            key={cat} 
            className="whitespace-nowrap glass px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-brand transition-all"
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {SAMPLE_POSTS.map((post) => (
          <PostCard 
            key={post.id} 
            {...post} 
            onOrderClick={onOrderClick}
          />
        ))}
      </div>
    </div>
  );
};
