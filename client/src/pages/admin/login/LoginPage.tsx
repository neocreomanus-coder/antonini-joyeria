import { Link } from "wouter";
import { LoginForm } from "./LoginForm";

export function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D3B2E] p-6 relative overflow-hidden">
      {/* Decorative pattern background */}
      <div 
        className="absolute inset-0 opacity-5" 
        style={{ 
          backgroundImage: "radial-gradient(circle at 25% 25%, #C9A84C 2px, transparent 2px), radial-gradient(circle at 75% 75%, #C9A84C 2px, transparent 2px)", 
          backgroundSize: "60px 60px" 
        }} 
      />

      {/* Content container */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <img 
            src="/manus-storage/antonini-logo-v3_d35b56de.png" 
            alt="Antonini Joyería" 
            className="h-32 w-auto mx-auto object-contain drop-shadow-2xl mb-8" 
          />
          <h1 className="text-3xl font-sans font-bold text-white mb-2">Panel Admin</h1>
          <p className="text-white/60 text-sm">Acceso Exclusivo</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-sans font-bold text-gray-900 mb-1">Bienvenido</h2>
          <p className="text-gray-500 text-sm mb-8">Ingresa tus credenciales para acceder</p>
          
          <LoginForm />

          {/* Security note */}
          <div className="mt-6 flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-5 h-5 rounded-full bg-[#0D3B2E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-[#0D3B2E]">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">Conexión segura</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Tu información está protegida</p>
            </div>
          </div>

          {/* Back to store */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-gray-400 hover:text-[#0D3B2E] transition-colors font-medium">
              ← Volver a la tienda
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />
    </div>
  );
}
