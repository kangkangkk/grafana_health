import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import HealthData from "@/pages/HealthData";
import Pregnancy from "@/pages/Pregnancy";
import Report from "@/pages/Report";
import Archive from "@/pages/Archive";
import { isNative } from "@/plugins/health";
import { App as CapacitorApp } from "@capacitor/app";

export default function App() {
  // 原生端应用生命周期处理
  if (isNative) {
    CapacitorApp.addListener('appStateChange', (state) => {
      if (!state.isActive) {
        // 应用进入后台
        console.log('App paused');
      } else {
        // 应用恢复前台
        console.log('App resumed');
      }
    });

    // 深度链接处理
    CapacitorApp.addListener('appUrlOpen', (data) => {
      console.log('Deep link opened:', data.url);
    });
  }

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
    </Router>
  );
}
