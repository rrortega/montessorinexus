import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, KeyRound, Building2, ArrowRight, Sparkles, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor introduce tu correo y contraseña.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast.success('¡Sesión iniciada correctamente!');
    } else {
      toast.error(res.error || 'Credenciales incorrectas');
    }
  };

  const handleQuickFill = (userType: 'superadmin' | 'admin' | 'guide' | 'tutor') => {
    if (userType === 'superadmin') {
      setEmail('admin@montessorinexus.com');
      setPassword('NexusSuperAdmin2026!');
    } else if (userType === 'admin') {
      setEmail('admin@ceibamontessori.com');
      setPassword('admin123');
    } else if (userType === 'guide') {
      setEmail('patti@gmail.com');
      setPassword('admin123');
    } else {
      setEmail('padre.ejemplo@ceibamontessori.com');
      setPassword('admin');
    }
  };

  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('192.168.') ||
    window.location.hostname.includes('.local')
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 relative overflow-hidden font-body">
      {/* Organic subtle background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-forest/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-terracotta/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-3xl p-8 shadow-card border border-forest/10 relative z-10 transition-all duration-300">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-forest/10 text-forest rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-forest/20">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-forest tracking-tight">
            Plataforma Escolar Multi-Tenant
          </h1>
          <p className="text-muted-foreground text-xs mt-1 font-body">
            Acceso unificado para Dirección, Guías Pedagógicas y Familias
          </p>
        </div>

        {/* Quick Demo Fill Buttons (Enabled on Localhost / Dev) */}
        {isLocalhost && (
          <div className="mb-5 p-3 bg-cream/70 border border-forest/10 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-forest/70 block mb-1.5 text-center">
              Accesos Rápidos de Demostración:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('superadmin')}
                className="py-2 px-1 bg-amber-500/10 hover:bg-amber-500/20 text-[#C4661F] border border-[#C4661F]/30 rounded-xl text-[10px] font-bold text-center transition-all hover:scale-102 active:scale-98 shadow-2xs cursor-pointer"
                title="admin@montessorinexus.com"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="py-2 px-1 bg-white hover:bg-forest/5 text-forest border border-forest/15 rounded-xl text-[10px] font-bold text-center transition-all hover:scale-102 active:scale-98 shadow-2xs cursor-pointer"
                title="admin@ceibamontessori.com"
              >
                Director
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('guide')}
                className="py-2 px-1 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-[10px] font-bold text-center transition-all hover:scale-102 active:scale-98 shadow-2xs cursor-pointer"
                title="patti@gmail.com (Guía Patricia Hermosa)"
              >
                Guía
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('tutor')}
                className="py-2 px-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-[10px] font-bold text-center transition-all hover:scale-102 active:scale-98 shadow-2xs cursor-pointer"
                title="padre.ejemplo@ceibamontessori.com"
              >
                Tutor
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-forest/20 bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest text-sm font-medium transition-all"
                placeholder="tu-correo@colegio.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-forest/20 bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest text-sm font-medium transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 bg-forest hover:bg-forest/90 text-white rounded-2xl font-display font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-forest/20 hover:shadow-forest/30 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Verificando...</span>
            ) : (
              <>
                <span>Ingresar a la Plataforma</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-forest/10 pt-4">
          <a
            href="/"
            className="text-xs font-medium text-forest/70 hover:text-forest transition-colors inline-flex items-center gap-1"
          >
            ← Volver a la web pública
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
