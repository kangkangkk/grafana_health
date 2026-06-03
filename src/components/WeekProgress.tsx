import { useStore } from '@/store/useStore';

export default function WeekProgress() {
  const pregnancyInfo = useStore((s) => s.pregnancyInfo);
  const week = pregnancyInfo?.currentWeek ?? 20;
  const day = pregnancyInfo?.currentDay ?? 0;
  const progress = ((week * 7 + day) / 280) * 100;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const dueDate = pregnancyInfo?.dueDate
    ? new Date(pregnancyInfo.dueDate)
    : new Date(Date.now() + 140 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(0, Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="animate-fade-in flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm">
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="#FFF0EB" strokeWidth="10" />
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 90 90)"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F4845F" />
              <stop offset="100%" stopColor="#FFB5A7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold text-coral">{week}</span>
          <span className="text-sm text-gray-500">孕{week}周{day > 0 ? `${day}天` : ''}</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">距离预产期</p>
        <p className="text-lg font-semibold text-dark">
          还有 <span className="text-coral">{daysLeft}</span> 天
        </p>
        <p className="mt-1 text-xs text-gray-400">
          预产期: {dueDate.toLocaleDateString('zh-CN')}
        </p>
      </div>
    </div>
  );
}
