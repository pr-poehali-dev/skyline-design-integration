import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const ORDERS_URL = "https://functions.poehali.dev/49185d65-c8b1-4709-866c-47c6d275e4c6";

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  product_name: string;
  message: string;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Выполнена",
  cancelled: "Отменена",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-300",
  in_progress: "bg-yellow-500/20 text-yellow-300",
  done: "bg-green-500/20 text-green-300",
  cancelled: "bg-red-500/20 text-red-300",
};

interface Props {
  token: string;
}

export default function AdminOrders({ token }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch(ORDERS_URL + "/", {
      headers: { "X-Admin-Token": token },
    });
    const raw = await res.json();
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch(ORDERS_URL + "/", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ id, status }),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  if (loading) return <div className="text-neutral-500 text-sm">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold uppercase tracking-wide">Заявки ({orders.length})</h2>
        <button onClick={load} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
          <Icon name="RefreshCw" size={16} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-neutral-500 text-center py-16">Заявок пока нет</div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(order => (
            <div key={order.id} className="bg-neutral-900 border border-neutral-800 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="font-semibold">{order.customer_name}</div>
                  <div className="text-neutral-400 text-sm">{order.customer_phone}</div>
                  {order.customer_email && <div className="text-neutral-500 text-xs">{order.customer_email}</div>}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[order.status] || "bg-neutral-700 text-neutral-300"}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              {order.product_name && (
                <div className="text-sm text-neutral-300 mb-1">
                  <span className="text-neutral-500">Товар: </span>{order.product_name}
                </div>
              )}
              {order.message && (
                <div className="text-sm text-neutral-300 mb-3">
                  <span className="text-neutral-500">Сообщение: </span>{order.message}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => updateStatus(order.id, key)}
                    disabled={order.status === key}
                    className={`text-xs px-3 py-1 border transition-colors cursor-pointer disabled:opacity-30 ${
                      order.status === key
                        ? "border-white text-white"
                        : "border-neutral-700 text-neutral-400 hover:border-white hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="text-neutral-600 text-xs mt-3">
                {new Date(order.created_at).toLocaleString("ru-RU")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
