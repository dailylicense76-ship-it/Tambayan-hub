import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function clear() {
  const s = await getDocs(collection(db, 'liveStreams'));
  for (const item of s.docs) {
    await deleteDoc(item.ref);
    console.log("Deleted", item.id);
  }
}
clear().then(()=>process.exit(0));
