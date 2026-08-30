import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
 Mic,
 MicOff,
 Sparkles,
 AlertTriangle,
 User,
 Trash2,
 Plus,
 FileText,
 Lock,
 Globe,
 Check,
 BookOpen,
 CheckSquare,
 RefreshCw,
 X,
 Radio,
 Volume2,
 ArrowLeft,
 ArrowRight,
 ChevronDown,
 ChevronLeft,
 ChevronRight,
 Search,
 CheckCircle2,
 HelpCircle,
 Award,
 Camera,
 Image as ImageIcon,
 Upload,
 CheckCheck
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import {
 getStudents,
 getMontessoriCurriculum,
 getTrackerCategories,
 getMontessoriAiStatus,
 structureMontessoriVoiceObservation,
 saveMontessoriProgress,
 saveStructuredMontessoriObservation,
 uploadFile,
 StudentItem,
 MontessoriAreaItem,
 TrackerCategoryItem
} from '@/lib/sqlite';
import { toast } from 'sonner';

export type VoiceLoggerTargetType = 'lesson' | 'tracker';
export type VoiceLoggerWizardStep = 'select' | 'recording' | 'student_confirm' | 'prefill';

interface MontessoriVoiceLoggerDrawerProps {
 isOpen: boolean;
 onClose: () => void;
 initialTargetType?: VoiceLoggerTargetType;
 environmentId?: string;
 preselectedStudentId?: string;
 selectedDate?: string;
 onTargetTypeChange?: (target: VoiceLoggerTargetType) => void;
 onSaved?: (target: VoiceLoggerTargetType) => void;
}

interface EditableLessonRecord {
 id: string;
 studentId: string | null;
 studentName?: string;
 lessonId: string | null;
 lessonName?: string;
 areaName?: string;
 status: 'PRESENTED' | 'PRACTICING' | 'MASTERED' | 'SURPASSED';
 notes: string;
 isPublic: boolean;
 photoUrl?: string;
 saved?: boolean;
}

interface EditableTrackerRecord {
 id: string;
 studentId: string | null;
 studentName?: string;
 trackerCategoryId: string | null;
 trackerCategoryName?: string;
 trackerItemId: string | null;
 trackerItemName?: string;
 status: 'YES' | 'NO' | 'PARTIAL';
 publicNote: string;
 internalNote: string;
 photoUrl?: string;
 saved?: boolean;
}

interface StudentCandidateMatch {
 student: StudentItem;
 score: number;
 confidencePercent: number;
 matchedBy: 'exact' | 'phonetic' | 'surname' | 'ai' | 'fallback';
}

/**
 * Phonetic & String Similarity Helper
 */
function cleanString(str: string): string {
 return (str || '')
 .toLowerCase()
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .replace(/[^a-z0-9\s]/g, '')
 .trim();
}

function levenshteinDistance(s1: string, s2: string): number {
 const m = s1.length;
 const n = s2.length;
 const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

 for (let i = 0; i <= m; i++) dp[i][0] = i;
 for (let j = 0; j <= n; j++) dp[0][j] = j;

 for (let i = 1; i <= m; i++) {
 for (let j = 1; j <= n; j++) {
 if (s1[i - 1] === s2[j - 1]) {
 dp[i][j] = dp[i - 1][j - 1];
 } else {
 dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
 }
 }
 }
 return dp[m][n];
}

/**
 * Calculates match score between spoken phrase/names and student record
 */
function rankStudentMatches(
 spokenText: string,
 aiSuggestedName: string | undefined,
 aiSuggestedId: string | null | undefined,
 students: StudentItem[]
): StudentCandidateMatch[] {
 const spoken = cleanString(spokenText);
 const aiName = cleanString(aiSuggestedName || '');

 const results: StudentCandidateMatch[] = students.map(st => {
 const fullName = cleanString(st.full_name || (st as any).fullName || '');
 let score = 0;
 let matchedBy: StudentCandidateMatch['matchedBy'] = 'fallback';

 // 1. Direct ID match from AI
 if (aiSuggestedId && st.id === aiSuggestedId) {
 score = 0.99;
 matchedBy = 'ai';
 }
 // 2. Exact name match
 else if (fullName && (fullName === spoken || fullName === aiName)) {
 score = 0.98;
 matchedBy = 'exact';
 }
 // 3. Substring containment
 else if (fullName && (spoken.includes(fullName) || fullName.includes(spoken) || (aiName && fullName.includes(aiName)))) {
 score = 0.92;
 matchedBy = 'exact';
 }
 // 4. Token & Phonetic Fuzzy Matching
 else if (fullName) {
 const spokenWords = (spoken + ' ' + aiName).split(/\s+/).filter(w => w.length >= 3);
 const studentWords = fullName.split(/\s+/).filter(Boolean);

 let matchedTokens = 0;
 let hasSurnameMatch = false;

 for (const sw of spokenWords) {
 for (let i = 0; i < studentWords.length; i++) {
 const tw = studentWords[i];
 if (tw === sw) {
 matchedTokens += 1.0;
 if (i > 0) hasSurnameMatch = true; // Matched a surname
 break;
 }
 if (tw.startsWith(sw) || sw.startsWith(tw)) {
 matchedTokens += 0.85;
 break;
 }
 const lev = levenshteinDistance(sw, tw);
 if (lev <= 1 && Math.max(sw.length, tw.length) >= 4) {
 matchedTokens += 0.80; // "Alan" vs "Allan"
 break;
 }
 }
 }

 if (spokenWords.length > 0) {
 score = Math.min(0.95, matchedTokens / Math.min(spokenWords.length, 2));
 if (hasSurnameMatch) {
 score = Math.min(0.95, score + 0.15);
 matchedBy = 'surname';
 } else if (score > 0.5) {
 matchedBy = 'phonetic';
 }
 }
 }

 return {
 student: st,
 score,
 confidencePercent: Math.round(score * 100),
 matchedBy
 };
 });

 return results.sort((a, b) => b.score - a.score);
}

/**
 * Custom Student Avatar component
 */
const StudentAvatar: React.FC<{
 fullName: string;
 avatarUrl?: string | null;
 sizeClass?: string;
 textSizeClass?: string;
}> = ({ fullName, avatarUrl, sizeClass = 'w-10 h-10', textSizeClass = 'text-xs' }) => {
 const [imgError, setImgError] = useState(false);

 const initials = useMemo(() => {
 if (!fullName) return '?';
 const parts = fullName.trim().split(' ');
 if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
 return parts[0].substring(0, 2).toUpperCase();
 }, [fullName]);

 if (avatarUrl && !imgError) {
 return (
 <img
 src={avatarUrl}
 alt={fullName}
 onError={() => setImgError(true)}
 className={`${sizeClass} rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm shrink-0`}
 />
 );
 }

 return (
 <div
 className={`${sizeClass} rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white font-bold ${textSizeClass} flex items-center justify-center shadow-sm shrink-0`}
 >
 {initials}
 </div>
 );
};

/**
 * Custom Searchable Student Dropdown
 */
