import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  School,
  Users,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Compass,
  HeartHandshake,
  Lock,
  GraduationCap
} from 'lucide-react';
import { MontessoriNexusLogo } from '@/components/MontessoriNexusLogo';
import { getPlatformHomeUrl, getSaaSBlogUrl } from '@/lib/urls';
import {
  LanguageFlag,
  LANGUAGES,
  type Language
} from './public/MontessoriNexusLanding';

interface SchoolNotFoundPageProps {
  attemptedHost?: string;
  onOpenCreateSchool?: () => void;
}

const translations = {
  es: {
    badgeStatus: 'Colegio no encontrado',
    titlePrefix: 'Este colegio no existe en',
    titleSuffix: 'MontessoriNexus',
    descPrefix: 'La dirección',
    descSuffix: 'no está asociada a ningún colegio registrado en la plataforma. Si este subdominio pertenece a tu institución educativa, podés darla de alta y activarla hoy mismo.',
    
    // Families Card
    familiesTitle: '¿Buscabas el portal de tu escuela?',
    familiesSubtitle: 'Para madres, padres, familias y tutores',
    familiesDesc: 'El colegio que intentás visitar no existe en esta dirección. Verificá que el enlace esté bien escrito o consultá con la dirección de tu institución.',
    familiesBtn: 'Ir al Portal Principal',

    // Founders Card
    foundersBadge: 'Prueba Gratuita de 3 Meses',
    foundersTitle: '¿Sos director o fundador de este colegio?',
    foundersSubtitle: 'Registrá tu escuela en MontessoriNexus y reservá este subdominio',
    foundersBenefit1: 'Sitio web institucional con subdominio propio y constructor visual',
    foundersBenefit2: 'Gestión pedagógica de salones (Comunidad Infantil, Casa de Niños, Taller)',
    foundersBenefit3: 'IA ética para observación cualitativa y protección facial de infantes',
    foundersBtn: 'Dar de Alta este Colegio',

    // Feature Highlights
    feat1Title: 'Pedagogía & Observación AMI',
    feat1Desc: 'Registro cualitativo del ciclo de trabajo de 3 horas, periodos sensitivos y presentaciones sin calificaciones numéricas.',
    feat2Title: 'Privacidad & Cuidado Infantil',
    feat2Desc: 'Protección facial automática en fotos escolares, consentimientos parentales digitales y estricta custodia de datos.',
    feat3Title: 'Gestión Serena e Integral',
    feat3Desc: 'Admisiones, expedientes pedagógicos, comunicación respetuosa con familias y cobranza automatizada sin estrés.',

    // Nav & Footer
    navHome: 'Conocer la Plataforma',
    navBlog: 'Blog Pedagógico',
    navLogin: 'Acceso al Sistema',
    footerRights: 'Tecnología serena que honra el Método Montessori.',
    footerTerms: 'Términos de Servicio',
    footerPrivacy: 'Política de Privacidad',
    footerSupport: 'Soporte'
  },
  en: {
    badgeStatus: 'School not found',
    titlePrefix: 'This school does not exist on',
    titleSuffix: 'MontessoriNexus',
    descPrefix: 'The address',
    descSuffix: 'is not associated with any registered school on the platform. If this subdomain belongs to your educational institution, you can register and activate it today.',
    
    // Families Card
    familiesTitle: 'Looking for your school’s portal?',
    familiesSubtitle: 'For parents, families, and guardians',
    familiesDesc: 'The school you are trying to visit does not exist at this address. Please check that the URL was typed correctly or contact your school’s administration.',
    familiesBtn: 'Go to Main Platform',

    // Founders Card
    foundersBadge: '3-Month Free Trial',
    foundersTitle: 'Are you a school founder or director?',
    foundersSubtitle: 'Register your school on MontessoriNexus and claim this subdomain',
    foundersBenefit1: 'Institutional website with custom subdomain and brand builder',
    foundersBenefit2: 'Classrooms tracking (Infant Community, Children’s House, Elementary)',
    foundersBenefit3: 'Ethical AI for qualitative observations and child face privacy',
    foundersBtn: 'Register This School',

    // Feature Highlights
    feat1Title: 'AMI Pedagogy & Observation',
    feat1Desc: 'Qualitative logging of the 3-hour work cycle, sensitive periods, and presentations with zero numerical grading.',
    feat2Title: 'Child Safety & Privacy',
    feat2Desc: 'Automatic face blurring on student photos, digital parental consent workflows, and strict data custody.',
    feat3Title: 'Serene School Operations',
    feat3Desc: 'Admissions, pedagogical records, mindful family communication, and automated tuition management.',

    // Nav & Footer
    navHome: 'Explore Platform',
    navBlog: 'Pedagogical Blog',
    navLogin: 'School Login',
    footerRights: 'Mindful technology that honors the Montessori Method.',
    footerTerms: 'Terms of Service',
    footerPrivacy: 'Privacy Policy',
    footerSupport: 'Support'
  },
  pt: {
    badgeStatus: 'Escola não encontrada',
    titlePrefix: 'Esta escola não existe no',
    titleSuffix: 'MontessoriNexus',
    descPrefix: 'O endereço',
    descSuffix: 'não está associado a nenhuma escola registrada na plataforma. Se este subdomínio pertence à sua instituição de ensino, você pode cadastrá-la e ativá-la hoje mesmo.',
    
    // Families Card
    familiesTitle: 'Procurando o portal da sua escola?',
    familiesSubtitle: 'Para pais, famílias e responsáveis',
    familiesDesc: 'A escola que você está tentando acessar não existe neste endereço. Verifique se o link foi digitado corretamente ou consulte a secretaria da sua instituição.',
    familiesBtn: 'Ir para a Plataforma Principal',

    // Founders Card
    foundersBadge: 'Teste Grátis de 3 Meses',
    foundersTitle: 'É diretor ou fundador desta escola?',
    foundersSubtitle: 'Cadastre sua escola no MontessoriNexus e garanta este subdomínio',
    foundersBenefit1: 'Site institucional com subdomínio próprio e construtor visual',
    foundersBenefit2: 'Gestão pedagógica de salas (Comunidade Infantil, Casa das Crianças, Taller)',
    foundersBenefit3: 'IA ética para observação qualitativa e proteção facial infantil',
    foundersBtn: 'Cadastrar Esta Escola',

    // Feature Highlights
    feat1Title: 'Pedagogia & Observação AMI',
    feat1Desc: 'Registro qualitativo do ciclo de trabalho de 3 horas, períodos sensíveis e apresentações sem notas numéricas.',
    feat2Title: 'Privacidade & Proteção Infantil',
    feat2Desc: 'Proteção facial automática em fotos, termos de consentimento digital e custódia rigorosa de dados.',
    feat3Title: 'Gestão Serena e Integrada',
    feat3Desc: 'Admissões, registros pedagógicos, comunicação consciente com as famílias e mensalidades sem estresse.',

    // Nav & Footer
    navHome: 'Conhecer a Plataforma',
    navBlog: 'Blog Pedagógico',
    navLogin: 'Acesso ao Sistema',
    footerRights: 'Tecnologia serena que honra o Método Montessori.',
    footerTerms: 'Termos de Serviço',
    footerPrivacy: 'Política de Privacidade',
    footerSupport: 'Suporte'
  },
  fr: {
    badgeStatus: 'École non trouvée',
    titlePrefix: 'Cette école n’existe pas sur',
    titleSuffix: 'MontessoriNexus',
    descPrefix: 'L’adresse',
    descSuffix: 'n’est associée à aucune école enregistrée sur la plateforme. Si ce sous-domaine appartient à votre établissement d’enseignement, vous pouvez l’enregistrer dès aujourd’hui.',
    
    // Families Card
    familiesTitle: 'Vous cherchez le portail de votre école ?',
    familiesSubtitle: 'Pour les parents, familles et tuteurs',
    familiesDesc: 'L’école que vous essayez de consulter n’existe pas à cette adresse. Veuillez vérifier le lien ou contacter la direction de votre établissement.',
    familiesBtn: 'Aller sur la Plateforme Principale',

    // Founders Card
    foundersBadge: 'Essai Gratuit de 3 Mois',
    foundersTitle: 'Êtes-vous directeur ou fondateur de cette école ?',
    foundersSubtitle: 'Enregistrez votre école sur MontessoriNexus et réservez ce sous-domaine',
    foundersBenefit1: 'Site web institutionnel avec sous-domaine dédié et constructeur visuel',
    foundersBenefit2: 'Gestion pédagogique des ambiances (Nido, Maison des Enfants, Élémentaire)',
    foundersBenefit3: 'IA éthique pour l’observation qualitative et la protection du visage des enfants',
    foundersBtn: 'Enregistrer Cette École',

    // Feature Highlights
    feat1Title: 'Pédagogie & Observation AMI',
    feat1Desc: 'Suivi qualitatif du cycle de travail de 3 heures, périodes sensibles et présentations sans notes numériques.',
    feat2Title: 'Confidentialité & Sécurité Infantile',
    feat2Desc: 'Floutage automatique des visages sur photos, consentements parentaux numériques et haute sécurité.',
    feat3Title: 'Gestion Sereine et Complète',
    feat3Desc: 'Admissions, dossiers pédagogiques, lien bienveillant avec les familles et facturation sans friction.',

    // Nav & Footer
    navHome: 'Explorer la Plateforme',
    navBlog: 'Blog Pédagogique',
    navLogin: 'Connexion École',
    footerRights: 'Technologie sereine qui honore la Méthode Montessori.',
    footerTerms: 'Conditions de Service',
    footerPrivacy: 'Politique de Confidentialité',
    footerSupport: 'Support'
  }
};

