import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
  X,
  ArrowUp,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Pin,
  Bot,
  Sparkles,
  Lock,
  Trash2,
  ChevronDown,
  Info,
  Reply
} from 'lucide-react';
import { toast } from 'sonner';
import { FeedItem, FeedCommentItem, uploadFeedImages } from '@/lib/sqlite';
import {
  AnimatedReactionIcon,
  REACTION_LIST
} from '@/components/feed/AnimatedReactionIcons';
import { useSiteSettings } from '@/context/SettingsContext';

export interface MentionCandidate {
  id: string;
  mentionTag: string;
  displayName: string;
  roleLabel: string;
  type: 'AI_AGENT' | 'GUIDE' | 'TUTOR';
  avatarUrl?: string;
  subtitle?: string;
}

interface FeedPostDetailModalProps {
  post: FeedItem | null;
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isOwnerOrAdmin: boolean;
  isTutor: boolean;
  isGuide: boolean;
  aiAgentName: string;
  mentionCandidates: MentionCandidate[];
  onReaction: (postId: string, reaction: string) => void;
  onAddComment: (postId: string, isPedagogical?: boolean, customText?: string, parentId?: string | null, mediaUrl?: string | null) => Promise<void>;
  onDeleteComment: (postId: string, commentId: string) => void;
  onVotePoll: (postId: string, optionId: string) => void;
  onOpenLightbox?: (imgUrl: string) => void;
  renderMentionsAndLinks: (content: string, agentName: string, candidates: MentionCandidate[]) => React.ReactNode;
  formatTimeAgo: (dateStr: string) => string;
  showAiCurationNotice?: boolean;
}

