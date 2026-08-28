import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmDialogContext';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  Save,
  Smartphone,
  QrCode,
  Copy,
  Check,
  Download,
  Lock,
  CheckCircle2,
  Trash2,
  RefreshCw,
  X,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  AlertCircle,
  GraduationCap,
  Award,
  BookOpen,
  Briefcase,
  Camera,
  Eye,
  EyeOff,
  FileText,
  BadgeCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import {
  generateTotpSecret,
  getTotpUri,
  verifyTotpToken,
  generateBackupCodes,
  getUserTotpConfig,
  saveUserTotpConfig,
  removeUserTotpConfig,
  UserTotpConfig
} from '@/lib/totp';
import {
  getAuthUserProfile,
  updateUserProfile
} from '@/lib/sqlite';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { toast } from 'sonner';

type AccountTab = 'personal' | 'teaching' | 'security' | 'totp';

export const AdminAccountSection: React.FC = () => {
  const { user, userEmail, role, activeMembership, changePassword, updateProfile } = useAuth();
  const confirm = useConfirm();
  const activeEmail = userEmail || user?.email || 'admin@ceibamontessori.com';

  const [activeTab, setActiveTab] = useState<AccountTab>('personal');

  // Profile data state
  const [fullNameInput, setFullNameInput] = useState(user?.fullName || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState(user?.avatarUrl || '');
  const [rfcInput, setRfcInput] = useState('');
  const [curpInput, setCurpInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  // Teaching Profile state (for Owner / Admin)
  const [isTeachingStaff, setIsTeachingStaff] = useState(false);
  const [savingTeaching, setSavingTeaching] = useState(false);
  const [loadingProfileDetails, setLoadingProfileDetails] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  // Photo modal state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  // TOTP 2FA state
  const [totpConfig, setTotpConfig] = useState<UserTotpConfig>(() => getUserTotpConfig(activeEmail));
  const [totpWizardOpen, setTotpWizardOpen] = useState(false);
  const [totpStep, setTotpStep] = useState<1 | 2 | 3>(1);
  const [tempSecret, setTempSecret] = useState('');
  const [tempBackupCodes, setTempBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingTotp, setVerifyingTotp] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [viewBackupModalOpen, setViewBackupModalOpen] = useState(false);

  // Horizontal scroll for tabs
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTabsScroll = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkTabsScroll);
    window.addEventListener('resize', checkTabsScroll);
    checkTabsScroll();
    return () => {
      el.removeEventListener('scroll', checkTabsScroll);
      window.removeEventListener('resize', checkTabsScroll);
    };
  }, [checkTabsScroll]);

  useEffect(() => {
    const timer = setTimeout(checkTabsScroll, 100);
    return () => clearTimeout(timer);
  }, [checkTabsScroll, activeTab, isTeachingStaff]);

  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  useEffect(() => {
    if (user) {
      setFullNameInput(user.fullName || '');
      setPhoneInput(user.phone || '');
      setAvatarUrlInput(user.avatarUrl || '');
    }
  }, [user]);

  useEffect(() => {
    setTotpConfig(getUserTotpConfig(activeEmail));
  }, [activeEmail]);

  useEffect(() => {
    async function loadFullProfile() {
      if (!activeEmail) return;
      try {
        setLoadingProfileDetails(true);
        const data = await getAuthUserProfile(activeEmail);
        if (data.user) {
          if (data.user.fullName) setFullNameInput(data.user.fullName);
          if (data.user.phone) setPhoneInput(data.user.phone);
          if (data.user.avatarUrl) setAvatarUrlInput(data.user.avatarUrl);
          setRfcInput(data.user.rfc || '');
          setCurpInput(data.user.curp || '');
        }
        if (data.membership) {
          setIsTeachingStaff(Boolean(data.membership.isTeachingStaff));
        }
      } catch (err) {
        console.error('Error loading user profile details:', err);
      } finally {
        setLoadingProfileDetails(false);
      }
    }

    loadFullProfile();
  }, [activeEmail, activeMembership?.schoolId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameInput.trim()) {
      toast.error('El nombre completo es obligatorio.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await updateProfile(fullNameInput.trim(), phoneInput.trim(), {
        avatarUrl: avatarUrlInput.trim() || '',
        rfc: rfcInput.trim() || undefined,
        curp: curpInput.trim() || undefined
      });
      if (res.success) {
        toast.success('¡Datos de tu perfil actualizados exitosamente!');
      } else {
        toast.error(res.error || 'Error al actualizar perfil.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateAvatar = async (newAvatarUrl: string) => {
    setUpdatingAvatar(true);
    setAvatarUrlInput(newAvatarUrl);
    try {
      const res = await updateProfile(
        fullNameInput.trim() || user?.fullName || '',
        phoneInput.trim() || user?.phone || '',
        {
          avatarUrl: newAvatarUrl.trim() || '',
          rfc: rfcInput.trim() || undefined,
          curp: curpInput.trim() || undefined
        }
      );
      if (res.success) {
        if (newAvatarUrl) {
          toast.success('¡Foto de perfil actualizada exitosamente!');
        } else {
          toast.info('Foto de perfil eliminada.');
        }
      } else {
        toast.error(res.error || 'Error al actualizar foto de perfil');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar foto');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const ok = await confirm({
      title: '¿Quitar Foto de Perfil?',
      description: '¿Estás seguro de que deseas eliminar tu foto de perfil actual?',
      confirmText: 'Sí, quitar',
      variant: 'danger'
    });
    if (!ok) return;
    await handleUpdateAvatar('');
  };

  const handleToggleTeachingStaff = async (newVal: boolean) => {
    setIsTeachingStaff(newVal);
    setSavingTeaching(true);
    try {
      await updateUserProfile(activeEmail, fullNameInput.trim(), phoneInput.trim(), {
        avatarUrl: avatarUrlInput.trim() || undefined,
        isTeachingStaff: newVal
      });
      if (newVal) {
        toast.success('¡Perfil docente activado! Ya figurás en la lista del equipo docente.');
      } else {
        toast.info('Perfil docente desactivado.');
      }
    } catch (err: any) {
      setIsTeachingStaff(!newVal);
      toast.error(err.message || 'Error al cambiar estado docente');
    } finally {
      setSavingTeaching(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoadingPass(true);
    const res = await changePassword(newPassword);
    setLoadingPass(false);

    if (res.success) {
      toast.success('¡Contraseña actualizada exitosamente!');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(res.error || 'Error al cambiar contraseña');
    }
  };

  // TOTP Actions
  const handleStartTotpSetup = () => {
    const newSecret = generateTotpSecret(16);
    const newBackupCodes = generateBackupCodes(8);
    setTempSecret(newSecret);
    setTempBackupCodes(newBackupCodes);
    setVerificationCode('');
    setTotpStep(1);
    setTotpWizardOpen(true);
  };

  const handleVerifyAndActivateTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim().length !== 6) {
      toast.error('Ingresá el código de 6 dígitos de tu aplicación autenticadora.');
      return;
    }

    setVerifyingTotp(true);
    try {
      const isValid = await verifyTotpToken(tempSecret, verificationCode);
      if (!isValid) {
        toast.error('Código incorrecto o expirado. Verificá la hora de tu dispositivo e intentá de nuevo.');
        setVerifyingTotp(false);
        return;
      }

      const newConfig: UserTotpConfig = {
        enabled: true,
        secret: tempSecret,
        activatedAt: new Date().toISOString(),
        backupCodes: tempBackupCodes
      };

      saveUserTotpConfig(activeEmail, newConfig);
      setTotpConfig(newConfig);
      setTotpStep(3);
      toast.success('¡Autenticación de Dos Factores (TOTP) activada exitosamente!');
    } catch (err: any) {
      toast.error(err.message || 'Error al validar código TOTP');
    } finally {
      setVerifyingTotp(false);
    }
  };

  const handleDisableTotp = () => {
    if (window.confirm('¿Estás seguro de desactivar la Autenticación de Dos Factores (TOTP) para tu cuenta? Tu nivel de protección disminuirá.')) {
      removeUserTotpConfig(activeEmail);
      setTotpConfig({ enabled: false, secret: '', backupCodes: [] });
      toast.info('Autenticación en dos pasos desactivada.');
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'backup') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
      toast.success('Clave secreta copiada');
    } else {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
      toast.success('Códigos de recuperación copiados');
    }
  };

  const downloadBackupCodes = () => {
    const codes = (totpConfig.backupCodes.length ? totpConfig.backupCodes : tempBackupCodes).join('\n');
    const content = `CEIBA ROOTS - CÓDIGOS DE RECUPERACIÓN DE EMERGENCIA (2FA)\nCuenta: ${activeEmail}\nGenerados: ${new Date().toLocaleDateString()}\n\nGuardá estos códigos en un lugar seguro. Cada código puede usarse una sola vez:\n\n${codes}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ceiba-roots-backup-codes-${activeEmail}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Archivo de códigos descargado');
  };

  const schoolName = activeMembership?.school.name || 'Ceiba Montessori';
  const totpUri = tempSecret ? getTotpUri(activeEmail, tempSecret, schoolName) : '';
  const qrCodeUrl = totpUri ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(totpUri)}&bgcolor=ffffff&color=1b3b2b&margin=1` : '';

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'OWNER': return 'Propietario / Fundador';
      case 'ADMIN': return 'Administrador General';
      case 'TEACHER': return 'Guía / Docente Montessori';
      case 'TUTOR': return 'Tutor / Familiar';
      default: return 'Colaborador';
    }
  };

  const isOwner = role === 'OWNER' || activeMembership?.role === 'OWNER';
  const isOwnerOrAdmin = isOwner || role === 'ADMIN' || activeMembership?.role === 'ADMIN';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">

      {/* 1. HERO BANNER WITH PROFILE OVERVIEW & AVATAR QUICK UPLOAD */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 bg-gradient-to-br from-forest via-[#153424] to-forest-light rounded-none p-6 sm:p-8 md:p-10 text-white shadow-card relative overflow-hidden border-b border-forest-light/20">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-60 h-60 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">

          {/* Left: Avatar & Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-white/25 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-xl overflow-hidden">
                {avatarUrlInput ? (
                  <img
                    src={avatarUrlInput}
                    alt={fullNameInput || activeEmail}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(fullNameInput || activeEmail).charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{getRoleLabel(role)}</span>
                </span>

                {isOwner && isTeachingStaff && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-[11px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                    <span>Docente Activo</span>
                  </span>
                )}

                <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold flex items-center gap-1 ${totpConfig.enabled
                  ? 'bg-teal-500/20 border-teal-400/30 text-teal-200'
                  : 'bg-white/10 border-white/20 text-white/70'
                  }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{totpConfig.enabled ? '2FA Blindado' : '2FA Opcional'}</span>
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                {fullNameInput || 'Mi Cuenta'}
              </h1>

              <div className="flex items-center gap-3 text-white/80 text-xs flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-emerald-300/70" />
                  <span>{activeEmail}</span>
                </span>
                <span className="text-white/40">•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-emerald-300/70" />
                  <span>{schoolName}</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. TAB CONTROLS & CONTENT IN WHITE AREA */}
      <div className="max-w-4xl space-y-6">

        {/* Tab Navigation with Underline Style and Left/Right Scroll Handlers */}
        <div className="relative border-b border-forest/15 flex items-center bg-transparent">
          {/* Left Scroll Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              className="shrink-0 mr-1 p-1 sm:p-1.5 rounded-full bg-white hover:bg-forest/5 text-forest border border-forest/20 transition-all shadow-xs hover:scale-110 active:scale-95 cursor-pointer z-10 -mt-1"
              title="Desplazar pestañas a la izquierda"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Scrollable Tabs Track */}
          <div
            ref={tabsContainerRef}
            className="flex-1 flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap select-none touch-pan-x px-1"
          >
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`pb-3 px-1.5 sm:px-2 text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 border-b-2 cursor-pointer ${activeTab === 'personal'
                ? 'border-forest text-forest font-bold text-sm'
                : 'border-transparent text-muted-foreground hover:text-forest hover:border-forest/30 font-medium'
                }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'personal' ? 'text-forest' : 'text-forest/50'}`} />
              <span>Datos Personales & Foto</span>
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => setActiveTab('teaching')}
                className={`pb-3 px-1.5 sm:px-2 text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 border-b-2 cursor-pointer ${activeTab === 'teaching'
                  ? 'border-forest text-forest font-bold text-sm'
                  : 'border-transparent text-muted-foreground hover:text-forest hover:border-forest/30 font-medium'
                  }`}
              >
                <GraduationCap className={`w-4 h-4 ${activeTab === 'teaching' ? 'text-forest' : 'text-forest/50'}`} />
                <span>Currículum</span>
                {isTeachingStaff && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`pb-3 px-1.5 sm:px-2 text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 border-b-2 cursor-pointer ${activeTab === 'security'
                ? 'border-forest text-forest font-bold text-sm'
                : 'border-transparent text-muted-foreground hover:text-forest hover:border-forest/30 font-medium'
                }`}
            >
              <KeyRound className={`w-4 h-4 ${activeTab === 'security' ? 'text-forest' : 'text-forest/50'}`} />
              <span>Seguridad & Contraseña</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('totp')}
              className={`pb-3 px-1.5 sm:px-2 text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 border-b-2 cursor-pointer ${activeTab === 'totp'
                ? 'border-forest text-forest font-bold text-sm'
                : 'border-transparent text-muted-foreground hover:text-forest hover:border-forest/30 font-medium'
                }`}
            >
              <Smartphone className={`w-4 h-4 ${activeTab === 'totp' ? 'text-forest' : 'text-forest/50'}`} />
              <span>Autenticación en Dos Pasos (2FA)</span>
              {totpConfig.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs" />
              )}
            </button>
          </div>

          {/* Right Scroll Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              className="shrink-0 ml-1 p-1 sm:p-1.5 rounded-full bg-white hover:bg-forest/5 text-forest border border-forest/20 transition-all shadow-xs hover:scale-110 active:scale-95 cursor-pointer z-10 -mt-1"
              title="Desplazar pestañas a la derecha"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DATOS PERSONALES & IDENTIDAD */}
        {/* ========================================================================= */}
        {activeTab === 'personal' && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Main Form */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-forest/10 shadow-sm space-y-6">

              {/* Photo Box Preview inside Form */}
              <div className="p-4 sm:p-5 rounded-2xl bg-forest/5 border border-forest/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-forest/15 shadow-2xs overflow-hidden flex items-center justify-center text-forest font-bold text-xl shrink-0">
                    {avatarUrlInput ? (
                      <img src={avatarUrlInput} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(fullNameInput || activeEmail).charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-forest text-sm">Foto de Perfil</h4>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG o WEBP recomendada en formato cuadrado para avatar y credenciales.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPhotoModalOpen(true)}
                    disabled={updatingAvatar}
                    className="px-4 py-2 bg-white hover:bg-forest/5 text-forest border border-forest/20 rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5 text-forest/70" />
                    <span>{updatingAvatar ? 'Guardando...' : (avatarUrlInput ? 'Cambiar Foto' : 'Subir Foto')}</span>
                  </button>

                  {avatarUrlInput && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={updatingAvatar}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                      title="Quitar foto de perfil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-forest font-bold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-forest/70" />
                      <span>Nombre Completo <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      placeholder="Ej. Allan Rodríguez"
                      className="w-full p-3 rounded-xl border border-forest/20 text-forest bg-white text-xs font-semibold shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest/20"
                    />
                  </div>

                  {/* Email (Read Only) */}
                  <div className="space-y-1.5">
                    <label className="block text-forest font-bold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-forest/70" />
                      <span>Correo Electrónico (Identificador de Acceso)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={activeEmail}
                        className="w-full p-3 rounded-xl border border-forest/10 bg-forest/5 text-forest/70 text-xs font-medium cursor-not-allowed"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-forest/50 uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-forest/10">
                        Inmutable
                      </span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-forest font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-forest/70" />
                      <span>Teléfono Móvil / WhatsApp</span>
                    </label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="Ej. +52 998 123 4567"
                      className="w-full p-3 rounded-xl border border-forest/20 text-forest bg-white text-xs font-mono shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest/20"
                    />
                  </div>

                  {/* Role & School Badge */}
                  <div className="space-y-1.5">
                    <label className="block text-forest font-bold flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-forest/70" />
                      <span>Colegio & Rol Asignado</span>
                    </label>
                    <div className="p-2.5 rounded-xl border border-forest/15 bg-white shadow-2xs flex items-center justify-between">
                      <span className="font-bold text-forest text-xs truncate max-w-[200px]">{schoolName}</span>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-forest/10 text-forest">
                        {getRoleLabel(role)}
                      </span>
                    </div>
                  </div>

                  {/* RFC */}
                  <div className="space-y-1.5">
                    <label className="block text-forest font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-forest/70" />
                      <span>RFC / Identificación Fiscal (Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={rfcInput}
                      onChange={(e) => setRfcInput(e.target.value.toUpperCase())}
                      placeholder="Ej. RODM850101XYZ"
                      className="w-full p-3 rounded-xl border border-forest/20 text-forest bg-white text-xs font-mono shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest/20"
                    />
                  </div>

                  {/* CURP */}
                  <div className="space-y-1.5">
                    <label className="block text-forest font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-forest/70" />
                      <span>CURP / Identificación Nacional (Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={curpInput}
                      onChange={(e) => setCurpInput(e.target.value.toUpperCase())}
                      placeholder="Ej. RODM850101HDFR00"
                      className="w-full p-3 rounded-xl border border-forest/20 text-forest bg-white text-xs font-mono shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest/20"
                    />
                  </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-forest/10">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full sm:w-auto px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-102 active:scale-98 disabled:opacity-50 text-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingProfile ? 'Guardando...' : 'Guardar Datos de Mi Perfil'}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ROL PEDAGÓGICO & DOCENTE (SOLO PARA OWNER) */}
        {/* ========================================================================= */}
        {activeTab === 'teaching' && isOwner && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-emerald-600/20 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Toggle Banner with High Contrast Switch */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border-2 border-emerald-600/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all hover:border-emerald-600/50">
                <div className="space-y-1.5 flex-1">
                  <div className="font-bold text-forest text-base flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-700" />
                    <span>Formar parte del equipo docente en este colegio</span>
                  </div>
                  <p className="text-xs text-forest/80 leading-relaxed">
                    Al activarlo, figurarás en la lista de docentes de <strong>{schoolName}</strong> y podrás asignarte a salones Montessori. Como propietario de la institución, tu usuario es inmutable en la lista y no puede ser eliminado por nadie.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 bg-white/90 p-2 sm:p-2.5 rounded-2xl border border-emerald-600/30 shadow-xs">
                  <span className={`text-xs font-bold transition-colors ${isTeachingStaff ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {isTeachingStaff ? 'Habilitado' : 'Deshabilitado'}
                  </span>

                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isTeachingStaff}
                      disabled={savingTeaching || loadingProfileDetails}
                      onChange={(e) => handleToggleTeachingStaff(e.target.checked)}
                    />
                    <div className="w-14 h-8 bg-slate-300 rounded-full border-2 border-slate-400 peer-checked:bg-emerald-600 peer-checked:border-emerald-700 transition-all duration-300 shadow-inner flex items-center p-0.5 after:content-[''] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:duration-300 after:shadow-md after:border after:border-slate-300 peer-checked:after:translate-x-6 peer-checked:after:border-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Informative helper when active */}
              {isTeachingStaff && (
                <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-300/70 flex items-start gap-4 animate-in fade-in duration-300">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-forest text-sm">
                      Estás activo en el equipo docente de {schoolName}
                    </h4>
                    <p className="text-xs text-forest/80 leading-relaxed">
                      Tu usuario figura en la lista oficial de Guías y Docentes como propietario inmutable. Podés gestionar tu currículum, salones asignados, formación y trayectoria directamente desde la sección <strong>Docentes & Guías</strong> en el menú lateral.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SEGURIDAD & CONTRASEÑA */}
        {/* ========================================================================= */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-forest/10 shadow-sm space-y-5">
              <div className="border-b border-forest/10 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-forest/10 flex items-center justify-center text-forest">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-forest text-lg">Cambiar Contraseña</h3>
                  <p className="text-xs text-muted-foreground">
                    Actualizá tu clave personal periódicamente para mantener tu cuenta protegida.
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5 text-xs max-w-xl">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-forest font-bold flex items-center justify-between">
                    <span>Nueva Contraseña</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Mínimo 6 caracteres</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ingresá tu nueva clave"
                      required
                      className="w-full p-3 pr-10 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/40 hover:text-forest transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-forest font-bold">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Reescribí la misma contraseña"
                      required
                      className="w-full p-3 pr-10 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/40 hover:text-forest transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Real-time Password Rules Checklist */}
                {newPassword && (
                  <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 text-xs space-y-2">
                    <div className="font-bold text-forest text-[11px] uppercase tracking-wider">Validación de Seguridad:</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-700">
                        {newPassword.length >= 6 ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-400 block shrink-0" />
                        )}
                        <span className={newPassword.length >= 6 ? 'text-emerald-700 font-semibold' : ''}>
                          Longitud de al menos 6 caracteres
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        {newPassword === confirmPassword && confirmPassword.length > 0 ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-400 block shrink-0" />
                        )}
                        <span className={newPassword === confirmPassword && confirmPassword.length > 0 ? 'text-emerald-700 font-semibold' : ''}>
                          Ambas contraseñas coinciden
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loadingPass || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                    className="w-full sm:w-auto px-6 py-3 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loadingPass ? 'Guardando...' : 'Actualizar Contraseña'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: AUTENTICACIÓN EN DOS PASOS (TOTP / 2FA) */}
        {/* ========================================================================= */}
        {activeTab === 'totp' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-forest/10 shadow-sm space-y-6">
              <div className="border-b border-forest/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-800 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-forest text-lg">Autenticación en Dos Pasos (TOTP)</h3>
                    <p className="text-xs text-muted-foreground">
                      Protegé tu cuenta con Google Authenticator, Authy, Microsoft Authenticator o 1Password.
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-2xs shrink-0 ${totpConfig.enabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                  {totpConfig.enabled ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2FA Activo y Protegido</span>
                    </>
                  ) : (
                    <span>Inactivo</span>
                  )}
                </span>
              </div>

              {totpConfig.enabled ? (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>Tu cuenta está blindada con verificación de 2 pasos</span>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Al iniciar sesión se te solicitará el código dinámico de 6 dígitos que genera tu aplicación móvil autenticadora.
                    </p>
                    {totpConfig.activatedAt && (
                      <div className="text-[11px] text-emerald-800/80 font-mono pt-1">
                        Activado el: {new Date(totpConfig.activatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setViewBackupModalOpen(true)}
                      className="w-full sm:w-auto py-2.5 px-5 bg-white border border-forest/20 text-forest rounded-xl font-bold text-xs hover:bg-forest/5 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <KeyRound className="w-4 h-4 text-forest/70" />
                      <span>Ver Códigos de Recuperación</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDisableTotp}
                      className="w-full sm:w-auto py-2.5 px-5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs hover:bg-rose-100 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Desactivar 2FA</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    La autenticación TOTP (Time-based One-Time Password) añade una capa adicional de seguridad bancaria al requerir un token temporal de 6 dígitos cada vez que iniciás sesión.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-forest/5 border border-forest/10 space-y-1.5">
                      <div className="font-bold text-forest text-xs flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-forest" />
                        <span>Escaneo Rápido de QR</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Sincronizá tu teléfono en segundos utilizando la cámara de tu app autenticadora.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-forest/5 border border-forest/10 space-y-1.5">
                      <div className="font-bold text-forest text-xs flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-forest" />
                        <span>Códigos de Respaldo</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Descargá códigos de emergencia para ingresar si no tenés tu teléfono disponible.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleStartTotpSetup}
                      className="w-full sm:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Configurar y Activar TOTP (2FA)</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-forest/10 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-forest/70" /> Algoritmo Estándar RFC 6238
                </span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Conexión Segura Cifrada
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* PHOTO UPLOAD MODAL */}
      {/* ========================================================================= */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-forest/10 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-forest/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-forest text-base font-display">Foto de Perfil</h3>
                  <p className="text-[11px] text-muted-foreground">Subí o cambiá tu fotografía personal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <ImageUploadDropzone
                value={avatarUrlInput}
                onChange={async (url) => {
                  await handleUpdateAvatar(url);
                  setPhotoModalOpen(false);
                }}
                label="Fotografía Personal"
                helperText="Arrastrá tu imagen o hacé clic para explorar (PNG, JPG, WEBP)"
                folder="avatars"
                aspectRatio="square"
                maxSizeMB={15}
              />
            </div>

            <div className="pt-3 border-t border-forest/10 flex items-center justify-between gap-2">
              {avatarUrlInput ? (
                <button
                  type="button"
                  onClick={async () => {
                    setPhotoModalOpen(false);
                    await handleRemoveAvatar();
                  }}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Quitar Foto
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setPhotoModalOpen(false)}
                className="px-5 py-2 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOTP 2FA ACTIVATION WIZARD MODAL */}
      {/* ========================================================================= */}
      {totpWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-forest/10 space-y-5 animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-forest/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-800 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-forest text-base font-display">Configuración de Autenticación 2FA</h3>
                  <p className="text-[11px] text-muted-foreground">Paso {totpStep} de 3</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTotpWizardOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: Scan QR & Secret Key */}
            {totpStep === 1 && (
              <div className="space-y-4 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  Abrí tu aplicación autenticadora (Google Authenticator, Authy o Microsoft Authenticator) y escaneá este código QR:
                </p>

                {/* QR Display */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                  <div className="bg-white p-2 rounded-xl border shadow-xs">
                    <img
                      src={qrCodeUrl}
                      alt="Código QR TOTP"
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Escaneá con la cámara de tu app autenticadora
                  </span>
                </div>

                {/* Secret Key Fallback */}
                <div className="space-y-1.5">
                  <label className="block text-forest font-bold text-[11px] uppercase tracking-wider">
                    O ingresá esta clave secreta manualmente:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={tempSecret}
                      className="flex-1 p-2.5 rounded-xl border border-forest/20 bg-forest/5 font-mono text-xs font-bold text-forest tracking-widest text-center"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(tempSecret, 'secret')}
                      className="px-3.5 py-2.5 bg-forest text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:bg-forest/90 transition-all cursor-pointer"
                    >
                      {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedSecret ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-forest/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTotpWizardOpen(false)}
                    className="px-4 py-2.5 text-forest/70 hover:bg-forest/5 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTotpStep(2)}
                    className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <span>Siguiente: Verificar Código</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Verify 6-digit Code */}
            {totpStep === 2 && (
              <form onSubmit={handleVerifyAndActivateTotp} className="space-y-4 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  Ingresá el código de <strong>6 dígitos</strong> que muestra tu app para confirmar la sincronización:
                </p>

                <div className="py-3 flex flex-col items-center justify-center space-y-3">
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-48 p-3 text-center rounded-2xl border-2 border-forest/30 font-mono font-bold text-2xl tracking-[0.5em] text-forest bg-slate-50 focus:outline-none focus:border-forest focus:bg-white transition-all shadow-inner"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    El código se actualiza cada 30 segundos en tu teléfono
                  </span>
                </div>

                <div className="pt-3 border-t border-forest/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setTotpStep(1)}
                    className="px-4 py-2.5 text-forest/70 hover:bg-forest/5 rounded-xl font-semibold cursor-pointer"
                  >
                    Atrás
                  </button>

                  <button
                    type="submit"
                    disabled={verifyingTotp || verificationCode.length !== 6}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {verifyingTotp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                    <span>{verifyingTotp ? 'Verificando...' : 'Verificar y Activar 2FA'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Backup Codes Display */}
            {totpStep === 3 && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>¡Autenticación de Dos Pasos configurada con éxito!</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Guardá tus códigos de recuperación en un lugar seguro. Si perdés acceso a tu teléfono podrás usarlos para entrar.
                  </p>
                </div>

                {/* Codes Grid */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  {tempBackupCodes.map((code, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-lg border text-center font-mono font-bold text-slate-800 text-[11px] select-all">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(tempBackupCodes.join('\n'), 'backup')}
                    className="flex-1 py-2.5 bg-white border border-forest/20 text-forest rounded-xl font-bold text-xs hover:bg-forest/5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedBackup ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBackup ? 'Copiados' : 'Copiar Códigos'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadBackupCodes}
                    className="flex-1 py-2.5 bg-forest/5 border border-forest/20 text-forest rounded-xl font-bold text-xs hover:bg-forest/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar .TXT</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-forest/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setTotpWizardOpen(false)}
                    className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    Entendido y Finalizar
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TO VIEW EXISTING BACKUP CODES */}
      {/* ========================================================================= */}
      {viewBackupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-forest/10 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-forest/10 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-forest" />
                <h3 className="font-bold text-forest text-base font-display">Códigos de Recuperación (2FA)</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewBackupModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Cada código puede utilizarse una sola vez en caso de no tener acceso a tu aplicación autenticadora:
            </p>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              {totpConfig.backupCodes.map((code, idx) => (
                <div key={idx} className="p-2 bg-white rounded-lg border text-center font-mono font-bold text-slate-800 text-[11px] select-all">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(totpConfig.backupCodes.join('\n'), 'backup')}
                className="flex-1 py-2.5 bg-white border border-forest/20 text-forest rounded-xl font-bold text-xs hover:bg-forest/5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedBackup ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBackup ? 'Copiados' : 'Copiar'}</span>
              </button>

              <button
                type="button"
                onClick={downloadBackupCodes}
                className="flex-1 py-2.5 bg-forest/5 border border-forest/20 text-forest rounded-xl font-bold text-xs hover:bg-forest/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .TXT</span>
              </button>
            </div>

            <div className="pt-2 border-t border-forest/10 flex justify-end">
              <button
                type="button"
                onClick={() => setViewBackupModalOpen(false)}
                className="px-5 py-2 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAccountSection;
