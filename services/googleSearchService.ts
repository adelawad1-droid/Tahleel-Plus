/**
 * Google Custom Search API Service
 * يوفر بحث دقيق عن المنتجات والمنافسين في السوق السعودي
 */

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
}

interface CompetitorData {
  storeName: string;
  url: string;
  description: string;
  platform: string;
}

/**
 * البحث عن المنافسين في السوق
 * @param query استعلام المنتج
 * @param apiKey مفتاح Google Custom Search API
 * @param searchEngineId معرف محرك البحث المخصص
 * @param region رمز المنطقة (SA, EG, AE, إلخ) - الافتراضي SA
 */
export async function searchCompetitorsInKSA(
  query: string,
  apiKey?: string,
  searchEngineId?: string,
  region: string = 'SA'
): Promise<CompetitorData[]> {
  
  if (!apiKey || !searchEngineId) {
    console.log('⚠️ Google Search API غير متاح - استخدام البيانات الافتراضية');
    return [];
  }

  try {
    // بناء query حسب المنطقة
    const regionQueries: Record<string, string> = {
      'SA': `${query} السعودية site:(noon.com OR namshi.com OR amazon.sa OR jarir.com OR extra.com OR salla.sa OR zid.sa)`,
      'EG': `${query} مصر site:(jumia.eg OR noon.eg OR amazon.eg OR souq.com)`,
      'AE': `${query} الإمارات site:(noon.ae OR namshi.ae OR amazon.ae OR carrefour.ae)`,
      'JO': `${query} الأردن site:(jumia.jo OR noon.jo)`,
      'KW': `${query} الكويت site:(noon.kw OR amazon.kw)`,
      'QA': `${query} قطر site:(noon.qa)`,
      'BH': `${query} البحرين site:(noon.bh)`,
      'OM': `${query} عمان site:(noon.om)`,
    };

    const searchQuery = regionQueries[region] || regionQueries['SA'];
    
    // خريطة رموز Google Regions
    const googleRegionMap: Record<string, string> = {
      'SA': 'sa',
      'EG': 'eg',
      'AE': 'ae',
      'JO': 'jo',
      'KW': 'kw',
      'QA': 'qa',
      'BH': 'bh',
      'OM': 'om',
      'LB': 'lb',
      'SY': 'sy',
      'IQ': 'iq',
      'MA': 'ma',
      'TN': 'tn',
      'DZ': 'dz',
    };
    
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', searchEngineId);
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('num', '10');
    url.searchParams.append('gl', googleRegionMap[region] || 'sa');
    url.searchParams.append('lr', 'lang_ar');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error('Google Search API Error:', response.status, await response.text());
      return [];
    }

    const data: GoogleSearchResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items.map(item => ({
      storeName: extractStoreName(item.displayLink),
      url: item.link,
      description: item.snippet,
      platform: detectPlatform(item.displayLink)
    }));

  } catch (error) {
    console.error('خطأ في البحث عن المنافسين:', error);
    return [];
  }
}

/**
 * البحث عن معلومات السوق والأسعار
 */
export async function searchMarketData(
  productName: string,
  apiKey?: string,
  searchEngineId?: string
): Promise<{
  priceRange: string;
  availability: string;
  popularStores: string[];
}> {
  
  if (!apiKey || !searchEngineId) {
    return {
      priceRange: 'غير متوفر',
      availability: 'بحاجة لمفتاح API',
      popularStores: []
    };
  }

  try {
    const searchQuery = `${productName} سعر السعودية`;
    
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', searchEngineId);
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('num', '10');
    url.searchParams.append('gl', 'sa');
    url.searchParams.append('lr', 'lang_ar');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: GoogleSearchResponse = await response.json();

    if (!data.items) {
      return {
        priceRange: 'لم يتم العثور على نتائج',
        availability: 'محدود',
        popularStores: []
      };
    }

    // استخراج الأسعار من النتائج
    const prices = extractPricesFromResults(data.items);
    const stores = data.items.map(item => extractStoreName(item.displayLink));

    return {
      priceRange: prices.length > 0 
        ? `${Math.min(...prices)} - ${Math.max(...prices)} ريال`
        : 'غير محدد',
      availability: data.items.length > 5 ? 'متوفر بكثرة' : 'متوفر',
      popularStores: Array.from(new Set(stores)).slice(0, 5)
    };

  } catch (error) {
    console.error('خطأ في البحث عن بيانات السوق:', error);
    return {
      priceRange: 'خطأ في الاستعلام',
      availability: 'غير معروف',
      popularStores: []
    };
  }
}

