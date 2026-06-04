import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// 注册 PWA Service Worker
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        // 有新版本可用时可以提示用户刷新
        console.log('新版本可用，刷新页面即可更新');
      },
      onOfflineReady() {
        console.log('应用已可离线使用');
      },
    });
  }).catch(() => {
    // 开发环境可能没有 virtual:pwa-register
    console.log('PWA 注册跳过（开发模式）');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
