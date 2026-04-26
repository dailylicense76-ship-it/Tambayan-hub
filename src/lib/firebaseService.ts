import { auth, db } from './firebase';
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
  serverTimestamp, 
  Timestamp,
  updateDoc
} from 'firebase/firestore';

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
      return adminDoc.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `admins/${uid}`);
    }
  }
};
