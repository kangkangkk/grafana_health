export interface HealthRecord {
  id: string;
  userId: string;
  type: 'heart_rate' | 'steps' | 'sleep' | 'blood_oxygen' | 'weight' | 'blood_pressure' | 'blood_sugar' | 'temperature';
  value: number;
  unit: string;
  recordedAt: string;
  source: 'manual' | 'apple_watch' | 'iphone';
  createdAt: string;
}

export interface PregnancyInfo {
  id: string;
  userId: string;
  dueDate: string;
  lastPeriodDate: string;
  currentWeek: number;
  currentDay: number;
  createdAt: string;
}

export interface WeekInfo {
  week: number;
  babySize: string;
  babySizeCn: string;
  babyWeight: string;
  babyLength: string;
  developments: string[];
  motherChanges: string[];
  dietAdvice: string[];
  exerciseAdvice: string[];
  warnings: string[];
  checkupItems: string[];
}

export interface OcrItem {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  interpretation: string;
}

export interface ReportRecord {
  id: string;
  userId: string;
  pregnancyWeek: number;
  reportType: string;
  imageUrl: string;
  ocrResult: OcrItem[];
  parsedAt: string;
  createdAt: string;
}

export interface CheckupItem {
  week: number;
  name: string;
  description: string;
  isRequired: boolean;
}
