import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const loginMutation = trpc.auth.loginManual.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginMutation.mutateAsync({ username, password });
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5 w-full">
      {/* Username field */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Usuario</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ingresa tu usuario"
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#0D3B2E] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 transition-all text-gray-900 placeholder-gray-400 font-sans"
          disabled={loading}
        />
      </div>

      {/* Password field */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#0D3B2E] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 transition-all text-gray-900 placeholder-gray-400 font-sans"
          disabled={loading}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">❌ {error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading || !username || !password}
        className="w-full bg-[#0D3B2E] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#0a2820] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-sans"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Iniciando sesión...
          </span>
        ) : (
          "Iniciar Sesión"
        )}
      </button>
    </form>
  );
}
