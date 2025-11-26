import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle,
  Cloud,
  Database,
  Globe2,
  Headphones,
  LayoutDashboard,
  Loader2,
  Map,
  RefreshCw,
  Shield,
  Signal,
  Sparkles,
  UploadCloud,
  Users,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

type KPI = { label: string; value: string; delta: string; icon: React.ComponentType<any>; tone: string };
type PestItem = { id: string; location: string | null; risk_level: string | null; alert_message: string | null; forecast_date: string | null };
type MarketItem = { id: string; crop_name: string | null; location: string | null; price: number | null; currency: string | null; unit: string | null; updated_at: string | null };
type AnalysisItem = { id: string; crop_identified: string | null; diagnosis: string | null; health_status: string | null; confidence_level: number | null; created_at: string | null };
type Stats = { farmers: number; buyers: number; chats24h: number; highRiskAlerts: number; listings: number };

function MessageIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Signal {...props} />;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    farmers: 0,
    buyers: 0,
    chats24h: 0,
    highRiskAlerts: 0,
    listings: 0,
  });
  const [pestItems, setPestItems] = useState<PestItem[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [analysisQueue, setAnalysisQueue] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [
        farmersRes,
        buyersRes,
        chatsRes,
        alertsRes,
        listingsRes,
        pestRes,
        marketRes,
        analysisRes,
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('user_role', 'farmer'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('user_role', 'buyer'),
        supabase
          .from('chat_history')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', twentyFourHoursAgo),
        supabase.from('pest_forecast').select('id', { count: 'exact', head: true }).eq('risk_level', 'High'),
        supabase.from('market_data').select('id', { count: 'exact', head: true }),
        supabase
          .from('pest_forecast')
          .select('id, location, risk_level, alert_message, forecast_date')
          .order('forecast_date', { ascending: false })
          .limit(5),
        supabase
          .from('market_data')
          .select('id, crop_name, location, price, currency, unit, updated_at')
          .order('updated_at', { ascending: false })
          .limit(5),
        supabase
          .from('crop_analysis')
          .select('id, crop_identified, diagnosis, health_status, confidence_level, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const farmers = farmersRes.count ?? 0;
      const buyers = buyersRes.count ?? 0;
      const chats24h = chatsRes.count ?? 0;
      const highRiskAlerts = alertsRes.count ?? 0;
      const listings = listingsRes.count ?? 0;

      setStats({ farmers, buyers, chats24h, highRiskAlerts, listings });
      setPestItems(pestRes.data ?? []);
      setMarketItems(marketRes.data ?? []);
      setAnalysisQueue(analysisRes.data ?? []);
      setLastUpdated(new Date().toLocaleString());
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to load admin data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const kpis: KPI[] = useMemo(
    () => [
      { label: 'Farmers', value: stats.farmers.toLocaleString(), delta: 'vs total users', icon: Users, tone: 'text-emerald-700 bg-emerald-50' },
      { label: 'Buyers', value: stats.buyers.toLocaleString(), delta: 'vs total users', icon: Globe2, tone: 'text-blue-700 bg-blue-50' },
      { label: 'Chats (24h)', value: stats.chats24h.toLocaleString(), delta: 'Last 24h', icon: Headphones, tone: 'text-amber-700 bg-amber-50' },
      { label: 'High-risk alerts', value: stats.highRiskAlerts.toLocaleString(), delta: 'Pest forecast = High', icon: AlertTriangle, tone: 'text-rose-700 bg-rose-50' },
    ],
    [stats],
  );

  const operations = useMemo(
    () => [
      {
        title: 'Pest Signals',
        description: 'Highest risk from pest_forecast',
        items: (pestItems.length ? pestItems : [{ id: 'fallback', location: 'N/A', alert_message: 'No pest data yet', risk_level: 'info', forecast_date: null }]).map(
          (item) => ({
            title: item.location || 'Unknown location',
            detail: item.alert_message || 'No alert message',
            status: item.risk_level === 'High' ? 'critical' : item.risk_level === 'Medium' ? 'warning' : 'info',
          }),
        ),
      },
      {
        title: 'Marketplace Activity',
        description: 'Latest market_data rows',
        items: (marketItems.length
          ? marketItems
          : [{ id: 'fallback', crop_name: 'N/A', location: 'N/A', price: null, currency: null, unit: null, updated_at: null }]
        ).map((item) => ({
          title: item.crop_name || 'Unknown crop',
          detail: `${item.location || 'Unknown location'} ${item.price ? `• ${item.price} ${item.currency || ''}/${item.unit || ''}` : ''}`.trim(),
          status: 'good',
        })),
      },
    ],
    [marketItems, pestItems],
  );

  const systemHealth = [
    { label: 'Chat API', status: 'Operational', latency: '290 ms', uptime: '99.9%', icon: MessageIcon },
    { label: 'Vision/Doctor', status: 'Degraded', latency: '780 ms', uptime: '98.7%', icon: Sparkles },
    { label: 'Marketplace', status: 'Operational', latency: '180 ms', uptime: '99.8%', icon: BarChart3 },
    { label: 'Storage/Uploads', status: 'Operational', latency: '145 ms', uptime: '99.9%', icon: UploadCloud },
  ];

  const localization = {
    coverage: [
      { locale: 'Twi', percent: 86 },
      { locale: 'Ewe', percent: 74 },
      { locale: 'Ga', percent: 68 },
    ],
    voice: [
      { label: 'TTS success', value: '97%' },
      { label: 'Voice input errors', value: '1.8%' },
      { label: 'Avg. latency', value: '420 ms' },
    ],
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-white to-emerald-50 text-stone-900">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-semibold">Admin Console</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-stone-900 flex items-center gap-3">
              <LayoutDashboard className="h-9 w-9 text-emerald-700" />
              Operations & Quality
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Full-screen oversight of users, AI quality, marketplace health, and alerts — optimized for laptops and responsive down to mobile.
            </p>
            {lastUpdated && <p className="text-xs text-stone-500 mt-1">Last updated: {lastUpdated}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-semibold shadow hover:bg-emerald-700 transition disabled:opacity-60"
              disabled={loading}
            >
              <Sparkles className="h-4 w-4" />
              {loading ? 'Refreshing…' : 'Smart Refresh'}
            </button>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:border-stone-300 transition disabled:opacity-60"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Live View
            </button>
          </div>
        </header>
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm px-4 py-3">
            {error} — ensure admin RLS policies allow reads for this account.
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-stone-200 bg-white/90 shadow-sm backdrop-blur-sm p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-stone-500">{kpi.label}</p>
                <p className="text-2xl font-semibold text-stone-900 mt-1">
                  {loading ? <span className="animate-pulse text-stone-400">...</span> : kpi.value}
                </p>
                <p className="text-xs text-stone-500 mt-1">{kpi.delta}</p>
              </div>
              <div className={`rounded-full p-3 ${kpi.tone}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase">Live Ops Monitor</p>
                <h2 className="text-xl font-semibold text-stone-900">Regions, weather, pest risk</h2>
              </div>
              <Map className="h-5 w-5 text-stone-400" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {operations.map((block) => (
                <div key={block.title} className="rounded-xl border border-stone-200 p-4 bg-stone-50/80">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{block.title}</p>
                      <p className="text-xs text-stone-500">{block.description}</p>
                    </div>
                    <Cloud className="h-4 w-4 text-stone-400" />
                  </div>
                  <div className="space-y-2">
                    {block.items.map((item) => (
                      <div
                        key={item.title + item.detail}
                        className="flex items-start gap-3 rounded-lg bg-white border border-stone-200 px-3 py-2"
                      >
                        <StatusDot status={item.status} />
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{item.title}</p>
                          <p className="text-xs text-stone-600">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase">AI Quality Queue</p>
                <h2 className="text-xl font-semibold text-stone-900">Flagged responses</h2>
              </div>
              <Sparkles className="h-5 w-5 text-stone-400" />
            </div>
            <div className="space-y-3">
              {(analysisQueue.length ? analysisQueue : [{ id: 'fallback', crop_identified: 'No analyses yet', diagnosis: '', health_status: 'N/A', confidence_level: null, created_at: null }]).map((item) => (
                <div key={item.id} className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <Sparkles className="h-4 w-4" />
                    {item.crop_identified || 'Crop Doctor'}
                  </div>
                  <p className="text-sm text-stone-900">{item.diagnosis || 'No diagnosis provided'}</p>
                  <div className="flex items-center justify-between text-xs text-stone-600">
                    <span className="flex items-center gap-2">
                      <Badge tone={item.health_status === 'healthy' ? 'emerald' : 'amber'}>{item.health_status || 'Pending'}</Badge>
                      <span className="text-stone-500">
                        Confidence {item.confidence_level ? `${Math.round(item.confidence_level * 100)}%` : '—'}
                      </span>
                    </span>
                    <span className="text-stone-500">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase">Marketplace Oversight</p>
                <h2 className="text-xl font-semibold text-stone-900">Listings & anomalies</h2>
              </div>
              <BarChart3 className="h-5 w-5 text-stone-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 bg-stone-50/80">
                <div>
                  <p className="text-sm font-semibold text-stone-900">Moderation queue</p>
                  <p className="text-xs text-stone-500">{loading ? 'Loading...' : `${stats.listings} listings recorded`}</p>
                </div>
                <Badge tone="emerald">Real-time</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 bg-stone-50/80">
                <div>
                  <p className="text-sm font-semibold text-stone-900">Pricing anomalies</p>
                  <p className="text-xs text-stone-500">Flag via analytics (not yet wired)</p>
                </div>
                <Badge tone="amber">Investigate</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 bg-stone-50/80">
                <div>
                  <p className="text-sm font-semibold text-stone-900">Buyer SLA</p>
                  <p className="text-xs text-stone-500">Median response 11 min</p>
                </div>
                <Badge tone="emerald">On track</Badge>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase">Notifications & Rules</p>
                <h2 className="text-xl font-semibold text-stone-900">Alerting control</h2>
              </div>
              <Bell className="h-5 w-5 text-stone-400" />
            </div>
            <div className="space-y-3">
              {[
                { title: 'Pest risk > Medium', channel: 'Push + Email', status: 'Active' },
                { title: 'Fulfillment SLA breached', channel: 'Email', status: 'Active' },
                { title: 'Voice errors > 5%', channel: 'Slack webhook', status: 'On watch' },
              ].map((rule) => (
                <div key={rule.title} className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-stone-900">{rule.title}</p>
                    <Badge tone={rule.status === 'Active' ? 'emerald' : 'amber'}>{rule.status}</Badge>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">{rule.channel}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button className="text-emerald-700 text-xs font-semibold hover:underline">Edit</button>
                    <span className="text-stone-300 text-xs">•</span>
                    <button className="text-stone-600 text-xs font-semibold hover:underline">Snooze</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 rounded-2xl border border-stone-200 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase">System Health</p>
                <h2 className="text-xl font-semibold text-stone-900">Uptime, latency, costs</h2>
              </div>
              <Activity className="h-5 w-5 text-stone-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {systemHealth.map((service) => (
                <div key={service.label} className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <service.icon className="h-4 w-4 text-emerald-700" />
                      <p className="text-sm font-semibold text-stone-900">{service.label}</p>
                    </div>
                    <Badge tone={service.status === 'Operational' ? 'emerald' : 'amber'}>{service.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-600">
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 text-stone-400" />
                      {service.latency} latency
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-stone-400" />
                      {service.uptime} uptime
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <Database className="h-3.5 w-3.5 text-stone-400" />
                    Model & storage costs tracked daily
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase">Localization & Voice</p>
                <h2 className="text-xl font-semibold text-stone-900">Coverage & quality</h2>
              </div>
              <Globe2 className="h-5 w-5 text-stone-400" />
            </div>
            <div className="space-y-3">
              {localization.coverage.map((locale) => (
                <div key={locale.locale} className="bg-stone-50/80 border border-stone-200 rounded-xl p-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-stone-900">
                    <span>{locale.locale}</span>
                    <span>{locale.percent}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-stone-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600"
                      style={{ width: `${locale.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-stone-600">
              {localization.voice.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2 text-center">
                  <p className="text-[11px] text-stone-500">{stat.label}</p>
                  <p className="text-sm font-semibold text-stone-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase">Data & Exports</p>
                <h2 className="text-xl font-semibold text-stone-900">Reports & API keys</h2>
              </div>
              <Database className="h-5 w-5 text-stone-400" />
            </div>
            <div className="space-y-3">
              {['Users CSV', 'Listings CSV', 'Interactions CSV'].map((exportItem) => (
                <div key={exportItem} className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{exportItem}</p>
                    <p className="text-xs text-stone-500">Schedule or download on-demand</p>
                  </div>
                  <button className="text-emerald-700 text-xs font-semibold hover:underline">Export</button>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">API keys</p>
                  <p className="text-xs text-stone-500">Scopes + rotation reminders</p>
                </div>
                <button className="text-stone-700 text-xs font-semibold hover:underline">Manage</button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase">Security & Compliance</p>
                <h2 className="text-xl font-semibold text-stone-900">Audit & access</h2>
              </div>
              <Shield className="h-5 w-5 text-stone-400" />
            </div>
            <div className="space-y-3">
              {[
                { title: 'PII access logs', detail: 'Downloadable audit trail (30 days)', status: 'Healthy' },
                { title: 'Consent versioning', detail: 'v1.2 active since 02/10', status: 'Updated' },
                { title: 'DLP checks on uploads', detail: 'Scanning images & text', status: 'On' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{item.title}</p>
                      <p className="text-xs text-stone-500">{item.detail}</p>
                    </div>
                    <Badge tone="emerald">{item.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-stone-200 bg-emerald-50/80 px-4 py-3 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-700" />
              <div>
                <p className="text-sm font-semibold text-stone-900">Full-screen ready</p>
                <p className="text-xs text-stone-600">
                  Optimized for laptop-wide layouts with responsive grids down to mobile.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'emerald' | 'amber' | 'rose';
}) {
  const tones: Record<'emerald' | 'amber' | 'rose', string> = {
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
    rose: 'text-rose-700 bg-rose-50 border-rose-100',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function StatusDot({ status }: { status: 'critical' | 'warning' | 'info' | 'good' | 'warn' }) {
  const map: Record<'critical' | 'warning' | 'info' | 'good' | 'warn', string> = {
    critical: 'bg-rose-500',
    warning: 'bg-amber-500',
    warn: 'bg-amber-500',
    info: 'bg-blue-500',
    good: 'bg-emerald-500',
  };
  return <span className={`mt-1 h-2.5 w-2.5 rounded-full ${map[status]}`} />;
}

export default AdminDashboard;
