import { Capacitor } from '@capacitor/core';

// 检测平台
export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isAndroid = Capacitor.getPlatform() === 'android';

// HealthKit / Google Fit 桥接接口
// 在原生端通过 Capacitor Plugin 实现
export interface HealthDataBridge {
  requestAuthorization(): Promise<boolean>;
  fetchHealthData(type: string, startDate: string, endDate: string): Promise<number[]>;
  startBackgroundSync(): Promise<void>;
  stopBackgroundSync(): Promise<void>;
}

// Web 端使用 API 调用，原生端使用 Capacitor Plugin
export const healthBridge: HealthDataBridge = isNative
  ? // 原生端桥接（需要原生插件实现）
    {
      async requestAuthorization() {
        // iOS: 调用 HealthKit 权限请求
        // Android: 调用 Google Fit 权限请求
        console.log('Requesting native health authorization...');
        return true;
      },
      async fetchHealthData(type: string, startDate: string, endDate: string) {
        console.log(`Fetching native health data: ${type} from ${startDate} to ${endDate}`);
        return [];
      },
      async startBackgroundSync() {
        console.log('Starting native background sync...');
      },
      async stopBackgroundSync() {
        console.log('Stopping native background sync...');
      },
    }
  : // Web 端使用 API
    {
      async requestAuthorization() { return true; },
      async fetchHealthData() { return []; },
      async startBackgroundSync() {},
      async stopBackgroundSync() {},
    };
