import { useEffect } from 'react';
import { Heart, Footprints, Moon, Droplets, Scale, Activity, Apple, Dumbbell, Stethoscope, PenLine, Camera, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import HealthCard from '@/components/HealthCard';
import WeekProgress from '@/components/WeekProgress';

const reminders = [
  { icon: Apple, label: '饮食提醒', desc: '今天记得补充叶酸和铁质', color: 'text-coral', bg: 'bg-coral/10' },
  { icon: Dumbbell, label: '运动建议', desc: '建议散步30分钟，做孕妇瑜伽', color: 'text-mint', bg: 'bg-mint/10' },
  { icon: Stethoscope, label: '产检提醒', desc: '下周三有大排畸B超检查', color: 'text-purple-500', bg: 'bg-purple-50' },
];

export default function Dashboard() {
  const { pregnancyInfo, healthRecords, fetchPregnancyInfo, fetchHealthRecords } = useStore();

  useEffect(() => {
    fetchPregnancyInfo();
    fetchHealthRecords();
  }, [fetchPregnancyInfo, fetchHealthRecords]);

  const getRecord = (type: string) => healthRecords.find((r) => r.type === type);

  const now = new Date();
  const greeting = now.getHours() < 12 ? '早上好' : now.getHours() < 18 ? '下午好' : '晚上好';
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Greeting */}
      <div className="rounded-2xl bg-gradient-to-r from-coral to-coral-light p-6 text-white shadow-md">
        <h2 className="font-display text-2xl font-bold">{greeting}，准妈妈 👋</h2>
        <p className="mt-1 text-sm text-white/80">{dateStr}</p>
        {pregnancyInfo && (
          <p className="mt-2 text-sm text-white/90">
            你现在处于孕{pregnancyInfo.currentWeek}周，宝宝正在健康成长中 🌸
          </p>
        )}
      </div>

      {/* Week Progress + Health Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:row-span-2">
          <WeekProgress />
        </div>
        <div className="lg:col-span-2">
          <h3 className="mb-3 text-lg font-semibold text-dark">今日健康数据</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <HealthCard icon={Heart} label="心率" value={getRecord('heart_rate')?.value ?? 78} unit="bpm" trend="stable" type="coral" />
            <HealthCard icon={Footprints} label="步数" value={getRecord('steps')?.value ?? 6520} unit="步" trend="up" type="mint" />
            <HealthCard icon={Moon} label="睡眠" value={getRecord('sleep')?.value ?? 7.5} unit="小时" trend="stable" type="blue" />
            <HealthCard icon={Droplets} label="血氧" value={getRecord('blood_oxygen')?.value ?? 98} unit="%" trend="stable" type="mint" />
            <HealthCard icon={Scale} label="体重" value={getRecord('weight')?.value ?? 62.5} unit="kg" trend="up" type="purple" />
            <HealthCard icon={Activity} label="血压" value={getRecord('blood_pressure')?.value ?? 120} unit="mmHg" trend="down" type="coral" />
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-dark">今日提醒</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {reminders.map((r) => (
            <div key={r.label} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.bg}`}>
                <r.icon className={`h-5 w-5 ${r.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-dark">{r.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-dark">快捷操作</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <button className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral/10 text-coral">
              <PenLine className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-dark">录入数据</p>
              <p className="text-xs text-gray-400">手动记录健康指标</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-gray-300" />
          </button>
          <button className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/10 text-mint">
              <Camera className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-dark">拍照报告</p>
              <p className="text-xs text-gray-400">上传检查报告解析</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-gray-300" />
          </button>
          <button className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
              <Activity className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-dark">查看详情</p>
              <p className="text-xs text-gray-400">浏览完整健康档案</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
