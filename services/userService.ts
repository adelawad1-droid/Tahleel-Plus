
import { db, ADMIN_EMAIL } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, increment, addDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { UserProfile, PlanType, UserStatus, PlanConfig, SavedAnalysis, AnalysisResult, AppConfig } from '../types';

export const syncUserProfile = async (uid: string, email: string): Promise<UserProfile> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (userSnap.exists()) {
      const existingData = userSnap.data() as UserProfile;
      if (isAdminEmail && !existingData.isAdmin) {
        await updateDoc(userRef, { isAdmin: true, plan: 'ELITE' });
        return { ...existingData, isAdmin: true, plan: 'ELITE' };
      }
      return existingData;
    } else {
      const newProfile: UserProfile = {
        uid,
        email,
        plan: isAdminEmail ? 'ELITE' : 'FREE',
        status: 'ACTIVE',
        createdAt: Date.now(),
        expiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
        searchCount: 0,
        isAdmin: isAdminEmail
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (error: any) {
    console.error("Firestore Sync Error:", error.message);
    throw error;
  }
};

export const getAppConfig = async (): Promise<AppConfig | null> => {
  try {
    const docRef = doc(db, 'configs', 'app');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as AppConfig;
    return null;
  } catch (error) {
    console.error("Get App Config Error:", error);
    return null;
  }
};

export const updateAppConfig = async (config: AppConfig) => {
  const docRef = doc(db, 'configs', 'app');
  await setDoc(docRef, { ...config, lastUpdated: Date.now() });
};

export const saveAnalysis = async (userId: string, queryStr: string, data: AnalysisResult) => {
  try {
    const analysisRef = collection(db, 'saved_analyses');
    const newDoc: SavedAnalysis = {
      userId,
      query: queryStr,
      timestamp: Date.now(),
      data
    };
    await addDoc(analysisRef, newDoc);
  } catch (error: any) {
    console.error("Save Analysis Error:", error.message);
    throw error;
  }
};

export const getSavedAnalyses = async (userId: string): Promise<SavedAnalysis[]> => {
  try {
    const q = query(
      collection(db, 'saved_analyses'), 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedAnalysis));
  } catch (error: any) {
    console.error("Get Saved Analyses Error:", error.message);
    return [];
  }
};

export const deleteSavedAnalysis = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'saved_analyses', id));
  } catch (error: any) {
    console.error("Delete Error:", error.message);
  }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error: any) {
    throw new Error(error.code === 'permission-denied' ? "Access Denied: Admin only." : error.message);
  }
};

export const updateUserPlan = async (uid: string, plan: PlanType, status: UserStatus, resetUsage: boolean = true) => {
  const userRef = doc(db, 'users', uid);
  const updates: any = { 
    plan, 
    status,
    expiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000)
  };
  if (resetUsage) {
    updates.searchCount = 0;
  }
  await updateDoc(userRef, updates);
};

export const deleteUserRecord = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  await deleteDoc(userRef);
};

export const resetUserSearches = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { searchCount: 0 });
};

export const incrementSearchCount = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { searchCount: increment(1) });
};

export const getPlanConfigs = async (): Promise<PlanConfig[]> => {
  try {
    const docRef = doc(db, 'configs', 'plans');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data().list as PlanConfig[];
    return [];
  } catch (error: any) {
    return [];
  }
};

export const updatePlanConfigs = async (newList: PlanConfig[]) => {
  const docRef = doc(db, 'configs', 'plans');
  await setDoc(docRef, { list: newList });
};

export const handleStripeReturn = async (uid: string) => {
  const params = new URLSearchParams(window.location.search);
  const success = params.get('stripe_success');
  const planId = params.get('plan_id') as PlanType;
  if (success === 'true' && planId) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { 
      plan: planId,
      status: 'ACTIVE',
      expiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000) 
    });
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  }
  return false;
};
