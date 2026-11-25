import type {
  AiInsightItem,
  DashboardPayload,
  ExpenseRecord,
  ForecastRecord,
  LucknowZone,
  Product,
  SaleRecord,
  StockRecommendation,
  User,
  VendorProfile,
  WasteRecord,
  WeatherInfo,
} from '../types';

const TOKEN_STORAGE_KEY = 'brainbazaar_auth_token';

let authToken: string | null =
  typeof window !== 'undefined' ? window.sessionStorage.getItem(TOKEN_STORAGE_KEY) : null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`/api${endpoint}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  register(payload: {
    name: string;
    email: string;
    password: string;
    businessName?: string;
    zone?: string;
  }) {
    return request<{ token: string; user: User; vendor: VendorProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  login(payload: { email: string; password: string }) {
    return request<{ token: string; user: User; vendor: VendorProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  demoLogin() {
    return request<{ token: string; user: User; vendor: VendorProfile }>('/auth/demo', {
      method: 'POST',
    });
  },
  me() {
    return request<{ user: User; vendor: VendorProfile }>('/auth/me');
  },
  changePassword(payload: { currentPassword: string; newPassword: string }) {
    return request<{ ok: boolean }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  completeOnboarding(payload: Partial<VendorProfile>) {
    return request<{ vendor: VendorProfile }>('/vendor/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateProfile(payload: Partial<VendorProfile>) {
    return request<{ vendor: VendorProfile }>('/vendor/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  updateSettings(payload: Partial<VendorProfile>) {
    return request<{ vendor: VendorProfile }>('/vendor/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  resetDemoData() {
    return request<{ user: User; vendor: VendorProfile }>('/vendor/reset-demo', {
      method: 'POST',
    });
  },
  getDashboard() {
    return request<DashboardPayload>('/dashboard');
  },
  generateAiInsights() {
    return request<{ insights: AiInsightItem[]; updatedAt: string }>('/insights/ai', {
      method: 'POST',
    });
  },
  getWeather() {
    return request<WeatherInfo>('/weather');
  },
  getInventory() {
    return request<{
      items: Product[];
      recommendations: StockRecommendation[];
      summary: {
        totalSkus: number;
        inStock: number;
        lowStock: number;
        outOfStock: number;
        overstocked: number;
        inventoryValue: number;
      };
    }>('/inventory');
  },
  createProduct(payload: {
    name: string;
    category: string;
    unit: string;
    availableQuantity: number;
    costPrice: number;
    sellingPrice: number;
    minStockThreshold: number;
    expiryDate: string;
  }) {
    return request<{ product: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateProduct(id: string, payload: Partial<Product>) {
    return request<{ product: Product }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteProduct(id: string) {
    return request<{ ok: boolean }>(`/products/${id}`, { method: 'DELETE' });
  },
  getSales(filters?: { from?: string; to?: string; productId?: string }) {
    const params = new URLSearchParams();
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    if (filters?.productId) params.set('productId', filters.productId);
    const qs = params.toString();
    return request<{
      sales: SaleRecord[];
      expenses: ExpenseRecord[];
      totals: {
        totalRevenue: number;
        totalProfit: number;
        totalExpenses: number;
        netProfit: number;
        totalUnits: number;
        upiRevenue: number;
        cashRevenue: number;
      };
    }>(`/sales${qs ? `?${qs}` : ''}`);
  },
  createSale(payload: {
    productId?: string | null;
    productName: string;
    category?: string;
    quantity: number;
    unitPrice: number;
    paymentMethod: 'UPI' | 'Cash';
    hourSlot?: string;
    saleDate?: string;
  }) {
    return request<{ sale: SaleRecord }>('/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  deleteSale(id: string) {
    return request<{ ok: boolean }>(`/sales/${id}`, { method: 'DELETE' });
  },
  createExpense(payload: {
    title: string;
    category: ExpenseRecord['category'];
    amount: number;
    expenseDate?: string;
    notes?: string;
  }) {
    return request<{ expense: ExpenseRecord }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  deleteExpense(id: string) {
    return request<{ ok: boolean }>(`/expenses/${id}`, { method: 'DELETE' });
  },
  getReports(filters?: { from?: string; to?: string }) {
    const params = new URLSearchParams();
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    const qs = params.toString();
    return request<{
      summary: {
        grossRevenue: number;
        cogs: number;
        grossProfit: number;
        operatingExpenses: number;
        wasteLoss: number;
        netProfit: number;
        netMarginPct: number;
        totalUnits: number;
        upiSharePct: number;
        upiRevenue: number;
        cashRevenue: number;
      };
      categoryBreakdown: Array<{
        category: string;
        revenue: number;
        profit: number;
        units: number;
      }>;
      sales: SaleRecord[];
      expenses: ExpenseRecord[];
    }>(`/sales/reports${qs ? `?${qs}` : ''}`);
  },
  createForecast(payload: {
    productId?: string | null;
    productName: string;
    category: string;
    historicalDailyAvg: number;
    sellingPrice: number;
    dayOfWeek: string;
    weather: string;
    localEvent: string;
    expectedFootfall: number;
    zone: string;
  }) {
    return request<{ forecast: ForecastRecord; dataPointsUsed: number }>('/forecast', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getForecastHistory() {
    return request<{ forecasts: ForecastRecord[] }>('/forecast/history');
  },
  getWaste(filters?: { from?: string; to?: string }) {
    const params = new URLSearchParams();
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    const qs = params.toString();
    return request<{
      records: WasteRecord[];
      summary: {
        totalLoss: number;
        totalUnitsWasted: number;
        topWasteShift: string;
        potentialMonthlySavings: number;
      };
      dailyTrend: Array<{ date: string; loss: number; units: number }>;
      recommendations: string[];
    }>(`/waste${qs ? `?${qs}` : ''}`);
  },
  createWaste(payload: {
    productId?: string | null;
    productName: string;
    quantityWasted: number;
    estimatedLoss?: number;
    shift: WasteRecord['shift'];
    reason: string;
    wasteDate?: string;
  }) {
    return request<{ record: WasteRecord }>('/waste', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  deleteWaste(id: string) {
    return request<{ ok: boolean }>(`/waste/${id}`, { method: 'DELETE' });
  },
  getLocations() {
    return request<{
      vendorLocation: {
        businessName: string;
        zone: string;
        address: string;
        lat: number;
        lng: number;
        recordedRevenue: number;
      };
      zones: LucknowZone[];
      disclaimer: string;
    }>('/locations');
  },
  getLocationRecommendations() {
    return request<{
      currentZone: string;
      recommendations: Array<{
        zoneId: string;
        zoneName: string;
        hindiName: string;
        opportunityScore: number;
        peakHours: string;
        avgTicketInr: number;
        competitionLevel: 'Low' | 'Moderate' | 'High';
        rationale: string;
      }>;
    }>('/locations/recommendations');
  },
  geocode(query: string) {
    return request<{ displayName: string; lat: number; lng: number; zoneName?: string }>(
      `/locations/geocode?q=${encodeURIComponent(query)}`
    );
  },
};
