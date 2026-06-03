import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Heart, Baby, FileText, Archive, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isNative, isIOS } from '@/plugins/health';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/health', label: '健康数据', icon: Heart },
  { to: '/pregnancy', label: '孕期追踪', icon: Baby },
  { to: '/report', label: '报告解析', icon: FileText },
  { to: '/archive', label: '健康档案', icon: Archive },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 原生端状态栏和安全区域设置
  useEffect(() => {
    if (!isNative) return;

    const setupNative = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        if (isIOS) {
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
      } catch {
        // StatusBar plugin may not be available on all platforms
      }
    };

    setupNative();
  }, []);

  // Tab 切换时触觉反馈
  const handleTabClick = async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics may not be available
    }
  };

  return (
    <div className={`min-h-screen bg-cream font-sans ${isNative ? 'native-app' : ''}`}>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col bg-white shadow-lg lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-coral-light">
            <Baby className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-dark">孕婴守护</h1>
            <p className="text-xs text-gray-400">健康管理中心</p>
          </div>
        </div>
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-coral to-coral-light text-white shadow-md'
                    : 'text-gray-600 hover:bg-coral-light/30 hover:text-coral'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-mint-light to-mint/30 p-4">
          <p className="text-sm font-medium text-dark">💡 每日提醒</p>
          <p className="mt-1 text-xs text-gray-500">记得记录今天的健康数据哦</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className={`fixed left-0 right-0 top-0 z-30 flex items-center justify-between bg-white/80 px-4 py-3 backdrop-blur-md lg:hidden ${isNative ? 'safe-area-top' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-coral-light">
            <Baby className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-base font-bold text-dark">孕婴守护</span>
        </div>
        {!isNative && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
      </header>

      {/* Mobile Menu Overlay - 仅 Web 端显示 */}
      {!isNative && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu - 仅 Web 端显示 */}
      {!isNative && (
        <div
          className={`fixed left-0 top-0 z-40 h-full w-64 transform bg-white shadow-xl transition-transform duration-300 lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center gap-3 px-6 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-coral-light">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-dark">孕婴守护</h1>
              <p className="text-xs text-gray-400">健康管理中心</p>
            </div>
          </div>
          <nav className="mt-4 space-y-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-coral to-coral-light text-white shadow-md'
                      : 'text-gray-600 hover:bg-coral-light/30 hover:text-coral'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={`pb-20 pt-14 lg:ml-64 lg:pb-6 lg:pl-6 lg:pr-6 lg:pt-6 ${isNative ? 'safe-area-bottom' : ''}`}>
        <div className="mx-auto max-w-6xl px-4 lg:px-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tab */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 border-t border-gray-100 bg-white/90 backdrop-blur-md lg:hidden ${isNative ? 'safe-area-bottom-nav' : ''}`}>
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={handleTabClick}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
                  isActive ? 'text-coral' : 'text-gray-400'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
