import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  Volume2,
  X,
  Check,
  RefreshCw,
  Loader2,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { improveTextWithAi } from '@/lib/sqlite';
import { useSiteSettings } from '@/context/SettingsContext';

export interface VoiceNoteTextareaProps {
  value: string;
  onChange: (value: string) => void;
  label?: string | React.ReactNode;
  badge?: React.ReactNode;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  textareaClassName?: string;
  helperText?: string;
  showAiImprove?: boolean;
  showVoiceDictation?: boolean;
  context?: 'general' | 'event' | 'appointment' | 'newsletter';
  tone?: 'professional' | 'warm';
}

export const VoiceNoteTextarea: React.FC<VoiceNoteTextareaProps> = ({
  value,
  onChange,
  label,
  badge,
  placeholder = 'Escribe o dicta una observación cualitativa...',
  rows = 3,
  disabled = false,
  className = '',
  textareaClassName = '',
  helperText,
  showAiImprove = true,
  showVoiceDictation = true,
  context = 'general',
  tone = 'professional'
}) => {
  const { settings } = useSiteSettings();
  const isWritingAssistantEnabled = settings?.ai_writing_assistant_enabled === 'true' || settings?.ai_writing_assistant_enabled === undefined;

  const [isRecording, setIsRecording] = useState(false);
  const [isImprovingWithAi, setIsImprovingWithAi] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const handleImproveText = async () => {
    if (!value || !value.trim()) {
      toast.info('Escribe o dicta algún texto primero para mejorarlo con IA.');
      return;
    }
    try {
      setIsImprovingWithAi(true);
      const res = await improveTextWithAi({
        text: value,
        context,
        tone
      });
      if (res.improvedText) {
        onChange(res.improvedText);
        toast.success('Texto mejorado con IA exitosamente');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al mejorar el texto con IA');
    } finally {
      setIsImprovingWithAi(false);
    }
  };

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);

  const isSpeechSupported = typeof window !== 'undefined' && Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  // Timer counter
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startAudioVisualizerWithStream = (stream: MediaStream) => {
    try {
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      renderWaveform();
    } catch (e) {
      console.warn('Audio visualizer fallback:', e);
    }
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
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

  const startRecording = async () => {
    if (!isSpeechSupported) {
      toast.error('Tu navegador no soporta reconocimiento de voz directo.');
      return;
    }

    setPermissionError(null);

    // 1. Explicitly request microphone stream from browser
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.warn('[MIC_PERMISSION_DENIED]', err);
      cancelRecording();
      const msg = 'No tienes permisos para usar el micrófono en este navegador. Habilita el acceso para poder dictar.';
      setPermissionError(msg);
      toast.error(msg);
      return;
    }

    setTranscript('');
    setInterimTranscript('');
    setIsRecording(true);

    startAudioVisualizerWithStream(stream);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

        if (finalChunk.trim()) {
          setTranscript((prev) => (prev ? prev + ' ' + finalChunk.trim() : finalChunk.trim()));
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('[VOICE_NOTE_DICTATION_ERROR]', event.error);
        if (event.error === 'not-allowed') {
          const msg = 'No tienes permisos para usar el micrófono en este navegador.';
          setPermissionError(msg);
          toast.error(msg);
          cancelRecording();
        } else if (event.error !== 'no-speech') {
          toast.error(`Error en dictado por voz: ${event.error}`);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      cancelRecording();
      const msg = 'No tienes permisos para usar el micrófono en este navegador.';
      setPermissionError(msg);
      toast.error(msg);
    }
  };

  const cancelRecording = () => {
    stopAudioVisualizer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setTranscript('');
    setInterimTranscript('');
  };

  const finishRecording = () => {
    const finalCapturedText = (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim();

    stopAudioVisualizer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (finalCapturedText) {
      const newMergedValue = value ? `${value.trim()} ${finalCapturedText}` : finalCapturedText;
      onChange(newMergedValue);
      toast.success('Dictado añadido a la observación');
    }

    setIsRecording(false);
    setTranscript('');
    setInterimTranscript('');
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

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* ========================================================================= */}
      {/* FULLSCREEN BLOCKING LIVE RECORDING VIEW (IDENTICAL RECORDER EFFECT)      */}
      {/* ========================================================================= */}
      {isRecording && (
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
              <span>{typeof label === 'string' ? label : 'Dictado por Voz'}</span>
            </div>
          </div>

          {/* Center: Glowing Microphone, Waveform & Real-Time Transcript */}
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center space-y-6 text-center">
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
                Habla con naturalidad frente al micrófono. La transcripción se genera en tiempo real.
              </p>
            </div>

            {/* Audio Waveform Canvas */}
            <div className="w-full bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-md shadow-2xl">
              <canvas ref={canvasRef} width={600} height={100} className="w-full h-24 sm:h-28" />
            </div>

            {/* Live Transcription Box */}
            <div className="w-full min-h-[5rem] max-h-36 overflow-y-auto p-4 rounded-2xl bg-black/60 border border-white/10 text-left">
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
          </div>

          {/* Bottom Action Controls: Equal Sized Buttons */}
          <div className="w-full max-w-2xl mx-auto flex items-center justify-center gap-8 sm:gap-14 pb-4">
            <button
              type="button"
              onClick={cancelRecording}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300 group-hover:text-white flex items-center justify-center transition-all transform active:scale-95 shadow-lg">
                <X className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-200">Cancelar</span>
            </button>

            <button
              type="button"
              onClick={finishRecording}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/40 ring-4 ring-white/30">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                Finalizar
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Header with Label, Badge, and Dictation Button */}
      {(label || badge || isSpeechSupported) && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {typeof label === 'string' ? (
              <label className="block text-xs font-bold text-forest uppercase tracking-wider">
                {label}
              </label>
            ) : (
              label
            )}
            {badge}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* AI Writing Assistant / Polish Button */}
            {isWritingAssistantEnabled && showAiImprove && (
              <button
                type="button"
                disabled={disabled || isImprovingWithAi || !value?.trim()}
                onClick={handleImproveText}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                title="Mejorar ortografía, estilo y redacción con IA"
              >
                {isImprovingWithAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    <span>Mejorando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Mejorar con IA</span>
                  </>
                )}
              </button>
            )}

            {/* Voice Dictation Button */}
            {isWritingAssistantEnabled && showVoiceDictation && isSpeechSupported && (
              <button
                type="button"
                disabled={disabled}
                onClick={startRecording}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                  permissionError
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-forest/5 hover:bg-forest/15 text-forest border border-forest/20'
                }`}
                title="Dictar nota por voz"
              >
                {permissionError ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-rose-600 animate-spin" style={{ animationIterationCount: 1 }} />
                    <span>Permitir Micrófono</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-forest" />
                    <span>Dictar Nota</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Permission Denied Alert Banner */}
      {permissionError && (
        <div className="p-3 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <MicOff className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="leading-snug">{permissionError}</span>
          </div>
          <button
            type="button"
            onClick={startRecording}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Solicitar Permiso</span>
          </button>
        </div>
      )}

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full p-3 rounded-2xl border border-forest/15 text-xs focus:ring-1 focus:ring-forest bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 leading-relaxed focus:outline-none shadow-2xs resize-none ${textareaClassName}`}
        />
      </div>

      {helperText && (
        <p className="text-[11px] text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

export default VoiceNoteTextarea;
