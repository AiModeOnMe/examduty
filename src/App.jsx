import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Assignment from "./components/Assignment";
import StaffList from "./components/StaffList";
import HallList from "./components/HallList";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <div className="app-orb orb-one" />
        <div className="app-orb orb-two" />
        <div className="app-orb orb-three" />
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assignment" element={<Assignment />} />
            <Route path="/staff" element={<StaffList />} />
            <Route path="/halls" element={<HallList />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </div>
    </BrowserRouter>
  );
}

export default App;
