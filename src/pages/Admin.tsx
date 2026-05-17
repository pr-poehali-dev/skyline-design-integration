import { useState, useEffect } from "react";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";

const STORAGE_KEY = "niva_admin_token";

export default function Admin() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const handleLogin = (t: string) => {
    localStorage.setItem(STORAGE_KEY, t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  };

  if (!token) return <AdminLogin onLogin={handleLogin} />;
  return <AdminDashboard token={token} onLogout={handleLogout} />;
}
