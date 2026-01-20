
import { db, ADMIN_EMAIL } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, increment, addDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { UserProfile, PlanType, UserStatus, PlanConfig, SavedAnalysis, AnalysisResult, AppConfig } from '../types';

export const createUserProfile = async (uid: string, email: string, region: string = 'SA'): Promise<UserProfile> => {
  try {
    const userRef = doc(db, 'users', uid);
    const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const newProfile: UserProfile = {
      uid,
      email,
      region,
      plan: isAdminEmail ? 'ELITE' : 'FREE',
      status: 'ACTIVE',
      createdAt: Date.now(),
      expiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
      searchCount: 0,
      isAdmin: isAdminEmail
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  } catch (error: any) {
    console.error("Create User Profile Error:", error.message);
    throw error;
  }
};

// Normalize queries to avoid duplicates with different casing/spacing
const normalizeQuery = (q: string) => q.trim().toLowerCase();

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
        region: 'SA',
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

export const updateUserDetails = async (uid: string, updates: Partial<UserProfile>) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, updates);
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

export const saveAnalysis = async (userId: string, queryStr: string, data: AnalysisResult, region: string = 'SA'): Promise<string> => {
  try {
    const normalizedQuery = normalizeQuery(queryStr);
    // أولاً: تحقق من وجود تحليل مشابه محفوظ بالفعل
    const existingAnalysis = await checkExistingSavedAnalysis(userId, queryStr);
    
    if (existingAnalysis) {
      // إذا كان موجوداً، أرجع الـ ID الموجود (لا تحفظ نسخة جديدة)
      console.log('Analysis already exists, returning existing ID:', existingAnalysis.id);
      return existingAnalysis.id!;
    }
    
    // إذا لم يكن موجوداً، احفظ نسخة جديدة
    const analysisRef = collection(db, 'saved_analyses');
    const newDoc: SavedAnalysis = {
      userId,
      query: queryStr,
      normalizedQuery,
      timestamp: Date.now(),
      data,
      region,
      isPublished: false
    };
    const docRef = await addDoc(analysisRef, newDoc);
    console.log('New analysis saved with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error("Save Analysis Error:", error.message);
    throw error;
  }
};

export const checkExistingSavedAnalysis = async (userId: string, queryStr: string): Promise<SavedAnalysis | null> => {
  try {
    const normalizedQuery = normalizeQuery(queryStr);
    const q = query(
      collection(db, 'saved_analyses'),
      where('userId', '==', userId),
      where('normalizedQuery', '==', normalizedQuery)
    );
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() } as SavedAnalysis;
    }
    
    // fallback للبيانات القديمة التي لا تملك normalizedQuery
    const legacyQ = query(
      collection(db, 'saved_analyses'),
      where('userId', '==', userId),
      where('query', '==', queryStr)
    );
    const legacySnap = await getDocs(legacyQ);
    if (!legacySnap.empty) {
      const doc = legacySnap.docs[0];
      return { id: doc.id, ...doc.data() } as SavedAnalysis;
    }

    return null;
  } catch (error: any) {
    console.error("Check Existing Analysis Error:", error.message);
    return null;
  }
};

export const getSavedAnalyses = async (userId: string): Promise<SavedAnalysis[]> => {
  try {
    const q = query(
      collection(db, 'saved_analyses'), 
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedAnalysis));
    return results.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error: any) {
    console.error("Get Saved Analyses Error:", error.message);
    return [];
  }
};

export const getUserSavedAnalyses = async (userId: string): Promise<SavedAnalysis[]> => {
  try {
    const q = query(
      collection(db, 'saved_analyses'), 
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedAnalysis));
    // Sort locally instead of using Firestore orderBy
    return results.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error: any) {
    console.error("Get User Saved Analyses Error:", error.message);
    console.error("Full error:", error);
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

export const markAnalysisAsPublished = async (savedAnalysisId: string) => {
  try {
    const analysisRef = doc(db, 'saved_analyses', savedAnalysisId);
    await updateDoc(analysisRef, { isPublished: true });
  } catch (error: any) {
    console.error("Mark as Published Error:", error.message);
    throw error;
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
    const plansData = await getPlanConfigs();
    const selectedPlan = plansData.find(p => p.id === planId);
    const durationMonths = selectedPlan?.durationMonths || 1;
    await updateDoc(userRef, { 
      plan: planId,
      status: 'ACTIVE',
      expiryDate: Date.now() + (durationMonths * 30 * 24 * 60 * 60 * 1000) 
    });
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  }
  return false;
};
