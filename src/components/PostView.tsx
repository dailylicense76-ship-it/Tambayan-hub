import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PostCard } from './PostCard';
import { ArrowLeft } from 'lucide-react';

export const PostView: React.FC<{ onOrderClick: () => void }> = ({ onOrderClick }) => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      try {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          setPost({ id: postDoc.id, ...postDoc.data() });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 rounded-full border-4 border-gray-200 border-t-brand"></div></div>;
  }

  if (!post) {
    return <div className="p-8 text-center text-gray-500">Post not found</div>;
  }

  return (
    <div className="pb-[100px] min-h-screen">
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-50 p-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[12px] font-black uppercase tracking-widest text-gray-900">Flex Details</h2>
      </div>
      <div className="p-2 sm:p-6">
        <PostCard 
          id={post.id}
          user={{ 
            uid: post.userId,
            name: post.userName, 
            handle: post.userHandle, 
            avatar: post.userAvatar 
          }}
          content={{ image: post.image, text: post.text }}
          stats={post.stats}
          commerce={post.commerce}
          mediaType={post.mediaType}
          onOrderClick={onOrderClick}
        />
      </div>
    </div>
  );
};
