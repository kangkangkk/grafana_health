import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Scale, Activity, Droplets, Thermometer, Heart, RefreshCw, Watch, Smartphone, CheckCircle2, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { healthBridge, isNative, isIOS, isAndroid } from '@/plugins/health';

type Tab = 'manual' | 'sync';
type Range = 7 | 30 | 90;

// 各指标的有效范围校验
const metricConfigs = [
  { key: 'weight', label: '体重', unit: 'kg', icon: Scale, placeholder: '62.5', color: '#F4845F', min: 20, max: 300 },
  { key: 'bp_systolic', label: '收缩压', unit: 'mmHg', icon: Activity, placeholder: '120', color: '#7EC8A4', min: 60, max: 250 },
  { key: 'bp_diastolic', label: '舒张压', unit: 'mmHg', icon: Activity, placeholder: '80', color: '#7EC8A4', min: 40, max: 200 },
  { key: 'blood_sugar', label: '血糖', unit: 'mmol/L', icon: Droplets, placeholder: '5.2', color: '#8B5CF6', min: 1, max: 50 },
  { key: 'temperature', label: '体温', unit: '°C', icon: Thermometer, placeholder: '36.5', color: '#3B82F6', min: 30, max: 45 },
  { key: 'heart_rate', label: '心率', unit: 'bpm', icon: Heart, placeholder: '78', color: '#F4845F', min: 30, max: 220 },
];

const trendConfigs = [
  { key: 'weight', label: '体重趋势', color: '#F4845F' },
  { key: 'heart_rate', label: '心率趋势', color: '#7EC8A4' },
  { key: 'blood_sugar', label: '血糖趋势', color: '#8B5CF6' },
];

