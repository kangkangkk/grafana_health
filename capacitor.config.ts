import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.health.maternity',
  appName: '孕婴健康守护',
  webDir: 'dist',
  server: {
    // 开发时指向 Vite 开发服务器
    // url: 'http://localhost:5173',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFF8F0',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FFF8F0',
    },
    Camera: {
      presentationStyle: 'fullscreen',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#F4845F',
      sound: 'default',
    },
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
  },
  android: {
    backgroundColor: '#FFF8F0',
    allowMixedContent: false,
  },
};

export default config;
