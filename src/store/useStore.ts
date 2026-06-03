import { create } from 'zustand';
import type { PregnancyInfo, HealthRecord, WeekInfo, ReportRecord } from '@/types';

interface AppState {
  pregnancyInfo: PregnancyInfo | null;
  healthRecords: HealthRecord[];
  weekInfo: WeekInfo | null;
  reports: ReportRecord[];
  loading: boolean;
  fetchPregnancyInfo: () => Promise<void>;
  fetchHealthRecords: () => Promise<void>;
  fetchWeekInfo: (week: number) => Promise<void>;
  fetchReports: () => Promise<void>;
  updatePregnancyInfo: (dueDate: string, lastPeriodDate: string) => Promise<void>;
  addHealthRecord: (record: Omit<HealthRecord, 'id' | 'createdAt'>) => Promise<void>;
  syncDeviceData: (deviceType: string, dataTypes: string[]) => Promise<void>;
}

const WEEK_DATA: Record<number, WeekInfo> = {
  4: { week: 4, babySize: '罂粟籽', babySizeCn: '罂粟籽', babyWeight: '<1g', babyLength: '0.1cm', developments: ['胚胎开始着床', '细胞快速分裂'], motherChanges: ['可能出现轻微出血', '乳房胀痛'], dietAdvice: ['补充叶酸', '均衡饮食'], exerciseAdvice: ['轻度散步', '瑜伽拉伸'], warnings: ['避免剧烈运动', '远离有害物质'], checkupItems: ['血HCG检查'] },
  8: { week: 8, babySize: '蓝莓', babySizeCn: '蓝莓', babyWeight: '1g', babyLength: '1.6cm', developments: ['心脏开始跳动', '四肢芽出现'], motherChanges: ['孕吐加重', '疲劳感明显'], dietAdvice: ['少食多餐', '补充维生素B6'], exerciseAdvice: ['散步30分钟', '孕妇瑜伽'], warnings: ['注意休息', '避免空腹'], checkupItems: ['B超检查', '血常规'] },
  12: { week: 12, babySize: '柠檬', babySizeCn: '柠檬', babyWeight: '14g', babyLength: '5.4cm', developments: ['手指脚趾分开', '反射动作出现'], motherChanges: ['孕吐减轻', '小腹微隆'], dietAdvice: ['增加蛋白质', '补充铁质'], exerciseAdvice: ['游泳', '快走'], warnings: ['注意体重管理', '定期产检'], checkupItems: ['NT检查', '尿常规'] },
  16: { week: 16, babySize: '牛油果', babySizeCn: '牛油果', babyWeight: '100g', babyLength: '11.6cm', developments: ['面部表情出现', '骨骼硬化'], motherChanges: ['食欲恢复', '可能感到胎动'], dietAdvice: ['增加钙质摄入', '多吃蔬果'], exerciseAdvice: ['孕妇操', '适度力量训练'], warnings: ['注意姿势', '避免久站'], checkupItems: ['唐氏筛查', '血常规'] },
  20: { week: 20, babySize: '香蕉', babySizeCn: '香蕉', babyWeight: '300g', babyLength: '25cm', developments: ['感觉器官发育', '吞咽羊水'], motherChanges: ['胎动明显', '腹部增大'], dietAdvice: ['控制体重增长', '补充DHA'], exerciseAdvice: ['散步', '孕妇瑜伽'], warnings: ['注意血压', '左侧卧位休息'], checkupItems: ['大排畸B超', '血常规'] },
  24: { week: 24, babySize: '玉米', babySizeCn: '玉米', babyWeight: '600g', babyLength: '30cm', developments: ['肺部发育', '味觉形成'], motherChanges: ['子宫增大', '可能出现水肿'], dietAdvice: ['低盐饮食', '补充铁质'], exerciseAdvice: ['适度运动', '盆底肌训练'], warnings: ['注意血糖', '预防妊娠糖尿病'], checkupItems: ['糖耐量测试', '血常规'] },
  28: { week: 28, babySize: '茄子', babySizeCn: '茄子', babyWeight: '1000g', babyLength: '37cm', developments: ['大脑快速发育', '眼睛可睁开'], motherChanges: ['行动不便', '可能出现假宫缩'], dietAdvice: ['少食多餐', '补充蛋白质'], exerciseAdvice: ['轻度散步', '呼吸练习'], warnings: ['注意胎动', '预防早产'], checkupItems: ['B超检查', '血常规'] },
  32: { week: 32, babySize: '椰子', babySizeCn: '椰子', babyWeight: '1700g', babyLength: '42cm', developments: ['皮下脂肪增加', '免疫系统发育'], motherChanges: ['气短', '尿频加重'], dietAdvice: ['补充钙质', '控制盐分'], exerciseAdvice: ['轻度活动', '产前瑜伽'], warnings: ['注意休息', '观察胎动'], checkupItems: ['胎心监护', '血常规'] },
  36: { week: 36, babySize: '蜜瓜', babySizeCn: '蜜瓜', babyWeight: '2600g', babyLength: '47cm', developments: ['肺部成熟', '头部入盆'], motherChanges: ['下坠感', '尿频'], dietAdvice: ['易消化食物', '补充能量'], exerciseAdvice: ['散步助产', '呼吸练习'], warnings: ['准备待产包', '注意临产征兆'], checkupItems: ['胎心监护', 'B超检查'] },
  40: { week: 40, babySize: '西瓜', babySizeCn: '西瓜', babyWeight: '3400g', babyLength: '50cm', developments: ['发育完成', '准备出生'], motherChanges: ['宫缩', '见红'], dietAdvice: ['补充体力', '易消化食物'], exerciseAdvice: ['深呼吸', '放松练习'], warnings: ['及时就医', '保持冷静'], checkupItems: ['胎心监护', '产前检查'] },
};

