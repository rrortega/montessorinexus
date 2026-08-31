import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Images,
  Lock,
  ShieldAlert,
  LogIn,
  Eye,
  EyeOff,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  Sparkles,
  LogOut,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Users,
  Briefcase,
  Shield,
  Tag,
  Sun,
  Moon,
  Check,
  ChevronDown
} from "lucide-react";
import { getSharedGalleryView, Gallery, GalleryImageItem } from "@/lib/sqlite";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SettingsContext";
import { MontessoriNexusLogo } from "@/components/MontessoriNexusLogo";
import { ALL_SUPPORTED_LANGUAGES, getLanguageByCode } from "@/pages/admin/web-builder/languages";
import { toast } from "sonner";

interface SharedGalleryI18n {
  protectedAlbum: string;
  loading: string;
  galleryNotFound: string;
  galleryNotFoundDesc: string;
  privateGallery: string;
  privateGalleryDesc: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  loginBtn: string;
  loggingIn: string;
  loginSuccess: string;
  loginErrorDefault: string;
  unauthorized: string;
  unauthorizedDesc: string;
  loggedInAs: string;
  loginOtherAccount: string;
  photosAndVideos: string;
  noPhotos: string;
  noPhotosDesc: string;
  startAutoPlayback: string;
  autoPlayback: string;
  playbackMode: string;
  elements: string;
  pause: string;
  resume: string;
  speed: string;
  tags: string;
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  close: string;
  prev: string;
  next: string;
  clickToExpand: string;
  protectedContent: string;
  wheelZoomHelp: string;
  logout: string;
  lightMode: string;
  darkMode: string;
  changeLanguage: string;
  poweredByTagline: string;
  faceIdentifiedStudent: string;
  faceIdentifiedParent: string;
  faceIdentifiedStaff: string;
  faceIdentifiedPerson: string;
  faceProtected: string;
}