/**
 * البحث عن اتجاهات السوق والطلب
 */
export async function searchMarketTrends(
  productCategory: string,
  apiKey?: string,
  searchEngineId?: string
): Promise<string> {
  
  if (!apiKey || !searchEngineId) {
    return 'يتطلب مفتاح Google Search API للحصول على بيانات دقيقة عن الاتجاهات';
  }

  try {
    const searchQuery = `اتجاهات ${productCategory} السعودية 2025`;
    
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', searchEngineId);
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('num', '5');
    url.searchParams.append('gl', 'sa');
    url.searchParams.append('lr', 'lang_ar');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      return 'غير متوفر';
    }

    const data: GoogleSearchResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return 'لم يتم العثور على بيانات اتجاهات';
    }

    // تجميع معلومات الاتجاهات من النتائج
    const trendsInfo = data.items
      .map(item => item.snippet)
      .join(' | ')
      .substring(0, 300);

    return trendsInfo || 'معلومات محدودة';

  } catch (error) {
    console.error('خطأ في البحث عن الاتجاهات:', error);
    return 'خطأ في جلب البيانات';
  }
}

// ================= مساعدات =================

function extractStoreName(domain: string): string {
  const storeMap: Record<string, string> = {
    'noon.com': 'نون',
    'amazon.sa': 'أمازون السعودية',
    'namshi.com': 'نمشي',
    'jarir.com': 'مكتبة جرير',
    'extra.com': 'اكسترا',
    'salla.sa': 'سلة',
    'zid.sa': 'زد',
    'aliexpress.com': 'علي إكسبرس',
    'souq.com': 'سوق',
    'wadi.com': 'وادي'
  };

  for (const [key, value] of Object.entries(storeMap)) {
    if (domain.includes(key)) {
      return value;
    }
  }

  return domain.replace('www.', '').split('.')[0];
}

function detectPlatform(domain: string): string {
  if (domain.includes('salla.sa')) return 'Salla';
  if (domain.includes('zid.sa')) return 'Zid';
  if (domain.includes('noon.com')) return 'Noon';
  if (domain.includes('amazon')) return 'Amazon';
  return 'متجر مستقل';
}

function extractPricesFromResults(items: GoogleSearchResult[]): number[] {
  const prices: number[] = [];
  
  items.forEach(item => {
    const text = `${item.title} ${item.snippet}`;
    // البحث عن أرقام بجانب "ريال" أو "ر.س"
    const priceMatches = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:ريال|ر\.س|SAR)/gi);
    
    if (priceMatches) {
      priceMatches.forEach(match => {
        const number = parseFloat(match.replace(/[^\d.]/g, ''));
        if (number > 10 && number < 100000) { // تصفية معقولة
          prices.push(number);
        }
      });
    }
  });

  return prices;
}

/**
 * التحقق من صحة مفتاح API
 */
export async function validateGoogleSearchApiKey(
  apiKey: string,
  searchEngineId: string
): Promise<boolean> {
  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', searchEngineId);
    url.searchParams.append('q', 'test');
    url.searchParams.append('num', '1');

    const response = await fetch(url.toString());
    return response.ok;
  } catch {
    return false;
  }
}
