import { auth, db, storage } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  serverTimestamp, 
  Timestamp,
  updateDoc,
  limit
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firebaseService = {
  async getFollowingIds(userId: string) {
    const followsRef = collection(db, 'follows');
    const q = query(followsRef, where('followerId', '==', userId));
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data().followingId);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'follows');
    }
  },

  subscribeFollowingPosts(userId: string, followedIds: string[], callback: (posts: any[]) => void) {
    const postsRef = collection(db, 'posts');
    if (followedIds.length === 0) {
      callback([]);
      return () => {};
    }
    // Note: 'in' operator has a limit of 30
    const chunks = [];
    for (let i = 0; i < followedIds.length; i += 30) {
      chunks.push(followedIds.slice(i, i + 30));
    }
    
    // For simplicity in this app, we'll just use the first chunk or handle it
    const q = query(postsRef, where('userId', 'in', chunks[0]), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts_following');
    });
  },

  // Posts
  async getPosts() {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    }
  },

  subscribePosts(callback: (posts: any[]) => void) {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(posts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });
  },

  async createPost(postData: any) {
    const postsRef = collection(db, 'posts');
    try {
      return await addDoc(postsRef, {
        ...postData,
        createdAt: serverTimestamp(),
        stats: { likes: 0, comments: 0 }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  },

  // Users
  async getUserProfile(uid: string) {
    const userRef = doc(db, 'users', uid);
    try {
      const userDoc = await getDoc(userRef);
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  },

  async saveUserProfile(profile: any) {
    const userRef = doc(db, 'users', profile.uid);
    try {
      await setDoc(userRef, {
        ...profile,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
    }
  },

  // Orders
  async createOrder(orderData: any) {
    const ordersRef = collection(db, 'orders');
    try {
      return await addDoc(ordersRef, {
        ...orderData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  },

  async getOrders(userId: string, isSeller: boolean = false) {
    const ordersRef = collection(db, 'orders');
    const field = isSeller ? 'sellerId' : 'buyerId';
    const q = query(ordersRef, where(field, '==', userId), orderBy('createdAt', 'desc'));
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    }
  },

  async updateOrderStatus(orderId: string, status: string) {
    const orderRef = doc(db, 'orders', orderId);
    try {
      await updateDoc(orderRef, { status, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  },

  // Admins
  async checkIsAdmin(uid: string) {
    const adminRef = doc(db, 'admins', uid);
    try {
      const adminDoc = await getDoc(adminRef);
      if (adminDoc.exists()) return true;
      
      // Fallback for hardcoded admins
      const user = auth.currentUser;
      const hardcodedAdmins = ['shuty0433@gmail.com', 'shuty04g33@gmail.com'];
      return !!(user && user.email && hardcodedAdmins.includes(user.email));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `admins/${uid}`);
    }
  },

  // Chat
  async getOrCreateChat(userA: string, userB: string, userDataA: any, userDataB: any) {
    const participants = [userA, userB].sort();
    const chatId = participants.join('_');
    const chatRef = doc(db, 'chats', chatId);
    
    try {
      const chatDoc = await getDoc(chatRef);
      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          participants,
          participantData: {
            [userA]: userDataA,
            [userB]: userDataB
          },
          updatedAt: serverTimestamp(),
          lastMessage: ''
        });
      }
      return chatId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}`);
    }
  },

  subscribeChats(userId: string, callback: (chats: any[]) => void) {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', userId), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });
  },

  async sendMessage(chatId: string, senderId: string, text: string) {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const chatRef = doc(db, 'chats', chatId);
    
    try {
      await addDoc(messagesRef, {
        senderId,
        text,
        timestamp: serverTimestamp()
      });
      await updateDoc(chatRef, {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}/messages`);
    }
  },

  subscribeMessages(chatId: string, callback: (messages: any[]) => void) {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    });
  },

  // Social
  async toggleFollow(followerId: string, followingId: string) {
    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'follows', followId);
    
    try {
      const followDoc = await getDoc(followRef);
      if (followDoc.exists()) {
        await deleteDoc(followRef);
      } else {
        await setDoc(followRef, {
          followerId,
          followingId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `follows/${followId}`);
    }
  },

  async isFollowing(followerId: string, followingId: string) {
    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'follows', followId);
    try {
      const followDoc = await getDoc(followRef);
      return followDoc.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `follows/${followId}`);
    }
  },

  // Moderation
  async reportPost(postId: string, reporterId: string, reason: string, postContent: any) {
    try {
      await addDoc(collection(db, 'reports'), {
        postId,
        reporterId,
        reason,
        postContent,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    }
  },

  subscribeReports(callback: (reports: any[]) => void) {
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });
  },

  async resolveReport(reportId: string) {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'resolved',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `reports/${reportId}`);
    }
  },

  async deletePost(postId: string) {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}`);
    }
  },

  getServerTimestamp() {
    return serverTimestamp();
  },

  // Interactions (TikTok/FB Style)
  async toggleLike(postId: string, userId: string) {
    const likeId = `${userId}_${postId}`;
    const likeRef = doc(db, 'likes', likeId);
    try {
      const likeDoc = await getDoc(likeRef);
      if (likeDoc.exists()) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, {
          userId,
          postId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `likes/${likeId}`);
    }
  },

  async isLiked(postId: string, userId: string) {
    const likeId = `${userId}_${postId}`;
    const likeRef = doc(db, 'likes', likeId);
    try {
      const likeDoc = await getDoc(likeRef);
      return likeDoc.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `likes/${likeId}`);
    }
  },

  async addComment(postId: string, commentData: any) {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    try {
      await addDoc(commentsRef, {
        ...commentData,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `posts/${postId}/comments`);
    }
  },

  subscribeComments(postId: string, callback: (comments: any[]) => void) {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `posts/${postId}/comments`);
    });
  },

  // Saved / Wishlist
  async toggleSavePost(userId: string, postId: string) {
    const savedRef = doc(db, 'users', userId, 'saved', postId);
    try {
      const docSnap = await getDoc(savedRef);
      if (docSnap.exists()) {
        await deleteDoc(savedRef);
        return false;
      } else {
        await setDoc(savedRef, { createdAt: serverTimestamp() });
        return true;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/saved/${postId}`);
      throw error;
    }
  },

  async isPostSaved(userId: string, postId: string) {
    const savedRef = doc(db, 'users', userId, 'saved', postId);
    try {
      const docSnap = await getDoc(savedRef);
      return docSnap.exists();
    } catch (error) {
      return false;
    }
  },

  // Notifications
  subscribeNotifications(userId: string, callback: (notifications: any[]) => void) {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(20));
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(notifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/notifications`);
    });
  },

  async sendNotification(userId: string, type: 'like' | 'comment' | 'follow' | 'gift', data: any) {
    if (!userId) return;
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    try {
      await addDoc(notificationsRef, {
        type,
        ...data,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to send notification", error);
    }
  },

  // Wallet & Gifting
  subscribeWallet(userId: string, callback: (balance: number) => void) {
    const walletRef = doc(db, 'users', userId, 'wallet', 'balance');
    return onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data().coins || 0);
      } else {
        callback(0);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/wallet`);
    });
  },

  async topUpWallet(userId: string, amount: number) {
    const walletRef = doc(db, 'users', userId, 'wallet', 'balance');
    try {
      const docSnap = await getDoc(walletRef);
      const currentCoins = docSnap.exists() ? (docSnap.data().coins || 0) : 0;
      await setDoc(walletRef, { coins: currentCoins + amount, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/wallet/balance`);
    }
  },

  async sendGift(senderId: string, receiverId: string, amount: number) {
    // In a real app, use Firestore Transactions to safely deduct and add
    const senderWalletRef = doc(db, 'users', senderId, 'wallet', 'balance');
    const receiverWalletRef = doc(db, 'users', receiverId, 'wallet', 'balance');
    
    try {
      const senderSnap = await getDoc(senderWalletRef);
      const senderCoins = senderSnap.exists() ? (senderSnap.data().coins || 0) : 0;
      
      if (senderCoins < amount) throw new Error("Insufficient coins");
      
      const receiverSnap = await getDoc(receiverWalletRef);
      const receiverCoins = receiverSnap.exists() ? (receiverSnap.data().coins || 0) : 0;
      
      await setDoc(senderWalletRef, { coins: senderCoins - amount, updatedAt: serverTimestamp() });
      await setDoc(receiverWalletRef, { coins: receiverCoins + amount, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'gift_transaction');
    }
  },
  
  subscribeAllOrders(callback: (orders: any[]) => void) {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
  },

  async uploadFile(file: File, folder: string = 'posts', onProgress?: (progress: number) => void) {
    let fileToUpload = file;
    
    if (file.type.startsWith('image/')) {
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1080,
          useWebWorker: false
        };
        fileToUpload = await imageCompression(file, options);
      } catch (error) {
        console.error('Compression Error:', error);
      }
    }

    const fileName = `${Date.now()}_${fileToUpload.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error('Upload Error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(downloadURL);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }
};
