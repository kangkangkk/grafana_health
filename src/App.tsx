import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import HealthData from "@/pages/HealthData";
import Pregnancy from "@/pages/Pregnancy";
import Report from "@/pages/Report";
import Archive from "@/pages/Archive";

export default function App() {
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
