import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  Globe,
  Lock,
  FileText,
  UserCheck,
  Database,
  Building,
  CheckCircle2,
  ChevronDown,
  Sun,
  Moon,
  Camera,
  Layers,
  Sparkles
} from 'lucide-react';
import { MontessoriNexusLogo } from '@/components/MontessoriNexusLogo';
import {
  LanguageFlag,
  LANGUAGES,
  type Language
} from './MontessoriNexusLanding';

export const PrivacyPolicyPage: React.FC = () => {
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
      badge: 'Documento Legal Oficial',
      title: 'Política de Privacidad y Protección de Datos',
      effectiveDate: 'Última actualización: 29 de Agosto de 2026',
      intro: 'En MontessoriNexus (operado por CHAMBAPRO S.A.P.I. DE C.V., en adelante "MontessoriNexus", "nosotros" o "la Plataforma"), la privacidad, confidencialidad y seguridad de las comunidades educativas, colegios, guías, tutores y menores de edad es nuestra máxima prioridad y principio rector.',
      tocTitle: 'Contenido del Documento',
      sections: [
        { id: 'responsable', title: '1. Responsable del Tratamiento de Datos' },
        { id: 'datos-recolectados', title: '2. Información y Datos que Recolectamos' },
        { id: 'menores', title: '3. Protección Estricta de Datos de Menores de Edad' },
        { id: 'finalidades', title: '4. Finalidades del Tratamiento de Información' },
        { id: 'google-oauth', title: '5. Divulgación de Uso de Datos de Google (OAuth API)' },
        { id: 'pagos', title: '6. Pagos, Pasarelas y Cumplimiento PCI-DSS (Stripe)' },
        { id: 'ia-etica', title: '7. Tratamiento de Datos en Funciones de Inteligencia Artificial' },
        { id: 'seguridad', title: '8. Almacenamiento, Encriptación y Retención' },
        { id: 'derechos', title: '9. Derechos ARCO, GDPR, LGPD y Contacto Legal' },
      ],
      s1_title: '1. Responsable del Tratamiento de Datos',
      s1_body: 'El responsable del tratamiento y resguardo de sus datos personales es CHAMBAPRO S.A.P.I. DE C.V., sociedad mercantil legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos, con domicilio fiscal y sede operativa en Cancún, Quintana Roo, México. Sitio web corporativo: https://chamba.pro.',
      s1_contact: 'Para cualquier solicitud relacionada con la protección de datos personales o el ejercicio de derechos legales, puede contactar a nuestro Oficial de Privacidad en legal@montessorinexus.com o soporte@montessorinexus.com.',

      s2_title: '2. Información y Datos que Recolectamos',
      s2_p1: 'MontessoriNexus recolecta únicamente los datos estrictamente necesarios para prestar los servicios contratados por las instituciones educativas:',
      s2_list: [
        'Datos del Colegio y Administradores: Nombre de la institución, clave de centro de trabajo (CCT), razón social, domicilio fiscal, nombres, correos electrónicos y teléfonos de directores y administradores.',
        'Datos de Guías y Docentes: Nombre completo, correo institucional, credenciales pedagógicas (certificación AMI/AMS) y asignación de ambientes preparados.',
        'Datos de Familias y Tutores: Nombre completo, identificación oficial (CURP / DNI / Pasaporte), teléfono móvil, dirección y correo para la formalización de matrículas y comunicaciones.',
        'Datos de Alumnos y Expedientes Escolares: Nombre completo, fecha de nacimiento, sexo, grupo sanguíneo, alergias/requerimientos médicos, registros de observación pedagógica (lecciones de tres tiempos, áreas curriculares Montessori) y fotografías de ambiente escolar sujetas a consentimiento expreso.',
      ],

      s3_title: '3. Protección Estricta de Datos de Menores de Edad (COPPA / FERPA / GDPR-K / LFPDPPP)',
      s3_p1: 'Reconocemos la sensibilidad máxima que implican los datos de niños, niñas y adolescentes en entornos escolares:',
      s3_list: [
        'Consentimiento Parental Verificable: Ningún dato ni imagen de un alumno es registrado sin la autorización previa y por escrito de sus padres o tutores legales a través del colegio.',
        'Galería Inteligente y Difuminación Facial: La plataforma incluye salvaguardas tecnológicas activas. Si los tutores no otorgan consentimiento de exposición visual, el sistema aplica un filtro de difuminación facial automático para proteger la identidad visual del menor.',
        'Prohibición de Comercialización y Perfilamiento: Los datos de los menores NUNCA son comercializados, cedidos a terceros, transferidos con fines publicitarios ni utilizados para elaborar perfiles comerciales o conductuales.',
      ],

      s4_title: '4. Finalidades del Tratamiento de Información',
      s4_p1: 'La información recolectada se utiliza exclusivamente para:',
      s4_list: [
        'Gestionar la operación académica y pedagógica del colegio Montessori (seguimiento de materiales, bitácoras de observación y reportes cualitativos a padres).',
        'Facilitar el proceso de admisiones, registro de aspirantes y generación de contratos y fichas de inscripción.',
        'Permitir la cobranza y facturación electrónica de colegiaturas a través de pasarelas de pago seguras.',
        'Enviar notificaciones oficiales, circulares escolares y confirmaciones de citas entre el colegio y las familias.',
      ],

      s5_title: '5. Divulgación de Uso de Datos de Google (Google API Services User Data Policy)',
      s5_p1: 'MontessoriNexus ofrece integraciones opcionales con servicios de Google (Google Sign-In, Google Calendar Sync):',
      s5_list: [
        'Acceso Limitado: Solo accedemos a los alcances (scopes) autorizados explícitamente por el usuario para autenticar su cuenta o sincronizar visitas de observación al calendario institucional.',
        'Cumplimiento del Requisito de Uso Limitado (Limited Use): El uso y transferencia de información recibida de las API de Google a cualquier otra aplicación se adhiere estrictamente a la Política de Datos de Usuario de los Servicios de Google API, incluidos los requisitos de Uso Limitado.',
        'No Transferencia a Modelos de IA Públicos: Los datos obtenidos mediante APIs de Google nunca se transfieren ni utilizan para entrenar modelos de lenguaje grandes (LLM) generalizados de terceros.',
      ],

      s6_title: '6. Pagos, Pasarelas y Cumplimiento PCI-DSS (Stripe)',
      s6_p1: 'El procesamiento de pagos y suscripciones en MontessoriNexus se realiza con los más altos estándares bancarios internacionales:',
      s6_list: [
        'Pasarelas de Pago Certificadas: Todos los pagos con tarjeta de crédito, débito o domiciliación son procesados mediante Stripe Payments y pasarelas con certificación PCI-DSS Nivel 1.',
        'Cero Almacenamiento de Tarjetas: MontessoriNexus NO almacena números completos de tarjetas de crédito, códigos CVV ni fechas de vencimiento en sus servidores. Toda la información bancaria es tokenizada directamente por la pasarela de pago.',
        'Periodo de Prueba de 3 Meses: El periodo de prueba gratuito de 3 meses se otorga sin requerir tarjeta de crédito. Al finalizar el periodo de prueba, el colegio decide voluntariamente si ingresa un método de pago.',
      ],

      s7_title: '7. Tratamiento de Datos en Funciones de Inteligencia Artificial',
      s7_p1: 'Nuestra suite de IA Asistencial (redacción de narrativas pedagógicas, asistencia a guías) opera bajo un modelo de privacidad por diseño:',
      s7_list: [
        'Sesiones Efímeras: El procesamiento de texto u observaciones se ejecuta en entornos de cómputo aislados y temporales.',
        'Cero Entrenamiento con Datos del Cliente: Ni MontessoriNexus ni nuestros proveedores de infraestructura utilizan las descripciones pedagógicas, notas de alumnos o fotografías de las escuelas para re-entrenar modelos de IA públicos.',
      ],

      s8_title: '8. Almacenamiento, Encriptación y Retención',
      s8_p1: 'Implementamos medidas de seguridad técnicas, físicas y administrativas de nivel empresarial:',
      s8_list: [
        'Encriptación en Tránsito y Reposo: Todas las transferencias de datos viajan sobre HTTPS/TLS 1.3 con certificados SSL de 256 bits. Las bases de datos y respaldos se encriptan con AES-256.',
        'Aislamiento Multi-Inquilino (Multi-Tenant): Los datos de cada colegio se encuentran estrictamente aislados lógicamente de otras instituciones.',
        'Retención y Eliminación: Si un colegio decide cancelar su suscripción, sus datos permanecen disponibles para exportación durante 60 días naturales, tras lo cual se eliminan de forma segura e irreversible conforme a nuestros protocolos de borrado seguro.',
      ],

      s9_title: '9. Derechos ARCO, GDPR, LGPD y Contacto Legal',
      s9_p1: 'Usted tiene el derecho inalienable de Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales (Derechos ARCO en México, GDPR en Europa, LGPD en Brasil):',
      s9_list: [
        'Cómo ejercer sus derechos: Envíe un correo electrónico a legal@montessorinexus.com indicando: (a) Nombre completo y colegio de adscripción, (b) Descripción clara del derecho que desea ejercer, y (c) Documento que acredite su identidad o representación legal.',
        'Plazo de Respuesta: Daremos respuesta formal a su solicitud en un plazo máximo de 15 días hábiles a partir de la recepción de su requerimiento completo.',
      ],
      s9_address: 'Domicilio Legal: CHAMBAPRO S.A.P.I. DE C.V., Cancún, Quintana Roo, México. Sitio oficial: https://chamba.pro'
    },
    en: {
      badge: 'Official Legal Document',
      title: 'Privacy Policy & Data Protection',
      effectiveDate: 'Last Updated: August 29, 2026',
      intro: 'At MontessoriNexus (operated by CHAMBAPRO S.A.P.I. DE C.V., hereinafter "MontessoriNexus", "we" or "the Platform"), the privacy, confidentiality, and security of educational communities, schools, guides, parents, and minors is our highest priority and guiding principle.',
      tocTitle: 'Table of Contents',
      sections: [
        { id: 'responsable', title: '1. Data Controller' },
        { id: 'datos-recolectados', title: '2. Information We Collect' },
        { id: 'menores', title: '3. Strict Protection of Minors’ Data' },
        { id: 'finalidades', title: '4. Purposes of Data Processing' },
        { id: 'google-oauth', title: '5. Google API Services User Data Policy' },
        { id: 'pagos', title: '6. Payment Processing & PCI-DSS (Stripe)' },
        { id: 'ia-etica', title: '7. AI Features & Data Ethics' },
        { id: 'seguridad', title: '8. Storage, Encryption & Data Retention' },
        { id: 'derechos', title: '9. User Rights (GDPR, CCPA, ARCO) & Contact' },
      ],
      s1_title: '1. Data Controller',
      s1_body: 'The data controller responsible for the processing and protection of personal data is CHAMBAPRO S.A.P.I. DE C.V., a corporation legally incorporated under Mexican law, headquartered in Cancun, Quintana Roo, Mexico. Corporate website: https://chamba.pro.',
      s1_contact: 'For any inquiry regarding personal data protection or the exercise of your statutory rights, please contact our Data Protection Officer at legal@montessorinexus.com or soporte@montessorinexus.com.',

      s2_title: '2. Information We Collect',
      s2_p1: 'MontessoriNexus only collects data strictly necessary to provide the educational software services contracted by schools:',
      s2_list: [
        'School & Administrator Data: School name, official identifier/accreditation, business entity name, billing address, names, emails, and phone numbers of school leaders.',
        'Guides & Teachers: Full name, institutional email, pedagogical credentials (AMI/AMS certifications), and classroom assignments.',
        'Parents & Guardians: Full name, national identification, mobile phone number, address, and email for enrollment and official communication.',
        'Students & School Records: Full name, date of birth, gender, blood type, allergies/medical dietary notes, qualitative Montessori pedagogical observations (three-period lessons, curriculum areas), and classroom environment photos subject to parental consent.',
      ],

      s3_title: '3. Strict Protection of Minors’ Data (COPPA / FERPA / GDPR-K)',
      s3_p1: 'We recognize the utmost sensitivity of children and adolescent data in educational environments:',
      s3_list: [
        'Verifiable Parental Consent: No student data or imagery is captured without prior written authorization from parents or legal guardians via the school.',
        'Smart Gallery & Face Blurring: The platform incorporates real-time facial privacy guardrails. If a parent opts out of photographic exposure, the system automatically blurs the student’s face to safeguard their visual identity.',
        'Zero Commercialization or Profiling: Children’s data is NEVER sold, rented, transferred to third parties for marketing, or used for behavioral advertising.',
      ],

      s4_title: '4. Purposes of Data Processing',
      s4_p1: 'Collected data is exclusively processed to:',
      s4_list: [
        'Operate the academic and Montessori pedagogical workflows of the school (material tracking, qualitative logs, family portfolios).',
        'Facilitate the admissions pipeline, applicant registration, and digital enrollment contracts.',
        'Enable automated tuition billing and invoicing through secure payment processors.',
        'Transmit official school bulletins, permissions, and appointment scheduling between the school and families.',
      ],

      s5_title: '5. Google API Services User Data Policy Disclosure',
      s5_p1: 'MontessoriNexus provides optional integrations with Google services (Google Sign-In, Google Calendar Sync):',
      s5_list: [
        'Limited Scopes: We only access the minimal scopes explicitly authorized by the user to authenticate identity or synchronize classroom observation appointments.',
        'Limited Use Compliance: MontessoriNexus’ use and transfer to any other app of information received from Google APIs adheres strictly to the Google API Services User Data Policy, including Limited Use requirements.',
        'No AI Training on Google Data: Data received from Google APIs is never shared or used to train third-party generalized machine learning or Large Language Models (LLMs).',
      ],

      s6_title: '6. Payment Processing & PCI-DSS Compliance (Stripe)',
      s6_p1: 'All payment processing and recurring subscription management follows the highest banking security standards:',
      s6_list: [
        'PCI-DSS Certified Gateways: All credit card, debit, and direct bank transactions are processed via Stripe Payments and PCI-DSS Level 1 certified processors.',
        'Zero Card Storage: MontessoriNexus NEVER stores raw credit card numbers, CVVs, or expiration dates on its servers. Card information is tokenized directly by Stripe.',
        '3-Month Free Trial: The 3-month free trial requires no credit card. At the end of the trial, schools voluntarily choose whether to enter payment details.',
      ],

      s7_title: '7. AI Features & Data Ethics',
      s7_p1: 'Our assistive Montessori AI suite (pedagogical narrative generation, lesson assistance) operates under privacy-by-design standards:',
      s7_list: [
        'Ephemeral Processing: Text observations are processed in isolated, transient compute instances without long-term LLM persistence.',
        'Zero Training on Customer Data: Neither MontessoriNexus nor its cloud infrastructure partners utilize customer student records, photos, or school data to train public AI foundation models.',
      ],

      s8_title: '8. Storage, Encryption & Data Retention',
      s8_p1: 'We enforce enterprise-grade technical, administrative, and physical security measures:',
      s8_list: [
        'Encryption in Transit & at Rest: All data in transit uses HTTPS/TLS 1.3 with 256-bit SSL certificates. Databases and backups are encrypted at rest with AES-256.',
        'Logical Multi-Tenant Isolation: Each school’s database partition is strictly segregated from other institutions.',
        'Retention & Deletion: If a school cancels its account, data remains available for export for 60 calendar days, after which it is permanently and irreversibly destroyed.',
      ],

      s9_title: '9. User Rights (GDPR, CCPA, ARCO) & Legal Contact',
      s9_p1: 'You have the right to access, rectify, port, delete, or object to the processing of your personal data:',
      s9_list: [
        'How to Submit a Request: Send an email to legal@montessorinexus.com detailing your request and school affiliation.',
        'Response Time: We will respond to verified requests within 15 business days.',
      ],
      s9_address: 'Corporate Headquarters: CHAMBAPRO S.A.P.I. DE C.V., Cancun, Quintana Roo, Mexico. Website: https://chamba.pro'
    },
    pt: {
      badge: 'Documento Legal Oficial',
      title: 'Política de Privacidade e Proteção de Dados',
      effectiveDate: 'Última atualização: 29 de Agosto de 2026',
      intro: 'Na MontessoriNexus (operada por CHAMBAPRO S.A.P.I. DE C.V., adiante "MontessoriNexus", "nós" ou "a Plataforma"), a privacidade, confidencialidade e segurança das comunidades escolares, guias, pais e menores é nosso princípio inegociável.',
      tocTitle: 'Índice de Conteúdos',
      sections: [
        { id: 'responsable', title: '1. Controlador dos Dados' },
        { id: 'datos-recolectados', title: '2. Dados que Coletamos' },
        { id: 'menores', title: '3. Proteção Estrita de Menores (LGPD / GDPR)' },
        { id: 'finalidades', title: '4. Finalidades do Tratamento' },
        { id: 'google-oauth', title: '5. Políticas de Dados do Google API' },
        { id: 'pagos', title: '6. Pagamentos e Conformidade PCI-DSS (Stripe)' },
        { id: 'ia-etica', title: '7. Ética e IA Pedagógica' },
        { id: 'seguridad', title: '8. Armazenamento e Criptografia' },
        { id: 'derechos', title: '9. Direitos dos Titulares e Contato' },
      ],
      s1_title: '1. Controlador dos Dados',
      s1_body: 'O controlador responsável pelo tratamento e segurança dos dados pessoais é CHAMBAPRO S.A.P.I. DE C.V., sociedade legalmente constituída, sediada em Cancún, Quintana Roo, México. Site corporativo: https://chamba.pro.',
      s1_contact: 'Para solicitações relativas à privacidade ou exercício de direitos LGPD, contate legal@montessorinexus.com ou suporte@montessorinexus.com.',

      s2_title: '2. Dados que Coletamos',
      s2_p1: 'A MontessoriNexus coleta apenas as informações essenciais para a prestação dos serviços escolares contratados:',
      s2_list: [
        'Dados da Escola e Gestores: Nome da instituição, dados fiscais, nomes, emails e telefones dos diretores.',
        'Dados de Educadores e Guias: Nome completo, email institucional, certificações AMI/AMS e atribuições de salas preparadas.',
        'Dados dos Pais e Responsáveis: Nome completo, documento de identificação, telefone e email para contratos e avisos.',
        'Dados de Estudantes: Nome completo, data de nascimento, notas de saúde/alergias, registros de observação Montessori e fotos de ambiente com consentimento.',
      ],

      s3_title: '3. Proteção Estrita de Menores de Idade (LGPD / COPPA / GDPR)',
      s3_p1: 'Os dados de crianças recebem a mais rigorosa proteção técnica e legal:',
      s3_list: [
        'Consentimento dos Responsáveis: Nenhum dado de aluno é cadastrado sem consentimento expresso dos pais.',
        'Galeria com Desfocagem Facial: Caso os pais não autorizem a exposição visual, o sistema aplica desfoque facial automático em fotos.',
        'Proibição de Venda de Dados: Os dados de menores NUNCA são comercializados ou utilizados para publicidade.',
      ],

      s4_title: '4. Finalidades do Tratamento',
      s4_p1: 'Os dados são utilizados exclusivamente para o gerenciamento pedagógico, matrículas, faturamento de mensalidades e comunicação escolar.',

      s5_title: '5. Políticas de Dados do Google API (Limited Use)',
      s5_p1: 'Nossas integrações com Google seguem rigorosamente a Google API Services User Data Policy, sem compartilhamento com terceiros nem treinamento de modelos de IA.',

      s6_title: '6. Pagamentos e Conformidade PCI-DSS (Stripe)',
      s6_p1: 'Os pagamentos são processados via Stripe com certificação PCI-DSS Nível 1. A MontessoriNexus não armazena dados de cartões.',

      s7_title: '7. Ética e IA Pedagógica',
      s7_p1: 'As funcionalidades de IA operam de forma isolada e efêmera, sem retenção para treino de modelos públicos.',

      s8_title: '8. Armazenamento e Criptografia',
      s8_p1: 'Criptografia de ponta a ponta com TLS 1.3 e AES-256. Isolamento completo de dados entre diferentes colégios.',

      s9_title: '9. Direitos dos Titulares (LGPD) e Contato',
      s9_p1: 'Você pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento via legal@montessorinexus.com.',
      s9_address: 'CHAMBAPRO S.A.P.I. DE C.V., Cancún, Quintana Roo, México. Site: https://chamba.pro'
    },
    fr: {
      badge: 'Document Juridique Officiel',
      title: 'Politique de Confidentialité et Protection des Données',
      effectiveDate: 'Dernière mise à jour : 29 Août 2026',
      intro: 'Chez MontessoriNexus (exploité par CHAMBAPRO S.A.P.I. DE C.V., ci-après "MontessoriNexus", "nous" ou "la Plateforme"), la confidentialité et la sécurité des données des établissements, guides, familles et enfants constituent notre priorité absolue.',
      tocTitle: 'Table des Matières',
      sections: [
        { id: 'responsable', title: '1. Responsable du Traitement' },
        { id: 'datos-recolectados', title: '2. Données Collectées' },
        { id: 'menores', title: '3. Protection des Données des Mineurs (RGPD)' },
        { id: 'finalidades', title: '4. Finalités du Traitement' },
        { id: 'google-oauth', title: '5. Données des API Google (Limited Use)' },
        { id: 'pagos', title: '6. Paiements et Sécurité PCI-DSS (Stripe)' },
        { id: 'ia-etica', title: '7. IA et Éthique des Données' },
        { id: 'seguridad', title: '8. Chiffrement et Conservation' },
        { id: 'derechos', title: '9. Droits des Utilisateurs (RGPD) et Contact' },
      ],
      s1_title: '1. Responsable du Traitement',
      s1_body: 'Le responsable du traitement des données personnelles est CHAMBAPRO S.A.P.I. DE C.V., société enregistrée à Cancún, Quintana Roo, Mexique. Site web : https://chamba.pro.',
      s1_contact: 'Pour toute question relative à la protection des données ou pour exercer vos droits RGPD, contactez legal@montessorinexus.com ou soporte@montessorinexus.com.',

      s2_title: '2. Données Collectées',
      s2_p1: 'MontessoriNexus collecte uniquement les informations nécessaires au fonctionnement pédagogique et administratif de l’établissement scolaire.',

      s3_title: '3. Protection des Données des Mineurs (RGPD / COPPA)',
      s3_p1: 'Les données des enfants sont strictement protégées. Aucune photo n’est enregistrée sans accord parental préalable, avec un système de floutage facial automatique.',

      s4_title: '4. Finalités du Traitement',
      s4_p1: 'Gestion pédagogique Montessori, suivi des présentations en 3 temps, admissions, facturation des frais scolaires et communications officielles.',

      s5_title: '5. Données des API Google (Limited Use Policy)',
      s5_p1: 'L’utilisation des données Google respecte scrupuleusement les règles de Google API Services User Data Policy, sans transmission publicitaire ni réutilisation.',

      s6_title: '6. Paiements et Sécurité PCI-DSS (Stripe)',
      s6_p1: 'Paiements sécurisés via Stripe certifié PCI-DSS Niveau 1. Aucune coordonnée bancaire n’est stockée sur nos serveurs.',

      s7_title: '7. IA et Éthique des Données',
      s7_p1: 'Les traitements d’intelligence artificielle pédagogique sont éphémères et ne servent jamais à entraîner des modèles publics.',

      s8_title: '8. Chiffrement et Conservation',
      s8_p1: 'Chiffrement TLS 1.3 et AES-256 avec isolation multi-locataire complète pour chaque école.',

      s9_title: '9. Droits des Utilisateurs (RGPD) et Contact',
      s9_p1: 'Vous disposez d’un droit d’accès, de rectification et d’effacement de vos données via legal@montessorinexus.com.',
      s9_address: 'CHAMBAPRO S.A.P.I. DE C.V., Cancún, Quintana Roo, Mexique. Site officiel : https://chamba.pro'
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
                Legal & Privacidad
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
              <ShieldCheck className="w-3.5 h-3.5" />
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
            <section id="responsable" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-[#C4661F]" />
                {t.s1_title}
              </h2>
              <p className="text-sm leading-relaxed text-stone-600 dark:text-slate-300">
                {t.s1_body}
              </p>
              <div className={`p-4 rounded-xl border text-xs ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-stone-100 border-stone-200'}`}>
                {t.s1_contact}
              </div>
            </section>

            {/* S2 */}
            <section id="datos-recolectados" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-[#C4661F]" />
                {t.s2_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s2_p1}</p>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-slate-300">
                {t.s2_list?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* S3: Child Protection */}
            <section id="menores" className={`p-6 rounded-2xl border space-y-4 ${
              isDark ? 'bg-amber-950/20 border-amber-900/40' : 'bg-amber-50/70 border-amber-200'
            }`}>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#C4661F]" />
                {t.s3_title}
              </h2>
              <p className="text-sm text-stone-700 dark:text-slate-300">{t.s3_p1}</p>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-slate-300">
                {t.s3_list?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#C4661F] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* S4 */}
            <section id="finalidades" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#C4661F]" />
                {t.s4_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s4_p1}</p>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-slate-300">
                {t.s4_list?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* S5: Google OAuth Limited Use */}
            <section id="google-oauth" className="space-y-3 p-6 rounded-2xl border bg-white dark:bg-[#162218] border-stone-200 dark:border-slate-800 shadow-3xs">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                {t.s5_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s5_p1}</p>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-slate-300">
                {t.s5_list?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* S6: Stripe PCI */}
            <section id="pagos" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-500" />
                {t.s6_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s6_p1}</p>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-slate-300">
                {t.s6_list?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* S7: AI Ethics */}
            <section id="ia-etica" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C4661F]" />
                {t.s7_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s7_p1}</p>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-slate-300">
                {t.s7_list?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#C4661F] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* S8: Security & Retention */}
            <section id="seguridad" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                {t.s8_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s8_p1}</p>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-slate-300">
                {t.s8_list?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* S9: Rights ARCO */}
            <section id="derechos" className="space-y-3 p-6 rounded-2xl border bg-stone-100 dark:bg-slate-900/60 border-stone-300 dark:border-slate-800">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#C4661F]" />
                {t.s9_title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300">{t.s9_p1}</p>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-slate-300">
                {t.s9_list?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#C4661F] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-stone-500 dark:text-slate-400 pt-2 border-t border-stone-200 dark:border-slate-800">
                {t.s9_address}
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
            <Link to="/terminos" className="hover:text-[#C4661F]">Términos de Servicio</Link>
            <Link to="/" className="hover:text-[#C4661F]">Inicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
