import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import HealthData from "@/pages/HealthData";
import Pregnancy from "@/pages/Pregnancy";
import Report from "@/pages/Report";
import Archive from "@/pages/Archive";
import InstallPrompt from "@/components/InstallPrompt";
import { isNative } from "@/plugins/health";
import { App as CapacitorApp, AppState } from "@capacitor/app";

export default function App() {
  useEffect(() => {
    if (!isNative) return;

    const listeners: Array<() => void> = [];

    // 应用生命周期处理
    CapacitorApp.addListener('appStateChange', (state: AppState) => {
      if (!state.isActive) {
        console.log('App paused');
      } else {
        console.log('App resumed');
      }
    }).then(l => listeners.push(() => l.remove()));

    // 深度链接处理
    CapacitorApp.addListener('appUrlOpen', (data) => {
      console.log('Deep link opened:', data.url);
    }).then(l => listeners.push(() => l.remove()));

    return () => {
      listeners.forEach(remove => remove());
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/health" element={<HealthData />} />
          <Route path="/pregnancy" element={<Pregnancy />} />
          <Route path="/report" element={<Report />} />
          <Route path="/archive" element={<Archive />} />
        </Route>
      </Routes>
      <InstallPrompt />
    </Router>
  );
}
