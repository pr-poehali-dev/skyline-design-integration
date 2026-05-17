import { useState } from "react";

const AUTH_URL = "https://functions.poehali.dev/963c4c5e-0490-4949-b7d3-147259783265";

interface Props {
  onLogin: (token: string) => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(AUTH_URL + "/" + mode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка");
      } else {
        onLogin(data.token);
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-white text-3xl font-bold tracking-tight mb-2 uppercase">
          {mode === "login" ? "Вход" : "Создать аккаунт"}
        </h1>
        <p className="text-neutral-500 text-sm mb-8">Панель управления НИВА ЗАПЧАСТИ</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Логин</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black font-bold uppercase tracking-wide px-4 py-3 text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать и войти"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 text-neutral-500 text-xs hover:text-neutral-300 transition-colors cursor-pointer"
        >
          {mode === "login" ? "Первый раз? Создать аккаунт →" : "Уже есть аккаунт? Войти →"}
        </button>
      </div>
    </div>
  );
}