const CustomStudentDropdown: React.FC<{
 students: StudentItem[];
 selectedStudentId: string | null;
 onSelect: (student: StudentItem) => void;
}> = ({ students, selectedStudentId, onSelect }) => {
 const [open, setOpen] = useState(false);
 const [search, setSearch] = useState('');
 const dropdownRef = useRef<HTMLDivElement>(null);

 const selectedStudent = useMemo(() => {
 return students.find(s => s.id === selectedStudentId);
 }, [students, selectedStudentId]);

 const filteredStudents = useMemo(() => {
 if (!search.trim()) return students;
 const q = search.toLowerCase().trim();
 return students.filter(s => {
 const name = (s.full_name || (s as any).fullName || '').toLowerCase();
 const grade = (s.grade || '').toLowerCase();
 return name.includes(q) || grade.includes(q);
 });
 }, [students, search]);

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
 setOpen(false);
 }
 };
 if (open) document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, [open]);

 const studentDisplayName = (s: StudentItem) => s.full_name || (s as any).fullName || 'Sin nombre';

 return (
 <div className="relative w-full" ref={dropdownRef}>
 <button
 type="button"
 onClick={() => setOpen(!open)}
 className="w-full flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 transition-all text-left cursor-pointer"
 >
 <div className="flex items-center gap-2.5 min-w-0">
 {selectedStudent ? (
 <>
 <StudentAvatar
 fullName={studentDisplayName(selectedStudent)}
 avatarUrl={selectedStudent.avatar_url || (selectedStudent as any).avatarUrl}
 sizeClass="w-9 h-9"
 />
 <div className="truncate">
 <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
 {studentDisplayName(selectedStudent)}
 </p>
 <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
 {selectedStudent.grade || selectedStudent.environment_name || 'Alumno Activo'}
 </p>
 </div>
 </>
 ) : (
 <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
 <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
 <User className="w-4 h-4 text-gray-500" />
 </div>
 <span className="font-medium">-- Seleccionar Alumno --</span>
 </div>
 )}
 </div>

 <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
 </button>

 {open && (
 <div className="absolute z-50 left-0 right-0 top-full mt-1.5 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl space-y-2 max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
 <div className="relative">
 <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="Buscar alumno por nombre o apellido..."
 className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 </div>

 <div className="overflow-y-auto space-y-1 flex-1 pr-1">
 {filteredStudents.length === 0 ? (
 <p className="text-xs text-gray-400 p-3 text-center">No se encontraron alumnos</p>
 ) : (
 filteredStudents.map(st => {
 const isSelected = st.id === selectedStudentId;
 const name = studentDisplayName(st);
 return (
 <button
 key={st.id}
 type="button"
 onClick={() => {
 onSelect(st);
 setOpen(false);
 }}
 className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
 isSelected
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold'
 : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
 }`}
 >
 <div className="flex items-center gap-2.5 truncate">
 <StudentAvatar
 fullName={name}
 avatarUrl={st.avatar_url || (st as any).avatarUrl}
 sizeClass="w-7 h-7"
 textSizeClass="text-[10px]"
 />
 <div className="text-left truncate">
 <span className="block truncate">{name}</span>
 <span className="text-[10px] text-gray-400 block truncate">
 {st.grade || st.environment_name || 'Activo'}
 </span>
 </div>
 </div>
 {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
 </button>
 );
 })
 )}
 </div>
 </div>
 )}
 </div>
 );
};

/**
 * Custom Searchable Lesson Dropdown
 */
const CustomLessonDropdown: React.FC<{
 lessons: Array<{ id: string; name: string; areaName: string }>;
 selectedLessonId: string | null;
 detectedName?: string;
 onSelect: (lesson: { id: string; name: string; areaName: string }) => void;
}> = ({ lessons, selectedLessonId, detectedName, onSelect }) => {
 const [open, setOpen] = useState(false);
 const [search, setSearch] = useState('');
 const dropdownRef = useRef<HTMLDivElement>(null);

 const selectedLesson = useMemo(() => {
 return lessons.find(l => l.id === selectedLessonId);
 }, [lessons, selectedLessonId]);

 const filtered = useMemo(() => {
 if (!search.trim()) return lessons;
 const q = search.toLowerCase().trim();
 return lessons.filter(l => l.name.toLowerCase().includes(q) || l.areaName.toLowerCase().includes(q));
 }, [lessons, search]);

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
 setOpen(false);
 }
 };
 if (open) document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, [open]);

 return (
 <div className="relative w-full" ref={dropdownRef}>
 <button
 type="button"
 onClick={() => setOpen(!open)}
 className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 transition-all text-left cursor-pointer"
 >
 <div className="truncate">
 {selectedLesson ? (
 <div className="truncate">
 <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block truncate">
 {selectedLesson.name}
 </span>
 <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block truncate font-medium">
 {selectedLesson.areaName}
 </span>
 </div>
 ) : (
 <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
 {detectedName ? `Detectado: ${detectedName}` : '-- Seleccionar Lección --'}
 </span>
 )}
 </div>
 <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
 </button>

 {open && (
 <div className="absolute z-50 left-0 right-0 top-full mt-1.5 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl space-y-2 max-h-56 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
 <div className="relative">
 <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="Buscar material o lección..."
 className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 </div>

 <div className="overflow-y-auto space-y-1 flex-1 pr-1">
 {filtered.length === 0 ? (
 <p className="text-xs text-gray-400 p-2 text-center">No se encontraron lecciones</p>
 ) : (
 filtered.map(les => {
 const isSelected = les.id === selectedLessonId;
 return (
 <button
 key={les.id}
 type="button"
 onClick={() => {
 onSelect(les);
 setOpen(false);
 }}
 className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
 isSelected
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold'
 : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
 }`}
 >
 <div className="truncate">
 <span className="block truncate">{les.name}</span>
 <span className="text-[10px] text-gray-400 block truncate">{les.areaName}</span>
 </div>
 {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
 </button>
 );
 })
 )}
 </div>
 </div>
 )}
 </div>
 );
};

/**
 * Custom Searchable Tracker Dropdown
 */
