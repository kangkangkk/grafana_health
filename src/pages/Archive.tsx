import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { FileText, Activity, Calendar, Download, Filter, Heart, Scale, Droplets, Thermometer, AlertCircle } from 'lucide-react';

type FilterType = 'all' | 'heart_rate' | 'weight' | 'blood_sugar' | 'temperature' | 'blood_pressure';

const typeLabels: Record<string, { label: string; icon: typeof Heart; unit: string }> = {
  heart_rate: { label: '心率', icon: Heart, unit: 'bpm' },
  weight: { label: '体重', icon: Scale, unit: 'kg' },
  blood_sugar: { label: '血糖', icon: Droplets, unit: 'mmol/L' },
  temperature: { label: '体温', icon: Thermometer, unit: '°C' },
  blood_pressure: { label: '血压', icon: Activity, unit: 'mmHg' },
};

export default function Archive() {
  const { healthRecords, reports, pregnancyInfo, fetchHealthRecords, fetchReports, error } = useStore();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [dateRange, setDateRange] = useState<'7' | '30' | 'all'>('30');

  useEffect(() => {
    fetchHealthRecords();
    fetchReports();
  }, [fetchHealthRecords, fetchReports]);

  const totalRecords = healthRecords.length;
  const reportsCount = reports.length;
  // 使用孕期信息计算追踪天数，而非硬编码日期
  const trackingDays = pregnancyInfo
    ? Math.max(1, Math.ceil((Date.now() - new Date(pregnancyInfo.lastPeriodDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const filteredRecords = healthRecords.filter((r) => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      if (new Date(r.recordedAt) < cutoff) return false;
    }
    return true;
  });

  const sourceLabel = (s: string) => s === 'apple_watch' ? 'Apple Watch' : s === 'iphone' ? 'iPhone' : '手动录入';

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="font-display text-2xl font-bold text-dark">健康档案</h2>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100 p-4">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-coral/10 to-coral-light/20 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral/20 text-coral"><Activity className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-dark">{totalRecords}</p><p className="text-xs text-gray-500">总记录数</p></div>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-mint/10 to-mint-light/20 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/20 text-mint"><FileText className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-dark">{reportsCount}</p><p className="text-xs text-gray-500">报告数量</p></div>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-500"><Calendar className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-dark">{trackingDays}</p><p className="text-xs text-gray-500">追踪天数</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-xl bg-white p-1 shadow-sm">
          <Filter className="h-4 w-4 text-gray-400 ml-2" />
          {(['all', 'heart_rate', 'weight', 'blood_sugar', 'temperature', 'blood_pressure'] as FilterType[]).map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filterType === t ? 'bg-coral text-white' : 'text-gray-500 hover:text-coral'}`}>{t === 'all' ? '全部' : typeLabels[t]?.label ?? t}</button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
          {(['7', '30', 'all'] as const).map((d) => (
            <button key={d} onClick={() => setDateRange(d)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${dateRange === d ? 'bg-mint text-white' : 'text-gray-500 hover:text-mint'}`}>{d === 'all' ? '全部' : `${d}天`}</button>
          ))}
        </div>
      </div>

      {/* Health Data Table */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-cream">
              <th className="px-4 py-3 text-left font-medium text-gray-600">类型</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">数值</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">来源</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">记录时间</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? filteredRecords.map((r) => {
              const info = typeLabels[r.type];
              return (
                <tr key={r.id} className="border-b border-gray-50 transition-colors hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {info && <info.icon className="h-4 w-4 text-gray-400" />}
                      <span className="font-medium text-dark">{info?.label ?? r.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-dark">{r.value} <span className="text-gray-400">{r.unit}</span></td>
                  <td className="px-4 py-3 text-gray-500">{sourceLabel(r.source)}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(r.recordedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无数据，去录入健康数据吧</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Report Timeline */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-dark">报告记录</h3>
        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral/10"><FileText className="h-5 w-5 text-coral" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark">{r.reportType}</p>
                  <p className="text-xs text-gray-400">孕{r.pregnancyWeek}周 · {new Date(r.parsedAt || r.createdAt).toLocaleDateString('zh-CN')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">暂无报告记录</p>
          </div>
        )}
      </div>

      {/* Export Button */}
      <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-coral to-coral-light py-3 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
        <Download className="h-4 w-4" />
        导出健康档案
      </button>
    </div>
  );
}
