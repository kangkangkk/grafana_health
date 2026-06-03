import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Scale, Activity, Droplets, Thermometer, Heart, RefreshCw, Watch, Smartphone, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { healthBridge, isNative, isIOS, isAndroid } from '@/plugins/health';

type Tab = 'manual' | 'sync';
type Range = 7 | 30 | 90;

const generateTrendData = (base: number, variance: number, days: number) => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      value: Math.round((base + (Math.random() - 0.5) * variance) * 10) / 10,
    });
  }
  return data;
};

const metrics = [
  { key: 'weight', label: '体重', unit: 'kg', icon: Scale, placeholder: '62.5', color: '#F4845F' },
  { key: 'bp_systolic', label: '收缩压', unit: 'mmHg', icon: Activity, placeholder: '120', color: '#7EC8A4' },
  { key: 'bp_diastolic', label: '舒张压', unit: 'mmHg', icon: Activity, placeholder: '80', color: '#7EC8A4' },
  { key: 'blood_sugar', label: '血糖', unit: 'mmol/L', icon: Droplets, placeholder: '5.2', color: '#8B5CF6' },
  { key: 'temperature', label: '体温', unit: '°C', icon: Thermometer, placeholder: '36.5', color: '#3B82F6' },
  { key: 'heart_rate', label: '心率', unit: 'bpm', icon: Heart, placeholder: '78', color: '#F4845F' },
];

const trendConfigs = [
  { key: 'weight', label: '体重趋势', base: 62, variance: 2, color: '#F4845F' },
  { key: 'heart_rate', label: '心率趋势', base: 78, variance: 10, color: '#7EC8A4' },
  { key: 'blood_sugar', label: '血糖趋势', base: 5.2, variance: 1, color: '#8B5CF6' },
];

export default function HealthData() {
  const [tab, setTab] = useState<Tab>('manual');
  const [range, setRange] = useState<Range>(7);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState(false);
  const [healthAuthorized, setHealthAuthorized] = useState(false);
  const { addHealthRecord, syncDeviceData } = useStore();

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    for (const m of metrics) {
      const val = formData[m.key];
      if (val && !isNaN(Number(val))) {
        await addHealthRecord({
          userId: 'user-1',
          type: m.key as 'weight' | 'blood_pressure' | 'blood_sugar' | 'temperature' | 'heart_rate',
          value: Number(val),
          unit: m.unit,
          recordedAt: new Date().toISOString(),
          source: 'manual',
        });
      }
    }
    setFormData({});
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncDone(false);

    if (isNative) {
      // 原生端：先请求权限，再同步数据
      const granted = await healthBridge.requestAuthorization();
      setHealthAuthorized(granted);
      if (granted) {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        await healthBridge.fetchHealthData(
          'heart_rate',
          weekAgo.toISOString().split('T')[0],
          now.toISOString().split('T')[0]
        );
      }
    }

    // 无论是原生还是 Web，都走 API 同步
    await syncDeviceData(
      isIOS ? 'apple_watch' : isAndroid ? 'google_fit' : 'apple_watch',
      ['heart_rate', 'steps', 'sleep', 'blood_oxygen']
    );

    setSyncing(false);
    setSyncDone(true);
  };

  const handleToggleBackgroundSync = async () => {
    if (backgroundSync) {
      await healthBridge.stopBackgroundSync();
      setBackgroundSync(false);
    } else {
      if (isNative && !healthAuthorized) {
        const granted = await healthBridge.requestAuthorization();
        setHealthAuthorized(granted);
        if (!granted) return;
      }
      await healthBridge.startBackgroundSync();
      setBackgroundSync(true);
    }
  };

  const getSyncDeviceName = () => {
    if (isIOS) return 'Apple Watch';
    if (isAndroid) return 'Google Fit';
    return 'Apple Watch';
  };

  const getSyncPhoneName = () => {
    if (isIOS) return 'iPhone 健康数据';
    if (isAndroid) return 'Android 健康数据';
    return 'iPhone 健康数据';
  };

  const trendData = generateTrendData(
    trendConfigs[0].base,
    trendConfigs[0].variance,
    range
  );

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="font-display text-2xl font-bold text-dark">健康数据</h2>

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-sm">
        <button
          onClick={() => setTab('manual')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
            tab === 'manual' ? 'bg-gradient-to-r from-coral to-coral-light text-white shadow-sm' : 'text-gray-500 hover:text-coral'
          }`}
        >
          手动录入
        </button>
        <button
          onClick={() => setTab('sync')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
            tab === 'sync' ? 'bg-gradient-to-r from-coral to-coral-light text-white shadow-sm' : 'text-gray-500 hover:text-coral'
          }`}
        >
          设备同步
        </button>
      </div>

      {tab === 'manual' ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-dark">录入健康数据</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {metrics.map((m) => (
              <div key={m.key} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3">
                <m.icon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">{m.label}</label>
                  <input
                    type="number"
                    placeholder={m.placeholder}
                    value={formData[m.key] ?? ''}
                    onChange={(e) => handleInputChange(m.key, e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-dark outline-none placeholder:text-gray-300"
                  />
                </div>
                <span className="text-xs text-gray-400">{m.unit}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-coral to-coral-light py-3 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            保存记录
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-dark">设备同步</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
                <Watch className="h-6 w-6 text-coral" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-dark">{getSyncDeviceName()}</p>
                <p className="text-xs text-gray-400">上次同步: 今天 08:30</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-mint" />
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
                <Smartphone className="h-6 w-6 text-mint" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-dark">{getSyncPhoneName()}</p>
                <p className="text-xs text-gray-400">上次同步: 今天 09:15</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-mint" />
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-mint to-mint-light py-3 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同步中...' : syncDone ? '同步完成 ✓' : '同步数据'}
          </button>

          {/* 后台同步开关 - 仅原生端显示 */}
          {isNative && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-100 p-4">
              <div>
                <p className="text-sm font-medium text-dark">开启后台同步</p>
                <p className="text-xs text-gray-400">自动从{getSyncDeviceName()}同步健康数据</p>
              </div>
              <button
                onClick={handleToggleBackgroundSync}
                className="flex items-center"
              >
                {backgroundSync ? (
                  <ToggleRight className="h-8 w-8 text-mint" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-300" />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Trend Charts */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark">数据趋势</h3>
          <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
            {([7, 30, 90] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  range === r ? 'bg-coral text-white' : 'text-gray-500 hover:text-coral'
                }`}
              >
                {r}天
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {trendConfigs.map((cfg) => (
            <div key={cfg.key} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-medium text-dark">{cfg.label}</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={generateTrendData(cfg.base, cfg.variance, range)}>
                  <defs>
                    <linearGradient id={`grad-${cfg.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={cfg.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#ccc" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#ccc" width={35} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke={cfg.color} strokeWidth={2} fill={`url(#grad-${cfg.key})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
