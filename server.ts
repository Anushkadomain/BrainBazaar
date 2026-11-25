import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import type { User, VendorProfile } from './src/types';
import { generateVendorGeminiInsights } from './server/gemini';
import { getLucknowWeather, LUCKNOW_ZONES } from './server/lucknowData';
import { store } from './server/store';

interface AuthedRequest extends Request {
  auth?: { user: User; vendor: VendorProfile };
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const auth = store.getAuthByToken(token);
  if (!auth) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.auth = auth;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Auth routes
  app.post('/api/auth/register', (req, res) => {
    try {
      const result = store.register(req.body || {});
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Registration failed.' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body || {};
      const result = store.login(String(email || ''), String(password || ''));
      res.json(result);
    } catch (err) {
      res.status(401).json({ error: err instanceof Error ? err.message : 'Login failed.' });
    }
  });

  app.post('/api/auth/demo', (_req, res) => {
    const result = store.loginDemo();
    res.json(result);
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: req.auth!.user, vendor: req.auth!.vendor });
  });

  app.put('/api/auth/password', requireAuth, (req: AuthedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body || {};
      store.changePassword(req.auth!.user.id, String(currentPassword || ''), String(newPassword || ''));
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to update password.' });
    }
  });

  // Vendor routes
  app.post('/api/vendor/onboarding', requireAuth, (req: AuthedRequest, res) => {
    try {
      const vendor = store.updateVendor(req.auth!.vendor.id, {
        ...req.body,
        onboardingComplete: true,
      });
      res.json({ vendor });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Onboarding failed.' });
    }
  });

  app.put('/api/vendor/profile', requireAuth, (req: AuthedRequest, res) => {
    try {
      const vendor = store.updateVendor(req.auth!.vendor.id, req.body || {});
      res.json({ vendor });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Profile update failed.' });
    }
  });

  app.put('/api/vendor/settings', requireAuth, (req: AuthedRequest, res) => {
    try {
      const vendor = store.updateVendor(req.auth!.vendor.id, req.body || {});
      res.json({ vendor });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Settings update failed.' });
    }
  });

  app.post('/api/vendor/reset-demo', requireAuth, (req: AuthedRequest, res) => {
    if (!req.auth!.user.isDemo) {
      res.status(403).json({ error: 'Demo reset is available only in Demo Vendor Mode.' });
      return;
    }
    const result = store.resetDemoData();
    res.json(result);
  });

  // Dashboard, Weather & Gemini Insights
  app.get('/api/weather', requireAuth, (_req, res) => {
    res.json(getLucknowWeather());
  });

  app.get('/api/dashboard', requireAuth, (req: AuthedRequest, res) => {
    res.json(store.getDashboard(req.auth!.vendor));
  });

  app.post('/api/insights/ai', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const vendor = req.auth!.vendor;
      const dash = store.getDashboard(vendor);
      const { items: products } = store.getInventory(vendor.id);
      const lowStockItems = products
        .filter((p) => p.status === 'Low Stock' || p.status === 'Out of Stock')
        .map((p) => ({
          name: p.name,
          stock: p.availableQuantity,
          predictedDemand: p.predictedDailyDemand,
          unit: p.unit,
        }));

      const weeklyRevenue = dash.weeklySales.reduce((s, d) => s + d.revenue, 0);
      const weeklyProfit = dash.weeklySales.reduce((s, d) => s + d.profit, 0);

      const insights = await generateVendorGeminiInsights({
        businessName: vendor.businessName,
        zone: vendor.zone,
        foodCategory: vendor.foodCategory,
        language: vendor.language,
        todayRevenue: dash.kpis.todayRevenue,
        weeklyRevenue,
        weeklyProfit,
        wasteLoss7d: dash.kpis.wasteLoss7d,
        lowStockItems,
        topProducts: dash.bestProducts,
        weatherCondition: dash.weather.condition,
        weatherSignal: dash.weather.demandSignal,
      });

      const updatedAt = store.saveAiInsights(vendor.id, insights);
      res.json({ insights, updatedAt });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate Gemini insights.';
      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      res.status(status).json({ error: message });
    }
  });

  // Inventory & Products
  app.get('/api/inventory', requireAuth, (req: AuthedRequest, res) => {
    res.json(store.getInventory(req.auth!.vendor.id));
  });

  app.post('/api/products', requireAuth, (req: AuthedRequest, res) => {
    try {
      const product = store.createProduct(req.auth!.vendor.id, req.body || {});
      res.status(201).json({ product });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to add product.' });
    }
  });

  app.put('/api/products/:id', requireAuth, (req: AuthedRequest, res) => {
    try {
      const product = store.updateProduct(req.auth!.vendor.id, String(req.params.id), req.body || {});
      res.json({ product });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to update product.' });
    }
  });

  app.delete('/api/products/:id', requireAuth, (req: AuthedRequest, res) => {
    try {
      store.deleteProduct(req.auth!.vendor.id, String(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.status(404).json({ error: err instanceof Error ? err.message : 'Product not found.' });
    }
  });

  // Sales, Expenses & Reports
  app.get('/api/sales', requireAuth, (req: AuthedRequest, res) => {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const productId = typeof req.query.productId === 'string' ? req.query.productId : undefined;
    res.json(store.getSalesAndExpenses(req.auth!.vendor.id, { from, to, productId }));
  });

  app.post('/api/sales', requireAuth, (req: AuthedRequest, res) => {
    try {
      const sale = store.createSale(req.auth!.vendor.id, req.body || {});
      res.status(201).json({ sale });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to record sale.' });
    }
  });

  app.delete('/api/sales/:id', requireAuth, (req: AuthedRequest, res) => {
    store.deleteSale(req.auth!.vendor.id, String(req.params.id));
    res.json({ ok: true });
  });

  app.post('/api/expenses', requireAuth, (req: AuthedRequest, res) => {
    try {
      const expense = store.createExpense(req.auth!.vendor.id, req.body || {});
      res.status(201).json({ expense });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to record expense.' });
    }
  });

  app.delete('/api/expenses/:id', requireAuth, (req: AuthedRequest, res) => {
    store.deleteExpense(req.auth!.vendor.id, String(req.params.id));
    res.json({ ok: true });
  });

  app.get('/api/sales/reports', requireAuth, (req: AuthedRequest, res) => {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    res.json(store.getReports(req.auth!.vendor.id, { from, to }));
  });

  // Forecast
  app.post('/api/forecast', requireAuth, (req: AuthedRequest, res) => {
    try {
      const result = store.createForecast(req.auth!.vendor.id, req.body || {});
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Forecast failed.' });
    }
  });

  app.get('/api/forecast/history', requireAuth, (req: AuthedRequest, res) => {
    res.json({ forecasts: store.getForecastHistory(req.auth!.vendor.id) });
  });

  // Waste
  app.get('/api/waste', requireAuth, (req: AuthedRequest, res) => {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    res.json(store.getWaste(req.auth!.vendor.id, { from, to }));
  });

  app.post('/api/waste', requireAuth, (req: AuthedRequest, res) => {
    try {
      const record = store.createWaste(req.auth!.vendor.id, req.body || {});
      res.status(201).json({ record });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to log waste.' });
    }
  });

  app.delete('/api/waste/:id', requireAuth, (req: AuthedRequest, res) => {
    store.deleteWaste(req.auth!.vendor.id, String(req.params.id));
    res.json({ ok: true });
  });

  // Locations & Geocoding
  app.get('/api/locations', requireAuth, (req: AuthedRequest, res) => {
    res.json(store.getLocationData(req.auth!.vendor));
  });

  app.get('/api/locations/recommendations', requireAuth, (req: AuthedRequest, res) => {
    res.json(store.getLocationRecommendations(req.auth!.vendor));
  });

  app.get('/api/locations/geocode', requireAuth, async (req, res) => {
    const query = String(req.query.q || '').trim();
    if (!query) {
      res.status(400).json({ error: 'Search query is required.' });
      return;
    }

    // Check known Lucknow zones & hubs first for instant precision
    const lower = query.toLowerCase();
    const matchedZone = LUCKNOW_ZONES.find(
      (z) =>
        z.name.toLowerCase().includes(lower) ||
        z.commercialHubs.some((h) => h.toLowerCase().includes(lower))
    );
    if (matchedZone) {
      res.json({
        displayName: `${matchedZone.name}, Lucknow, Uttar Pradesh`,
        lat: matchedZone.lat,
        lng: matchedZone.lng,
        zoneName: matchedZone.name,
      });
      return;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        `${query}, Lucknow, Uttar Pradesh, India`
      )}`;
      const upstream = await fetch(url, {
        headers: { 'User-Agent': 'BrainBazaarVendorIntelligence/1.0' },
      });
      const results = (await upstream.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
      }>;
      if (results && results.length > 0) {
        res.json({
          displayName: results[0].display_name,
          lat: Number(results[0].lat),
          lng: Number(results[0].lon),
        });
        return;
      }
      res.status(404).json({ error: 'No matching Lucknow locality found. Try Hazratganj, Aminabad, Chowk, or Gomti Nagar.' });
    } catch {
      res.status(502).json({
        error: 'Unable to reach geocoding service right now. Try selecting one of the Lucknow zones listed below.',
      });
    }
  });

  // Frontend serving (Vite dev middleware vs production dist)
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BrainBazaar server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
