import { useState, useEffect } from 'react';
import { Share, Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 检测是否已安装（standalone 模式）
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // 检测是否为 iOS Safari
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !((window as any).MSStream);
    const safari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
    setIsIOS(ios && safari);

    // 如果是 iOS Safari 且未安装，显示提示
    if (ios && safari && !standalone) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        // 延迟 3 秒显示，让用户先看到内容
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }
  }, []);

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-t-3xl p-6 pb-8 w-full max-w-md shadow-2xl animate-slide-up">
        <button
          onClick={() => {
            setShowPrompt(false);
            localStorage.setItem('pwa-install-dismissed', 'true');
          }}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-coral-light flex items-center justify-center text-white text-xl">
            🤰
          </div>
          <div>
            <h3 className="text-lg font-bold text-dark">安装到主屏幕</h3>
            <p className="text-sm text-gray-500">像原生 App 一样使用</p>
          </div>
        </div>

        <div className="bg-cream rounded-2xl p-4 mb-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center text-coral font-bold text-sm">1</div>
            <p className="text-sm text-dark pt-1">
              点击底部工具栏的 <Share size={16} className="inline text-coral" /> <strong>分享按钮</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center text-coral font-bold text-sm">2</div>
            <p className="text-sm text-dark pt-1">
              在弹出的菜单中选择 <Download size={14} className="inline text-coral" /> <strong>"添加到主屏幕"</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mint/20 flex items-center justify-center text-mint font-bold text-sm">3</div>
            <p className="text-sm text-dark pt-1">
              点击 <strong>"添加"</strong>，即可从主屏幕打开
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowPrompt(false);
              localStorage.setItem('pwa-install-dismissed', 'true');
            }}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            暂不需要
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-coral to-coral-light text-white text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
