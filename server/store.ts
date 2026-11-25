import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  AiInsightItem,
  DashboardPayload,
  ExpenseRecord,
  ForecastRecord,
  Language,
  Product,
  SaleRecord,
  StockRecommendation,
  StockStatus,
  User,
  VendorProfile,
  WasteRecord,
} from '../src/types';
import { getLucknowWeather, LUCKNOW_ZONES } from './lucknowData';

interface StoredUser extends User {
  passwordHash: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  vendors: VendorProfile[];
  products: Product[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  waste: WasteRecord[];
  forecasts: ForecastRecord[];
  cachedInsights: Record<string, { items: AiInsightItem[]; updatedAt: string }>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'brainbazaar-db.json');

const sessions = new Map<string, string>(); // token -> userId

function isoDateDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function isoDateDaysAhead(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

export function computeProductStatus(
  availableQuantity: number,
  minStockThreshold: number,
  predictedDemand: number
): StockStatus {
  if (availableQuantity <= 0) return 'Out of Stock';
  if (availableQuantity <= minStockThreshold) return 'Low Stock';
  if (predictedDemand > 0 && availableQuantity > predictedDemand * 1.45) return 'Overstocked';
  return 'In Stock';
}

export function computeMarginPct(costPrice: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0;
  return Math.round(((sellingPrice - costPrice) / sellingPrice) * 100);
}

function buildDemoSeed(): {
  user: StoredUser;
  vendor: VendorProfile;
  products: Product[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  waste: WasteRecord[];
  forecasts: ForecastRecord[];
} {
  const userId = 'user-demo-lucknow';
  const vendorId = 'vendor-demo-lucknow';

  const user: StoredUser = {
    id: userId,
    name: 'Rajesh Verma',
    email: 'demo@brainbazaar.in',
    passwordHash: bcrypt.hashSync('demo1234', 8),
    isDemo: true,
    createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
  };

  const vendor: VendorProfile = {
    id: vendorId,
    userId,
    businessName: 'Lucknow Chaat & Chai Corner',
    ownerName: 'Rajesh Verma',
    phone: '+91 98390 44210',
    foodCategory: 'Chaat & Street Snacks',
    zone: 'Hazratganj',
    address: 'Near Janpath Market Gate 2, Hazratganj, Lucknow',
    lat: 26.8469,
    lng: 80.9465,
    openingHours: '8:00 AM – 10:00 PM',
    dailyTargetInr: 12500,
    lowStockAlertPct: 25,
    wasteAlertInr: 450,
    language: 'en',
    onboardingComplete: true,
  };

  const rawProducts: Array<{
    id: string;
    name: string;
    category: string;
    unit: string;
    availableQuantity: number;
    costPrice: number;
    sellingPrice: number;
    minStockThreshold: number;
    expiryDays: number;
    predictedDailyDemand: number;
  }> = [
    {
      id: 'prod-masala-chai',
      name: 'Kulhad Masala Chai',
      category: 'Beverages & Chai',
      unit: 'cups',
      availableQuantity: 42,
      costPrice: 8,
      sellingPrice: 20,
      minStockThreshold: 50,
      expiryDays: 1,
      predictedDailyDemand: 195,
    },
    {
      id: 'prod-aloo-tikki',
      name: 'Crisp Aloo Tikki Chaat',
      category: 'Chaat & Street Snacks',
      unit: 'plates',
      availableQuantity: 68,
      costPrice: 24,
      sellingPrice: 60,
      minStockThreshold: 35,
      expiryDays: 1,
      predictedDailyDemand: 94,
    },
    {
      id: 'prod-basket-chaat',
      name: 'Royal Tokri Basket Chaat',
      category: 'Chaat & Street Snacks',
      unit: 'plates',
      availableQuantity: 22,
      costPrice: 48,
      sellingPrice: 120,
      minStockThreshold: 25,
      expiryDays: 1,
      predictedDailyDemand: 46,
    },
    {
      id: 'prod-pani-puri',
      name: 'Hing-Jeera Pani Puri',
      category: 'Chaat & Street Snacks',
      unit: 'plates',
      availableQuantity: 92,
      costPrice: 12,
      sellingPrice: 35,
      minStockThreshold: 40,
      expiryDays: 1,
      predictedDailyDemand: 88,
    },
    {
      id: 'prod-bun-maska',
      name: 'Hazratganj Bun Maska',
      category: 'Morning Breakfast & Chai',
      unit: 'pieces',
      availableQuantity: 118,
      costPrice: 14,
      sellingPrice: 35,
      minStockThreshold: 30,
      expiryDays: 2,
      predictedDailyDemand: 64,
    },
    {
      id: 'prod-samosa',
      name: 'Punjabi Samosa Plate',
      category: 'Chaat & Street Snacks',
      unit: 'plates',
      availableQuantity: 54,
      costPrice: 11,
      sellingPrice: 30,
      minStockThreshold: 30,
      expiryDays: 1,
      predictedDailyDemand: 72,
    },
    {
      id: 'prod-kulhad-lassi',
      name: 'Malai Kulhad Lassi',
      category: 'Kulfi & Cold Drinks',
      unit: 'glasses',
      availableQuantity: 0,
      costPrice: 22,
      sellingPrice: 55,
      minStockThreshold: 20,
      expiryDays: 1,
      predictedDailyDemand: 38,
    },
    {
      id: 'prod-kulfi-falooda',
      name: 'Kesaria Kulfi Falooda',
      category: 'Sweets & Desserts',
      unit: 'bowls',
      availableQuantity: 36,
      costPrice: 34,
      sellingPrice: 85,
      minStockThreshold: 18,
      expiryDays: 3,
      predictedDailyDemand: 34,
    },
  ];

  const products: Product[] = rawProducts.map((p) => ({
    id: p.id,
    vendorId,
    name: p.name,
    category: p.category,
    unit: p.unit,
    availableQuantity: p.availableQuantity,
    costPrice: p.costPrice,
    sellingPrice: p.sellingPrice,
    minStockThreshold: p.minStockThreshold,
    expiryDate: isoDateDaysAhead(p.expiryDays),
    status: computeProductStatus(p.availableQuantity, p.minStockThreshold, p.predictedDailyDemand),
    marginPct: computeMarginPct(p.costPrice, p.sellingPrice),
    predictedDailyDemand: p.predictedDailyDemand,
  }));

  const sales: SaleRecord[] = [];
  const expenses: ExpenseRecord[] = [];
  const waste: WasteRecord[] = [];

  const hourSlots = ['8–11 AM', '11 AM–2 PM', '2–5 PM', '5–8 PM', '8–10 PM'];

  // Deterministic 28-day Lucknow transaction history
  for (let day = 27; day >= 0; day--) {
    const dateStr = isoDateDaysAgo(day);
    const dObj = new Date(dateStr + 'T12:00:00Z');
    const dow = dObj.getUTCDay(); // 0 Sun, 6 Sat
    const isWeekend = dow === 0 || dow === 6;
    const weekendBoost = isWeekend ? 1.24 : 1.0;
    const wave = 0.92 + ((28 - day) % 5) * 0.04;

    const dailyItems = [
      { prod: products[0], baseQty: 172, slot: '5–8 PM', upi: true },
      { prod: products[1], baseQty: 84, slot: '5–8 PM', upi: true },
      { prod: products[2], baseQty: 38, slot: '8–10 PM', upi: true },
      { prod: products[3], baseQty: 76, slot: '2–5 PM', upi: false },
      { prod: products[4], baseQty: 56, slot: '8–11 AM', upi: false },
      { prod: products[5], baseQty: 62, slot: '11 AM–2 PM', upi: true },
      { prod: products[7], baseQty: 29, slot: '8–10 PM', upi: true },
    ];

    dailyItems.forEach((entry, idx) => {
      const qty = Math.max(8, Math.round(entry.baseQty * weekendBoost * wave * (day === 0 ? 0.88 : 1)));
      const totalRevenue = qty * entry.prod.sellingPrice;
      const totalProfit = qty * (entry.prod.sellingPrice - entry.prod.costPrice);
      sales.push({
        id: `sale-${day}-${idx}`,
        vendorId,
        productId: entry.prod.id,
        productName: entry.prod.name,
        category: entry.prod.category,
        quantity: qty,
        unitPrice: entry.prod.sellingPrice,
        unitCost: entry.prod.costPrice,
        totalRevenue,
        totalProfit,
        paymentMethod: (idx + day) % 3 === 0 ? 'Cash' : 'UPI',
        hourSlot: hourSlots[(idx + (day % 2)) % hourSlots.length],
        saleDate: dateStr,
      });
    });

    // Daily mandi + operational expenses
    expenses.push({
      id: `exp-mandi-${day}`,
      vendorId,
      title: 'Dubagga Mandi Fresh Produce & Dairy',
      category: 'Mandi Ingredients',
      amount: Math.round((3200 + (day % 4) * 280) * (isWeekend ? 1.15 : 1)),
      expenseDate: dateStr,
      notes: 'Potatoes, ginger, milk, paneer, coriander & chaat spices',
    });

    if (day % 3 === 0) {
      expenses.push({
        id: `exp-fuel-${day}`,
        vendorId,
        title: 'Commercial LPG Cylinder & Kulhad Lot',
        category: day % 6 === 0 ? 'Fuel & Gas' : 'Packaging & Kulhad',
        amount: day % 6 === 0 ? 1850 : 920,
        expenseDate: dateStr,
        notes: day % 6 === 0 ? '19kg Indane commercial refill' : '500 clay kulhads + leaf donas',
      });
    }

    if (day % 7 === 0) {
      expenses.push({
        id: `exp-staff-${day}`,
        vendorId,
        title: 'Weekly Helper Wages (2 Staff)',
        category: 'Staff & Helper',
        amount: 4200,
        expenseDate: dateStr,
        notes: 'Evening rush prep & serving support',
      });
    }

    // Waste entries (declining trend in recent 7 days vs prior 7 days)
    if (day % 2 === 0 || day < 6) {
      const olderFactor = day >= 7 ? 1.35 : 0.85;
      const wastedProd = day % 3 === 0 ? products[4] : day % 3 === 1 ? products[1] : products[5];
      const qtyWasted = Math.max(2, Math.round((4 + (day % 4)) * olderFactor));
      waste.push({
        id: `waste-${day}`,
        vendorId,
        productId: wastedProd.id,
        productName: wastedProd.name,
        unit: wastedProd.unit,
        quantityWasted: qtyWasted,
        estimatedLoss: qtyWasted * wastedProd.costPrice,
        shift: day % 2 === 0 ? 'Night' : 'Afternoon',
        reason:
          day % 2 === 0
            ? 'Unsold late-night batch after 9:30 PM drop-off'
            : 'Prepped extra before slow 3 PM window',
        wasteDate: dateStr,
      });
    }
  }

  const forecasts: ForecastRecord[] = [
    {
      id: 'fc-demo-1',
      vendorId,
      productId: 'prod-masala-chai',
      productName: 'Kulhad Masala Chai',
      category: 'Beverages & Chai',
      zone: 'Hazratganj',
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      weather: 'Cool Evening',
      localEvent: 'Evening Market Rush',
      expectedFootfall: 5600,
      historicalDailyAvg: 185,
      sellingPrice: 20,
      predictedUnits: 228,
      optimalPrepUnits: 235,
      expectedRevenue: 4560,
      confidencePct: 91,
      isBaseline: false,
      factors: [
        { label: 'Cool Evening Weather', impact: '+18%' },
        { label: 'Hazratganj Peak Footfall', impact: '+9%' },
        { label: 'Evening Market Rush', impact: '+6%' },
      ],
      advisory:
        'Brew an extra 40-cup batch at 5:15 PM and stock 250 clay kulhads before Janpath shoppers exit.',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'fc-demo-2',
      vendorId,
      productId: 'prod-aloo-tikki',
      productName: 'Crisp Aloo Tikki Chaat',
      category: 'Chaat & Street Snacks',
      zone: 'Hazratganj',
      dayOfWeek: 'Saturday',
      weather: 'Clear & Pleasant',
      localEvent: 'Weekend Ganjing Promenade',
      expectedFootfall: 6400,
      historicalDailyAvg: 90,
      sellingPrice: 60,
      predictedUnits: 122,
      optimalPrepUnits: 126,
      expectedRevenue: 7320,
      confidencePct: 89,
      isBaseline: false,
      factors: [
        { label: 'Saturday Demand Lift', impact: '+22%' },
        { label: 'Weekend Ganjing Promenade', impact: '+14%' },
      ],
      advisory:
        'Par-boil potato patties in two staggered waves (4:30 PM and 7:00 PM) to keep crusts hot with zero leftover batter.',
      createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    },
  ];

  return { user, vendor, products, sales, expenses, waste, forecasts };
}

class BrainBazaarStore {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.load();
    this.ensureDemoAccount();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.vendors)) {
          return parsed;
        }
      }
    } catch {
      // Rebuild clean store on parse error
    }
    return {
      users: [],
      vendors: [],
      products: [],
      sales: [],
      expenses: [],
      waste: [],
      forecasts: [],
      cachedInsights: {},
    };
  }

  private save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to persist BrainBazaar store:', err);
    }
  }

  private ensureDemoAccount(): void {
    const exists = this.db.users.some((u) => u.id === 'user-demo-lucknow');
    if (!exists) {
      this.resetDemoData();
    }
  }

  public resetDemoData(): { user: User; vendor: VendorProfile } {
    const seed = buildDemoSeed();
    const demoUserId = seed.user.id;
    const demoVendorId = seed.vendor.id;

    this.db.users = this.db.users.filter((u) => u.id !== demoUserId);
    this.db.vendors = this.db.vendors.filter((v) => v.id !== demoVendorId);
    this.db.products = this.db.products.filter((p) => p.vendorId !== demoVendorId);
    this.db.sales = this.db.sales.filter((s) => s.vendorId !== demoVendorId);
    this.db.expenses = this.db.expenses.filter((e) => e.vendorId !== demoVendorId);
    this.db.waste = this.db.waste.filter((w) => w.vendorId !== demoVendorId);
    this.db.forecasts = this.db.forecasts.filter((f) => f.vendorId !== demoVendorId);
    delete this.db.cachedInsights[demoVendorId];

    this.db.users.push(seed.user);
    this.db.vendors.push(seed.vendor);
    this.db.products.push(...seed.products);
    this.db.sales.push(...seed.sales);
    this.db.expenses.push(...seed.expenses);
    this.db.waste.push(...seed.waste);
    this.db.forecasts.push(...seed.forecasts);
    this.save();

    return { user: this.toSafeUser(seed.user), vendor: seed.vendor };
  }

  private toSafeUser(u: StoredUser): User {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      isDemo: u.isDemo,
      createdAt: u.createdAt,
    };
  }

  public createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, userId);
    return token;
  }

  public getAuthByToken(token: string | undefined): { user: User; vendor: VendorProfile } | null {
    if (!token) return null;
    const userId = sessions.get(token);
    if (!userId) return null;
    const stored = this.db.users.find((u) => u.id === userId);
    if (!stored) return null;
    const vendor = this.db.vendors.find((v) => v.userId === userId);
    if (!vendor) return null;
    return { user: this.toSafeUser(stored), vendor };
  }

  public loginDemo(): { token: string; user: User; vendor: VendorProfile } {
    this.ensureDemoAccount();
    const stored = this.db.users.find((u) => u.id === 'user-demo-lucknow')!;
    const vendor = this.db.vendors.find((v) => v.userId === stored.id)!;
    const token = this.createSession(stored.id);
    return { token, user: this.toSafeUser(stored), vendor };
  }

  public register(input: {
    name: string;
    email: string;
    password: string;
    businessName?: string;
    zone?: string;
  }): { token: string; user: User; vendor: VendorProfile } {
    const cleanEmail = input.email.trim().toLowerCase();
    if (!cleanEmail || !input.password || input.password.length < 6) {
      throw new Error('Please provide a valid email and a password of at least 6 characters.');
    }
    if (this.db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email already exists. Please sign in.');
    }

    const userId = `user-${crypto.randomUUID()}`;
    const vendorId = `vendor-${crypto.randomUUID()}`;
    const zoneObj =
      LUCKNOW_ZONES.find((z) => z.name.toLowerCase() === (input.zone || 'Hazratganj').toLowerCase()) ||
      LUCKNOW_ZONES[0];

    const newUser: StoredUser = {
      id: userId,
      name: input.name.trim() || 'Vendor Owner',
      email: cleanEmail,
      passwordHash: bcrypt.hashSync(input.password, 8),
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    const newVendor: VendorProfile = {
      id: vendorId,
      userId,
      businessName: input.businessName?.trim() || `${newUser.name}'s Stall`,
      ownerName: newUser.name,
      phone: '',
      foodCategory: 'Chaat & Street Snacks',
      zone: zoneObj.name,
      address: `${zoneObj.name}, Lucknow, Uttar Pradesh`,
      lat: zoneObj.lat,
      lng: zoneObj.lng,
      openingHours: '9:00 AM – 9:30 PM',
      dailyTargetInr: 8000,
      lowStockAlertPct: 25,
      wasteAlertInr: 350,
      language: 'en',
      onboardingComplete: false,
    };

    this.db.users.push(newUser);
    this.db.vendors.push(newVendor);
    this.save();

    const token = this.createSession(userId);
    return { token, user: this.toSafeUser(newUser), vendor: newVendor };
  }

  public login(email: string, password: string): { token: string; user: User; vendor: VendorProfile } {
    const cleanEmail = email.trim().toLowerCase();
    const stored = this.db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!stored || !bcrypt.compareSync(password, stored.passwordHash)) {
      throw new Error('Invalid email or password.');
    }
    const vendor = this.db.vendors.find((v) => v.userId === stored.id);
    if (!vendor) throw new Error('Vendor profile not found.');
    const token = this.createSession(stored.id);
    return { token, user: this.toSafeUser(stored), vendor };
  }

  public changePassword(userId: string, currentPassword: string, newPassword: string): void {
    const stored = this.db.users.find((u) => u.id === userId);
    if (!stored) throw new Error('User not found.');
    if (!bcrypt.compareSync(currentPassword, stored.passwordHash)) {
      throw new Error('Current password is incorrect.');
    }
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }
    stored.passwordHash = bcrypt.hashSync(newPassword, 8);
    this.save();
  }

  public updateVendor(vendorId: string, patch: Partial<VendorProfile>): VendorProfile {
    const vendor = this.db.vendors.find((v) => v.id === vendorId);
    if (!vendor) throw new Error('Vendor not found.');

    if (patch.zone && patch.zone !== vendor.zone && patch.lat === undefined && patch.lng === undefined) {
      const z = LUCKNOW_ZONES.find((item) => item.name.toLowerCase() === patch.zone!.toLowerCase());
      if (z) {
        vendor.lat = z.lat;
        vendor.lng = z.lng;
      }
    }

    Object.assign(vendor, patch, { id: vendor.id, userId: vendor.userId });
    this.save();
    return vendor;
  }

  public getInventory(vendorId: string): {
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
  } {
    const items = this.db.products
      .filter((p) => p.vendorId === vendorId)
      .map((p) => ({
        ...p,
        status: computeProductStatus(p.availableQuantity, p.minStockThreshold, p.predictedDailyDemand),
        marginPct: computeMarginPct(p.costPrice, p.sellingPrice),
      }));

    const recommendations: StockRecommendation[] = items
      .map((p) => {
        const delta = p.predictedDailyDemand - p.availableQuantity;
        let action: StockRecommendation['action'] = 'Hold Steady';
        let reason = 'Stock aligns closely with projected evening demand.';
        if (delta > 8) {
          action = 'Prepare More';
          reason = `Projected to run short by ${delta} ${p.unit} before evening rush.`;
        } else if (delta < -18) {
          action = 'Reduce Batch';
          reason = `Holding ${Math.abs(delta)} excess ${p.unit} above expected daily pull; trim next prep to avoid waste.`;
        }
        return {
          productId: p.id,
          productName: p.name,
          unit: p.unit,
          currentStock: p.availableQuantity,
          predictedDemand: p.predictedDailyDemand,
          delta,
          action,
          reason,
        };
      })
      .filter((r) => r.action !== 'Hold Steady')
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    const summary = {
      totalSkus: items.length,
      inStock: items.filter((i) => i.status === 'In Stock').length,
      lowStock: items.filter((i) => i.status === 'Low Stock').length,
      outOfStock: items.filter((i) => i.status === 'Out of Stock').length,
      overstocked: items.filter((i) => i.status === 'Overstocked').length,
      inventoryValue: items.reduce((sum, i) => sum + i.availableQuantity * i.costPrice, 0),
    };

    return { items, recommendations, summary };
  }

  public createProduct(
    vendorId: string,
    input: {
      name: string;
      category: string;
      unit: string;
      availableQuantity: number;
      costPrice: number;
      sellingPrice: number;
      minStockThreshold: number;
      expiryDate: string;
    }
  ): Product {
    const predictedDailyDemand = Math.max(
      15,
      Math.round(Math.max(input.availableQuantity, input.minStockThreshold * 1.6))
    );
    const product: Product = {
      id: `prod-${crypto.randomUUID()}`,
      vendorId,
      name: input.name.trim(),
      category: input.category.trim() || 'Chaat & Street Snacks',
      unit: input.unit.trim() || 'plates',
      availableQuantity: Math.max(0, Number(input.availableQuantity) || 0),
      costPrice: Math.max(0, Number(input.costPrice) || 0),
      sellingPrice: Math.max(0, Number(input.sellingPrice) || 0),
      minStockThreshold: Math.max(1, Number(input.minStockThreshold) || 10),
      expiryDate: input.expiryDate || isoDateDaysAhead(1),
      status: 'In Stock',
      marginPct: computeMarginPct(Number(input.costPrice) || 0, Number(input.sellingPrice) || 0),
      predictedDailyDemand,
    };
    product.status = computeProductStatus(
      product.availableQuantity,
      product.minStockThreshold,
      product.predictedDailyDemand
    );
    this.db.products.unshift(product);
    this.save();
    return product;
  }

  public updateProduct(vendorId: string, productId: string, patch: Partial<Product>): Product {
    const product = this.db.products.find((p) => p.id === productId && p.vendorId === vendorId);
    if (!product) throw new Error('Product not found.');

    if (patch.name !== undefined) product.name = patch.name.trim();
    if (patch.category !== undefined) product.category = patch.category.trim();
    if (patch.unit !== undefined) product.unit = patch.unit.trim();
    if (patch.availableQuantity !== undefined)
      product.availableQuantity = Math.max(0, Number(patch.availableQuantity));
    if (patch.costPrice !== undefined) product.costPrice = Math.max(0, Number(patch.costPrice));
    if (patch.sellingPrice !== undefined)
      product.sellingPrice = Math.max(0, Number(patch.sellingPrice));
    if (patch.minStockThreshold !== undefined)
      product.minStockThreshold = Math.max(0, Number(patch.minStockThreshold));
    if (patch.expiryDate !== undefined) product.expiryDate = patch.expiryDate;

    product.marginPct = computeMarginPct(product.costPrice, product.sellingPrice);
    product.status = computeProductStatus(
      product.availableQuantity,
      product.minStockThreshold,
      product.predictedDailyDemand
    );
    this.save();
    return product;
  }

  public deleteProduct(vendorId: string, productId: string): void {
    const before = this.db.products.length;
    this.db.products = this.db.products.filter((p) => !(p.id === productId && p.vendorId === vendorId));
    if (this.db.products.length === before) throw new Error('Product not found.');
    this.save();
  }

  public getSalesAndExpenses(
    vendorId: string,
    filters?: { from?: string; to?: string; productId?: string }
  ): {
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
  } {
    const sales = this.db.sales
      .filter((s) => {
        if (s.vendorId !== vendorId) return false;
        if (filters?.from && s.saleDate < filters.from) return false;
        if (filters?.to && s.saleDate > filters.to) return false;
        if (filters?.productId && s.productId !== filters.productId) return false;
        return true;
      })
      .sort((a, b) => (a.saleDate < b.saleDate ? 1 : -1));

    const expenses = this.db.expenses
      .filter((e) => {
        if (e.vendorId !== vendorId) return false;
        if (filters?.from && e.expenseDate < filters.from) return false;
        if (filters?.to && e.expenseDate > filters.to) return false;
        return true;
      })
      .sort((a, b) => (a.expenseDate < b.expenseDate ? 1 : -1));

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.totalProfit, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalUnits = sales.reduce((sum, s) => sum + s.quantity, 0);
    const upiRevenue = sales
      .filter((s) => s.paymentMethod === 'UPI')
      .reduce((sum, s) => sum + s.totalRevenue, 0);
    const cashRevenue = totalRevenue - upiRevenue;

    return {
      sales,
      expenses,
      totals: {
        totalRevenue,
        totalProfit,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        totalUnits,
        upiRevenue,
        cashRevenue,
      },
    };
  }

  public createSale(
    vendorId: string,
    input: {
      productId?: string | null;
      productName: string;
      category?: string;
      quantity: number;
      unitPrice: number;
      unitCost?: number;
      paymentMethod: 'UPI' | 'Cash';
      hourSlot?: string;
      saleDate?: string;
    }
  ): SaleRecord {
    const prod = input.productId
      ? this.db.products.find((p) => p.id === input.productId && p.vendorId === vendorId)
      : undefined;

    const quantity = Math.max(1, Number(input.quantity) || 1);
    const unitPrice = Math.max(0, Number(input.unitPrice) || prod?.sellingPrice || 0);
    const unitCost =
      input.unitCost !== undefined
        ? Math.max(0, Number(input.unitCost))
        : prod?.costPrice ?? Math.round(unitPrice * 0.42);

    const record: SaleRecord = {
      id: `sale-${crypto.randomUUID()}`,
      vendorId,
      productId: prod?.id ?? null,
      productName: prod?.name || input.productName.trim() || 'Walk-in Order',
      category: prod?.category || input.category || 'Chaat & Street Snacks',
      quantity,
      unitPrice,
      unitCost,
      totalRevenue: quantity * unitPrice,
      totalProfit: quantity * (unitPrice - unitCost),
      paymentMethod: input.paymentMethod === 'Cash' ? 'Cash' : 'UPI',
      hourSlot: input.hourSlot || '5–8 PM',
      saleDate: input.saleDate || isoDateDaysAgo(0),
    };

    if (prod) {
      prod.availableQuantity = Math.max(0, prod.availableQuantity - quantity);
      prod.status = computeProductStatus(
        prod.availableQuantity,
        prod.minStockThreshold,
        prod.predictedDailyDemand
      );
    }

    this.db.sales.unshift(record);
    this.save();
    return record;
  }

  public deleteSale(vendorId: string, saleId: string): void {
    this.db.sales = this.db.sales.filter((s) => !(s.id === saleId && s.vendorId === vendorId));
    this.save();
  }

  public createExpense(
    vendorId: string,
    input: {
      title: string;
      category: ExpenseRecord['category'];
      amount: number;
      expenseDate?: string;
      notes?: string;
    }
  ): ExpenseRecord {
    const record: ExpenseRecord = {
      id: `exp-${crypto.randomUUID()}`,
      vendorId,
      title: input.title.trim(),
      category: input.category || 'Mandi Ingredients',
      amount: Math.max(0, Number(input.amount) || 0),
      expenseDate: input.expenseDate || isoDateDaysAgo(0),
      notes: input.notes?.trim() || '',
    };
    this.db.expenses.unshift(record);
    this.save();
    return record;
  }

  public deleteExpense(vendorId: string, expenseId: string): void {
    this.db.expenses = this.db.expenses.filter((e) => !(e.id === expenseId && e.vendorId === vendorId));
    this.save();
  }

  public getWaste(
    vendorId: string,
    filters?: { from?: string; to?: string }
  ): {
    records: WasteRecord[];
    summary: {
      totalLoss: number;
      totalUnitsWasted: number;
      topWasteShift: string;
      potentialMonthlySavings: number;
    };
    dailyTrend: Array<{ date: string; loss: number; units: number }>;
    recommendations: string[];
  } {
    const records = this.db.waste
      .filter((w) => {
        if (w.vendorId !== vendorId) return false;
        if (filters?.from && w.wasteDate < filters.from) return false;
        if (filters?.to && w.wasteDate > filters.to) return false;
        return true;
      })
      .sort((a, b) => (a.wasteDate < b.wasteDate ? 1 : -1));

    const totalLoss = records.reduce((s, r) => s + r.estimatedLoss, 0);
    const totalUnitsWasted = records.reduce((s, r) => s + r.quantityWasted, 0);

    const byShift = new Map<string, number>();
    const byDate = new Map<string, { loss: number; units: number }>();
    const byProduct = new Map<string, number>();

    for (const r of records) {
      byShift.set(r.shift, (byShift.get(r.shift) || 0) + r.estimatedLoss);
      byProduct.set(r.productName, (byProduct.get(r.productName) || 0) + r.estimatedLoss);
      const prev = byDate.get(r.wasteDate) || { loss: 0, units: 0 };
      byDate.set(r.wasteDate, { loss: prev.loss + r.estimatedLoss, units: prev.units + r.quantityWasted });
    }

    let topWasteShift = 'Night';
    let maxShiftLoss = -1;
    for (const [shift, loss] of byShift.entries()) {
      if (loss > maxShiftLoss) {
        maxShiftLoss = loss;
        topWasteShift = shift;
      }
    }

    const dailyTrend = Array.from(byDate.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .slice(-14)
      .map(([date, vals]) => ({ date: date.slice(5), loss: vals.loss, units: vals.units }));

    const topProduct = Array.from(byProduct.entries()).sort((a, b) => b[1] - a[1])[0];
    const recommendations: string[] = [];
    if (topProduct) {
      recommendations.push(
        `Trim ${topProduct[0]} final prep batch by 15% before the ${topWasteShift} shift — accounts for ₹${Math.round(topProduct[1])} in logged loss.`
      );
    }
    recommendations.push(
      `Switch ${topWasteShift} shift prep to two smaller 45-minute waves after 8:15 PM to avoid unsold perishable plates.`
    );
    recommendations.push(
      'Bundle slow-moving Bun Maska or Samosa plates with Kulhad Masala Chai at ₹5 off after 8:45 PM to clear remaining stock.'
    );

    return {
      records,
      summary: {
        totalLoss,
        totalUnitsWasted,
        topWasteShift,
        potentialMonthlySavings: Math.round(totalLoss * 0.45),
      },
      dailyTrend,
      recommendations,
    };
  }

  public createWaste(
    vendorId: string,
    input: {
      productId?: string | null;
      productName: string;
      quantityWasted: number;
      estimatedLoss?: number;
      shift: WasteRecord['shift'];
      reason: string;
      wasteDate?: string;
    }
  ): WasteRecord {
    const prod = input.productId
      ? this.db.products.find((p) => p.id === input.productId && p.vendorId === vendorId)
      : undefined;

    const qty = Math.max(1, Number(input.quantityWasted) || 1);
    const estimatedLoss =
      input.estimatedLoss !== undefined && input.estimatedLoss !== null && !Number.isNaN(Number(input.estimatedLoss))
        ? Math.max(0, Number(input.estimatedLoss))
        : prod
          ? qty * prod.costPrice
          : qty * 18;

    const record: WasteRecord = {
      id: `waste-${crypto.randomUUID()}`,
      vendorId,
      productId: prod?.id ?? null,
      productName: prod?.name || input.productName.trim() || 'Unsold Batch',
      unit: prod?.unit || 'units',
      quantityWasted: qty,
      estimatedLoss,
      shift: input.shift || 'Night',
      reason: input.reason.trim() || 'Unsold end-of-shift batch',
      wasteDate: input.wasteDate || isoDateDaysAgo(0),
    };

    this.db.waste.unshift(record);
    this.save();
    return record;
  }

  public deleteWaste(vendorId: string, wasteId: string): void {
    this.db.waste = this.db.waste.filter((w) => !(w.id === wasteId && w.vendorId === vendorId));
    this.save();
  }

  public createForecast(
    vendorId: string,
    input: {
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
    }
  ): { forecast: ForecastRecord; dataPointsUsed: number } {
    const matchingSales = this.db.sales.filter(
      (s) =>
        s.vendorId === vendorId &&
        ((input.productId && s.productId === input.productId) ||
          s.productName.toLowerCase() === input.productName.trim().toLowerCase())
    );

    const dataPointsUsed = matchingSales.length;
    const historyAvg =
      dataPointsUsed > 0
        ? Math.round(matchingSales.reduce((s, r) => s + r.quantity, 0) / dataPointsUsed)
        : Math.max(10, Number(input.historicalDailyAvg) || 60);

    const baseAvg =
      dataPointsUsed > 0
        ? Math.round(historyAvg * 0.65 + (Number(input.historicalDailyAvg) || historyAvg) * 0.35)
        : Math.max(10, Number(input.historicalDailyAvg) || 60);

    let mult = 1.0;
    const factors: Array<{ label: string; impact: string }> = [];

    if (input.dayOfWeek === 'Saturday' || input.dayOfWeek === 'Sunday') {
      mult *= 1.22;
      factors.push({ label: `${input.dayOfWeek} Weekend Lift`, impact: '+22%' });
    } else if (input.dayOfWeek === 'Friday') {
      mult *= 1.1;
      factors.push({ label: 'Friday Evening Pull', impact: '+10%' });
    }

    const isHotItem = /chai|tea|tikki|samosa|chaat|kebab|bun/i.test(
      `${input.productName} ${input.category}`
    );
    if (input.weather === 'Rainy') {
      const m = isHotItem ? 1.24 : 0.84;
      mult *= m;
      factors.push({
        label: 'Rainy Lucknow Weather',
        impact: m >= 1 ? '+24%' : '-16%',
      });
    } else if (input.weather === 'Cool Evening') {
      const m = isHotItem ? 1.16 : 0.92;
      mult *= m;
      factors.push({
        label: 'Cool Evening Breeze',
        impact: m >= 1 ? '+16%' : '-8%',
      });
    } else if (input.weather === 'Warm Afternoon') {
      const m = /lassi|kulfi|puri|cold|drink/i.test(`${input.productName} ${input.category}`) ? 1.2 : 0.94;
      mult *= m;
      factors.push({
        label: 'Warm Afternoon Heat',
        impact: m >= 1 ? '+20%' : '-6%',
      });
    }

    if (input.localEvent && input.localEvent !== 'Normal Weekday') {
      const eventLift = /festival|diwali|eid|holi|mahotsav|match/i.test(input.localEvent) ? 1.28 : 1.12;
      mult *= eventLift;
      factors.push({
        label: input.localEvent,
        impact: `+${Math.round((eventLift - 1) * 100)}%`,
      });
    }

    const footfallRatio = Math.min(1.45, Math.max(0.7, (Number(input.expectedFootfall) || 4500) / 4800));
    if (Math.abs(footfallRatio - 1) >= 0.05) {
      mult *= footfallRatio;
      const pct = Math.round((footfallRatio - 1) * 100);
      factors.push({
        label: `${input.zone} Footfall Index`,
        impact: `${pct >= 0 ? '+' : ''}${pct}%`,
      });
    }

    const predictedUnits = Math.max(5, Math.round(baseAvg * mult));
    const optimalPrepUnits = Math.round(predictedUnits * 1.04);
    const sellingPrice = Math.max(1, Number(input.sellingPrice) || 30);
    const expectedRevenue = predictedUnits * sellingPrice;
    const confidencePct = Math.min(95, 76 + Math.min(18, Math.round(dataPointsUsed * 0.65)));

    const forecast: ForecastRecord = {
      id: `fc-${crypto.randomUUID()}`,
      vendorId,
      productId: input.productId || null,
      productName: input.productName.trim(),
      category: input.category,
      zone: input.zone,
      dayOfWeek: input.dayOfWeek,
      weather: input.weather,
      localEvent: input.localEvent,
      expectedFootfall: Number(input.expectedFootfall) || 4800,
      historicalDailyAvg: baseAvg,
      sellingPrice,
      predictedUnits,
      optimalPrepUnits,
      expectedRevenue,
      confidencePct,
      isBaseline: dataPointsUsed === 0,
      factors,
      advisory:
        predictedUnits > baseAvg * 1.15
          ? `High demand surge projected (+${Math.round(((predictedUnits - baseAvg) / baseAvg) * 100)}%). Stage ${Math.round(optimalPrepUnits * 0.65)} ${input.productName} units ahead of 5 PM rush and hold 35% as fresh reserve.`
          : `Steady demand projected in ${input.zone}. Prepare ${optimalPrepUnits} units in two split batches to maintain crispness and keep waste under 3%.`,
      createdAt: new Date().toISOString(),
    };

    this.db.forecasts.unshift(forecast);

    // Sync predictedDailyDemand on matching SKU if present
    if (input.productId) {
      const prod = this.db.products.find((p) => p.id === input.productId && p.vendorId === vendorId);
      if (prod) {
        prod.predictedDailyDemand = predictedUnits;
        prod.status = computeProductStatus(
          prod.availableQuantity,
          prod.minStockThreshold,
          prod.predictedDailyDemand
        );
      }
    }

    this.save();
    return { forecast, dataPointsUsed };
  }

  public getForecastHistory(vendorId: string): ForecastRecord[] {
    return this.db.forecasts
      .filter((f) => f.vendorId === vendorId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 20);
  }

  public getReports(vendorId: string, filters?: { from?: string; to?: string }) {
    const { sales, expenses, totals } = this.getSalesAndExpenses(vendorId, filters);
    const { summary: wasteSummary } = this.getWaste(vendorId, filters);

    const byCategory = new Map<string, { revenue: number; profit: number; units: number }>();
    for (const s of sales) {
      const cur = byCategory.get(s.category) || { revenue: 0, profit: 0, units: 0 };
      byCategory.set(s.category, {
        revenue: cur.revenue + s.totalRevenue,
        profit: cur.profit + s.totalProfit,
        units: cur.units + s.quantity,
      });
    }

    const cogs = Math.max(0, totals.totalRevenue - totals.totalProfit);
    const netAfterWaste = totals.totalRevenue - totals.totalExpenses - wasteSummary.totalLoss;
    const netMarginPct =
      totals.totalRevenue > 0 ? Math.round((netAfterWaste / totals.totalRevenue) * 100) : 0;

    return {
      summary: {
        grossRevenue: totals.totalRevenue,
        cogs,
        grossProfit: totals.totalProfit,
        operatingExpenses: totals.totalExpenses,
        wasteLoss: wasteSummary.totalLoss,
        netProfit: netAfterWaste,
        netMarginPct,
        totalUnits: totals.totalUnits,
        upiSharePct:
          totals.totalRevenue > 0 ? Math.round((totals.upiRevenue / totals.totalRevenue) * 100) : 0,
        upiRevenue: totals.upiRevenue,
        cashRevenue: totals.cashRevenue,
      },
      categoryBreakdown: Array.from(byCategory.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
      sales,
      expenses,
    };
  }

  public getDashboard(vendor: VendorProfile): DashboardPayload {
    const weather = getLucknowWeather();
    const todayStr = isoDateDaysAgo(0);
    const yesterdayStr = isoDateDaysAgo(1);
    const sevenDaysAgo = isoDateDaysAgo(6);
    const fourteenDaysAgo = isoDateDaysAgo(13);

    const vendorSales = this.db.sales.filter((s) => s.vendorId === vendor.id);
    const vendorExpenses = this.db.expenses.filter((e) => e.vendorId === vendor.id);
    const vendorWaste = this.db.waste.filter((w) => w.vendorId === vendor.id);
    const { items: products } = this.getInventory(vendor.id);

    const todaySales = vendorSales.filter((s) => s.saleDate === todayStr);
    const yesterdaySales = vendorSales.filter((s) => s.saleDate === yesterdayStr);
    const todayRevenue = todaySales.reduce((s, r) => s + r.totalRevenue, 0);
    const yesterdayRevenue = yesterdaySales.reduce((s, r) => s + r.totalRevenue, 0);
    const todayRevenueDeltaPct =
      yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;

    const totalUnitsSold = vendorSales
      .filter((s) => s.saleDate >= sevenDaysAgo)
      .reduce((s, r) => s + r.quantity, 0);

    const predictedDemandToday = products.reduce((s, p) => s + p.predictedDailyDemand, 0);
    const lowStockCount = products.filter(
      (p) => p.status === 'Low Stock' || p.status === 'Out of Stock'
    ).length;

    const wasteLoss7d = vendorWaste
      .filter((w) => w.wasteDate >= sevenDaysAgo)
      .reduce((s, w) => s + w.estimatedLoss, 0);
    const wasteLossPrev7d = vendorWaste
      .filter((w) => w.wasteDate >= fourteenDaysAgo && w.wasteDate < sevenDaysAgo)
      .reduce((s, w) => s + w.estimatedLoss, 0);
    const wasteReductionPct =
      wasteLossPrev7d > 0
        ? Math.round(((wasteLossPrev7d - wasteLoss7d) / wasteLossPrev7d) * 100)
        : 0;

    const zoneObj =
      LUCKNOW_ZONES.find((z) => z.name.toLowerCase() === vendor.zone.toLowerCase()) || LUCKNOW_ZONES[0];

    // Weekly sales (last 7 days)
    const weeklySales: DashboardPayload['weeklySales'] = [];
    for (let d = 6; d >= 0; d--) {
      const dateStr = isoDateDaysAgo(d);
      const daySales = vendorSales.filter((s) => s.saleDate === dateStr);
      const label = new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short' });
      weeklySales.push({
        date: dateStr,
        label,
        revenue: daySales.reduce((s, r) => s + r.totalRevenue, 0),
        profit: daySales.reduce((s, r) => s + r.totalProfit, 0),
        units: daySales.reduce((s, r) => s + r.quantity, 0),
      });
    }

    // Monthly revenue vs expenses (4 weekly buckets)
    const monthlyRevenueVsExpenses: DashboardPayload['monthlyRevenueVsExpenses'] = [];
    for (let w = 3; w >= 0; w--) {
      const start = isoDateDaysAgo(w * 7 + 6);
      const end = isoDateDaysAgo(w * 7);
      const rev = vendorSales
        .filter((s) => s.saleDate >= start && s.saleDate <= end)
        .reduce((sum, s) => sum + s.totalRevenue, 0);
      const exp = vendorExpenses
        .filter((e) => e.expenseDate >= start && e.expenseDate <= end)
        .reduce((sum, e) => sum + e.amount, 0);
      monthlyRevenueVsExpenses.push({
        week: w === 0 ? 'This Week' : `Week -${w}`,
        revenue: rev,
        expenses: exp,
        net: rev - exp,
      });
    }

    const stockVsDemand = products.slice(0, 6).map((p) => ({
      name: p.name.length > 16 ? p.name.slice(0, 15) + '…' : p.name,
      stock: p.availableQuantity,
      demand: p.predictedDailyDemand,
    }));

    const slotWeights: Record<string, number> = {
      '8–11 AM': 0.16,
      '11 AM–2 PM': 0.19,
      '2–5 PM': 0.17,
      '5–8 PM': 0.31,
      '8–10 PM': 0.17,
    };
    const peakHours = Object.entries(slotWeights).map(([slot, weight]) => {
      const slotUnits = vendorSales
        .filter((s) => s.saleDate >= sevenDaysAgo && s.hourSlot === slot)
        .reduce((sum, s) => sum + s.quantity, 0);
      return {
        slot,
        orders: Math.round(slotUnits / 7),
        footfall: Math.round(zoneObj.demoFootfallDaily * weight),
      };
    });

    const prodAgg = new Map<
      string,
      { name: string; category: string; unitsSold: number; revenue: number; profit: number }
    >();
    for (const s of vendorSales.filter((r) => r.saleDate >= sevenDaysAgo)) {
      const cur = prodAgg.get(s.productName) || {
        name: s.productName,
        category: s.category,
        unitsSold: 0,
        revenue: 0,
        profit: 0,
      };
      cur.unitsSold += s.quantity;
      cur.revenue += s.totalRevenue;
      cur.profit += s.totalProfit;
      prodAgg.set(s.productName, cur);
    }

    const bestProducts = Array.from(prodAgg.values())
      .map((p) => ({
        ...p,
        marginPct: p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const cached = this.db.cachedInsights[vendor.id];
    const defaultRuleInsights: AiInsightItem[] = [
      {
        title:
          lowStockCount > 0
            ? `Restock ${lowStockCount} low-inventory SKU${lowStockCount > 1 ? 's' : ''} before 5 PM rush`
            : 'Inventory levels ready for evening peak',
        category: 'Inventory',
        impact: lowStockCount > 0 ? 'Prevents ~₹2,400 missed rush sales' : 'Zero stockout risk today',
        action:
          products.find((p) => p.status === 'Out of Stock' || p.status === 'Low Stock')
            ? `Top up ${products.find((p) => p.status === 'Out of Stock' || p.status === 'Low Stock')!.name} immediately to meet projected demand.`
            : 'Keep current prep cadence and monitor 5–8 PM velocity.',
      },
      {
        title: 'Capitalize on 5–8 PM Hazratganj chai peak',
        category: 'Demand',
        impact: '+18% projected evening beverage lift',
        action: weather.demandSignal,
      },
      {
        title: 'Trim late-night perishable batch sizes',
        category: 'Waste',
        impact: `₹${Math.round(wasteLoss7d * 0.4)} weekly waste savings`,
        action: 'Split post-8:30 PM fried snack prep into smaller 15-plate cycles.',
      },
    ];

    return {
      weather,
      kpis: {
        todayRevenue,
        todayRevenueDeltaPct,
        totalUnitsSold,
        predictedDemandToday,
        lowStockCount,
        totalSkus: products.length,
        wasteLoss7d,
        wasteReductionPct,
        zoneDailyFootfall: zoneObj.demoFootfallDaily,
        zoneName: zoneObj.name,
      },
      weeklySales,
      monthlyRevenueVsExpenses,
      stockVsDemand,
      peakHours,
      bestProducts,
      insights: cached?.items || defaultRuleInsights,
      lastAiUpdatedAt: cached?.updatedAt || null,
    };
  }

  public saveAiInsights(vendorId: string, items: AiInsightItem[]): string {
    const updatedAt = new Date().toISOString();
    this.db.cachedInsights[vendorId] = { items, updatedAt };
    this.save();
    return updatedAt;
  }

  public getLocationData(vendor: VendorProfile) {
    const vendorSales = this.db.sales.filter((s) => s.vendorId === vendor.id);
    const recordedRevenue = vendorSales.reduce((s, r) => s + r.totalRevenue, 0);

    return {
      vendorLocation: {
        businessName: vendor.businessName,
        zone: vendor.zone,
        address: vendor.address,
        lat: vendor.lat,
        lng: vendor.lng,
        recordedRevenue,
      },
      zones: LUCKNOW_ZONES,
      disclaimer:
        'Zone footfall indices represent modeled Lucknow commercial averages for vendor planning alongside your live recorded stall revenue.',
    };
  }

  public getLocationRecommendations(vendor: VendorProfile) {
    const currentZone =
      LUCKNOW_ZONES.find((z) => z.name.toLowerCase() === vendor.zone.toLowerCase()) || LUCKNOW_ZONES[0];

    const recommendations = LUCKNOW_ZONES.filter((z) => z.id !== currentZone.id)
      .map((z) => {
        const categoryMatch = z.topCategories.some((c) =>
          c.toLowerCase().includes(vendor.foodCategory.split(' ')[0].toLowerCase())
        );
        const competitionBonus = z.competitionLevel === 'Low' ? 14 : z.competitionLevel === 'Moderate' ? 7 : 0;
        const opportunityScore = Math.min(
          98,
          Math.round((z.demoFootfallDaily / 65) + (categoryMatch ? 12 : 4) + competitionBonus)
        );
        return {
          zoneId: z.id,
          zoneName: z.name,
          hindiName: z.hindiName,
          opportunityScore,
          peakHours: z.peakHours,
          avgTicketInr: z.avgTicketInr,
          competitionLevel: z.competitionLevel,
          rationale: categoryMatch
            ? `Strong fit for ${vendor.foodCategory} with ${z.demoFootfallDaily.toLocaleString('en-IN')} daily footfall and ${z.competitionLevel.toLowerCase()} competition around ${z.commercialHubs[0]}.`
            : `High evening footfall near ${z.commercialHubs[0]} with ₹${z.avgTicketInr} average ticket size.`,
        };
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore);

    return { currentZone: currentZone.name, recommendations };
  }
}

export const store = new BrainBazaarStore();