function getWeekInfoFallback(week: number): WeekInfo {
  const base = WEEK_DATA[Math.min(Math.max(Math.round(week / 4) * 4, 4), 40) as keyof typeof WEEK_DATA];
  return { ...base, week };
}

export const useStore = create<AppState>((set, get) => ({
  pregnancyInfo: null,
  healthRecords: [],
  weekInfo: null,
  reports: [],
  loading: false,

  fetchPregnancyInfo: async () => {
    try {
      const res = await fetch('/api/pregnancy');
      if (res.ok) {
        const data = await res.json();
        set({ pregnancyInfo: data });
        if (data?.currentWeek) {
          get().fetchWeekInfo(data.currentWeek);
        }
      }
    } catch {
      const now = new Date();
      const dueDate = new Date(now.getTime() + 140 * 24 * 60 * 60 * 1000);
      const lmp = new Date(now.getTime() - 140 * 24 * 60 * 60 * 1000);
      set({
        pregnancyInfo: {
          id: 'mock-1',
          userId: 'user-1',
          dueDate: dueDate.toISOString().split('T')[0],
          lastPeriodDate: lmp.toISOString().split('T')[0],
          currentWeek: 20,
          currentDay: 0,
          createdAt: new Date().toISOString(),
        },
      });
    }
  },

  fetchHealthRecords: async () => {
    try {
      const res = await fetch('/api/health-records');
      if (res.ok) {
        const data = await res.json();
        set({ healthRecords: data });
        return;
      }
    } catch { /* fall through to mock */ }
    set({
      healthRecords: [
        { id: '1', userId: 'user-1', type: 'heart_rate', value: 78, unit: 'bpm', recordedAt: new Date().toISOString(), source: 'apple_watch', createdAt: new Date().toISOString() },
        { id: '2', userId: 'user-1', type: 'steps', value: 6520, unit: '步', recordedAt: new Date().toISOString(), source: 'iphone', createdAt: new Date().toISOString() },
        { id: '3', userId: 'user-1', type: 'sleep', value: 7.5, unit: '小时', recordedAt: new Date().toISOString(), source: 'apple_watch', createdAt: new Date().toISOString() },
        { id: '4', userId: 'user-1', type: 'blood_oxygen', value: 98, unit: '%', recordedAt: new Date().toISOString(), source: 'apple_watch', createdAt: new Date().toISOString() },
        { id: '5', userId: 'user-1', type: 'weight', value: 62.5, unit: 'kg', recordedAt: new Date().toISOString(), source: 'manual', createdAt: new Date().toISOString() },
        { id: '6', userId: 'user-1', type: 'blood_pressure', value: 120, unit: 'mmHg', recordedAt: new Date().toISOString(), source: 'manual', createdAt: new Date().toISOString() },
      ],
    });
  },

  fetchWeekInfo: async (week: number) => {
    try {
      const res = await fetch(`/api/week-info/${week}`);
      if (res.ok) {
        const data = await res.json();
        set({ weekInfo: data });
        return;
      }
    } catch { /* fall through to mock */ }
    set({ weekInfo: getWeekInfoFallback(week) });
  },

  fetchReports: async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        set({ reports: data });
        return;
      }
    } catch { /* fall through to mock */ }
    set({ reports: [] });
  },

  updatePregnancyInfo: async (dueDate: string, lastPeriodDate: string) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/pregnancy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate, lastPeriodDate }),
      });
      if (res.ok) {
        const data = await res.json();
        set({ pregnancyInfo: data, loading: false });
        return;
      }
    } catch { /* fall through */ }
    const lmp = new Date(lastPeriodDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(diffDays / 7);
    const currentDay = diffDays % 7;
    set({
      pregnancyInfo: {
        id: 'mock-1',
        userId: 'user-1',
        dueDate,
        lastPeriodDate,
        currentWeek,
        currentDay,
        createdAt: new Date().toISOString(),
      },
      loading: false,
    });
  },

  addHealthRecord: async (record) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/health-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (res.ok) {
        const data = await res.json();
        set((s) => ({ healthRecords: [...s.healthRecords, data], loading: false }));
        return;
      }
    } catch { /* fall through */ }
    const newRecord: HealthRecord = {
      ...record,
      id: `mock-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ healthRecords: [...s.healthRecords, newRecord], loading: false }));
  },

  syncDeviceData: async (_deviceType: string, _dataTypes: string[]) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceType: _deviceType, dataTypes: _dataTypes }),
      });
      if (res.ok) {
        await get().fetchHealthRecords();
        set({ loading: false });
        return;
      }
    } catch { /* fall through */ }
    await new Promise((r) => setTimeout(r, 1500));
    set({ loading: false });
  },
}));