const GALLERY_I18N: Record<string, SharedGalleryI18n> = {
  es: {
    protectedAlbum: "Álbum Institucional Protegido",
    loading: "Cargando galería protegida...",
    galleryNotFound: "Galería no disponible",
    galleryNotFoundDesc: "El enlace que intentas abrir no existe o ha sido retirado por la institución.",
    privateGallery: "Galería Privada",
    privateGalleryDesc: "Ingresa con tu cuenta de familia o personal docente para acceder a las fotografías y videos de este álbum.",
    emailLabel: "Correo Electrónico",
    emailPlaceholder: "ejemplo@familia.com",
    passwordLabel: "Contraseña",
    loginBtn: "Iniciar Sesión y Ver Galería",
    loggingIn: "Iniciando sesión...",
    loginSuccess: "Sesión iniciada con éxito",
    loginErrorDefault: "Credenciales incorrectas. Verifica tu correo y contraseña.",
    unauthorized: "Acceso No Autorizado",
    unauthorizedDesc: "Tu usuario actual no cuenta con los permisos necesarios para ver esta galería. El acceso está restringido a familias de ambientes específicos.",
    loggedInAs: "Sesión iniciada como",
    loginOtherAccount: "Ingresar con otra cuenta",
    photosAndVideos: "Fotografías y Videos",
    noPhotos: "Aún no hay fotos en este álbum",
    noPhotosDesc: "Pronto se publicarán fotografías y videos aquí.",
    startAutoPlayback: "Iniciar Reproducción Automática",
    autoPlayback: "Auto-reproducción",
    playbackMode: "Modo Reproducción",
    elements: "Elementos",
    pause: "Pausar",
    resume: "Reanudar",
    speed: "Velocidad",
    tags: "Etiquetas",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    resetZoom: "Restablecer",
    close: "Cerrar",
    prev: "Anterior",
    next: "Siguiente",
    clickToExpand: "Haz clic para ampliar",
    protectedContent: "Contenido Protegido Institucional",
    wheelZoomHelp: "Rueda: Zoom • Arrastra para mover",
    logout: "Cerrar Sesión",
    lightMode: "Modo Claro",
    darkMode: "Modo Oscuro",
    changeLanguage: "Cambiar idioma",
    poweredByTagline: "Plataforma de Gestión Pedagógica y Galerías Seguras para Comunidades Montessori",
    faceIdentifiedStudent: "Alumno(a)",
    faceIdentifiedParent: "Familia / Tutor",
    faceIdentifiedStaff: "Equipo Docente",
    faceIdentifiedPerson: "Persona en la foto",
    faceProtected: "Privacidad Activa"
  },
  en: {
    protectedAlbum: "Protected Institutional Album",
    loading: "Loading protected gallery...",
    galleryNotFound: "Gallery not available",
    galleryNotFoundDesc: "The link you are trying to open does not exist or has been removed by the institution.",
    privateGallery: "Private Gallery",
    privateGalleryDesc: "Log in with your family or staff account to access the photos and videos in this album.",
    emailLabel: "Email Address",
    emailPlaceholder: "name@family.com",
    passwordLabel: "Password",
    loginBtn: "Log In and View Gallery",
    loggingIn: "Logging in...",
    loginSuccess: "Successfully logged in",
    loginErrorDefault: "Invalid credentials. Please check your email and password.",
    unauthorized: "Access Restricted",
    unauthorizedDesc: "Your account does not have permission to view this gallery. Access is restricted to specific classroom families.",
    loggedInAs: "Logged in as",
    loginOtherAccount: "Log in with another account",
    photosAndVideos: "Photos & Videos",
    noPhotos: "No photos in this album yet",
    noPhotosDesc: "Photos and videos will be published here soon.",
    startAutoPlayback: "Start Auto Playback",
    autoPlayback: "Auto-Playback",
    playbackMode: "Playback Mode",
    elements: "Items",
    pause: "Pause",
    resume: "Resume",
    speed: "Speed",
    tags: "Tags",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    resetZoom: "Reset",
    close: "Close",
    prev: "Previous",
    next: "Next",
    clickToExpand: "Click to expand",
    protectedContent: "Institutional Protected Content",
    wheelZoomHelp: "Scroll: Zoom • Drag to pan",
    logout: "Log Out",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    changeLanguage: "Change language",
    poweredByTagline: "Pedagogical Management & Secure Gallery Platform for Montessori Communities",
    faceIdentifiedStudent: "Student",
    faceIdentifiedParent: "Family / Guardian",
    faceIdentifiedStaff: "Teaching Staff",
    faceIdentifiedPerson: "Person in photo",
    faceProtected: "Privacy Protected"
  },
  pt: {
    protectedAlbum: "Álbum Institucional Protegido",
    loading: "Carregando galeria protegida...",
    galleryNotFound: "Galeria não disponível",
    galleryNotFoundDesc: "O link que você está tentando abrir não existe ou foi removido pela instituição.",
    privateGallery: "Galeria Privada",
    privateGalleryDesc: "Faça login com sua conta de família ou equipe para acessar fotos e vídeos deste álbum.",
    emailLabel: "E-mail",
    emailPlaceholder: "exemplo@familia.com",
    passwordLabel: "Senha",
    loginBtn: "Entrar e Ver Galeria",
    loggingIn: "Entrando...",
    loginSuccess: "Sessão iniciada com sucesso",
    loginErrorDefault: "Credenciais incorretas. Verifique seu e-mail e senha.",
    unauthorized: "Acesso Não Autorizado",
    unauthorizedDesc: "Sua conta atual não possui as permissões necessárias para ver esta galeria.",
    loggedInAs: "Sessão iniciada como",
    loginOtherAccount: "Entrar com outra conta",
    photosAndVideos: "Fotos e Vídeos",
    noPhotos: "Ainda não há fotos neste álbum",
    noPhotosDesc: "Fotos e vídeos serão publicados aqui em breve.",
    startAutoPlayback: "Iniciar Reprodução Automática",
    autoPlayback: "Auto-reprodução",
    playbackMode: "Modo Reprodução",
    elements: "Elementos",
    pause: "Pausar",
    resume: "Retomar",
    speed: "Velocidade",
    tags: "Etiquetas",
    zoomIn: "Aproximar",
    zoomOut: "Afastar",
    resetZoom: "Redefinir",
    close: "Fechar",
    prev: "Anterior",
    next: "Seguinte",
    clickToExpand: "Clique para ampliar",
    protectedContent: "Conteúdo Institucional Protegido",
    wheelZoomHelp: "Roda: Zoom • Arraste para mover",
    logout: "Sair",
    lightMode: "Modo Claro",
    darkMode: "Modo Escuro",
    changeLanguage: "Alterar idioma",
    poweredByTagline: "Plataforma de Gestão Pedagógica e Galerias Seguras para Comunidades Montessori",
    faceIdentifiedStudent: "Aluno(a)",
    faceIdentifiedParent: "Família / Responsável",
    faceIdentifiedStaff: "Corpo Docente",
    faceIdentifiedPerson: "Pessoa na foto",
    faceProtected: "Privacidade Ativa"
  },
  fr: {
    protectedAlbum: "Album Institutionnel Protégé",
    loading: "Chargement de la galerie protégée...",
    galleryNotFound: "Galerie non disponible",
    galleryNotFoundDesc: "Le lien que vous essayez d'ouvrir n'existe pas ou a été supprimé par l'établissement.",
    privateGallery: "Galerie Privée",
    privateGalleryDesc: "Connectez-vous avec votre compte famille ou personnel pour accéder aux photos et vidéos.",
    emailLabel: "Adresse E-mail",
    emailPlaceholder: "exemple@famille.com",
    passwordLabel: "Mot de passe",
    loginBtn: "Se connecter et voir l'album",
    loggingIn: "Connexion en cours...",
    loginSuccess: "Connexion réussie",
    loginErrorDefault: "Identifiants incorrects. Veuillez vérifier votre adresse e-mail et mot de passe.",
    unauthorized: "Accès Non Autorisé",
    unauthorizedDesc: "Votre compte ne dispose pas des autorisations nécessaires pour afficher cette galerie.",
    loggedInAs: "Connecté en tant que",
    loginOtherAccount: "Changer de compte",
    photosAndVideos: "Photos et Vidéos",
    noPhotos: "Aucune photo pour l'instant",
    noPhotosDesc: "Des photos et vidéos seront publiées ici prochainement.",
    startAutoPlayback: "Démarrer la Lecture Automatique",
    autoPlayback: "Lecture Auto",
    playbackMode: "Mode Lecture",
    elements: "Éléments",
    pause: "Pause",
    resume: "Reprendre",
    speed: "Vitesse",
    tags: "Étiquettes",
    zoomIn: "Zoomer",
    zoomOut: "Dézoomer",
    resetZoom: "Réinitialiser",
    close: "Fermer",
    prev: "Précédent",
    next: "Suivant",
    clickToExpand: "Cliquer pour agrandir",
    protectedContent: "Contenu Institutionnel Protégé",
    wheelZoomHelp: "Molette: Zoom • Glisser pour déplacer",
    logout: "Déconnexion",
    lightMode: "Mode Clair",
    darkMode: "Mode Sombre",
    changeLanguage: "Changer de langue",
    poweredByTagline: "Plateforme de Gestion Pédagogique et Galeries Sécurisées pour Communautés Montessori",
    faceIdentifiedStudent: "Élève",
    faceIdentifiedParent: "Famille / Tuteur",
    faceIdentifiedStaff: "Équipe Enseignante",
    faceIdentifiedPerson: "Personne sur la photo",
    faceProtected: "Confidentialité Active"
  },
  de: {
    protectedAlbum: "Geschütztes Schulalbum",
    loading: "Geschützte Galerie wird geladen...",
    galleryNotFound: "Galerie nicht verfügbar",
    galleryNotFoundDesc: "Der aufgerufene Link existiert nicht oder wurde entfernt.",
    privateGallery: "Private Galerie",
    privateGalleryDesc: "Melden Sie sich mit Ihrem Konto an, um Fotos und Videos anzusehen.",
    emailLabel: "E-Mail-Adresse",
    emailPlaceholder: "name@familie.de",
    passwordLabel: "Passwort",
    loginBtn: "Anmelden & Galerie ansehen",
    loggingIn: "Anmeldung läuft...",
    loginSuccess: "Erfolgreich angemeldet",
    loginErrorDefault: "Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.",
    unauthorized: "Zugriff verweigert",
    unauthorizedDesc: "Ihr Benutzerkonto verfügt nicht über die erforderlichen Berechtigungen.",
    loggedInAs: "Angemeldet als",
    loginOtherAccount: "Mit anderem Konto anmelden",
    photosAndVideos: "Fotos & Videos",
    noPhotos: "Noch keine Fotos in diesem Album",
    noPhotosDesc: "Fotos und Videos werden in Kürze veröffentlicht.",
    startAutoPlayback: "Automatische Wiedergabe starten",
    autoPlayback: "Auto-Wiedergabe",
    playbackMode: "Wiedergabemodus",
    elements: "Elemente",
    pause: "Pause",
    resume: "Fortsetzen",
    speed: "Geschwindigkeit",
    tags: "Tags",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    resetZoom: "Zurücksetzen",
    close: "Schließen",
    prev: "Zurück",
    next: "Weiter",
    clickToExpand: "Klicken zum Vergrößern",
    protectedContent: "Geschützter institutioneller Inhalt",
    wheelZoomHelp: "Mausrad: Zoom • Ziehen zum Bewegen",
    logout: "Abmelden",
    lightMode: "Heller Modus",
    darkMode: "Dunkler Modus",
    changeLanguage: "Sprache ändern",
    poweredByTagline: "Pädagogische Verwaltungsplattform und sichere Galerien für Montessori-Gemeinschaften",
    faceIdentifiedStudent: "Schüler(in)",
    faceIdentifiedParent: "Familie / Erziehungsberechtigte",
    faceIdentifiedStaff: "Lehrkörper",
    faceIdentifiedPerson: "Person auf dem Foto",
    faceProtected: "Datenschutz aktiv"
  },
  ru: {
    protectedAlbum: "Защищенный школьный альбом",
    loading: "Загрузка защищенной галереи...",
    galleryNotFound: "Галерея недоступна",
    galleryNotFoundDesc: "Ссылка не существует или была удалена администрацией.",
    privateGallery: "Закрытая галерея",
    privateGalleryDesc: "Войдите в систему для доступа к фото и видео этого альбома.",
    emailLabel: "Электронная почта",
    emailPlaceholder: "name@family.com",
    passwordLabel: "Пароль",
    loginBtn: "Войти и открыть альбом",
    loggingIn: "Вход...",
    loginSuccess: "Успешный вход в систему",
    loginErrorDefault: "Неверные учетные данные. Проверьте адрес почты и пароль.",
    unauthorized: "Доступ ограничен",
    unauthorizedDesc: "У вашей учетной записи нет прав на просмотр этой галереи.",
    loggedInAs: "Вы вошли как",
    loginOtherAccount: "Войти под другим аккаунтом",
    photosAndVideos: "Фото и видео",
    noPhotos: "В этом альбоме пока нет фотографий",
    noPhotosDesc: "Скоро здесь появятся фотографии и видеозаписи.",
    startAutoPlayback: "Автоматическое воспроизведение",
    autoPlayback: "Авто-воспроизведение",
    playbackMode: "Режим воспроизведения",
    elements: "Элементов",
    pause: "Пауза",
    resume: "Продолжить",
    speed: "Скорость",
    tags: "Метки",
    zoomIn: "Приблизить",
    zoomOut: "Отдалить",
    resetZoom: "Сброс",
    close: "Закрыть",
    prev: "Назад",
    next: "Вперед",
    clickToExpand: "Нажмите для увеличения",
    protectedContent: "Защищенный контент учреждения",
    wheelZoomHelp: "Колесико: масштаб • Перетаскивание для сдвига",
    logout: "Выйти",
    lightMode: "Светлая тема",
    darkMode: "Темная тема",
    changeLanguage: "Сменить язык",
    poweredByTagline: "Образовательная платформа и защищенные галереи Монтессори",
    faceIdentifiedStudent: "Ученик",
    faceIdentifiedParent: "Родитель / Опекун",
    faceIdentifiedStaff: "Педагог",
    faceIdentifiedPerson: "Человек на фото",
    faceProtected: "Конфиденциальность"
  },
  ca: {
    protectedAlbum: "Àlbum Institucional Protegit",
    loading: "Carregant galeria protegida...",
    galleryNotFound: "Galeria no disponible",
    galleryNotFoundDesc: "L'enllaç no existeix o ha estat retirat per la institució.",
    privateGallery: "Galeria Privada",
    privateGalleryDesc: "Inicia sessió amb el teu compte per accedir a les fotos i vídeos.",
    emailLabel: "Correu Electrònic",
    emailPlaceholder: "exemple@familia.cat",
    passwordLabel: "Contrasenya",
    loginBtn: "Iniciar Sessió i Veure Galeria",
    loggingIn: "Iniciant sessió...",
    loginSuccess: "Sessió iniciada amb èxit",
    loginErrorDefault: "Credencials incorrectes. Verifica el teu correu i contrasenya.",
    unauthorized: "Accés No Autoritzat",
    unauthorizedDesc: "El teu usuari no disposa dels permisos necessaris per veure aquesta galeria.",
    loggedInAs: "Sessió iniciada com a",
    loginOtherAccount: "Entrar amb un altre compte",
    photosAndVideos: "Fotografies i Vídeos",
    noPhotos: "Encara no hi ha fotos en aquest àlbum",
    noPhotosDesc: "Aviat es publicaran fotografies i vídeos aquí.",
    startAutoPlayback: "Iniciar Reproducció Automàtica",
    autoPlayback: "Auto-reproducció",
    playbackMode: "Mode Reproducció",
    elements: "Elements",
    pause: "Pausa",
    resume: "Reprendre",
    speed: "Velocitat",
    tags: "Etiquetes",
    zoomIn: "Apropar",
    zoomOut: "Allunyar",
    resetZoom: "Restablir",
    close: "Tancar",
    prev: "Anterior",
    next: "Següent",
    clickToExpand: "Clica per ampliar",
    protectedContent: "Contingut Institucional Protegit",
    wheelZoomHelp: "Roda: Zoom • Arrossega per moure",
    logout: "Tancar Sessió",
    lightMode: "Mode Clar",
    darkMode: "Mode Fosc",
    changeLanguage: "Canviar idioma",
    poweredByTagline: "Plataforma de Gestió Pedagògica i Galeries Segures per a Comunitats Montessori",
    faceIdentifiedStudent: "Alumne/a",
    faceIdentifiedParent: "Família / Tutor",
    faceIdentifiedStaff: "Equip Docent",
    faceIdentifiedPerson: "Persona a la foto",
    faceProtected: "Privacitat Activa"
  }
};

