import { memo, useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface HealthCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  type?: 'coral' | 'mint' | 'blue' | 'purple';
}

const gradients = {
  coral: 'from-coral/10 to-coral-light/20',
  mint: 'from-mint/10 to-mint-light/20',
  blue: 'from-blue-50 to-blue-100',
  purple: 'from-purple-50 to-purple-100',
};

const iconBg = {
  coral: 'bg-coral/20 text-coral',
  mint: 'bg-mint/20 text-mint',
  blue: 'bg-blue-100 text-blue-500',
  purple: 'bg-purple-100 text-purple-500',
};

function HealthCardBase({ icon: Icon, label, value, unit, trend = 'stable', type = 'coral' }: HealthCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 800;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * eased;
      setDisplayValue(Math.round(current * 10) / 10);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-coral' : trend === 'down' ? 'text-mint' : 'text-gray-400';

  return (
    <div className={`animate-slide-up rounded-2xl bg-gradient-to-br ${gradients[type]} p-4 shadow-sm transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg[type]}`}><Icon className="h-5 w-5" /></div>
        <div className={`flex items-center gap-1 ${trendColor}`}><TrendIcon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-dark">{displayValue}</span>
          <span className="text-sm text-gray-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(HealthCardBase);
