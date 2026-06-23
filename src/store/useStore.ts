import { create } from 'zustand';
import type { PregnancyInfo, HealthRecord, WeekInfo, ReportRecord, OcrItem } from '@/types';

interface ApiError {
  message: string;
  status?: number;
}

interface AppState {
  pregnancyInfo: PregnancyInfo | null;
  healthRecords: HealthRecord[];
  weekInfo: WeekInfo | null;
  reports: ReportRecord[];
  loading: boolean;
  error: string | null;
  // Clear error
  clearError: () => void;
  // Fetch actions
  fetchPregnancyInfo: () => Promise<void>;
  fetchHealthRecords: () => Promise<void>;
  fetchWeekInfo: (week: number) => Promise<void>;
  fetchReports: () => Promise<void>;
  fetchTrendData: (type: string, days: number) => Promise<{ date: string; avgValue: number; minValue: number; maxValue: number }[]>;
  // Mutation actions
  updatePregnancyInfo: (dueDate: string, lastPeriodDate: string) => Promise<void>;
  addHealthRecord: (record: Omit<HealthRecord, 'id' | 'createdAt'>) => Promise<void>;
  syncDeviceData: (deviceType: string, dataTypes: string[]) => Promise<{ syncedCount: number }>;
  uploadReport: (file: File | string, pregnancyWeek: number, reportType?: string) => Promise<ReportRecord>;
}

