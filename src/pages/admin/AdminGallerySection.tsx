import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Images,
  Plus,
  Trash2,
  Edit3,
  FolderPlus,
  Image as ImageIcon,
  Tag,
  Filter,
  Search,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Wand2,
  Loader2,
  Languages,
  CheckCircle2,
  Folder,
  Layers,
  Bot,
  Globe,
  Users,
  AlertTriangle,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  UserPlus,
  Share2,
  School,
  HeartHandshake,
  Star,
  FolderOpen,
  Film,
  Video,
  Play,
  UploadCloud,
  FileVideo,
  Check,
  Link2
} from "lucide-react";
import { MobileMenuButton } from "./AdminDashboard";
import { useAuth } from "@/context/AuthContext";
import {
  getGalleries,
  getGallery,
  createGallery,
  updateGallery,
  shareGallery,
  deleteGallery,
  getGalleryCategories,
  getGalleryImages,
  createGalleryCategory,
  updateGalleryCategory,
  deleteGalleryCategory,
  createGalleryImage,
  createGalleryImagesBatch,
  updateGalleryImage,
  updateGalleryImageFaces,
  deleteGalleryImage,
  retryGalleryImageAi,
  retryAllFailedGalleryAi,
  verifyGalleryImageConsent,
  scanAllGalleryConsents,
  Gallery,
  GalleryCategory,
  GalleryImageItem,
  DetectedFaceItem,
  getStudents,
  StudentItem,
  getEnvironments,
  EnvironmentItem,
  getTutors,
  TutorUserItem,
  getCurrentSchool,
  type School
} from "@/lib/sqlite";
import { getSchoolGalleryUrl } from "@/lib/urls";
import { toast } from "sonner";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { uploadPhysicalFile, deletePhysicalFile, generateGalleryMetadata } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { ImageUploadDropzone } from "@/components/ui/ImageUploadDropzone";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useSiteSettings } from "@/context/SettingsContext";
import { getLanguageByCode } from "./web-builder/languages";

