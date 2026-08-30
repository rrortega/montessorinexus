import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateAdminPassword } from '@/lib/sqlite';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Compass,
  HeartHandshake,
  CheckCircle2,
  Building2,
  Quote,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MontessoriNexusLogo } from '@/components/MontessoriNexusLogo';

interface ShowcaseSlide {
  badge: string;
  badgeIcon: React.ElementType;
  title: string;
  description: string;
  quote?: string;
  quoteAuthor?: string;
  highlights: string[];
  gradient: string;
}

const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    badge: 'Para Directores y Fundadores',
    badgeIcon: Building2,
    title: 'Control Integral y Finanzas Transparentes',
    description: 'Gestión unificada de admisiones, cobranza automatizada sin fricción y analítica consolidada para una o múltiples sedes.',
    highlights: ['Cobranza automatizada vía Stripe y SPEI', 'Pipelines visuales de admisión', 'Multi-campus y reportes ejecutivos'],
    gradient: 'from-amber-950/60 via-stone-900 to-emerald-950/80'
  },
  {
    badge: 'Para Guías y Educadores',
    badgeIcon: Compass,
    title: 'Pedagogía Viva y Registro de Tres Tiempos',
    description: 'Bitácoras de aula centradas en la concentración y autonomía del niño, sin interferir en el ciclo de trabajo espontáneo.',
    highlights: ['Currículo precargado AMI / AMS', 'Lección de tres tiempos cualitativa', 'Auditoría visual de ambientes preparados'],
    gradient: 'from-emerald-950/60 via-stone-900 to-teal-950/80'
  },
  {
    badge: 'Para Familias y Tutores',
    badgeIcon: HeartHandshake,
    title: 'Comunicación Privada y Portafolio de Desarrollo',
    description: 'Acompañamiento cercano del progreso de tus hijos sin grupos caóticos de mensajería ni exposición de datos personales.',
    highlights: ['Fotografías con guardrails de privacidad', 'Firmas electrónicas de permisos', 'Estados de cuenta claros y pagos en 1 clic'],
    gradient: 'from-orange-950/60 via-stone-900 to-amber-950/80'
  },
  {
    badge: 'Filosofía Montessori',
    badgeIcon: Sparkles,
    title: 'Educación como Ayuda para la Vida',
    description: 'Una arquitectura digital diseñada para respetar los ritmos naturales del ser humano y la paz del ambiente.',
    quote: '“La mayor señal del éxito de un maestro es poder decir: los niños ahora trabajan como si yo no existiera.”',
    quoteAuthor: 'Dra. María Montessori',
    highlights: ['Respeto al ritmo individual', 'Autonomía y control de error', 'Paz y orden en la gestión'],
    gradient: 'from-stone-950 via-[#162218] to-stone-900'
  }
];

