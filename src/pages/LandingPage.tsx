import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Languages, Loader2, MapPin, Store } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useApp } from '../context/AppContext';
import { tDict } from '../lib/i18n';

const HERO_IMG = '/src/assets/images/hero_lucknow_street_stall_1795582555889.jpg';
const MARKET_IMG = '/src/assets/images/lucknow_market_evening_1795582553588.jpg';

const LUCKNOW_HIGHLIGHTS = [
  {
    name: 'Hazratganj',
    hindi: 'हजरतगंज',
    footfall: '5,600 / day',
    peak: '5:00 PM – 9:30 PM',
    ticket: '₹72 avg',
    hubs: 'Janpath Market · Sahara Ganj · Ganjing Promenade',
  },
  {
    name: 'Aminabad',
    hindi: 'अमीनाबाद',
    footfall: '6,200 / day',
    peak: '12:30 PM – 8:30 PM',
    ticket: '₹58 avg',
    hubs: 'Prakash Kulfi Chauraha · Gadbadjhala · Mohan Market',
  },
  {
    name: 'Chowk',
    hindi: 'चौक',
    footfall: '5,100 / day',
    peak: '7:30 AM – 11 AM & 6 PM – 10:30 PM',
    ticket: '₹65 avg',
    hubs: 'Gol Darwaza · Akbari Gate · Nakkhas Square',
  },
  {
    name: 'Aliganj & Indira Nagar',
    hindi: 'अलीगंज व इंदिरा नगर',
    footfall: '4,300 / day',
    peak: '4:30 PM – 9:30 PM',
    ticket: '₹58 avg',
    hubs: 'Kapoorthala Crossing · Bhootnath Market · Munshi Pulia',
  },
];

