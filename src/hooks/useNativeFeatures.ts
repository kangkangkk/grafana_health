import { useState, useEffect } from 'react';
import { isNative, isIOS, isAndroid, healthBridge } from '@/plugins/health';
import { requestNotificationPermission } from '@/plugins/notifications';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';

export function useNativeFeatures() {
  const [isOnline, setIsOnline] = useState(true);
  const [healthAuthorized, setHealthAuthorized] = useState(false);

  useEffect(() => {
    if (!isNative) return;

    // 监听网络状态
    Network.getStatus().then(status => setIsOnline(status.connected));
    Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    });

    // 监听后退按钮 (Android)
    if (isAndroid) {
      App.addListener('backButton', () => {
        // 处理 Android 返回键
        if (window.history.length > 1) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
    }

    return () => {
      Network.removeAllListeners();
      App.removeAllListeners();
    };
  }, []);

  const requestHealthAccess = async () => {
    const granted = await healthBridge.requestAuthorization();
    setHealthAuthorized(granted);
    return granted;
  };

  const requestNotifications = async () => {
    return await requestNotificationPermission();
  };

  return {
    isNative,
    isIOS,
    isAndroid,
    isOnline,
    healthAuthorized,
    requestHealthAccess,
    requestNotifications,
  };
}
