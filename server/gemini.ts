import { GoogleGenAI, Type } from '@google/genai';
import type { AiInsightItem, Language } from '../src/types';

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add a valid Gemini API key in Settings > Secrets to generate live Gemini insights.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface VendorInsightContext {
  businessName: string;
  zone: string;
  foodCategory: string;
  language: Language;
  todayRevenue: number;
  weeklyRevenue: number;
  weeklyProfit: number;
  wasteLoss7d: number;
  lowStockItems: Array<{ name: string; stock: number; predictedDemand: number; unit: string }>;
  topProducts: Array<{ name: string; unitsSold: number; revenue: number; marginPct: number }>;
  weatherCondition: string;
  weatherSignal: string;
}

export async function generateVendorGeminiInsights(
  ctx: VendorInsightContext
): Promise<AiInsightItem[]> {
  const ai = createGeminiClient();
  const langNote =
    ctx.language === 'hi'
      ? 'Write all titles, impact summaries, and actions in natural, simple Hindi (Devanagari script) suitable for a Lucknow street food vendor.'
      : 'Write concise, crisp, practical English tailored for a Lucknow street food vendor.';

  const prompt = `You are BrainBazaar, an AI vendor intelligence advisor for Lucknow street food stalls.
Analyze this live stall snapshot and return exactly 4 actionable, data-grounded recommendations (no fluff, reference real product names and ₹ numbers from the snapshot).

Stall: ${ctx.businessName} (${ctx.foodCategory}) in ${ctx.zone}, Lucknow
Weather: ${ctx.weatherCondition} (${ctx.weatherSignal})
Today's Revenue: ₹${Math.round(ctx.todayRevenue)}
7-Day Revenue: ₹${Math.round(ctx.weeklyRevenue)} | 7-Day Gross Profit: ₹${Math.round(ctx.weeklyProfit)}
7-Day Food Waste Loss: ₹${Math.round(ctx.wasteLoss7d)}
Low Stock Items: ${
    ctx.lowStockItems.length > 0
      ? ctx.lowStockItems.map((i) => `${i.name} (${i.stock} ${i.unit} vs ${i.predictedDemand} projected)`).join('; ')
      : 'None critically low'
  }
Top Selling Products: ${ctx.topProducts
    .slice(0, 4)
    .map((p) => `${p.name} (${p.unitsSold} sold, ₹${Math.round(p.revenue)}, ${p.marginPct}% margin)`)
    .join('; ')}

${langNote}`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are BrainBazaar, an operational intelligence engine for street food vendors in Lucknow. Keep each recommendation concrete, measurable, and immediately executable before the next shift.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Short actionable headline (max 9 words).' },
            category: {
              type: Type.STRING,
              description: 'One of: Demand, Inventory, Waste, Pricing, Location',
            },
            impact: { type: Type.STRING, description: 'Estimated measurable outcome with ₹ or %.' },
            action: { type: Type.STRING, description: 'Specific step for the vendor to take next.' },
          },
          required: ['title', 'category', 'impact', 'action'],
        },
      },
    },
  });

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('Gemini returned an empty insight response. Please retry.');
  }

  const parsed = JSON.parse(rawText) as Array<Partial<AiInsightItem>>;
  const validCategories = new Set(['Demand', 'Inventory', 'Waste', 'Pricing', 'Location']);

  return parsed.slice(0, 4).map((item) => ({
    title: String(item.title || 'Optimize evening prep batch'),
    category: (validCategories.has(String(item.category))
      ? item.category
      : 'Demand') as AiInsightItem['category'],
    impact: String(item.impact || 'Protects daily margin'),
    action: String(item.action || 'Adjust batch sizing ahead of evening peak hours.'),
  }));
}
