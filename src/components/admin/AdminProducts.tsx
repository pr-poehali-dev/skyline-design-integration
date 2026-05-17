import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const PRODUCTS_URL = "https://functions.poehali.dev/b4b8fc39-dd30-44fa-9153-af915b9c3e36";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number | null;
  category: string;
  sku: string;
  in_stock: boolean;
  image_url: string;
  created_at: string;
}

const EMPTY: Omit<Product, "id" | "created_at"> = {
  name: "",
  description: "",
  price: null,
  category: "",
  sku: "",
  in_stock: true,
  image_url: "",
};

interface Props {
  token: string;
}

export default function AdminProducts({ token }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(PRODUCTS_URL + "/");
    const raw = await res.json();
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ ...EMPTY });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setForm({ name: p.name, description: p.description || "", price: p.price, category: p.category || "", sku: p.sku || "", in_stock: p.in_stock, image_url: p.image_url || "" });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const method = editId ? "PUT" : "POST";
    const body = editId ? { ...form, id: editId } : form;
    await fetch(PRODUCTS_URL + "/", {
      method,
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить товар?")) return;
    await fetch(PRODUCTS_URL + "/", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ id }),
    });
    load();
  };

  if (loading) return <div className="text-neutral-500 text-sm">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold uppercase tracking-wide">Товары ({products.length})</h2>
        <div className="flex gap-2">
          <button onClick={load} className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-2">
            <Icon name="RefreshCw" size={16} />
          </button>
          <button
            onClick={openCreate}
            className="bg-white text-black text-sm uppercase tracking-wide px-4 py-2 hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-2"
          >
            <Icon name="Plus" size={16} />
            Добавить
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-neutral-900 border border-neutral-700 p-6 mb-6">
          <h3 className="font-bold uppercase tracking-wide text-sm mb-4">
            {editId ? "Редактировать товар" : "Новый товар"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Название *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors"
                placeholder="Фильтр масляный"
              />
            </div>
            <div>
              <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Категория</label>
              <input
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors"
                placeholder="Двигатель"
              />
            </div>
            <div>
              <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Цена (₽)</label>
              <input
                type="number"
                value={form.price ?? ""}
                onChange={e => setForm(f => ({ ...f, price: e.target.value ? Number(e.target.value) : null }))}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors"
                placeholder="450"
              />
            </div>
            <div>
              <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Артикул</label>
              <input
                value={form.sku}
                onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors"
                placeholder="2121-1012005"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Описание</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors resize-none"
                placeholder="Краткое описание товара"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Ссылка на фото</label>
              <input
                value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors"
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-neutral-400 text-xs uppercase tracking-wide">В наличии</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, in_stock: !f.in_stock }))}
                className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${form.in_stock ? "bg-white" : "bg-neutral-700"}`}
              >
                <span className={`block w-4 h-4 rounded-full bg-black mx-1 transition-transform ${form.in_stock ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={saving || !form.name}
              className="bg-white text-black text-sm uppercase tracking-wide px-5 py-2 hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border border-neutral-700 text-neutral-400 text-sm uppercase tracking-wide px-5 py-2 hover:text-white hover:border-white transition-colors cursor-pointer"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-neutral-500 text-center py-16">Товаров нет — добавьте первый</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-neutral-900 border border-neutral-800 p-4">
              {p.image_url && (
                <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover mb-3 bg-neutral-800" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  {p.category && <div className="text-neutral-500 text-xs">{p.category}</div>}
                  {p.sku && <div className="text-neutral-600 text-xs">Арт: {p.sku}</div>}
                </div>
                <div className="text-right shrink-0">
                  {p.price && <div className="font-bold text-sm">{p.price.toLocaleString("ru")} ₽</div>}
                  <span className={`text-xs ${p.in_stock ? "text-green-400" : "text-red-400"}`}>
                    {p.in_stock ? "В наличии" : "Нет"}
                  </span>
                </div>
              </div>
              {p.description && <p className="text-neutral-400 text-xs mt-2 line-clamp-2">{p.description}</p>}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 border border-neutral-700 text-neutral-400 text-xs py-1.5 hover:text-white hover:border-white transition-colors cursor-pointer"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="border border-neutral-800 text-neutral-600 text-xs py-1.5 px-3 hover:text-red-400 hover:border-red-400 transition-colors cursor-pointer"
                >
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
