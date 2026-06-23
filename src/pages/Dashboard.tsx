import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Footprints, Moon, Droplets, Scale, Activity, Apple, Dumbbell, Stethoscope, PenLine, Camera, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import HealthCard from '@/components/HealthCard';
import WeekProgress from '@/components/WeekProgress';
import { isNative } from '@/plugins/health';
import { requestNotificationPermission, scheduleDailyReminder } from '@/plugins/notifications';

export default function Dashboard() {
  const navigate = useNavigate();
  const { pregnancyInfo, healthRecords, fetchPregnancyInfo, fetchHealthRecords } = useStore();

  useEffect(() => {
    fetchPregnancyInfo();
    fetchHealthRecords();
  }, [fetchPregnancyInfo, fetchHealthRecords]);

  useEffect(() => {
    if (!isNative) return;
    const setupNotifications = async () => {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      const week = pregnancyInfo?.currentWeek ?? 20;
      await scheduleDailyReminder('饮食提醒', week < 12 ? '记得补充叶酸，少食多餐缓解孕吐' : week < 28 ? '增加蛋白质和铁质摄入，多吃蔬果' : '补充钙质和能量，选择易消化食物', 8, 0);
      await scheduleDailyReminder('运动建议', week < 12 ? '建议轻度散步，避免剧烈运动' : week < 28 ? '可以尝试孕妇瑜伽和游泳，每次30分钟' : '轻度散步和呼吸练习，注意休息', 17, 0);
    };
    setupNotifications();
  }, [pregnancyInfo?.currentWeek]);

  const getRecord = (type: string) => healthRecords.find((r) => r.type === type);

  // 根据孕周动态生成提醒
  const week = pregnancyInfo?.currentWeek ?? 20;
  const reminders = [
    { icon: Apple, label: '饮食提醒', desc: week < 12 ? '补充叶酸，少食多餐' : week < 28 ? '增加蛋白质和铁质摄入' : '补充钙质，选择易消化食物', color: 'text-coral', bg: 'bg-coral/10' },
    { icon: Dumbbell, label: '运动建议', desc: week < 12 ? '轻度散步，避免剧烈运动' : week < 28 ? '孕妇瑜伽，每次30分钟' : '轻度散步和呼吸练习', color: 'text-mint', bg: 'bg-mint/10' },
    { icon: Stethoscope, label: '产检提醒', desc: week < 12 ? '确认怀孕检查' : week < 16 ? 'NT检查（11-13周）' : week < 20 ? '唐氏筛查（15-20周）' : week < 24 ? '大排畸B超（20-24周）' : week < 28 ? '糖耐量测试（24-28周）' : '定期产检，注意胎动', color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const now = new Date();
  const greeting = now.getHours() < 12 ? '早上好' : now.getHours() < 18 ? '下午好' : '晚上好';
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const quickActions = [
    { icon: PenLine, title: '录入数据', desc: '手动记录健康指标', color: 'coral', onClick: () => navigate('/health') },
    { icon: Camera, title: '拍照报告', desc: '上传检查报告解析', color: 'mint', onClick: () => navigate('/report') },
    { icon: Activity, title: '查看详情', desc: '浏览完整健康档案', color: 'purple', onClick: () => navigate('/archive') },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-coral to-coral-light p-6 text-white shadow-md">
        <h2 className="font-display text-2xl font-bold">{greeting}，准妈妈 👋</h2>
        <p className="mt-1 text-sm text-white/80">{dateStr}</p>
        {pregnancyInfo && <p className="mt-2 text-sm text-white/90">你现在处于孕{pregnancyInfo.currentWeek}周，宝宝正在健康成长中 🌸</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:row-span-2"><WeekProgress /></div>
        <div className="lg:col-span-2">
          <h3 className="mb-3 text-lg font-semibold text-dark">今日健康数据</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <HealthCard icon={Heart} label="心率" value={getRecord('heart_rate')?.value ?? 0} unit="bpm" trend="stable" type="coral" />
            <HealthCard icon={Footprints} label="步数" value={getRecord('steps')?.value ?? 0} unit="步" trend="up" type="mint" />
            <HealthCard icon={Moon} label="睡眠" value={getRecord('sleep')?.value ?? 0} unit="小时" trend="stable" type="blue" />
            <HealthCard icon={Droplets} label="血氧" value={getRecord('blood_oxygen')?.value ?? 0} unit="%" trend="stable" type="mint" />
            <HealthCard icon={Scale} label="体重" value={getRecord('weight')?.value ?? 0} unit="kg" trend="up" type="purple" />
            <HealthCard icon={Activity} label="血压" value={getRecord('blood_pressure')?.value ?? 0} unit="mmHg" trend="down" type="coral" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-dark">今日提醒</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {reminders.map((r) => (
            <div key={r.label} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.bg}`}><r.icon className={`h-5 w-5 ${r.color}`} /></div>
              <div><p className="text-sm font-medium text-dark">{r.label}</p><p className="mt-0.5 text-xs text-gray-500">{r.desc}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-dark">快捷操作</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <button key={action.title} onClick={action.onClick} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 text-left">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color === 'coral' ? 'bg-coral/10 text-coral' : action.color === 'mint' ? 'bg-mint/10 text-mint' : 'bg-purple-50 text-purple-500'}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-dark">{action.title}</p>
                <p className="text-xs text-gray-400">{action.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
