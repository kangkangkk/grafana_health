import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { ChevronLeft, ChevronRight, Apple, Dumbbell, AlertTriangle, Stethoscope } from 'lucide-react';

const FRUIT_EMOJIS: Record<number, string> = {
  1: '🫘', 2: '🫘', 3: '🫘', 4: '🍒', 5: '🍒', 6: '🫐', 7: '🫐', 8: '🫐',
  9: '🍋', 10: '🍋', 11: '🍋', 12: '🍋', 13: '🍊', 14: '🍊', 15: '🍊', 16: '🥑',
  17: '🥑', 18: '🍎', 19: '🍎', 20: '🍎', 21: '🍐', 22: '🍐', 23: '🍐', 24: '🍑',
  25: '🍑', 26: '🍑', 27: '🍌', 28: '🍌', 29: '🍌', 30: '🌽', 31: '🌽', 32: '🌽',
  33: '🍆', 34: '🍆', 35: '🥒', 36: '🥒', 37: '🍈', 38: '🍈', 39: '🍉', 40: '🍉',
};

type Tab = 'diet' | 'exercise' | 'warnings' | 'checkup';

const tabConfig = [
  { key: 'diet' as Tab, label: '饮食建议', icon: Apple },
  { key: 'exercise' as Tab, label: '运动指导', icon: Dumbbell },
  { key: 'warnings' as Tab, label: '注意事项', icon: AlertTriangle },
  { key: 'checkup' as Tab, label: '产检项目', icon: Stethoscope },
];

export default function Pregnancy() {
  const { pregnancyInfo, weekInfo, fetchPregnancyInfo, fetchWeekInfo } = useStore();
  const [selectedWeek, setSelectedWeek] = useState(pregnancyInfo?.currentWeek ?? 20);
  const [activeTab, setActiveTab] = useState<Tab>('diet');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPregnancyInfo();
  }, [fetchPregnancyInfo]);

  useEffect(() => {
    fetchWeekInfo(selectedWeek);
  }, [selectedWeek, fetchWeekInfo]);

  useEffect(() => {
    if (pregnancyInfo?.currentWeek) {
      setSelectedWeek(pregnancyInfo.currentWeek);
    }
  }, [pregnancyInfo]);

  const scrollWeeks = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -120 : 120, behavior: 'smooth' });
    }
  };

  const currentWeek = pregnancyInfo?.currentWeek ?? 20;

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="font-display text-2xl font-bold text-dark">孕期追踪</h2>

      {/* Current Week Info Card */}
      <div className="rounded-2xl bg-gradient-to-r from-coral to-coral-light p-6 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-5xl">
            {FRUIT_EMOJIS[selectedWeek] || '👶'}
          </div>
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold">孕{selectedWeek}周</h3>
            {weekInfo && (
              <>
                <p className="mt-1 text-sm text-white/90">宝宝大小: {weekInfo.babySizeCn}</p>
                <p className="text-sm text-white/80">体重约 {weekInfo.babyWeight} · 身长约 {weekInfo.babyLength}</p>
              </>
            )}
          </div>
        </div>
        {weekInfo && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-white/90">👶 宝宝发育</p>
            {weekInfo.developments.map((d, i) => (
              <p key={i} className="text-sm text-white/80">• {d}</p>
            ))}
            <p className="mt-2 text-sm font-medium text-white/90">🤰 妈妈变化</p>
            {weekInfo.motherChanges.map((d, i) => (
              <p key={i} className="text-sm text-white/80">• {d}</p>
            ))}
          </div>
        )}
      </div>

      {/* Week Selector */}
      <div className="relative">
        <button onClick={() => scrollWeeks('left')} className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-1.5 shadow-md hover:shadow-lg">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto px-8 py-2 scrollbar-hide">
          {Array.from({ length: 40 }, (_, i) => i + 1).map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`flex shrink-0 items-center justify-center rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                w === selectedWeek
                  ? 'bg-gradient-to-r from-coral to-coral-light text-white shadow-md'
                  : w === currentWeek
                  ? 'bg-coral-light/30 text-coral'
                  : 'bg-white text-gray-500 hover:bg-coral-light/20'
              }`}
            >
              {w}周
            </button>
          ))}
        </div>
        <button onClick={() => scrollWeeks('right')} className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-1.5 shadow-md hover:shadow-lg">
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm">
        {tabConfig.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-gradient-to-r from-coral to-coral-light text-white shadow-sm'
                : 'text-gray-500 hover:text-coral'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        {weekInfo ? (
          <div className="space-y-3">
            {(activeTab === 'diet' ? weekInfo.dietAdvice
              : activeTab === 'exercise' ? weekInfo.exerciseAdvice
              : activeTab === 'warnings' ? weekInfo.warnings
              : weekInfo.checkupItems
            ).map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-cream p-3">
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${
                  activeTab === 'warnings' ? 'bg-coral' : activeTab === 'checkup' ? 'bg-purple-500' : 'bg-mint'
                }`}>
                  {i + 1}
                </div>
                <p className="text-sm text-dark">{item}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400">加载中...</p>
        )}
      </div>

      {/* Checkup Timeline */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-dark">产检时间线</h3>
        <div className="relative space-y-4 pl-6">
          {[
            { week: 12, name: 'NT检查', desc: '早期唐氏筛查' },
            { week: 16, name: '唐氏筛查', desc: '中期唐氏筛查' },
            { week: 20, name: '大排畸', desc: '详细B超检查' },
            { week: 24, name: '糖耐量', desc: '妊娠糖尿病筛查' },
            { week: 28, name: '小排畸', desc: '二次B超检查' },
            { week: 36, name: '胎心监护', desc: '定期胎心监测' },
          ].map((item, i) => {
            const isPast = currentWeek >= item.week;
            const isCurrent = currentWeek >= item.week - 2 && currentWeek < item.week;
            return (
              <div key={i} className="relative">
                <div className={`absolute -left-6 top-1 h-3 w-3 rounded-full border-2 ${
                  isPast ? 'border-mint bg-mint' : isCurrent ? 'border-coral bg-coral-light animate-pulse-soft' : 'border-gray-300 bg-white'
                }`} />
                <div className={`rounded-xl p-3 ${isPast ? 'bg-mint-light/30' : isCurrent ? 'bg-coral-light/20' : 'bg-white'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${isPast ? 'text-mint' : isCurrent ? 'text-coral' : 'text-gray-400'}`}>
                      孕{item.week}周
                    </span>
                    <span className="text-sm font-medium text-dark">{item.name}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