export function LandingPage() {
  const { language, setLanguage, isAuthenticated, loginAsDemo } = useApp();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [marketImgFailed, setMarketImgFailed] = useState(false);

  const dict = tDict(language);

  const handleDemo = async () => {
    setDemoLoading(true);
    setError('');
    try {
      await loginAsDemo();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start Lucknow demo.');
    } finally {
      setDemoLoading(false);
    }
  };

  const capabilities = [
    {
      num: '01.',
      title: language === 'hi' ? 'एआई दैनिक मांग पूर्वानुमान' : 'AI Daily Demand Forecasting',
      desc:
        language === 'hi'
          ? 'पिछली बिक्री, मौसम, सप्ताहांत और स्थानीय मेलों के आधार पर हर आइटम की अनुमानित मांग और आय का सटीक हिसाब लगाएं।'
          : 'Combine your stall sales history with Lucknow weather, weekday patterns, and local market events to predict exact unit demand before prep.',
      outcome:
        language === 'hi'
          ? 'सटीक बैच तैयारी और अनुमानित आय'
          : 'Exact batch preparation targets & projected revenue',
      span: 'lg:col-span-2',
    },
    {
      num: '02.',
      title: language === 'hi' ? 'स्मार्ट इन्वेंटरी और स्टॉक अलर्ट' : 'Smart Inventory & Stock Prep',
      desc:
        language === 'hi'
          ? 'शाम की भीड़ से पहले मौजूदा स्टॉक की तुलना अनुमानित मांग से करें और तुरंत जानें कि कितने अतिरिक्त कप या प्लेट तैयार करने हैं।'
          : 'Compare current stock against projected demand before evening rush hours so you prepare exact batches without running dry at 6 PM.',
      outcome:
        language === 'hi'
          ? 'तुरंत कम स्टॉक और ओवरस्टॉक अलर्ट'
          : 'Real-time Low Stock & Overstocked status tracking',
      span: 'lg:col-span-1',
    },
    {
      num: '03.',
      title: language === 'hi' ? 'दैनिक बिक्री, खर्च और मुनाफा खाता' : 'Sales, Profit & Expense Ledger',
      desc:
        language === 'hi'
          ? 'UPI और नकद बिक्री दर्ज करें, मंडी और गैस का खर्च जोड़ें और एक क्लिक में CSV रिपोर्ट डाउनलोड करें।'
          : 'Log UPI and cash transactions, record daily mandi ingredient expenses, calculate net profit automatically, and export CSV reports anytime.',
      outcome:
        language === 'hi'
          ? 'हर रुपये का सटीक हिसाब'
          : 'Real transaction-driven revenue & net margin math',
      span: 'lg:col-span-1',
    },
    {
      num: '04.',
      title: language === 'hi' ? 'बर्बादी नियंत्रण और लखनऊ लोकेशन मैप' : 'Waste Reduction & Lucknow Zone Map',
      desc:
        language === 'hi'
          ? 'बिना बिके खाने का नुकसान ट्रैक करें और हजरतगंज, अमीनाबाद, चौक, अलीगंज व इंदिरा नगर के फुटफॉल ज़ोन की तुलना करें।'
          : 'Log unsold items by shift to receive batch-size reduction advice, and compare Lucknow commercial hotspots on an interactive OpenStreetMap view.',
      outcome:
        language === 'hi'
          ? 'शिफ्ट-वाइज बर्बादी बचत सुझाव'
          : 'Actionable shift-level waste savings & zone comparison',
      span: 'lg:col-span-2',
    },
  ];

  const steps = [
    {
      step: '01.',
      title: language === 'hi' ? 'अपना स्टॉल और ज़ोन जोड़ें' : 'Set Up Your Stall & Zone',
      desc:
        language === 'hi'
          ? 'अपना लखनऊ क्षेत्र (हजरतगंज, अमीनाबाद, चौक आदि) और मुख्य मेन्यू आइटम 2 मिनट में दर्ज करें।'
          : 'Choose your Lucknow commercial zone, operating hours, and core menu items with cost and selling prices.',
    },
    {
      step: '02.',
      title: language === 'hi' ? 'सुबह मांग और स्टॉक जांचें' : 'Check Morning Demand & Prep Targets',
      desc:
        language === 'hi'
          ? 'आज के मौसम और फुटफॉल के हिसाब से हर आइटम के लिए सही बैच मात्रा देखें और स्टॉक सिंक करें।'
          : 'Review projected units by SKU based on Lucknow weather and rush windows before ordering mandi ingredients.',
    },
    {
      step: '03.',
      title: language === 'hi' ? 'बिक्री और बर्बादी से मुनाफा बढ़ाएं' : 'Track Daily Sales, Cut Waste & Grow',
      desc:
        language === 'hi'
          ? 'दिन के अंत में UPI/नकद बिक्री और बचा हुआ खाना लॉग करें — BrainBazaar अगली शिफ्ट के लिए सटीक सुझाव तैयार करता है।'
          : 'Log UPI/cash sales and end-of-shift leftovers so BrainBazaar refines tomorrow’s forecasts and Gemini operational advice.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0B1120]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
          <Link to="/" className="shrink-0 whitespace-nowrap focus:outline-none">
            <BrandLogo compact />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#capabilities" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              {dict.landing.capabilities}
            </a>
            <a href="#lucknow-zones" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              {dict.landing.lucknowZones}
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              {dict.landing.howItWorks}
            </a>
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {isAuthenticated ? dict.nav.dashboard : dict.landing.signIn}
            </Link>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={isAuthenticated ? () => navigate('/dashboard') : handleDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#A3E635] px-4 py-2 text-sm font-semibold text-[#0B1120] hover:bg-[#bef264] transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              {demoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isAuthenticated ? dict.nav.dashboard : dict.landing.tryDemo}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pt-12 pb-16 lg:pt-16 lg:pb-20">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-4">
          <p className="text-xs font-medium text-slate-400">
            Lucknow, Uttar Pradesh · Hazratganj / Aminabad / Chowk / Aliganj / Indira Nagar
          </p>
          <div className="inline-flex items-center rounded-lg border border-white/10 bg-[#111A2E] p-0.5">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                language === 'en'
                  ? 'bg-[#A3E635] text-[#0B1120] font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                language === 'hi'
                  ? 'bg-[#A3E635] text-[#0B1120] font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Languages className="h-3.5 w-3.5" />
              <span>हिंदी</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-wider text-[#A3E635]">
              BRAINBAZAAR · {dict.brandSub}
            </p>
            <h1
              className="mt-4 font-display font-extrabold tracking-tight text-white leading-[1.1]"
              style={{ fontSize: 'clamp(2.2rem, 3.8vw, 3.4rem)', textWrap: 'balance' }}
            >
              {dict.landing.heroTitle}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-300 max-w-xl">
              {dict.landing.heroSubtitle}
            </p>
            {error && (
              <p className="mt-4 text-sm text-rose-400" role="alert">
                {error}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleDemo}
                disabled={demoLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#A3E635] px-6 py-3 text-sm font-bold text-[#0B1120] hover:bg-[#bef264] transition-colors whitespace-nowrap disabled:opacity-60"
              >
                {demoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{dict.landing.tryDemo}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors whitespace-nowrap"
              >
                {dict.landing.getStarted}
              </Link>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-400 hover:text-white px-2 py-2 whitespace-nowrap"
              >
                {dict.landing.signIn}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[300px] lg:min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#111A2E]">
              {heroImgFailed ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#13203B] to-[#0B1120] p-8 text-center">
                  <Store className="h-12 w-12 text-[#A3E635] mb-3" />
                  <p className="font-display text-lg font-semibold text-white">
                    Hazratganj Evening Stall
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Hyperlocal vendor analytics for Lucknow
                  </p>
                </div>
              ) : (
                <img
                  src={HERO_IMG}
                  alt="Lucknow evening street food masala chai and chaat stall in Hazratganj"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/90 via-[#0B1120]/25 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#A3E635]">
                    Sample Forecast Scenario · Hazratganj
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-white">
                    Kulhad Masala Chai · Evening Rush (5 PM – 8 PM)
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <p className="text-xs text-slate-300">Suggested Prep</p>
                  <p className="text-lg font-semibold text-[#A3E635]">+40 cups</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-white/8 pt-8">
          <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
            <p className="text-xs text-slate-400">Lucknow Coverage</p>
            <p className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">6 Zones</p>
            <p className="mt-1 text-xs text-slate-400">Hazratganj to Gomti Nagar</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
            <p className="text-xs text-slate-400">Sample Ledger Depth</p>
            <p className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">28 Days</p>
            <p className="mt-1 text-xs text-slate-400">Preloaded Lucknow demo history</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
            <p className="text-xs text-slate-400">Waste Reduction Focus</p>
            <p className="mt-2 font-mono text-2xl font-bold text-[#A3E635] tabular-nums">Shift-Wise</p>
            <p className="mt-1 text-xs text-slate-400">Batch sizing & evening cutoffs</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
            <p className="text-xs text-slate-400">Vendor Languages</p>
            <p className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">EN / हिंदी</p>
            <p className="mt-1 text-xs text-slate-400">Instant bilingual switching</p>
          </div>
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-7xl px-6 py-16 border-t border-white/8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wider text-[#A3E635]">
            {language === 'hi' ? 'मुख्य क्षमताएं' : 'CORE CAPABILITIES'}
          </p>
          <h2
            className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white"
            style={{ textWrap: 'balance' }}
          >
            {language === 'hi'
              ? 'हर दिन के स्टॉल संचालन के लिए एक संपूर्ण प्रणाली'
              : 'One operational workspace for every shift decision'}
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {capabilities.map((cap) => (
            <div
              key={cap.num}
              className={`${cap.span} rounded-xl border border-white/8 bg-[#111827] p-6 flex flex-col justify-between`}
            >
              <div>
                <p className="font-mono text-xs text-[#A3E635]">{cap.num}</p>
                <h3 className="mt-2 font-display text-lg font-bold text-white">{cap.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{cap.desc}</p>
              </div>
              <p className="mt-6 pt-4 border-t border-white/8 text-xs font-medium text-slate-400">
                {cap.outcome}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="lucknow-zones" className="mx-auto max-w-7xl px-6 py-16 border-t border-white/8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5">
            <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
              {marketImgFailed ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#13203B] to-[#0B1120] p-8 text-center">
                  <MapPin className="h-10 w-10 text-[#A3E635] mb-3" />
                  <p className="font-display text-lg font-semibold text-white">Lucknow Market Zones</p>
                </div>
              ) : (
                <img
                  src={MARKET_IMG}
                  alt="Lucknow Hazratganj and Aminabad evening street bazaar promenade"
                  referrerPolicy="no-referrer"
                  onError={() => setMarketImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/90 via-[#0B1120]/30 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-xs font-medium text-[#A3E635]">Hyperlocal Footfall Map</p>
                <p className="mt-1 font-display text-xl font-bold text-white">
                  Compare commercial hubs across Lucknow
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#A3E635]">
                LUCKNOW COMMERCIAL CORRIDORS
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white">
                {language === 'hi'
                  ? 'भीड़, पीक समय और औसत बिल की तुलना करें'
                  : 'Compare footfall, peak windows, and ticket size by zone'}
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LUCKNOW_HIGHLIGHTS.map((z) => (
                <div key={z.name} className="rounded-xl border border-white/8 bg-[#111827] p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-white">{z.name}</h3>
                    <span className="text-xs text-slate-400">{z.hindi}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 font-mono text-xs tabular-nums text-[#A3E635]">
                    <span>{z.footfall}</span>
                    <span aria-hidden="true" className="text-slate-600">
                      ·
                    </span>
                    <span className="text-slate-200">{z.ticket}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Peak: {z.peak}</p>
                  <p className="mt-1.5 text-xs text-slate-500">{z.hubs}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16 border-t border-white/8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wider text-[#A3E635]">
            {language === 'hi' ? 'तीन सरल चरण' : 'THREE-STEP DAILY WORKFLOW'}
          </p>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white">
            {language === 'hi' ? 'सुबह तैयारी से रात के हिसाब तक' : 'From morning mandi prep to night closing'}
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.step} className="rounded-xl border border-white/8 bg-[#111827] p-6">
              <p className="font-mono text-xs font-semibold text-[#A3E635]">{s.step}</p>
              <h3 className="mt-3 font-display text-base font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-[#111827] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl font-bold text-white">
              {language === 'hi'
                ? 'लखनऊ डेमो डेटा के साथ BrainBazaar आज़माएं'
                : 'Explore BrainBazaar with live 28-day Lucknow demo data'}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {language === 'hi'
                ? 'बिना किसी पंजीकरण के तुरंत डैशबोर्ड, पूर्वानुमान, इन्वेंटरी और मैप टेस्ट करें।'
                : 'Test forecasting, smart inventory, sales ledgers, waste tracking, and Gemini insights immediately.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#A3E635] px-5 py-2.5 text-sm font-bold text-[#0B1120] hover:bg-[#bef264] transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {demoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{dict.landing.tryDemo}</span>
            </button>
            <Link
              to="/register"
              className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap"
            >
              {dict.landing.getStarted}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-white">BrainBazaar</span>
            <span aria-hidden="true">·</span>
            <span>{dict.landing.footerNote}</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/login" className="hover:text-white transition-colors">
              {dict.landing.signIn}
            </Link>
            <Link to="/register" className="hover:text-white transition-colors">
              {dict.landing.getStarted}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