// Dynamic Face Crop Avatar: Renders the precise facial tile extracted directly from the photo
const FaceCropAvatar: React.FC<{
  imageSrc: string;
  box?: DetectedFaceItem["box"];
  avatarUrl?: string | null;
  fallbackText?: string;
  className?: string;
}> = ({ imageSrc, box, avatarUrl, fallbackText = "?", className = "" }) => {
  if (box && typeof box.wPercent === "number" && typeof box.hPercent === "number" && box.wPercent > 0 && box.hPercent > 0) {
    const pad = 6;
    const w = Math.min(100, Math.max(1, box.wPercent + pad * 2));
    const h = Math.min(100, Math.max(1, box.hPercent + pad * 2));
    const x = Math.max(0, box.xPercent - pad);
    const y = Math.max(0, box.yPercent - pad);

    const widthPercent = (100 / w) * 100;
    const heightPercent = (100 / h) * 100;
    const leftPercent = -(x / w) * 100;
    const topPercent = -(y / h) * 100;

    return (
      <div className={`relative overflow-hidden bg-slate-900 select-none ${className}`}>
        <img
          src={imageSrc}
          alt=""
          className="absolute pointer-events-none max-w-none max-h-none object-cover transition-transform duration-300"
          style={{
            width: `${widthPercent}%`,
            height: `${heightPercent}%`,
            left: `${leftPercent}%`,
            top: `${topPercent}%`
          }}
        />
      </div>
    );
  }

  if (avatarUrl) {
    return (
      <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-200 text-slate-600 flex items-center justify-center font-bold ${className}`}>
      {fallbackText && fallbackText !== "?" ? (
        <span className="text-[10px] uppercase">{fallbackText}</span>
      ) : (
        <Users className="w-1/2 h-1/2 text-slate-400" />
      )}
    </div>
  );
};

// Video detector helper
const isVideoUrl = (url?: string | null) => {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|avi|mkv)($|\?)/i.test(url) || url.startsWith("data:video");
};

// Helper to format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Helper function to compress high-res image files
const compressImageFile = (file: File, maxWidth = 1200, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

interface BatchFileItem {
  id: string;
  file: File;
  preview: string;
  isVideo: boolean;
  title: string;
  size: number;
}

export const AdminGallerySection: React.FC = () => {
  const { role, activeMembership } = useAuth();
  const { settings } = useSiteSettings();
  const isOwnerOrSuperAdmin = role === "OWNER" || role === "SUPERADMIN" || activeMembership?.role === "OWNER";
  const isOwnerOrAdmin = isOwnerOrSuperAdmin || role === "ADMIN" || activeMembership?.role === "ADMIN";
  const isGuideOrTeacher = role === "TEACHER" || role === "GUIDE" || activeMembership?.role === "TEACHER" || activeMembership?.role === "GUIDE";
  const canManageGallery = isOwnerOrAdmin || isGuideOrTeacher;

  // Configured languages from Web Builder
  const activeLangs = useMemo(() => {
    const raw = settings?.header_enabled_langs || "es,en";
    const codes = raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    if (codes.length === 0) codes.push("es", "en");
    if (!codes.includes("es")) codes.unshift("es");
    return codes.map(getLanguageByCode);
  }, [settings?.header_enabled_langs]);

  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [activeGalleryId, setActiveGalleryId] = useState<string>("all");
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [images, setImages] = useState<GalleryImageItem[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [schoolStudents, setSchoolStudents] = useState<StudentItem[]>([]);
  const [schoolEnvironments, setSchoolEnvironments] = useState<EnvironmentItem[]>([]);
  const [schoolTutors, setSchoolTutors] = useState<TutorUserItem[]>([]);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);

  // Modals
  const [previewImage, setPreviewImage] = useState<GalleryImageItem | null>(null);
  const [previewConsentMode, setPreviewConsentMode] = useState<"original" | "blurred">("original");
  const [cardConsentMode, setCardConsentMode] = useState<Record<string, "original" | "blurred">>({});
  const [hoveredFaceIndex, setHoveredFaceIndex] = useState<number | null>(null);
  const [hoveredCardFace, setHoveredCardFace] = useState<Record<string, number | null>>({});

  // Gallery (Album) Modal State
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [galleryName, setGalleryName] = useState("");
  const [galleryDescription, setGalleryDescription] = useState("");

  // Share Gallery Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingGallery, setSharingGallery] = useState<Gallery | null>(null);
  const [shareScope, setShareScope] = useState<"PRIVATE" | "ALL_SCHOOL" | "ENVIRONMENTS" | "SPECIFIC_PARENTS">("ALL_SCHOOL");
  const [sharedEnvIds, setSharedEnvIds] = useState<string[]>([]);
  const [sharedParentIds, setSharedParentIds] = useState<string[]>([]);

  // Image Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>("");
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [translations, setTranslations] = useState<Record<string, { title: string; description: string }>>({});
  const [srcUrl, setSrcUrl] = useState("");
  const [srcFile, setSrcFile] = useState<File | null>(null);
  const [langTab, setLangTab] = useState<string>("es");
  const [isAiAutoGenerate, setIsAiAutoGenerate] = useState<boolean>(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiGeneratedBadge, setAiGeneratedBadge] = useState<boolean>(false);

  // Batch Multi-Upload State for Internal Albums
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; percentage: number }>({
    current: 0,
    total: 0,
    percentage: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<GalleryCategory | null>(null);
  const [catIdInput, setCatIdInput] = useState("");
  const [catTranslations, setCatTranslations] = useState<Record<string, string>>({});
  const [catLangTab, setCatLangTab] = useState<string>("es");

  // Delete Confirm Dialog State
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    type: "image" | "category" | "gallery";
    id: string;
    title: string;
  }>({ isOpen: false, type: "image", id: "", title: "" });

  const [isRetryingAll, setIsRetryingAll] = useState(false);
  const [retryingImageId, setRetryingImageId] = useState<string | null>(null);
  const [isScanningConsents, setIsScanningConsents] = useState(false);
  const [scanningImageId, setScanningImageId] = useState<string | null>(null);
  const [shakingImageIds, setShakingImageIds] = useState<Set<string>>(new Set());
  const previousScanStateRef = useRef<Map<string, { isScanning: boolean; hasConsentIssues: boolean }>>(new Map());

  const [editingFaceIndex, setEditingFaceIndex] = useState<number | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedStudentForFace, setSelectedStudentForFace] = useState<StudentItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSavingInlineFace, setIsSavingInlineFace] = useState(false);

  // Interactive Box Drawing by Dragging State
  const [isDrawingBox, setIsDrawingBox] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  // Zoom & Pan for Lightbox Image State
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  // Helper getters/setters for multilingual fields
  const getTitleForLang = (code: string) => {
    if (translations[code]?.title) return translations[code].title;
    if (code === "es") return title;
    if (code === "en") return titleEn;
    return "";
  };

  const getDescriptionForLang = (code: string) => {
    if (translations[code]?.description) return translations[code].description;
    if (code === "es") return description;
    if (code === "en") return descriptionEn;
    return "";
  };

  const setFieldForLang = (code: string, field: "title" | "description", value: string) => {
    setTranslations(prev => {
      const current = prev[code] || {
        title: code === "es" ? title : (code === "en" ? titleEn : ""),
        description: code === "es" ? description : (code === "en" ? descriptionEn : "")
      };
      return {
        ...prev,
        [code]: {
          ...current,
          [field]: value
        }
      };
    });

    if (code === "es") {
      if (field === "title") setTitle(value);
      if (field === "description") setDescription(value);
    } else if (code === "en") {
      if (field === "title") setTitleEn(value);
      if (field === "description") setDescriptionEn(value);
    }
  };

  const getCatLabelForLang = (code: string) => {
    if (catTranslations[code]) return catTranslations[code];
    if (code === "es") return editingCat?.label || "";
    if (code === "en") return editingCat?.label_en || "";
    return "";
  };

  const setCatLabelForLang = (code: string, value: string) => {
    setCatTranslations(prev => ({
      ...prev,
      [code]: value
    }));
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [gals, cats, imgs] = await Promise.all([
        getGalleries(),
        getGalleryCategories(),
        getGalleryImages(activeCat, undefined, activeGalleryId)
      ]);
      setGalleries(gals);
      setCategories(cats);
      setImages(imgs);
    } catch (e) {
      console.error("Error loading gallery data", e);
      if (!silent) toast.error("Error al cargar datos de galería");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    getCurrentSchool().then(res => setCurrentSchool(res)).catch(() => {});
    getStudents().then(res => setSchoolStudents(res || [])).catch(() => {});
    getEnvironments().then(res => setSchoolEnvironments(res || [])).catch(() => {});
    getTutors().then(res => setSchoolTutors(res || [])).catch(() => {});
  }, [activeCat, activeGalleryId]);

  // Realtime Polling for images currently processing FaceMatch, consents or AI metadata
  useEffect(() => {
    const hasPending = images.some(i => i.ai_status === "PENDING" || i.consent_status === "processing" || scanningImageId === i.id);
    if (!hasPending && !isScanningConsents && !isRetryingAll) return;

    const interval = setInterval(() => {
      loadData(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [images, activeCat, activeGalleryId, scanningImageId, isScanningConsents, isRetryingAll]);

  // Trigger shake effect when an image finishes scanning and qualifies for blurring (has consent issues)
  useEffect(() => {
    const prevMap = previousScanStateRef.current;
    const newMap = new Map<string, { isScanning: boolean; hasConsentIssues: boolean }>();
    const newlyBlurredIds: string[] = [];

    images.forEach(img => {
      const isScanning = !isVideoUrl(img.src) && (
        scanningImageId === img.id ||
        img.consent_status === "processing" ||
        (isScanningConsents && (!img.consent_status || img.consent_status === "unchecked"))
      );
      const hasConsentIssues = Boolean(img.has_consent_issues || img.consent_status === "has_violations");

      const prev = prevMap.get(img.id);
      if (prev) {
        // If it was scanning, and now finished scanning AND has consent issues (qualifies for blurring)
        if (prev.isScanning && !isScanning && hasConsentIssues) {
          newlyBlurredIds.push(img.id);
        }
      }

      newMap.set(img.id, { isScanning, hasConsentIssues });
    });

    previousScanStateRef.current = newMap;

    if (newlyBlurredIds.length > 0) {
      setShakingImageIds(prev => {
        const next = new Set(prev);
        newlyBlurredIds.forEach(id => next.add(id));
        return next;
      });

      const timer = setTimeout(() => {
        setShakingImageIds(prev => {
          const next = new Set(prev);
          newlyBlurredIds.forEach(id => next.delete(id));
          return next;
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [images, scanningImageId, isScanningConsents]);

  const detectedStudentsMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatarUrl?: string | null; environmentName?: string | null; count: number }>();
    images.forEach(img => {
      if (Array.isArray(img.detected_faces)) {
        img.detected_faces.forEach(face => {
          if (face.isIdentified && face.studentId && face.studentName) {
            const existing = map.get(face.studentId);
            if (existing) {
              existing.count += 1;
              if (!existing.avatarUrl && face.avatarUrl) existing.avatarUrl = face.avatarUrl;
              if (!existing.environmentName && face.environmentName) existing.environmentName = face.environmentName;
            } else {
              map.set(face.studentId, {
                id: face.studentId,
                name: face.studentName,
                avatarUrl: face.avatarUrl,
                environmentName: face.environmentName,
                count: 1
              });
            }
          }
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [images]);

  const countUnidentifiedPhotos = useMemo(() => {
    return images.filter(img => img.detected_faces?.some(f => !f.isIdentified)).length;
  }, [images]);

  const consentViolationImages = useMemo(() => {
    return images.filter(img => img.has_consent_issues || img.detected_faces?.some(f => !f.hasConsent));
  }, [images]);

  const failedImages = useMemo(() => {
    return images.filter(img => img.ai_status === "FAILED");
  }, [images]);

  const filteredImages = useMemo(() => {
    let result = images;
    if (activeGalleryId !== "all") {
      result = result.filter(img => img.gallery_id === activeGalleryId);
    }
    if (activeCat !== "all") {
      result = result.filter(img => img.category_id === activeCat);
    }
    if (selectedStudentFilter !== "all") {
      if (selectedStudentFilter === "unidentified") {
        result = result.filter(img => img.detected_faces?.some(f => !f.isIdentified));
      } else {
        result = result.filter(img => img.detected_faces?.some(f => f.studentId === selectedStudentFilter));
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(img =>
        img.title.toLowerCase().includes(q) ||
        (img.title_en && img.title_en.toLowerCase().includes(q)) ||
        img.description.toLowerCase().includes(q) ||
        (img.description_en && img.description_en.toLowerCase().includes(q)) ||
        img.detected_faces?.some(f => f.studentName?.toLowerCase().includes(q))
      );
    }
    return result;
  }, [images, activeGalleryId, activeCat, selectedStudentFilter, searchQuery]);

  const handleOpenGalleryModal = (gal?: Gallery) => {
    if (!canManageGallery) return;
    if (gal) {
      setEditingGallery(gal);
      setGalleryName(gal.name);
      setGalleryDescription(gal.description || "");
    } else {
      setEditingGallery(null);
      setGalleryName("");
      setGalleryDescription("");
    }
    setIsGalleryModalOpen(true);
  };

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageGallery) return;
    if (!galleryName.trim()) {
      toast.error("Ingresa el nombre de la galería.");
      return;
    }

    try {
      if (editingGallery) {
        await updateGallery(editingGallery.id, {
          name: galleryName.trim(),
          description: galleryDescription.trim(),
        });
        toast.success("Galería actualizada.");
      } else {
        const newGal = await createGallery({
          name: galleryName.trim(),
          description: galleryDescription.trim(),
          show_on_web: false,
          share_scope: "ALL_SCHOOL"
        });
        toast.success("Nueva galería creada.");
        setActiveGalleryId(newGal.id);
      }
      setIsGalleryModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la galería");
    }
  };

  const promptDeleteGallery = (gal: Gallery) => {
    if (!canManageGallery) return;
    if (gal.is_default) {
      toast.error("La Galería Web oficial es permanente y no puede eliminarse.");
      return;
    }
    setConfirmDelete({
      isOpen: true,
      type: "gallery",
      id: gal.id,
      title: gal.name
    });
  };

  const handleOpenShareModal = (gal: Gallery) => {
    if (!canManageGallery) return;
    setSharingGallery(gal);
    setShareScope(gal.share_scope || "ALL_SCHOOL");
    setSharedEnvIds(gal.shared_environment_ids || []);
    setSharedParentIds(gal.shared_parent_ids || []);
    setIsShareModalOpen(true);
  };

  const handleSaveShare = async () => {
    if (!sharingGallery || !canManageGallery) return;
    try {
      await shareGallery(sharingGallery.id, {
        share_scope: shareScope,
        shared_environment_ids: sharedEnvIds,
        shared_parent_ids: sharedParentIds
      });
      toast.success("Configuración de difusión actualizada.");
      setIsShareModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar difusión");
    }
  };

  const handleOpenCatModal = (cat?: GalleryCategory) => {
    if (!canManageGallery) return;
    if (cat) {
      setEditingCat(cat);
      setCatIdInput(cat.id);
      const initial: Record<string, string> = {
        es: cat.label,
        en: cat.label_en || "",
        ...(cat.translations || {})
      };
      setCatTranslations(initial);
    } else {
      setEditingCat(null);
      setCatIdInput("");
      setCatTranslations({});
    }
    setCatLangTab(activeLangs[0]?.code || "es");
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageGallery) return;

    const firstNonEmpty = Object.values(catTranslations).find(v => typeof v === "string" && v.trim().length > 0) || "";
    const primaryLabel = (getCatLabelForLang("es") || getCatLabelForLang(activeLangs[0]?.code || "es") || firstNonEmpty || "").trim();

    if (!primaryLabel) {
      toast.error("Ingresa al menos el nombre de la categoría en un idioma.");
      return;
    }

    const finalTranslations: Record<string, string> = { ...catTranslations };
    activeLangs.forEach(l => {
      const val = getCatLabelForLang(l.code);
      if (val) finalTranslations[l.code] = val;
    });

    try {
      if (editingCat) {
        await updateGalleryCategory(editingCat.id, {
          label: finalTranslations.es || primaryLabel,
          label_en: finalTranslations.en || primaryLabel,
          translations: finalTranslations
        });
        toast.success("Categoría actualizada.");
      } else {
        await createGalleryCategory({
          id: catIdInput.trim() || undefined,
          label: finalTranslations.es || primaryLabel,
          label_en: finalTranslations.en || primaryLabel,
          translations: finalTranslations
        });
        toast.success("Categoría creada.");
      }
      setIsCatModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la categoría");
    }
  };

  const handleGenerateMetadata = async (targetUrl?: string) => {
    const urlToUse = targetUrl || srcUrl;
    if (!urlToUse && !selectedCatId) {
      toast.error("Selecciona una categoría o sube una imagen primero.");
      return;
    }

    setIsGeneratingAi(true);
    const catObj = categories.find(c => c.id === selectedCatId);
    try {
      const res = await generateGalleryMetadata({
        imageUrl: urlToUse || undefined,
        categoryId: selectedCatId,
        categoryLabel: catObj?.label,
        existingTitle: getTitleForLang(langTab) || undefined,
        languages: activeLangs.map(l => l.code),
      });

      if (res.translations && Object.keys(res.translations).length > 0) {
        setTranslations(res.translations);
        if (res.translations.es?.title) setTitle(res.translations.es.title);
        if (res.translations.es?.description) setDescription(res.translations.es.description);
        if (res.translations.en?.title) setTitleEn(res.translations.en.title);
        if (res.translations.en?.description) setDescriptionEn(res.translations.en.description);
      } else {
        if (res.title) setTitle(res.title);
        if (res.titleEn) setTitleEn(res.titleEn);
        if (res.description) setDescription(res.description);
        if (res.descriptionEn) setDescriptionEn(res.descriptionEn);
      }
      setAiGeneratedBadge(true);
      toast.success("Metadatos multilingües generados con IA");
    } catch (err: any) {
      toast.error(err.message || "No se pudo generar con IA.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleOpenImageModal = () => {
    if (!canManageGallery) return;

    setAiGeneratedBadge(false);
    setBatchFiles([]);
    setIsUploadingBatch(false);
    setEditingImage(null);

    const defaultGalId = (activeGalleryId !== "all" && activeGalleryId)
      ? activeGalleryId
      : (galleries.find(g => g.is_default)?.id || (galleries.length > 0 ? galleries[0].id : ""));
    setSelectedGalleryId(defaultGalId);

    const isTargetWeb = Boolean(galleries.find(g => g.id === defaultGalId)?.is_default);
    const defaultCategory = isTargetWeb
      ? ((activeCat !== "all" && activeCat) ? activeCat : (categories.length > 0 ? categories[0].id : "practical"))
      : (categories.find(c => c.id === "other" || c.id === "outdoor")?.id || categories[0]?.id || "other");

    setSelectedCatId(defaultCategory);
    setTitle("");
    setTitleEn("");
    setDescription("");
    setDescriptionEn("");
    setTranslations({});
    setSrcUrl("");
    setSrcFile(null);
    setIsAiAutoGenerate(isTargetWeb);
    setLangTab(activeLangs[0]?.code || "es");
    setIsImageModalOpen(true);
  };

  // Handle Multi-file selection for Internal Albums
  const handleBatchFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFiles = Array.from(e.target.files);

    const newItems: BatchFileItem[] = selectedFiles.map((file) => {
      const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
      const previewUrl = URL.createObjectURL(file);
      const rawName = file.name.replace(/\.[^/.]+$/, "");
      return {
        id: "batch-" + Math.random().toString(36).slice(2, 9),
        file,
        preview: previewUrl,
        isVideo,
        title: rawName,
        size: file.size
      };
    });

    setBatchFiles((prev) => [...prev, ...newItems]);
    // Reset file input value so user can re-select if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveBatchFile = (id: string) => {
    setBatchFiles((prev) => {
      const item = prev.find(i => i.id === id);
      if (item && item.preview.startsWith("blob:")) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageGallery) return;

    const targetGalObj = galleries.find(g => g.id === selectedGalleryId);
    const isTargetDefaultWebGal = targetGalObj ? targetGalObj.is_default : (selectedGalleryId === (galleries.find(g => g.is_default)?.id || ""));
    const effectiveShowOnWeb = Boolean(isTargetDefaultWebGal);

    // BATCH MULTI-UPLOAD FOR INTERNAL ALBUMS
    if (!isTargetDefaultWebGal && batchFiles.length > 0) {
      setIsUploadingBatch(true);
      const total = batchFiles.length;
      setUploadProgress({ current: 0, total, percentage: 0 });

      try {
        const uploadedItems = [];
        for (let i = 0; i < total; i++) {
          const item = batchFiles[i];
          setUploadProgress({
            current: i + 1,
            total,
            percentage: Math.round(((i + 1) / total) * 100)
          });

          const uploadRes = await uploadPhysicalFile(
            item.file,
            "gallery",
            item.title || title.trim() || "Fotografia"
          );

          uploadedItems.push({
            gallery_id: selectedGalleryId,
            category_id: "other",
            src: uploadRes.url,
            title: item.title || item.file.name.replace(/\.[^/.]+$/, "") || "Archivo",
            description: "",
            show_on_web: false,
            show_on_portal: true
          });
        }

        // Save batch to database in one call
        await createGalleryImagesBatch(uploadedItems, selectedGalleryId);
        toast.success(`Se subieron ${uploadedItems.length} archivo(s) correctamente al álbum.`);
        setIsImageModalOpen(false);
        setBatchFiles([]);
        await loadData(true);
      } catch (err: any) {
        console.error("Batch upload error:", err);
        toast.error(err.message || "Error al subir los archivos en lote");
      } finally {
        setIsUploadingBatch(false);
      }
      return;
    }

    // SINGLE IMAGE UPLOAD / EDIT
    const safeCatId = isTargetDefaultWebGal
      ? (selectedCatId || categories[0]?.id || "practical")
      : (categories.find(c => c.id === "other" || c.id === "outdoor")?.id || categories[0]?.id || "other");

    const primaryTitle = isTargetDefaultWebGal
      ? (getTitleForLang("es") || getTitleForLang(activeLangs[0]?.code || "es") || title.trim())
      : (title.trim() || (srcFile ? srcFile.name.replace(/\.[^/.]+$/, "") : "Fotografía"));

    if (isTargetDefaultWebGal && !isAiAutoGenerate && !primaryTitle) {
      toast.error("Ingresa al menos el título de la fotografía.");
      return;
    }

    let finalSrc = srcUrl.trim();
    if (srcFile) {
      try {
        const uploadRes = await uploadPhysicalFile(srcFile, "gallery", primaryTitle || "Fotografia");
        finalSrc = uploadRes.url;
      } catch (err) {
        console.warn("Physical file upload failed, falling back to base64 data URI", err);
        if (!finalSrc || finalSrc.startsWith("blob:")) {
          finalSrc = await compressImageFile(srcFile);
        }
      }
    }

    if (!finalSrc) {
      toast.error("Selecciona al menos un archivo de imagen/video o escribe la URL.");
      return;
    }

    const finalTranslations: Record<string, { title: string; description: string }> = isTargetDefaultWebGal
      ? { ...translations }
      : { es: { title: primaryTitle, description: description.trim() }, en: { title: primaryTitle, description: description.trim() } };

    if (isTargetDefaultWebGal && !isAiAutoGenerate) {
      activeLangs.forEach(lang => {
        const tVal = getTitleForLang(lang.code);
        const dVal = getDescriptionForLang(lang.code);
        if (tVal || dVal) {
          finalTranslations[lang.code] = {
            title: tVal || primaryTitle,
            description: dVal || ""
          };
        }
      });
    }

    try {
      await createGalleryImage({
        gallery_id: selectedGalleryId || undefined,
        category_id: safeCatId,
        src: finalSrc,
        title: (isTargetDefaultWebGal && isAiAutoGenerate) ? "Procesando con IA..." : (finalTranslations.es?.title || primaryTitle),
        title_en: (isTargetDefaultWebGal && isAiAutoGenerate) ? "Processing with AI..." : (finalTranslations.en?.title || primaryTitle),
        description: (isTargetDefaultWebGal && isAiAutoGenerate) ? "" : (finalTranslations.es?.description || description.trim()),
        description_en: (isTargetDefaultWebGal && isAiAutoGenerate) ? "" : (finalTranslations.en?.description || descriptionEn.trim()),
        translations: (isTargetDefaultWebGal && isAiAutoGenerate) ? {} : finalTranslations,
        aiAutoGenerate: isTargetDefaultWebGal && isAiAutoGenerate,
        ai_status: (isTargetDefaultWebGal && isAiAutoGenerate) ? "PENDING" : "COMPLETED",
        show_on_web: effectiveShowOnWeb,
        show_on_portal: true,
      });

      if (isTargetDefaultWebGal && isAiAutoGenerate) {
        toast.success("Fotografía subida. Generando metadatos pedagógicos con IA en segundo plano...");
      } else {
        toast.success("Fotografía agregada al álbum.");
      }

      await loadData(true);
      if (activeCat !== "all" && activeCat !== safeCatId && isTargetDefaultWebGal) {
        setActiveCat(safeCatId);
      }
      setIsImageModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar fotografía");
    }
  };

  const handleExecuteDelete = async () => {
    try {
      if (confirmDelete.type === "image") {
        await deleteGalleryImage(confirmDelete.id);
        toast.success("Archivo eliminado.");
      } else if (confirmDelete.type === "category") {
        await deleteGalleryCategory(confirmDelete.id);
        toast.success("Categoría eliminada.");
        if (activeCat === confirmDelete.id) setActiveCat("all");
      } else if (confirmDelete.type === "gallery") {
        await deleteGallery(confirmDelete.id);
        toast.success("Galería eliminada.");
        if (activeGalleryId === confirmDelete.id) setActiveGalleryId("all");
      }
      await loadData(true);
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar");
    } finally {
      setConfirmDelete({ isOpen: false, type: "image", id: "", title: "" });
    }
  };

  const handleScanAllConsents = async () => {
    setIsScanningConsents(true);
    try {
      const res = await scanAllGalleryConsents();
      toast.success(`Escaneo completado para ${res.total} fotografía(s)`);
      await loadData(true);
    } catch (e: any) {
      toast.error(e.message || "Error al escanear consentimientos");
    } finally {
      setIsScanningConsents(false);
    }
  };

  const handleScanSingleConsent = async (imgId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setScanningImageId(imgId);
    try {
      const res = await verifyGalleryImageConsent(imgId);
      toast.success("Consentimiento verificado.");
      await loadData(true);
      if (res?.hasViolations || res?.consent_status === "has_violations" || res?.image?.has_consent_issues) {
        setShakingImageIds(prev => new Set(prev).add(imgId));
        setTimeout(() => {
          setShakingImageIds(prev => {
            const next = new Set(prev);
            next.delete(imgId);
            return next;
          });
        }, 1500);
      }
    } catch (e: any) {
      toast.error(e.message || "Error al verificar consentimiento");
    } finally {
      setScanningImageId(null);
    }
  };

  const handleRetryAllFailed = async () => {
    setIsRetryingAll(true);
    try {
      const res = await retryAllFailedGalleryAi();
      toast.success(`Reintentando generación con IA para ${res.count} fotografía(s)`);
      await loadData(true);
    } catch (e: any) {
      toast.error(e.message || "Error al reintentar");
    } finally {
      setIsRetryingAll(false);
    }
  };

  const handleRetrySingle = async (imgId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRetryingImageId(imgId);
    try {
      await retryGalleryImageAi(imgId);
      toast.success("Reintentando generación con IA...");
      await loadData(true);
    } catch (err: any) {
      toast.error(err.message || "Error al reintentar");
    } finally {
      setRetryingImageId(null);
    }
  };

  const checkStudentConsentLocal = (student: StudentItem): boolean => {
    if (!student.consents) return false;
    let list: any[] = [];
    if (Array.isArray(student.consents)) list = student.consents;
    else if (typeof student.consents === "string") {
      try { list = JSON.parse(student.consents); } catch { list = []; }
    }
    const mediaConsent = list.find((c: any) =>
      c.templateId === "consent_media_socials" ||
      (c.templateId && (c.templateId.includes("media") || c.templateId.includes("imagen") || c.templateId.includes("foto")))
    );
    return mediaConsent ? Boolean(mediaConsent.granted) : false;
  };

  const getStudentName = (s: any): string => {
    if (!s) return "";
    if (typeof s === "string") return s.trim();
    if (s.full_name && typeof s.full_name === "string" && s.full_name.trim()) return s.full_name.trim();
    if (s.fullName && typeof s.fullName === "string" && s.fullName.trim()) return s.fullName.trim();
    if (s.name && typeof s.name === "string" && s.name.trim()) return s.name.trim();
    const first = s.first_name || s.firstName || "";
    const last = s.last_name || s.lastName || "";
    const parts = [first, last].filter(Boolean).map(p => String(p).trim());
    const joined = parts.join(" ").trim();
    if (joined) return joined;
    if (s.enrollment_code || s.enrollmentCode) return `Estudiante (${s.enrollment_code || s.enrollmentCode})`;
    return s.id ? `Estudiante #${String(s.id).slice(-4)}` : "";
  };

  const getStudentAvatar = (s: any): string | null => {
    if (!s) return null;
    return s.avatar_url || s.avatarUrl || null;
  };

  const handleStartEditFace = (index: number) => {
    if (!previewImage || !previewImage.detected_faces || !canManageGallery) return;
    const targetFace = previewImage.detected_faces[index];
    setEditingFaceIndex(index);
    if (targetFace && targetFace.isIdentified && targetFace.studentId) {
      const match = schoolStudents.find(s => s.id === targetFace.studentId);
      setSelectedStudentForFace(match || null);
      setStudentSearchQuery(targetFace.studentName || getStudentName(match) || "");
    } else {
      setSelectedStudentForFace(null);
      setStudentSearchQuery("");
    }
    setIsDropdownOpen(false);
  };

  const handleCancelInlineEdit = () => {
    setEditingFaceIndex(null);
    setStudentSearchQuery("");
    setSelectedStudentForFace(null);
    setIsDropdownOpen(false);
  };

  const handleAdjustBoxSize = (deltaPercent: number) => {
    if (!previewImage || editingFaceIndex === null || !previewImage.detected_faces) return;
    const faces = [...previewImage.detected_faces];
    const current = faces[editingFaceIndex];
    if (!current) return;
    const oldW = current.box.wPercent || 12;
    const oldH = current.box.hPercent || 12;
    const newW = Math.max(3, Math.min(65, Number((oldW + deltaPercent).toFixed(1))));
    const newH = Math.max(3, Math.min(65, Number((oldH + deltaPercent).toFixed(1))));
    const diffW = (newW - oldW) / 2;
    const diffH = (newH - oldH) / 2;
    const newX = Math.max(0, Math.min(100 - newW, Number(((current.box.xPercent || 0) - diffW).toFixed(2))));
    const newY = Math.max(0, Math.min(100 - newH, Number(((current.box.yPercent || 0) - diffH).toFixed(2))));

    faces[editingFaceIndex] = {
      ...current,
      box: {
        ...current.box,
        xPercent: newX,
        yPercent: newY,
        wPercent: newW,
        hPercent: newH
      }
    };
    setPreviewImage({ ...previewImage, detected_faces: faces });
  };

  const handleAddInlineFace = () => {
    if (!previewImage || !canManageGallery) return;
    const faces = previewImage.detected_faces ? [...previewImage.detected_faces] : [];
    const newFace: DetectedFaceItem = {
      box: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        xPercent: 35 + (faces.length * 5) % 30,
        yPercent: 35 + (faces.length * 5) % 30,
        wPercent: 10,
        hPercent: 10
      },
      score: 5.0,
      isIdentified: false,
      studentId: null,
      studentName: "Persona no identificada",
      hasConsent: true
    };
    const newFaces = [...faces, newFace];
    const newIdx = newFaces.length - 1;
    setPreviewImage({ ...previewImage, detected_faces: newFaces });
    setEditingFaceIndex(newIdx);
    setSelectedStudentForFace(null);
    setStudentSearchQuery("");
    setIsDropdownOpen(true);
  };

  const handleImageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!previewImage || isVideoUrl(previewImage.src)) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoomScale(prev => {
      const next = Math.max(1, Math.min(4, Number((prev + delta).toFixed(2))));
      if (next === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsPanning(false);
    setPanStart(null);
  };

  const handleMouseDownOnImage = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canManageGallery || !previewImage || isVideoUrl(previewImage.src)) return;

    // Pan with Right Click (button 2), Middle Click (button 1), Alt Key, or Shift Key when zoomed in
    if (e.button === 2 || e.button === 1 || e.altKey || (zoomScale > 1 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
      return;
    }

    if (e.button !== 0) return; // Only left click for drawing/tagging

    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setIsDrawingBox(true);
    setDrawStart({ x, y });
    setDrawCurrent({ x, y });
  };

  const handleMouseMoveOnImage = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && panStart) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanPosition({ x: dx, y: dy });
      return;
    }

    if (!isDrawingBox || !drawStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setDrawCurrent({ x, y });
  };

  const handleMouseUpOnImage = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (!isDrawingBox || !drawStart) return;
    setIsDrawingBox(false);

    const rect = e.currentTarget.getBoundingClientRect();
    const endX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const endY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const minX = Math.min(drawStart.x, endX);
    const minY = Math.min(drawStart.y, endY);
    const width = Math.abs(endX - drawStart.x);
    const height = Math.abs(endY - drawStart.y);

    setDrawStart(null);
    setDrawCurrent(null);

    const faces = previewImage?.detected_faces ? [...previewImage.detected_faces] : [];

    // If user dragged a custom rectangle (at least 1.5% in size)
    if (width >= 1.5 && height >= 1.5) {
      const finalW = Number(Math.min(100 - minX, width).toFixed(2));
      const finalH = Number(Math.min(100 - minY, height).toFixed(2));

      // If currently editing a face, resize and reposition it to the exact dragged box!
      if (editingFaceIndex !== null && faces[editingFaceIndex]) {
        faces[editingFaceIndex] = {
          ...faces[editingFaceIndex],
          box: {
            ...faces[editingFaceIndex].box,
            xPercent: Number(minX.toFixed(2)),
            yPercent: Number(minY.toFixed(2)),
            wPercent: finalW,
            hPercent: finalH
          }
        };
        setPreviewImage(prev => prev ? { ...prev, detected_faces: faces } : null);
        return;
      }

      // Otherwise, create a new face with the exact custom drawn box!
      const newFace: DetectedFaceItem = {
        box: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          xPercent: Number(minX.toFixed(2)),
          yPercent: Number(minY.toFixed(2)),
          wPercent: finalW,
          hPercent: finalH
        },
        score: 5.0,
        isIdentified: false,
        studentId: null,
        studentName: "Persona no identificada",
        hasConsent: true
      };
      const newFaces = [...faces, newFace];
      const newIdx = newFaces.length - 1;
      setPreviewImage(prev => prev ? { ...prev, detected_faces: newFaces } : null);
      setEditingFaceIndex(newIdx);
      setSelectedStudentForFace(null);
      setStudentSearchQuery("");
      setIsDropdownOpen(false);
      return;
    }

    // If it was just a quick click without dragging:
    // Check if clicked inside any existing face box to activate it:
    for (let i = 0; i < faces.length; i++) {
      const b = faces[i].box;
      if (b && minX >= b.xPercent && minX <= (b.xPercent + b.wPercent) && minY >= b.yPercent && minY <= (b.yPercent + b.hPercent)) {
        handleStartEditFace(i);
        return;
      }
    }

    // If clicked on an empty area, place a compact 8%x8% face box:
    const boxSize = 8;
    const newX = Math.max(0, Math.min(100 - boxSize, Number((minX - boxSize / 2).toFixed(2))));
    const newY = Math.max(0, Math.min(100 - boxSize, Number((minY - boxSize / 2).toFixed(2))));

    if (editingFaceIndex !== null && faces[editingFaceIndex]) {
      faces[editingFaceIndex] = {
        ...faces[editingFaceIndex],
        box: {
          ...faces[editingFaceIndex].box,
          xPercent: newX,
          yPercent: newY
        }
      };
      setPreviewImage(prev => prev ? { ...prev, detected_faces: faces } : null);
      return;
    }

    const newFace: DetectedFaceItem = {
      box: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        xPercent: newX,
        yPercent: newY,
        wPercent: boxSize,
        hPercent: boxSize
      },
      score: 5.0,
      isIdentified: false,
      studentId: null,
      studentName: "Persona no identificada",
      hasConsent: true
    };
    const newFaces = [...faces, newFace];
    const newIdx = newFaces.length - 1;
    setPreviewImage(prev => prev ? { ...prev, detected_faces: newFaces } : null);
    setEditingFaceIndex(newIdx);
    setSelectedStudentForFace(null);
    setStudentSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleDeleteInlineFace = async (index: number) => {
    if (!previewImage || !previewImage.detected_faces || !canManageGallery) return;
    const remainingFaces = previewImage.detected_faces.filter((_, i) => i !== index);
    setIsSavingInlineFace(true);
    try {
      const res = await updateGalleryImageFaces(previewImage.id, remainingFaces);
      if (res.image) {
        setPreviewImage(res.image);
        setPreviewConsentMode(res.image.has_consent_issues ? "blurred" : "original");
      } else {
        setPreviewImage(prev => prev ? {
          ...prev,
          detected_faces: remainingFaces
        } : null);
      }
      handleCancelInlineEdit();
      toast.success("Rostro eliminado de la fotografía");
      await loadData(true);
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar rostro");
    } finally {
      setIsSavingInlineFace(false);
    }
  };

  const handleSaveInlineFace = async () => {
    if (!previewImage || !previewImage.detected_faces || editingFaceIndex === null || !canManageGallery) return;
    const faces = [...previewImage.detected_faces];
    const currentFace = faces[editingFaceIndex];
    if (!currentFace) return;

    if (selectedStudentForFace) {
      const sName = getStudentName(selectedStudentForFace);
      faces[editingFaceIndex] = {
        ...currentFace,
        isIdentified: true,
        studentId: selectedStudentForFace.id,
        studentName: sName,
        avatarUrl: getStudentAvatar(selectedStudentForFace),
        environmentName: selectedStudentForFace.environment?.name || null,
        confidence: 1.0,
        hasConsent: checkStudentConsentLocal(selectedStudentForFace)
      };
    } else {
      faces[editingFaceIndex] = {
        ...currentFace,
        isIdentified: false,
        studentId: null,
        studentName: "Persona no identificada",
        avatarUrl: null,
        environmentName: null,
        confidence: null,
        hasConsent: true
      };
    }

    setIsSavingInlineFace(true);
    try {
      const res = await updateGalleryImageFaces(previewImage.id, faces);
      if (res.image) {
        setPreviewImage(res.image);
        if (res.image.has_consent_issues) {
          setPreviewConsentMode("blurred");
        }
      } else {
        setPreviewImage(prev => prev ? {
          ...prev,
          detected_faces: faces
        } : null);
      }
      handleCancelInlineEdit();
      toast.success(selectedStudentForFace ? `Alumno "${getStudentName(selectedStudentForFace)}" mapeado correctamente.` : "Rostro marcado como no identificado.");
      await loadData(true);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el mapeo");
    } finally {
      setIsSavingInlineFace(false);
    }
  };

  const handleOpenFaceMappingModal = (img: GalleryImageItem, e?: React.MouseEvent, faceIdx?: number) => {
    if (e) e.stopPropagation();
    if (!canManageGallery) return;
    setPreviewImage(img);
    setPreviewConsentMode(img.has_consent_issues ? "blurred" : "original");
    if (faceIdx !== undefined) {
      handleStartEditFace(faceIdx);
    } else if (img.detected_faces && img.detected_faces.length > 0) {
      const unIdIdx = img.detected_faces.findIndex(f => !f.isIdentified);
      handleStartEditFace(unIdIdx >= 0 ? unIdIdx : 0);
    } else {
      handleAddInlineFace();
    }
  };

  return (
    <div className="space-y-6 font-body animate-in fade-in duration-300">
      {/* FULL-WIDTH GREEN HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
                  Galerías de Fotos y Videos
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                  {images.length} {images.length === 1 ? "archivo" : "archivos"}
                </span>
              </div>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                Administra la galería pública web y organiza álbumes internos para subir fotos y videos y difundir con salones o familias de la comunidad escolar.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 flex-wrap shrink-0">
            {canManageGallery && (
              <>
                <button
                  type="button"
                  onClick={handleScanAllConsents}
                  disabled={isScanningConsents}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-white/20 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Escanear rostros y consentimientos en toda la galería con IA"
                >
                  {isScanningConsents ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ScanFace className="w-4 h-4" />
                  )}
                  <span>{isScanningConsents ? "Escaneando..." : "Verificar Consentimientos (IA)"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenImageModal()}
                  className="px-4 py-2.5 bg-white text-forest hover:bg-white/90 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-forest" />
                  <span>Subir Fotos / Videos</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* UNIDADES DE GALERÍAS (ÁLBUMES & COLECCIONES) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-forest" />
            <h3 className="text-xs sm:text-sm font-bold font-display text-slate-800 uppercase tracking-wider">
              Galerías & Álbumes de Fotos
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest/10 text-forest font-mono">
              {galleries.length} {galleries.length === 1 ? "galería" : "galerías"}
            </span>
          </div>

          {canManageGallery && (
            <button
              type="button"
              onClick={() => handleOpenGalleryModal()}
              className="text-xs font-bold text-forest hover:text-forest-dark flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-forest/10 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Nueva Galería</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Todas las Galerías */}
          <div
            onClick={() => setActiveGalleryId("all")}
            className={`group relative p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between min-h-[125px] overflow-hidden ${
              activeGalleryId === "all"
                ? "bg-forest text-white border-forest shadow-md ring-2 ring-forest/30 scale-[1.01]"
                : "bg-white/90 hover:bg-white text-slate-800 border-forest/15 hover:border-forest/40 shadow-xs hover:shadow-sm"
            }`}
          >
            <div className="space-y-1 z-10">
              <div className="flex items-center justify-between gap-2">
                <div className={`p-2 rounded-2xl ${activeGalleryId === "all" ? "bg-white/20 text-white" : "bg-forest/10 text-forest"}`}>
                  <Images className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                  activeGalleryId === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                }`}>
                  {images.length} archivos
                </span>
              </div>
              <div className="pt-1">
                <h4 className={`text-sm font-bold font-display ${activeGalleryId === "all" ? "text-white" : "text-slate-900"}`}>
                  Todas las Galerías
                </h4>
                <p className={`text-[11px] line-clamp-1 ${activeGalleryId === "all" ? "text-white/80" : "text-slate-500"}`}>
                  Vista general de todas las fotos y videos
                </p>
              </div>
            </div>
          </div>

          {/* Cards: Colecciones y Galerías de Fotos */}
          {galleries.map((gal) => {
            const isSelected = activeGalleryId === gal.id;
            const count = gal.image_count ?? images.filter(i => i.gallery_id === gal.id).length;
            const envCount = gal.shared_environment_ids?.length || 0;
            const parentCount = gal.shared_parent_ids?.length || 0;

            return (
              <div
                key={gal.id}
                onClick={() => setActiveGalleryId(gal.id)}
                className={`group relative p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between min-h-[135px] overflow-hidden ${
                  isSelected
                    ? "bg-gradient-to-br from-forest via-forest-light to-forest text-white border-forest shadow-md ring-2 ring-forest/30 scale-[1.01]"
                    : "bg-white/90 hover:bg-white text-slate-800 border-forest/15 hover:border-forest/40 shadow-xs hover:shadow-sm"
                }`}
              >
                {gal.cover_image && (
                  <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                    <img src={gal.cover_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="space-y-1.5 z-10">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {gal.is_default ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isSelected ? "bg-amber-400 text-amber-950 font-extrabold" : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}>
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Web Oficial</span>
                        </span>
                      ) : gal.share_scope === "ALL_SCHOOL" ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isSelected ? "bg-white/20 text-white" : "bg-sky-100 text-sky-800 border border-sky-200"
                        }`}>
                          <Globe className="w-2.5 h-2.5" />
                          <span>Todo el Colegio</span>
                        </span>
                      ) : gal.share_scope === "ENVIRONMENTS" ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isSelected ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          <School className="w-2.5 h-2.5" />
                          <span>{envCount} {envCount === 1 ? "Salón" : "Salones"}</span>
                        </span>
                      ) : gal.share_scope === "SPECIFIC_PARENTS" ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isSelected ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800 border border-purple-200"
                        }`}>
                          <HeartHandshake className="w-2.5 h-2.5" />
                          <span>{parentCount} {parentCount === 1 ? "Familia" : "Familias"}</span>
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                        }`}>
                          <Lock className="w-2.5 h-2.5" />
                          <span>Solo Staff</span>
                        </span>
                      )}
                    </div>

                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}>
                      {count} {count === 1 ? "archivo" : "archivos"}
                    </span>
                  </div>

                  <div className="pt-0.5">
                    <h4 className={`text-sm font-bold font-display line-clamp-1 ${isSelected ? "text-white" : "text-slate-900"}`}>
                      {gal.name}
                    </h4>
                    <p className={`text-[11px] line-clamp-2 mt-0.5 ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                      {gal.description || (gal.is_default ? "Fotografías oficiales de la web escolar" : "Sin descripción")}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                {canManageGallery && (
                  <div className="flex items-center justify-end gap-1.5 pt-2 z-10 border-t border-black/5 dark:border-white/10 mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenShareModal(gal);
                      }}
                      className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                        isSelected ? "hover:bg-white/20 text-white" : "hover:bg-forest/10 text-forest"
                      }`}
                      title="Compartir / Difusión"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold hidden sm:inline">Difusión</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenGalleryModal(gal);
                      }}
                      className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        isSelected ? "hover:bg-white/20 text-white" : "hover:bg-slate-100 text-slate-600"
                      }`}
                      title="Editar galería"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {!gal.is_default ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          promptDeleteGallery(gal);
                        }}
                        className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          isSelected ? "hover:bg-rose-500/30 text-rose-200" : "hover:bg-rose-50 text-rose-600"
                        }`}
                        title="Eliminar galería"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`p-1.5 rounded-xl text-xs opacity-50 cursor-not-allowed ${
                              isSelected ? "text-white/60" : "text-slate-400"
                            }`}>
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 text-white text-xs font-semibold rounded-xl">
                            La Galería Web oficial es permanente y no se puede eliminar
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Button Card: Crear Nueva Galería */}
          {canManageGallery && (
            <button
              type="button"
              onClick={() => handleOpenGalleryModal()}
              className="p-4 rounded-3xl border-2 border-dashed border-forest/20 hover:border-forest/50 bg-forest/5 hover:bg-forest/10 text-forest transition-all flex flex-col items-center justify-center gap-2 min-h-[135px] cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-2xl bg-forest/10 group-hover:bg-forest group-hover:text-white text-forest flex items-center justify-center transition-all shadow-3xs">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold font-display">Crear Nueva Galería</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de Advertencia para Fotografías con Alumnos sin Consentimiento */}
      {consentViolationImages.length > 0 && canManageGallery && (
        <div className="bg-rose-500/10 border-2 border-rose-500/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-800 shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-rose-950">
                  {consentViolationImages.length === 1
                    ? "Guardrail de Privacidad: 1 fotografía con rostro de alumno sin consentimiento"
                    : `Guardrail de Privacidad: ${consentViolationImages.length} fotografías con rostros de alumnos sin consentimiento`}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white uppercase tracking-wider">
                  Auto-Difuminado en Web
                </span>
              </div>
              <p className="text-xs text-rose-900/80 mt-1 leading-relaxed max-w-3xl">
                La IA detectó alumnos cuyos padres o tutores no otorgaron consentimiento de imagen. El sistema generó automáticamente una copia con el rostro difuminado para la web pública. En el panel admin puedes inspeccionar los rostros detectados y comparar ambas versiones.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleScanAllConsents}
            disabled={isScanningConsents}
            className="px-4 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            title="Re-escanear consentimientos en toda la galería"
          >
            {isScanningConsents ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Escaneando...</span>
              </>
            ) : (
              <>
                <ScanFace className="w-4 h-4" />
                <span>Re-escanear ({consentViolationImages.length})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Banner de Advertencia para Imágenes con Fallo en Generación IA */}
      {failedImages.length > 0 && canManageGallery && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                {failedImages.length === 1
                  ? "1 fotografía no pudo generar metadatos con IA"
                  : `${failedImages.length} fotografías no pudieron generar metadatos con IA`}
              </h4>
              <p className="text-xs text-amber-900/80 mt-1 leading-relaxed max-w-3xl">
                Ocurrió un error en el procesamiento con el proveedor LLM. Puedes reintentar la generación automática o editar la fotografía para ingresar los títulos manualmente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRetryAllFailed}
            disabled={isRetryingAll}
            className="px-4 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isRetryingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reintentando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar Todo ({failedImages.length})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-3 sm:p-4 border border-forest/10 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-wrap flex-1">
          {/* Gallery Select */}
          <div className="min-w-[180px] flex-1 sm:flex-initial">
            <Select
              value={activeGalleryId}
              onValueChange={(val) => setActiveGalleryId(val)}
            >
              <SelectTrigger className="w-full h-10 rounded-2xl bg-forest/5 border-forest/15 text-forest font-bold text-xs px-3 shadow-2xs hover:bg-forest/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-3.5 h-3.5 text-forest shrink-0" />
                  <span className="truncate">
                    {activeGalleryId === "all"
                      ? "Todas las Galerías"
                      : galleries.find(g => g.id === activeGalleryId)?.name || "Seleccionar Galería"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-forest/15 shadow-xl bg-white text-slate-800 p-1 min-w-[240px]">
                <SelectGroup>
                  <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                    Filtrar por Galería / Álbum
                  </SelectLabel>
                  <SelectItem value="all" className="rounded-xl text-xs font-semibold py-2 cursor-pointer">
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2">
                        <Images className="w-3.5 h-3.5 text-forest" />
                        <span>Todas las Galerías</span>
                      </div>
                      <span className="text-[10px] bg-forest/10 text-forest px-2 py-0.5 rounded-full font-bold">
                        {images.length}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectSeparator />
                  {galleries.map((gal) => {
                    const count = gal.image_count ?? images.filter(img => img.gallery_id === gal.id).length;
                    return (
                      <SelectItem key={gal.id} value={gal.id} className="rounded-xl text-xs font-medium py-2 cursor-pointer">
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-2 truncate">
                            {gal.is_default ? (
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            ) : (
                              <FolderOpen className="w-3.5 h-3.5 text-forest shrink-0" />
                            )}
                            <span className="truncate">{gal.name}</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                            {count}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Category Select (Only for Galería Web or All Galleries view) */}
          {(activeGalleryId === "all" || galleries.find(g => g.id === activeGalleryId)?.is_default) && (
            <div className="min-w-[180px] flex-1 sm:flex-initial">
              <Select
                value={activeCat}
                onValueChange={(val) => setActiveCat(val)}
              >
                <SelectTrigger className="w-full h-10 rounded-2xl bg-forest/5 border-forest/15 text-forest font-semibold text-xs px-3 shadow-2xs hover:bg-forest/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 truncate">
                    <Tag className="w-3.5 h-3.5 text-forest shrink-0" />
                    <span className="truncate">
                      {activeCat === "all"
                        ? "Todas las Categorías"
                        : categories.find(c => c.id === activeCat)?.label || "Seleccionar Categoría"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-forest/15 shadow-xl bg-white text-slate-800 p-1 min-w-[240px]">
                  <SelectGroup>
                    <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                      Filtrar por Categoría
                    </SelectLabel>
                    <SelectItem value="all" className="rounded-xl text-xs font-semibold py-2 cursor-pointer">
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-forest" />
                          <span>Todas las fotos</span>
                        </div>
                        <span className="text-[10px] bg-forest/10 text-forest px-2 py-0.5 rounded-full font-bold">
                          {images.length}
                        </span>
                      </div>
                    </SelectItem>
                    <SelectSeparator />
                    {categories.map((cat) => {
                      const count = images.filter(img => img.category_id === cat.id).length;
                      return (
                        <SelectItem key={cat.id} value={cat.id} className="rounded-xl text-xs font-medium py-2 cursor-pointer">
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <Tag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span className="truncate">{cat.label}</span>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                              {count}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Student Filter Select */}
          <div className="min-w-[220px] flex-1 sm:flex-initial">
            <Select
              value={selectedStudentFilter}
              onValueChange={(val) => setSelectedStudentFilter(val)}
            >
              <SelectTrigger className="w-full h-10 rounded-2xl bg-forest/5 border-forest/15 text-forest font-semibold text-xs px-3 shadow-2xs hover:bg-forest/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 truncate">
                  <UserCheck className="w-3.5 h-3.5 text-forest shrink-0" />
                  <span className="truncate">
                    {selectedStudentFilter === "all"
                      ? "Todos los Estudiantes"
                      : selectedStudentFilter === "unidentified"
                      ? "Rostros No Identificados"
                      : detectedStudentsMap.find(s => s.id === selectedStudentFilter)?.name ||
                        schoolStudents.find(s => s.id === selectedStudentFilter)?.full_name || "Filtrar por Estudiante"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-forest/15 shadow-xl bg-white text-slate-800 p-1 min-w-[280px] max-h-72">
                <SelectGroup>
                  <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                    Filtrar por Alumno en Foto
                  </SelectLabel>
                  <SelectItem value="all" className="rounded-xl text-xs font-semibold py-2 cursor-pointer">
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-forest" />
                        <span>Todos los alumnos</span>
                      </div>
                      <span className="text-[10px] bg-forest/10 text-forest px-2 py-0.5 rounded-full font-bold">
                        {images.length} fotos
                      </span>
                    </div>
                  </SelectItem>

                  {countUnidentifiedPhotos > 0 && (
                    <SelectItem value="unidentified" className="rounded-xl text-xs font-medium py-2 cursor-pointer text-slate-700">
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Rostros sin identificar</span>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {countUnidentifiedPhotos}
                        </span>
                      </div>
                    </SelectItem>
                  )}

                  <SelectSeparator />

                  {detectedStudentsMap.length > 0 ? (
                    detectedStudentsMap.map((stud) => (
                      <SelectItem key={stud.id} value={stud.id} className="rounded-xl text-xs font-medium py-2 cursor-pointer">
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden border border-emerald-300">
                              {stud.avatarUrl ? (
                                <img src={stud.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                stud.name.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="flex flex-col text-left truncate">
                              <span className="font-semibold text-slate-800 truncate">{stud.name}</span>
                              {stud.environmentName && (
                                <span className="text-[10px] text-muted-foreground">{stud.environmentName}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold shrink-0">
                            {stud.count} {stud.count === 1 ? "foto" : "fotos"}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-[11px] text-muted-foreground italic">
                      Aún no se han detectado alumnos en las fotos.
                    </div>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters Button */}
          {(activeCat !== "all" || selectedStudentFilter !== "all" || searchQuery.trim()) && (
            <button
              type="button"
              onClick={() => {
                setActiveCat("all");
                setSelectedStudentFilter("all");
                setSearchQuery("");
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              title="Restablecer todos los filtros"
            >
              <X className="w-3 h-3" />
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar fotos, videos o alumnos..."
              className="w-full h-10 pl-8 pr-7 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest/20 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-forest cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* GALLERY IMAGES GRID */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Cargando fotografías y videos...
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border border-forest/10 shadow-xs space-y-3">
          <Images className="w-12 h-12 text-forest/30 mx-auto" />
          <h3 className="font-display font-bold text-forest text-lg">
            {searchQuery ? "No se encontraron resultados para la búsqueda" : "No hay archivos en esta galería"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {searchQuery
              ? "Prueba con otro término de búsqueda o limpia los filtros activos."
              : "Sube las primeras fotos o videos a este álbum para empezar."}
          </p>
          {canManageGallery && !searchQuery && (
            <button
              type="button"
              onClick={() => handleOpenImageModal()}
              className="mt-2 px-4 py-2 bg-forest text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Subir Fotos / Videos</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((img) => {
            const catObj = categories.find(c => c.id === img.category_id);
            const isPending = img.ai_status === "PENDING";
            const isFailed = img.ai_status === "FAILED";
            const isRetryingThis = retryingImageId === img.id;
            const isVideo = isVideoUrl(img.src);
            const isScanningThis = !isVideo && (
              scanningImageId === img.id ||
              img.consent_status === "processing" ||
              (isScanningConsents && (!img.consent_status || img.consent_status === "unchecked"))
            );
            const hasBlurred = Boolean(img.blurred_src && img.blurred_src !== img.src);
            const viewMode = cardConsentMode[img.id] || (img.has_consent_issues ? "blurred" : "original");
            const displaySrc = (viewMode === "blurred" && hasBlurred) ? (img.blurred_src || img.src) : img.src;
            const isDefaultWebPhoto = !img.gallery || img.gallery.is_default || Boolean(galleries.find(g => g.id === img.gallery_id)?.is_default);
            const isShaking = shakingImageIds.has(img.id);

            return (
              <div
                key={img.id}
                onClick={() => {
                  setPreviewImage(img);
                  setPreviewConsentMode(img.has_consent_issues ? "blurred" : "original");
                }}
                className={`group relative bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden border transition-all flex flex-col h-full justify-between cursor-pointer ${
                  isShaking
                    ? "anim-facematch-shake border-rose-500 ring-2 ring-rose-500/70 z-30"
                    : "border-forest/10 shadow-xs hover:shadow-md"
                }`}
              >
                {/* Media Container */}
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-900 flex items-center justify-center">
                  {isVideo ? (
                    <>
                      <video
                        src={displaySrc}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-white/90 text-forest flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Film className="w-3 h-3 text-amber-400" />
                        <span>VIDEO</span>
                      </div>
                    </>
                  ) : (
                    <img
                      src={displaySrc}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                    />
                  )}

                  {/* Shake Alert Overlay when qualifying for blurring */}
                  {isShaking && (
                    <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center p-3 bg-rose-950/25 backdrop-blur-[1px]">
                      <div className="px-3.5 py-2 rounded-2xl bg-rose-600/95 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-rose-300 backdrop-blur-md anim-facematch-pulse">
                        <EyeOff className="w-4 h-4 text-white shrink-0 animate-bounce" />
                        <span>¡Rostro Difuminado Automáticamente!</span>
                      </div>
                    </div>
                  )}

                  {/* Biometric AI Laser Scanner Overlay during FaceMatch */}
                  {isScanningThis && (
                    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden bg-emerald-950/25 backdrop-blur-[1px]">
                      {/* High-tech Grid Pattern */}
                      <div
                        className="absolute inset-0 opacity-25 bg-[radial-gradient(#10b981_1px,transparent_1px)]"
                        style={{ backgroundSize: "14px 14px" }}
                      />

                      {/* Moving Laser Beam Glow (trails behind the laser) */}
                      <div className="absolute inset-x-0 bg-gradient-to-b from-emerald-500/25 via-emerald-400/10 to-transparent anim-facematch-beam" />

                      {/* Bright Sharp Laser Line with Intense Glow */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_16px_4px_rgba(52,211,153,0.95)] anim-facematch-laser flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_12px_#34d399] -translate-y-1/2" />
                      </div>

                      {/* Biometric Viewfinder Corner Brackets */}
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                      {/* Floating Realtime Scanner Status Badge */}
                      <div className="absolute bottom-3 inset-x-3 flex justify-center">
                        <div className="px-3 py-1 rounded-full bg-slate-950/90 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold font-mono tracking-wider flex items-center gap-2 shadow-2xl anim-facematch-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>ESCANEANDO FACEMATCH...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bounding box highlight on card thumbnail when hovering face avatar below */}
                  {hoveredCardFace[img.id] !== undefined && hoveredCardFace[img.id] !== null && img.detected_faces && img.detected_faces[hoveredCardFace[img.id]!]?.box && (() => {
                    const face = img.detected_faces[hoveredCardFace[img.id]!];
                    const box = face.box;
                    if (!box) return null;
                    const isIdentified = Boolean(face.isIdentified && face.studentId);
                    const hasConsent = face.hasConsent;
                    const borderColor = !isIdentified
                      ? "border-2 border-amber-400 ring-1 ring-black/75 bg-transparent"
                      : hasConsent
                      ? "border-2 border-emerald-400 ring-1 ring-black/75 bg-transparent"
                      : "border-2 border-rose-500 ring-1 ring-black/75 bg-transparent";

                    return (
                      <div
                        style={{
                          left: `${box.xPercent}%`,
                          top: `${box.yPercent}%`,
                          width: `${box.wPercent}%`,
                          height: `${box.hPercent}%`
                        }}
                        className={`absolute rounded-sm transition-all pointer-events-none z-20 ${borderColor}`}
                      />
                    );
                  })()}

                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
                    {/* Category badge only for Galería Web photos */}
                    {isDefaultWebPhoto && (
                      <div className="bg-forest/80 backdrop-blur-md text-white text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border border-white/20">
                        {catObj?.label || img.category_id}
                      </div>
                    )}

                    {!isVideo && hasBlurred && canManageGallery && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardConsentMode(prev => ({
                            ...prev,
                            [img.id]: viewMode === "blurred" ? "original" : "blurred"
                          }));
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md transition-all shadow-xs flex items-center gap-1 cursor-pointer border ${
                          viewMode === "blurred"
                            ? "bg-rose-600/90 hover:bg-rose-700 text-white border-rose-400/40"
                            : "bg-emerald-600/90 hover:bg-emerald-700 text-white border-emerald-400/40"
                        }`}
                        title={viewMode === "blurred" ? "Ver foto original sin difuminar (Admin)" : "Ver foto protegida con rostros difuminados (Web)"}
                      >
                        {viewMode === "blurred" ? "🛡️ Difuminada" : "👁️ Original"}
                      </button>
                    )}
                  </div>

                  {/* AI Status Overlay */}
                  {isPending && !isScanningThis && (
                    <div className="absolute bottom-3 left-3 right-3 bg-amber-500/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center justify-between gap-1.5 animate-pulse z-30">
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generando con IA...</span>
                      </div>
                    </div>
                  )}

                  {isFailed && !isScanningThis && (
                    <div className="absolute bottom-3 left-3 right-3 bg-amber-600/95 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center justify-between gap-1.5 z-30">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                        <span>Falló generación con IA</span>
                      </div>
                      {canManageGallery && (
                        <button
                          type="button"
                          onClick={(e) => handleRetrySingle(img.id, e)}
                          disabled={isRetryingThis}
                          className="px-2 py-0.5 bg-white text-amber-900 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isRetryingThis ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-2.5 h-2.5" />
                          )}
                          <span>Reintentar</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Card Action Buttons */}
                  {canManageGallery ? (
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!isVideo && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleOpenFaceMappingModal(img, e)}
                            className="p-1.5 text-forest/80 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors cursor-pointer"
                            title="Mapear / Asignar Alumnos a los Rostros"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-forest" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleScanSingleConsent(img.id, e)}
                            disabled={scanningImageId === img.id}
                            className="p-1.5 text-forest/80 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors cursor-pointer"
                            title="Re-escanear rostros y consentimientos con IA"
                          >
                            {scanningImageId === img.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-forest" />
                            ) : (
                              <ScanFace className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ isOpen: true, type: "image", id: img.id, title: img.title })}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Archivo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-4 h-4 text-forest" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  {/* Audience & Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isVideo && (
                      <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1">
                        <Film className="w-2.5 h-2.5" /> Video
                      </span>
                    )}
                    {img.show_on_web && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200/60 inline-flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" /> Web
                      </span>
                    )}
                    {img.show_on_portal && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-200/60 inline-flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" /> Padres
                      </span>
                    )}
                    {!img.show_on_web && !img.show_on_portal && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border border-slate-200 inline-flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Oculto
                      </span>
                    )}

                    {!isVideo && (
                      <>
                        {img.has_consent_issues ? (
                          <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-md border border-rose-200 inline-flex items-center gap-1">
                            <EyeOff className="w-2.5 h-2.5 text-rose-600" /> Rostro Difuminado
                          </span>
                        ) : img.consent_status === "verified_clean" ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Consentimiento OK
                          </span>
                        ) : img.consent_status === "no_faces" ? (
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border border-slate-200 inline-flex items-center gap-1">
                            <Users className="w-2.5 h-2.5 text-slate-500" /> Sin Rostros
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1">
                            <ScanFace className="w-2.5 h-2.5 text-amber-600" /> Sin Escanear
                          </span>
                        )}

                        {img.detected_faces && img.detected_faces.length > 0 && (
                          <span className="text-[10px] bg-forest/10 text-forest font-bold px-2 py-0.5 rounded-md border border-forest/15 inline-flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> {img.detected_faces.length} {img.detected_faces.length === 1 ? "rostro" : "rostros"}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Parent Privacy Report Alert Banner */}
                  {img.is_reported_by_parent && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-rose-700">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Retirada por reporte de padre/tutor</span>
                      </div>
                      {img.parent_report && (
                        <div className="text-[11px] text-rose-800 space-y-1">
                          <p className="leading-tight">
                            <strong>Tutor:</strong> {img.parent_report.tutorName || img.parent_report.tutorEmail}
                            {img.parent_report.studentName ? ` (Alumno: ${img.parent_report.studentName})` : ""}
                          </p>
                          {img.parent_report.comment && (
                            <p className="italic bg-white/80 p-2 rounded-lg border border-rose-200 text-slate-700 leading-snug">
                              "{img.parent_report.comment}"
                            </p>
                          )}
                          <p className="text-[10px] text-rose-600/90 font-semibold">
                            🔒 Desactivada permanentemente. Solo el Owner o Superadmin pueden eliminarla.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <h3 className="font-display font-bold text-forest text-base leading-snug group-hover:text-forest-light transition-colors">
                      {img.title || (isDefaultWebPhoto ? "Fotografía de Galería" : img.gallery?.name || (isVideo ? "Video de Galería" : "Fotografía"))}
                    </h3>

                    {isDefaultWebPhoto && img.title_en && (
                      <span className="text-[10px] text-terracotta font-semibold uppercase tracking-wider block mt-0.5">
                        EN: {img.title_en}
                      </span>
                    )}
                  </div>

                  {/* Personas / Alumnos Detectados en la Fotografía */}
                  {!isVideo && (
                    <div className="pt-2.5 border-t border-forest/5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3 text-forest/70" />
                          <span>Personas ({img.detected_faces?.length || 0}):</span>
                        </span>
                        {canManageGallery && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenFaceMappingModal(img, e)}
                            className="text-[10px] text-forest hover:text-forest-dark font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Mapear</span>
                          </button>
                        )}
                      </div>

                      {img.detected_faces && img.detected_faces.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {img.detected_faces.map((face, fIdx) => {
                            const initials = face.studentName && face.isIdentified
                              ? face.studentName.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase()
                              : "?";

                            return (
                              <TooltipProvider key={fIdx} delayDuration={50}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      onMouseEnter={() => setHoveredCardFace(prev => ({ ...prev, [img.id]: fIdx }))}
                                      onMouseLeave={() => setHoveredCardFace(prev => ({ ...prev, [img.id]: null }))}
                                      onClick={(e) => handleOpenFaceMappingModal(img, e)}
                                      className={`relative flex items-center justify-center rounded-full border-2 transition-all duration-200 ease-out hover:scale-140 hover:z-30 cursor-pointer shadow-xs ${
                                        face.isIdentified
                                          ? face.hasConsent
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                            : "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-300/60"
                                          : "border-amber-400 bg-amber-50 text-amber-800 ring-2 ring-amber-200"
                                      } w-7 h-7`}
                                    >
                                      <FaceCropAvatar
                                        imageSrc={img.src}
                                        box={face.box}
                                        avatarUrl={face.avatarUrl}
                                        fallbackText={initials}
                                        className="w-full h-full rounded-full"
                                      />
                                      {!face.hasConsent && face.isIdentified && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 border-2 border-white" />
                                      )}
                                      {!face.isIdentified && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white" />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    align="center"
                                    sideOffset={8}
                                    collisionPadding={16}
                                    className="bg-slate-900 text-white text-xs font-semibold rounded-xl space-y-1 p-3 max-w-xs shadow-2xl z-[99999] border border-slate-700 pointer-events-none select-none"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold">{face.studentName || "Persona no identificada"}</span>
                                      {face.isIdentified ? (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20">Identificado</span>
                                      ) : (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/30 text-amber-300 font-bold">Sin mapear</span>
                                      )}
                                    </div>
                                    {face.environmentName && (
                                      <span className="text-[10px] text-slate-300 block">{face.environmentName}</span>
                                    )}
                                    <div className="pt-1 border-t border-white/10 flex items-center gap-1 text-[10px]">
                                      {face.isIdentified ? (
                                        face.hasConsent ? (
                                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Consentimiento de imagen OK
                                          </span>
                                        ) : (
                                          <span className="text-rose-400 font-bold flex items-center gap-1">
                                            <ShieldAlert className="w-3 h-3" /> Sin consentimiento (Rostro protegido)
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-amber-300 font-semibold">
                                          💡 Haz clic para asignar alumno a este rostro
                                        </span>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      ) : (
                        canManageGallery && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenFaceMappingModal(img, e)}
                            className="text-[11px] text-slate-400 hover:text-forest flex items-center gap-1 py-1 cursor-pointer transition-colors"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Asignar alumno manualmente</span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT IMAGE OR MULTI-UPLOAD MODAL */}
      {canManageGallery && (
        <ResponsiveModal
          isOpen={isImageModalOpen}
          onClose={() => {
            if (!isUploadingBatch) setIsImageModalOpen(false);
          }}
          maxWidthClass="max-w-2xl"
          title={
            Boolean(galleries.find(g => g.id === selectedGalleryId)?.is_default)
              ? "Agregar Fotografía a la Galería Web"
              : "Subir Fotos y Videos al Álbum"
          }
        >
          <form onSubmit={handleSaveImage} className="space-y-5">
            {/* SECCIÓN 1: DESTINO */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <span className="w-5 h-5 rounded-full bg-forest text-white text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Galería de Destino & Archivos
                </span>
              </div>

              {/* Gallery Destination Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-forest" />
                  <span>Galería / Álbum de Destino *</span>
                </label>
                <select
                  value={selectedGalleryId}
                  onChange={(e) => setSelectedGalleryId(e.target.value)}
                  required
                  disabled={isUploadingBatch}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer shadow-3xs"
                >
                  {galleries.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} {g.is_default ? "⭐ (Galería Web Oficial - Pública)" : "🔒 (Álbum Interno)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Notice of Selected Gallery */}
              {(() => {
                const currentGal = galleries.find(g => g.id === selectedGalleryId);
                const isDefaultWebGal = currentGal ? currentGal.is_default : (selectedGalleryId === (galleries.find(g => g.is_default)?.id || ""));

                return isDefaultWebGal ? (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs">
                    <Globe className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-950 font-bold block">Galería Web Oficial (Pública)</strong>
                      <p className="text-[11px] text-amber-900/80 leading-snug">
                        Esta foto se publicará en el sitio web exterior (con rostros protegidos/difuminados según consentimiento) y en el portal para los padres cuyos hijos aparezcan en la imagen (FaceMatch).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-forest/5 border border-forest/15 flex items-start gap-2.5 text-xs">
                    <Lock className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-forest font-bold block">Álbum Interno ({currentGal?.name || "Galería"})</strong>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Álbum de uso interno en la plataforma. Puedes subir <strong>múltiples fotos y videos</strong> a la vez. Todas las familias autorizadas lo verán en su portal y FaceMatch etiquetará a los alumnos automáticamente.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Category Selection (Only for Galería Web) */}
              {(() => {
                const currentGal = galleries.find(g => g.id === selectedGalleryId);
                const isDefaultWebGal = currentGal ? currentGal.is_default : (selectedGalleryId === (galleries.find(g => g.is_default)?.id || ""));
                if (!isDefaultWebGal) return null;

                return (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-forest" />
                      <span>Categoría Pedagógica *</span>
                    </label>
                    <select
                      value={selectedCatId}
                      onChange={(e) => {
                        setSelectedCatId(e.target.value);
                        if (isAiAutoGenerate && srcUrl) {
                          handleGenerateMetadata();
                        }
                      }}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer shadow-3xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label} ({c.id})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              {/* File Uploader: Single (for Web Gallery or Edit Mode) vs Multiple (for Internal Album Upload) */}
              {(() => {
                const currentGal = galleries.find(g => g.id === selectedGalleryId);
                const isDefaultWebGal = currentGal ? currentGal.is_default : (selectedGalleryId === (galleries.find(g => g.is_default)?.id || ""));

                if (isDefaultWebGal) {
                  return (
                    <div>
                      <ImageUploadDropzone
                        value={srcUrl}
                        onChange={(url) => {
                          setSrcUrl(url);
                          if (url && isAiAutoGenerate && isDefaultWebGal) {
                            handleGenerateMetadata(url);
                          }
                        }}
                        label="Fotografía para la Galería"
                        helperText="Arrastra y suelta tu archivo aquí (PNG, JPG, WEBP - se optimizará en almacenamiento)"
                        folder="gallery"
                        maxSizeMB={25}
                      />
                    </div>
                  );
                }

                // MULTI-FILE UPLOADER FOR INTERNAL ALBUMS
                return (
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleBatchFileSelect}
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                    />

                    {/* Multi Dropzone Area */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 rounded-2xl border-2 border-dashed border-forest/30 hover:border-forest bg-forest/5 hover:bg-forest/10 transition-all cursor-pointer text-center space-y-2 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-3xs flex items-center justify-center text-forest mx-auto group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-forest block">
                          Haz clic para seleccionar múltiples fotos o videos
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          Soporta selección múltiple de JPG, PNG, WEBP, MP4, MOV, WEBM (arrastra y suelta varios archivos)
                        </span>
                      </div>
                    </div>

                    {/* Selected Batch Files List */}
                    {batchFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>{batchFiles.length} {batchFiles.length === 1 ? "archivo seleccionado" : "archivos seleccionados"}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setBatchFiles([])}
                            className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                          >
                            Limpiar todo
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                          {batchFiles.map((item) => (
                            <div
                              key={item.id}
                              className="relative group p-2 rounded-xl bg-white border border-slate-200 shadow-3xs flex items-center gap-2.5 overflow-hidden"
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0 relative flex items-center justify-center">
                                {item.isVideo ? (
                                  <>
                                    <video src={item.preview} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                      <Film className="w-3.5 h-3.5 text-amber-400" />
                                    </div>
                                  </>
                                ) : (
                                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-slate-800 truncate block leading-tight">
                                  {item.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground block">
                                  {formatFileSize(item.size)} • {item.isVideo ? "Video" : "Foto"}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveBatchFile(item.id);
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Quitar archivo"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress Bar during Batch Upload */}
                    {isUploadingBatch && (
                      <div className="p-3.5 rounded-2xl bg-forest/10 border border-forest/20 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-bold text-forest">
                          <div className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Subiendo archivo {uploadProgress.current} de {uploadProgress.total}...</span>
                          </div>
                          <span>{uploadProgress.percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-forest/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-forest rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* SECCIÓN 2: INFORMACIÓN & METADATOS (Solo para Galería Web Oficial o Edición Individual) */}
            {(() => {
              const currentGal = galleries.find(g => g.id === selectedGalleryId);
              const isDefaultWebGal = currentGal ? currentGal.is_default : (selectedGalleryId === (galleries.find(g => g.is_default)?.id || ""));

              // For uploads in internal albums, no metadata section is needed
              if (!isDefaultWebGal) {
                return null;
              }

              return (
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-3xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-forest text-white text-[10px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Información & Metadatos Montessori
                      </span>
                    </div>

                    {aiGeneratedBadge && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Generado con IA
                      </span>
                    )}
                  </div>

                      {/* AI Auto-Generation Toggle Switch */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-forest/5 border border-forest/15">
                        <div className="flex items-center gap-3 pr-2">
                          <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0">
                            <Sparkles className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              Autogenerar con Inteligencia Artificial (IA)
                            </span>
                            <span className="text-[11px] text-slate-500 block leading-tight">
                              Genera títulos y descripciones Montessori automáticamente en segundo plano para todos los idiomas
                            </span>
                          </div>
                        </div>
                        <Switch
                          checked={isAiAutoGenerate}
                          onCheckedChange={(val) => {
                            setIsAiAutoGenerate(val);
                          }}
                        />
                      </div>

                      {/* AI Queue Explanation vs Manual Input */}
                      {isAiAutoGenerate ? (
                        <div className="p-4 rounded-2xl bg-forest/5 border border-forest/15 space-y-2 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2 text-forest">
                            <Bot className="w-4 h-4" />
                            <span className="text-xs font-bold">Generación en segundo plano</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            No necesitas escribir títulos ni descripciones manualmente. Al guardar la imagen, se iniciará una cola de procesamiento en segundo plano con IA para generar los metadatos pedagógicos en todos los idiomas configurados ({activeLangs.map(l => l.flag).join(" ")}).
                          </p>
                          <div className="flex items-center gap-2 pt-1 text-[11px] text-forest/90 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            <span>La fotografía aparecerá con estado "Generando con IA..." mientras procesa.</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 animate-in fade-in duration-150">
                          {/* Language Selector Tabs */}
                          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
                              {activeLangs.map((lang) => {
                                const hasTitle = Boolean(getTitleForLang(lang.code)?.trim());
                                const isSelected = langTab === lang.code;
                                return (
                                  <button
                                    key={lang.code}
                                    type="button"
                                    onClick={() => setLangTab(lang.code)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${isSelected
                                      ? "bg-white text-forest shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                    }`}
                                  >
                                    <span>{lang.flag}</span>
                                    <span>{lang.nativeName}</span>
                                    {hasTitle && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Información completada" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleGenerateMetadata()}
                              disabled={isGeneratingAi}
                              className="px-3.5 py-1.5 text-xs font-bold text-forest bg-forest/10 hover:bg-forest/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="Generar o regenerar título y descripción con Inteligencia Artificial para todos los idiomas"
                            >
                              {isGeneratingAi ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-forest" />
                                  <span>Analizando imagen...</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-3.5 h-3.5 text-forest" />
                                  <span>{aiGeneratedBadge ? "Regenerar con IA" : "Generar con IA"}</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Dynamic Multilingual Text Fields */}
                          {(() => {
                            const currentLangObj = activeLangs.find(l => l.code === langTab) || getLanguageByCode(langTab);
                            const isPrimary = langTab === "es" || langTab === (activeLangs[0]?.code || "es");
                            return (
                              <div className="space-y-3 animate-in fade-in duration-150" key={langTab}>
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                      <span>{currentLangObj.flag}</span>
                                      <span>Título de la Fotografía ({currentLangObj.nativeName})</span>
                                      {isPrimary && <span className="text-red-500">*</span>}
                                    </span>
                                  </label>
                                  <input
                                    type="text"
                                    value={getTitleForLang(langTab)}
                                    onChange={(e) => setFieldForLang(langTab, "title", e.target.value)}
                                    placeholder={`ej. Título en ${currentLangObj.nativeName}`}
                                    required={isPrimary}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest bg-white shadow-3xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                    <span>{currentLangObj.flag}</span>
                                    <span>Descripción Pedagógica Montessoriana ({currentLangObj.nativeName})</span>
                                  </label>
                                  <textarea
                                    value={getDescriptionForLang(langTab)}
                                    onChange={(e) => setFieldForLang(langTab, "description", e.target.value)}
                                    placeholder={`Explicación pedagógica sobre el desarrollo y aprendizaje en ${currentLangObj.nativeName}...`}
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest bg-white shadow-3xs resize-none"
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                disabled={isUploadingBatch}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploadingBatch || (!Boolean(galleries.find(g => g.id === selectedGalleryId)?.is_default) && batchFiles.length === 0 && !srcUrl)}
                className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:scale-100"
              >
                {isUploadingBatch ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Subiendo ({uploadProgress.current}/{uploadProgress.total})...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {Boolean(galleries.find(g => g.id === selectedGalleryId)?.is_default)
                        ? "Publicar en Galería Web"
                        : batchFiles.length > 0
                        ? `Subir ${batchFiles.length} ${batchFiles.length === 1 ? "Archivo" : "Archivos"} al Álbum`
                        : "Subir al Álbum"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </ResponsiveModal>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {canManageGallery && (
        <ResponsiveModal
          isOpen={isCatModalOpen}
          onClose={() => setIsCatModalOpen(false)}
          maxWidthClass="max-w-md"
          title={editingCat ? `Editar Categoría: ${editingCat.label}` : "Nueva Categoría de Galería"}
        >
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                ID / Slug Interno {editingCat ? "(No editable)" : "(Opcional)"}
              </label>
              <input
                type="text"
                value={catIdInput}
                onChange={(e) => setCatIdInput(e.target.value)}
                disabled={Boolean(editingCat)}
                placeholder="ej. practical, art (se auto-genera si se deja vacío)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-forest disabled:bg-slate-100 disabled:text-slate-500 shadow-3xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Nombres de la Categoría por Idioma</span>
                <span className="text-[10px] text-muted-foreground font-normal">({activeLangs.length} idiomas)</span>
              </label>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full mb-3">
                {activeLangs.map((lang) => {
                  const hasVal = Boolean(getCatLabelForLang(lang.code)?.trim());
                  const isSelected = catLangTab === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setCatLangTab(lang.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${isSelected
                        ? "bg-white text-forest shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                      {hasVal && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Nombre completado" />
                      )}
                    </button>
                  );
                })}
              </div>

              {(() => {
                const currentLangObj = activeLangs.find(l => l.code === catLangTab) || getLanguageByCode(catLangTab);
                const isPrimary = catLangTab === "es" || catLangTab === (activeLangs[0]?.code || "es");
                return (
                  <div className="space-y-1 animate-in fade-in duration-150" key={catLangTab}>
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                      <span>{currentLangObj.flag}</span>
                      <span>Nombre en {currentLangObj.nativeName}</span>
                      {isPrimary && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={getCatLabelForLang(catLangTab)}
                      onChange={(e) => setCatLabelForLang(catLangTab, e.target.value)}
                      placeholder={`ej. Nombre en ${currentLangObj.nativeName}`}
                      required={isPrimary}
                      autoFocus
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest bg-white shadow-3xs"
                    />
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white font-display font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                {editingCat ? "Guardar Cambios" : "Crear Categoría"}
              </button>
            </div>
          </form>
        </ResponsiveModal>
      )}

      {/* CREATE / EDIT GALLERY (ALBUM) MODAL */}
      {canManageGallery && (
        <ResponsiveModal
          isOpen={isGalleryModalOpen}
          onClose={() => setIsGalleryModalOpen(false)}
          maxWidthClass="max-w-lg"
          title={editingGallery ? `Editar Galería: ${editingGallery.name}` : "Nueva Galería / Álbum de Fotos"}
        >
          <form onSubmit={handleSaveGallery} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-forest" />
                <span>Nombre de la Galería / Álbum *</span>
              </label>
              <input
                type="text"
                value={galleryName}
                onChange={(e) => setGalleryName(e.target.value)}
                placeholder="ej. Festival de Primavera 2026, Salida al Parque, etc."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest bg-white shadow-3xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Descripción o Contexto Pedagógico (Opcional)
              </label>
              <textarea
                value={galleryDescription}
                onChange={(e) => setGalleryDescription(e.target.value)}
                rows={3}
                placeholder="Describe el evento, temporada o propósito de este grupo de fotografías..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest bg-white shadow-3xs resize-none"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/15 space-y-1 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-forest" />
                <span>Álbum de Uso Interno en la Plataforma</span>
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Los nuevos álbumes son para uso interno dentro de la plataforma y se pueden compartir con grupos específicos de padres o salones mediante el botón de difusión. La <strong>Galería Web</strong> oficial es el único espacio público para el sitio exterior.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsGalleryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white font-display font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                {editingGallery ? "Guardar Cambios" : "Crear Galería"}
              </button>
            </div>
          </form>
        </ResponsiveModal>
      )}

      {/* SHARE / AUDIENCE MODAL FOR GALLERIES */}
      {canManageGallery && (
        <ResponsiveModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          maxWidthClass="max-w-lg"
          title={`Difusión y Audiencia: ${sharingGallery?.name || "Galería"}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Define qué familias tendrán acceso para ver las fotografías y videos de este álbum en su portal escolar:
            </p>

            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  shareScope === "ALL_SCHOOL"
                    ? "bg-forest/5 border-forest ring-1 ring-forest/30"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setShareScope("ALL_SCHOOL")}
              >
                <input
                  type="radio"
                  name="shareScope"
                  checked={shareScope === "ALL_SCHOOL"}
                  onChange={() => setShareScope("ALL_SCHOOL")}
                  className="mt-1 accent-forest"
                />
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-slate-900 block">Todo el Colegio (Público Familiar)</strong>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Todas las familias con hijos matriculados en la institución podrán ver el álbum en su portal.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  shareScope === "ENVIRONMENTS"
                    ? "bg-forest/5 border-forest ring-1 ring-forest/30"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setShareScope("ENVIRONMENTS")}
              >
                <input
                  type="radio"
                  name="shareScope"
                  checked={shareScope === "ENVIRONMENTS"}
                  onChange={() => setShareScope("ENVIRONMENTS")}
                  className="mt-1 accent-forest"
                />
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-slate-900 block">Por Salones / Ambientes</strong>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Solo las familias cuyos hijos pertenezcan a los salones seleccionados podrán ver el álbum.
                  </span>
                </div>
              </label>

              {shareScope === "ENVIRONMENTS" && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 pl-8 animate-in fade-in">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Selecciona los salones:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {schoolEnvironments.map((env) => {
                      const checked = sharedEnvIds.includes(env.id);
                      return (
                        <label key={env.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-white">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setSharedEnvIds(sharedEnvIds.filter(id => id !== env.id));
                              } else {
                                setSharedEnvIds([...sharedEnvIds, env.id]);
                              }
                            }}
                            className="rounded accent-forest"
                          />
                          <span className="truncate">{env.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  shareScope === "SPECIFIC_PARENTS"
                    ? "bg-forest/5 border-forest ring-1 ring-forest/30"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setShareScope("SPECIFIC_PARENTS")}
              >
                <input
                  type="radio"
                  name="shareScope"
                  checked={shareScope === "SPECIFIC_PARENTS"}
                  onChange={() => setShareScope("SPECIFIC_PARENTS")}
                  className="mt-1 accent-forest"
                />
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-slate-900 block">Familias Específicas</strong>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Difundir exclusivamente con padres o tutores seleccionados individualmente.
                  </span>
                </div>
              </label>

              {shareScope === "SPECIFIC_PARENTS" && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 pl-8 animate-in fade-in">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Selecciona los padres:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {schoolTutors.map((tut) => {
                      const checked = sharedParentIds.includes(tut.id);
                      return (
                        <label key={tut.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-white">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setSharedParentIds(sharedParentIds.filter(id => id !== tut.id));
                              } else {
                                setSharedParentIds([...sharedParentIds, tut.id]);
                              }
                            }}
                            className="rounded accent-forest"
                          />
                          <span className="truncate">{tut.full_name || tut.email}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  shareScope === "PRIVATE"
                    ? "bg-forest/5 border-forest ring-1 ring-forest/30"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setShareScope("PRIVATE")}
              >
                <input
                  type="radio"
                  name="shareScope"
                  checked={shareScope === "PRIVATE"}
                  onChange={() => setShareScope("PRIVATE")}
                  className="mt-1 accent-forest"
                />
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-slate-900 block">Privado (Solo Personal y Guías)</strong>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Visible únicamente para el equipo docente y administradores de la escuela.
                  </span>
                </div>
              </label>
            </div>

            {/* Shareable Direct Link Box */}
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-amber-700" />
                  Enlace para Compartir Álbum
                </span>
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-200/60 px-2 py-0.5 rounded-full">
                  Requiere Login
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={sharingGallery ? getSchoolGalleryUrl(sharingGallery.id, currentSchool) : ""}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs text-slate-700 select-all font-mono truncate focus:outline-none shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (sharingGallery) {
                      const shareUrl = getSchoolGalleryUrl(sharingGallery.id, currentSchool);
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Enlace oficial del colegio copiado al portapapeles");
                    }
                  }}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </button>
              </div>
              <p className="text-[10px] text-amber-900/80 leading-tight">
                Al abrir este enlace externo con el logo del colegio, el visitante ingresará con su correo y contraseña, y podrá ver el álbum si pertenece a la audiencia seleccionada.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveShare}
                className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white font-display font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                Guardar Difusión
              </button>
            </div>
          </div>
        </ResponsiveModal>
      )}

      {/* LIGHTBOX / FULLSCREEN PREVIEW MODAL */}
      {previewImage && (
        <ResponsiveModal
          isOpen={Boolean(previewImage)}
          onClose={() => {
            setPreviewImage(null);
            setHoveredFaceIndex(null);
            handleCancelInlineEdit();
            handleResetZoom();
          }}
          disableDrag={true}
          maxWidthClass="max-w-4xl"
          title={previewImage?.title || (isVideoUrl(previewImage?.src || "") ? "Video de Galería" : "Fotografía de Galería")}
        >
          <div className="space-y-4">
            <div
              className="relative rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[70vh] cursor-default select-none"
              onWheel={handleImageWheel}
            >
              {isVideoUrl(previewImage.src) ? (
                <video
                  src={previewImage.src}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-auto rounded-xl"
                />
              ) : (
                <div
                  style={{
                    transform: `scale(${zoomScale}) translate(${panPosition.x / zoomScale}px, ${panPosition.y / zoomScale}px)`,
                    transformOrigin: "center center",
                    transition: isPanning ? "none" : "transform 0.12s ease-out"
                  }}
                  className={`relative inline-block max-h-[70vh] select-none leading-none mx-auto ${
                    isPanning ? "cursor-grabbing" : canManageGallery ? "cursor-crosshair" : ""
                  }`}
                  onMouseDown={handleMouseDownOnImage}
                  onMouseMove={handleMouseMoveOnImage}
                  onMouseUp={handleMouseUpOnImage}
                  onContextMenu={(e) => { if (zoomScale > 1) e.preventDefault(); }}
                  title={canManageGallery ? "Rueda del mouse: Zoom • Clic o arrastra: Marcar rostro • Clic derecho: Mover foto" : undefined}
                >
                  <img
                    src={
                      editingFaceIndex !== null
                        ? previewImage.src
                        : (previewConsentMode === "blurred" && previewImage.blurred_src ? previewImage.blurred_src : previewImage.src)
                    }
                    alt={previewImage.title}
                    draggable={false}
                    className="max-h-[70vh] w-auto max-w-full block rounded-xl select-none pointer-events-none"
                  />

                  {/* Active Drag-to-Draw Selection Box */}
                  {isDrawingBox && drawStart && drawCurrent && (
                    <div
                      style={{
                        left: `${Math.min(drawStart.x, drawCurrent.x)}%`,
                        top: `${Math.min(drawStart.y, drawCurrent.y)}%`,
                        width: `${Math.abs(drawCurrent.x - drawStart.x)}%`,
                        height: `${Math.abs(drawCurrent.y - drawStart.y)}%`
                      }}
                      className="absolute border-[2.5px] border-dashed border-amber-300 ring-1 ring-black bg-amber-400/20 rounded-sm pointer-events-none z-40"
                    />
                  )}

                  {/* Bounding boxes drawn over image */}
                  {previewImage.detected_faces && previewImage.detected_faces.map((face, idx) => {
                    const box = face.box;
                    if (!box) return null;
                    const isEditing = editingFaceIndex === idx;
                    const isHovered = hoveredFaceIndex === idx;
                    const isActive = isEditing || isHovered;

                    // If editing another face, render others with a very subtle thin dashed outline
                    if (editingFaceIndex !== null && !isEditing) {
                      return (
                        <div
                          key={`face-box-${idx}`}
                          style={{
                            left: `${box.xPercent}%`,
                            top: `${box.yPercent}%`,
                            width: `${box.wPercent}%`,
                            height: `${box.hPercent}%`
                          }}
                          className="absolute border border-white/40 rounded-sm pointer-events-none bg-transparent z-10"
                        >
                          <span className="text-[9px] font-bold px-1 bg-black/70 text-white/80 rounded-xs -top-3.5 left-0 absolute">
                            #{idx + 1}
                          </span>
                        </div>
                      );
                    }

                    if (editingFaceIndex === null && hoveredFaceIndex === null) {
                      // Normal view: render subtle guide boxes
                      return (
                        <div
                          key={`face-box-${idx}`}
                          style={{
                            left: `${box.xPercent}%`,
                            top: `${box.yPercent}%`,
                            width: `${box.wPercent}%`,
                            height: `${box.hPercent}%`
                          }}
                          className="absolute border border-white/50 rounded-sm pointer-events-none bg-transparent z-10"
                        >
                          <span className="text-[9px] font-bold px-1 bg-black/70 text-white/90 rounded-xs -top-3.5 left-0 absolute">
                            #{idx + 1}
                          </span>
                        </div>
                      );
                    }

                    if (!isActive) return null;

                    const isIdentified = Boolean(face.isIdentified && face.studentId);
                    const hasConsent = face.hasConsent;

                    // Solid, vibrant border with sharp square corners and crisp contrast outline
                    const borderColor = isEditing
                      ? "border-[3px] border-amber-400 ring-1 ring-black/90 shadow-lg"
                      : !isIdentified
                      ? "border-[3px] border-amber-400 ring-1 ring-black/90 shadow-lg"
                      : hasConsent
                      ? "border-[3px] border-emerald-400 ring-1 ring-black/90 shadow-lg"
                      : "border-[3px] border-rose-500 ring-1 ring-black/90 shadow-lg";

                    const badgeBg = isEditing
                      ? "bg-amber-400 text-slate-950 font-black ring-1 ring-black/80"
                      : !isIdentified
                      ? "bg-amber-400 text-slate-950 font-extrabold ring-1 ring-black/80"
                      : hasConsent
                      ? "bg-emerald-600 text-white font-extrabold ring-1 ring-black/80"
                      : "bg-rose-600 text-white font-extrabold ring-1 ring-black/80";

                    const displayName = (isEditing && selectedStudentForFace)
                      ? getStudentName(selectedStudentForFace)
                      : (face.studentName || "Persona no identificada");

                    return (
                      <div
                        key={`face-box-${idx}`}
                        style={{
                          left: `${box.xPercent}%`,
                          top: `${box.yPercent}%`,
                          width: `${box.wPercent}%`,
                          height: `${box.hPercent}%`
                        }}
                        className={`absolute rounded-sm transition-all duration-100 pointer-events-none flex flex-col justify-between bg-transparent z-30 ${borderColor}`}
                      >
                        <span className={`text-[10px] px-2 py-0.5 rounded shadow-xl w-max -top-5 left-0 absolute whitespace-nowrap ${badgeBg}`}>
                          #{idx + 1} {displayName}
                        </span>
                      </div>
                    );
                  })}

                </div>
              )}

              {/* Biometric AI Laser Scanner Overlay on Modal Preview */}
              {(scanningImageId === previewImage.id || previewImage.consent_status === "processing") && (
                <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden bg-emerald-950/20 backdrop-blur-[1px] rounded-2xl">
                  {/* Grid Pattern */}
                  <div
                    className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)]"
                    style={{ backgroundSize: "16px 16px" }}
                  />

                  {/* Laser Beam Glow */}
                  <div className="absolute inset-x-0 bg-gradient-to-b from-emerald-500/20 via-emerald-400/10 to-transparent anim-facematch-beam" />

                  {/* Bright Laser Line */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_18px_5px_rgba(52,211,153,0.95)] anim-facematch-laser flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_#34d399] -translate-y-1/2" />
                  </div>

                  {/* Biometric Viewfinder Corners */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

                  {/* Scanner Status Badge */}
                  <div className="absolute bottom-6 inset-x-4 flex justify-center">
                    <div className="px-4 py-1.5 rounded-full bg-slate-950/90 border border-emerald-400/50 text-emerald-300 text-xs font-bold font-mono tracking-wider flex items-center gap-2 shadow-2xl anim-facematch-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>ESCANEANDO Y COINCIDIENDO ROSTROS CON IA...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* View Mode Switcher in Top-Left */}
              {previewImage.has_consent_issues && canManageGallery && (
                <div className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-xl">
                  <span className="text-[11px] text-white font-semibold">Modo de Vista:</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPreviewConsentMode("blurred"); }}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      previewConsentMode === "blurred" ? "bg-rose-600 text-white shadow-xs" : "text-white/70 hover:text-white"
                    }`}
                  >
                    Protegida (Web)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPreviewConsentMode("original"); }}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      previewConsentMode === "original" ? "bg-emerald-600 text-white shadow-xs" : "text-white/70 hover:text-white"
                    }`}
                  >
                    Original (Admin)
                  </button>
                </div>
              )}

              {/* Zoom Controls in Top-Right */}
              {!isVideoUrl(previewImage.src) && (
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-xl">
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => {
                      const next = Math.max(1, Number((prev - 0.25).toFixed(2)));
                      if (next === 1) setPanPosition({ x: 0, y: 0 });
                      return next;
                    })}
                    disabled={zoomScale <= 1}
                    title="Alejar (o rueda del mouse abajo)"
                    className="w-5 h-5 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-black cursor-pointer transition-all active:scale-95"
                  >
                    -
                  </button>
                  <span className="text-[11px] font-mono font-bold text-amber-300 min-w-8 text-center select-none">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.min(4, Number((prev + 0.25).toFixed(2))))}
                    disabled={zoomScale >= 4}
                    title="Acercar (o rueda del mouse arriba)"
                    className="w-5 h-5 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-black cursor-pointer transition-all active:scale-95"
                  >
                    +
                  </button>
                  {zoomScale > 1 && (
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      title="Restablecer zoom a 1x"
                      className="ml-1 px-1.5 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/40 text-amber-300 text-[10px] font-bold cursor-pointer transition-all"
                    >
                      1x
                    </button>
                  )}
                </div>
              )}

              {/* Bottom Instruction Helper Badge */}
              {canManageGallery && (
                <div className="absolute bottom-2 right-2 z-30 pointer-events-none bg-black/80 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full border border-white/20 shadow-xl flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span>
                    {zoomScale > 1
                      ? "Rueda: Zoom • Clic derecho / Shift: Mover foto • Clic o arrastra: Marcar rostro"
                      : "Arrastra sobre cualquier rostro para dibujarlo • Rueda del mouse para hacer Zoom"}
                  </span>
                </div>
              )}
            </div>

            {previewImage.description && (
              <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                "{previewImage.description}"
              </p>
            )}

            {!isVideoUrl(previewImage.src) && (
              <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/15 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-forest uppercase tracking-wider block">
                    Personas / Alumnos ({previewImage.detected_faces?.length || 0}):
                  </span>
                  {canManageGallery && editingFaceIndex === null && (
                    <button
                      type="button"
                      onClick={handleAddInlineFace}
                      className="px-2.5 py-1 bg-forest/10 hover:bg-forest text-forest hover:text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Agregar Alumno</span>
                    </button>
                  )}
                </div>

                {editingFaceIndex !== null && previewImage.detected_faces && previewImage.detected_faces[editingFaceIndex] ? (
                  /* INLINE EDIT BAR (All other faces hidden to maximize room) */
                  <div className="flex flex-col gap-2.5 w-full bg-slate-900 text-white p-3 rounded-2xl border border-slate-700 shadow-xl animate-in fade-in zoom-in-95">
                    {/* Main Single Row Controls */}
                    <div className="flex items-center gap-2.5 w-full">
                      {/* Face crop preview */}
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-slate-800 flex items-center justify-center shrink-0">
                        <FaceCropAvatar
                          imageSrc={previewImage.src}
                          box={previewImage.detected_faces[editingFaceIndex].box}
                          avatarUrl={selectedStudentForFace ? getStudentAvatar(selectedStudentForFace) : previewImage.detected_faces[editingFaceIndex].avatarUrl}
                          fallbackText={`#${editingFaceIndex + 1}`}
                          className="w-full h-full rounded-full"
                        />
                      </div>

                      <span className="text-xs font-extrabold text-amber-300 shrink-0">
                        #{editingFaceIndex + 1}
                      </span>

                      {/* Autocomplete Search input with ample left padding */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          autoFocus
                          value={studentSearchQuery}
                          onChange={(e) => {
                            setStudentSearchQuery(e.target.value);
                            setIsDropdownOpen(e.target.value.trim().length >= 1);
                          }}
                          onFocus={() => {
                            if (studentSearchQuery.trim().length >= 1) {
                              setIsDropdownOpen(true);
                            }
                          }}
                          placeholder="Escribe el nombre del alumno (ej: Allan)..."
                          className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-800 border border-slate-600 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-forest"
                        />
                        {studentSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setStudentSearchQuery("");
                              setSelectedStudentForFace(null);
                              setIsDropdownOpen(false);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    {/* Quick Box Size Controls: [-] 10% [+] */}
                    <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 shrink-0 text-slate-300">
                      <span className="text-[10px] font-bold text-slate-400 mr-0.5">Tamaño:</span>
                      <button
                        type="button"
                        onClick={() => handleAdjustBoxSize(-2)}
                        title="Reducir tamaño del recuadro"
                        className="w-5 h-5 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-black text-xs cursor-pointer active:scale-95 transition-transform"
                      >
                        -
                      </button>
                      <span className="text-[11px] font-mono font-bold w-6 text-center text-amber-300">
                        {previewImage.detected_faces[editingFaceIndex]?.box?.wPercent || 10}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdjustBoxSize(2)}
                        title="Aumentar tamaño del recuadro"
                        className="w-5 h-5 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-black text-xs cursor-pointer active:scale-95 transition-transform"
                      >
                        +
                      </button>
                    </div>

                    {/* Delete face button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteInlineFace(editingFaceIndex)}
                      disabled={isSavingInlineFace}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-900/30 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Eliminar este rostro detectado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                      {/* Cancel & Check (Save) in the same line */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleCancelInlineEdit}
                          disabled={isSavingInlineFace}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveInlineFace}
                          disabled={isSavingInlineFace}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                          title="Guardar Mapeo"
                        >
                          {isSavingInlineFace ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Guardar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Autocomplete Results Tray (Expands inside the card smoothly, never hidden/clipped) */}
                    {isDropdownOpen && studentSearchQuery.trim().length >= 1 && (
                      <div className="mt-1 pt-2 border-t border-slate-800 max-h-52 overflow-y-auto divide-y divide-slate-800/80 rounded-xl bg-slate-950/60 p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForFace(null);
                            setStudentSearchQuery("");
                            setIsDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-800/80 rounded-lg flex items-center gap-2 text-xs text-amber-300 font-semibold cursor-pointer transition-colors"
                        >
                          <Users className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>-- Persona no identificada (Sin asignar) --</span>
                        </button>

                        {(() => {
                          const query = studentSearchQuery.trim().toLowerCase();
                          const matches = schoolStudents
                            .filter((s) => {
                              const sName = getStudentName(s);
                              return sName.toLowerCase().includes(query);
                            })
                            .slice(0, 10);

                          if (matches.length === 0) {
                            return (
                              <div className="px-3 py-2.5 text-xs text-slate-400 italic text-center">
                                No se encontraron estudiantes con el nombre "{studentSearchQuery}".
                              </div>
                            );
                          }

                          return matches.map((student) => {
                            const sName = getStudentName(student);
                            const sAvatar = getStudentAvatar(student);
                            const initials = sName.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?";
                            const isSelected = selectedStudentForFace?.id === student.id;

                            return (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForFace(student);
                                  setStudentSearchQuery(sName);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left rounded-lg hover:bg-forest/30 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                  isSelected ? "bg-forest/40 text-white font-bold" : "text-slate-200"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-700 shrink-0 border border-white/20">
                                    {sAvatar ? (
                                      <img src={sAvatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-forest text-white">
                                        {initials}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-semibold block leading-tight">{sName}</span>
                                    {student.environment && (
                                      <span className="text-[10px] text-slate-400 block">{student.environment.name}</span>
                                    )}
                                  </div>
                                </div>

                                {checkStudentConsentLocal(student) ? (
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Consentimiento OK
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                                    <EyeOff className="w-3 h-3" /> Sin permiso
                                  </span>
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  /* NORMAL LIST OF PERSON BADGES */
                  previewImage.detected_faces && previewImage.detected_faces.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {previewImage.detected_faces.map((f, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredFaceIndex(idx)}
                          onMouseLeave={() => setHoveredFaceIndex(null)}
                          onClick={() => handleStartEditFace(idx)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border cursor-pointer transition-all ${
                            hoveredFaceIndex === idx
                              ? "scale-108 ring-2 ring-forest shadow-md font-extrabold"
                              : "hover:scale-105"
                          } ${
                            f.isIdentified
                              ? f.hasConsent
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                          title="Haz clic para mapear o cambiar el alumno asignado"
                        >
                          <FaceCropAvatar
                            imageSrc={previewImage.src}
                            box={f.box}
                            avatarUrl={f.avatarUrl}
                            fallbackText={f.studentName?.slice(0, 2) || "?"}
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="font-bold">{f.studentName || "Sin identificar"}</span>
                          {!f.isIdentified && <span className="text-[10px] text-amber-700 font-extrabold">(Sin mapear)</span>}
                          {f.isIdentified && !f.hasConsent && <span className="text-[10px] text-rose-600 font-extrabold">(Sin permiso)</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <p className="italic">No se detectaron rostros automáticamente.</p>
                      {canManageGallery && (
                        <button
                          type="button"
                          onClick={handleAddInlineFace}
                          className="px-2.5 py-1 bg-forest text-white font-bold rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Asignar Alumno Manualmente</span>
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </ResponsiveModal>
      )}

      {/* FLOATING ACTION BUTTONS WHEN INSIDE A CUSTOM (NON-WEB) GALLERY */}
      {activeGalleryId !== "all" && canManageGallery && (() => {
        const activeGal = galleries.find(g => g.id === activeGalleryId);
        if (!activeGal || activeGal.is_default) return null;
        return (
          <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            {/* Share / Difusión Button */}
            <button
              type="button"
              onClick={() => handleOpenShareModal(activeGal)}
              className="h-12 px-5 rounded-full bg-white/95 text-slate-800 hover:text-forest border border-slate-200/80 shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs font-bold backdrop-blur-md cursor-pointer ring-1 ring-black/5"
              title="Difusión y compartir álbum"
            >
              <Share2 className="w-4 h-4 text-forest" />
              <span>Compartir</span>
            </button>

            {/* Upload Photos/Videos Button */}
            <button
              type="button"
              onClick={() => handleOpenImageModal()}
              className="h-12 px-6 rounded-full bg-forest hover:bg-forest/90 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs font-bold font-display cursor-pointer ring-2 ring-forest/20"
            >
              <Plus className="w-4 h-4" />
              <span>Subir Fotos / Videos</span>
            </button>
          </div>
        );
      })()}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, type: "image", id: "", title: "" })}
        onConfirm={handleExecuteDelete}
        title={`Eliminar ${confirmDelete.type === "image" ? "Archivo" : confirmDelete.type === "category" ? "Categoría" : "Galería"}`}
        message={`¿Estás seguro de que deseas eliminar "${confirmDelete.title}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar permanentemente"
        variant="destructive"
      />
    </div>
  );
};