// 统一 API 请求封装：自动解包 {data: ...} 信封，统一错误处理
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let errorMsg = `请求失败 (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) errorMsg = body.error;
    } catch { /* ignore parse error */ }
    throw new Error(errorMsg);
  }
  const body = await res.json();
  // 后端返回 { data: ... } 信封，解包
  return body.data as T;
}

// 孕周 fallback 数据（API 不可用时使用）
const WEEK_FALLBACK: Record<number, Partial<WeekInfo>> = {
  4: { babySize: 'Poppy Seed', babySizeCn: '罂粟籽', babyWeight: '<1g', babyLength: '0.1cm', developments: ['胚胎开始着床', '细胞快速分裂'], motherChanges: ['可能出现轻微出血', '乳房胀痛'], dietAdvice: ['补充叶酸', '均衡饮食'], exerciseAdvice: ['轻度散步', '瑜伽拉伸'], warnings: ['避免剧烈运动', '远离有害物质'], checkupItems: ['血HCG检查'] },
  8: { babySize: 'Raspberry', babySizeCn: '蓝莓', babyWeight: '1g', babyLength: '1.6cm', developments: ['心脏开始跳动', '四肢芽出现'], motherChanges: ['孕吐加重', '疲劳感明显'], dietAdvice: ['少食多餐', '补充维生素B6'], exerciseAdvice: ['散步30分钟', '孕妇瑜伽'], warnings: ['注意休息', '避免空腹'], checkupItems: ['B超检查', '血常规'] },
  12: { babySize: 'Plum', babySizeCn: '柠檬', babyWeight: '14g', babyLength: '5.4cm', developments: ['手指脚趾分开', '反射动作出现'], motherChanges: ['孕吐减轻', '小腹微隆'], dietAdvice: ['增加蛋白质', '补充铁质'], exerciseAdvice: ['游泳', '快走'], warnings: ['注意体重管理', '定期产检'], checkupItems: ['NT检查', '尿常规'] },
  16: { babySize: 'Avocado', babySizeCn: '牛油果', babyWeight: '100g', babyLength: '11.6cm', developments: ['面部表情出现', '骨骼硬化'], motherChanges: ['食欲恢复', '可能感到胎动'], dietAdvice: ['增加钙质摄入', '多吃蔬果'], exerciseAdvice: ['孕妇操', '适度力量训练'], warnings: ['注意姿势', '避免久站'], checkupItems: ['唐氏筛查', '血常规'] },
  20: { babySize: 'Banana', babySizeCn: '香蕉', babyWeight: '300g', babyLength: '25cm', developments: ['感觉器官发育', '吞咽羊水'], motherChanges: ['胎动明显', '腹部增大'], dietAdvice: ['控制体重增长', '补充DHA'], exerciseAdvice: ['散步', '孕妇瑜伽'], warnings: ['注意血压', '左侧卧位休息'], checkupItems: ['大排畸B超', '血常规'] },
  24: { babySize: 'Corn', babySizeCn: '玉米', babyWeight: '600g', babyLength: '30cm', developments: ['肺部发育', '味觉形成'], motherChanges: ['子宫增大', '可能出现水肿'], dietAdvice: ['低盐饮食', '补充铁质'], exerciseAdvice: ['适度运动', '盆底肌训练'], warnings: ['注意血糖', '预防妊娠糖尿病'], checkupItems: ['糖耐量测试', '血常规'] },
  28: { babySize: 'Eggplant', babySizeCn: '茄子', babyWeight: '1000g', babyLength: '37cm', developments: ['大脑快速发育', '眼睛可睁开'], motherChanges: ['行动不便', '可能出现假宫缩'], dietAdvice: ['少食多餐', '补充蛋白质'], exerciseAdvice: ['轻度散步', '呼吸练习'], warnings: ['注意胎动', '预防早产'], checkupItems: ['B超检查', '血常规'] },
  32: { babySize: 'Squash', babySizeCn: '椰子', babyWeight: '1700g', babyLength: '42cm', developments: ['皮下脂肪增加', '免疫系统发育'], motherChanges: ['气短', '尿频加重'], dietAdvice: ['补充钙质', '控制盐分'], exerciseAdvice: ['轻度活动', '产前瑜伽'], warnings: ['注意休息', '观察胎动'], checkupItems: ['胎心监护', '血常规'] },
  36: { babySize: 'Honeydew', babySizeCn: '蜜瓜', babyWeight: '2600g', babyLength: '47cm', developments: ['肺部成熟', '头部入盆'], motherChanges: ['下坠感', '尿频'], dietAdvice: ['易消化食物', '补充能量'], exerciseAdvice: ['散步助产', '呼吸练习'], warnings: ['准备待产包', '注意临产征兆'], checkupItems: ['胎心监护', 'B超检查'] },
  40: { babySize: 'Watermelon', babySizeCn: '西瓜', babyWeight: '3400g', babyLength: '50cm', developments: ['发育完成', '准备出生'], motherChanges: ['宫缩', '见红'], dietAdvice: ['补充体力', '易消化食物'], exerciseAdvice: ['深呼吸', '放松练习'], warnings: ['及时就医', '保持冷静'], checkupItems: ['胎心监护', '产前检查'] },
};

function getWeekFallback(week: number): WeekInfo {
  const key = Math.min(Math.max(Math.round(week / 4) * 4, 4), 40);
  const base = WEEK_FALLBACK[key] ?? WEEK_FALLBACK[20]!;
  return { week, babySize: '', babySizeCn: '', babyWeight: '', babyLength: '', developments: [], motherChanges: [], dietAdvice: [], exerciseAdvice: [], warnings: [], checkupItems: [], ...base } as WeekInfo;
}

export const useStore = create<AppState>((set, get) => ({
  pregnancyInfo: null,
  healthRecords: [],
  weekInfo: null,
  reports: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchPregnancyInfo: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<PregnancyInfo>('/api/pregnancy');
      set({ pregnancyInfo: data, loading: false });
      if (data?.currentWeek) {
        get().fetchWeekInfo(data.currentWeek);
      }
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  fetchHealthRecords: async () => {
    set({ error: null });
    try {
      const data = await apiFetch<HealthRecord[]>('/api/health');
      set({ healthRecords: data });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  fetchWeekInfo: async (week: number) => {
    set({ error: null });
    try {
      const data = await apiFetch<WeekInfo>(`/api/pregnancy/week/${week}`);
      set({ weekInfo: data });
    } catch (e) {
      // 孕周数据用 fallback，不显示错误
      set({ weekInfo: getWeekFallback(week) });
    }
  },

  fetchReports: async () => {
    set({ error: null });
    try {
      const data = await apiFetch<ReportRecord[]>('/api/report');
      set({ reports: data });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  fetchTrendData: async (type: string, days: number) => {
    try {
      const data = await apiFetch<{ date: string; avgValue: number; minValue: number; maxValue: number }[]>(
        `/api/health/trend?type=${type}&days=${days}`
      );
      return data;
    } catch (e) {
      set({ error: (e as Error).message });
      return [];
    }
  },

  updatePregnancyInfo: async (dueDate: string, lastPeriodDate: string) => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<PregnancyInfo>('/api/pregnancy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate, lastPeriodDate }),
      });
      set({ pregnancyInfo: data, loading: false });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
      throw e;
    }
  },

  addHealthRecord: async (record) => {
    set({ error: null });
    try {
      const data = await apiFetch<HealthRecord>('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      set((s) => ({ healthRecords: [...s.healthRecords, data] }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  syncDeviceData: async (deviceType: string, dataTypes: string[]) => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ syncedRecords: number; message: string }>('/api/health/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceType, dataType: dataTypes }),
      });
      // 同步后刷新健康记录
      await get().fetchHealthRecords();
      set({ loading: false });
      return { syncedCount: data.syncedRecords };
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
      throw e;
    }
  },

  uploadReport: async (file: File | string, pregnancyWeek: number, reportType = '常规产检报告') => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      if (typeof file === 'string') {
        // base64 data URL → convert to Blob
        const res = await fetch(file);
        const blob = await res.blob();
        formData.append('image', blob, 'report.jpg');
      } else {
        formData.append('image', file);
      }
      formData.append('pregnancyWeek', String(pregnancyWeek));
      formData.append('reportType', reportType);

      const res = await fetch('/api/report/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `上传失败 (${res.status})`);
      }
      const body = await res.json();
      const data = body.data as ReportRecord;
      // 刷新报告列表
      await get().fetchReports();
      set({ loading: false });
      return data;
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
      throw e;
    }
  },
}));
