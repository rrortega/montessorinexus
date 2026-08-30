import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings, getButtonRadiusClass } from '@/context/SettingsContext';
import {
 FeedItem,
 FeedCommentItem,
 getFeed,
 createFeedPost,
 updateFeedPost,
 deleteFeedPost,
 addFeedComment,
 deleteFeedComment,
 toggleFeedLike,
 voteFeedPoll,
 uploadFeedImages,
 getEnvironments,
 EnvironmentItem,
 getStudents,
 StudentItem,
 getSchools,
 School,
 getGuides,
 GuideUserItem,
 getTutors,
 TutorUserItem,
 getFeedPost
} from '@/lib/sqlite';
import { FeedPostDetailModal } from '@/components/feed/FeedPostDetailModal';
import {
 Rss,
 MessageSquare,
 Heart,
 Image as ImageIcon,
 Trash2,
 Pin,
 Filter,
 Search,
 Sparkles,
 Users,
 GraduationCap,
 Lock,
 AlertTriangle,
 Send,
 MessageCircle,
 Compass,
 Layers,
 Mail,
 Bell,
 CheckCircle2,
 X,
 Loader2,
 Eye,
 Info,
 Calendar,
 Building2,
 ChevronDown,
 ExternalLink,
 Globe,
 School as SchoolIcon,
 Check,
 BarChart2,
 Plus,
 Clock,
 Bot,
 ShieldCheck,
 AtSign,
 Reply,
 ArrowUp
} from 'lucide-react';
import { toast } from 'sonner';
import { getDeepstreamClient } from '@/lib/deepstream';
import { triggerConfetti } from '@/lib/confetti';
import {
  AnimatedReactionIcon,
  REACTION_LIST,
  REACTION_DEFINITIONS
} from '@/components/feed/AnimatedReactionIcons';