export const SchoolNotFoundPage: React.FC<SchoolNotFoundPageProps> = ({
  attemptedHost = typeof window !== 'undefined' ? window.location.hostname : 'este-colegio.montessorinexus.com',
  onOpenCreateSchool
}) => {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('montessori_nexus_lang') as Language;
      if (saved && ['es', 'en', 'pt', 'fr'].includes(saved)) return saved;
      const browser = navigator.language.slice(0, 2).toLowerCase() as Language;
      if (['es', 'en', 'pt', 'fr'].includes(browser)) return browser;
    }
    return 'es';
  });

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('montessori_nexus_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('montessori_nexus_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('montessori_nexus_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('montessori_nexus_lang', lang);
  }, [lang]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const t = translations[lang] || translations.es;
  const platformHomeUrl = getPlatformHomeUrl();
  const blogUrl = getSaaSBlogUrl();

  const handleRegisterClick = () => {
    if (onOpenCreateSchool) {
      onOpenCreateSchool();
    } else {
      window.location.href = platformHomeUrl;
    }
  };

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <div
      className={`landing-page-root font-bricolage min-h-screen flex flex-col justify-between relative overflow-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-[#0e1710] text-[#f1f5f9] selection:bg-[#C4661F]/40 selection:text-white'
          : 'bg-[#FEFAE0] text-[#162218] selection:bg-[#C4661F]/20 selection:text-[#C4661F]'
      }`}
    >
      {/* Background Subtle Organic Lighting Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#C4661F]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#2D4A3E]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#DE7424]/10 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================================= */}
      {/* TOP HEADER */}
      {/* ========================================================================= */}
      <header
        className={`w-full py-3.5 sm:py-4 border-b transition-colors z-20 backdrop-blur-md ${
          isDark
            ? 'bg-[#0e1710]/90 border-stone-800/80'
            : 'bg-[#FEFAE0]/90 border-stone-200/70 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Name */}
          <a
            href={platformHomeUrl}
            className="flex items-center gap-3 shrink-0 group focus:outline-hidden"
          >
            <MontessoriNexusLogo size={42} className="group-hover:scale-105 transition-transform duration-200" />
            <div className="flex flex-col">
              <span
                className={`text-xl font-serif font-black tracking-tight flex items-center gap-1 leading-none ${
                  isDark ? 'text-white' : 'text-[#162218]'
                }`}
              >
                Montessori<span className="text-[#C4661F] font-sans font-bold">Nexus</span>
              </span>
              <span
                className={`text-[10px] font-sans font-bold tracking-widest uppercase mt-0.5 ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}
              >
                School OS
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-semibold">
            <a
              href={platformHomeUrl}
              className={`transition-colors ${
                isDark ? 'text-stone-300 hover:text-white' : 'text-stone-700 hover:text-[#162218]'
              }`}
            >
              {t.navHome}
            </a>
            <a
              href={blogUrl}
              className={`transition-colors ${
                isDark ? 'text-stone-300 hover:text-white' : 'text-stone-700 hover:text-[#162218]'
              }`}
            >
              {t.navBlog}
            </a>
          </nav>

          {/* Action & Toggle Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Custom Language Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                aria-label="Language selector"
                aria-expanded={langMenuOpen}
                className={`h-9 px-3 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-stone-900/80 hover:bg-stone-800 text-stone-200 border-stone-800'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
                }`}
              >
                <LanguageFlag code={lang} className="w-4 h-3 rounded-xs shrink-0 shadow-xs" />
                <span className="font-sans hidden sm:inline">{LANGUAGES.find(l => l.code === lang)?.codeShort}</span>
                <ChevronDown
                  className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${
                    langMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-2 w-44 rounded-2xl shadow-xl border p-1.5 z-50 ${
                      isDark
                        ? 'bg-[#162218] border-stone-700 text-white'
                        : 'bg-white border-stone-200 text-stone-900 shadow-stone-300/50'
                    }`}
                  >
                    {LANGUAGES.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setLang(item.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          lang === item.code
                            ? 'bg-[#C4661F]/15 text-[#C4661F]'
                            : isDark
                            ? 'hover:bg-stone-800 text-stone-200'
                            : 'hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <LanguageFlag code={item.code} className="w-4 h-3 rounded-xs shrink-0 shadow-xs" />
                          <span>{item.label}</span>
                        </div>
                        {lang === item.code && <Check className="w-3.5 h-3.5 text-[#C4661F]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`h-9 w-9 rounded-xl text-xs transition-all border flex items-center justify-center cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-stone-900/80 hover:bg-stone-800 text-amber-300 border-stone-800'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
              }`}
              title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Access CTA */}
            <a
              href={`${platformHomeUrl}/panel`}
              className={`hidden sm:inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs ${
                isDark
                  ? 'bg-stone-900/90 text-stone-200 hover:text-white hover:bg-stone-800 border-stone-800'
                  : 'bg-white text-stone-800 hover:bg-stone-50 border-stone-300'
              }`}
            >
              {t.navLogin}
            </a>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO MAIN BODY */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-14 flex flex-col items-center justify-center text-center z-10 space-y-8">
        
        {/* Subdomain Status Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border shadow-xs ${
            isDark
              ? 'bg-stone-900/80 border-stone-800 text-stone-300'
              : 'bg-white/90 border-stone-300/80 text-stone-700'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#C4661F] animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-tight">
            {attemptedHost}
          </span>
          <span className="text-stone-400 opacity-60">•</span>
          <span className="text-xs font-bold text-[#C4661F]">
            {t.badgeStatus}
          </span>
        </motion.div>

        {/* Main Headline & Context */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="space-y-3.5 max-w-2xl"
        >
          <h1
            className={`font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-[#162218]'
            }`}
          >
            {t.titlePrefix}{' '}
            <span className="text-[#C4661F] font-sans font-black italic">
              {t.titleSuffix}
            </span>
          </h1>
          <p
            className={`text-sm sm:text-base leading-relaxed max-w-xl mx-auto ${
              isDark ? 'text-stone-400' : 'text-stone-600'
            }`}
          >
            {t.descPrefix}{' '}
            <span
              className={`font-mono font-semibold px-2 py-0.5 rounded-md border ${
                isDark
                  ? 'bg-stone-900 text-[#DE7424] border-stone-800'
                  : 'bg-stone-100 text-[#9A3412] border-stone-300'
              }`}
            >
              {attemptedHost}
            </span>{' '}
            {t.descSuffix}
          </p>
        </motion.div>

        {/* ===================================================================== */}
        {/* TWO AUDIENCE PATH CARDS (Families vs School Founders) */}
        {/* ===================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl text-left pt-2"
        >
          
          {/* Card 1: Families & Parents */}
          <div
            className={`p-6 rounded-3xl border flex flex-col justify-between transition-all duration-200 ${
              isDark
                ? 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700'
                : 'bg-white/80 border-stone-200/90 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="space-y-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#2D4A3E]/10 border border-[#2D4A3E]/20 text-[#2D4A3E] dark:text-[#52a386] flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                  {t.familiesTitle}
                </h3>
                <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {t.familiesSubtitle}
                </p>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                {t.familiesDesc}
              </p>
            </div>

            <div className="pt-6">
              <a
                href={platformHomeUrl}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  isDark
                    ? 'bg-stone-800 hover:bg-stone-700 text-white border-stone-700'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                }`}
              >
                <span>{t.familiesBtn}</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </a>
            </div>
          </div>

          {/* Card 2: Founders / School Directors (Highlight Card) */}
          <div
            className={`p-6 rounded-3xl border-2 flex flex-col justify-between relative overflow-hidden transition-all duration-200 shadow-md ${
              isDark
                ? 'bg-gradient-to-b from-[#162218] to-stone-900 border-[#C4661F]/50 shadow-stone-950/60'
                : 'bg-gradient-to-b from-white to-[#FEFAE0] border-[#C4661F]/40 shadow-stone-200/80'
            }`}
          >
            {/* Top Badge */}
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C4661F]/15 text-[#C4661F] border border-[#C4661F]/30">
                <Sparkles className="w-3 h-3 text-[#C4661F]" />
                {t.foundersBadge}
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#C4661F]/15 border border-[#C4661F]/30 text-[#C4661F] flex items-center justify-center">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                  {t.foundersTitle}
                </h3>
                <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {t.foundersSubtitle}
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C4661F] shrink-0 mt-0.5" />
                  <span className={isDark ? 'text-stone-300' : 'text-stone-700'}>{t.foundersBenefit1}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C4661F] shrink-0 mt-0.5" />
                  <span className={isDark ? 'text-stone-300' : 'text-stone-700'}>{t.foundersBenefit2}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C4661F] shrink-0 mt-0.5" />
                  <span className={isDark ? 'text-stone-300' : 'text-stone-700'}>{t.foundersBenefit3}</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={handleRegisterClick}
                className="w-full py-3 px-4 bg-[#C4661F] hover:bg-[#783D19] text-white rounded-xl text-xs font-bold shadow-md shadow-[#C4661F]/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>{t.foundersBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </motion.div>

        {/* ===================================================================== */}
        {/* BRAND VALUES & PEDAGOGICAL HIGHLIGHTS */}
        {/* ===================================================================== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-4"
        >
          <div
            className={`p-4 rounded-2xl border text-left space-y-1.5 ${
              isDark
                ? 'bg-stone-900/40 border-stone-800/60'
                : 'bg-white/60 border-stone-200/70'
            }`}
          >
            <div className="flex items-center gap-2 text-[#C4661F]">
              <GraduationCap className="w-4 h-4" />
              <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                {t.feat1Title}
              </h4>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              {t.feat1Desc}
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border text-left space-y-1.5 ${
              isDark
                ? 'bg-stone-900/40 border-stone-800/60'
                : 'bg-white/60 border-stone-200/70'
            }`}
          >
            <div className="flex items-center gap-2 text-[#2D4A3E] dark:text-[#52a386]">
              <ShieldCheck className="w-4 h-4" />
              <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                {t.feat2Title}
              </h4>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              {t.feat2Desc}
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border text-left space-y-1.5 ${
              isDark
                ? 'bg-stone-900/40 border-stone-800/60'
                : 'bg-white/60 border-stone-200/70'
            }`}
          >
            <div className="flex items-center gap-2 text-[#DE7424]">
              <HeartHandshake className="w-4 h-4" />
              <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                {t.feat3Title}
              </h4>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              {t.feat3Desc}
            </p>
          </div>
        </motion.div>

      </main>

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <footer
        className={`w-full py-4 border-t transition-colors text-xs z-10 ${
          isDark
            ? 'bg-[#0e1710]/95 border-stone-800/80 text-stone-500'
            : 'bg-[#FEFAE0]/95 border-stone-200/80 text-stone-600'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold">© 2026 MontessoriNexus</span>
            <span className="opacity-40">•</span>
            <span className="text-[11px] opacity-80">{t.footerRights}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium">
            <a
              href={`${platformHomeUrl}/terminos`}
              className={`transition-colors ${
                isDark ? 'hover:text-stone-300' : 'hover:text-stone-900'
              }`}
            >
              {t.footerTerms}
            </a>
            <span className="opacity-30">•</span>
            <a
              href={`${platformHomeUrl}/privacidad`}
              className={`transition-colors ${
                isDark ? 'hover:text-stone-300' : 'hover:text-stone-900'
              }`}
            >
              {t.footerPrivacy}
            </a>
            <span className="opacity-30">•</span>
            <a
              href="mailto:contacto@montessorinexus.com"
              className={`transition-colors ${
                isDark ? 'hover:text-stone-300' : 'hover:text-stone-900'
              }`}
            >
              {t.footerSupport}
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default SchoolNotFoundPage;