export default function HealthData() {
  const [tab, setTab] = useState<Tab>('manual');
  const [range, setRange] = useState<Range>(7);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitMsg, setSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState(false);
  const [healthAuthorized, setHealthAuthorized] = useState(false);

  // 趋势图数据
  const [trendData, setTrendData] = useState<Record<string, { date: string; avgValue: number }[]>>({});

  const { addHealthRecord, syncDeviceData, fetchTrendData } = useStore();

  // 获取趋势数据
  const loadTrendData = useCallback(async () => {
    const newData: Record<string, { date: string; avgValue: number }[]> = {};
    await Promise.all(
      trendConfigs.map(async (cfg) => {
        const data = await fetchTrendData(cfg.key, range);
        newData[cfg.key] = data.map(d => ({ date: d.date, avgValue: d.avgValue }));
      })
    );
    setTrendData(newData);
  }, [range, fetchTrendData]);

  useEffect(() => {
    loadTrendData();
  }, [loadTrendData]);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // 清除该字段的错误
    if (formErrors[key]) {
      setFormErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const validateField = (key: string, value: string): string | null => {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num)) return '请输入有效数字';
    const cfg = metricConfigs.find(m => m.key === key);
    if (!cfg) return null;
    if (num < cfg.min || num > cfg.max) return `范围应为 ${cfg.min}-${cfg.max}`;
    return null;
  };

  const handleSubmit = async () => {
    // 校验所有填写的字段
    const errors: Record<string, string> = {};
    for (const m of metricConfigs) {
      const val = formData[m.key];
      if (val) {
        const err = validateField(m.key, val);
        if (err) errors[m.key] = err;
      }
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitMsg({ type: 'error', text: '请修正输入错误后再提交' });
      return;
    }

    setSubmitMsg(null);
    try {
      // 批量提交，使用 Promise.all 并行
      const promises = metricConfigs
        .filter(m => formData[m.key])
        .map(m => addHealthRecord({
          userId: 'demo-user-001',
          type: m.key as 'weight' | 'blood_pressure' | 'blood_sugar' | 'temperature' | 'heart_rate',
          value: Number(formData[m.key]),
          unit: m.unit,
          recordedAt: new Date().toISOString(),
          source: 'manual',
        }));
      await Promise.all(promises);
      setFormData({});
      setSubmitMsg({ type: 'success', text: '健康数据已保存' });
      // 刷新趋势图
      loadTrendData();
    } catch (e) {
      setSubmitMsg({ type: 'error', text: (e as Error).message });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncDone(false);
    try {
      if (isNative) {
        const granted = await healthBridge.requestAuthorization();
        setHealthAuthorized(granted);
        if (granted) {
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          await healthBridge.fetchHealthData('heart_rate', weekAgo.toISOString().split('T')[0], now.toISOString().split('T')[0]);
        }
      }
      await syncDeviceData(
        isIOS ? 'apple_watch' : isAndroid ? 'google_fit' : 'apple_watch',
        ['heart_rate', 'steps', 'sleep', 'blood_oxygen']
      );
      setSyncDone(true);
      loadTrendData();
    } catch (e) {
      setSubmitMsg({ type: 'error', text: (e as Error).message });
    } finally {
      setSyncing(false);
    }
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

  const getSyncDeviceName = () => isIOS ? 'Apple Watch' : isAndroid ? 'Google Fit' : 'Apple Watch';
  const getSyncPhoneName = () => isIOS ? 'iPhone 健康数据' : isAndroid ? 'Android 健康数据' : 'iPhone 健康数据';

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="font-display text-2xl font-bold text-dark">健康数据</h2>

      {/* Toast Message */}
      {submitMsg && (
        <div className={`flex items-center gap-2 rounded-2xl p-4 ${submitMsg.type === 'success' ? 'bg-mint-light/20 border border-mint-light/40' : 'bg-red-50 border border-red-100'}`}>
          {submitMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-mint shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}
          <p className={`text-sm ${submitMsg.type === 'success' ? 'text-mint' : 'text-red-600'}`}>{submitMsg.text}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-sm">
        <button onClick={() => setTab('manual')} className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${tab === 'manual' ? 'bg-gradient-to-r from-coral to-coral-light text-white shadow-sm' : 'text-gray-500 hover:text-coral'}`}>手动录入</button>
        <button onClick={() => setTab('sync')} className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${tab === 'sync' ? 'bg-gradient-to-r from-coral to-coral-light text-white shadow-sm' : 'text-gray-500 hover:text-coral'}`}>设备同步</button>
      </div>

      {tab === 'manual' ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-dark">录入健康数据</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {metricConfigs.map((m) => (
              <div key={m.key} className={`rounded-xl border px-4 py-3 ${formErrors[m.key] ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <m.icon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">{m.label}</label>
                    <input type="number" placeholder={m.placeholder} value={formData[m.key] ?? ''} onChange={(e) => handleInputChange(m.key, e.target.value)} className="w-full bg-transparent text-sm font-medium text-dark outline-none placeholder:text-gray-300" />
                  </div>
                  <span className="text-xs text-gray-400">{m.unit}</span>
                </div>
                {formErrors[m.key] && <p className="mt-1 text-xs text-red-500">{formErrors[m.key]}</p>}
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-coral to-coral-light py-3 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">保存记录</button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-dark">设备同步</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50"><Watch className="h-6 w-6 text-coral" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-dark">{getSyncDeviceName()}</p><p className="text-xs text-gray-400">上次同步: 今天 08:30</p></div>
              <CheckCircle2 className="h-5 w-5 text-mint" />
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50"><Smartphone className="h-6 w-6 text-mint" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-dark">{getSyncPhoneName()}</p><p className="text-xs text-gray-400">上次同步: 今天 09:15</p></div>
              <CheckCircle2 className="h-5 w-5 text-mint" />
            </div>
          </div>
          <button onClick={handleSync} disabled={syncing} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-mint to-mint-light py-3 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同步中...' : syncDone ? '同步完成 ✓' : '同步数据'}
          </button>
          {isNative && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-100 p-4">
              <div><p className="text-sm font-medium text-dark">开启后台同步</p><p className="text-xs text-gray-400">自动从{getSyncDeviceName()}同步健康数据</p></div>
              <button onClick={handleToggleBackgroundSync} className="flex items-center">{backgroundSync ? <ToggleRight className="h-8 w-8 text-mint" /> : <ToggleLeft className="h-8 w-8 text-gray-300" />}</button>
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
              <button key={r} onClick={() => setRange(r)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${range === r ? 'bg-coral text-white' : 'text-gray-500 hover:text-coral'}`}>{r}天</button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {trendConfigs.map((cfg) => {
            const data = trendData[cfg.key] ?? [];
            return (
              <div key={cfg.key} className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-medium text-dark">{cfg.label}</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={data}>
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
                    <Area type="monotone" dataKey="avgValue" stroke={cfg.color} strokeWidth={2} fill={`url(#grad-${cfg.key})`} />
                  </AreaChart>
                </ResponsiveContainer>
                {data.length === 0 && <p className="text-center text-xs text-gray-400 mt-2">暂无数据</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
