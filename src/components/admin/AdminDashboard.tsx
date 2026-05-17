import { useState } from "react";
import AdminProducts from "./AdminProducts";
import AdminOrders from "./AdminOrders";
import Icon from "@/components/ui/icon";

interface Props {
  token: string;
  onLogout: () => void;
}

type Tab = "orders" | "products";

export default function AdminDashboard({ token, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("orders");

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold uppercase tracking-wide text-sm">НИВА — Админ</span>
          <nav className="flex gap-1">
            <button
              onClick={() => setTab("orders")}
              className={`px-4 py-2 text-sm uppercase tracking-wide transition-colors cursor-pointer ${
                tab === "orders" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              Заявки
            </button>
            <button
              onClick={() => setTab("products")}
              className={`px-4 py-2 text-sm uppercase tracking-wide transition-colors cursor-pointer ${
                tab === "products" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              Товары
            </button>
          </nav>
        </div>
        <button
          onClick={onLogout}
          className="text-neutral-400 hover:text-white transition-colors text-sm flex items-center gap-2 cursor-pointer"
        >
          <Icon name="LogOut" size={16} />
          Выйти
        </button>
      </header>

      <main className="p-6">
        {tab === "orders" && <AdminOrders token={token} />}
        {tab === "products" && <AdminProducts token={token} />}
      </main>
    </div>
  );
}
