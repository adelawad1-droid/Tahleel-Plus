import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  where,
  increment,
  Timestamp 
} from 'firebase/firestore';
import type { LibraryCategory, PublicAnalysis, AnalysisResult } from '../types';

// Normalize queries to avoid duplicates with different casing/spacing
const normalizeQuery = (q: string) => q.trim().toLowerCase();

// ============ Categories Management ============

export const createCategory = async (
  nameAr: string,
  nameEn: string,
  descriptionAr: string,
  descriptionEn: string,
  adminUid: string
): Promise<string> => {
  try {
    const categories = await getCategories();
    const order = categories.length;
    
    const categoryRef = await addDoc(collection(db, 'libraryCategories'), {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      order,
      createdAt: Date.now(),
      createdBy: adminUid
    });
    
    return categoryRef.id;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (
  categoryId: string,
  nameAr: string,
  nameEn: string,
  descriptionAr: string,
  descriptionEn: string
): Promise<void> => {
  try {
    const categoryRef = doc(db, 'libraryCategories', categoryId);
    await updateDoc(categoryRef, {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn
    });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    // Check if category has published analyses
    const analyses = await getPublicAnalysesByCategory(categoryId);
    if (analyses.length > 0) {
      throw new Error('Cannot delete category with published analyses');
    }
    
    const categoryRef = doc(db, 'libraryCategories', categoryId);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const getCategories = async (): Promise<LibraryCategory[]> => {
  try {
    const q = query(collection(db, 'libraryCategories'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LibraryCategory));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const reorderCategories = async (categoryIds: string[]): Promise<void> => {
  try {
    const updates = categoryIds.map((id, index) => 
      updateDoc(doc(db, 'libraryCategories', id), { order: index })
    );
    await Promise.all(updates);
  } catch (error) {
    console.error('Error reordering categories:', error);
    throw error;
  }
};

// ============ Public Library Management ============

export const publishAnalysis = async (
  categoryId: string,
  itemName: string,
  query: string,
  data: AnalysisResult,
  publisherUid: string,
  publisherEmail: string = '',
  publisherName: string = '',
  notes?: string
): Promise<string> => {
  try {
    // Get category details
    const categoryRef = doc(db, 'libraryCategories', categoryId);
    const categoryDoc = await getDoc(categoryRef);
    
    if (!categoryDoc.exists()) {
      throw new Error('Category not found');
    }
    
    const category = categoryDoc.data() as LibraryCategory;
    
    const analysisRef = await addDoc(collection(db, 'publicLibrary'), {
      categoryId,
      categoryNameAr: category.nameAr,
      categoryNameEn: category.nameEn,
      itemName,
      query,
      data,
      publishedAt: Date.now(),
      publishedDate: Date.now(),
      publishedBy: publisherUid,
      publisherEmail: publisherEmail,
      publisherName: publisherName,
      views: 0,
      notes: notes || ''
    });
    
    return analysisRef.id;
  } catch (error) {
    console.error('Error publishing analysis:', error);
    throw error;
  }
};

export const unpublishAnalysis = async (analysisId: string): Promise<void> => {
  try {
    const analysisRef = doc(db, 'publicLibrary', analysisId);
    await deleteDoc(analysisRef);
  } catch (error) {
    console.error('Error unpublishing analysis:', error);
    throw error;
  }
};

export const updatePublishedAnalysis = async (
  analysisId: string,
  categoryId: string,
  notes?: string
): Promise<void> => {
  try {
    // Get category details
    const categoryRef = doc(db, 'libraryCategories', categoryId);
    const categoryDoc = await getDoc(categoryRef);
    
    if (!categoryDoc.exists()) {
      throw new Error('Category not found');
    }
    
    const category = categoryDoc.data() as LibraryCategory;
    
    const analysisRef = doc(db, 'publicLibrary', analysisId);
    await updateDoc(analysisRef, {
      categoryId,
      categoryNameAr: category.nameAr,
      categoryNameEn: category.nameEn,
      notes: notes || ''
    });
  } catch (error) {
    console.error('Error updating published analysis:', error);
    throw error;
  }
};

export const getAllPublicAnalyses = async (): Promise<PublicAnalysis[]> => {
  try {
    const q = query(collection(db, 'publicLibrary'), orderBy('publishedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PublicAnalysis));
  } catch (error) {
    console.error('Error fetching public analyses:', error);
    return [];
  }
};

export const getPublicAnalysesByCategory = async (categoryId: string): Promise<PublicAnalysis[]> => {
  try {
    const q = query(
      collection(db, 'publicLibrary'), 
      where('categoryId', '==', categoryId),
      orderBy('publishedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PublicAnalysis));
  } catch (error) {
    console.error('Error fetching category analyses:', error);
    return [];
  }
};

export const getPublicAnalysis = async (analysisId: string): Promise<PublicAnalysis | null> => {
  try {
    const analysisRef = doc(db, 'publicLibrary', analysisId);
    const analysisDoc = await getDoc(analysisRef);
    
    if (!analysisDoc.exists()) {
      return null;
    }
    
    // Increment view count
    await updateDoc(analysisRef, {
      views: increment(1)
    });
    
    return {
      id: analysisDoc.id,
      ...analysisDoc.data()
    } as PublicAnalysis;
  } catch (error) {
    console.error('Error fetching public analysis:', error);
    return null;
  }
};

export const getPublishedAnalysesByUser = async (userId: string): Promise<PublicAnalysis[]> => {
  try {
    const q = query(
      collection(db, 'publicLibrary'), 
      where('publishedBy', '==', userId),
      orderBy('publishedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PublicAnalysis));
  } catch (error) {
    console.error('Error fetching user published analyses:', error);
    return [];
  }
};

export const searchPublicLibrary = async (searchTerm: string): Promise<PublicAnalysis[]> => {
  try {
    // Get all analyses (Firestore doesn't support full-text search without third-party tools)
    const analyses = await getAllPublicAnalyses();
    
    // Filter locally
    const term = searchTerm.toLowerCase();
    return analyses.filter(analysis => 
      analysis.itemName.toLowerCase().includes(term) ||
      analysis.query.toLowerCase().includes(term) ||
      analysis.categoryNameAr.includes(searchTerm) ||
      analysis.categoryNameEn.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error searching public library:', error);
    return [];
  }
};

export const getCategoryStats = async (categoryId: string): Promise<{
  totalAnalyses: number;
  totalViews: number;
}> => {
  try {
    const analyses = await getPublicAnalysesByCategory(categoryId);
    const totalViews = analyses.reduce((sum, analysis) => sum + (analysis.views || 0), 0);
    
    return {
      totalAnalyses: analyses.length,
      totalViews
    };
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return { totalAnalyses: 0, totalViews: 0 };
  }
};

export const getLibraryStats = async (): Promise<{
  totalCategories: number;
  totalAnalyses: number;
  totalViews: number;
}> => {
  try {
    const categories = await getCategories();
    const analyses = await getAllPublicAnalyses();
    const totalViews = analyses.reduce((sum, analysis) => sum + (analysis.views || 0), 0);
    
    return {
      totalCategories: categories.length,
      totalAnalyses: analyses.length,
      totalViews
    };
  } catch (error) {
    console.error('Error fetching library stats:', error);
    return { totalCategories: 0, totalAnalyses: 0, totalViews: 0 };
  }
};

// ============ User Publishing (من الأعضاء) ============

export const publishAnalysisByUser = async (
  savedAnalysisId: string,
  userId: string,
  userEmail: string,
  queryStr: string,
  data: AnalysisResult,
  region: string,
  categoryId?: string,
  dataAr?: AnalysisResult,
  dataEn?: AnalysisResult,
  originalLang?: 'ar' | 'en'
): Promise<string> => {
  try {
    console.log('=== Starting publishAnalysisByUser ===');
    console.log('savedAnalysisId:', savedAnalysisId);
    console.log('userId:', userId);
    console.log('query:', queryStr);
    const normalizedQuery = normalizeQuery(queryStr);
    
    // 1. التحقق من أن التحليل المحفوظ موجود وغير منشور
    const savedAnalysisRef = doc(db, 'saved_analyses', savedAnalysisId);
    const savedAnalysisDoc = await getDoc(savedAnalysisRef);
    
    if (!savedAnalysisDoc.exists()) {
      console.error('Saved analysis not found!');
      throw new Error('SAVED_ANALYSIS_NOT_FOUND');
    }
    
    const savedData = savedAnalysisDoc.data();
    console.log('Saved analysis isPublished status:', savedData.isPublished);
    
    if (savedData.isPublished) {
      console.log('Analysis already published!');
      throw new Error('ALREADY_PUBLISHED');
    }
    
    // استخدم النسخ المترجمة من التحليل المحفوظ إذا لم تُمرر
    const finalDataAr = dataAr || savedData.dataAr;
    const finalDataEn = dataEn || savedData.dataEn;
    const finalOriginalLang = originalLang || savedData.originalLang;
    
    if (savedData.isPublished) {
      console.log('Analysis already published!');
      throw new Error('ALREADY_PUBLISHED');
    }
    
    // 2. التحقق الإضافي من المكتبة العامة - بحث بـ savedAnalysisId
    const checkBySavedId = query(
      collection(db, 'publicLibrary'),
      where('savedAnalysisId', '==', savedAnalysisId)
    );
    const existingBySavedId = await getDocs(checkBySavedId);
    
    if (!existingBySavedId.empty) {
      console.log('Found duplicate by savedAnalysisId!');
      // إذا وجدنا نسخة منشورة، حدّث حالة التحليل المحفوظ
      await updateDoc(savedAnalysisRef, { 
        isPublished: true,
        publicAnalysisId: existingBySavedId.docs[0].id
      });
      throw new Error('ALREADY_PUBLISHED');
    }
    
    // 3. التحقق الثاني - بحث بـ userId و query (احتياطي)
    const checkByQuery = query(
      collection(db, 'publicLibrary'),
      where('publishedBy', '==', userId),
      where('normalizedQuery', '==', normalizedQuery)
    );
    const existingByQuery = await getDocs(checkByQuery);
    
    if (!existingByQuery.empty) {
      console.log('Found duplicate by userId and query!');
      // إذا وجدنا نسخة منشورة، حدّث حالة التحليل المحفوظ
      await updateDoc(savedAnalysisRef, { 
        isPublished: true,
        publicAnalysisId: existingByQuery.docs[0].id
      });
      throw new Error('ALREADY_PUBLISHED');
    }
    
    console.log('No duplicates found, proceeding with publish...');
    
    // إذا لم يتم تحديد فئة، استخدم فئة افتراضية أو أنشئ واحدة
    let finalCategoryId = categoryId;
    let categoryNameAr = 'تحليلات المستخدمين';
    let categoryNameEn = 'User Analyses';
    
    if (categoryId) {
      const categoryRef = doc(db, 'libraryCategories', categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (categoryDoc.exists()) {
        const category = categoryDoc.data() as LibraryCategory;
        categoryNameAr = category.nameAr;
        categoryNameEn = category.nameEn;
      }
    } else {
      // ابحث عن فئة "تحليلات المستخدمين" أو أنشئها
      const categories = await getCategories();
      const userCategory = categories.find(c => c.nameEn === 'User Analyses');
      
      if (userCategory) {
        finalCategoryId = userCategory.id!;
      } else {
        // أنشئ فئة جديدة
        finalCategoryId = await createCategory(
          'تحليلات المستخدمين',
          'User Analyses',
          'تحليلات منشورة من قبل المستخدمين',
          'Analyses published by users',
          userId
        );
      }
    }
    
    const publicAnalysisRef = await addDoc(collection(db, 'publicLibrary'), {
      categoryId: finalCategoryId,
      categoryNameAr,
      categoryNameEn,
      itemName: data.itemName,
      query: queryStr,
      normalizedQuery,
      data,
      dataAr: finalDataAr, // النسخة العربية المترجمة
      dataEn: finalDataEn, // النسخة الإنجليزية المترجمة
      originalLang: finalOriginalLang, // لغة التحليل الأصلية
      publishedAt: Date.now(),
      publishedDate: Date.now(),
      publishedBy: userId,
      publisherEmail: userEmail,
      publisherName: data.userName || userEmail?.split('@')[0] || 'User',
      publishedByEmail: userEmail,
      views: 0,
      notes: '',
      region,
      savedAnalysisId // احفظ ID التحليل المحفوظ للربط
    });
    
      console.log('Published successfully with ID:', publicAnalysisRef.id);
    
    // تحديث حالة التحليل المحفوظ إلى "منشور"
    await updateDoc(savedAnalysisRef, { 
      isPublished: true,
      publicAnalysisId: publicAnalysisRef.id
    });
    
      console.log('=== publishAnalysisByUser completed successfully ===');
    return publicAnalysisRef.id;
  } catch (error: any) {
      console.error('=== publishAnalysisByUser error ===', error);
      if (error.message === 'ALREADY_PUBLISHED' || error.message === 'SAVED_ANALYSIS_NOT_FOUND') {
      throw error;
    }
    console.error('Error publishing analysis by user:', error);
    throw error;
  }
};

export const getPublicAnalysesByRegion = async (region: string): Promise<PublicAnalysis[]> => {
  try {
    const q = query(
      collection(db, 'publicLibrary'), 
      where('region', '==', region),
      orderBy('publishedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PublicAnalysis));
  } catch (error) {
    console.error('Error fetching analyses by region:', error);
    return [];
  }
};
