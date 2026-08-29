import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Lock,
  Building,
  CheckCircle2,
  ChevronDown,
  Sun,
  Moon,
  Scale,
  CreditCard,
  Zap,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { MontessoriNexusLogo } from '@/components/MontessoriNexusLogo';
import {
  LanguageFlag,
  LANGUAGES,
  type Language
} from './MontessoriNexusLanding';

export const TermsOfServicePage: React.FC = () => {
  const [lang, setLang] = useState<Language>('es');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mn_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('mn_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('mn_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const content = {
    es: {
      badge: 'Documento Legal Contractual',
      title: 'Términos y Condiciones de Servicio',
      effectiveDate: 'Última actualización: 29 de Agosto de 2026',
      intro: 'Los presentes Términos y Condiciones de Servicio (en adelante los "Términos") regulan el acceso, suscripción y uso de la plataforma MontessoriNexus OS (en adelante la "Plataforma"), operada y administrada legalmente por CHAMBAPRO S.A.P.I. DE C.V. (en adelante "CHAMBAPRO", "nosotros" o "MontessoriNexus"), con sede en Cancún, Quintana Roo, México.',
      tocTitle: 'Índice de Cláusulas',
      sections: [
        { id: 'objeto', title: '1. Objeto y Partes Contratantes' },
        { id: 'prueba-gratuita', title: '2. Periodo de Prueba Gratuito de 3 Meses' },
        { id: 'suscripcion-pagos', title: '3. Suscripción, Pagos y Facturación (Stripe)' },
        { id: 'cancelacion-reembolsos', title: '4. Cancelación, Rescisión y Reembolsos' },
        { id: 'propiedad-datos', title: '5. Propiedad de Datos y Derechos Intelectuales' },
        { id: 'uso-aceptable', title: '6. Uso Aceptable y Seguridad de Cuentas' },
        { id: 'disponibilidad-sla', title: '7. Disponibilidad de Servicio (SLA) y Soporte' },
        { id: 'responsabilidad', title: '8. Limitación de Responsabilidad' },
        { id: 'jurisdiccion', title: '9. Ley Aplicable y Jurisdicción' },
      ],
      s1_title: '1. Objeto y Partes Contratantes',
      s1_body: 'Al registrar un colegio, crear una cuenta o utilizar los servicios de MontessoriNexus, la persona física o moral que acepta estos Términos manifiesta contar con la representación legal y capacidad jurídica suficiente para vincular a la institución educativa correspondiente. CHAMBAPRO S.A.P.I. DE C.V. es una sociedad mercantil legalmente constituida en los Estados Unidos Mexicanos, con domicilio fiscal en Cancún, Quintana Roo, México (Sitio web: https://chamba.pro).',

      s2_title: '2. Periodo de Prueba Gratuito de 3 Meses',
      s2_p1: 'MontessoriNexus ofrece a las escuelas un periodo de prueba completo bajo las siguientes condiciones:',
      s2_list: [
        'Acceso Total Sin Costo: Durante 90 días naturales (3 meses), el colegio tiene acceso sin restricciones a los módulos contratados.',
        'Sin Tarjeta de Crédito Requerida: El registro inicial no solicita tarjeta de crédito, cuenta bancaria ni compromiso financiero.',
        'Sin Cargos Automáticos Sorpresa: Al concluir los 3 meses, el servicio no se cobra automáticamente. El colegio decide voluntariamente si desea continuar activando un plan de pago.',
      ],

      s3_title: '3. Suscripción, Pagos y Facturación (Stripe)',
      s3_p1: 'Las tarifas y modelos de licenciamiento modular se rigen por:',
      s3_list: [
        'Licenciamiento por Ambiente Preparado: El plan base cubre los ambientes contratados, con tarifas escalonadas para ambientes adicionales según lo publicado en nuestro tarifario.',
        'Pasarelas de Pago Seguras: Todos los pagos recurrentes se gestionan mediante Stripe Payments bajo rigurosos protocolos PCI-DSS Nivel 1.',
        'Monedas y Facturación Fiscal: Aceptamos USD, MXN, EUR, COP, BRL y monedas locales con emisión de comprobantes fiscales digitales conforme a la legislación aplicable.',
        'Modificaciones de Precio: Cualquier cambio en tarifas será notificado con al menos 30 días naturales de anticipación vía correo electrónico al administrador titular.',
      ],

      s4_title: '4. Cancelación, Rescisión y Política de Reembolsos',
      s4_p1: 'Transparencia y libertad contractual para las instituciones:',
      s4_list: [
        'Cancelación en Cualquier Momento: El colegio puede cancelar su suscripción en cualquier momento desde el panel de administración sin penalizaciones.',
        'Exportación de Datos (60 Días): Tras la cancelación, la escuela tiene 60 días naturales para descargar expedientes, bitácoras y registros en formatos universales (CSV, JSON, PDF).',
        'Reembolsos Proporcionales: En suscripciones anuales, si se solicita la baja anticipada justificada dentro de los primeros 30 días, se reembolsará el proporcional de los meses no devengados.',
      ],

      s5_title: '5. Propiedad de Datos y Derechos Intelectuales',
      s5_p1: 'La soberanía de los datos pertenece enteramente a la comunidad educativa:',
      s5_list: [
        'Propiedad del Colegio: Los expedientes de alumnos, observaciones pedagógicas, notas de tres tiempos, fotografías y listas de asistencia son propiedad exclusiva del colegio y las familias.',
        'Propiedad Intelectual de la Plataforma: El software, código fuente, algoritmos, diseño visual, logotipos y arquitectura de MontessoriNexus son propiedad exclusiva de CHAMBAPRO S.A.P.I. DE C.V.',
        'Cero Apropiación de Contenido: MontessoriNexus no adquiere ningún derecho de autor sobre el material educativo o archivos subidos por la institución.',
      ],

      s6_title: '6. Uso Aceptable y Seguridad de Cuentas',
      s6_p1: 'El usuario se compromete a no utilizar la Plataforma para fines ilícitos, suplantación de identidad, ataques cibernéticos, ni carga de contenido que vulnere los derechos de menores o terceros.',

      s7_title: '7. Disponibilidad de Servicio (SLA) y Soporte Técnico',
      s7_p1: 'Compromiso de alta disponibilidad:',
      s7_list: [
        'SLA 99.9% Uptime: Mantenemos una meta de disponibilidad mensual del 99.9% en nuestra infraestructura en la nube.',
        'Soporte Humano: Asistencia técnica multicanal vía correo (soporte@montessorinexus.com), chat y WhatsApp oficial en horario hábil.',
      ],

      s8_title: '8. Limitación de Responsabilidad',
      s8_p1: 'En la máxima medida permitida por la ley aplicable, CHAMBAPRO S.A.P.I. DE C.V. no será responsable por daños indirectos, pérdida de beneficios o interrupciones de negocio derivadas de causas de fuerza mayor o fallos externos en proveedores de internet del usuario.',

      s9_title: '9. Ley Aplicable y Jurisdicción',
      s9_p1: 'Los presentes Términos se rigen e interpretan de conformidad con las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a los tribunales competentes de Cancún, Quintana Roo, renunciando a cualquier otro fuero.',
      s9_contact: 'Contacto Legal: CHAMBAPRO S.A.P.I. DE C.V. • Cancún, Quintana Roo, México • Email: legal@montessorinexus.com • Sitio: https://chamba.pro'
    },
    en: {
      badge: 'Official Legal Agreement',
      title: 'Terms of Service',
      effectiveDate: 'Last Updated: August 29, 2026',
      intro: 'These Terms of Service (the "Terms") govern the access, subscription, and use of the MontessoriNexus OS platform (the "Platform"), legally operated and maintained by CHAMBAPRO S.A.P.I. DE C.V. ("CHAMBAPRO", "we", or "MontessoriNexus"), located in Cancun, Quintana Roo, Mexico.',
      tocTitle: 'Table of Contents',
      sections: [
        { id: 'objeto', title: '1. Parties and Purpose' },
        { id: 'prueba-gratuita', title: '2. 3-Month Free Trial' },
        { id: 'suscripcion-pagos', title: '3. Subscription, Payments & Billing (Stripe)' },
        { id: 'cancelacion-reembolsos', title: '4. Cancellation & Refund Policy' },
        { id: 'propiedad-datos', title: '5. Data Ownership & Intellectual Property' },
        { id: 'uso-aceptable', title: '6. Acceptable Use Policy' },
        { id: 'disponibilidad-sla', title: '7. Service Level Agreement (SLA) & Support' },
        { id: 'responsabilidad', title: '8. Limitation of Liability' },
        { id: 'jurisdiccion', title: '9. Governing Law & Jurisdiction' },
      ],
      s1_title: '1. Parties and Purpose',
      s1_body: 'By registering a school, creating an account, or using MontessoriNexus, the individual representing the school certifies that they possess full legal authority to bind the educational institution. CHAMBAPRO S.A.P.I. DE C.V. is a corporation legally established under Mexican law, based in Cancun, Quintana Roo, Mexico (Website: https://chamba.pro).',

      s2_title: '2. 3-Month Free Trial',
      s2_p1: 'MontessoriNexus provides a transparent trial policy for schools:',
      s2_list: [
        'Full Access at No Cost: For 90 calendar days (3 months), the school enjoys unrestricted access to subscribed modules.',
        'No Credit Card Required: Sign-up does not require payment credentials or financial commitment.',
        'No Surprise Automatic Charges: When the 3 months end, the account does not auto-charge. The school voluntarily selects whether to activate a paid tier.',
      ],

      s3_title: '3. Subscription, Payments & Billing (Stripe)',
      s3_p1: 'Modular pricing and payments follow industry best practices:',
      s3_list: [
        'Per-Environment Licensing: Base pricing scales transparently with classroom environments.',
        'PCI-DSS Certified Gateways: Recurring subscriptions are securely processed via Stripe Payments.',
        'Multi-Currency Support: We bill in USD, MXN, EUR, CAD, BRL, COP and major currencies with official tax invoicing.',
        '30-Day Notice for Price Changes: Any subscription price adjustments will be notified at least 30 days in advance.',
      ],

      s4_title: '4. Cancellation & Refund Policy',
      s4_p1: 'Clear terms for account modifications:',
      s4_list: [
        'Cancel Anytime: Schools can cancel their subscription at any time without exit fees.',
        '60-Day Data Export Grace Period: Following cancellation, schools have 60 days to export all academic records (CSV, PDF, JSON).',
        'Pro-Rata Refunds: Annual subscriptions canceled within 30 days of renewal qualify for a pro-rated refund of unused months.',
      ],

      s5_title: '5. Data Ownership & Intellectual Property',
      s5_p1: 'Educational data ownership belongs exclusively to the school and families:',
      s5_list: [
        'School Data Ownership: Student files, observations, three-period records, photos, and attendance logs remain 100% owned by the school.',
        'Platform Intellectual Property: All software, source code, UI designs, and algorithms remain the exclusive property of CHAMBAPRO S.A.P.I. DE C.V.',
      ],

      s6_title: '6. Acceptable Use Policy',
      s6_p1: 'Users agree not to misuse the Platform, engage in unauthorized vulnerability scanning, or upload harmful code.',

      s7_title: '7. Service Level Agreement (SLA) & Technical Support',
      s7_p1: '99.9% monthly uptime target with dedicated support via email (soporte@montessorinexus.com) and official messaging channels.',

      s8_title: '8. Limitation of Liability',
      s8_p1: 'To the maximum extent permitted by applicable law, CHAMBAPRO is not liable for indirect, punitive, or consequential damages.',

      s9_title: '9. Governing Law & Jurisdiction',
      s9_p1: 'These Terms are governed by the laws of Mexico, with jurisdiction in Cancun, Quintana Roo.',
      s9_contact: 'Legal Contact: CHAMBAPRO S.A.P.I. DE C.V. • Cancun, Quintana Roo, Mexico • Email: legal@montessorinexus.com • Website: https://chamba.pro'
    },
    pt: {
      badge: 'Acordo Legal Contratual',
      title: 'Termos de Serviço',
      effectiveDate: 'Última atualização: 29 de Agosto de 2026',
      intro: 'Estes Termos de Serviço regulam o acesso e uso da plataforma MontessoriNexus OS, operada por CHAMBAPRO S.A.P.I. DE C.V., com sede em Cancún, Quintana Roo, México (https://chamba.pro).',
      tocTitle: 'Índice de Cláusulas',
      sections: [
        { id: 'objeto', title: '1. Objeto e Partes' },
        { id: 'prueba-gratuita', title: '2. Período de Teste de 3 Meses' },
        { id: 'suscripcion-pagos', title: '3. Assinatura e Pagamentos (Stripe)' },
        { id: 'cancelacion-reembolsos', title: '4. Cancelamento e Reembolsos' },
        { id: 'propiedad-datos', title: '5. Propriedade dos Dados' },
        { id: 'uso-aceptable', title: '6. Uso Aceitável' },
        { id: 'disponibilidad-sla', title: '7. SLA e Suporte' },
        { id: 'responsabilidad', title: '8. Limitação de Responsabilidade' },
        { id: 'jurisdiccion', title: '9. Legislação e Foro' },
      ],
      s1_title: '1. Objeto e Partes',
      s1_body: 'Contrato de prestação de serviços de software entre a instituição escolar e CHAMBAPRO S.A.P.I. DE C.V. (Cancún, México).',
      s2_title: '2. Período de Teste de 3 Meses',
      s2_p1: 'Teste gratuito de 90 dias com acesso total, sem necessidade de cartão de crédito e sem cobranças automáticas.',
      s3_title: '3. Assinatura e Pagamentos (Stripe)',
      s3_p1: 'Cobrança modular por sala preparada, processada com segurança PCI-DSS via Stripe.',
      s4_title: '4. Cancelamento e Reembolsos',
      s4_p1: 'Cancelamento a qualquer momento com prazo de 60 dias para exportação de todos os dados escolares.',
      s5_title: '5. Propriedade dos Dados',
      s5_p1: 'Todos os dados dos alunos e observações pedagógicas pertencem integralmente à escola e às famílias.',
      s6_title: '6. Uso Aceitável',
      s6_p1: 'Uso estritamente educativo conforme as leis vigentes de proteção da infância.',
      s7_title: '7. SLA e Suporte Técnico',
      s7_p1: 'Meta de 99,9% de disponibilidade com suporte especializado.',
      s8_title: '8. Limitação de Responsabilidade',
      s8_p1: 'Conforme as disposições legais aplicáveis.',
      s9_title: '9. Legislação e Foro',
      s9_p1: 'Regido pelas leis do México, Foro de Cancún, Quintana Roo.',
      s9_contact: 'CHAMBAPRO S.A.P.I. DE C.V. • Cancún, México • Email: legal@montessorinexus.com • Site: https://chamba.pro'
    },
    fr: {
      badge: 'Contrat Juridique Officiel',
      title: 'Conditions Générales de Service',
      effectiveDate: 'Dernière mise à jour : 29 Août 2026',
      intro: 'Les présentes Conditions Générales de Service régissent l’utilisation de la plateforme MontessoriNexus OS, exploitée par CHAMBAPRO S.A.P.I. DE C.V., sise à Cancún, Quintana Roo, Mexique (https://chamba.pro).',
      tocTitle: 'Sommaire',
      sections: [
        { id: 'objeto', title: '1. Objet et Parties' },
        { id: 'prueba-gratuita', title: '2. Essai Gratuit de 3 Mois' },
        { id: 'suscripcion-pagos', title: '3. Abonnement et Paiements (Stripe)' },
        { id: 'cancelacion-reembolsos', title: '4. Résiliation et Remboursements' },
        { id: 'propiedad-datos', title: '5. Propriété des Données' },
        { id: 'uso-aceptable', title: '6. Utilisation Conforme' },
        { id: 'disponibilidad-sla', title: '7. SLA et Support' },
        { id: 'responsabilidad', title: '8. Limitation de Responsabilité' },
        { id: 'jurisdiccion', title: '9. Droit Applicable' },
      ],
      s1_title: '1. Objet et Parties',
      s1_body: 'Contrat SaaS entre l’école et CHAMBAPRO S.A.P.I. DE C.V., Cancún, Mexique.',
      s2_title: '2. Essai Gratuit de 3 Mois',
      s2_p1: 'Période d’essai de 90 jours sans carte bancaire et sans reconduction automatique forcée.',
      s3_title: '3. Abonnement et Paiements (Stripe)',
      s3_p1: 'Tarification modulaire sécurisée par Stripe certifié PCI-DSS Niveau 1.',
      s4_title: '4. Résiliation et Remboursements',
      s4_p1: 'Résiliation libre à tout moment avec 60 jours pour exporter l’intégralité des données scolaires.',
      s5_title: '5. Propriété des Données',
      s5_p1: 'L’école et les familles demeurent les uniques propriétaires de tous les dossiers et photos pédagogiques.',
      s6_title: '6. Utilisation Conforme',
      s6_p1: 'Usage conforme à la protection des mineurs et à la sécurité informatique.',
      s7_title: '7. SLA et Support',
      s7_p1: 'Objectif de disponibilité de 99,9 % avec support dédié.',
      s8_title: '8. Limitation de Responsabilité',
      s8_p1: 'Selon les règles légales en vigueur.',
      s9_title: '9. Droit Applicable',
      s9_p1: 'Droit mexicain, compétence juridictionnelle de Cancún, Quintana Roo.',
      s9_contact: 'CHAMBAPRO S.A.P.I. DE C.V. • Cancún, Mexique • Email: legal@montessorinexus.com • Site: https://chamba.pro'
    }
  };

  const t = content[lang] || content.es;

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
      isDark ? 'bg-[#0f1710] text-slate-100' : 'bg-[#FAF8F5] text-stone-900'
    }`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
        isDark ? 'bg-[#0f1710]/90 border-slate-800' : 'bg-[#FAF8F5]/90 border-stone-200 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <MontessoriNexusLogo size={32} />
            <div className="flex flex-col text-left">
              <span className={`text-base font-serif font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                MontessoriNexus
              </span>
              <span className="text-[10px] text-[#C4661F] font-semibold -mt-1">
                Términos de Servicio
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-800 shadow-3xs'
                }`}
              >
                <LanguageFlag code={lang} className="w-4 h-3 rounded-[2px]" />
                <span>{LANGUAGES.find(l => l.code === lang)?.codeShort}</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {langMenuOpen && (
                <div className={`absolute right-0 mt-2 w-36 rounded-xl shadow-xl border p-1 z-50 ${
                  isDark ? 'bg-[#162218] border-slate-700 text-white' : 'bg-white border-stone-200 text-stone-900'
                }`}>
                  {LANGUAGES.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLang(item.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        lang === item.code
                          ? 'bg-[#C4661F]/15 text-[#C4661F]'
                          : isDark ? 'hover:bg-slate-800' : 'hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <LanguageFlag code={item.code} className="w-4 h-3 rounded-[2px]" />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-xl border transition-colors ${
                isDark ? 'bg-slate-800 border-slate-700 text-amber-300' : 'bg-white border-stone-300 text-stone-700 shadow-3xs'
              }`}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Back to Home Button */}
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#C4661F] hover:bg-[#783D19] text-white transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la web</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Header */}
        <div className="mb-10 text-left space-y-3 pb-8 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full border border-[#C4661F]/20 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              {t.badge}
            </span>
            <span className="text-xs font-mono text-stone-500 dark:text-slate-400">
              {t.effectiveDate}
            </span>
          </div>
          <h1 className={`text-3xl sm:text-5xl font-serif font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#162218]'}`}>
            {t.title}
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed max-w-4xl ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
            {t.intro}
          </p>
        </div>

        {/* 2-Column Layout (TOC + Sections) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar TOC */}
          <aside className="lg:col-span-4 text-left">
            <div className={`sticky top-24 p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#162218] border-slate-800' : 'bg-white border-stone-200 shadow-sm'
            }`}>
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C4661F]" />
                {t.tocTitle}
              </h4>
              <nav className="space-y-1.5 text-xs">
                {t.sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className={`block py-1.5 px-2.5 rounded-lg transition-colors text-stone-600 dark:text-slate-300 hover:text-[#C4661F] dark:hover:text-[#FFA05C] hover:bg-[#C4661F]/10`}
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Detailed Legal Sections */}
          <div className="lg:col-span-8 text-left space-y-10">
            {/* S1 */}
            <section id="objeto" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-[#C4661F]" />
                {t.s1_title}
              </h2>
              <p className="text-sm leading-relaxed text-stone-600 dark:text-slate-300">
                {t.s1_body}
              </p>
            </section>

            {/* S2: Free Trial */}
            <section id="prueba-gratuita" className={`p-6 rounded-2xl border space-y-4 ${
              isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {t.s2_title}
              </h2>
              <p className="text-sm text-stone-700 dark:text-slate-300">{t.s2_p1}</p>
              {t.s2_list && (
                <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-slate-300">
                  {t.s2_list.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* S3: Payments Stripe */}
            <section id="suscripcion-pagos" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#C4661F]" />
                {t.s3_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s3_p1}</p>
              {t.s3_list && (
                <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-slate-300">
                  {t.s3_list.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* S4: Cancellations */}
            <section id="cancelacion-reembolsos" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#C4661F]" />
                {t.s4_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s4_p1}</p>
              {t.s4_list && (
                <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-slate-300">
                  {t.s4_list.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* S5: Data Ownership */}
            <section id="propiedad-datos" className="space-y-3 p-6 rounded-2xl border bg-white dark:bg-[#162218] border-stone-200 dark:border-slate-800 shadow-3xs">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-500" />
                {t.s5_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s5_p1}</p>
              {t.s5_list && (
                <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-slate-300">
                  {t.s5_list.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* S6: Acceptable Use */}
            <section id="uso-aceptable" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#C4661F]" />
                {t.s6_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s6_p1}</p>
            </section>

            {/* S7: SLA */}
            <section id="disponibilidad-sla" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                {t.s7_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s7_p1}</p>
              {t.s7_list && (
                <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-slate-300">
                  {t.s7_list.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* S8: Liability */}
            <section id="responsabilidad" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#C4661F]" />
                {t.s8_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s8_p1}</p>
            </section>

            {/* S9: Jurisdiction */}
            <section id="jurisdiccion" className="space-y-3 p-6 rounded-2xl border bg-stone-100 dark:bg-slate-900/60 border-stone-300 dark:border-slate-800">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#C4661F]" />
                {t.s9_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s9_p1}</p>
              <p className="text-xs text-stone-500 dark:text-slate-400 pt-2 border-t border-stone-200 dark:border-slate-800">
                {t.s9_contact}
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-stone-200 dark:border-slate-800 text-xs text-stone-500 dark:text-slate-400 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} MontessoriNexus OS • CHAMBAPRO SAPI DE CV</p>
          <div className="flex gap-4">
            <Link to="/privacidad" className="hover:text-[#C4661F]">Política de Privacidad</Link>
            <Link to="/" className="hover:text-[#C4661F]">Inicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