const CustomTrackerDropdown: React.FC<{
 trackerItems: Array<{ id: string; name: string; categoryName: string; categoryId: string }>;
 selectedTrackerId: string | null;
 detectedName?: string;
 onSelect: (item: { id: string; name: string; categoryName: string; categoryId: string }) => void;
}> = ({ trackerItems, selectedTrackerId, detectedName, onSelect }) => {
 const [open, setOpen] = useState(false);
 const [search, setSearch] = useState('');
 const dropdownRef = useRef<HTMLDivElement>(null);

 const selectedItem = useMemo(() => {
 return trackerItems.find(t => t.id === selectedTrackerId);
 }, [trackerItems, selectedTrackerId]);

 const filtered = useMemo(() => {
 if (!search.trim()) return trackerItems;
 const q = search.toLowerCase().trim();
 return trackerItems.filter(t => t.name.toLowerCase().includes(q) || t.categoryName.toLowerCase().includes(q));
 }, [trackerItems, search]);

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
 setOpen(false);
 }
 };
 if (open) document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, [open]);

 return (
 <div className="relative w-full" ref={dropdownRef}>
 <button
 type="button"
 onClick={() => setOpen(!open)}
 className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-all text-left cursor-pointer"
 >
 <div className="truncate">
 {selectedItem ? (
 <div className="truncate">
 <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block truncate">
 {selectedItem.name}
 </span>
 <span className="text-[10px] text-purple-600 dark:text-purple-400 block truncate font-medium">
 {selectedItem.categoryName}
 </span>
 </div>
 ) : (
 <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
 {detectedName ? `Detectado: ${detectedName}` : '-- Seleccionar Hábito / Rutina --'}
 </span>
 )}
 </div>
 <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
 </button>

 {open && (
 <div className="absolute z-50 left-0 right-0 top-full mt-1.5 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl space-y-2 max-h-56 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
 <div className="relative">
 <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="Buscar rutina o hábito..."
 className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
 />
 </div>

 <div className="overflow-y-auto space-y-1 flex-1 pr-1">
 {filtered.length === 0 ? (
 <p className="text-xs text-gray-400 p-2 text-center">No se encontraron trackers</p>
 ) : (
 filtered.map(tr => {
 const isSelected = tr.id === selectedTrackerId;
 return (
 <button
 key={tr.id}
 type="button"
 onClick={() => {
 onSelect(tr);
 setOpen(false);
 }}
 className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
 isSelected
 ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-bold'
 : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
 }`}
 >
 <div className="truncate">
 <span className="block truncate">{tr.name}</span>
 <span className="text-[10px] text-gray-400 block truncate">{tr.categoryName}</span>
 </div>
 {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
 </button>
 );
 })
 )}
 </div>
 </div>
 )}
 </div>
 );
};

export const MontessoriVoiceLoggerDrawer: React.FC<MontessoriVoiceLoggerDrawerProps> = ({
 isOpen,
 onClose,
 initialTargetType = 'lesson',
 environmentId,
 preselectedStudentId,
 selectedDate,
 onTargetTypeChange,
 onSaved
}) => {
 // Wizard Step: 'select' -> 'recording' -> 'student_confirm' -> 'prefill'
 const [wizardStep, setWizardStep] = useState<VoiceLoggerWizardStep>('select');
 const [targetType, setTargetType] = useState<VoiceLoggerTargetType>(initialTargetType);

 const handleSelectTarget = (type: VoiceLoggerTargetType) => {
 setTargetType(type);
 if (onTargetTypeChange) {
 onTargetTypeChange(type);
 }
 };

 // Manual text mode toggle
 const [isTextMode, setIsTextMode] = useState(false);
 const [rawTextInput, setRawTextInput] = useState('');
 const [showRecordingAdvice, setShowRecordingAdvice] = useState(false);

 // Speech Recognition state
 const [transcript, setTranscript] = useState('');
 const [interimTranscript, setInterimTranscript] = useState('');
 const [recordingSeconds, setRecordingSeconds] = useState(0);
 const [isStructuring, setIsStructuring] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 const [permissionError, setPermissionError] = useState<string | null>(null);

 // Status & Data
 const [aiStatus, setAiStatus] = useState<{ configured: boolean; model: string; provider: string }>({
 configured: true,
 model: 'gpt-5.6-luna',
 provider: 'OpenAI'
 });
 const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
 const [students, setStudents] = useState<StudentItem[]>([]);
 const [curriculum, setCurriculum] = useState<MontessoriAreaItem[]>([]);
 const [trackerCategories, setTrackerCategories] = useState<TrackerCategoryItem[]>([]);

 // Student Candidates Match List for Wizard Step 'student_confirm'
 const [candidateMatches, setCandidateMatches] = useState<StudentCandidateMatch[]>([]);
 const [confirmedStudent, setConfirmedStudent] = useState<StudentItem | null>(null);
 const [customStudentSearch, setCustomStudentSearch] = useState('');

 // Pre-filled Form State
 const [lessonRecords, setLessonRecords] = useState<EditableLessonRecord[]>([]);
 const [trackerRecords, setTrackerRecords] = useState<EditableTrackerRecord[]>([]);
 const [reviewIndex, setReviewIndex] = useState(0);
 const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
 const photoInputRef = useRef<HTMLInputElement | null>(null);

 // Audio Visualizer Refs
 const canvasRef = useRef<HTMLCanvasElement | null>(null);
 const audioContextRef = useRef<AudioContext | null>(null);
 const analyserRef = useRef<AnalyserNode | null>(null);
 const mediaStreamRef = useRef<MediaStream | null>(null);
 const animationFrameRef = useRef<number | null>(null);

 // Speech Recognition & Timer Refs
 const recognitionRef = useRef<any>(null);
 const timerRef = useRef<any>(null);

 useEffect(() => {
 if (isOpen) {
 setTargetType(initialTargetType);
 if (onTargetTypeChange) {
 onTargetTypeChange(initialTargetType);
 }
 setWizardStep('select');
 setTranscript('');
 setInterimTranscript('');
 setRawTextInput('');
 setIsTextMode(false);
 setLessonRecords([]);
 setTrackerRecords([]);
 setReviewIndex(0);
 setCandidateMatches([]);
 setConfirmedStudent(null);
 setShowRecordingAdvice(false);
 }
 }, [isOpen, initialTargetType]);

 useEffect(() => {
 if (!isOpen) return;

 getMontessoriAiStatus()
 .then(setAiStatus)
 .catch(() => setAiStatus({ configured: false, model: 'gpt-5.6-luna', provider: 'None' }));

 getStudents()
 .then(allStudents => {
 let filtered = allStudents.filter(s => (s.status || '').toLowerCase() !== 'archived');
 if (environmentId) {
 const envMatches = filtered.filter(s => s.environment_id === environmentId || (s as any).environmentId === environmentId);
 if (envMatches.length > 0) filtered = envMatches;
 }
 setStudents(filtered);
 })
 .catch(console.error);

 getMontessoriCurriculum().then(setCurriculum).catch(console.error);
 getTrackerCategories().then(setTrackerCategories).catch(console.error);

 const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
 if (!SpeechRecognition) {
 setHasSpeechSupport(false);
 setIsTextMode(true);
 }
 }, [isOpen, environmentId]);

 useEffect(() => {
 if (wizardStep === 'recording') {
 setRecordingSeconds(0);
 timerRef.current = setInterval(() => setRecordingSeconds(prev => prev + 1), 1000);
 } else {
 if (timerRef.current) clearInterval(timerRef.current);
 }
 return () => {
 if (timerRef.current) clearInterval(timerRef.current);
 };
 }, [wizardStep]);

 const stopAudioVisualizer = () => {
 if (animationFrameRef.current) {
 cancelAnimationFrame(animationFrameRef.current);
 animationFrameRef.current = null;
 }
 if (mediaStreamRef.current) {
 mediaStreamRef.current.getTracks().forEach(track => track.stop());
 mediaStreamRef.current = null;
 }
 if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
 audioContextRef.current.close().catch(() => {});
 audioContextRef.current = null;
 }
 };

 useEffect(() => {
 return () => {
 stopAudioVisualizer();
 if (recognitionRef.current) {
 try {
 recognitionRef.current.stop();
 } catch {}
 }
 };
 }, []);

 const startRecordingSession = async () => {
 const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
 if (!SpeechRecognition) {
 toast.error('Reconocimiento de voz no soportado en este navegador.');
 setIsTextMode(true);
 return;
 }

 setPermissionError(null);

 // 1. Explicitly check/request microphone access
 let stream: MediaStream | null = null;
 try {
 stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 } catch (err: any) {
 console.warn('[MIC_PERMISSION_DENIED]', err);
 cancelRecording();
 setWizardStep('select');
 const msg = 'No tienes permisos para usar el micrófono en este navegador. Habilita el acceso para poder dictar.';
 setPermissionError(msg);
 toast.error(msg);
 return;
 }

 setTranscript('');
 setInterimTranscript('');
 setWizardStep('recording');

 try {
 mediaStreamRef.current = stream;

 const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
 const audioCtx = new AudioCtx();
 audioContextRef.current = audioCtx;

 const analyser = audioCtx.createAnalyser();
 analyser.fftSize = 128;
 analyser.smoothingTimeConstant = 0.8;
 analyserRef.current = analyser;

 const source = audioCtx.createMediaStreamSource(stream);
 source.connect(analyser);

 renderWaveform();
 } catch (err: any) {
 console.warn('[AUDIO VISUALIZER ERROR]', err);
 }

 try {
 const recognition = new SpeechRecognition();
 recognition.continuous = true;
 recognition.interimResults = true;
 recognition.lang = 'es-MX';

 recognition.onresult = (event: any) => {
 let currentInterim = '';
 let finalChunk = '';

 for (let i = event.resultIndex; i < event.results.length; ++i) {
 if (event.results[i].isFinal) {
 finalChunk += event.results[i][0].transcript + ' ';
 } else {
 currentInterim += event.results[i][0].transcript;
 }
 }

 if (finalChunk) {
 setTranscript(prev => (prev ? prev + ' ' + finalChunk.trim() : finalChunk.trim()));
 }
 setInterimTranscript(currentInterim);
 };

 recognition.onerror = (event: any) => {
 if (event.error === 'not-allowed') {
 const msg = 'No tienes permisos para usar el micrófono en este navegador.';
 setPermissionError(msg);
 toast.error(msg);
 cancelRecording();
 setWizardStep('select');
 }
 };

 recognitionRef.current = recognition;
 recognition.start();
 } catch (err: any) {
 const msg = 'No tienes permisos para usar el micrófono en este navegador.';
 setPermissionError(msg);
 toast.error(msg);
 cancelRecording();
 setWizardStep('select');
 }
 };

 const renderWaveform = () => {
 const canvas = canvasRef.current;
 const analyser = analyserRef.current;
 if (!canvas || !analyser) return;

 const ctx = canvas.getContext('2d');
 if (!ctx) return;

 const bufferLength = analyser.frequencyBinCount;
 const dataArray = new Uint8Array(bufferLength);

 const draw = () => {
 animationFrameRef.current = requestAnimationFrame(draw);
 analyser.getByteFrequencyData(dataArray);

 const width = canvas.width;
 const height = canvas.height;

 ctx.clearRect(0, 0, width, height);

 const barWidth = (width / bufferLength) * 2.2;
 let x = 0;

 for (let i = 0; i < bufferLength; i++) {
 const barHeightPercent = dataArray[i] / 255;
 const barHeight = Math.max(6, barHeightPercent * height * 0.85);

 const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
 gradient.addColorStop(0, '#ec4899');
 gradient.addColorStop(0.5, '#a855f7');
 gradient.addColorStop(1, '#6366f1');

 ctx.fillStyle = gradient;
 ctx.shadowBlur = 15;
 ctx.shadowColor = '#a855f7';

 const y = (height - barHeight) / 2;
 ctx.beginPath();
 ctx.roundRect(x, y, barWidth - 3, barHeight, 6);
 ctx.fill();

 x += barWidth;
 }
 };

 draw();
 };

 const cancelRecording = () => {
 stopAudioVisualizer();
 if (recognitionRef.current) {
 try {
 recognitionRef.current.stop();
 } catch {}
 }
 setWizardStep('select');
 };

 const finishRecordingAndProcess = async () => {
 const finalCapturedText = (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim();

 stopAudioVisualizer();
 if (recognitionRef.current) {
 try {
 recognitionRef.current.stop();
 } catch {}
 }

 if (!finalCapturedText) {
 toast.error('No se detectó audio. Intenta dictar nuevamente.');
 setWizardStep('select');
 return;
 }

 await processTextWithAi(finalCapturedText);
 };

 const processTextWithAi = async (text: string) => {
 setIsStructuring(true);
 try {
 const res = await structureMontessoriVoiceObservation({
 rawText: text,
 targetType,
 environmentId,
 studentId: preselectedStudentId
 });

 const items = res.results || res.observations || [];
 const firstItem = items[0] || {};

 // Rank student matches with fuzzy phonetic algorithm
 const rankedMatches = rankStudentMatches(
 text,
 firstItem.studentName,
 firstItem.studentId || preselectedStudentId,
 students
 );

 setCandidateMatches(rankedMatches);

 // Best match
 const best = rankedMatches[0];
 const selectedMatchStudent = best && best.score >= 0.4 ? best.student : null;
 setConfirmedStudent(selectedMatchStudent);

 // Map lesson or tracker records
 if (targetType === 'lesson') {
 const mapped: EditableLessonRecord[] = items.map((item, idx) => ({
 id: `lesson_${Date.now()}_${idx}`,
 studentId: selectedMatchStudent?.id || item.studentId || null,
 studentName: selectedMatchStudent ? (selectedMatchStudent.full_name || (selectedMatchStudent as any).fullName) : item.studentName || '',
 lessonId: item.lessonId || null,
 lessonName: item.lessonName || '',
 areaName: item.areaName || '',
 status: (['PRESENTED', 'PRACTICING', 'MASTERED', 'SURPASSED'].includes(item.status || '')
 ? item.status
 : 'PRACTICING') as any,
 notes: item.notes || item.cleanContent || '',
 isPublic: false
 }));

 setLessonRecords(mapped);
 setTrackerRecords([]);
 } else {
 const mapped: EditableTrackerRecord[] = items.map((item, idx) => ({
 id: `tracker_${Date.now()}_${idx}`,
 studentId: selectedMatchStudent?.id || item.studentId || null,
 studentName: selectedMatchStudent ? (selectedMatchStudent.full_name || (selectedMatchStudent as any).fullName) : item.studentName || '',
 trackerCategoryId: item.trackerCategoryId || null,
 trackerCategoryName: item.trackerCategoryName || '',
 trackerItemId: item.trackerItemId || null,
 trackerItemName: item.trackerItemName || '',
 status: (['YES', 'NO', 'PARTIAL'].includes(item.status || '') ? item.status : 'YES') as any,
 publicNote: item.publicNote || '',
 internalNote: item.internalNote || item.cleanContent || item.notes || ''
 }));

 setTrackerRecords(mapped);
 setLessonRecords([]);
 }

 // Transition to Step 1 of Wizard: Student Confirmation!
 setWizardStep('student_confirm');
 } catch (err: any) {
 console.error('[AI PROCESSING ERROR]', err);
 toast.error(err.message || 'Error al conectar con la IA.');

 // Fallback ranking
 const rankedMatches = rankStudentMatches(text, undefined, preselectedStudentId, students);
 setCandidateMatches(rankedMatches);
 setConfirmedStudent(rankedMatches[0]?.student || null);

 if (targetType === 'lesson') {
 setLessonRecords([
 {
 id: `lesson_${Date.now()}`,
 studentId: rankedMatches[0]?.student?.id || preselectedStudentId || null,
 lessonId: null,
 status: 'PRACTICING',
 notes: text,
 isPublic: false
 }
 ]);
 } else {
 setTrackerRecords([
 {
 id: `tracker_${Date.now()}`,
 studentId: rankedMatches[0]?.student?.id || preselectedStudentId || null,
 trackerCategoryId: null,
 trackerItemId: null,
 status: 'YES',
 publicNote: '',
 internalNote: text
 }
 ]);
 }
 setWizardStep('student_confirm');
 } finally {
 setIsStructuring(false);
 }
 };

 // When user selects or confirms the student in Wizard Step 1
 const handleConfirmStudentAndAdvance = (student: StudentItem) => {
 setConfirmedStudent(student);
 const studentName = student.full_name || (student as any).fullName || '';

 if (targetType === 'lesson') {
 setLessonRecords(prev =>
 prev.map(r => ({ ...r, studentId: student.id, studentName }))
 );
 } else {
 setTrackerRecords(prev =>
 prev.map(r => ({ ...r, studentId: student.id, studentName }))
 );
 }

 setReviewIndex(0);
 setWizardStep('prefill');
 };

 const allLessons = useMemo(() => {
 const list: Array<{ id: string; name: string; areaName: string }> = [];
 curriculum.forEach(area => {
 area.categories?.forEach(cat => {
 cat.lessons?.forEach(les => {
 list.push({ id: les.id, name: les.name, areaName: area.name });
 });
 });
 });
 return list;
 }, [curriculum]);

 const allTrackerItems = useMemo(() => {
 const list: Array<{ id: string; name: string; categoryName: string; categoryId: string }> = [];
 trackerCategories.forEach(cat => {
 cat.subcategories?.forEach(sub => {
 sub.items?.forEach(item => {
 list.push({ id: item.id, name: item.name, categoryName: cat.name, categoryId: cat.id });
 });
 });
 });
 return list;
 }, [trackerCategories]);

 const formatTime = (secs: number) => {
 const mins = Math.floor(secs / 60);
 const remaining = secs % 60;
 return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
 };

 const handlePhotoSelected = async (file: File) => {
 if (!file) return;
 if (!file.type.startsWith('image/')) {
 toast.error('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP)');
 return;
 }

 setIsUploadingPhoto(true);
 try {
 const res = await uploadFile(file, 'observations');
 if (targetType === 'lesson') {
 setLessonRecords(prev =>
 prev.map((it, i) => (i === reviewIndex ? { ...it, photoUrl: res.url } : it))
 );
 } else {
 setTrackerRecords(prev =>
 prev.map((it, i) => (i === reviewIndex ? { ...it, photoUrl: res.url } : it))
 );
 }
 toast.success(' Fotografía adjuntada');
 } catch (err: any) {
 toast.error(err.message || 'Error al subir la imagen');
 } finally {
 setIsUploadingPhoto(false);
 }
 };

 const handleRemovePhoto = () => {
 if (targetType === 'lesson') {
 setLessonRecords(prev =>
 prev.map((it, i) => (i === reviewIndex ? { ...it, photoUrl: undefined } : it))
 );
 } else {
 setTrackerRecords(prev =>
 prev.map((it, i) => (i === reviewIndex ? { ...it, photoUrl: undefined } : it))
 );
 }
 };

 const handleSaveCurrentNote = async (advance: boolean = true) => {
 const customDateIso = selectedDate ? `${selectedDate}T12:00:00.000Z` : undefined;

 if (targetType === 'lesson') {
 const rec = lessonRecords[reviewIndex];
 if (!rec) return;
 if (!rec.studentId) {
 toast.error('Por favor selecciona el alumno para esta lección');
 return;
 }

 setIsSaving(true);
 try {
 if (rec.lessonId) {
 await saveMontessoriProgress({
 studentId: rec.studentId,
 lessonId: rec.lessonId,
 status: rec.status,
 notes: rec.notes.trim(),
 presentedAt: customDateIso
 });
 }
 if (rec.notes.trim() || rec.photoUrl) {
 await saveStructuredMontessoriObservation({
 studentId: rec.studentId,
 content: rec.notes.trim(),
 photoUrl: rec.photoUrl || '',
 isPublic: rec.isPublic,
 lessonId: rec.lessonId || undefined,
 lessonPeriod: rec.status as any,
 date: customDateIso,
 createdAt: customDateIso
 });
 }

 setLessonRecords(prev =>
 prev.map((it, i) => (i === reviewIndex ? { ...it, saved: true } : it))
 );

 const isLast = reviewIndex >= lessonRecords.length - 1;
 if (isLast) {
 toast.success(' Todas las lecciones han sido guardadas con éxito');
 if (onSaved) onSaved(targetType);
 onClose();
 } else {
 toast.success(` Lección ${reviewIndex + 1} de ${lessonRecords.length} guardada`);
 if (advance) {
 setReviewIndex(prev => prev + 1);
 }
 }
 } catch (err: any) {
 toast.error(err.message || 'Error al guardar la lección');
 } finally {
 setIsSaving(false);
 }
 } else {
 const rec = trackerRecords[reviewIndex];
 if (!rec) return;
 if (!rec.studentId) {
 toast.error('Por favor selecciona el alumno para este tracker');
 return;
 }

 setIsSaving(true);
 try {
 const fullContent = [
 rec.trackerItemName
 ? `[${rec.trackerItemName}]: ${rec.status === 'YES' ? 'Realizado' : rec.status === 'PARTIAL' ? 'En proceso' : 'No realizado'}`
 : '',
 rec.publicNote ? `Familias: ${rec.publicNote}` : '',
 rec.internalNote ? `Interno Guía: ${rec.internalNote}` : ''
 ]
 .filter(Boolean)
 .join('\n\n');

 await saveStructuredMontessoriObservation({
 studentId: rec.studentId,
 content: fullContent,
 photoUrl: rec.photoUrl || '',
 isPublic: Boolean(rec.publicNote),
 date: customDateIso,
 createdAt: customDateIso
 });

 setTrackerRecords(prev =>
 prev.map((it, i) => (i === reviewIndex ? { ...it, saved: true } : it))
 );

 const isLast = reviewIndex >= trackerRecords.length - 1;
 if (isLast) {
 toast.success(' Todos los trackers han sido guardados con éxito');
 if (onSaved) onSaved(targetType);
 onClose();
 } else {
 toast.success(` Tracker ${reviewIndex + 1} de ${trackerRecords.length} guardado`);
 if (advance) {
 setReviewIndex(prev => prev + 1);
 }
 }
 } catch (err: any) {
 toast.error(err.message || 'Error al guardar el tracker');
 } finally {
 setIsSaving(false);
 }
 }
 };

 const handleDeleteCurrentNote = () => {
 if (targetType === 'lesson') {
 if (lessonRecords.length <= 1) {
 setLessonRecords([]);
 onClose();
 return;
 }
 setLessonRecords(prev => prev.filter((_, i) => i !== reviewIndex));
 setReviewIndex(prev => Math.min(prev, lessonRecords.length - 2));
 } else {
 if (trackerRecords.length <= 1) {
 setTrackerRecords([]);
 onClose();
 return;
 }
 setTrackerRecords(prev => prev.filter((_, i) => i !== reviewIndex));
 setReviewIndex(prev => Math.min(prev, trackerRecords.length - 2));
 }
 toast.info('Nota descartada');
 };

 const handleSaveAll = async () => {
 const customDateIso = selectedDate ? `${selectedDate}T12:00:00.000Z` : undefined;

 if (targetType === 'lesson') {
 if (lessonRecords.length === 0) return;
 for (const rec of lessonRecords) {
 if (!rec.studentId) {
 toast.error('Por favor selecciona el alumno para cada lección');
 return;
 }
 }

 setIsSaving(true);
 try {
 for (const rec of lessonRecords) {
 if (rec.lessonId) {
 await saveMontessoriProgress({
 studentId: rec.studentId!,
 lessonId: rec.lessonId,
 status: rec.status,
 notes: rec.notes.trim(),
 presentedAt: customDateIso
 });
 }
 if (rec.notes.trim() || rec.photoUrl) {
 await saveStructuredMontessoriObservation({
 studentId: rec.studentId!,
 content: rec.notes.trim(),
 photoUrl: rec.photoUrl || '',
 isPublic: rec.isPublic,
 lessonId: rec.lessonId || undefined,
 lessonPeriod: rec.status as any,
 date: customDateIso,
 createdAt: customDateIso
 });
 }
 }
 toast.success(' Seguimiento de lecciones guardado');
 if (onSaved) onSaved(targetType);
 onClose();
 } catch (err: any) {
 toast.error(err.message || 'Error al guardar');
 } finally {
 setIsSaving(false);
 }
 } else {
 if (trackerRecords.length === 0) return;
 for (const rec of trackerRecords) {
 if (!rec.studentId) {
 toast.error('Por favor selecciona el alumno para cada tracker');
 return;
 }
 }

 setIsSaving(true);
 try {
 for (const rec of trackerRecords) {
 const fullContent = [
 rec.trackerItemName
 ? `[${rec.trackerItemName}]: ${rec.status === 'YES' ? 'Realizado' : rec.status === 'PARTIAL' ? 'En proceso' : 'No realizado'}`
 : '',
 rec.publicNote ? `Familias: ${rec.publicNote}` : '',
 rec.internalNote ? `Interno Guía: ${rec.internalNote}` : ''
 ]
 .filter(Boolean)
 .join('\n\n');

 await saveStructuredMontessoriObservation({
 studentId: rec.studentId!,
 content: fullContent,
 photoUrl: rec.photoUrl || '',
 isPublic: Boolean(rec.publicNote),
 date: customDateIso,
 createdAt: customDateIso
 });
 }
 toast.success(' Registro de trackers y notas guardado');
 if (onSaved) onSaved(targetType);
 onClose();
 } catch (err: any) {
 toast.error(err.message || 'Error al guardar');
 } finally {
 setIsSaving(false);
 }
 }
 };

 if (!isOpen) return null;

 return (
 <>
 {/* ========================================================================= */}
 {/* STEP 2: FULLSCREEN LIVE RECORDING VIEW */}
 {/* ========================================================================= */}
 {wizardStep === 'recording' && (
 <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-300 select-none">
 {/* Top Status Bar */}
 <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold font-mono">
 <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
 <span>GRABANDO EN VIVO</span>
 </div>
 <span className="text-xl font-bold font-mono tracking-wider text-gray-200">
 {formatTime(recordingSeconds)}
 </span>
 </div>

 <div className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-gray-300 font-semibold flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-purple-400" />
 <span>{targetType === 'lesson' ? 'Seguimiento de Lección' : 'Tracker / Rutina'}</span>
 </div>
 </div>

 {/* Center: Waveform OR AI Loading */}
 <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center space-y-6 text-center">
 {isStructuring ? (
 <div className="flex flex-col items-center justify-center space-y-5 py-8 animate-in fade-in">
 <div className="relative flex items-center justify-center">
 <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-indigo-500/30 blur-2xl animate-pulse" />
 <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 ring-4 ring-white/20">
 <RefreshCw className="w-8 h-8 animate-spin" />
 </div>
 </div>

 <div className="space-y-1.5">
 <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
 Estructurando observación con IA...
 </h2>
 <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
 Analizando el dictado pedagógico y organizando los registros del aula.
 </p>
 </div>
 </div>
 ) : (
 <>
 <div className="relative flex items-center justify-center">
 <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-indigo-600/30 blur-2xl animate-pulse" />
 <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-purple-500/40 ring-4 ring-white/20">
 <Mic className="w-10 h-10 animate-bounce" />
 </div>
 </div>

 <div>
 <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
 Escuchando tu observación...
 </h2>
 <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-md mx-auto">
 {targetType === 'lesson'
 ? 'Menciona el alumno, el material Montessori, el nivel de avance y detalles observados.'
 : 'Menciona el alumno, la rutina o hábito, y lo que deseas comunicar a la familia o al equipo.'}
 </p>
 </div>

 <div className="w-full bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-md shadow-2xl">
 <canvas ref={canvasRef} width={600} height={100} className="w-full h-24 sm:h-28" />
 </div>

 <div className="w-full min-h-[5rem] max-h-32 overflow-y-auto p-4 rounded-2xl bg-black/60 border border-white/10 text-left">
 <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
 <Volume2 className="w-3.5 h-3.5 text-purple-400" />
 Transcripción en tiempo real:
 </p>
 <p className="text-sm sm:text-base text-gray-100 font-medium leading-relaxed">
 {transcript || interimTranscript ? (
 <>
 <span className="text-white">{transcript}</span>
 <span className="text-purple-300 italic"> {interimTranscript}</span>
 </>
 ) : (
 <span className="text-gray-500 italic">Comienza a hablar frente al micrófono...</span>
 )}
 </p>
 </div>
 </>
 )}
 </div>

 {/* Bottom Action Controls: Equal Sized Buttons */}
 <div className="w-full max-w-2xl mx-auto flex items-center justify-center gap-8 sm:gap-14 pb-4">
 <button
 type="button"
 disabled={isStructuring}
 onClick={cancelRecording}
 className="flex flex-col items-center gap-2 group cursor-pointer disabled:opacity-40"
 >
 <div className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300 group-hover:text-white flex items-center justify-center transition-all transform active:scale-95 shadow-lg">
 <X className="w-6 h-6" />
 </div>
 <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-200">Cancelar</span>
 </button>

 <button
 type="button"
 disabled={isStructuring}
 onClick={finishRecordingAndProcess}
 className="flex flex-col items-center gap-2 group cursor-pointer disabled:opacity-60"
 >
 <div className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/40 ring-4 ring-white/30">
 {isStructuring ? (
 <RefreshCw className="w-6 h-6 animate-spin" />
 ) : (
 <Check className="w-6 h-6 stroke-[3]" />
 )}
 </div>
 <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
 {isStructuring ? 'Procesando...' : 'Finalizar'}
 </span>
 </button>
 </div>
 </div>
 )}

 {/* ========================================================================= */}
 {/* DRAWER VIEWS: SELECTION, STUDENT CONFIRMATION WIZARD & PREFILL REVIEW */}
 {/* ========================================================================= */}
 {wizardStep !== 'recording' && (
 <SlideOverDrawer
 isOpen={isOpen}
 onClose={onClose}
 title={
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
 <Sparkles className="w-4 h-4" />
 </div>
 <div>
 <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
 {wizardStep === 'select'
 ? 'Dictado Asistido por IA'
 : wizardStep === 'student_confirm'
 ? 'Paso 1: Confirmar Alumno'
 : 'Paso 2: Revisión de Registro'}
 <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
 {wizardStep === 'select'
 ? 'Inicio'
 : wizardStep === 'student_confirm'
 ? 'Paso 1 de 2'
 : 'Paso 2 de 2'}
 </span>
 </h3>
 <p className="text-xs text-gray-500 dark:text-gray-400">
 {wizardStep === 'select'
 ? 'Selecciona el tipo de registro e inicia la grabación'
 : wizardStep === 'student_confirm'
 ? 'Identificación inteligente y validación del alumno'
 : 'Revisa y ajusta los detalles antes de guardar en el sistema'}
 </p>
 </div>
 </div>
 }
 maxWidthClass="max-w-xl lg:max-w-2xl"
 >
 <div className="p-5 space-y-5">
 {/* ------------------------------------------------------------- */}
 {/* WIZARD STEP 1: INITIAL TARGET SELECTION */}
 {/* ------------------------------------------------------------- */}
 {wizardStep === 'select' && (
 <div className="space-y-5 animate-in fade-in">
 <div className="space-y-2">
 <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
 1. ¿Qué vas a registrar?
 </label>
 <div className="grid grid-cols-2 gap-3">
 <button
 type="button"
 onClick={() => handleSelectTarget('lesson')}
 className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
 targetType === 'lesson'
 ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-sm'
 : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300'
 }`}
 >
 <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
 <BookOpen className="w-4 h-4" />
 </div>
 <div>
 <p className="text-xs font-bold">Seguimiento de Lección</p>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
 Material, 3 Tiempos de Séguin y notas pedagógicas.
 </p>
 </div>
 </button>

 <button
 type="button"
 onClick={() => handleSelectTarget('tracker')}
 className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
 targetType === 'tracker'
 ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20 shadow-sm'
 : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300'
 }`}
 >
 <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
 <CheckSquare className="w-4 h-4" />
 </div>
 <div>
 <p className="text-xs font-bold">Tracker / Hábito</p>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
 Rutina realizada, nota a familias y juicio interno.
 </p>
 </div>
 </button>
 </div>
 </div>

 {/* Microphone Permission Warning Banner */}
 {permissionError && (
 <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in">
 <div className="flex items-center gap-2.5 min-w-0">
 <MicOff className="w-4 h-4 text-rose-600 shrink-0" />
 <span className="leading-snug">{permissionError}</span>
 </div>
 <button
 type="button"
 onClick={() => startRecordingSession()}
 className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
 >
 <RefreshCw className="w-3 h-3" />
 <span>Solicitar Permiso</span>
 </button>
 </div>
 )}

 {!isTextMode ? (
 showRecordingAdvice ? (
 <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white border-2 border-indigo-500/40 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
 <Sparkles className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-white">
 {targetType === 'lesson'
 ? 'Recomendación para Seguimiento de Lección'
 : 'Recomendación para Registro de Tracker / Hábito'}
 </h4>
 <p className="text-[11px] text-gray-300">
 {targetType === 'lesson'
 ? 'Estructuración pedagógica y 3 Tiempos de Séguin'
 : 'Seguimiento de rutinas, nota pública a familias y notas internas'}
 </p>
 </div>
 </div>

 <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-xs text-gray-200 leading-relaxed space-y-2.5">
 <p className="font-semibold text-amber-200">
 {targetType === 'lesson'
 ? ' Recuerda mencionar el nombre y apellido del estudiante y los detalles pedagógicos observados:'
 : ' Recuerda mencionar el nombre y apellido del estudiante y el estado de la rutina o hábito:'}
 </p>
 {targetType === 'lesson' ? (
 <ul className="text-[11px] text-gray-300 space-y-1.5 pl-0.5">
 <li className="flex items-start gap-1.5">
 <span className="text-amber-300"></span>
 <span><strong>Alumno:</strong> Nombre y apellido (ej. <em>«Allan Rodríguez»</em>).</span>
 </li>
 <li className="flex items-start gap-1.5">
 <span className="text-indigo-300"></span>
 <span><strong>Lección o Material:</strong> Área y nombre del material (ej. <em>«Las Barras Rojas de Longitud»</em>).</span>
 </li>
 <li className="flex items-start gap-1.5">
 <span className="text-emerald-300"></span>
 <span><strong>Estado de dominio:</strong> <em>Presentado</em>, <em>En práctica</em>, <em>Dominado</em> o <em>Superado</em>.</span>
 </li>
 <li className="flex items-start gap-1.5">
 <span className="text-purple-300"></span>
 <span><strong>Detalles:</strong> Nivel de concentración, orden, control de error y autonomía.</span>
 </li>
 </ul>
 ) : (
 <ul className="text-[11px] text-gray-300 space-y-1.5 pl-0.5">
 <li className="flex items-start gap-1.5">
 <span className="text-amber-300"></span>
 <span><strong>Alumno:</strong> Nombre y apellido (ej. <em>«Mateo Gómez»</em>).</span>
 </li>
 <li className="flex items-start gap-1.5">
 <span className="text-purple-300"></span>
 <span><strong>Hábito o Rutina:</strong> Control de esfínteres / baño, siesta, merienda o comida.</span>
 </li>
 <li className="flex items-start gap-1.5">
 <span className="text-emerald-300"></span>
 <span><strong>Resultado:</strong> Si se realizó de forma autónoma, con apoyo o si no se logró.</span>
 </li>
 <li className="flex items-start gap-1.5">
 <span className="text-blue-300"></span>
 <span><strong>Notas:</strong> Mensaje cálido para la familia y observaciones internas para el equipo de guías.</span>
 </li>
 </ul>
 )}
 </div>

 <div className="flex items-center gap-2 pt-1">
 <button
 type="button"
 onClick={() => setShowRecordingAdvice(false)}
 className="py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
 >
 Cancelar
 </button>

 <button
 type="button"
 onClick={() => {
 setShowRecordingAdvice(false);
 startRecordingSession();
 }}
 className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
 >
 <Check className="w-4 h-4 stroke-[3]" />
 <span>¡Entendido, comenzar a grabar!</span>
 </button>
 </div>
 </div>
 ) : (
 <div className="p-6 rounded-3xl bg-gradient-to-b from-gray-900 to-black text-white text-center space-y-4 shadow-xl border border-gray-800">
 <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mx-auto text-white shadow-lg shadow-indigo-500/30">
 <Mic className="w-8 h-8" />
 </div>
 <div>
 <h4 className="text-base font-bold">Grabar Observación por Voz</h4>
 <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
 Se abrirá el grabador a pantalla completa con visualizador de frecuencia de onda viva.
 </p>
 </div>

 <button
 type="button"
 onClick={() => setShowRecordingAdvice(true)}
 className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
 >
 <Radio className="w-4 h-4 animate-pulse text-amber-300" />
 <span>Comenzar a Grabar a Pantalla Completa</span>
 </button>

 <button
 type="button"
 onClick={() => setIsTextMode(true)}
 className="text-xs text-gray-400 hover:text-white underline pt-1 block mx-auto cursor-pointer"
 >
 O prefiero escribir texto rápido
 </button>
 </div>
 )
 ) : (
 <div className="space-y-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
 <div className="flex items-center justify-between">
 <label className="text-xs font-bold text-gray-800 dark:text-gray-200">
 Escribir Observación Libre:
 </label>
 <button
 type="button"
 onClick={() => setIsTextMode(false)}
 className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
 >
 ← Volver al modo voz
 </button>
 </div>
 <textarea
 rows={4}
 value={rawTextInput}
 onChange={e => setRawTextInput(e.target.value)}
 placeholder="Escribe la observación libremente..."
 className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-indigo-500"
 />
 <button
 type="button"
 disabled={!rawTextInput.trim()}
 onClick={() => processTextWithAi(rawTextInput)}
 className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
 >
 <Sparkles className="w-4 h-4 text-amber-300" />
 <span>Estructurar y Validar Alumno</span>
 </button>
 </div>
 )}
 </div>
 )}

 {/* ------------------------------------------------------------- */}
 {/* WIZARD STEP 2: STUDENT IDENTIFICATION & CONFIRMATION WIZARD */}
 {/* ------------------------------------------------------------- */}
 {wizardStep === 'student_confirm' && (
 <div className="space-y-5 animate-in fade-in">
 {/* Header with backtrack */}
 <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
 <button
 type="button"
 onClick={() => setWizardStep('select')}
 className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer"
 >
 <ArrowLeft className="w-3.5 h-3.5" />
 <span>Volver a Grabar</span>
 </button>
 <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
 Paso 1: Selección de Alumno
 </span>
 </div>

 {/* CASE A: HIGH CONFIDENCE MATCH (>= 75%) */}
 {candidateMatches.length > 0 && candidateMatches[0].score >= 0.75 ? (
 <div className="space-y-4">
 <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-indigo-50/40 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-indigo-950/30 border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-lg space-y-4">
 <div className="flex items-center justify-between">
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm">
 <CheckCircle2 className="w-3.5 h-3.5" />
 Niño Detectado con Alta Probabilidad
 </span>

 <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
 {candidateMatches[0].confidencePercent}% Coincidencia
 </span>
 </div>

 {/* Detected Student Hero */}
 <div className="flex items-center gap-4 pt-1">
 <StudentAvatar
 fullName={candidateMatches[0].student.full_name || (candidateMatches[0].student as any).fullName}
 avatarUrl={candidateMatches[0].student.avatar_url || (candidateMatches[0].student as any).avatarUrl}
 sizeClass="w-16 h-16"
 textSizeClass="text-lg"
 />
 <div>
 <h4 className="text-base font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
 {candidateMatches[0].student.full_name || (candidateMatches[0].student as any).fullName}
 </h4>
 <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
 {candidateMatches[0].student.grade || candidateMatches[0].student.environment_name || 'Salón de Clases'}
 </p>
 {candidateMatches[0].matchedBy === 'phonetic' && (
 <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
 Coincidencia fonética / ortográfica aproximada
 </p>
 )}
 </div>
 </div>

 {/* Confirm CTA */}
 <button
 type="button"
 onClick={() => handleConfirmStudentAndAdvance(candidateMatches[0].student)}
 className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all transform hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
 >
 <Check className="w-4 h-4 stroke-[3]" />
 <span>Confirmar este Alumno y Continuar →</span>
 </button>
 </div>

 {/* Or choose from other close candidates */}
 {candidateMatches.length > 1 && candidateMatches[1].score >= 0.4 && (
 <div className="space-y-2 pt-2">
 <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
 ¿Te referías a otro alumno similar?
 </p>
 <div className="space-y-1.5">
 {candidateMatches.slice(1, 4).map(c => (
 <button
 key={c.student.id}
 type="button"
 onClick={() => handleConfirmStudentAndAdvance(c.student)}
 className="w-full flex items-center justify-between p-3 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-gray-900 transition-all text-left cursor-pointer group"
 >
 <div className="flex items-center gap-3">
 <StudentAvatar
 fullName={c.student.full_name || (c.student as any).fullName}
 avatarUrl={c.student.avatar_url || (c.student as any).avatarUrl}
 sizeClass="w-9 h-9"
 />
 <div>
 <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600">
 {c.student.full_name || (c.student as any).fullName}
 </p>
 <p className="text-[10px] text-gray-500 dark:text-gray-400">
 {c.student.grade || c.student.environment_name || 'Activo'}
 </p>
 </div>
 </div>
 <span className="text-[11px] text-indigo-600 font-bold flex items-center gap-1">
 Seleccionar <ArrowRight className="w-3 h-3" />
 </span>
 </button>
 ))}
 </div>
 </div>
 )}
 </div>
 ) : (
 /* CASE B: AMBIGUOUS OR MULTIPLE CANDIDATES (NO SINGLE EXACT MATCH) */
 <div className="space-y-4">
 <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1.5">
 <div className="flex items-center gap-2 font-bold text-xs">
 <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
 <span>No logramos determinar con total certeza el estudiante</span>
 </div>
 <p className="text-xs text-amber-800 dark:text-amber-300">
 Selecciona a quién corresponde el dictado de la siguiente lista de alumnos más probables:
 </p>
 </div>

 {/* Scored Candidate Cards */}
 <div className="space-y-2">
 {candidateMatches.slice(0, 4).map((c, idx) => (
 <button
 key={c.student.id}
 type="button"
 onClick={() => handleConfirmStudentAndAdvance(c.student)}
 className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer group ${
 idx === 0
 ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 hover:border-indigo-500'
 : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-indigo-400'
 }`}
 >
 <div className="flex items-center gap-3 min-w-0">
 <StudentAvatar
 fullName={c.student.full_name || (c.student as any).fullName}
 avatarUrl={c.student.avatar_url || (c.student as any).avatarUrl}
 sizeClass="w-11 h-11"
 />
 <div className="truncate">
 <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 truncate">
 {c.student.full_name || (c.student as any).fullName}
 </p>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
 {c.student.grade || c.student.environment_name || 'Salón de Clases'}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 {c.score > 0 && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
 {c.confidencePercent}%
 </span>
 )}
 <span className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">
 Elegir
 </span>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Fallback Manual Search for ANY other student */}
 <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
 <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">
 O buscar directamente en la lista completa del colegio:
 </label>
 <CustomStudentDropdown
 students={students}
 selectedStudentId={confirmedStudent?.id || null}
 onSelect={st => handleConfirmStudentAndAdvance(st)}
 />
 </div>
 </div>
 )}

 {/* ------------------------------------------------------------- */}
 {/* WIZARD STEP 3: STEP-BY-STEP REVIEW CAROUSEL & PHOTO UPLOAD */}
 {/* ------------------------------------------------------------- */}
 {wizardStep === 'prefill' && (
 <div className="space-y-4 animate-in fade-in">
 {/* Top Navigation & Wizard Step Header */}
 <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
 <button
 type="button"
 onClick={() => setWizardStep('student_confirm')}
 className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer"
 >
 <ArrowLeft className="w-3.5 h-3.5" />
 <span>Cambiar Alumno</span>
 </button>

 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
 {targetType === 'lesson' ? 'Lección Montessori' : 'Tracker de Rutina'}
 </span>
 <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
 {targetType === 'lesson'
 ? `${lessonRecords.length > 0 ? reviewIndex + 1 : 0} de ${lessonRecords.length}`
 : `${trackerRecords.length > 0 ? reviewIndex + 1 : 0} de ${trackerRecords.length}`}
 </span>
 </div>
 </div>

 {/* --- HORIZONTAL STEPPER PILLS (IF MULTIPLE NOTES) --- */}
 {((targetType === 'lesson' && lessonRecords.length > 1) || (targetType === 'tracker' && trackerRecords.length > 1)) && (
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none touch-pan-x">
 {(targetType === 'lesson' ? lessonRecords : trackerRecords).map((rec: any, idx: number) => {
 const isActive = idx === reviewIndex;
 const isSaved = rec.saved;
 const title = targetType === 'lesson'
 ? (rec.lessonName || `Lección ${idx + 1}`)
 : (rec.trackerItemName || `Hábito ${idx + 1}`);

 return (
 <button
 key={rec.id || idx}
 type="button"
 onClick={() => setReviewIndex(idx)}
 className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
 isActive
 ? 'bg-indigo-600 text-white shadow-xs scale-[1.02]'
 : isSaved
 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
 : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
 }`}
 >
 {isSaved ? (
 <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
 ) : (
 <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
 isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
 }`}>
 {idx + 1}
 </span>
 )}
 <span className="truncate max-w-[120px] sm:max-w-[160px]">{title}</span>
 {rec.photoUrl && <Camera className="w-3 h-3 shrink-0 opacity-80" />}
 </button>
 );
 })}
 </div>
 )}

 {/* --- CASE A: LESSON WIZARD CARD --- */}
 {targetType === 'lesson' && lessonRecords.length > 0 && (
 (() => {
 const item = lessonRecords[reviewIndex] || lessonRecords[0];
 const detectedStudent = students.find(s => s.id === item.studentId) || confirmedStudent;
 const studentName = detectedStudent ? (detectedStudent.full_name || (detectedStudent as any).fullName) : item.studentName;

 return (
 <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-900 shadow-sm space-y-4">
 {/* DETECTED STUDENT HERO BANNER WITH PHOTO */}
 <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-3">
 <div className="flex items-center gap-3 min-w-0">
 <StudentAvatar
 fullName={studentName || 'Alumno'}
 avatarUrl={detectedStudent?.avatar_url || (detectedStudent as any)?.avatarUrl}
 sizeClass="w-12 h-12"
 textSizeClass="text-sm"
 />
 <div className="truncate">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
 {studentName || 'Alumno no asignado'}
 </span>
 {item.saved && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
 <CheckCheck className="w-3 h-3" />
 Guardado
 </span>
 )}
 </div>
 <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
 {detectedStudent?.grade || detectedStudent?.environment_name || 'Salón de Clases'}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-1">
 <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-lg">
 #{reviewIndex + 1}
 </span>
 </div>
 </div>

 {/* Custom Lesson Selector & Dominio Pedagógico */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
 <div>
 <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
 Material / Lección Montessori:
 </label>
 <CustomLessonDropdown
 lessons={allLessons}
 selectedLessonId={item.lessonId}
 detectedName={item.lessonName}
 onSelect={les => {
 setLessonRecords(prev =>
 prev.map((it, i) =>
 i === reviewIndex
 ? {
 ...it,
 lessonId: les.id,
 lessonName: les.name,
 areaName: les.areaName
 }
 : it
 )
 );
 }}
 />
 </div>

 <div>
 <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
 Estado de Dominio Pedagógico:
 </label>
 <div className="grid grid-cols-2 gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
 {[
 { key: 'PRESENTED', label: '1º Presentado' },
 { key: 'PRACTICING', label: '2º En Práctica' },
 { key: 'MASTERED', label: '3º Dominado' },
 { key: 'SURPASSED', label: ' Superado' }
 ].map(st => (
 <button
 key={st.key}
 type="button"
 onClick={() => {
 setLessonRecords(prev =>
 prev.map((it, i) => (i === reviewIndex ? { ...it, status: st.key as any } : it))
 );
 }}
 className={`py-1 px-1.5 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
 item.status === st.key
 ? 'bg-indigo-600 text-white shadow-xs'
 : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
 }`}
 >
 {st.label}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Observation Note */}
 <div>
 <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
 Nota de Observación de Aula:
 </label>
 <textarea
 rows={3}
 value={item.notes}
 onChange={e => {
 const val = e.target.value;
 setLessonRecords(prev =>
 prev.map((it, i) => (i === reviewIndex ? { ...it, notes: val } : it))
 );
 }}
 className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:ring-1 focus:ring-indigo-500"
 />
 </div>

 {/* OPTIONAL PHOTO ATTACHMENT SECTION */}
 <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-200 dark:border-gray-700 space-y-2">
 <input
 ref={photoInputRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={e => {
 if (e.target.files?.[0]) {
 handlePhotoSelected(e.target.files[0]);
 }
 }}
 />

 <div className="flex items-center justify-between">
 <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
 <Camera className="w-3.5 h-3.5 text-indigo-600" />
 <span>Fotografía de Evidencia (Opcional):</span>
 </span>

 {item.photoUrl ? (
 <button
 type="button"
 onClick={handleRemovePhoto}
 className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
 >
 <Trash2 className="w-3 h-3" />
 Quitar foto
 </button>
 ) : null}
 </div>

 {item.photoUrl ? (
 <div className="relative rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-800 max-w-xs group">
 <img
 src={item.photoUrl}
 alt="Evidencia"
 className="w-full h-28 object-cover rounded-xl"
 />
 </div>
 ) : (
 <button
 type="button"
 disabled={isUploadingPhoto}
 onClick={() => photoInputRef.current?.click()}
 className="w-full py-2 px-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
 >
 {isUploadingPhoto ? (
 <>
 <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
 <span>Subiendo fotografía...</span>
 </>
 ) : (
 <>
 <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
 <span>Tomar o subir foto de esta lección</span>
 </>
 )}
 </button>
 )}
 </div>

 <div className="flex items-center justify-end">
 <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-400">
 <input
 type="checkbox"
 checked={item.isPublic}
 onChange={e => {
 const val = e.target.checked;
 setLessonRecords(prev =>
 prev.map((it, i) => (i === reviewIndex ? { ...it, isPublic: val } : it))
 );
 }}
 className="w-3.5 h-3.5 rounded text-indigo-600"
 />
 <span>Visible para familias en el portal</span>
 </label>
 </div>
 </div>
 );
 })()
 )}

 {/* --- CASE B: TRACKER WIZARD CARD --- */}
 {targetType === 'tracker' && trackerRecords.length > 0 && (
 (() => {
 const item = trackerRecords[reviewIndex] || trackerRecords[0];
 const detectedStudent = students.find(s => s.id === item.studentId) || confirmedStudent;
 const studentName = detectedStudent ? (detectedStudent.full_name || (detectedStudent as any).fullName) : item.studentName;

 return (
 <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-900 shadow-sm space-y-4">
 {/* DETECTED STUDENT HERO BANNER WITH PHOTO */}
 <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/80 via-pink-50/40 to-transparent dark:from-purple-950/40 dark:via-pink-950/20 border border-purple-100 dark:border-purple-900/60 flex items-center justify-between gap-3">
 <div className="flex items-center gap-3 min-w-0">
 <StudentAvatar
 fullName={studentName || 'Alumno'}
 avatarUrl={detectedStudent?.avatar_url || (detectedStudent as any)?.avatarUrl}
 sizeClass="w-12 h-12"
 textSizeClass="text-sm"
 />
 <div className="truncate">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
 {studentName || 'Alumno no asignado'}
 </span>
 {item.saved && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
 <CheckCheck className="w-3 h-3" />
 Guardado
 </span>
 )}
 </div>
 <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
 {detectedStudent?.grade || detectedStudent?.environment_name || 'Salón de Clases'}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-1">
 <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-lg">
 #{reviewIndex + 1}
 </span>
 </div>
 </div>

 {/* Custom Tracker Selector & Status */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
 <div>
 <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
 Rutina / Hábito Diario:
 </label>
 <CustomTrackerDropdown
 trackerItems={allTrackerItems}
 selectedTrackerId={item.trackerItemId}
 detectedName={item.trackerItemName}
 onSelect={tr => {
 setTrackerRecords(prev =>
 prev.map((it, i) =>
 i === reviewIndex
 ? {
 ...it,
 trackerItemId: tr.id,
 trackerItemName: tr.name,
 trackerCategoryName: tr.categoryName,
 trackerCategoryId: tr.categoryId
 }
 : it
 )
 );
 }}
 />
 </div>

 <div>
 <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
 Estado de Realización:
 </label>
 <div className="grid grid-cols-3 gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
 {[
 { key: 'YES', label: ' Realizado', activeBg: 'bg-emerald-600' },
 { key: 'PARTIAL', label: '~ En Proceso', activeBg: 'bg-amber-600' },
 { key: 'NO', label: ' No Realizado', activeBg: 'bg-rose-600' }
 ].map(st => (
 <button
 key={st.key}
 type="button"
 onClick={() => {
 setTrackerRecords(prev =>
 prev.map((it, i) => (i === reviewIndex ? { ...it, status: st.key as any } : it))
 );
 }}
 className={`py-1 px-1 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
 item.status === st.key
 ? `${st.activeBg} text-white shadow-xs`
 : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
 }`}
 >
 {st.label}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Public Note */}
 <div className="space-y-1">
 <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
 <Globe className="w-3 h-3" />
 <span>Nota Pública (Visible para Familias / Padres)</span>
 </div>
 <textarea
 rows={2}
 value={item.publicNote}
 onChange={e => {
 const val = e.target.value;
 setTrackerRecords(prev =>
 prev.map((it, i) => (i === reviewIndex ? { ...it, publicNote: val } : it))
 );
 }}
 placeholder="Nota clara y constructiva..."
 className="w-full text-xs p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-gray-900 dark:text-gray-100 resize-none focus:ring-1 focus:ring-emerald-500"
 />
 </div>

 {/* Internal Note */}
 <div className="space-y-1">
 <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">
 <Lock className="w-3 h-3" />
 <span>Nota Interna (Exclusiva para el Equipo de Guías)</span>
 </div>
 <textarea
 rows={2}
 value={item.internalNote}
 onChange={e => {
 const val = e.target.value;
 setTrackerRecords(prev =>
 prev.map((it, i) => (i === reviewIndex ? { ...it, internalNote: val } : it))
 );
 }}
 placeholder="Detalles técnicos y juicio del guía..."
 className="w-full text-xs p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20 text-gray-900 dark:text-gray-100 resize-none focus:ring-1 focus:ring-indigo-500"
 />
 </div>

 {/* OPTIONAL PHOTO ATTACHMENT SECTION */}
 <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-200 dark:border-gray-700 space-y-2">
 <input
 ref={photoInputRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={e => {
 if (e.target.files?.[0]) {
 handlePhotoSelected(e.target.files[0]);
 }
 }}
 />

 <div className="flex items-center justify-between">
 <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
 <Camera className="w-3.5 h-3.5 text-purple-600" />
 <span>Fotografía de Evidencia (Opcional):</span>
 </span>

 {item.photoUrl ? (
 <button
 type="button"
 onClick={handleRemovePhoto}
 className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
 >
 <Trash2 className="w-3 h-3" />
 Quitar foto
 </button>
 ) : null}
 </div>

 {item.photoUrl ? (
 <div className="relative rounded-xl overflow-hidden border border-purple-200 dark:border-purple-800 max-w-xs group">
 <img
 src={item.photoUrl}
 alt="Evidencia"
 className="w-full h-28 object-cover rounded-xl"
 />
 </div>
 ) : (
 <button
 type="button"
 disabled={isUploadingPhoto}
 onClick={() => photoInputRef.current?.click()}
 className="w-full py-2 px-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
 >
 {isUploadingPhoto ? (
 <>
 <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
 <span>Subiendo fotografía...</span>
 </>
 ) : (
 <>
 <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
 <span>Tomar o subir foto de este hábito</span>
 </>
 )}
 </button>
 )}
 </div>
 </div>
 );
 })()
 )}

 {/* Add another note button */}
 <div className="flex items-center justify-between pt-1">
 <button
 type="button"
 onClick={() => {
 if (targetType === 'lesson') {
 const newId = `lesson_${Date.now()}`;
 setLessonRecords(prev => [
 ...prev,
 {
 id: newId,
 studentId: confirmedStudent?.id || preselectedStudentId || null,
 lessonId: null,
 status: 'PRACTICING',
 notes: '',
 isPublic: false
 }
 ]);
 setReviewIndex(lessonRecords.length);
 } else {
 const newId = `tracker_${Date.now()}`;
 setTrackerRecords(prev => [
 ...prev,
 {
 id: newId,
 studentId: confirmedStudent?.id || preselectedStudentId || null,
 trackerCategoryId: null,
 trackerItemId: null,
 status: 'YES',
 publicNote: '',
 internalNote: ''
 }
 ]);
 setReviewIndex(trackerRecords.length);
 }
 }}
 className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>{targetType === 'lesson' ? 'Agregar otra lección' : 'Agregar otro hábito'}</span>
 </button>
 </div>

 {/* --- WIZARD ACTIONS FOOTER (STEP BY STEP SAVE & ADVANCE) --- */}
 {(() => {
 const totalCount = targetType === 'lesson' ? lessonRecords.length : trackerRecords.length;
 const isLast = reviewIndex >= totalCount - 1;

 return (
 <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
 <div className="flex items-center justify-between gap-2 flex-wrap">
 {/* Left: Previous and Discard */}
 <div className="flex items-center gap-1.5">
 {reviewIndex > 0 && (
 <button
 type="button"
 onClick={() => setReviewIndex(prev => Math.max(0, prev - 1))}
 className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center gap-1 cursor-pointer transition-all"
 >
 <ChevronLeft className="w-3.5 h-3.5" />
 <span>Anterior</span>
 </button>
 )}

 <button
 type="button"
 onClick={handleDeleteCurrentNote}
 className="px-2.5 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex items-center gap-1 cursor-pointer"
 title="Descartar esta nota"
 >
 <Trash2 className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Descartar</span>
 </button>
 </div>

 {/* Right: Step-by-step Advance & Save */}
 <div className="flex items-center gap-2">
 {!isLast && (
 <button
 type="button"
 onClick={() => setReviewIndex(prev => prev + 1)}
 className="px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
 >
 Omitir →
 </button>
 )}

 <button
 type="button"
 disabled={isSaving}
 onClick={() => handleSaveCurrentNote(true)}
 className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-95"
 >
 {isSaving ? (
 <>
 <RefreshCw className="w-3.5 h-3.5 animate-spin" />
 Guardando...
 </>
 ) : isLast ? (
 <>
 <Check className="w-4 h-4 stroke-[3]" />
 Guardar y Finalizar
 </>
 ) : (
 <>
 <span>Guardar y Siguiente ({reviewIndex + 1}/{totalCount})</span>
 <ChevronRight className="w-4 h-4" />
 </>
 )}
 </button>
 </div>
 </div>

 {/* Optional Batch Save All */}
 {totalCount > 1 && (
 <div className="flex justify-end pt-1">
 <button
 type="button"
 disabled={isSaving}
 onClick={handleSaveAll}
 className="text-[11px] font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
 >
 <span> Guardar todas las notas pendientes a la vez</span>
 </button>
 </div>
 )}
 </div>
 );
 })()}
 </div>
 )}
 </div>
 </SlideOverDrawer>
 )}
 </>
 );
};
