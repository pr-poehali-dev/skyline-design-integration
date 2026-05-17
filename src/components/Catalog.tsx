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
}

const CATEGORIES = ["Все", "Двигатель", "Подвеска и рулевое", "Тормозная система", "Кузов и оптика", "Трансмиссия"];

const CATEGORY_ICONS: Record<string, string> = {
  "Двигатель": "Cog",
  "Подвеска и рулевое": "Wrench",
  "Тормозная система": "CircleStop",
  "Кузов и оптика": "Car",
  "Трансмиссия": "Settings2",
};

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(PRODUCTS_URL + "/")
      .then(r => r.json())
      .then(raw => {
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const filtered = products.filter(p => {
    const matchCat = activeCategory === "Все" || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <section id="catalog" className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-2 uppercase">
          Каталог запчастей
        </h2>
        <p className="text-neutral-500 mb-10 text-sm uppercase tracking-wide">
          ВАЗ-2121 · 21213 · 21214 — классические Нивы
        </p>

        {/* Фильтры */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по названию или артикулу..."
              className="w-full border border-neutral-300 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-xs uppercase tracking-wide border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? "bg-black text-white border-black"
                    : "border-neutral-300 text-neutral-600 hover:border-black hover:text-black"
                }`}
              >
                {cat !== "Все" && <Icon name={CATEGORY_ICONS[cat] || "Package"} size={12} />}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Счётчик */}
        {!loading && (
          <p className="text-neutral-400 text-xs mb-6 uppercase tracking-wide">
            Найдено: {filtered.length} позиций
          </p>
        )}

        {/* Сетка товаров */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-neutral-100 h-48 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-neutral-400">Ничего не найдено</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="border border-neutral-200 p-4 hover:border-black transition-colors group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs uppercase tracking-wide text-neutral-400 flex items-center gap-1">
                    <Icon name={CATEGORY_ICONS[p.category] || "Package"} size={11} />
                    {p.category}
                  </span>
                  <span className={`text-xs px-2 py-0.5 ${p.in_stock ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                    {p.in_stock ? "В наличии" : "Нет"}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-neutral-900 leading-snug mb-1 group-hover:text-black">
                  {p.name}
                </h3>
                {p.description && (
                  <p className="text-neutral-400 text-xs mb-3 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-end justify-between mt-auto pt-3 border-t border-neutral-100">
                  <div>
                    {p.price ? (
                      <span className="font-bold text-lg text-neutral-900">
                        {p.price.toLocaleString("ru")} ₽
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-sm">Цена по запросу</span>
                    )}
                    {p.sku && (
                      <div className="text-neutral-300 text-xs mt-0.5">Арт: {p.sku}</div>
                    )}
                  </div>
                  <button className="bg-black text-white text-xs px-3 py-2 uppercase tracking-wide hover:bg-neutral-800 transition-colors cursor-pointer">
                    Заказать
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