export const FeedPostDetailModal: React.FC<FeedPostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  user,
  isOwnerOrAdmin,
  isTutor,
  isGuide,
  aiAgentName,
  mentionCandidates,
  onReaction,
  onAddComment,
  onDeleteComment,
  onVotePoll,
  onOpenLightbox,
  renderMentionsAndLinks,
  formatTimeAgo,
  showAiCurationNotice
}) => {
  const { settings } = useSiteSettings();
  const effectiveShowAiCuration = showAiCurationNotice ?? (settings?.feed_ai_grammar_curation === 'true' || settings?.feed_ai_grammar_curation === undefined);

  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState(false);
  const hoverTimerRef = useRef<any>(null);

  // Replying state right under comment
  const [replyingTo, setReplyingTo] = useState<{ id: string; targetParentId: string; authorName: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAttachedImage, setReplyAttachedImage] = useState<string | null>(null);
  const [replyUploadingImage, setReplyUploadingImage] = useState(false);
  const [activeReplyMentionTarget, setActiveReplyMentionTarget] = useState<string | null>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  // Footer comment photo state
  const [footerAttachedImage, setFooterAttachedImage] = useState<string | null>(null);
  const [footerUploadingImage, setFooterUploadingImage] = useState(false);
  const footerFileInputRef = useRef<HTMLInputElement>(null);

  // Mention autocomplete in comment box
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Motion values for mobile pull-down drag gesture
  const dragY = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  // Build hierarchical comment tree for clean nesting
  interface CommentTreeItem extends FeedCommentItem {
    replies: FeedCommentItem[];
  }

  const commentTree = useMemo<CommentTreeItem[]>(() => {
    if (!post?.comments || post.comments.length === 0) return [];
    const map = new Map<string, CommentTreeItem>();
    post.comments.forEach(c => map.set(c.id, { ...c, replies: [] }));

    const roots: CommentTreeItem[] = [];
    post.comments.forEach(c => {
      const item = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.replies.push(item);
      } else {
        roots.push(item);
      }
    });
    return roots;
  }, [post?.comments]);

  const handleStartReply = (commentId: string, targetParentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, targetParentId, authorName });
    setReplyText('');
    setReplyAttachedImage(null);
    setMentionQuery(null);
    setTimeout(() => {
      if (replyTextareaRef.current) {
        replyTextareaRef.current.focus();
      }
    }, 60);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
    setReplyAttachedImage(null);
    setMentionQuery(null);
  };

  const handleReplyChange = (val: string, targetId: string) => {
    setReplyText(val);
    setActiveReplyMentionTarget(targetId);
    const atMatch = val.match(/@([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_]*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const selectReplyMentionCandidate = (cand: MentionCandidate) => {
    setReplyText(prev => {
      const atIndex = prev.lastIndexOf('@');
      if (atIndex === -1) {
        return prev ? `${prev} ${cand.mentionTag} ` : `${cand.mentionTag} `;
      }
      const before = prev.slice(0, atIndex);
      const afterAt = prev.slice(atIndex + 1);
      const spaceOrEndIndex = afterAt.search(/\s/);
      const after = spaceOrEndIndex !== -1 ? afterAt.slice(spaceOrEndIndex) : '';
      return `${before}${cand.mentionTag} ${after}`;
    });
    setMentionQuery(null);
    setTimeout(() => {
      if (replyTextareaRef.current) {
        replyTextareaRef.current.focus();
        const len = replyTextareaRef.current.value.length;
        replyTextareaRef.current.setSelectionRange(len, len);
      }
    }, 20);
  };

  const handleReplyFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setReplyUploadingImage(true);
      const res = await uploadFeedImages([file]);
      if (res.urls && res.urls.length > 0) {
        setReplyAttachedImage(res.urls[0]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al subir la imagen.');
    } finally {
      setReplyUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleFooterFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setFooterUploadingImage(true);
      const res = await uploadFeedImages([file]);
      if (res.urls && res.urls.length > 0) {
        setFooterAttachedImage(res.urls[0]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al subir la imagen.');
    } finally {
      setFooterUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSendNestedReply = async (targetParentId: string) => {
    if (!post || (!replyText.trim() && !replyAttachedImage) || submitting) return;
    try {
      setSubmitting(true);
      await onAddComment(post.id, false, replyText.trim(), targetParentId, replyAttachedImage);
      setReplyText('');
      setReplyAttachedImage(null);
      setReplyingTo(null);
      setMentionQuery(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Sync URL hash with post ID & Listen to browser Back and Escape
  useEffect(() => {
    if (isOpen && post?.id) {
      const targetHash = `#${post.id}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${targetHash}`);
      }

      const handlePopState = () => {
        if (window.location.hash !== `#${post.id}`) {
          onClose();
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('popstate', handlePopState);
      window.addEventListener('keydown', handleKeyDown);

      // Scroll comments into view on mount
      setTimeout(() => {
        if (commentsContainerRef.current) {
          commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }
      }, 250);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, post?.id, onClose]);

  // Clean URL hash on manual close
  const handleCloseModal = () => {
    if (window.location.hash) {
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
    }
    onClose();
  };

  const handleReactionEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredReaction(true);
  };

  const handleReactionLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setHoveredReaction(false);
    }, 280);
  };

  // Mention detection logic
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const pos = e.target.selectionStart || 0;
    setCommentText(text);
    setCursorPosition(pos);

    const textBeforeCursor = text.slice(0, pos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_]*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const filteredCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.trim().toLowerCase();
    if (!q) return mentionCandidates.slice(0, 7);
    return mentionCandidates.filter(c =>
      c.displayName.toLowerCase().includes(q) ||
      c.mentionTag.toLowerCase().includes(q)
    ).slice(0, 7);
  }, [mentionCandidates, mentionQuery]);

  const selectMentionCandidate = (cand: MentionCandidate) => {
    setCommentText(prev => {
      const atIndex = prev.lastIndexOf('@');
      if (atIndex === -1) {
        return prev ? `${prev} ${cand.mentionTag} ` : `${cand.mentionTag} `;
      }
      const before = prev.slice(0, atIndex);
      const afterAt = prev.slice(atIndex + 1);
      const spaceOrEndIndex = afterAt.search(/\s/);
      const after = spaceOrEndIndex !== -1 ? afterAt.slice(spaceOrEndIndex) : '';
      return `${before}${cand.mentionTag} ${after}`;
    });
    setMentionQuery(null);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 20);
  };

  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!post || (!commentText.trim() && !footerAttachedImage) || submitting) return;

    try {
      setSubmitting(true);
      await onAddComment(post.id, false, commentText.trim(), null, footerAttachedImage);
      setCommentText('');
      setFooterAttachedImage(null);
      setMentionQuery(null);
      setTimeout(() => {
        if (commentsContainerRef.current) {
          commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }
      }, 150);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !post) return null;

  const isAuthor = user && post.authorId === user.id;
  const canDelete = isAuthor || isOwnerOrAdmin;
  const isPedagogical = post.type === 'OBSERVATION' || post.type === 'PROGRESS';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center sm:p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleCloseModal}
          className="fixed inset-0 bg-black/65 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window / Mobile Pull-down Sheet */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragStart={() => setIsDragging(true)}
          onDrag={(_, info) => {
            dragY.set(Math.max(0, info.offset.y));
          }}
          onDragEnd={(_, info) => {
            setIsDragging(false);
            if (info.offset.y > 110 || info.velocity.y > 400) {
              handleCloseModal();
            } else {
              dragY.set(0);
            }
          }}
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.94 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className={`relative z-10 w-full sm:max-w-3xl md:max-w-4xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 sm:rounded-3xl transition-all duration-150 ${
            isDragging ? 'rounded-t-[32px]' : 'rounded-none sm:rounded-3xl'
          }`}
        >
          {/* Mobile Pull-Down Handle Bar */}
          <div className="sm:hidden pt-2.5 pb-1 flex flex-col items-center justify-center shrink-0 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full transition-colors" />
          </div>

          {/* Desktop Close Button */}
          <button
            type="button"
            onClick={handleCloseModal}
            className="hidden sm:flex absolute top-4 right-4 z-30 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header & Navigation Bar */}
          <div className="px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs">
                {post.author?.avatarUrl ? (
                  <img src={post.author.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (post.author?.fullName || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {post.author?.fullName || 'Miembro de la comunidad'}
                  </h3>
                  {post.authorRole === 'TEACHER' && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.2 rounded-md shrink-0">
                      Guía
                    </span>
                  )}
                  {post.authorRole === 'OWNER' && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold px-2 py-0.2 rounded-md shrink-0">
                      Dirección
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {post.environment?.name || 'Toda la escuela'} • {formatTimeAgo(post.createdAt)}
                </p>
              </div>
            </div>

            {/* Mobile close chevron / touch button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="sm:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Main Body (Post Content + Comments Thread) */}
          <div
            ref={commentsContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 divide-y divide-slate-100 dark:divide-slate-800"
          >
            {/* Post Content Block */}
            <div className="space-y-4">
              {post.pinned && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-900">
                  <Pin className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-400" />
                  <span>Publicación fijada</span>
                </div>
              )}

              {post.title && (
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {post.title}
                </h2>
              )}

              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {renderMentionsAndLinks(post.content, aiAgentName, mentionCandidates)}
              </p>

              {/* Media Images Gallery */}
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className={`grid gap-2 rounded-2xl overflow-hidden ${
                  post.mediaUrls.length === 1 ? 'grid-cols-1' :
                  post.mediaUrls.length === 2 ? 'grid-cols-2' :
                  'grid-cols-2 sm:grid-cols-3'
                }`}>
                  {post.mediaUrls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => onOpenLightbox && onOpenLightbox(url)}
                      className="relative group aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={url}
                        alt={`Media ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Poll Module if present */}
              {post.poll && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {post.poll.question || 'Encuesta de la comunidad'}
                  </h4>
                  <div className="space-y-2">
                    {post.poll.options?.map(opt => {
                      const isVoted = post.poll?.myVotedOptionIds?.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={post.poll?.hasVoted || post.poll?.isClosed}
                          onClick={() => onVotePoll(post.id, opt.id)}
                          className={`relative w-full p-3 rounded-xl text-left text-xs font-semibold border transition-all overflow-hidden cursor-pointer ${
                            isVoted
                              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-400'
                          }`}
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-emerald-500/15 dark:bg-emerald-500/25 transition-all duration-500"
                            style={{ width: `${opt.percentage || 0}%` }}
                          />
                          <div className="relative flex items-center justify-between gap-2">
                            <span>{opt.text}</span>
                            <span className="text-[11px] font-bold">{opt.percentage || 0}% ({opt.votesCount || 0})</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reactions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className="relative inline-flex items-center"
                    onMouseEnter={handleReactionEnter}
                    onMouseLeave={handleReactionLeave}
                  >
                    {hoveredReaction && (
                      <div
                        className="absolute bottom-full left-0 pb-2 z-40 pointer-events-auto"
                        onMouseEnter={handleReactionEnter}
                        onMouseLeave={handleReactionLeave}
                      >
                        <div className="flex items-center gap-1.5 p-1.5 bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 backdrop-blur-md animate-in fade-in zoom-in-90 duration-150">
                          {REACTION_LIST.map(em => (
                            <button
                              key={em.key}
                              type="button"
                              onClick={() => {
                                onReaction(post.id, em.key);
                                setHoveredReaction(false);
                              }}
                              className={`group relative p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                                post.myReaction === em.key
                                  ? 'bg-slate-100 dark:bg-slate-800 scale-110 ring-1 ring-slate-300 dark:ring-slate-700'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-125'
                              }`}
                              title={em.label}
                            >
                              <AnimatedReactionIcon reaction={em.key} size={24} isSelected={post.myReaction === em.key} />
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
                      onClick={() => onReaction(post.id, post.myReaction || '❤️')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer text-xs ${
                        post.isLikedByMe
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <AnimatedReactionIcon reaction={post.myReaction || '❤️'} size={18} isSelected={post.isLikedByMe} />
                      <span>{post.likesCount || 0}</span>
                    </button>
                  </div>

                  {/* Reaction count badges */}
                  {post.reactionsSummary && Object.entries(post.reactionsSummary).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onReaction(post.id, emoji)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all cursor-pointer ${
                        post.myReaction === emoji
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-700 font-bold'
                          : 'bg-slate-50 border-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <AnimatedReactionIcon reaction={emoji} size={15} isSelected={post.myReaction === emoji} />
                      <span className="text-[11px] font-bold">{count}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>{post.comments?.length || post.commentsCount || 0} comentarios</span>
                </div>
              </div>
            </div>

            {/* Comments Thread Section */}
            <div className="pt-5 space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Comentarios y Respuestas
              </h4>

              {isPedagogical && isTutor && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Las notas en registros pedagógicos son informativas. Los comentarios de evaluación están reservados para el equipo de guías y dirección.
                  </span>
                </div>
              )}

              {/* Comments list */}
              {commentTree.length > 0 ? (
                <div className="space-y-4">
                  {commentTree.map(rootComment => {
                    const canDeleteRoot = isOwnerOrAdmin || (user && rootComment.authorId === user.id);
                    const isAiRoot = Boolean(rootComment.isAiAgent);
                    const rootAuthorName = isAiRoot ? (rootComment.aiAgentName || `@${aiAgentName}`) : (rootComment.author?.fullName || 'Miembro');

                    return (
                      <div key={rootComment.id} className="space-y-2.5">
                        {/* Root Comment Item */}
                        <div className="group relative flex items-start gap-2.5 sm:gap-3">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden mt-0.5 ${
                            isAiRoot
                              ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 ring-1.5 ring-indigo-300 dark:ring-indigo-700'
                              : rootComment.isInternalGuideOnly ? 'bg-amber-600' : 'bg-emerald-600'
                          }`}>
                            {isAiRoot ? (
                              rootComment.aiAgentAvatar ? (
                                <img src={rootComment.aiAgentAvatar} alt="AI Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <Bot className="w-4 h-4 text-white" />
                              )
                            ) : rootComment.author?.avatarUrl ? (
                              <img src={rootComment.author.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              (rootComment.author?.fullName || 'U').charAt(0).toUpperCase()
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 leading-none">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                {rootAuthorName}
                              </span>
                              {isAiRoot ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold px-1.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60">
                                  <Sparkles className="w-2 h-2 text-indigo-500" /> Asistente IA
                                </span>
                              ) : (
                                rootComment.authorRole === 'TEACHER' && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-semibold border border-emerald-200 dark:border-emerald-800/60">
                                    Guía
                                  </span>
                                )
                              )}
                              {rootComment.isInternalGuideOnly && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-semibold border border-amber-200 dark:border-amber-800/60">
                                  <Lock className="w-2 h-2" /> Nota interna
                                </span>
                              )}
                              <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-0.5">
                                • {formatTimeAgo(rootComment.createdAt)}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                              {renderMentionsAndLinks(rootComment.content, aiAgentName, mentionCandidates)}
                            </p>

                            {/* Root Comment Attached Image */}
                            {rootComment.mediaUrl && (
                              <div className="mt-2">
                                <img
                                  src={rootComment.mediaUrl}
                                  alt="Adjunto"
                                  className="rounded-xl max-h-56 max-w-full sm:max-w-xs object-cover border border-slate-200 dark:border-slate-800 shadow-2xs hover:opacity-95 transition-opacity cursor-pointer"
                                  onClick={() => onOpenLightbox ? onOpenLightbox(rootComment.mediaUrl!) : window.open(rootComment.mediaUrl, '_blank')}
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-3 mt-1 text-[11px]">
                              <button
                                type="button"
                                onClick={() => handleStartReply(rootComment.id, rootComment.id, rootAuthorName)}
                                className="font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer py-0.5"
                              >
                                <Reply className="w-3 h-3" />
                                <span>Responder</span>
                              </button>

                              {canDeleteRoot && !isAiRoot && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteComment(post.id, rootComment.id)}
                                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer py-0.5 opacity-0 group-hover:opacity-100"
                                  title="Eliminar comentario"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Inline Reply Textarea Box right beneath Root Comment */}
                            {replyingTo?.id === rootComment.id && (
                              <div className="mt-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                                <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold px-1">
                                  <span className="flex items-center gap-1">
                                    <Reply className="w-3 h-3 text-emerald-600" /> Respondiendo a <strong>{rootAuthorName}</strong>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleCancelReply}
                                    className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer text-[10px]"
                                  >
                                    Cancelar
                                  </button>
                                </div>

                                {mentionQuery !== null && activeReplyMentionTarget === rootComment.id && filteredCandidates.length > 0 && (
                                  <div className="p-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto">
                                    {filteredCandidates.map(cand => (
                                      <button
                                        key={cand.id}
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          selectReplyMentionCandidate(cand);
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          selectReplyMentionCandidate(cand);
                                        }}
                                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-xs cursor-pointer"
                                      >
                                        <span className="font-bold text-slate-800 dark:text-white truncate">{cand.displayName}</span>
                                        <span className="text-[10px] text-emerald-600 font-semibold">{cand.mentionTag}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}

                                <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all p-2 shadow-2xs">
                                  {/* Attached Photo Preview inside textarea container */}
                                  {replyAttachedImage && (
                                    <div className="relative inline-block mb-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                      <img src={replyAttachedImage} alt="Adjunto" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg" />
                                      <button
                                        type="button"
                                        onClick={() => setReplyAttachedImage(null)}
                                        className="absolute -top-1.5 -right-1.5 p-0.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full shadow-sm cursor-pointer"
                                        title="Quitar foto"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}

                                  <textarea
                                    ref={replyTextareaRef}
                                    rows={1}
                                    value={replyText}
                                    onChange={(e) => handleReplyChange(e.target.value, rootComment.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendNestedReply(rootComment.id);
                                      } else if (e.key === 'Escape') {
                                        handleCancelReply();
                                      }
                                    }}
                                    placeholder={`Escribe una respuesta a ${rootAuthorName}...`}
                                    className="w-full resize-none bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none max-h-32 min-h-[30px] py-0.5 px-1"
                                  />

                                  <input
                                    ref={replyFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleReplyFileSelect}
                                  />

                                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => replyFileInputRef.current?.click()}
                                      disabled={replyUploadingImage}
                                      className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                                      title="Adjuntar foto"
                                    >
                                      {replyUploadingImage ? (
                                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                                      ) : (
                                        <ImageIcon className="w-4 h-4" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleSendNestedReply(rootComment.id)}
                                      disabled={(!replyText.trim() && !replyAttachedImage) || submitting || replyUploadingImage}
                                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white rounded-full transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                                      title="Enviar respuesta"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {effectiveShowAiCuration && (
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

                        {/* Nested Replies */}
                        {rootComment.replies && rootComment.replies.length > 0 && (
                          <div className="ml-5 sm:ml-7 pl-3 sm:pl-4 border-l-2 border-slate-200/90 dark:border-slate-800 space-y-3 pt-1 pb-0.5">
                            {rootComment.replies.map(reply => {
                              const canDeleteReply = isOwnerOrAdmin || (user && reply.authorId === user.id);
                              const isAiReply = Boolean(reply.isAiAgent);
                              const replyAuthorName = isAiReply ? (reply.aiAgentName || `@${aiAgentName}`) : (reply.author?.fullName || 'Miembro');

                              return (
                                <div key={reply.id} className="group relative flex items-start gap-2 sm:gap-2.5">
                                  <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[11px] shrink-0 overflow-hidden mt-0.5 ${
                                    isAiReply
                                      ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 ring-1.5 ring-indigo-300 dark:ring-indigo-700'
                                      : reply.isInternalGuideOnly ? 'bg-amber-600' : 'bg-emerald-600'
                                  }`}>
                                    {isAiReply ? (
                                      reply.aiAgentAvatar ? (
                                        <img src={reply.aiAgentAvatar} alt="AI Avatar" className="w-full h-full object-cover" />
                                      ) : (
                                        <Bot className="w-3.5 h-3.5 text-white" />
                                      )
                                    ) : reply.author?.avatarUrl ? (
                                      <img src={reply.author.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                      (reply.author?.fullName || 'U').charAt(0).toUpperCase()
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5 leading-none">
                                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                        {replyAuthorName}
                                      </span>
                                      {isAiReply ? (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold px-1.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60">
                                          <Sparkles className="w-2 h-2 text-indigo-500" /> Asistente IA
                                        </span>
                                      ) : (
                                        reply.authorRole === 'TEACHER' && (
                                          <span className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-semibold border border-emerald-200 dark:border-emerald-800/60">
                                            Guía
                                          </span>
                                        )
                                      )}
                                      {reply.isInternalGuideOnly && (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-semibold border border-amber-200 dark:border-amber-800/60">
                                          <Lock className="w-2 h-2" /> Nota interna
                                        </span>
                                      )}
                                      <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-0.5">
                                        • {formatTimeAgo(reply.createdAt)}
                                      </span>
                                    </div>

                                    <p className="mt-1 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                                      {renderMentionsAndLinks(reply.content, aiAgentName, mentionCandidates)}
                                    </p>

                                    {/* Reply Comment Attached Image */}
                                    {reply.mediaUrl && (
                                      <div className="mt-2">
                                        <img
                                          src={reply.mediaUrl}
                                          alt="Adjunto"
                                          className="rounded-xl max-h-52 max-w-full sm:max-w-xs object-cover border border-slate-200 dark:border-slate-800 shadow-2xs hover:opacity-95 transition-opacity cursor-pointer"
                                          onClick={() => onOpenLightbox ? onOpenLightbox(reply.mediaUrl!) : window.open(reply.mediaUrl, '_blank')}
                                        />
                                      </div>
                                    )}

                                    <div className="flex items-center gap-3 mt-1 text-[11px]">
                                      <button
                                        type="button"
                                        onClick={() => handleStartReply(reply.id, rootComment.id, replyAuthorName)}
                                        className="font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer py-0.5"
                                      >
                                        <Reply className="w-3 h-3" />
                                        <span>Responder</span>
                                      </button>

                                      {canDeleteReply && !isAiReply && (
                                        <button
                                          type="button"
                                          onClick={() => onDeleteComment(post.id, reply.id)}
                                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer py-0.5 opacity-0 group-hover:opacity-100"
                                          title="Eliminar comentario"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Inline Reply Textarea Box right beneath Reply Comment */}
                                    {replyingTo?.id === reply.id && (
                                      <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold px-1">
                                          <span className="flex items-center gap-1">
                                            <Reply className="w-3 h-3 text-emerald-600" /> Respondiendo a <strong>{replyAuthorName}</strong>
                                          </span>
                                          <button
                                            type="button"
                                            onClick={handleCancelReply}
                                            className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer text-[10px]"
                                          >
                                            Cancelar
                                          </button>
                                        </div>

                                        {mentionQuery !== null && activeReplyMentionTarget === reply.id && filteredCandidates.length > 0 && (
                                          <div className="p-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto">
                                            {filteredCandidates.map(cand => (
                                              <button
                                                key={cand.id}
                                                type="button"
                                                onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  selectReplyMentionCandidate(cand);
                                                }}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  selectReplyMentionCandidate(cand);
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-xs cursor-pointer"
                                              >
                                                <span className="font-bold text-slate-800 dark:text-white truncate">{cand.displayName}</span>
                                                <span className="text-[10px] text-emerald-600 font-semibold">{cand.mentionTag}</span>
                                              </button>
                                            ))}
                                          </div>
                                        )}

                                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all p-2 shadow-2xs">
                                          {/* Attached Photo Preview inside textarea container */}
                                          {replyAttachedImage && (
                                            <div className="relative inline-block mb-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                              <img src={replyAttachedImage} alt="Adjunto" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg" />
                                              <button
                                                type="button"
                                                onClick={() => setReplyAttachedImage(null)}
                                                className="absolute -top-1.5 -right-1.5 p-0.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full shadow-sm cursor-pointer"
                                                title="Quitar foto"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          )}

                                          <textarea
                                            ref={replyTextareaRef}
                                            rows={1}
                                            value={replyText}
                                            onChange={(e) => handleReplyChange(e.target.value, reply.id)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendNestedReply(rootComment.id);
                                              } else if (e.key === 'Escape') {
                                                handleCancelReply();
                                              }
                                            }}
                                            placeholder={`Escribe una respuesta a ${replyAuthorName}...`}
                                            className="w-full resize-none bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none max-h-32 min-h-[30px] py-0.5 px-1"
                                          />

                                          <input
                                            ref={replyFileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleReplyFileSelect}
                                          />

                                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                                            <button
                                              type="button"
                                              onClick={() => replyFileInputRef.current?.click()}
                                              disabled={replyUploadingImage}
                                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                                              title="Adjuntar foto"
                                            >
                                              {replyUploadingImage ? (
                                                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                                              ) : (
                                                <ImageIcon className="w-4 h-4" />
                                              )}
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleSendNestedReply(rootComment.id)}
                                              disabled={(!replyText.trim() && !replyAttachedImage) || submitting || replyUploadingImage}
                                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white rounded-full transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                                              title="Enviar respuesta"
                                            >
                                              <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          {effectiveShowAiCuration && (
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
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                  <p>Aún no hay comentarios. ¡Sé el primero en participar!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Comment Input Footer */}
          <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            {/* Mention Autocomplete Dropdown */}
            {mentionQuery !== null && filteredCandidates.length > 0 && (
              <div className="mb-2 p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Mencionar miembro o asistente IA:
                </p>
                {filteredCandidates.map(cand => (
                  <button
                    key={cand.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectMentionCandidate(cand);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      selectMentionCandidate(cand);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {cand.type === 'AI_AGENT' ? (
                        <Bot className="w-3.5 h-3.5" />
                      ) : cand.avatarUrl ? (
                        <img src={cand.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        cand.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {cand.displayName}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {cand.mentionTag}
                        </span>
                      </div>
                      {cand.subtitle && (
                        <p className="text-[10px] text-slate-400 truncate">{cand.subtitle}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Unified Footer Textarea Container with Internal Photo Picker and Arrow Send Button */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all p-2 shadow-2xs">
              {/* Attached Photo Preview inside footer textarea container */}
              {footerAttachedImage && (
                <div className="relative inline-block mb-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <img src={footerAttachedImage} alt="Adjunto" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setFooterAttachedImage(null)}
                    className="absolute -top-1.5 -right-1.5 p-0.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full shadow-sm cursor-pointer"
                    title="Quitar foto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={commentText}
                onChange={handleCommentChange}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
                rows={1}
                placeholder={`Escribe un comentario en la publicación (@ para citar)...`}
                className="w-full resize-none bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none max-h-36 min-h-[32px] py-1 px-1"
              />

              <input
                ref={footerFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFooterFileSelect}
              />

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 mt-1">
                <button
                  type="button"
                  onClick={() => footerFileInputRef.current?.click()}
                  disabled={footerUploadingImage}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer disabled:opacity-50"
                  title="Adjuntar foto"
                >
                  {footerUploadingImage ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitComment()}
                  disabled={(!commentText.trim() && !footerAttachedImage) || submitting || footerUploadingImage}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white rounded-full transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                  title="Comentar"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>

              {effectiveShowAiCuration && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 pt-1.5 px-0.5 select-none leading-tight border-t border-slate-200/60 dark:border-slate-700/60 mt-1">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>La IA revisará y corregirá automáticamente la ortografía y el contenido para mantener la calidad del muro.</span>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
