import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Film,
  Images,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export interface FeedGalleryImageItem {
  id?: string;
  src: string;
  title?: string;
  description?: string;
  blurredSrc?: string | null;
}

export interface FeedGalleryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryTitle: string;
  images: FeedGalleryImageItem[];
  initialIndex?: number;
  autoPlayOnOpen?: boolean;
}

function isVideoFile(url: string = ''): boolean {
  return /\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(url);
}

export const FeedGalleryViewerModal: React.FC<FeedGalleryViewerModalProps> = ({
  isOpen,
  onClose,
  galleryTitle,
  images = [],
  initialIndex = 0,
  autoPlayOnOpen = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isSlideshowActive, setIsSlideshowActive] = useState(autoPlayOnOpen);
  const [slideshowPaused, setSlideshowPaused] = useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = useState<number>(3); // 3 seconds per photo
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const thumbnailRowRef = useRef<HTMLDivElement | null>(null);

  // Sync initialIndex
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setIsSlideshowActive(autoPlayOnOpen);
      setSlideshowPaused(false);
    }
  }, [isOpen, initialIndex, autoPlayOnOpen, images.length]);

  const currentItem = images[currentIndex] || null;
  const isCurrentVideo = currentItem ? isVideoFile(currentItem.src) : false;

  const handleNext = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Slideshow auto-advance loop
  useEffect(() => {
    if (!isOpen || !isSlideshowActive || slideshowPaused || images.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // If current item is video, wait for video to end rather than duration timer
    if (isCurrentVideo) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, slideshowSpeed * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isSlideshowActive, slideshowPaused, slideshowSpeed, currentIndex, isCurrentVideo, handleNext, images.length]);

  // Video auto-advance when ended
  const handleVideoEnded = () => {
    if (isSlideshowActive && !slideshowPaused) {
      handleNext();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setSlideshowPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailRowRef.current) {
      const activeThumb = thumbnailRowRef.current.children[currentIndex] as HTMLElement | undefined;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentIndex]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (!isOpen || images.length === 0 || !currentItem) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Bar Controls */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Left: Gallery Title & Counter */}
        <div className="flex items-center gap-3 text-white min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/15 shadow-xs">
            <Images className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold font-display truncate leading-snug">
              {galleryTitle || 'Galería Escolar'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-white/60 font-mono">
              <span className="font-bold text-amber-400">{currentIndex + 1}</span>
              <span>/</span>
              <span>{images.length}</span>
              {currentItem.title && (
                <>
                  <span>•</span>
                  <span className="truncate text-white/80 font-sans">{currentItem.title}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Slideshow Indicator & Speed Pill (When Active) */}
        {isSlideshowActive && (
          <div className="hidden md:flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-amber-400/40 shadow-2xl">
            <button
              type="button"
              onClick={() => setSlideshowPaused(!slideshowPaused)}
              className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center hover:bg-amber-300 transition-colors cursor-pointer"
              title={slideshowPaused ? 'Reanudar auto-reproducción' : 'Pausar auto-reproducción'}
            >
              {slideshowPaused ? (
                <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
              ) : (
                <Pause className="w-3.5 h-3.5 fill-current" />
              )}
            </button>

            {!isCurrentVideo && (
              <div className="flex items-center gap-1 border-l border-white/20 pl-2 ml-1 text-xs text-white/80">
                <span className="text-[10px] text-white/50 uppercase font-bold mr-1">Velocidad:</span>
                {[2, 3, 5].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setSlideshowSpeed(spd)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      slideshowSpeed === spd
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {spd}s
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right Actions: Auto-Playback Toggle, Fullscreen, Close */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle Auto-Playback */}
          <button
            type="button"
            onClick={() => {
              if (isSlideshowActive) {
                setIsSlideshowActive(false);
              } else {
                setIsSlideshowActive(true);
                setSlideshowPaused(false);
              }
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg border ${
              isSlideshowActive
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-amber-400/20'
                : 'bg-white/10 text-white/90 hover:bg-white/20 hover:text-white border-white/20'
            }`}
            title="Auto-reproducción de diapositivas"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Reproducción:</span>
            <span>{isSlideshowActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Presentation Stage */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 min-h-0 overflow-hidden">
        {/* Navigation Arrow Left */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-2xl"
            title="Anterior (Flecha izquierda)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Current Media Render */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          {isCurrentVideo ? (
            <div className="relative rounded-2xl overflow-hidden shadow-2xl max-h-[72vh] max-w-[92vw] bg-black">
              <video
                ref={videoRef}
                key={currentItem.src}
                src={currentItem.src}
                controls
                autoPlay
                playsInline
                muted={isMuted}
                onEnded={handleVideoEnded}
                className="max-h-[72vh] max-w-[92vw] object-contain"
              />
            </div>
          ) : (
            <div className="relative group max-h-[72vh] max-w-[92vw] flex items-center justify-center">
              <img
                key={currentItem.src}
                src={currentItem.blurredSrc || currentItem.src}
                alt={currentItem.title || galleryTitle}
                className="max-h-[72vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl transition-opacity duration-300 animate-in fade-in zoom-in-95"
              />
            </div>
          )}
        </div>

        {/* Navigation Arrow Right */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-6 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-2xl"
            title="Siguiente (Flecha derecha)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip & Description */}
      <div className="relative z-20 px-4 py-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent space-y-2">
        {/* Caption / Description if present */}
        {currentItem.description && (
          <p className="text-center text-xs text-white/80 max-w-2xl mx-auto line-clamp-2 px-4 leading-relaxed font-body">
            {currentItem.description}
          </p>
        )}

        {/* Thumbnails Row */}
        {images.length > 1 && (
          <div
            ref={thumbnailRowRef}
            className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-4xl mx-auto no-scrollbar"
          >
            {images.map((item, idx) => {
              const isSelected = idx === currentIndex;
              const isVid = isVideoFile(item.src);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    if (isSlideshowActive) setSlideshowPaused(false);
                  }}
                  className={`relative shrink-0 w-12 sm:w-16 h-10 sm:h-12 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer border-2 ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105 opacity-100 shadow-lg'
                      : 'border-white/20 opacity-50 hover:opacity-90 hover:border-white/50'
                  }`}
                >
                  <img
                    src={item.blurredSrc || item.src}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isVid && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                      <Film className="w-3.5 h-3.5 fill-current" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