const isVideoUrl = (url: string) => {
  return Boolean(url && url.match(/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i));
};

export const SharedGalleryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, login, logout, isAuthenticated } = useAuth();
  const { settings } = useSiteSettings();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    requiresAuth: boolean;
    permitted: boolean;
    error?: string;
    gallery: (Gallery & { images?: GalleryImageItem[] }) | null;
    school?: {
      id: string;
      name: string;
      slug: string;
      logo?: string | null;
      logoUrl?: string | null;
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
    };
    user?: {
      id: string;
      name: string;
      email: string;
      role?: string;
    };
  } | null>(null);

  // Theme Toggle State
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mn_theme") || localStorage.getItem("montessori_nexus_theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark") || window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("mn_theme", "dark");
      localStorage.setItem("montessori_nexus_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("mn_theme", "light");
      localStorage.setItem("montessori_nexus_theme", "light");
    }
  }, [isDark]);

  // Language State
  const [activeLocale, setActiveLocale] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mn_locale") || localStorage.getItem("i18nextLng") || "es";
    }
    return "es";
  });
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const handleSelectLanguage = (code: string) => {
    setActiveLocale(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("mn_locale", code);
    }
    setLangMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const t = GALLERY_I18N[activeLocale] || GALLERY_I18N.es;
  const currentLangObj = getLanguageByCode(activeLocale);

  // Embedded Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Face Tags Toggle & Hover State (OFF by default, only visible in Lightbox/Preview mode)
  const [showFaceTags, setShowFaceTags] = useState<boolean>(false);
  const [hoveredFaceId, setHoveredFaceId] = useState<string | null>(null);

  // Lightbox & Transition State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [isOpeningLightbox, setIsOpeningLightbox] = useState(false);
  const [isClosingLightbox, setIsClosingLightbox] = useState(false);

  // Animated Slideshow / Video Showcase Mode State
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [slideshowPaused, setSlideshowPaused] = useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = useState<number>(4); // seconds per slide
  const [slideProgress, setSlideProgress] = useState<number>(0);

  // Anti-theft & download protection event listeners
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }
      // Block Ctrl+Shift+I / Cmd+Option+I (Inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i")) {
        e.preventDefault();
        return;
      }
      // Block Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "J" || e.key === "j")) {
        e.preventDefault();
        return;
      }
      // Block Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "C" || e.key === "c")) {
        e.preventDefault();
        return;
      }
      // Block Ctrl+U / Cmd+Option+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        return;
      }
      // Block Ctrl+S / Cmd+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        return;
      }
      // Block Ctrl+P / Cmd+P (Print Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        return;
      }
      // Space toggles slideshow playback
      if (e.key === " " && lightboxIndex !== null) {
        e.preventDefault();
        setSlideshowPaused((prev) => !prev);
        return;
      }
      // Esc closes lightbox
      if (e.key === "Escape") {
        handleCloseLightbox();
      }
      // Arrow keys navigate images
      if (lightboxIndex !== null) {
        if (e.key === "ArrowLeft") {
          handlePrevImage();
        } else if (e.key === "ArrowRight") {
          handleNextImage();
        }
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("dragstart", handleDragStart);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("dragstart", handleDragStart);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex]);

  const loadSharedGallery = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getSharedGalleryView(id);
      setData(res);
    } catch (err: any) {
      console.error("Error loading shared gallery:", err);
      toast.error(err?.message || t.galleryNotFound);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSharedGallery();
  }, [id, isAuthenticated]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      await login(loginEmail, loginPassword);
      toast.success(t.loginSuccess);
      await loadSharedGallery();
    } catch (err: any) {
      console.error("Shared gallery login error:", err);
      setLoginError(err?.message || t.loginErrorDefault);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    await loadSharedGallery();
  };

  const images = data?.gallery?.images || [];

  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null;
  const isCurrentVideo = currentImage ? isVideoUrl(currentImage.src) : false;
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // Synchronize video play/pause with slideshow state
  useEffect(() => {
    if (isCurrentVideo && videoPlayerRef.current) {
      if (slideshowPaused) {
        videoPlayerRef.current.pause();
      } else if (isSlideshowActive) {
        videoPlayerRef.current.play().catch(() => {});
      }
    }
  }, [slideshowPaused, isCurrentVideo, isSlideshowActive, lightboxIndex]);

  // Automatic Playback Loop (Photos use duration timer, Videos advance via onEnded)
  useEffect(() => {
    if (!isSlideshowActive || slideshowPaused || lightboxIndex === null || images.length <= 1) {
      if (!isCurrentVideo) setSlideProgress(0);
      return;
    }

    // If currently displaying a video, its onTimeUpdate & onEnded callbacks control progression
    if (isCurrentVideo) {
      return;
    }

    const intervalMs = slideshowSpeed * 1000;
    const tickMs = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += tickMs;
      const prog = Math.min(100, (elapsed / intervalMs) * 100);
      setSlideProgress(prog);

      if (elapsed >= intervalMs) {
        setSlideDirection("next");
        setLightboxIndex((prev) => ((prev ?? 0) + 1) % images.length);
        setZoomScale(1);
        setPanPosition({ x: 0, y: 0 });
        elapsed = 0;
        setSlideProgress(0);
      }
    }, tickMs);

    return () => clearInterval(timer);
  }, [isSlideshowActive, slideshowPaused, lightboxIndex, isCurrentVideo, images.length, slideshowSpeed]);

  const handleOpenLightbox = (index: number) => {
    setSlideDirection("next");
    setIsOpeningLightbox(true);
    setLightboxIndex(index);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setTimeout(() => setIsOpeningLightbox(false), 450);
  };

  const handleCloseLightbox = () => {
    setIsClosingLightbox(true);
    setIsSlideshowActive(false);
    setTimeout(() => {
      setLightboxIndex(null);
      setIsClosingLightbox(false);
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
    }, 250);
  };

  const handleStartSlideshow = () => {
    setIsSlideshowActive(true);
    setSlideshowPaused(false);
    setSlideDirection("next");
    setIsOpeningLightbox(true);
    setLightboxIndex(lightboxIndex !== null ? lightboxIndex : 0);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setTimeout(() => setIsOpeningLightbox(false), 450);
  };

  const handlePrevImage = () => {
    if (lightboxIndex === null || images.length === 0) return;
    setSlideDirection("prev");
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setSlideProgress(0);
  };

  const handleNextImage = () => {
    if (lightboxIndex === null || images.length === 0) return;
    setSlideDirection("next");
    setLightboxIndex((lightboxIndex + 1) % images.length);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setSlideProgress(0);
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoomScale((prev) => {
      const next = Math.max(1, Math.min(4, Number((prev + delta).toFixed(2))));
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleMouseDownPan = (e: React.MouseEvent) => {
    if (e.button === 2 || e.button === 1 || e.altKey || (zoomScale > 1 && e.shiftKey) || zoomScale > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMovePan = (e: React.MouseEvent) => {
    if (isPanning && panStart) {
      setPanPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUpPan = () => {
    setIsPanning(false);
    setPanStart(null);
  };

  const schoolLogo = data?.school?.logo || data?.school?.logoUrl || settings?.logo || "/assets/logo-ceiba-D1S2-QfB.svg";
  const schoolName = data?.school?.name || settings?.schoolName || "Colegio";
  const coverBg = data?.gallery?.coverImage || images[0]?.src || "";

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white p-4 select-none transition-colors duration-200">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 dark:text-amber-400 mb-4" />
        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium animate-pulse">{t.loading}</p>
      </div>
    );
  }

  if (!data || !data.gallery) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white p-6 text-center select-none transition-colors duration-200">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400 mb-4 shadow-xl">
          <Images className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">{t.galleryNotFound}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          {t.galleryNotFoundDesc}
        </p>
      </div>
    );
  }

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative min-h-screen bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-white font-body selection:bg-transparent select-none overflow-x-hidden transition-colors duration-200"
    >
      {/* Global CSS injection for anti-print, image theft protection, and smooth transitions */}
      <style>{`
        @media print {
          body { display: none !important; }
        }
        img, video {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-user-drag: none !important;
          pointer-events: none !important;
        }

        @keyframes zoomInShake {
          0% {
            opacity: 0;
            transform: scale(0.65) rotate(-2deg);
          }
          45% {
            opacity: 1;
            transform: scale(1.06) rotate(1.2deg);
          }
          65% {
            transform: scale(0.97) rotate(-0.6deg);
          }
          80% {
            transform: scale(1.02) rotate(0.3deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes zoomOutFade {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.7) rotate(1.5deg);
          }
        }

        @keyframes slideNextIn {
          0% {
            opacity: 0;
            transform: translateX(45px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes slidePrevIn {
          0% {
            opacity: 0;
            transform: translateX(-45px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes kenBurnsSlowA {
          0% {
            transform: scale(1) translate(0, 0);
          }
          50% {
            transform: scale(1.09) translate(-1.2%, -1%);
          }
          100% {
            transform: scale(1.18) translate(1.4%, 1.2%);
          }
        }

        @keyframes kenBurnsSlowB {
          0% {
            transform: scale(1.18) translate(1.2%, 1.2%);
          }
          50% {
            transform: scale(1.08) translate(-1.2%, 0.8%);
          }
          100% {
            transform: scale(1) translate(0, 0);
          }
        }

        .anim-zoom-shake {
          animation: zoomInShake 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .anim-zoom-out {
          animation: zoomOutFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .anim-slide-next {
          animation: slideNextIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .anim-slide-prev {
          animation: slidePrevIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .anim-ken-burns-a {
          animation: kenBurnsSlowA 8s ease-in-out infinite alternate;
        }

        .anim-ken-burns-b {
          animation: kenBurnsSlowB 8s ease-in-out infinite alternate;
        }
      `}</style>

      {/* Background Ambient Blur of Main/Cover Image */}
      {coverBg && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none opacity-10 dark:opacity-20 blur-3xl scale-110 transition-all duration-700"
          style={{ backgroundImage: `url(${coverBg})` }}
        />
      )}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-stone-100/90 via-stone-50/95 to-stone-50 dark:from-slate-950/85 dark:via-slate-950/90 dark:to-slate-950 pointer-events-none transition-colors duration-200" />

      {/* Standalone Minimalist Header (School Logo, Name, Language & Theme Controls) */}
      <header className="relative z-20 w-full border-b border-stone-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo & School Name - Clean without borders */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-auto min-w-[36px] max-w-[180px] sm:max-w-[240px] flex items-center justify-center p-0 border-0 bg-transparent shadow-none pointer-events-none shrink-0">
              <img src={schoolLogo} alt={schoolName} className="h-full w-auto max-h-9 sm:max-h-10 object-contain" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black tracking-wider uppercase text-amber-600 dark:text-amber-400 block leading-none flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                {t.protectedAlbum}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block truncate max-w-[160px] sm:max-w-xs">
                {schoolName}
              </span>
            </div>
          </div>

          {/* Top Controls: Language, Theme & User Session */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Selector Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="h-8 px-2.5 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 border border-stone-200 dark:border-white/10 text-slate-800 dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title={t.changeLanguage}
              >
                <span className="text-sm leading-none">{currentLangObj.flag}</span>
                <span className="hidden sm:inline uppercase text-[11px] font-mono font-bold tracking-wider">{currentLangObj.code}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/15 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 border-b border-stone-100 dark:border-white/10 mb-1">
                    Idioma / Language
                  </div>
                  {ALL_SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                        activeLocale === lang.code
                          ? "bg-amber-500/10 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 font-bold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </div>
                      {activeLocale === lang.code && <Check className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Light / Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 border border-stone-200 dark:border-white/10 text-slate-800 dark:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title={isDark ? t.lightMode : t.darkMode}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* User session status badge if logged in */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-2 bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 px-3 py-1 rounded-full text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[120px]">{user.name || user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title={t.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.logout}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12 pb-28">
        {/* CASE 1: REQUIRES AUTHENTICATION */}
        {data.requiresAuth && (
          <div className="max-w-md mx-auto my-8 p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-stone-200 dark:border-white/15 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 dark:bg-amber-400/20 border border-amber-500/30 dark:border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-300 mb-3 shadow-lg shadow-amber-500/10">
                <Lock className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                {t.privateGallery}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
                {data.gallery.name}
              </h1>
              {data.gallery.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed italic">
                  "{data.gallery.description}"
                </p>
              )}
            </div>

            <div className="bg-stone-100/80 dark:bg-slate-950/60 p-4 rounded-2xl border border-stone-200 dark:border-white/10 mb-6 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {t.privateGalleryDesc}
              </p>
            </div>

            {loginError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 dark:bg-rose-900/40 border border-rose-500/30 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-950/80 border border-stone-300 dark:border-white/15 text-xs text-slate-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-stone-50 dark:bg-slate-950/80 border border-stone-300 dark:border-white/15 text-xs text-slate-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{t.loginBtn}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* CASE 2: LOGGED IN BUT FORBIDDEN */}
        {!data.requiresAuth && !data.permitted && (
          <div className="max-w-lg mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-rose-500/30 shadow-2xl text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-xl shadow-rose-500/10">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
              {t.unauthorized}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">
              {data.gallery.name}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {data.error || t.unauthorizedDesc}
            </p>

            <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-slate-950/60 border border-stone-200 dark:border-white/10 mb-6 text-xs text-slate-500 dark:text-slate-400">
              {t.loggedInAs}: <span className="text-slate-900 dark:text-white font-semibold">{data.user?.name || data.user?.email}</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.loginOtherAccount}</span>
              </button>
            </div>
          </div>
        )}

        {/* CASE 3: AUTHORIZED AND PERMITTED (PURE PROTECTED VIEWER) */}
        {!data.requiresAuth && data.permitted && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Gallery Hero Title & Info */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-200/80 dark:bg-white/10 border border-stone-300/80 dark:border-white/15 text-xs text-amber-700 dark:text-amber-300 backdrop-blur-md shadow-xs">
                <Images className="w-3.5 h-3.5" />
                <span>{images.length} {t.photosAndVideos}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
                {data.gallery.name}
              </h1>
              {data.gallery.description && (
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  {data.gallery.description}
                </p>
              )}
            </div>

            {/* Photos & Videos Grid */}
            {images.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-stone-200 dark:border-white/10 text-center max-w-md mx-auto shadow-md">
                <Images className="w-10 h-10 mx-auto text-stone-400 dark:text-slate-500 mb-3" />
                <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold mb-1">{t.noPhotos}</p>
                <p className="text-xs text-stone-500 dark:text-slate-500">{t.noPhotosDesc}</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-start items-stretch">
                {images.map((image, idx) => {
                  const isVid = isVideoUrl(image.src);
                  const hasFaces = (image.detected_faces || []).length > 0;

                  return (
                    <div
                      key={image.id || idx}
                      onClick={() => handleOpenLightbox(idx)}
                      className="relative flex-grow h-44 sm:h-56 md:h-64 lg:h-72 min-w-[130px] max-w-full overflow-hidden bg-stone-200 dark:bg-slate-900 group cursor-pointer select-none rounded-none border-0"
                    >
                      {/* Anti-theft transparent shield */}
                      <div className="absolute inset-0 z-10 bg-transparent" />

                      {isVid ? (
                        <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                          <video
                            src={image.src}
                            className="w-full h-full object-cover opacity-90 block pointer-events-none rounded-none"
                          />
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center pointer-events-none group-hover:bg-black/20 transition-colors">
                            <div className="w-11 h-11 bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 ml-0.5 fill-current" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full relative overflow-hidden bg-stone-100 dark:bg-slate-900">
                          <img
                            src={image.src}
                            alt={image.title || `Foto ${idx + 1}`}
                            loading="lazy"
                            draggable={false}
                            className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-300 pointer-events-none rounded-none"
                          />
                        </div>
                      )}

                      {/* Google Photos style hover overlay */}
                      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 sm:p-3 pointer-events-none">
                        <div className="flex items-end justify-between gap-2">
                          <div className="min-w-0">
                            {image.title ? (
                              <span className="text-xs font-bold text-white truncate block drop-shadow-md">
                                {image.title}
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-white/90 drop-shadow-md">
                                {t.clickToExpand}
                              </span>
                            )}
                          </div>
                          {hasFaces && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-black/70 px-2 py-0.5 backdrop-blur-md shrink-0">
                              <Users className="w-3 h-3" />
                              <span>{(image.detected_faces || []).length}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Flex spacer preventing over-stretching on the last row */}
                <div className="flex-grow-[10] h-0 min-w-[200px]" />
              </div>
            )}

            {/* Footer Credit to MontessoriNexus */}
            <footer className="mt-20 pt-8 border-t border-stone-200 dark:border-white/10 text-center flex flex-col items-center justify-center gap-2.5 select-none">
              <a
                href="https://montessorinexus.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 dark:hover:border-amber-400/40 transition-all duration-200 shadow-xs"
              >
                <span className="text-[11px] font-medium text-stone-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                  Powered by
                </span>
                <MontessoriNexusLogo size={18} />
                <span className="text-xs font-bold font-serif text-slate-900 dark:text-white tracking-wide group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                  MontessoriNexus
                </span>
              </a>
              <p className="text-[10px] text-stone-500 dark:text-slate-500 font-medium max-w-sm">
                {t.poweredByTagline}
              </p>
            </footer>
          </div>
        )}
      </main>

      {/* Floating Fixed Bottom Bar for Single Auto-Playback Option */}
      {!data.requiresAuth && data.permitted && images.length > 0 && lightboxIndex === null && (
        <div className="fixed bottom-6 inset-x-0 z-30 flex justify-center items-center pointer-events-none px-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="pointer-events-auto bg-white/90 dark:bg-slate-950/85 backdrop-blur-2xl border border-stone-300 dark:border-white/20 shadow-2xl shadow-stone-900/10 dark:shadow-black/90 rounded-full p-1.5 pl-4 pr-1.5 flex items-center gap-3 max-w-full">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
              <span>{images.length} {t.elements}</span>
            </div>

            <div className="h-4 w-px bg-stone-300 dark:bg-white/15 hidden sm:block" />

            <button
              type="button"
              onClick={handleStartSlideshow}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold font-display uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>{t.startAutoPlayback}</span>
              <Sparkles className="w-3.5 h-3.5 opacity-80 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN PROTECTED LIGHTBOX WITH ZOOM, PAN, SHAKE TRANSITION & ANIMATED SLIDESHOW */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 select-none ${
            isOpeningLightbox ? "anim-zoom-shake" : isClosingLightbox ? "anim-zoom-out" : ""
          }`}
          onWheel={handleWheelZoom}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Top Progress Bar for Animated Slideshow */}
          {isSlideshowActive && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-50">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-md shadow-amber-400/50 transition-all duration-75 ease-linear"
                style={{ width: `${slideProgress}%` }}
              />
            </div>
          )}

          {/* Top Bar Controls */}
          <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
            {/* Left Status & Title */}
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold text-white">
              <span>{lightboxIndex + 1} / {images.length}</span>
              {images[lightboxIndex].title && (
                <span className="text-slate-300 font-normal truncate max-w-xs hidden sm:inline">
                  — {images[lightboxIndex].title}
                </span>
              )}
            </div>

            {/* Center Slideshow Controls (If Active) */}
            {isSlideshowActive && (
              <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-amber-400/40 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setSlideshowPaused(!slideshowPaused)}
                  className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center hover:bg-amber-300 transition-colors cursor-pointer"
                  title={slideshowPaused ? t.resume : t.pause}
                >
                  {slideshowPaused ? <Play className="w-3.5 h-3.5 ml-0.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                </button>

                {/* Speed Controls for Photos */}
                {!isCurrentVideo && (
                  <div className="hidden sm:flex items-center gap-1 border-l border-white/20 pl-2 ml-1">
                    {[2, 4, 6].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setSlideshowSpeed(spd)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          slideshowSpeed === spd
                            ? "bg-amber-400 text-slate-950 font-black"
                            : "text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                        title={`${spd}s`}
                      >
                        {spd}s
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Right Action Buttons: Auto-reproducción Toggle, Tags Toggle & Zoom */}
            <div className="flex items-center gap-2">
              {/* Slideshow Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  if (isSlideshowActive) {
                    setIsSlideshowActive(false);
                  } else {
                    handleStartSlideshow();
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg border ${
                  isSlideshowActive
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-amber-400/20"
                    : "bg-black/70 text-white/80 hover:text-white border-white/20"
                }`}
                title={t.autoPlayback}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden md:inline">{t.autoPlayback}:</span>
                <span>{isSlideshowActive ? "ON" : "OFF"}</span>
              </button>

              {/* Tags Toggle in Lightbox (Hidden during Auto-reproducción) */}
              {!isVideoUrl(images[lightboxIndex].src) && !isSlideshowActive && (
                <button
                  type="button"
                  onClick={() => setShowFaceTags(!showFaceTags)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg border ${
                    showFaceTags
                      ? "bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/20"
                      : "bg-black/70 text-white/80 hover:text-white border-white/20"
                  }`}
                  title={t.tags}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.tags}:</span>
                  <span>{showFaceTags ? "ON" : "OFF"}</span>
                </button>
              )}

              {/* Zoom Controls */}
              {!isVideoUrl(images[lightboxIndex].src) && (
                <div className="hidden sm:flex items-center gap-1 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-xl">
                  <button
                    type="button"
                    onClick={() => setZoomScale((prev) => Math.max(1, Number((prev - 0.25).toFixed(2))))}
                    disabled={zoomScale <= 1}
                    className="w-5 h-5 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 text-xs font-black cursor-pointer"
                    title={t.zoomOut}
                  >
                    -
                  </button>
                  <span className="text-[11px] font-mono font-bold text-amber-300 min-w-8 text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale((prev) => Math.min(4, Number((prev + 0.25).toFixed(2))))}
                    disabled={zoomScale >= 4}
                    className="w-5 h-5 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 text-xs font-black cursor-pointer"
                    title={t.zoomIn}
                  >
                    +
                  </button>
                  {zoomScale > 1 && (
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      className="ml-1 px-1.5 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/40 text-amber-300 text-[10px] font-bold cursor-pointer"
                      title={t.resetZoom}
                    >
                      1x
                    </button>
                  )}
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseLightbox}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title={`${t.close} (Esc)`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-xl transition-all cursor-pointer hover:scale-105"
                title={t.prev}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-xl transition-all cursor-pointer hover:scale-105"
                title={t.next}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Image / Video Display with Anti-theft Guard, Face Boxes & Smooth Transitions */}
          <div
            className="relative max-h-[85vh] max-w-[90vw] flex items-center justify-center overflow-hidden"
            onMouseDown={handleMouseDownPan}
            onMouseMove={handleMouseMovePan}
            onMouseUp={handleMouseUpPan}
          >
            {isVideoUrl(images[lightboxIndex].src) ? (
              <video
                ref={videoPlayerRef}
                key={`video-${lightboxIndex}`}
                src={images[lightboxIndex].src}
                controls
                autoPlay
                playsInline
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (isSlideshowActive && v.duration && !isNaN(v.duration)) {
                    setSlideProgress(Math.min(100, (v.currentTime / v.duration) * 100));
                  }
                }}
                onEnded={() => {
                  if (isSlideshowActive) {
                    handleNextImage();
                  }
                }}
                className="max-h-[80vh] max-w-[85vw] rounded-none shadow-2xl"
              />
            ) : (
              <div
                key={`${lightboxIndex}-${slideDirection}`}
                className={`relative inline-block leading-none mx-auto overflow-hidden rounded-none ${
                  slideDirection === "next" ? "anim-slide-next" : "anim-slide-prev"
                }`}
                style={{
                  transform: `scale(${zoomScale}) translate(${panPosition.x / zoomScale}px, ${panPosition.y / zoomScale}px)`,
                  transformOrigin: "center center",
                  transition: isPanning ? "none" : "transform 0.12s ease-out"
                }}
              >
                <img
                  src={images[lightboxIndex].src}
                  alt={images[lightboxIndex].title || ""}
                  draggable={false}
                  className={`max-h-[82vh] max-w-[88vw] object-contain rounded-none shadow-2xl select-none pointer-events-none block ${
                    isSlideshowActive
                      ? lightboxIndex % 2 === 0
                        ? "anim-ken-burns-a"
                        : "anim-ken-burns-b"
                      : ""
                  } ${isPanning ? "cursor-grabbing" : zoomScale > 1 ? "cursor-grab" : ""}`}
                />

                {/* Lightbox Face Tags Overlay (Only when not in Auto-reproducción) */}
                {showFaceTags && !isSlideshowActive && (images[lightboxIndex].detected_faces || []).length > 0 && (
                  <div className="absolute inset-0 z-30 pointer-events-none">
                    {(images[lightboxIndex].detected_faces || []).map((face, fIdx) => {
                      const key = `lb-${lightboxIndex}-${fIdx}`;
                      const isHovered = hoveredFaceId === key;
                      const box = face.box;
                      if (!box) return null;

                      const isStudent = face.personType === "student" || (!face.personType && face.studentId);
                      const isParent = face.personType === "parent" || (!face.personType && face.parentName);
                      const isStaff = face.personType === "staff";
                      const isBlurred = face.isBlurred;

                      return (
                        <div
                          key={key}
                          onMouseEnter={() => setHoveredFaceId(key)}
                          onMouseLeave={() => setHoveredFaceId(null)}
                          style={{
                            top: `${box.top}%`,
                            left: `${box.left}%`,
                            width: `${box.width}%`,
                            height: `${box.height}%`
                          }}
                          className={`absolute border-2 rounded-xl transition-all duration-200 pointer-events-auto cursor-pointer ${
                            isHovered
                              ? "border-amber-300 bg-amber-400/20 scale-105 shadow-xl z-40"
                              : isBlurred
                              ? "border-rose-400/70 bg-rose-500/10 backdrop-blur-xs"
                              : "border-white/70 hover:border-amber-300 bg-black/10"
                          }`}
                        >
                          {/* Indicator badge in corner */}
                          <div className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-slate-950/90 border border-white/40 flex items-center justify-center shadow-md">
                            {isStudent ? (
                              <GraduationCap className="w-3 h-3 text-emerald-400" />
                            ) : isParent ? (
                              <Users className="w-3 h-3 text-sky-400" />
                            ) : isStaff ? (
                              <Briefcase className="w-3 h-3 text-amber-400" />
                            ) : isBlurred ? (
                              <Shield className="w-3 h-3 text-rose-400" />
                            ) : (
                              <Tag className="w-3 h-3 text-white" />
                            )}
                          </div>

                          {/* Hover Details Floating Card */}
                          {isHovered && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 min-w-[200px] max-w-xs animate-in fade-in zoom-in-95 pointer-events-none">
                              <div className="bg-slate-950/95 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl text-left">
                                <div className="flex items-center gap-2.5">
                                  {face.avatarUrl ? (
                                    <img
                                      src={face.avatarUrl}
                                      alt=""
                                      className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                                      {isStudent ? (
                                        <GraduationCap className="w-4 h-4 text-emerald-400" />
                                      ) : isParent ? (
                                        <Users className="w-4 h-4 text-sky-400" />
                                      ) : isStaff ? (
                                        <Briefcase className="w-4 h-4 text-amber-400" />
                                      ) : (
                                        <UserCheck className="w-4 h-4 text-amber-400" />
                                      )}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-white truncate">
                                      {face.studentName || face.parentName || (isBlurred ? t.faceProtected : t.faceIdentifiedPerson)}
                                    </div>
                                    <div className="text-[10px] font-semibold flex items-center gap-1 mt-0.5">
                                      {isStudent ? (
                                        <span className="text-emerald-400 flex items-center gap-1 truncate">
                                          <GraduationCap className="w-3 h-3 shrink-0" />
                                          <span>{face.environmentName || t.faceIdentifiedStudent}</span>
                                        </span>
                                      ) : isParent ? (
                                        <span className="text-sky-400 flex items-center gap-1 truncate">
                                          <Users className="w-3 h-3 shrink-0" />
                                          <span>{face.childrenSummary || t.faceIdentifiedParent}</span>
                                        </span>
                                      ) : isStaff ? (
                                        <span className="text-amber-400 flex items-center gap-1 truncate">
                                          <Briefcase className="w-3 h-3 shrink-0" />
                                          <span>{t.faceIdentifiedStaff}</span>
                                        </span>
                                      ) : isBlurred ? (
                                        <span className="text-rose-400 flex items-center gap-1 truncate">
                                          <Shield className="w-3 h-3 shrink-0" />
                                          <span>{t.faceProtected}</span>
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">{t.faceIdentifiedPerson}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image Description / Caption in Lightbox (when enlarged) */}
          {images[lightboxIndex].description && (
            <div className="absolute bottom-16 inset-x-4 z-40 pointer-events-none flex justify-center">
              <div className="max-w-2xl px-4 py-2.5 rounded-xl bg-black/80 backdrop-blur-lg border border-white/20 text-center text-xs text-slate-200 shadow-2xl animate-in fade-in">
                <p className="leading-relaxed font-normal">{images[lightboxIndex].description}</p>
              </div>
            </div>
          )}

          {/* Bottom Protected Badge, Slide Caption, Nexus Credit & Zoom Helper */}
          <div className="absolute bottom-4 z-40 pointer-events-none flex flex-wrap items-center justify-center gap-2 px-4">
            <div className="bg-black/80 backdrop-blur-md text-slate-300 text-[10px] px-3 py-1 rounded-full border border-white/20 shadow-xl flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{t.protectedContent}</span>
            </div>

            <a
              href="https://montessorinexus.com"
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto bg-black/80 hover:bg-black/95 backdrop-blur-md text-slate-300 hover:text-white text-[10px] px-2.5 py-1 rounded-full border border-white/20 hover:border-amber-400/40 shadow-xl flex items-center gap-1.5 font-medium transition-all"
            >
              <span className="text-slate-400 text-[9px]">Powered by</span>
              <MontessoriNexusLogo size={13} />
              <span className="font-serif font-bold text-amber-300 text-[10px]">MontessoriNexus</span>
            </a>

            {/* In Slideshow mode, show identified people in photo as a subtitle pill */}
            {isSlideshowActive && (images[lightboxIndex].detected_faces || []).length > 0 && (
              <div className="bg-slate-950/80 backdrop-blur-md text-amber-300 text-[11px] px-3.5 py-1 rounded-full border border-amber-400/30 shadow-xl flex items-center gap-1.5 animate-in fade-in">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-white font-bold">
                  {(images[lightboxIndex].detected_faces || [])
                    .filter((f) => f.isIdentified && (f.studentName || f.parentName))
                    .map((f) => f.studentName || f.parentName)
                    .slice(0, 3)
                    .join(", ")}
                  {(images[lightboxIndex].detected_faces || []).filter((f) => f.isIdentified).length > 3 && "..."}
                </span>
              </div>
            )}

            {zoomScale > 1 && (
              <div className="bg-black/80 backdrop-blur-md text-amber-300 text-[10px] px-3 py-1 rounded-full border border-white/20 shadow-xl flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>{t.wheelZoomHelp}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedGalleryPage;
