import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc } from 'firebase/firestore';

// استخدم نفس إعدادات Firebase الخاصة بالمشروع
const firebaseConfig = {
  apiKey: 'AIzaSyAch6npJL9rfD9aBr8B2q5Ec8VAVvy_rWk',
  authDomain: 'muhll-ca343.firebaseapp.com',
  projectId: 'muhll-ca343',
  storageBucket: 'muhll-ca343.firebasestorage.app',
  messagingSenderId: '393991777150',
  appId: '1:393991777150:web:e049dd17b3c2794784e12f',
  measurementId: 'G-P8XSBNDX81'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const normalize = (q) => q?.trim().toLowerCase() || '';

async function migrateCollection(coll) {
  const snap = await getDocs(collection(db, coll));
  let updated = 0;

  for (const d of snap.docs) {
    const data = d.data();
    if (!data.query) continue;
    if (data.normalizedQuery) continue; // قديمة لكنها بالفعل محدثة

    const normalizedQuery = normalize(data.query);
    await updateDoc(d.ref, { normalizedQuery });
    updated += 1;
    console.log(`[${coll}] updated`, d.id);
  }

  return updated;
}

async function main() {
  console.log('Starting migration...');
  const updatedSaved = await migrateCollection('saved_analyses');
  const updatedPublic = await migrateCollection('publicLibrary');
  console.log('Done.');
  console.log({ updatedSaved, updatedPublic });
}

main().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