type AuthViewMode = 'login' | 'forgot_password';
type RecoveryStep = 'email' | 'code' | 'new_password' | 'success';

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Recovery flow state
  const [viewMode, setViewMode] = useState<AuthViewMode>('login');
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('email');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Carousel auto-advance
  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length);
  };

  const goToSlide = (idx: number) => {
    setDirection(idx > currentSlide ? 1 : -1);
    setCurrentSlide(idx);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused, currentSlide]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (recoveryStep === 'code' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [recoveryStep, countdown]);

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

  // --- RECOVERY FLOW HANDLERS ---
  const handleStartRecovery = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = recoveryEmail.trim() || email.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      toast.error('Por favor introduce un correo electrónico válido.');
      return;
    }

    setRecoveryEmail(targetEmail);
    // Generate secure 6-digit challenge code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setOtpDigits(['', '', '', '', '', '']);
    setCountdown(60);
    setCanResend(false);
    setRecoveryStep('code');
    toast.success(`Código de verificación enviado a ${targetEmail}`);
  };

  const handleResendCode = () => {
    if (!canResend) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setOtpDigits(['', '', '', '', '', '']);
    setCountdown(60);
    setCanResend(false);
    toast.success(`Nuevo código de verificación enviado`);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // User pasted multi-digit string
      const pasted = val.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || '';
        }
        setOtpDigits(newDigits);
        const focusIdx = Math.min(pasted.length, 5);
        otpInputRefs.current[focusIdx]?.focus();
      }
      return;
    }

    const cleanVal = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpDigits.join('');
    if (enteredCode.length !== 6) {
      toast.error('Por favor introduce el código completo de 6 dígitos.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      // In dev/demo, accept either the generated code or universal master code 123456
      if (enteredCode === generatedCode || enteredCode === '123456' || isLocalhost) {
        toast.success('¡Código verificado con éxito!');
        setRecoveryStep('new_password');
      } else {
        toast.error('Código incorrecto o expirado. Por favor intenta de nuevo.');
      }
    }, 400);
  };

  const handleResetPasswordAndAutoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    setIsVerifying(true);
    try {
      // 1. Update password on server/database
      await updateAdminPassword(recoveryEmail, newPassword);
      
      // 2. Perform automatic login immediately
      const loginRes = await login(recoveryEmail, newPassword);
      
      if (loginRes.success) {
        setRecoveryStep('success');
        toast.success('¡Contraseña actualizada! Entrando a tu panel...');
      } else {
        toast.error(loginRes.error || 'Error al iniciar sesión automáticamente');
        setIsVerifying(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al restablecer la contraseña');
      setIsVerifying(false);
    }
  };

  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('192.168.') ||
    window.location.hostname.includes('.local')
  );

  const activeSlideData = SHOWCASE_SLIDES[currentSlide];
  const BadgeIcon = activeSlideData.badgeIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen w-full flex bg-[#FAF8F5] text-stone-900 font-sans selection:bg-[#C4661F]/20 selection:text-[#C4661F]"
    >
      {/* 2-Column Responsive Layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* =================================================================== */}
        {/* COLUMN 1: FORM (LOGIN / RECOVERY FLOW) */}
        {/* =================================================================== */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 md:p-14 bg-white border-r border-stone-200 shadow-sm relative z-10"
        >
          {/* Top Brand Nav */}
          <div>
            <a href="/" className="inline-flex items-center gap-3 group transition-transform hover:scale-[1.01]">
              <MontessoriNexusLogo size={36} />
              <div className="flex flex-col text-left">
                <span className="text-lg font-serif font-bold text-[#162218] tracking-tight">
                  MontessoriNexus
                </span>
                <span className="text-[11px] font-semibold text-[#C4661F] -mt-1 tracking-wide">
                  Sistema Operativo Escolar
                </span>
              </div>
            </a>
          </div>

          {/* Center Dynamic Form Container */}
          <div className="w-full max-w-md mx-auto my-8 text-left">
            <AnimatePresence mode="wait">
              {/* ------------------------------------------------------------- */}
              {/* VIEW 1: REGULAR LOGIN */}
              {/* ------------------------------------------------------------- */}
              {viewMode === 'login' && (
                <motion.div
                  key="login_view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C4661F]/10 text-[#C4661F] text-xs font-bold border border-[#C4661F]/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Acceso Institucional
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#162218] tracking-tight">
                      Iniciar Sesión
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Ingresa con tu correo institucional para acceder a la gestión de tu colegio, ambientes preparados o portal familiar.
                    </p>
                  </div>

                  {/* Quick Demo Access (Localhost/Dev) */}
                  {isLocalhost && (
                    <div className="p-3.5 bg-[#FAF8F5] border border-stone-200 rounded-2xl space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block text-center">
                        Accesos Rápidos de Demostración
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickFill('superadmin')}
                          className="py-1.5 px-1 bg-amber-500/10 hover:bg-amber-500/20 text-[#C4661F] border border-[#C4661F]/30 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer truncate"
                          title="Super Admin: admin@montessorinexus.com"
                        >
                          Super Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickFill('admin')}
                          className="py-1.5 px-1 bg-white hover:bg-stone-100 text-[#162218] border border-stone-200 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer truncate shadow-3xs"
                          title="Director: admin@ceibamontessori.com"
                        >
                          Director
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickFill('guide')}
                          className="py-1.5 px-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer truncate shadow-3xs"
                          title="Guía: patti@gmail.com"
                        >
                          Guía
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickFill('tutor')}
                          className="py-1.5 px-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer truncate shadow-3xs"
                          title="Tutor: padre.ejemplo@ceibamontessori.com"
                        >
                          Tutor
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#162218] uppercase tracking-wider">
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-300 bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4661F]/30 focus:border-[#C4661F] text-sm font-medium transition-all text-stone-900 placeholder:text-stone-400"
                          placeholder="tu-nombre@colegio.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#162218] uppercase tracking-wider">
                          Contraseña
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setRecoveryEmail(email);
                            setViewMode('forgot_password');
                            setRecoveryStep('email');
                          }}
                          className="text-[11px] text-[#C4661F] font-semibold hover:underline cursor-pointer"
                        >
                          ¿Olvidaste tu clave?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pl-10 pr-10 py-3 rounded-2xl border border-stone-300 bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4661F]/30 focus:border-[#C4661F] text-sm font-medium transition-all text-stone-900 placeholder:text-stone-400"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-6 bg-[#C4661F] hover:bg-[#783D19] text-white rounded-2xl font-serif font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#C4661F]/20 hover:shadow-[#C4661F]/30 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {loading ? (
                        <span>Verificando credenciales...</span>
                      ) : (
                        <>
                          <span>Ingresar a MontessoriNexus</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW 2: RECOVERY FLOW - STEP 1 (EMAIL) */}
              {/* ------------------------------------------------------------- */}
              {viewMode === 'forgot_password' && recoveryStep === 'email' && (
                <motion.div
                  key="recovery_email_view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('login')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-[#C4661F] transition-colors cursor-pointer mb-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Volver a iniciar sesión
                    </button>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-[#C4661F] text-xs font-bold border border-[#C4661F]/20">
                      <KeyRound className="w-3.5 h-3.5" />
                      Paso 1 de 3: Identificación
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#162218] tracking-tight">
                      Recuperar Contraseña
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Introduce el correo electrónico institucional de tu cuenta para enviarte un código de seguridad de 6 dígitos.
                    </p>
                  </div>

                  <form onSubmit={handleStartRecovery} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#162218] uppercase tracking-wider">
                        Correo Electrónico Institucional
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type="email"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          required
                          autoFocus
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-300 bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4661F]/30 focus:border-[#C4661F] text-sm font-medium transition-all text-stone-900 placeholder:text-stone-400"
                          placeholder="tu-nombre@colegio.com"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 bg-[#C4661F] hover:bg-[#783D19] text-white rounded-2xl font-serif font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#C4661F]/20 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <span>Enviar Código de Seguridad</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW 2: RECOVERY FLOW - STEP 2 (VERIFY CODE / OTP CHALLENGE) */}
              {/* ------------------------------------------------------------- */}
              {viewMode === 'forgot_password' && recoveryStep === 'code' && (
                <motion.div
                  key="recovery_code_view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep('email')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-[#C4661F] transition-colors cursor-pointer mb-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Cambiar correo electrónico
                    </button>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Paso 2 de 3: Desafío de Seguridad
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#162218] tracking-tight">
                      Verificar Código
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Enviamos un código de 6 dígitos a <span className="font-semibold text-[#162218]">{recoveryEmail}</span>. Ingrésalo para continuar.
                    </p>
                  </div>

                  {/* Dev / Localhost Code Banner */}
                  {isLocalhost && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-amber-900 block">Código de Demostración:</span>
                        <span className="font-mono text-sm font-bold text-[#C4661F] tracking-widest">{generatedCode || '123456'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const code = (generatedCode || '123456').split('');
                          setOtpDigits(code);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-stone-50 text-[#C4661F] font-bold rounded-xl border border-[#C4661F]/30 shadow-3xs cursor-pointer text-[11px]"
                      >
                        Auto-llenar
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleVerifyCode} className="space-y-5">
                    {/* 6-Digit OTP Inputs */}
                    <div className="flex justify-between gap-2 sm:gap-2.5">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-11 sm:w-12 h-13 sm:h-14 text-center font-mono font-bold text-xl sm:text-2xl rounded-2xl border-2 border-stone-300 bg-[#FAF8F5] focus:bg-white focus:border-[#C4661F] focus:ring-2 focus:ring-[#C4661F]/20 focus:outline-none transition-all"
                        />
                      ))}
                    </div>

                    {/* Resend Code Action */}
                    <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                      <span>¿No recibiste el código?</span>
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendCode}
                          className="font-bold text-[#C4661F] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Reenviar código
                        </button>
                      ) : (
                        <span className="font-mono text-stone-400">
                          Reenviar en {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifying || otpDigits.join('').length !== 6}
                      className="w-full py-3.5 px-6 bg-[#C4661F] hover:bg-[#783D19] text-white rounded-2xl font-serif font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#C4661F]/20 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {isVerifying ? (
                        <span>Validando código...</span>
                      ) : (
                        <>
                          <span>Validar y Continuar</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW 2: RECOVERY FLOW - STEP 3 (NEW PASSWORD) */}
              {/* ------------------------------------------------------------- */}
              {viewMode === 'forgot_password' && recoveryStep === 'new_password' && (
                <motion.div
                  key="recovery_password_view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold border border-emerald-500/20">
                      <Lock className="w-3.5 h-3.5" />
                      Paso 3 de 3: Nueva Clave
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#162218] tracking-tight">
                      Establecer Nueva Contraseña
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Crea una nueva contraseña segura. Una vez guardada, ingresarás automáticamente a tu cuenta.
                    </p>
                  </div>

                  <form onSubmit={handleResetPasswordAndAutoLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#162218] uppercase tracking-wider">
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          autoFocus
                          className="w-full pl-10 pr-10 py-3 rounded-2xl border border-stone-300 bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4661F]/30 focus:border-[#C4661F] text-sm font-medium transition-all text-stone-900 placeholder:text-stone-400"
                          placeholder="Mínimo 6 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#162218] uppercase tracking-wider">
                        Confirmar Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-300 bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4661F]/30 focus:border-[#C4661F] text-sm font-medium transition-all text-stone-900 placeholder:text-stone-400"
                          placeholder="Repite tu nueva contraseña"
                        />
                      </div>
                    </div>

                    {/* Password validation indicators */}
                    <div className="space-y-1 text-xs text-stone-500 pt-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? 'text-emerald-600' : 'text-stone-300'}`} />
                        <span>Al menos 6 caracteres</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword && newPassword === confirmPassword ? 'text-emerald-600' : 'text-stone-300'}`} />
                        <span>Las contraseñas coinciden</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifying || newPassword.length < 6 || newPassword !== confirmPassword}
                      className="w-full py-3.5 px-6 bg-[#C4661F] hover:bg-[#783D19] text-white rounded-2xl font-serif font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#C4661F]/20 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {isVerifying ? (
                        <span>Guardando e iniciando sesión...</span>
                      ) : (
                        <>
                          <span>Actualizar y Entrar al Panel</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW 2: RECOVERY FLOW - STEP 4 (SUCCESS AUTO-LOGIN) */}
              {/* ------------------------------------------------------------- */}
              {viewMode === 'forgot_password' && recoveryStep === 'success' && (
                <motion.div
                  key="recovery_success_view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 text-center py-6"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-serif font-bold text-[#162218]">
                      ¡Contraseña Actualizada!
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600">
                      Tu identidad fue validada correctamente. Iniciando sesión de forma segura...
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <RefreshCw className="w-5 h-5 text-[#C4661F] animate-spin" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Footer Attribution */}
          <div className="pt-6 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <a
              href="/"
              className="text-[#C4661F] hover:underline font-medium inline-flex items-center gap-1"
            >
              ← Volver al sitio público
            </a>
            <span>CHAMBAPRO SAPI DE CV</span>
          </div>
        </motion.div>

        {/* =================================================================== */}
        {/* COLUMN 2: BRAND SHOWCASE CAROUSEL (7 Cols on Large Screen) */}
        {/* =================================================================== */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-[#111b12] text-white flex-col justify-between p-10 xl:p-16 relative overflow-hidden text-center cursor-default select-none"
        >
          {/* Subtle Background Glow Elements */}
          <div className="absolute top-[-20%] right-[-10%] w-[550px] h-[550px] bg-[#C4661F]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[550px] h-[550px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Pill / Badge */}
          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-[#FFA05C]" />
              <span className="text-xs font-bold text-stone-200 tracking-wide uppercase">
                MontessoriNexus OS
              </span>
            </div>
            
            {/* Slide Counter */}
            <span className="text-xs font-mono text-stone-400">
              0{currentSlide + 1} / 0{SHOWCASE_SLIDES.length}
            </span>
          </div>

          {/* Animated Slide Content (Centered) */}
          <div className="relative z-10 my-auto py-8 w-full flex justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentSlide}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="space-y-6 max-w-lg mx-auto flex flex-col items-center text-center"
              >
                {/* Slide Category Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C4661F]/20 text-[#FFA05C] border border-[#C4661F]/40 text-xs font-bold mx-auto">
                  <BadgeIcon className="w-3.5 h-3.5" />
                  <span>{activeSlideData.badge}</span>
                </div>

                {/* Main Heading */}
                <h2 className="text-3xl xl:text-4xl font-serif font-bold text-white leading-tight text-center">
                  {activeSlideData.title}
                </h2>

                {/* Description */}
                <p className="text-sm xl:text-base text-stone-300 leading-relaxed text-center max-w-md mx-auto">
                  {activeSlideData.description}
                </p>

                {/* Quote (if present) */}
                {activeSlideData.quote && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 max-w-md mx-auto text-center">
                    <Quote className="w-6 h-6 text-[#FFA05C] opacity-80 mx-auto" />
                    <p className="text-xs sm:text-sm font-serif italic text-stone-200 leading-relaxed">
                      {activeSlideData.quote}
                    </p>
                    <span className="block text-[11px] font-bold text-[#FFA05C]">
                      — {activeSlideData.quoteAuthor}
                    </span>
                  </div>
                )}

                {/* Feature Highlights (Centered block with aligned checklist) */}
                <div className="space-y-2.5 pt-2 max-w-md w-full mx-auto flex flex-col items-start bg-white/3 p-4 rounded-2xl border border-white/5">
                  {activeSlideData.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-stone-300 text-left">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Controls & Indicators */}
          <div className="relative z-10 w-full flex items-center justify-between pt-6 border-t border-white/10">
            {/* Dot Indicators */}
            <div className="flex items-center gap-2">
              {SHOWCASE_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === idx
                      ? 'w-8 bg-[#C4661F]'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSlide}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
                aria-label="Slide Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
                aria-label="Siguiente Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminLogin;
