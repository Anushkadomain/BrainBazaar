import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Loader2, MapPin, Navigation, Search } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { formatInr, formatNumber } from '../lib/format';
import type { LucknowZone } from '../types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPopupHtml(title: string, lines: string[], footer: string): string {
  return `<div style="min-width:200px;font-family:'DM Sans',sans-serif;">
    <div style="font-weight:700;font-size:13px;color:#fff;margin-bottom:6px;">${escapeHtml(title)}</div>
    ${lines
      .map(
        (l) =>
          `<div style="font-size:11px;color:#cbd5e1;line-height:1.5;">${escapeHtml(l)}</div>`
      )
      .join('')}
    <div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);font-size:10px;color:#a3e635;font-weight:600;">${escapeHtml(
      footer
    )}</div>
  </div>`;
}

export function LocationsPage() {
  const { language } = useApp();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const searchMarkerRef = useRef<L.CircleMarker | null>(null);

  const [vendorLocation, setVendorLocation] = useState<{
    businessName: string;
    zone: string;
    address: string;
    lat: number;
    lng: number;
    recordedRevenue: number;
  } | null>(null);
  const [zones, setZones] = useState<LucknowZone[]>([]);
  const [recommendations, setRecommendations] = useState<
    Array<{
      zoneId: string;
      zoneName: string;
      hindiName: string;
      opportunityScore: number;
      peakHours: string;
      avgTicketInr: number;
      competitionLevel: 'Low' | 'Moderate' | 'High';
      rationale: string;
    }>
  >([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [compareA, setCompareA] = useState('hazratganj');
  const [compareB, setCompareB] = useState('aminabad');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [geoResult, setGeoResult] = useState<{ displayName: string; lat: number; lng: number } | null>(
    null
  );

  useEffect(() => {
    Promise.all([api.getLocations(), api.getLocationRecommendations()])
      .then(([loc, rec]) => {
        setVendorLocation(loc.vendorLocation);
        setZones(loc.zones);
        setDisclaimer(loc.disclaimer);
        setRecommendations(rec.recommendations);
        const match = loc.zones.find(
          (z) => z.name.toLowerCase() === loc.vendorLocation.zone.toLowerCase()
        );
        if (match) {
          setCompareA(match.id);
          const other = loc.zones.find((z) => z.id !== match.id);
          if (other) setCompareB(other.id);
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load Lucknow location intelligence.')
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !vendorLocation || zones.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [vendorLocation.lat, vendorLocation.lng],
      zoom: 12,
      scrollWheelZoom: false,
    });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    for (const z of zones) {
      const color =
        z.demoFootfallDaily >= 5200
          ? '#A3E635'
          : z.demoFootfallDaily >= 4400
            ? '#38BDF8'
            : '#F59E0B';
      L.circle([z.lat, z.lng], {
        color,
        fillColor: color,
        fillOpacity: 0.22,
        weight: 1.5,
        radius: z.radiusMeters,
      })
        .addTo(map)
        .bindPopup(
          buildPopupHtml(
            `${z.name} (${z.hindiName})`,
            [
              `Est. Daily Footfall: ${formatNumber(z.demoFootfallDaily)}`,
              `Peak Hours: ${z.peakHours}`,
              `Avg Ticket: ${formatInr(z.avgTicketInr)} · Competition: ${z.competitionLevel}`,
              `Hubs: ${z.commercialHubs.slice(0, 2).join(', ')}`,
            ],
            'Lucknow Footfall Index'
          )
        );
    }

    const vendorMarker = L.circleMarker([vendorLocation.lat, vendorLocation.lng], {
      radius: 10,
      color: '#FFFFFF',
      weight: 3,
      fillColor: '#A3E635',
      fillOpacity: 1,
    }).addTo(map);

    vendorMarker
      .bindPopup(
        buildPopupHtml(
          vendorLocation.businessName,
          [
            `Zone: ${vendorLocation.zone}, Lucknow`,
            `Address: ${vendorLocation.address}`,
            `Recorded Revenue: ${formatInr(vendorLocation.recordedRevenue)}`,
          ],
          'Your Stall Location (Live Profile)'
        )
      )
      .openPopup();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [vendorLocation, zones]);

  const flyToZone = (z: LucknowZone) => {
    mapInstanceRef.current?.flyTo([z.lat, z.lng], 14, { duration: 0.8 });
  };

  const handleGeocode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await api.geocode(searchQuery.trim());
      setGeoResult(res);
      if (mapInstanceRef.current) {
        if (searchMarkerRef.current) {
          searchMarkerRef.current.remove();
        }
        searchMarkerRef.current = L.circleMarker([res.lat, res.lng], {
          radius: 8,
          color: '#38BDF8',
          weight: 2,
          fillColor: '#38BDF8',
          fillOpacity: 0.85,
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(buildPopupHtml('Searched Locality', [res.displayName], 'Lucknow Geocode'))
          .openPopup();
        mapInstanceRef.current.flyTo([res.lat, res.lng], 14, { duration: 0.8 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to locate address.');
    } finally {
      setSearching(false);
    }
  };

  const zoneA = zones.find((z) => z.id === compareA);
  const zoneB = zones.find((z) => z.id === compareB);

  return (
    <AppShell
      title={language === 'hi' ? 'लखनऊ लोकेशन इंटेलिजेंस' : 'Lucknow Location Intelligence'}
      subtitle={
        language === 'hi'
          ? 'भीड़ वाले बाज़ार ज़ोन खोजें, पीक समय की तुलना करें और नए स्टॉल के अवसर देखें'
          : 'Inspect Lucknow footfall zones on OpenStreetMap, search localities, and compare commercial corridors'
      }
    >
      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Search + Quick Zone Jump */}
      <div className="mb-6 rounded-xl border border-white/8 bg-[#111827] p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <form onSubmit={handleGeocode} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Lucknow locality (e.g., Kapoorthala, Bhootnath)..."
              className="w-full rounded-lg border border-white/10 bg-[#0B1120] pl-9 pr-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#A3E635] px-3.5 py-2 text-xs font-bold text-[#0B1120] hover:bg-[#bef264] whitespace-nowrap disabled:opacity-60"
          >
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
            <span>Locate</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5">
          {zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => flyToZone(z)}
              className="rounded-lg border border-white/10 bg-[#0B1120] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-[#A3E635]/50 hover:text-white transition-colors whitespace-nowrap"
            >
              {z.name}
            </button>
          ))}
        </div>
      </div>

      {geoResult && (
        <div className="mb-4 text-xs text-slate-300 flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-sky-400" />
          <span>
            Located: <strong className="text-white">{geoResult.displayName}</strong> ({geoResult.lat.toFixed(4)},{' '}
            {geoResult.lng.toFixed(4)})
          </span>
        </div>
      )}

      {/* Map + Expansion Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-8 rounded-xl border border-white/8 bg-[#111827] overflow-hidden">
          {loading ? (
            <div className="h-[440px] w-full bg-white/5 animate-pulse" />
          ) : (
            <div ref={mapContainerRef} className="h-[440px] w-full z-0" />
          )}
          {disclaimer && (
            <div className="border-t border-white/8 px-4 py-2.5 text-xs text-slate-400">
              {disclaimer}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 rounded-xl border border-white/8 bg-[#111827] p-5">
          <h2 className="font-display text-base font-bold text-white mb-1">
            Expansion Opportunities
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Ranked Lucknow zones matching your food category
          </p>
          <div className="divide-y divide-white/8">
            {recommendations.map((rec) => (
              <div key={rec.zoneId} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const z = zones.find((item) => item.id === rec.zoneId);
                      if (z) flyToZone(z);
                    }}
                    className="font-display text-sm font-bold text-white hover:text-[#A3E635] transition-colors text-left"
                  >
                    {rec.zoneName} <span className="text-xs font-normal text-slate-400">({rec.hindiName})</span>
                  </button>
                  <span className="font-mono text-xs text-[#A3E635] tabular-nums">
                    Avg {formatInr(rec.avgTicketInr)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Peak: {rec.peakHours} · Competition: {rec.competitionLevel}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{rec.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-Side Zone Comparison */}
      <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-base font-bold text-white">
              Side-by-Side Zone Comparison
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare daily footfall, rent ranges, average ticket size, and top food categories
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0B1120] px-3 py-1.5 text-xs text-white focus:border-[#A3E635] focus:outline-none"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">vs</span>
            <select
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0B1120] px-3 py-1.5 text-xs text-white focus:border-[#A3E635] focus:outline-none"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {zoneA && zoneB && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 text-xs text-slate-400">
                  <th className="py-2.5 pr-4 font-medium">Metric</th>
                  <th className="py-2.5 px-4 font-semibold text-[#A3E635]">
                    {zoneA.name} ({zoneA.hindiName})
                  </th>
                  <th className="py-2.5 pl-4 font-semibold text-sky-400">
                    {zoneB.name} ({zoneB.hindiName})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                <tr>
                  <td className="py-3 pr-4 text-xs text-slate-400">Est. Daily Footfall</td>
                  <td className="py-3 px-4 font-mono tabular-nums text-white">
                    {formatNumber(zoneA.demoFootfallDaily)} / day
                  </td>
                  <td className="py-3 pl-4 font-mono tabular-nums text-white">
                    {formatNumber(zoneB.demoFootfallDaily)} / day
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-xs text-slate-400">Avg Customer Ticket</td>
                  <td className="py-3 px-4 font-mono tabular-nums text-white">
                    {formatInr(zoneA.avgTicketInr)}
                  </td>
                  <td className="py-3 pl-4 font-mono tabular-nums text-white">
                    {formatInr(zoneB.avgTicketInr)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-xs text-slate-400">Peak Selling Window</td>
                  <td className="py-3 px-4 text-xs text-slate-200">{zoneA.peakHours}</td>
                  <td className="py-3 pl-4 text-xs text-slate-200">{zoneB.peakHours}</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-xs text-slate-400">Stall Competition</td>
                  <td className="py-3 px-4 text-xs text-slate-200">{zoneA.competitionLevel}</td>
                  <td className="py-3 pl-4 text-xs text-slate-200">{zoneB.competitionLevel}</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-xs text-slate-400">Typical Stall Rent</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-200">{zoneA.rentIndex}</td>
                  <td className="py-3 pl-4 font-mono text-xs text-slate-200">{zoneB.rentIndex}</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-xs text-slate-400">Commercial Hubs</td>
                  <td className="py-3 px-4 text-xs text-slate-300">
                    {zoneA.commercialHubs.join(' · ')}
                  </td>
                  <td className="py-3 pl-4 text-xs text-slate-300">
                    {zoneB.commercialHubs.join(' · ')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
