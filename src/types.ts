export type Language = 'en' | 'hi';

export interface User {
  id: string;
  name: string;
  email: string;
  isDemo: boolean;
  createdAt: string;
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  foodCategory: string;
  zone: string;
  address: string;
  lat: number;
  lng: number;
  openingHours: string;
  dailyTargetInr: number;
  lowStockAlertPct: number;
  wasteAlertInr: number;
  language: Language;
  onboardingComplete: boolean;
}

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstocked';

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  category: string;
  unit: string;
  availableQuantity: number;
  costPrice: number;
  sellingPrice: number;
  minStockThreshold: number;
  expiryDate: string;
  status: StockStatus;
  marginPct: number;
  predictedDailyDemand: number;
}

export interface StockRecommendation {
  productId: string;
  productName: string;
  unit: string;
  currentStock: number;
  predictedDemand: number;
  delta: number;
  action: 'Prepare More' | 'Reduce Batch' | 'Hold Steady';
  reason: string;
}

export interface SaleRecord {
  id: string;
  vendorId: string;
  productId: string | null;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalRevenue: number;
  totalProfit: number;
  paymentMethod: 'UPI' | 'Cash';
  hourSlot: string;
  saleDate: string;
}

export interface ExpenseRecord {
  id: string;
  vendorId: string;
  title: string;
  category: 'Mandi Ingredients' | 'Fuel & Gas' | 'Packaging & Kulhad' | 'Staff & Helper' | 'Stall Utilities';
  amount: number;
  expenseDate: string;
  notes: string;
}

export interface WasteRecord {
  id: string;
  vendorId: string;
  productId: string | null;
  productName: string;
  unit: string;
  quantityWasted: number;
  estimatedLoss: number;
  shift: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  reason: string;
  wasteDate: string;
}

export interface ForecastRecord {
  id: string;
  vendorId: string;
  productId: string | null;
  productName: string;
  category: string;
  zone: string;
  dayOfWeek: string;
  weather: string;
  localEvent: string;
  expectedFootfall: number;
  historicalDailyAvg: number;
  sellingPrice: number;
  predictedUnits: number;
  optimalPrepUnits: number;
  expectedRevenue: number;
  confidencePct: number;
  isBaseline: boolean;
  factors: Array<{ label: string; impact: string }>;
  advisory: string;
  createdAt: string;
}

export interface LucknowZone {
  id: string;
  name: string;
  hindiName: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  demoFootfallDaily: number;
  peakHours: string;
  avgTicketInr: number;
  competitionLevel: 'Low' | 'Moderate' | 'High';
  rentIndex: string;
  topCategories: string[];
  commercialHubs: string[];
  notes: string;
}

export interface WeatherInfo {
  city: string;
  condition: 'Clear & Pleasant' | 'Cool Evening' | 'Warm Afternoon' | 'Cloudy' | 'Rainy';
  tempC: number;
  humidityPct: number;
  demandSignal: string;
  updatedAt: string;
}

export interface AiInsightItem {
  title: string;
  category: 'Demand' | 'Inventory' | 'Waste' | 'Pricing' | 'Location';
  impact: string;
  action: string;
}

export interface DashboardPayload {
  weather: WeatherInfo;
  kpis: {
    todayRevenue: number;
    todayRevenueDeltaPct: number;
    totalUnitsSold: number;
    predictedDemandToday: number;
    lowStockCount: number;
    totalSkus: number;
    wasteLoss7d: number;
    wasteReductionPct: number;
    zoneDailyFootfall: number;
    zoneName: string;
  };
  weeklySales: Array<{ date: string; label: string; revenue: number; profit: number; units: number }>;
  monthlyRevenueVsExpenses: Array<{ week: string; revenue: number; expenses: number; net: number }>;
  stockVsDemand: Array<{ name: string; stock: number; demand: number }>;
  peakHours: Array<{ slot: string; orders: number; footfall: number }>;
  bestProducts: Array<{
    name: string;
    category: string;
    unitsSold: number;
    revenue: number;
    profit: number;
    marginPct: number;
  }>;
  insights: AiInsightItem[];
  lastAiUpdatedAt: string | null;
}