export interface AudienceOption {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const AUDIENCE_OPTIONS: AudienceOption[] = [
  {
    id: 'ALL_SCHOOL',
    label: 'Toda la escuela',
    description: 'Visible para directores, guías y familias',
    icon: Globe
  },
  {
    id: 'STAFF_ONLY',
    label: 'Solo equipo docente',
    description: 'Solo directores y personal escolar',
    icon: Lock
  },
  {
    id: 'PARENTS_ONLY',
    label: 'Solo familias',
    description: 'Visible exclusivamente para padres y tutores',
    icon: Users
  },
  {
    id: 'CLASSROOM_ALL',
    label: 'Comunidad de mi salón',
    description: 'Visible para familias y guías del ambiente',
    icon: SchoolIcon
  }
];

const EMOTIONS = REACTION_LIST;

export interface MentionCandidate {
  id: string;
  mentionTag: string;
  displayName: string;
  roleLabel: string;
  type: 'AI_AGENT' | 'GUIDE' | 'TUTOR';
  avatarUrl?: string;
  subtitle?: string;
}

const MentionAutocompleteDropdown: React.FC<{
  candidates: MentionCandidate[];
  query: string;
  selectedIndex: number;
  onSelect: (candidate: MentionCandidate) => void;
}> = ({ candidates, query, selectedIndex, onSelect }) => {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates.slice(0, 8);
    return candidates.filter(c => 
      c.displayName.toLowerCase().includes(q) ||
      c.mentionTag.toLowerCase().includes(q) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [candidates, query]);

  if (filtered.length === 0) {
    return (
      <div className="absolute z-50 bottom-full mb-2 left-0 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-400 text-center animate-in fade-in zoom-in-95 duration-100">
        <p>No se encontraron personas o agentes para "@{query}"</p>
      </div>
    );
  }

  return (
    <div className="absolute z-50 bottom-full mb-2 left-0 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md">
      <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-1">
        <span className="flex items-center gap-1">
          <AtSign className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Mencionar a:</span>
        </span>
        <span className="text-[10px] lowercase font-normal">Click o Enter para elegir</span>
      </div>

      <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
        {filtered.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-slate-900 dark:text-white ring-1 ring-emerald-500/30'
                  : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="relative shrink-0">
                {item.type === 'AI_AGENT' ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                ) : item.avatarUrl ? (
                  <img src={item.avatarUrl} alt={item.displayName} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                    item.type === 'GUIDE' ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}>
                    {item.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.displayName}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold shrink-0 ${
                    item.type === 'AI_AGENT'
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300'
                      : item.type === 'GUIDE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                  }`}>
                    {item.roleLabel}
                  </span>
                </div>
                {item.subtitle && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MentionBadge: React.FC<{
  tag: string;
  candidate?: MentionCandidate | null;
  aiAgentName?: string;
}> = ({ tag, candidate, aiAgentName }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const isAgent = aiAgentName && tag.toLowerCase() === `@${aiAgentName.toLowerCase()}`;

  const updatePosition = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const placeAbove = rect.top > 130;
      setCoords({
        top: placeAbove ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2,
        placeAbove
      });
    }
  }, []);

  const handleOpen = () => {
    updatePosition();
    setShowTooltip(true);
  };

  const handleClose = () => {
    setShowTooltip(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showTooltip) {
      handleClose();
    } else {
      updatePosition();
      setShowTooltip(true);
    }
  };

  useEffect(() => {
    if (!showTooltip) return;
    const handleScrollOrResize = () => {
      updatePosition();
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [showTooltip, updatePosition]);

  return (
    <>
      <span
        className="relative inline-block align-baseline"
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
      >
        <button
          ref={btnRef}
          type="button"
          onClick={handleToggle}
          className={`inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-2xs select-none ${
            isAgent
              ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 hover:shadow-xs'
              : 'bg-emerald-100/90 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:shadow-xs'
          }`}
        >
          {isAgent ? (
            <Bot className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <AtSign className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{tag}</span>
        </button>
      </span>

      {/* Floating Tooltip Portaled to document.body (always on top of every card/container) */}
      {showTooltip && coords && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: coords.placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={handleClose}
          onClick={(e) => e.stopPropagation()}
          className="z-[999999] w-64 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-left animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md pointer-events-auto select-none"
        >
          <div className="flex items-start gap-2.5">
            <div className="shrink-0">
              {candidate?.type === 'AI_AGENT' || isAgent ? (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
              ) : candidate?.avatarUrl ? (
                <img src={candidate.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                  candidate?.type === 'GUIDE' ? 'bg-emerald-600' : 'bg-amber-600'
                }`}>
                  {(candidate?.displayName || tag.replace('@', '')).charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {candidate?.displayName || tag}
                </p>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold shrink-0 ${
                  isAgent || candidate?.type === 'AI_AGENT'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    : candidate?.type === 'GUIDE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {candidate?.roleLabel || (isAgent ? 'Asistente IA' : 'Miembro')}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug font-medium">
                {candidate?.subtitle || (isAgent ? 'Asistente IA Oficial' : 'Miembro de la comunidad')}
              </p>
            </div>
          </div>

          {/* Tooltip Arrow Indicator */}
          {coords.placeAbove ? (
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-slate-900" />
          ) : (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-white dark:border-b-slate-900" />
          )}
        </div>,
        document.body
      )}
    </>
  );
};

const renderContentWithMentionsAndLinks = (
  text: string,
  aiAgentName?: string,
  candidates?: MentionCandidate[]
) => {
  if (!text) return null;
  const tokenRegex = /(https?:\/\/[^\s<>"']+|@[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_]+)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-0.5 break-all"
        >
          <span>{part}</span>
          <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70 ml-0.5" />
        </a>
      );
    }
    if (part.startsWith('@')) {
      const clean = part.replace(/^@/, '').toLowerCase().trim();
      const matched = candidates?.find(c =>
        c.mentionTag.toLowerCase() === part.toLowerCase() ||
        c.displayName.toLowerCase().replace(/\s+/g, '') === clean ||
        c.displayName.toLowerCase().replace(/\s+/g, '').includes(clean)
      );

      return (
        <MentionBadge
          key={i}
          tag={part}
          candidate={matched}
          aiAgentName={aiAgentName}
        />
      );
    }
    return part;
  });
};

const getSeenIdsCache = (schoolId: string): Set<string> => {
  try {
    const raw = localStorage.getItem(`feed_seen_ids_${schoolId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const saveSeenIdsCache = (schoolId: string, ids: string[]) => {
  try {
    const trimmed = ids.slice(0, 500);
    localStorage.setItem(`feed_seen_ids_${schoolId}`, JSON.stringify(trimmed));
  } catch {}
};

function insertPostInOrder(currentPosts: FeedItem[], newPost: FeedItem): FeedItem[] {
  if (currentPosts.some(p => p.id === newPost.id)) {
    return currentPosts.map(p => p.id === newPost.id ? { ...p, ...newPost } : p);
  }
  if (newPost.pinned) {
    return [newPost, ...currentPosts];
  }
  const pinnedPosts = currentPosts.filter(p => p.pinned);
  const unpinnedPosts = currentPosts.filter(p => !p.pinned);
  return [...pinnedPosts, newPost, ...unpinnedPosts];
}

const FeedSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((n) => (
      <div
        key={n}
        className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4 animate-pulse"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="w-32 h-4 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="w-20 h-3 rounded-md bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
          <div className="w-16 h-6 rounded-full bg-slate-100 dark:bg-slate-800/60" />
        </div>

        <div className="space-y-2 pt-1">
          <div className="w-11/12 h-3.5 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="w-4/5 h-3.5 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="w-3/5 h-3.5 rounded-md bg-slate-100 dark:bg-slate-800/60" />
        </div>

        {n === 2 && (
          <div className="aspect-video w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-16 h-7 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
            <div className="w-20 h-7 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
        </div>
      </div>
    ))}
  </div>
);

export const FeedSection: React.FC = () => {
  const { user, userEmail, role, activeMembership } = useAuth();
  const { buttonRadius, brandPrimaryColor, schoolName, settings, schoolLogo } = useSiteSettings();
  const btnRadiusClass = getButtonRadiusClass(buttonRadius);

  const defaultAgentName = schoolName ? schoolName.split(' ')[0].replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '') : 'Ceiba';
  const aiAgentName = settings?.feed_ai_agent_name || defaultAgentName || 'Ceiba';
  const isAiAgentActive = (settings?.feed_ai_agent_enabled === 'true' || settings?.feed_ai_agent_enabled === undefined);

  const superAdminEmail = (import.meta.env.VITE_SUPERADMIN_EMAIL || 'admin@montessorinexus.com').trim().toLowerCase();
  const isGlobalSuperAdmin = user?.email?.toLowerCase() === superAdminEmail;
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN' || isGlobalSuperAdmin;
  const isTeacher = role === 'TEACHER' || role === 'STAFF';
  const isGuide = isTeacher;
  const isTutor = role === 'TUTOR';

  // Feed items state
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [unseenPostIds, setUnseenPostIds] = useState<Set<string>>(new Set());
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  // Post edit state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostContent, setEditingPostContent] = useState<string>('');
  const [isUpdatingPost, setIsUpdatingPost] = useState<boolean>(false);

  // Storage and usage info
  const [storageUsage, setStorageUsage] = useState<any>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  // Filters state
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(activeMembership?.schoolId || '');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dropdown data
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);

  // Post creation state
  const [isPostBoxFocused, setIsPostBoxFocused] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postAudience, setPostAudience] = useState<string>(isTutor ? 'CLASSROOM_ALL' : 'ALL_SCHOOL');
  const [postEnvironmentId, setPostEnvironmentId] = useState<string>('');
  const [postAllowComments, setPostAllowComments] = useState(true);
  const [postPinned, setPostPinned] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Poll state
  const [isPollActive, setIsPollActive] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDurationDays, setPollDurationDays] = useState<number>(3);
  const [votingPoll, setVotingPoll] = useState<Record<string, boolean>>({});

  // Custom Audience & Environment Dropdowns
  const [audienceDropdownOpen, setAudienceDropdownOpen] = useState(false);
  const [environmentDropdownOpen, setEnvironmentDropdownOpen] = useState(false);
  const audienceDropdownRef = React.useRef<HTMLDivElement>(null);
  const environmentDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (audienceDropdownRef.current && !audienceDropdownRef.current.contains(e.target as Node)) {
        setAudienceDropdownOpen(false);
      }
      if (environmentDropdownRef.current && !environmentDropdownRef.current.contains(e.target as Node)) {
        setEnvironmentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open comment box state: map of postId -> boolean
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentAttachedImages, setCommentAttachedImages] = useState<Record<string, string | null>>({});
  const [commentUploadingImages, setCommentUploadingImages] = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [inlineReplyState, setInlineReplyState] = useState<Record<string, {
    commentId: string;
    targetParentId: string;
    authorName: string;
    text: string;
    mediaUrl?: string | null;
    uploadingImage?: boolean;
  } | null>>({});
  const commentFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const replyFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const replyTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const commentTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const handleCommentFileSelect = async (postId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCommentUploadingImages(prev => ({ ...prev, [postId]: true }));
      const res = await uploadFeedImages([file]);
      if (res.urls && res.urls.length > 0) {
        setCommentAttachedImages(prev => ({ ...prev, [postId]: res.urls[0] }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al subir la imagen.');
    } finally {
      setCommentUploadingImages(prev => ({ ...prev, [postId]: false }));
      if (e.target) e.target.value = '';
    }
  };

  const handleReplyFileSelect = async (postId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setInlineReplyState(prev => prev[postId] ? { ...prev[postId]!, uploadingImage: true } : null);
      const res = await uploadFeedImages([file]);
      if (res.urls && res.urls.length > 0) {
        setInlineReplyState(prev => prev[postId] ? { ...prev[postId]!, mediaUrl: res.urls[0], uploadingImage: false } : null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al subir la imagen.');
      setInlineReplyState(prev => prev[postId] ? { ...prev[postId]!, uploadingImage: false } : null);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Focused Post Detail Modal (fullscreen on mobile with pull-down, floating with backdrop on desktop)
  const [modalPost, setModalPost] = useState<FeedItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const openCommentsModal = useCallback((post: FeedItem) => {
    setModalPost(post);
    setIsDetailModalOpen(true);
  }, []);

  const closeCommentsModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setModalPost(null);
    if (window.location.hash) {
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  // Reaction picker hover/focus state: postId
  const [hoveredReactionPostId, setHoveredReactionPostId] = useState<string | null>(null);
  const hoverReactionTimerRef = useRef<Record<string, any>>({});

  const handleReactionMouseEnter = (postId: string) => {
    if (hoverReactionTimerRef.current[postId]) {
      clearTimeout(hoverReactionTimerRef.current[postId]);
      delete hoverReactionTimerRef.current[postId];
    }
    setHoveredReactionPostId(postId);
  };

  const handleReactionMouseLeave = (postId: string) => {
    if (hoverReactionTimerRef.current[postId]) {
      clearTimeout(hoverReactionTimerRef.current[postId]);
    }
    hoverReactionTimerRef.current[postId] = setTimeout(() => {
      setHoveredReactionPostId(prev => (prev === postId ? null : prev));
      delete hoverReactionTimerRef.current[postId];
    }, 280);
  };

  // Image lightbox modal
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  // Custom Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'post' | 'comment';
    postId: string;
    commentId?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load storage usage
  const fetchStorageUsage = useCallback(async () => {
    try {
      setLoadingUsage(true);
      const res = await fetch('/api/schools/current/usage', {
        headers: {
          'x-school-id': activeMembership?.schoolId || '',
          'x-user-email': userEmail || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStorageUsage(data);
      }
    } catch (err) {
      console.warn('Failed to fetch storage usage:', err);
    } finally {
      setLoadingUsage(false);
    }
  }, [activeMembership?.schoolId, userEmail]);

  useEffect(() => {
    fetchStorageUsage();
  }, [fetchStorageUsage]);

  const isStorageFull = Boolean(storageUsage?.storage?.isFull);

  // AI Spelling & Content Quality Moderation Curation Active State
  const isSpellingCurationEnabled = settings?.feed_ai_grammar_curation === 'true' || settings?.feed_ai_grammar_curation === undefined;
  const isCustomAi = settings?.ai_provider_mode === 'custom' || Boolean(settings?.ai_api_key || settings?.openai_api_key) || Boolean(storageUsage?.ai?.isCustom);
  const hasTokensAvailable = isCustomAi || (storageUsage?.ai ? (storageUsage.ai.remaining > 0) : true);
  const showAiCurationNotice = isSpellingCurationEnabled && hasTokensAvailable;

  // Mentions Metadata State (Guides, Tutors, AI Agent)
  const [guides, setGuides] = useState<GuideUserItem[]>([]);
  const [tutors, setTutors] = useState<TutorUserItem[]>([]);

  // Active Mention Popup State
  const [activeMention, setActiveMention] = useState<{
    target: 'post' | 'edit-post' | `comment-${string}`;
    query: string;
    atIndex: number;
    cursorIndex: number;
    selectedIndex: number;
  } | null>(null);

  // Load metadata (schools if superadmin, environments, students, guides, tutors)
  useEffect(() => {
    if (isGlobalSuperAdmin) {
      getSchools().then(s => setAllSchools(s || [])).catch(console.error);
    }
    getEnvironments().then(e => setEnvironments(e || [])).catch(console.error);
    getStudents().then(st => setStudents(st || [])).catch(console.error);
    getGuides().then(g => setGuides(g || [])).catch(console.error);
    getTutors().then(t => setTutors(t || [])).catch(console.error);
  }, [isGlobalSuperAdmin]);

  // Mention candidates combined (AI Agent first, then Guides, then Tutors/Parents)
  const mentionCandidates = useMemo<MentionCandidate[]>(() => {
    const list: MentionCandidate[] = [];

    // 1. AI Agent
    if (isAiAgentActive && aiAgentName) {
        list.push({
          id: 'ai-agent',
          mentionTag: `@${aiAgentName}`,
          displayName: `@${aiAgentName}`,
          subtitle: settings?.feed_ai_agent_role || `Asistente IA Oficial de ${schoolName || 'la comunidad'}`,
          roleLabel: 'Asistente IA',
          type: 'AI_AGENT',
          avatarUrl: schoolLogo || undefined
        });
      }

      // 2. Guides / Staff
      guides.forEach(g => {
        if (g.fullName && g.id !== user?.id) {
          const cleanTag = g.fullName.replace(/\s+/g, '');
          const envNames = g.environments?.map(e => e.name).filter(Boolean);
          const guideSubtitle = envNames && envNames.length > 0
            ? `Guía del ambiente ${envNames.join(', ')}`
            : (g.jobTitle || (g.staffRole ? `Guía (${g.staffRole})` : 'Guía Montessori'));

          list.push({
            id: g.id,
            mentionTag: `@${cleanTag}`,
            displayName: g.fullName,
            subtitle: guideSubtitle,
            roleLabel: 'Guía',
            type: 'GUIDE',
            avatarUrl: g.avatarUrl || undefined
          });
        }
      });

      // 3. Tutors / Parents
      tutors.forEach(t => {
        if (t.fullName && t.id !== user?.id) {
          const cleanTag = t.fullName.replace(/\s+/g, '');
          let tutorSubtitle = 'Familia / Tutor';
          if (t.studentLinks && t.studentLinks.length > 0) {
            const children = t.studentLinks.map(s => s.student?.fullName).filter(Boolean);
            const rel = (t.studentLinks[0]?.relationship || '').toLowerCase();
            let prefix = 'Familia de';
            if (rel.includes('madre') || rel.includes('mamá') || rel.includes('mama') || rel.includes('mother')) {
              prefix = 'Mamá de';
            } else if (rel.includes('padre') || rel.includes('papá') || rel.includes('papa') || rel.includes('father')) {
              prefix = 'Papá de';
            } else if (rel.includes('tutor') || rel.includes('guardian')) {
              prefix = 'Tutor(a) de';
            }
            tutorSubtitle = children.length > 0 ? `${prefix} ${children.join(', ')}` : 'Familia / Tutor';
          }

          list.push({
            id: t.id,
            mentionTag: `@${cleanTag}`,
            displayName: t.fullName,
            subtitle: tutorSubtitle,
            roleLabel: 'Familia',
            type: 'TUTOR',
            avatarUrl: t.avatarUrl || undefined
          });
        }
      });

    return list;
  }, [isAiAgentActive, aiAgentName, schoolLogo, schoolName, settings?.feed_ai_agent_role, guides, tutors, user?.id]);

  // Candidates filtered for Post Creator (disallow AI Agent when poll is active)
  const postMentionCandidates = useMemo(() => {
    if (isPollActive) {
      return mentionCandidates.filter(c => c.type !== 'AI_AGENT');
    }
    return mentionCandidates;
  }, [mentionCandidates, isPollActive]);

  // Rule 3: Check if post content has agent mention when poll is active
  const hasAgentMentionInPollPost = useMemo(() => {
    if (!isPollActive || !aiAgentName) return false;
    const agentRegex = new RegExp(`@${aiAgentName}\\b`, 'i');
    return agentRegex.test(postContent);
  }, [isPollActive, aiAgentName, postContent]);

  // Rule 1: Validation for publishing
  const isPostPublishable = useMemo(() => {
    if (publishing || uploadingFiles) return false;

    // Rule 3: No agent mention in a post with poll
    if (hasAgentMentionInPollPost) return false;

    if (isPollActive) {
      const validOptions = pollOptions.filter(o => o.trim().length > 0);
      if (validOptions.length < 2) return false;
    }

    // Strip mentions, @ symbols, and whitespace
    const strippedText = postContent
      .replace(/@[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_]+/g, '')
      .replace(/@+/g, '')
      .trim();

    // If no photos or poll, stripped text MUST have additional content
    if (previewUrls.length === 0 && !isPollActive) {
      if (!strippedText) return false;
    }

    // If there is a bare @ symbol with no real text
    if (postContent.trim() === '@' || (postContent.includes('@') && !strippedText && previewUrls.length === 0 && !isPollActive)) {
      return false;
    }

    if (postContent.trim() === '' && previewUrls.length === 0 && !isPollActive) {
      return false;
    }

    return true;
  }, [publishing, uploadingFiles, hasAgentMentionInPollPost, isPollActive, pollOptions, postContent, previewUrls.length]);

  // Rule 2: Global Escape key to cancel & clear post creator input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeMention) {
          setActiveMention(null);
          return;
        }
        if (isPostBoxFocused) {
          setPostContent('');
          setPreviewUrls([]);
          setSelectedFiles([]);
          setIsPollActive(false);
          setPollOptions(['', '']);
          setIsPostBoxFocused(false);
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.blur();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMention, isPostBoxFocused]);

  const handleMentionChange = (
    text: string,
    cursorPos: number,
    target: 'post' | 'edit-post' | `comment-${string}`
  ) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const isAtStartOrAfterSpace = lastAtIndex === 0 || /\s/.test(textBeforeCursor[lastAtIndex - 1]);
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      const hasSpaceAfterAt = /\s/.test(textAfterAt);

      if (isAtStartOrAfterSpace && !hasSpaceAfterAt) {
        setActiveMention({
          target,
          query: textAfterAt,
          atIndex: lastAtIndex,
          cursorIndex: cursorPos,
          selectedIndex: 0
        });
        return;
      }
    }
    if (activeMention?.target === target) {
      setActiveMention(null);
    }
  };

  const handleSelectMention = (
    candidate: MentionCandidate,
    currentText: string,
    setText: (newText: string) => void,
    inputElement?: HTMLInputElement | HTMLTextAreaElement | null
  ) => {
    let atIdx = activeMention?.atIndex ?? -1;
    let curIdx = activeMention?.cursorIndex ?? -1;

    if (atIdx === -1 || atIdx >= currentText.length || currentText[atIdx] !== '@') {
      atIdx = currentText.lastIndexOf('@');
      curIdx = atIdx !== -1 ? currentText.length : -1;
    }

    if (atIdx !== -1) {
      const before = currentText.slice(0, atIdx);
      const afterAt = currentText.slice(atIdx + 1);
      const spaceOrEndIndex = afterAt.search(/\s/);
      const after = curIdx !== -1 && curIdx > atIdx
        ? currentText.slice(curIdx)
        : (spaceOrEndIndex !== -1 ? afterAt.slice(spaceOrEndIndex) : '');
      const mentionTag = `${candidate.mentionTag} `;
      const newText = `${before}${mentionTag}${after}`;
      setText(newText);
      setActiveMention(null);

      setTimeout(() => {
        if (inputElement) {
          inputElement.focus();
          const newPos = before.length + mentionTag.length;
          inputElement.setSelectionRange(newPos, newPos);
        }
      }, 20);
    } else {
      const mentionTag = `${candidate.mentionTag} `;
      const newText = currentText ? `${currentText} ${mentionTag}` : mentionTag;
      setText(newText);
      setActiveMention(null);

      setTimeout(() => {
        if (inputElement) {
          inputElement.focus();
          inputElement.setSelectionRange(newText.length, newText.length);
        }
      }, 20);
    }
  };

  const handleMentionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    target: 'post' | 'edit-post' | `comment-${string}`,
    currentText: string,
    setText: (newText: string) => void,
    inputElement?: HTMLInputElement | HTMLTextAreaElement | null,
    onEnterFallback?: () => void
  ) => {
    if (activeMention && activeMention.target === target) {
      const q = activeMention.query.trim().toLowerCase();
      const filtered = mentionCandidates.filter(c =>
        !q ||
        c.displayName.toLowerCase().includes(q) ||
        c.mentionTag.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q))
      ).slice(0, 8);

      if (filtered.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveMention(prev => prev ? {
            ...prev,
            selectedIndex: (prev.selectedIndex + 1) % filtered.length
          } : null);
          return true;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveMention(prev => prev ? {
            ...prev,
            selectedIndex: (prev.selectedIndex - 1 + filtered.length) % filtered.length
          } : null);
          return true;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          const selected = filtered[activeMention.selectedIndex] || filtered[0];
          handleSelectMention(selected, currentText, setText, inputElement);
          return true;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setActiveMention(null);
          return true;
        }
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && onEnterFallback) {
      e.preventDefault();
      onEnterFallback();
      return true;
    }
    return false;
  };

  // Load feed items with LocalStorage seen IDs caching
  const loadFeed = useCallback(async (isRefresh = false, silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const schoolId = isGlobalSuperAdmin ? (selectedSchoolId || undefined) : activeMembership?.schoolId;
      const data = await getFeed({
        schoolId,
        environmentId: selectedEnvironmentId !== 'ALL' ? selectedEnvironmentId : undefined,
        studentId: selectedStudentId !== 'ALL' ? selectedStudentId : undefined,
        type: selectedType !== 'ALL' ? selectedType : undefined,
        search: searchQuery.trim() || undefined
      });

      const items = data.items || [];
      const cacheKey = schoolId || 'default';
      const seenSet = getSeenIdsCache(cacheKey);

      const newUnseen = new Set<string>();
      items.forEach(item => {
        if (!seenSet.has(item.id)) {
          newUnseen.add(item.id);
        }
      });

      setUnseenPostIds(newUnseen);
      setFeedItems(items);

      // Persist seen IDs to LocalStorage
      if (items.length > 0) {
        const allIds = Array.from(new Set([...Array.from(seenSet), ...items.map(i => i.id)]));
        saveSeenIdsCache(cacheKey, allIds);
      }
    } catch (err: any) {
      console.error('Error loading feed:', err);
      if (!silent) toast.error(err.message || 'Error al cargar las publicaciones del muro.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership?.schoolId, isGlobalSuperAdmin, selectedSchoolId, selectedEnvironmentId, selectedStudentId, selectedType, searchQuery]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Realtime Deepstream WebSockets listener for instant live feed updates
  useEffect(() => {
    const currentSchool = isGlobalSuperAdmin ? (selectedSchoolId || activeMembership?.schoolId) : activeMembership?.schoolId;
    if (!currentSchool) return;

    let dsClient: any = null;
    const postCreatedEvent = `feed-post-created:${currentSchool}`;
    const postDeletedEvent = `feed-post-deleted:${currentSchool}`;
    const globalCreatedEvent = `feed-post-created`;
    const globalDeletedEvent = `feed-post-deleted`;

    const handlePostCreated = (payload: any) => {
      if (!payload?.post) return;
      const newPost = payload.post as FeedItem;

      // Check active filters
      if (selectedEnvironmentId !== 'ALL' && newPost.environmentId && newPost.environmentId !== selectedEnvironmentId) {
        return;
      }
      if (selectedType !== 'ALL' && newPost.type !== selectedType) {
        return;
      }

      setFeedItems(prev => {
        if (prev.some(p => p.id === newPost.id)) return prev;
        return insertPostInOrder(prev, newPost);
      });

      // Mark as new in current session
      setUnseenPostIds(prev => new Set(prev).add(newPost.id));

      // Save into seen IDs cache
      const seenSet = getSeenIdsCache(currentSchool);
      seenSet.add(newPost.id);
      saveSeenIdsCache(currentSchool, Array.from(seenSet));

      toast.info(`✨ Nueva publicación de ${newPost.author?.fullName || 'la comunidad'}`, {
        description: newPost.title || (newPost.content.length > 60 ? newPost.content.slice(0, 60) + '...' : newPost.content)
      });
    };

    const handlePostDeleted = (payload: any) => {
      if (!payload?.postId) return;
      setFeedItems(prev => prev.filter(p => p.id !== payload.postId));
    };

    const handlePollVoted = (payload: any) => {
      if (!payload?.postId || !payload?.poll) return;
      setFeedItems(prev => prev.map(p => {
        if (p.id === payload.postId) {
          return {
            ...p,
            poll: payload.poll
          };
        }
        return p;
      }));
    };

    const handlePostModerated = (payload: any) => {
      if (!payload?.postId) return;
      const newStatus = payload.moderationStatus;
      setFeedItems(prev => prev.map(p => {
        if (p.id === payload.postId) {
          return {
            ...p,
            moderationStatus: newStatus,
            moderationReason: payload.moderationReason,
            ...(payload.post ? payload.post : {})
          };
        }
        return p;
      }));

      if (newStatus === 'APPROVED') {
        triggerConfetti();
        toast.success('🎉 ¡Publicación aprobada y publicada en el muro escolar!');
      } else if (newStatus === 'REJECTED') {
        toast.error('⚠️ Tu publicación requiere ajustes por normas de convivencia.');
      }
    };

    const handleCommentModerated = (payload: any) => {
      if (!payload?.postId || !payload?.commentId) return;
      setFeedItems(prev => prev.map(p => {
        if (p.id === payload.postId) {
          return {
            ...p,
            comments: p.comments.map(c => c.id === payload.commentId ? {
              ...c,
              moderationStatus: payload.moderationStatus,
              moderationReason: payload.moderationReason,
              ...(payload.comment ? payload.comment : {})
            } : c)
          };
        }
        return p;
      }));
    };

    const handleCommentCreatedOrUpdated = (payload: any) => {
      if (!payload?.postId || !payload?.comment) return;
      const { postId, comment, action } = payload;
      setFeedItems(prev => prev.map(p => {
        if (p.id === postId) {
          const existingComments = p.comments || [];
          const exists = existingComments.some(c => c.id === comment.id);
          if (exists) {
            return {
              ...p,
              comments: existingComments.map(c => c.id === comment.id ? { ...c, ...comment } : c)
            };
          }
          if (action === 'deleted') {
            return {
              ...p,
              commentsCount: Math.max(0, (p.commentsCount || 1) - 1),
              comments: existingComments.filter(c => c.id !== comment.id)
            };
          }
          return {
            ...p,
            commentsCount: (p.commentsCount || 0) + 1,
            comments: [...existingComments, comment]
          };
        }
        return p;
      }));

      setModalPost(prev => {
        if (prev && prev.id === postId) {
          const existingComments = prev.comments || [];
          const exists = existingComments.some(c => c.id === comment.id);
          if (exists) {
            return {
              ...prev,
              comments: existingComments.map(c => c.id === comment.id ? { ...c, ...comment } : c)
            };
          }
          if (action === 'deleted') {
            return {
              ...prev,
              commentsCount: Math.max(0, (prev.commentsCount || 1) - 1),
              comments: existingComments.filter(c => c.id !== comment.id)
            };
          }
          return {
            ...prev,
            commentsCount: (prev.commentsCount || 0) + 1,
            comments: [...existingComments, comment]
          };
        }
        return prev;
      });
    };

    try {
      dsClient = getDeepstreamClient();
      if (dsClient?.event) {
        dsClient.event.subscribe(postCreatedEvent, handlePostCreated);
        dsClient.event.subscribe(postDeletedEvent, handlePostDeleted);
        dsClient.event.subscribe(`feed-post-poll-voted:${currentSchool}`, handlePollVoted);
        dsClient.event.subscribe('feed-post-poll-voted', handlePollVoted);
        dsClient.event.subscribe(`feed-post-moderated:${currentSchool}`, handlePostModerated);
        dsClient.event.subscribe('feed-post-moderated', handlePostModerated);
        dsClient.event.subscribe(`feed-comment-moderated:${currentSchool}`, handleCommentModerated);
        dsClient.event.subscribe('feed-comment-moderated', handleCommentModerated);
        dsClient.event.subscribe(`feed-post-comment:${currentSchool}`, handleCommentCreatedOrUpdated);
        dsClient.event.subscribe('feed-post-comment', handleCommentCreatedOrUpdated);
        if (isGlobalSuperAdmin) {
          dsClient.event.subscribe(globalCreatedEvent, handlePostCreated);
          dsClient.event.subscribe(globalDeletedEvent, handlePostDeleted);
        }
      }
    } catch (err) {
      console.warn('[DEEPSTREAM FEED SUBSCRIBE WARNING]', err);
    }

    // Silent background sync interval every 25 seconds
    const intervalId = setInterval(() => {
      loadFeed(false, true);
    }, 25000);

    return () => {
      clearInterval(intervalId);
      try {
        if (dsClient?.event) {
          dsClient.event.unsubscribe(postCreatedEvent, handlePostCreated);
          dsClient.event.unsubscribe(postDeletedEvent, handlePostDeleted);
          dsClient.event.unsubscribe(`feed-post-poll-voted:${currentSchool}`, handlePollVoted);
          dsClient.event.unsubscribe('feed-post-poll-voted', handlePollVoted);
          dsClient.event.unsubscribe(`feed-post-moderated:${currentSchool}`, handlePostModerated);
          dsClient.event.unsubscribe('feed-post-moderated', handlePostModerated);
          dsClient.event.unsubscribe(`feed-comment-moderated:${currentSchool}`, handleCommentModerated);
          dsClient.event.unsubscribe('feed-comment-moderated', handleCommentModerated);
          dsClient.event.unsubscribe(`feed-post-comment:${currentSchool}`, handleCommentCreatedOrUpdated);
          dsClient.event.unsubscribe('feed-post-comment', handleCommentCreatedOrUpdated);
          if (isGlobalSuperAdmin) {
            dsClient.event.unsubscribe(globalCreatedEvent, handlePostCreated);
            dsClient.event.unsubscribe(globalDeletedEvent, handlePostDeleted);
          }
        }
      } catch {}
    };
  }, [activeMembership?.schoolId, isGlobalSuperAdmin, selectedSchoolId, selectedEnvironmentId, selectedType, loadFeed]);

  // Deep link post focus & highlight handler (from realtime notification balloon or ?postId= URL param)
  useEffect(() => {
    const handleFocusPost = (e: any) => {
      const { postId, openComments } = e.detail || {};
      if (!postId) return;

      const found = feedItems.find(p => p.id === postId);
      if (openComments && found) {
        openCommentsModal(found);
      } else if (openComments && !found) {
        getFeedPost(postId).then(res => {
          if (res?.post) openCommentsModal(res.post);
        }).catch(() => {});
      }

      setTimeout(() => {
        const el = document.getElementById(`feed-post-${postId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-emerald-500/60', 'ring-offset-4', 'transition-all', 'duration-500');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-emerald-500/60', 'ring-offset-4');
          }, 3500);
        }
      }, 300);
    };

    window.addEventListener('focus-feed-post', handleFocusPost as any);
    return () => window.removeEventListener('focus-feed-post', handleFocusPost as any);
  }, [feedItems, openCommentsModal]);

  // Handle URL hash #:postId or ?postId= on initial mount / hashchange / direct navigation
  useEffect(() => {
    const checkHashAndDeepLink = async () => {
      const hash = window.location.hash;
      const paramPostId = searchParams.get('postId');
      const targetPostId = (hash ? hash.replace(/^#post-|^#/, '') : paramPostId)?.trim();

      if (!targetPostId) return;

      // Check in feedItems
      const found = feedItems.find(p => p.id === targetPostId);
      if (found) {
        openCommentsModal(found);
      } else {
        try {
          const res = await getFeedPost(targetPostId);
          if (res?.post) {
            openCommentsModal(res.post);
          }
        } catch (e) {
          console.warn('Could not load deep-linked post:', e);
        }
      }
    };

    checkHashAndDeepLink();

    const handleHashChange = () => {
      checkHashAndDeepLink();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [searchParams, feedItems, loading, openCommentsModal]);

  // Keep modalPost in sync with feedItems updates (reactions, comments, poll votes)
  useEffect(() => {
    if (modalPost) {
      const updated = feedItems.find(p => p.id === modalPost.id);
      if (updated) {
        setModalPost(updated);
      }
    }
  }, [feedItems, modalPost]);

  // Post edit handlers
  const handleStartEditPost = (post: FeedItem) => {
    setEditingPostId(post.id);
    setEditingPostContent(post.content);
  };

  const handleCancelEditPost = () => {
    setEditingPostId(null);
    setEditingPostContent('');
  };

  const handleSaveEditPost = async (postId: string) => {
    if (!editingPostContent.trim()) {
      toast.error('El contenido no puede estar vacío.');
      return;
    }
    setIsUpdatingPost(true);
    try {
      const res = await updateFeedPost(postId, { content: editingPostContent.trim() });
      if (res.post) {
        setFeedItems(prev => prev.map(p => p.id === postId ? res.post : p));
        toast.success('Publicación actualizada y reenviada a verificación.');
        setEditingPostId(null);
        setEditingPostContent('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la publicación');
    } finally {
      setIsUpdatingPost(false);
    }
  };

  // Handle image selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isStorageFull) {
      toast.error('El colegio ha alcanzado el 100% de su capacidad de almacenamiento. No se pueden subir imágenes.');
      return;
    }

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > 6) {
      toast.error('Puedes adjuntar un máximo de 6 fotos por publicación.');
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const urlToRevoke = prev[index];
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Submit new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) {
      toast.error('Por favor escribe algún contenido para tu publicación.');
      return;
    }

    if (selectedFiles.length > 0 && isStorageFull) {
      toast.error('El colegio ha alcanzado el 100% de su capacidad de almacenamiento. Elimina las fotos para publicar solo texto.');
      return;
    }

    // Poll options validation
    let pollPayload = null;
    if (isPollActive) {
      const cleanOpts = pollOptions.map(o => o.trim()).filter(Boolean);
      if (cleanOpts.length < 2) {
        toast.error('Una encuesta requiere al menos 2 opciones de respuesta.');
        return;
      }
      pollPayload = {
        options: cleanOpts,
        durationDays: pollDurationDays
      };
    }

    try {
      setPublishing(true);
      let mediaUrls: string[] = [];

      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        const uploadResult = await uploadFeedImages(selectedFiles);
        mediaUrls = uploadResult.urls || [];
        setUploadingFiles(false);
      }

      const res = await createFeedPost({
        content: postContent.trim(),
        mediaUrls,
        poll: pollPayload,
        allowComments: postAllowComments,
        targetAudience: postAudience,
        environmentId: postEnvironmentId || undefined,
        pinned: isOwnerOrAdmin ? postPinned : false
      });

      const newPost = res.post;
      if (newPost) {
        setFeedItems(prev => {
          if (prev.some(p => p.id === newPost.id)) return prev;
          return insertPostInOrder(prev, newPost);
        });

        // Mark as unseen in current session
        setUnseenPostIds(prev => new Set(prev).add(newPost.id));

        if (newPost.moderationStatus === 'APPROVED') {
          triggerConfetti();
          toast.success('🎉 ¡Publicado con éxito en el muro escolar!');
        } else {
          toast.info('🛡️ Publicación enviada: verificando integridad...');
        }
      }

      setPostContent('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      setIsPollActive(false);
      setPollOptions(['', '']);
      setPollDurationDays(3);
      setPostPinned(false);
      setIsCreatingPost(false);
      setIsPostBoxFocused(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Update storage usage without full feed reload
      fetchStorageUsage();
    } catch (err: any) {
      console.error('Error creating post:', err);
      toast.error(err.message || 'No se pudo crear la publicación.');
    } finally {
      setPublishing(false);
      setUploadingFiles(false);
    }
  };

  // Vote in Poll Handler
  const handleVotePoll = async (postId: string, optionId: string) => {
    try {
      setVotingPoll(prev => ({ ...prev, [postId]: true }));
      const res = await voteFeedPoll(postId, optionId);
      setFeedItems(prev => prev.map(item => {
        if (item.id === postId) {
          return {
            ...item,
            poll: res.poll
          };
        }
        return item;
      }));
    } catch (err: any) {
      toast.error(err.message || 'No se pudo registrar el voto.');
    } finally {
      setVotingPoll(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Custom Delete Execution Handler (Posts & Comments)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'post') {
        await deleteFeedPost(deleteTarget.postId);
        toast.success('Publicación eliminada correctamente.');
        setFeedItems(prev => prev.filter(p => p.id !== deleteTarget.postId));
        fetchStorageUsage();
      } else if (deleteTarget.type === 'comment' && deleteTarget.commentId) {
        await deleteFeedComment(deleteTarget.commentId);
        setFeedItems(prev => prev.map(item => {
          if (item.id === deleteTarget.postId) {
            return {
              ...item,
              commentsCount: Math.max(0, item.commentsCount - 1),
              comments: (item.comments || []).filter(c => c.id !== deleteTarget.commentId)
            };
          }
          return item;
        }));
        toast.success('Comentario eliminado.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la eliminación.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

 // Handle emotion reactions (toggle or change)
  const handleReaction = async (postId: string, reactionEmoji: string = '❤️') => {
    try {
      setHoveredReactionPostId(null);
      const post = feedItems.find(p => p.id === postId);
      if (!post) return;

      const isSameReaction = post.myReaction === reactionEmoji;
      const nextReaction = isSameReaction ? null : reactionEmoji;
      const nextLiked = Boolean(nextReaction);

      // Optimistic update
      setFeedItems(prev => prev.map(item => {
        if (item.id === postId) {
          const oldSummary = { ...(item.reactionsSummary || {}) };
          if (item.myReaction && oldSummary[item.myReaction]) {
            oldSummary[item.myReaction] = Math.max(0, oldSummary[item.myReaction] - 1);
            if (oldSummary[item.myReaction] === 0) delete oldSummary[item.myReaction];
          }
          if (nextReaction) {
            oldSummary[nextReaction] = (oldSummary[nextReaction] || 0) + 1;
          }

          const newLikesCount = isSameReaction
            ? Math.max(0, item.likesCount - 1)
            : (!item.myReaction ? item.likesCount + 1 : item.likesCount);

          return {
            ...item,
            isLikedByMe: nextLiked,
            myReaction: nextReaction,
            likesCount: newLikesCount,
            reactionsSummary: oldSummary
          };
        }
        return item;
      }));

      const res = await toggleFeedLike(postId, reactionEmoji);
      setFeedItems(prev => prev.map(item => {
        if (item.id === postId) {
          return {
            ...item,
            isLikedByMe: res.liked,
            myReaction: res.myReaction,
            likesCount: res.likesCount,
            reactionsSummary: res.reactionsSummary
          };
        }
        return item;
      }));
    } catch (err: any) {
      console.error('Error toggling reaction:', err);
      toast.error('No se pudo procesar la reacción.');
      loadFeed(true);
    }
  };

  // Toggle comments thread / Open focused modal
  const toggleCommentsDrawer = (postId: string) => {
    const post = feedItems.find(p => p.id === postId);
    if (post) {
      openCommentsModal(post);
    } else {
      setOpenComments(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
    }
  };

  // Submit comment
  const handleAddComment = async (postId: string, isPedagogical = false, customText?: string, parentId?: string | null, customMediaUrl?: string | null) => {
    const text = (customText !== undefined ? customText : (commentInputs[postId] || '')).trim();
    const mediaUrl = customMediaUrl !== undefined ? customMediaUrl : (commentAttachedImages[postId] || null);
    if (!text && !mediaUrl) return;

    const targetParentId = parentId !== undefined ? parentId : (inlineReplyState[postId]?.targetParentId || null);

    try {
      setSubmittingComment(prev => ({ ...prev, [postId]: true }));
      const res = await addFeedComment(postId, {
        content: text,
        mediaUrl: mediaUrl || null,
        isInternalGuideOnly: isPedagogical,
        parentId: targetParentId
      });

      // Update feed item with new comment
      setFeedItems(prev => prev.map(item => {
        if (item.id === postId) {
          return {
            ...item,
            commentsCount: item.commentsCount + 1,
            comments: [...(item.comments || []), res.comment]
          };
        }
        return item;
      }));

      // Update modalPost if open
      setModalPost(prev => {
        if (prev && prev.id === postId) {
          return {
            ...prev,
            commentsCount: (prev.commentsCount || 0) + 1,
            comments: [...(prev.comments || []), res.comment]
          };
        }
        return prev;
      });

      if (customText === undefined) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        setCommentAttachedImages(prev => ({ ...prev, [postId]: null }));
      }
      setInlineReplyState(prev => ({ ...prev, [postId]: null }));
      toast.success('Comentario publicado.');
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar comentario.');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

 // Helper formatting relative time
 const formatTimeAgo = (dateStr: string) => {
 try {
 const date = new Date(dateStr);
 const now = new Date();
 const diffMs = now.getTime() - date.getTime();
 const diffMins = Math.floor(diffMs / (1000 * 60));
 const diffHours = Math.floor(diffMins / 60);
 const diffDays = Math.floor(diffHours / 24);

 if (diffMins < 1) return 'Hace un momento';
 if (diffMins < 60) return `Hace ${diffMins} min`;
 if (diffHours < 24) return `Hace ${diffHours} h`;
 if (diffDays === 1) return 'Ayer';
 if (diffDays < 7) return `Hace ${diffDays} días`;
 return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
 } catch {
 return dateStr;
 }
 };

 // Helper role badge
 const getRoleBadge = (roleName?: string | null, staffRole?: string | null) => {
 switch (roleName) {
 case 'OWNER':
 return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Dirección</span>;
 case 'ADMIN':
 return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Admin</span>;
 case 'TEACHER':
 return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">{staffRole === 'ASSISTANT' ? 'Asistente' : 'Guía Montessori'}</span>;
 case 'STAFF':
 return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">Equipo</span>;
 case 'TUTOR':
 return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Familia</span>;
 default:
 return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Comunidad</span>;
 }
 };

 // Helper type badge
 const getTypeBadge = (type: string) => {
 switch (type) {
 case 'OBSERVATION':
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800">
 <Compass className="w-3 h-3 text-teal-600 dark:text-teal-400" /> Bitácora Montessori
 </span>
 );
 case 'ANNOUNCEMENT':
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
 <Bell className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Aviso Escolar
 </span>
 );
 case 'NEWSLETTER':
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
 <Mail className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Boletín
 </span>
 );
 case 'POLL':
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
 <BarChart2 className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Encuesta
 </span>
 );
 default:
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
 <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Comunidad
 </span>
 );
 }
 };

 return (
 <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 py-6 px-3 sm:px-6 lg:px-8">
 <div className="max-w-4xl mx-auto space-y-6">

        {/* 1. Header Banner & Storage Radar (Desktop only: hidden on mobile) */}
        <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Rss className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Muro Escolar & Feed
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {schoolName || 'Montessori Nexus'} • Actividad en vivo, reflexiones y comunidad
              </p>
            </div>
          </div>

          {/* Storage Quota Alert Bar if 100% full */}
          {isStorageFull && (
            <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-rose-900 dark:text-rose-200">
                <span className="font-semibold">Almacenamiento del colegio al 100% de su capacidad.</span> No es posible subir fotos ni imágenes al muro hasta liberar espacio o mejorar el plan de almacenamiento. Las publicaciones de texto puro siguen habilitadas.
              </div>
            </div>
          )}
        </div>

        {/* Mobile Storage Warning (only when storage is 100% full) */}
        {isStorageFull && (
          <div className="sm:hidden p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200">
              <span className="font-semibold">Almacenamiento al 100%.</span> Solo publicaciones de texto.
            </div>
          </div>
        )}

        {/* 2. Facebook / X.com Style Post Publisher */}
        <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border transition-all duration-200 ${
          isPostBoxFocused || postContent.trim().length > 0 || previewUrls.length > 0
            ? 'border-emerald-500/50 dark:border-emerald-500/40 shadow-md ring-2 ring-emerald-500/10'
            : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}>
          <form onSubmit={handleCreatePost} className="p-3.5 sm:p-4 space-y-3">
            {/* Top Row: User Avatar + Textarea */}
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs ring-2 ring-slate-100 dark:ring-slate-800 mt-0.5">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (user?.fullName || userEmail || 'U').charAt(0).toUpperCase()
                )}
              </div>

              {/* Inputs Area */}
              <div className="flex-1 min-w-0 space-y-2 relative">
                {/* Mention Autocomplete Dropdown */}
                {activeMention?.target === 'post' && (
                  <MentionAutocompleteDropdown
                    candidates={postMentionCandidates}
                    query={activeMention.query}
                    selectedIndex={activeMention.selectedIndex}
                    onSelect={(candidate) => handleSelectMention(candidate, postContent, setPostContent, textareaRef.current)}
                  />
                )}

                {/* Auto-growing Textarea */}
                <textarea
                  ref={textareaRef}
                  value={postContent}
                  onFocus={() => setIsPostBoxFocused(true)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPostContent(val);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(44, e.target.scrollHeight)}px`;
                    handleMentionChange(val, e.target.selectionStart || 0, 'post');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      if (activeMention?.target === 'post') {
                        setActiveMention(null);
                        return;
                      }
                      setPostContent('');
                      setPreviewUrls([]);
                      setSelectedFiles([]);
                      setIsPollActive(false);
                      setPollOptions(['', '']);
                      setIsPostBoxFocused(false);
                      if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto';
                        textareaRef.current.blur();
                      }
                      return;
                    }
                    handleMentionKeyDown(
                      e,
                      'post',
                      postContent,
                      setPostContent,
                      textareaRef.current
                    );
                  }}
                  placeholder={
                    isAiAgentActive
                      ? `¿En qué estás pensando hoy${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}? (Escribe @ para mencionar personas o al Agente IA)`
                      : `¿En qué estás pensando hoy${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}? (Escribe @ para mencionar personas)`
                  }
                  rows={1}
                  className="w-full px-3 py-2 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent border-0 focus:outline-none resize-none overflow-hidden leading-relaxed min-h-[44px]"
                />

                {/* Poll Options Builder (Visible when poll is active) */}
                {isPollActive && (
                  <div className="p-3.5 bg-slate-50/90 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <BarChart2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Opciones de la encuesta</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPollActive(false);
                          setPollOptions(['', '']);
                        }}
                        className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        Quitar encuesta
                      </button>
                    </div>

                    {/* Warning if agent mentioned in poll */}
                    {hasAgentMentionInPollPost && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>No es posible citar al Agente IA en publicaciones con encuesta. Elimina la mención @{aiAgentName} para poder publicar.</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {idx + 1}
                          </div>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...pollOptions];
                              newOpts[idx] = e.target.value;
                              setPollOptions(newOpts);
                            }}
                            placeholder={`Opción ${idx + 1}${idx === 0 ? ' (ej. Sí, de acuerdo)' : idx === 1 ? ' (ej. No, proponer otra fecha)' : ''}`}
                            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            maxLength={80}
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Eliminar opción"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      {pollOptions.length < 5 ? (
                        <button
                          type="button"
                          onClick={() => setPollOptions([...pollOptions, ''])}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar otra opción</span>
                        </button>
                      ) : <div />}

                      {/* Duration Selector */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Duración:</span>
                        <select
                          value={pollDurationDays}
                          onChange={(e) => setPollDurationDays(Number(e.target.value))}
                          className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium text-xs focus:outline-none"
                        >
                          <option value={1}>1 día</option>
                          <option value={3}>3 días</option>
                          <option value={7}>7 días</option>
                          <option value={0}>Sin límite</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Attachment Previews */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <img src={url} alt={`Adjunto ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(idx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-black text-white rounded-full transition-opacity shadow-sm"
                          title="Quitar foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Toolbar & Action Bar (Visible on focus or when content/files exist) */}
            {(isPostBoxFocused || postContent.trim().length > 0 || previewUrls.length > 0 || isPollActive) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* Photo Upload Button */}
                  <label
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-800 cursor-pointer font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all ${
                      isStorageFull ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isStorageFull ? 'Fotos bloqueadas (100%)' : 'Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isStorageFull || publishing}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>

                  {/* Poll Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPollActive(prev => !prev);
                      if (!isPollActive && pollOptions.length < 2) {
                        setPollOptions(['', '']);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all ${
                      isPollActive
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Encuesta</span>
                  </button>

                  {/* Mention School AI Agent Button (Disabled/hidden if poll is active) */}
                  {isAiAgentActive && !isPollActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setPostContent(prev => {
                          const mention = `@${aiAgentName} `;
                          if (prev.includes(`@${aiAgentName}`)) return prev;
                          return prev ? `${prev} ${mention}` : mention;
                        });
                        setIsPostBoxFocused(true);
                        textareaRef.current?.focus();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                      title={`Preguntar o citar al Agente IA (@${aiAgentName})`}
                    >
                      <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Citar @{aiAgentName}</span>
                    </button>
                  )}

                  {/* Custom Target Audience Dropdown */}
                  <div ref={audienceDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setAudienceDropdownOpen(prev => !prev);
                        setEnvironmentDropdownOpen(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors shadow-xs"
                      title="Cambiar visibilidad"
                    >
                      {(() => {
                        const opt = AUDIENCE_OPTIONS.find(o => o.id === postAudience) || AUDIENCE_OPTIONS[0];
                        const Icon = opt.icon;
                        return (
                          <>
                            <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{opt.label}</span>
                            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${audienceDropdownOpen ? 'rotate-180' : ''}`} />
                          </>
                        );
                      })()}
                    </button>

                    {audienceDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-72 p-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          ¿Quién puede ver tu publicación?
                        </div>
                        <div className="space-y-1">
                          {(isTutor
                            ? AUDIENCE_OPTIONS.filter(o => o.id === 'ALL_SCHOOL' || o.id === 'CLASSROOM_ALL')
                            : AUDIENCE_OPTIONS
                          ).map((opt) => {
                            const Icon = opt.icon;
                            const isSelected = postAudience === opt.id;
                            return (
                                  <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setPostAudience(opt.id);
                                  setAudienceDropdownOpen(false);
                                }}
                                className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold flex items-center justify-between">
                                    <span>{opt.label}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                                    {opt.description}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Custom Environment Selector if specific audience */}
                  {(postAudience === 'CLASSROOM_ALL' || postAudience === 'CLASSROOM_PARENTS') && (
                    <div ref={environmentDropdownRef} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setEnvironmentDropdownOpen(prev => !prev);
                          setAudienceDropdownOpen(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors shadow-xs"
                      >
                        <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {environments.find(e => e.id === postEnvironmentId)?.name || 'Seleccionar ambiente'}
                        </span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${environmentDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {environmentDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-60 p-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto">
                          <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Ambiente escolar
                          </div>
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setPostEnvironmentId('');
                                setEnvironmentDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs font-medium transition-colors ${
                                !postEnvironmentId
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span>Todos mis ambientes</span>
                              {!postEnvironmentId && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                            </button>
                            {environments.map(env => (
                              <button
                                key={env.id}
                                type="button"
                                onClick={() => {
                                  setPostEnvironmentId(env.id);
                                  setEnvironmentDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs font-medium transition-colors ${
                                  postEnvironmentId === env.id
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {env.color && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: env.color }} />}
                                  <span className="truncate">{env.name}</span>
                                </div>
                                {postEnvironmentId === env.id && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pin Toggle for Admins/Owners */}
                  {isOwnerOrAdmin && (
                    <label className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border cursor-pointer select-none transition-all text-xs font-semibold ${
                      postPinned
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <input
                        type="checkbox"
                        checked={postPinned}
                        onChange={(e) => setPostPinned(e.target.checked)}
                        className="hidden"
                      />
                      <Pin className={`w-3.5 h-3.5 ${postPinned ? 'text-emerald-600 fill-emerald-600' : ''}`} />
                      <span>{postPinned ? 'Fijado' : 'Fijar'}</span>
                    </label>
                  )}
                </div>

                {/* Right side: Cancel & Post Buttons */}
                <div className="flex items-center justify-end gap-2">
                  {/* Collapse/Clear button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPostContent('');
                      setPostTitle('');
                      setPreviewUrls([]);
                      setSelectedFiles([]);
                      setIsPollActive(false);
                      setPollOptions(['', '']);
                      setIsPostBoxFocused(false);
                      if (textareaRef.current) textareaRef.current.style.height = 'auto';
                    }}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>

                  {/* Publish Button */}
                  <button
                    type="submit"
                    disabled={!isPostPublishable}
                    className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                  >
                    {publishing || uploadingFiles ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publicando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Publicar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* AI Spelling & Content Quality Moderation Notice */}
            {showAiCurationNotice && (
              <div className="pt-2 px-1 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 select-none leading-relaxed">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>La IA revisará y corregirá automáticamente errores ortográficos, gramaticales y contenido inadecuado para preservar la calidad del muro.</span>
                </p>
              </div>
            )}
          </form>
        </div>

 {/* 3. Filter Bar */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-3">
 {/* Type tabs */}
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
 {[
 { id: 'ALL', label: 'Todos', icon: Sparkles },
 { id: 'POST', label: 'Comunidad', icon: MessageSquare },
 { id: 'OBSERVATION', label: 'Bitácoras', icon: Compass },
 { id: 'ANNOUNCEMENT', label: 'Avisos', icon: Bell },
 { id: 'NEWSLETTER', label: 'Boletines', icon: Mail }
 ].map(tab => {
 const Icon = tab.icon;
 const active = selectedType === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setSelectedType(tab.id)}
 className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
 active
 ? 'bg-emerald-600 text-white shadow-sm'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
 }`}
 >
 <Icon className="w-3.5 h-3.5" />
 <span>{tab.label}</span>
 </button>
 );
 })}
 </div>

 {/* Keyword Search */}
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Buscar en el muro..."
 className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
 />
 </div>
 </div>

 {/* Secondary Filters: School (if Superadmin), Classroom, Student */}
 <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
 {isGlobalSuperAdmin && (
 <div className="flex items-center gap-1">
 <Building2 className="w-3.5 h-3.5 text-slate-400" />
 <select
 value={selectedSchoolId}
 onChange={(e) => setSelectedSchoolId(e.target.value)}
 className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
 >
 <option value="">Todas las escuelas</option>
 {allSchools.map(s => (
 <option key={s.id} value={s.id}>{s.name}</option>
 ))}
 </select>
 </div>
 )}

 <div className="flex items-center gap-1">
 <Layers className="w-3.5 h-3.5 text-slate-400" />
 <select
 value={selectedEnvironmentId}
 onChange={(e) => setSelectedEnvironmentId(e.target.value)}
 className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
 >
 <option value="ALL">Todos los ambientes</option>
 {environments.map(env => (
 <option key={env.id} value={env.id}>{env.name}</option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-1">
 <Users className="w-3.5 h-3.5 text-slate-400" />
 <select
 value={selectedStudentId}
 onChange={(e) => setSelectedStudentId(e.target.value)}
 className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
 >
 <option value="ALL">{isTutor ? 'Todos mis hijos' : 'Todos los alumnos'}</option>
 {students.map(st => (
 <option key={st.id} value={st.id}>{st.fullName}</option>
 ))}
 </select>
 </div>
 </div>
 </div>

 {/* 4. Feed Stream */}
 {loading ? (
 <FeedSkeleton />
 ) : feedItems.length === 0 ? (
 <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
 <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
 <Rss className="w-7 h-7" />
 </div>
 <div>
 <h3 className="text-base font-bold text-slate-900 dark:text-white">
 Aún no hay publicaciones con estos filtros
 </h3>
 <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
 Sé el primero en compartir un pensamiento, reflexión o foto con la comunidad escolar.
 </p>
 <button
 onClick={() => {
 setIsPostBoxFocused(true);
 textareaRef.current?.focus();
 }}
 className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all inline-flex items-center gap-2 ${btnRadiusClass} mt-3`}
 >
 <Sparkles className="w-4 h-4" />
 <span>Publicar algo nuevo</span>
 </button>
 </div>
 </div>
 ) : (
 <div className="space-y-5">
 {feedItems.map(post => {
 const commentsOpen = Boolean(openComments[post.id]);
 const isAuthor = user && post.authorId === user.id;
 const canDelete = isAuthor || isOwnerOrAdmin;
 const isPedagogical = post.type === 'OBSERVATION' || post.type === 'PROGRESS';
 const isUnseen = unseenPostIds.has(post.id);

 return (
 <article
 key={post.id}
 id={`feed-post-${post.id}`}
 className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-top-3 ${
 post.pinned
 ? 'border-emerald-500/40 shadow-emerald-500/5'
 : isUnseen
 ? 'border-emerald-400/60 dark:border-emerald-500/40 ring-2 ring-emerald-500/10'
 : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
 }`}
 >
 {/* Pinned Ribbon */}
 {post.pinned && (
 <div className="bg-emerald-50 dark:bg-emerald-950/60 px-4 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 border-b border-emerald-100 dark:border-emerald-900/40">
 <Pin className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-400" />
 <span>Publicación fijada por Dirección</span>
 </div>
 )}

 <div className="p-5 sm:p-6 space-y-4">
 {/* Header: Author + Meta */}
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
 {post.author?.avatarUrl ? (
 <img src={post.author.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
 ) : (
 (post.author?.fullName || 'M').charAt(0).toUpperCase()
 )}
 </div>
 <div>
 <div className="flex flex-wrap items-center gap-1.5">
 <span className="font-bold text-sm text-slate-900 dark:text-white">
 {post.author?.fullName || (post.type === 'ANNOUNCEMENT' ? 'Aviso Institucional' : post.type === 'NEWSLETTER' ? 'Boletín Escolar' : 'Comunidad')}
 </span>
 {getRoleBadge(post.authorRole || (post.type === 'ANNOUNCEMENT' ? 'OWNER' : post.type === 'OBSERVATION' ? 'TEACHER' : null), post.author?.staffRole)}
 </div>
 <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
 <span>{formatTimeAgo(post.createdAt)}</span>
 {post.school?.name && isGlobalSuperAdmin && (
 <>
 <span>•</span>
 <span className="text-slate-600 dark:text-slate-300">{post.school.name}</span>
 </>
 )}
 {post.environment?.name && (
 <>
 <span>•</span>
 <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
 <Layers className="w-3 h-3 text-emerald-600" /> {post.environment.name}
 </span>
 </>
 )}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {isUnseen && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
 ✨ Nuevo
 </span>
 )}
 {post.moderationStatus === 'PENDING_REVIEW' ? (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
 <Clock className="w-3 h-3 text-amber-600 animate-spin" />
 <span>Verificando integridad...</span>
 </span>
 ) : post.moderationStatus === 'APPROVED' ? (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
 <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
 <span>Publicado</span>
 </span>
 ) : null}
 {getTypeBadge(post.type)}

 {canDelete && post.type === 'POST' && (
 <button
 onClick={() => setDeleteTarget({ type: 'post', postId: post.id })}
 className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
 title="Eliminar publicación"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 </div>

 {/* AI Moderation Status: Pending Review Alert */}
 {post.moderationStatus === 'PENDING_REVIEW' && (
 <div className="p-3 bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-pulse shadow-2xs">
 <div className="flex items-center gap-2.5">
 <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
 <div>
 <span className="font-bold block flex items-center gap-1.5">
 <span>Verificando integridad del contenido</span>
 <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
 </span>
 <span className="text-[11px] text-amber-800 dark:text-amber-300 block">
 La IA está validando el contenido para asegurar un ambiente respetuoso antes de mostrarlo a toda la comunidad.
 </span>
 </div>
 </div>
 </div>
 )}

 {/* AI Moderation Status: Rejected Alert with Edit Action */}
 {post.moderationStatus === 'REJECTED' && (
 <div className="p-4 bg-rose-50/90 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 rounded-2xl space-y-3 text-xs text-rose-900 dark:text-rose-200 shadow-2xs">
 <div className="flex items-start gap-2.5">
 <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
 <div className="space-y-1">
 <span className="font-bold text-sm block">Publicación en pausa por normas de convivencia</span>
 <p className="text-rose-800 dark:text-rose-300 leading-relaxed">
 Esta publicación no es visible para la comunidad escolar. Modifica el texto para asegurar el respeto y armonía escolar.
 </p>
 {post.moderationReason && (
 <div className="p-2.5 rounded-xl bg-white dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-[11px] font-medium text-rose-900 dark:text-rose-100">
 <strong>Motivo de la moderación:</strong> {post.moderationReason}
 </div>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2 pt-1 border-t border-rose-200 dark:border-rose-900/50">
 <button
 type="button"
 onClick={() => handleStartEditPost(post)}
 className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
 >
 <span>Modificar publicación</span>
 </button>
 <button
 type="button"
 onClick={() => setDeleteTarget({ type: 'post', postId: post.id })}
 className="px-3 py-1.5 bg-white dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-800 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
 >
 <Trash2 className="w-3.5 h-3.5" />
 <span>Eliminar</span>
 </button>
 </div>
 </div>
 )}

 {/* Student Tag if attached */}
 {post.student && (
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-xs">
 <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center font-bold text-[10px] overflow-hidden">
 {post.student.avatarUrl ? (
 <img src={post.student.avatarUrl} alt="Alumno" className="w-full h-full object-cover" />
 ) : (
 post.student.fullName.charAt(0)
 )}
 </div>
 <span className="font-semibold text-slate-800 dark:text-slate-200">
 Estudiante: {post.student.fullName}
 </span>
 </div>
 )}

 {/* Inline Edit Box or Title & Body Content */}
 {editingPostId === post.id ? (
 <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-emerald-500/40 space-y-3 animate-in fade-in duration-150">
 <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
 Modificar contenido de la publicación:
 </label>
 {activeMention?.target === 'edit-post' && (
 <MentionAutocompleteDropdown
 candidates={mentionCandidates}
 query={activeMention.query}
 selectedIndex={activeMention.selectedIndex}
 onSelect={(candidate) => handleSelectMention(candidate, editingPostContent, setEditingPostContent)}
 />
 )}
 <textarea
 value={editingPostContent}
 onChange={(e) => {
 const val = e.target.value;
 setEditingPostContent(val);
 handleMentionChange(val, e.target.selectionStart || 0, 'edit-post');
 }}
 onKeyDown={(e) => {
 handleMentionKeyDown(
 e,
 'edit-post',
 editingPostContent,
 setEditingPostContent
 );
 }}
 rows={3}
 className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
 />
 <div className="flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={handleCancelEditPost}
 className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl font-bold transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="button"
 disabled={isUpdatingPost}
 onClick={() => handleSaveEditPost(post.id)}
 className="px-4 py-1.5 text-xs bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
 >
 {isUpdatingPost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
 <span>Guardar y reenviar a revisión</span>
 </button>
 </div>
 </div>
 ) : (
 <div className="space-y-2.5">
 {post.title && (
 <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
 {post.title}
 </h2>
 )}
 <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
 {renderContentWithMentionsAndLinks(post.content, aiAgentName, mentionCandidates)}
 </div>
 </div>
 )}

 {/* OpenGraph Link Preview Card */}
 {post.linkPreview && post.linkPreview.url && (
 <a
 href={post.linkPreview.url}
 target="_blank"
 rel="noopener noreferrer"
 className="group block rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100/90 dark:hover:bg-slate-800/80 transition-all shadow-2xs"
 >
 {post.linkPreview.image && (
 <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800">
 <img
 src={post.linkPreview.image}
 alt={post.linkPreview.title || 'Vista previa'}
 className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
 loading="lazy"
 onError={(e) => {
 (e.target as HTMLElement).style.display = 'none';
 }}
 />
 </div>
 )}
 <div className="p-3.5 space-y-1">
 {post.linkPreview.domain && (
 <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
 <ExternalLink className="w-3 h-3" />
 <span>{post.linkPreview.domain}</span>
 </div>
 )}
 {post.linkPreview.title && (
 <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
 {post.linkPreview.title}
 </h4>
 )}
 {post.linkPreview.description && (
 <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
 {post.linkPreview.description}
 </p>
 )}
 </div>
 </a>
 )}

 {/* Media Photo Gallery */}
 {(() => {
 const gallery = Array.isArray(post.mediaUrls)
 ? (post.linkPreview?.image ? post.mediaUrls.filter(u => u !== post.linkPreview?.image) : post.mediaUrls)
 : [];
 if (gallery.length === 0) return null;

 return (
 <div className={`grid gap-2 pt-1 ${
 gallery.length === 1
 ? 'grid-cols-1'
 : gallery.length === 2
 ? 'grid-cols-2'
 : 'grid-cols-2 sm:grid-cols-3'
 }`}>
 {gallery.map((url, idx) => (
 <div
 key={idx}
 onClick={() => setActiveLightboxImg(url)}
 className="group relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video cursor-pointer border border-slate-200/80 dark:border-slate-700"
 >
 <img
 src={url}
 alt="Foto del muro"
 className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
 loading="lazy"
 />
 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
 <Eye className="w-5 h-5" />
 </div>
 </div>
 ))}
 </div>
 );
 })()}

 {/* Interactive Poll Card */}
 {post.poll && Array.isArray(post.poll.options) && (
 <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
 <div className="space-y-2">
 {post.poll.options.map((opt) => {
 const isSelected = post.poll?.myVotedOptionIds?.includes(opt.id);
 const showResults = post.poll?.hasVoted || post.poll?.isClosed || (user && post.authorId === user.id);
 const percentage = opt.percentage || 0;

 return (
 <button
 key={opt.id}
 type="button"
 disabled={votingPoll[post.id] || post.poll?.isClosed}
 onClick={() => handleVotePoll(post.id, opt.id)}
 className={`w-full text-left relative overflow-hidden rounded-xl border p-3 transition-all ${
 isSelected
 ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500/30'
 : 'border-slate-200 dark:border-slate-700/80 hover:border-emerald-400/60 dark:hover:border-emerald-500/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
 }`}
 >
 {/* Percentage Bar Fill */}
 {showResults && (
 <div
 className={`absolute inset-y-0 left-0 transition-all duration-500 ${
 isSelected
 ? 'bg-emerald-500/20 dark:bg-emerald-500/30'
 : 'bg-slate-200/60 dark:bg-slate-800/80'
 }`}
 style={{ width: `${percentage}%` }}
 />
 )}

 <div className="relative z-10 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
 isSelected
 ? 'border-emerald-600 bg-emerald-600 text-white'
 : 'border-slate-300 dark:border-slate-600 bg-transparent'
 }`}>
 {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
 </div>
 <span className="truncate">{opt.text}</span>
 </div>

 {showResults && (
 <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-slate-600 dark:text-slate-400">
 <span>{percentage}%</span>
 <span className="text-[11px] font-normal text-slate-400">({opt.votesCount || 0})</span>
 </div>
 )}
 </div>
 </button>
 );
 })}
 </div>

 {/* Poll Footer Summary */}
 <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-1">
 <div className="flex items-center gap-1.5 font-medium">
 <BarChart2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
 <span>{post.poll.totalVotes || 0} {post.poll.totalVotes === 1 ? 'voto' : 'votos'}</span>
 <span>•</span>
 <span>{post.poll.isClosed ? 'Encuesta finalizada' : 'Encuesta activa'}</span>
 </div>
 {post.poll.expiresAt && !post.poll.isClosed && (
 <span className="text-[11px] font-medium">Cierra pronto</span>
 )}
 </div>
 </div>
 )}

 {/* Action Bar (Reactions with Emotions + Comments) */}
 <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
 <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Emotion Reaction Button & Picker */}
      <div
        className="relative inline-flex items-center"
        onMouseEnter={() => handleReactionMouseEnter(post.id)}
        onMouseLeave={() => handleReactionMouseLeave(post.id)}
      >
        {/* Emotion reactions popup flyout with continuous hover bridge */}
        {hoveredReactionPostId === post.id && (
          <div
            className="absolute bottom-full left-0 pb-2 z-40 pointer-events-auto"
            onMouseEnter={() => handleReactionMouseEnter(post.id)}
            onMouseLeave={() => handleReactionMouseLeave(post.id)}
          >
            <div className="flex items-center gap-1.5 p-1.5 bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 backdrop-blur-md animate-in fade-in zoom-in-90 duration-150">
              {EMOTIONS.map(em => (
                <button
                  key={em.key}
                  type="button"
                  onClick={() => {
                    handleReaction(post.id, em.key);
                    setHoveredReactionPostId(null);
                  }}
                  className={`group relative p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    post.myReaction === em.key
                      ? 'bg-slate-100 dark:bg-slate-800 scale-110 ring-1 ring-slate-300 dark:ring-slate-700'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-125'
                  }`}
                  title={em.label}
                >
                  <AnimatedReactionIcon
                    reaction={em.key}
                    size={24}
                    isSelected={post.myReaction === em.key}
                  />
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-40">
                    {em.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

 <button
 type="button"
 onClick={() => handleReaction(post.id, post.myReaction || '❤️')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
 post.isLikedByMe
 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 font-semibold'
 : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
 }`}
 >
 <AnimatedReactionIcon
 reaction={post.myReaction || '❤️'}
 size={18}
 isSelected={post.isLikedByMe}
 />
 <span>{post.likesCount || 0}</span>
 </button>
 </div>

 {/* Summary chips of reactions */}
 {post.reactionsSummary && Object.entries(post.reactionsSummary).length > 0 && (
 <div className="flex items-center gap-1.5">
 {Object.entries(post.reactionsSummary).map(([emoji, count]) => (
 <button
 key={emoji}
 type="button"
 onClick={() => handleReaction(post.id, emoji)}
 className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all cursor-pointer ${
 post.myReaction === emoji
 ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-700 dark:text-emerald-200 font-bold shadow-xs scale-105'
 : 'bg-slate-50 border-slate-200/80 dark:bg-slate-800/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
 }`}
 title={`Reaccionar`}
 >
 <AnimatedReactionIcon reaction={emoji} size={15} isSelected={post.myReaction === emoji} />
 <span className="text-[11px] font-bold">{count}</span>
 </button>
 ))}
 </div>
 )}

 {/* Comment toggle button */}
 <button
 type="button"
 onClick={() => toggleCommentsDrawer(post.id)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium transition-colors"
 >
 <MessageCircle className="w-4 h-4" />
 <span>{post.commentsCount || (post.comments?.length) || 0}</span>
 </button>
 </div>
 </div>

 {/* 5. Comments Thread Drawer */}
 {commentsOpen && (
 <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
 {/* Notice for parents on pedagogical records */}
 {isPedagogical && isTutor && (
 <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
 <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
 <span>
 Los registros de bitácora y seguimiento pedagógico son informativos para las familias. Para no incidir en el juicio evaluativo de la guía, las notas y comentarios en esta sección están reservados exclusivamente para el equipo docente y dirección.
 </span>
 </div>
 )}

 {/* Existing comments list */}
 {post.comments && post.comments.length > 0 ? (
 <div className="space-y-3.5">
 {(() => {
 const map = new Map<string, any>();
 post.comments.forEach(c => map.set(c.id, { ...c, replies: [] }));
 const roots: any[] = [];
 post.comments.forEach(c => {
 const item = map.get(c.id)!;
 if (c.parentId && map.has(c.parentId)) {
 map.get(c.parentId)!.replies.push(item);
 } else {
 roots.push(item);
 }
 });

 const renderSingleComment = (c: any, isReply = false) => {
 const canDeleteComment = isOwnerOrAdmin || (user && c.authorId === user.id);
 const isAiComment = Boolean(c.isAiAgent);
 const authorName = isAiComment ? (c.aiAgentName || `@${aiAgentName}`) : (c.author?.fullName || 'Miembro de la comunidad');

 return (
 <div key={c.id} className="group relative flex items-start gap-2.5 text-xs">
 <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden mt-0.5 ${
 isAiComment
 ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 ring-1.5 ring-indigo-300 dark:ring-indigo-700 shadow-2xs'
 : c.isInternalGuideOnly ? 'bg-amber-600' : 'bg-emerald-600'
 }`}>
 {isAiComment ? (
 c.aiAgentAvatar ? (
 <img src={c.aiAgentAvatar} alt="AI Avatar" className="w-full h-full object-cover" />
 ) : (
 <Bot className="w-4 h-4 text-white" />
 )
 ) : c.author?.avatarUrl ? (
 <img src={c.author.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
 ) : (
 (c.author?.fullName || 'U').charAt(0).toUpperCase()
 )}
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-1.5 leading-none">
 <span className="font-semibold text-slate-900 dark:text-white">
 {authorName}
 </span>
 {isAiComment ? (
 <span className="inline-flex items-center gap-0.5 text-[9px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold px-1.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60">
 <Sparkles className="w-2 h-2 text-indigo-500" /> Asistente IA
 </span>
 ) : (
 getRoleBadge(c.authorRole, c.author?.staffRole)
 )}
 {c.isInternalGuideOnly && (
 <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-semibold border border-amber-200 dark:border-amber-800/60">
 <Lock className="w-2 h-2" /> Nota interna
 </span>
 )}
 {c.moderationStatus === 'PENDING_REVIEW' && (
 <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-md font-medium animate-pulse">
 <Clock className="w-2 h-2" /> En revisión
 </span>
 )}
 {c.moderationStatus === 'REJECTED' && (
 <span className="inline-flex items-center gap-1 text-[9px] bg-rose-50 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded-md font-medium">
 <AlertTriangle className="w-2 h-2" /> En pausa por normas
 </span>
 )}
 <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-0.5">
 • {formatTimeAgo(c.createdAt)}
 </span>
 </div>

 <p className="mt-1 whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-200">
 {renderContentWithMentionsAndLinks(c.content, aiAgentName, mentionCandidates)}
 </p>

 {/* Comment Attached Image */}
 {c.mediaUrl && (
 <div className="mt-2">
 <img
 src={c.mediaUrl}
 alt="Adjunto"
 className="rounded-xl max-h-52 max-w-full sm:max-w-xs object-cover border border-slate-200 dark:border-slate-800 shadow-2xs hover:opacity-95 transition-opacity cursor-pointer"
 onClick={() => handleOpenLightbox(c.mediaUrl!)}
 />
 </div>
 )}

 {c.moderationStatus === 'REJECTED' && c.moderationReason && (
 <div className="mt-1 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 text-[11px] font-medium flex items-center gap-1.5">
 <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
 <span>Motivo: {c.moderationReason}</span>
 </div>
 )}

 <div className="flex items-center gap-3 mt-1 text-[11px]">
 <button
 type="button"
 onClick={() => {
 setInlineReplyState(prev => ({
 ...prev,
 [post.id]: {
 commentId: c.id,
 targetParentId: isReply ? (c.parentId || c.id) : c.id,
 authorName,
 text: '',
 mediaUrl: null,
 uploadingImage: false
 }
 }));
 }}
 className="font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer py-0.5"
 >
 <Reply className="w-3 h-3" />
 <span>Responder</span>
 </button>

 {canDeleteComment && (
 <button
 onClick={() => setDeleteTarget({ type: 'comment', postId: post.id, commentId: c.id })}
 className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer py-0.5 opacity-0 group-hover:opacity-100"
 title="Eliminar comentario"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 {/* Inline Reply input right beneath this comment */}
 {inlineReplyState[post.id]?.commentId === c.id && (
 <div className="mt-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
 <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold px-1">
 <span className="flex items-center gap-1">
 <Reply className="w-3 h-3 text-emerald-600" /> Respondiendo a <strong>{authorName}</strong>
 </span>
 <button
 type="button"
 onClick={() => setInlineReplyState(prev => ({ ...prev, [post.id]: null }))}
 className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer text-[10px]"
 >
 Cancelar
 </button>
 </div>

 {activeMention?.target === `reply-${c.id}` && (
 <MentionAutocompleteDropdown
 candidates={mentionCandidates}
 query={activeMention.query}
 selectedIndex={activeMention.selectedIndex}
 onSelect={(candidate) =>
 handleSelectMention(
 candidate,
 inlineReplyState[post.id]?.text || '',
 (newVal) => setInlineReplyState(prev => ({
 ...prev,
 [post.id]: prev[post.id] ? { ...prev[post.id]!, text: newVal } : null
 })),
 replyTextareaRefs.current[`reply-${c.id}`]
 )
 }
 />
 )}

 <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all p-2 shadow-2xs">
 {/* Attached Photo Preview inside textarea container */}
 {inlineReplyState[post.id]?.mediaUrl && (
 <div className="relative inline-block mb-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
 <img
 src={inlineReplyState[post.id]!.mediaUrl!}
 alt="Adjunto"
 className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
 />
 <button
 type="button"
 onClick={() => setInlineReplyState(prev => prev[post.id] ? { ...prev[post.id]!, mediaUrl: null } : null)}
 className="absolute -top-1.5 -right-1.5 p-0.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full shadow-sm cursor-pointer"
 title="Quitar foto"
 >
 <X className="w-3 h-3" />
 </button>
 </div>
 )}

 <textarea
 ref={el => { replyTextareaRefs.current[`reply-${c.id}`] = el; }}
 rows={1}
 value={inlineReplyState[post.id]?.text || ''}
 onChange={(e) => {
 const val = e.target.value;
 setInlineReplyState(prev => ({
 ...prev,
 [post.id]: prev[post.id] ? { ...prev[post.id]!, text: val } : null
 }));
 handleMentionChange(val, e.target.selectionStart || 0, `reply-${c.id}`);
 }}
 onKeyDown={(e) => {
 handleMentionKeyDown(
 e,
 `reply-${c.id}`,
 inlineReplyState[post.id]?.text || '',
 (newVal) => setInlineReplyState(prev => ({
 ...prev,
 [post.id]: prev[post.id] ? { ...prev[post.id]!, text: newVal } : null
 })),
 replyTextareaRefs.current[`reply-${c.id}`],
 () => {
 const currentReply = inlineReplyState[post.id];
 if (currentReply?.text.trim() || currentReply?.mediaUrl) {
 handleAddComment(post.id, isPedagogical, currentReply.text.trim(), currentReply.targetParentId, currentReply.mediaUrl);
 }
 }
 );
 }}
 placeholder={`Escribe una respuesta a ${authorName}...`}
 className="w-full resize-none bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none max-h-32 min-h-[30px] py-0.5 px-1"
 autoFocus
 />

 <input
 ref={el => { replyFileInputRefs.current[`reply-${c.id}`] = el; }}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={(e) => handleReplyFileSelect(post.id, e)}
 />

 <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 mt-1">
 <button
 type="button"
 onClick={() => replyFileInputRefs.current[`reply-${c.id}`]?.click()}
 disabled={inlineReplyState[post.id]?.uploadingImage}
 className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
 title="Adjuntar foto"
 >
 {inlineReplyState[post.id]?.uploadingImage ? (
 <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
 ) : (
 <ImageIcon className="w-4 h-4" />
 )}
 </button>

 <button
 type="button"
 onClick={() => {
 const currentReply = inlineReplyState[post.id];
 if (currentReply?.text.trim() || currentReply?.mediaUrl) {
 handleAddComment(post.id, isPedagogical, currentReply.text.trim(), currentReply.targetParentId, currentReply.mediaUrl);
 }
 }}
 disabled={
 submittingComment[post.id] ||
 inlineReplyState[post.id]?.uploadingImage ||
 (!inlineReplyState[post.id]?.text.trim() && !inlineReplyState[post.id]?.mediaUrl)
 }
 className="p-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white rounded-full transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
 title="Enviar respuesta"
 >
 <ArrowUp className="w-3.5 h-3.5" />
 </button>
 </div>
 {showAiCurationNotice && (
  <p className="text-[10.5px] text-slate-400 dark:text-slate-500 flex items-center gap-1 pt-1.5 px-0.5 select-none leading-tight border-t border-slate-100 dark:border-slate-800/60 mt-1">
    <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
    <span>La IA revisará y corregirá la ortografía y el contenido al responder.</span>
  </p>
 )}
 </div>
 </div>
 )}
 </div>
 </div>
 );
 };

 return roots.map(rootComment => (
 <div key={rootComment.id} className="space-y-2">
 {renderSingleComment(rootComment, false)}
 {rootComment.replies && rootComment.replies.length > 0 && (
 <div className="ml-5 sm:ml-7 pl-3 sm:pl-3.5 border-l-2 border-slate-200/90 dark:border-slate-800 space-y-2.5 pt-1 pb-0.5">
 {rootComment.replies.map((reply: any) => renderSingleComment(reply, true))}
 </div>
 )}
 </div>
 ));
 })()}
 </div>
 ) : (
 <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
 No hay comentarios aún.
 </p>
 )}

 {/* Add comment input box */}
 {((!isPedagogical && post.allowComments) || (isPedagogical && !isTutor)) ? (
 <div className="space-y-1.5 pt-2 relative">
 {/* Mention Autocomplete Dropdown for this post's comment */}
 {activeMention?.target === `comment-${post.id}` && (
 <MentionAutocompleteDropdown
 candidates={mentionCandidates}
 query={activeMention.query}
 selectedIndex={activeMention.selectedIndex}
 onSelect={(candidate) =>
 handleSelectMention(
 candidate,
 commentInputs[post.id] || '',
 (newVal) => setCommentInputs(prev => ({ ...prev, [post.id]: newVal })),
 commentTextareaRefs.current[`comment-${post.id}`]
 )
 }
 />
 )}
 
 {/* Unified Textarea Container for Main Comment */}
 <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-950 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all p-2 shadow-2xs">
 {/* Attached Photo Preview inside comment container */}
 {commentAttachedImages[post.id] && (
 <div className="relative inline-block mb-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
 <img
 src={commentAttachedImages[post.id]!}
 alt="Adjunto"
 className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
 />
 <button
 type="button"
 onClick={() => setCommentAttachedImages(prev => ({ ...prev, [post.id]: null }))}
 className="absolute -top-1.5 -right-1.5 p-0.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full shadow-sm cursor-pointer"
 title="Quitar foto"
 >
 <X className="w-3 h-3" />
 </button>
 </div>
 )}

 <textarea
 ref={el => { commentTextareaRefs.current[`comment-${post.id}`] = el; }}
 rows={1}
 value={commentInputs[post.id] || ''}
 onChange={(e) => {
 const val = e.target.value;
 setCommentInputs(prev => ({ ...prev, [post.id]: val }));
 handleMentionChange(val, e.target.selectionStart || 0, `comment-${post.id}`);
 }}
 onKeyDown={(e) => {
 handleMentionKeyDown(
 e,
 `comment-${post.id}`,
 commentInputs[post.id] || '',
 (newVal) => setCommentInputs(prev => ({ ...prev, [post.id]: newVal })),
 commentTextareaRefs.current[`comment-${post.id}`],
 () => handleAddComment(post.id, isPedagogical)
 );
 }}
 placeholder={
 isPedagogical
 ? 'Agregar nota interna de seguimiento pedagógico...'
 : isAiAgentActive && aiAgentName
 ? `Escribe un comentario (@ para citar a @${aiAgentName}, guías o familias)...`
 : 'Escribe un comentario (@ para citar a guías o familias)...'
 }
 className="w-full resize-none bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none max-h-32 min-h-[30px] py-0.5 px-1"
 />

 <input
 ref={el => { commentFileInputRefs.current[post.id] = el; }}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={(e) => handleCommentFileSelect(post.id, e)}
 />

 <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 mt-1">
 <button
 type="button"
 onClick={() => commentFileInputRefs.current[post.id]?.click()}
 disabled={commentUploadingImages[post.id]}
 className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
 title="Adjuntar foto"
 >
 {commentUploadingImages[post.id] ? (
 <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
 ) : (
 <ImageIcon className="w-4 h-4" />
 )}
 </button>

 <button
 type="button"
 onClick={() => handleAddComment(post.id, isPedagogical)}
 disabled={
 submittingComment[post.id] ||
 commentUploadingImages[post.id] ||
 (!(commentInputs[post.id] || '').trim() && !commentAttachedImages[post.id])
 }
 className="p-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white rounded-full transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
 title="Enviar comentario"
 >
 <ArrowUp className="w-3.5 h-3.5" />
 </button>
 </div>

 {showAiCurationNotice && (
 <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 pt-1.5 px-0.5 select-none leading-tight border-t border-slate-200/60 dark:border-slate-800/60 mt-1">
 <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
 <span>La IA revisará y corregirá automáticamente la ortografía y el contenido para mantener la calidad del muro.</span>
 </p>
 )}
 </div>

 {/* AI Agent Quick Mention Pill in Comments */}
 {isAiAgentActive && !isPedagogical && (
 <div className="flex items-center justify-between px-1">
 <button
 type="button"
 onClick={() => {
 setCommentInputs(prev => {
 const cur = prev[post.id] || '';
 const mention = `@${aiAgentName} `;
 if (cur.includes(`@${aiAgentName}`)) return prev;
 return { ...prev, [post.id]: cur ? `${cur} ${mention}` : mention };
 });
 }}
 className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
 >
 <Bot className="w-3 h-3" />
 <span>Citar a @{aiAgentName} para respuesta del Agente IA</span>
 </button>
 </div>
 )}
 </div>
 ) : !post.allowComments && !isPedagogical ? (
 <p className="text-xs text-slate-400 dark:text-slate-500 italic">
 Los comentarios están desactivados en esta publicación.
 </p>
 ) : null}
 </div>
 )}
 </div>
 </article>
 );
 })}
 </div>
 )}

 </div>

 
      {/* Custom Delete Confirmation Modal (Rendered in Portal with z-[100001] to stay above any detail modal) */}
      {deleteTarget && createPortal(
        <div 
          onClick={() => !isDeleting && setDeleteTarget(null)}
          className="fixed inset-0 z-[100001] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {deleteTarget.type === 'post' ? '¿Eliminar publicación?' : '¿Eliminar comentario?'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {deleteTarget.type === 'post'
                    ? 'Esta acción eliminará la publicación de forma permanente para toda la comunidad escolar y liberará el almacenamiento asociado.'
                    : 'Esta acción no se puede deshacer. El comentario será eliminado del muro permanentemente.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors ${btnRadiusClass} cursor-pointer`}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm inline-flex items-center gap-2 ${btnRadiusClass} cursor-pointer`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 6. Lightbox Modal */}
      {activeLightboxImg && createPortal(
        <div
          onClick={() => setActiveLightboxImg(null)}
          className="fixed inset-0 z-[100002] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeLightboxImg}
              alt="Foto ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setActiveLightboxImg(null)}
              className="absolute -top-4 -right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 7. Focused Post Detail Modal (Full viewport height, mobile pull-down drawer with adaptive header curves, Esc & back sync) */}
      <FeedPostDetailModal
        post={modalPost}
        isOpen={isDetailModalOpen}
        onClose={closeCommentsModal}
        user={user}
        isOwnerOrAdmin={isOwnerOrAdmin}
        isTutor={isTutor}
        isGuide={isGuide}
        aiAgentName={aiAgentName}
        mentionCandidates={mentionCandidates}
        onReaction={handleReaction}
        onAddComment={handleAddComment}
        onDeleteComment={(postId, commentId) => {
          setDeleteTarget({ type: 'comment', postId, commentId });
        }}
        onVotePoll={handleVotePoll}
        onOpenLightbox={img => setActiveLightboxImg(img)}
        renderMentionsAndLinks={renderContentWithMentionsAndLinks}
        formatTimeAgo={formatTimeAgo}
        showAiCurationNotice={showAiCurationNotice}
      />
    </div>
 );
};
