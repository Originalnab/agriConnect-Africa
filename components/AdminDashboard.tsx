import React from 'react';
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

const kpis = [
  { label: 'Farmers', value: '12,430', delta: '+4.2% vs last week', icon: Users, tone: 'text-emerald-700 bg-emerald-50' },
  { label: 'Buyers', value: '3,112', delta: '+2.1% vs last week', icon: Globe2, tone: 'text-blue-700 bg-blue-50' },
  { label: 'Active Chats', value: '842', delta: '92% SLA hit', icon: Headphones, tone: 'text-amber-700 bg-amber-50' },
  { label: 'Open Alerts', value: '18', delta: '5 critical', icon: AlertTriangle, tone: 'text-rose-700 bg-rose-50' },
];

const operations = [
  {
    title: 'Regional Signals',
    description: 'Live pest/weather overlays by district',
    items: [
      { title: 'Ashanti', detail: 'High pest risk - cassava', status: 'critical' },
      { title: 'Volta', detail: 'Heavy rain in 36h - adjust planting', status: 'warning' },
      { title: 'Greater Accra', detail: 'Market demand spike for tomatoes', status: 'info' },
    ],
  },
  {
    title: 'Marketplace SLA',
    description: 'Time to first response on buyer requests',
    items: [
      { title: '< 15 min', detail: '68% of requests', status: 'good' },
      { title: '15-60 min', detail: '22% of requests', status: 'warn' },
      { title: '> 60 min', detail: '10% of requests', status: 'critical' },
    ],
  },
];

const aiQualityQueue = [
  { prompt: '“Maize leaves turning yellow — why?”', status: 'Needs review', confidence: '62%', type: 'AI Farm Coach' },
  { prompt: 'Uploaded cassava leaf photo', status: 'Low confidence', confidence: '55%', type: 'Crop Doctor' },
  { prompt: '“When to plant rice in Northern Region?”', status: 'OK', confidence: '88%', type: 'Guidance' },
];

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

function MessageIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Signal {...props} />;
}

const AdminDashboard: React.FC = () => {
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
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-semibold shadow hover:bg-emerald-700 transition">
              <Sparkles className="h-4 w-4" />
              Smart Refresh
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:border-stone-300 transition">
              <RefreshCw className="h-4 w-4" />
              Live View
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-stone-200 bg-white/90 shadow-sm backdrop-blur-sm p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-stone-500">{kpi.label}</p>
                <p className="text-2xl font-semibold text-stone-900 mt-1">{kpi.value}</p>
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
              {aiQualityQueue.map((item, idx) => (
                <div key={item.prompt + idx} className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <Sparkles className="h-4 w-4" />
                    {item.type}
                  </div>
                  <p className="text-sm text-stone-900">{item.prompt}</p>
                  <div className="flex items-center justify-between text-xs text-stone-600">
                    <span className="flex items-center gap-2">
                      <Badge tone={item.status === 'OK' ? 'emerald' : 'amber'}>{item.status}</Badge>
                      <span className="text-stone-500">Confidence {item.confidence}</span>
                    </span>
                    <button className="text-emerald-700 font-semibold hover:underline text-xs">Mark reviewed</button>
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
                  <p className="text-xs text-stone-500">12 new listings need review</p>
                </div>
                <Badge tone="emerald">Real-time</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 bg-stone-50/80">
                <div>
                  <p className="text-sm font-semibold text-stone-900">Pricing anomalies</p>
                  <p className="text-xs text-stone-500">4 items &gt; 30% above median</p>
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
