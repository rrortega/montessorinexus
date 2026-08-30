import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';

export interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  footerClassName?: string;
  maxWidthClass?: string;
  backdropClassName?: string;
  hideBackdrop?: boolean;
}

export const SlideOverDrawer: React.FC<SlideOverDrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  headerActions,
  children,
  footer,
  footerClassName,
  maxWidthClass = 'max-w-xl lg:max-w-2xl',
  backdropClassName,
  hideBackdrop = false,
}) => {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Handle open / close animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ESC key and Browser Back (popstate) handlers
  useEffect(() => {
    if (!isOpen) return;

    // Handle ESC key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Push history state to intercept browser Back button (Android/iOS/Browser back)
    const stateId = `drawer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    window.history.pushState({ drawerStateId: stateId }, '');
    isPushedRef.current = true;

    const handlePopState = () => {
      if ((window as any).__ignoringDrawerPopstate) return;
      isPushedRef.current = false;
      onCloseRef.current?.();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      if (isPushedRef.current) {
        isPushedRef.current = false;
        if (window.history.state?.drawerStateId === stateId) {
          (window as any).__ignoringDrawerPopstate = true;
          window.history.back();
          setTimeout(() => {
            (window as any).__ignoringDrawerPopstate = false;
          }, 200);
        }
      }
    };
  }, [isOpen]);

  // Lock body, html, and main layout scroll containers
  useEffect(() => {
    if (!isOpen || hideBackdrop) return;

    if (typeof window !== 'undefined') {
      const activeCount = ((window as any).__activeDrawerCount || 0) + 1;
      (window as any).__activeDrawerCount = activeCount;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const scrollContainers = document.querySelectorAll<HTMLElement>('main, #admin-main-container, [data-scroll-container]');
      scrollContainers.forEach(el => {
        if (!el.dataset.prevOverflow) {
          el.dataset.prevOverflow = el.style.overflow || '';
        }
        el.style.overflow = 'hidden';
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        const activeCount = Math.max(0, ((window as any).__activeDrawerCount || 1) - 1);
        (window as any).__activeDrawerCount = activeCount;

        if (activeCount === 0) {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';

          const scrollContainers = document.querySelectorAll<HTMLElement>('main, #admin-main-container, [data-scroll-container]');
          scrollContainers.forEach(el => {
            el.style.overflow = el.dataset.prevOverflow || '';
            delete el.dataset.prevOverflow;
          });
        }
      }
    };
  }, [isOpen]);

  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const currentDragY = useRef(0);
  const isPullingDown = useRef(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  // Reset drag state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDragY(0);
      currentDragY.current = 0;
      setIsDragging(false);
      isPullingDown.current = false;
    }
  }, [isOpen]);

  // Touch Pull-Down Gesture Handlers (Mobile Header)
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isPullingDown.current = true;
    setIsDragging(true);
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (!isPullingDown.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      // Direct 1:1 responsive drag feedback
      setDragY(diff);
      currentDragY.current = diff;
    } else {
      setDragY(0);
      currentDragY.current = 0;
    }
  };

  const handleHeaderTouchEnd = () => {
    if (!isPullingDown.current) return;
    isPullingDown.current = false;
    setIsDragging(false);

    const totalDrag = currentDragY.current;
    const elapsed = Date.now() - touchStartTime.current;
    const velocity = elapsed > 0 ? totalDrag / elapsed : 0;

    if (totalDrag > 50 || (totalDrag > 20 && velocity > 0.3)) {
      onClose();
    }
    setDragY(0);
    currentDragY.current = 0;
  };

  // Touch Pull-Down Gesture Handlers (Mobile Body when at scrollTop <= 0)
  const handleBodyTouchStart = (e: React.TouchEvent) => {
    const scrollTop = bodyRef.current?.scrollTop ?? 0;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    if (scrollTop <= 0) {
      isPullingDown.current = true;
    }
  };

  const handleBodyTouchMove = (e: React.TouchEvent) => {
    const scrollTop = bodyRef.current?.scrollTop ?? 0;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    if (isPullingDown.current && scrollTop <= 0 && diff > 0) {
      setIsDragging(true);
      setDragY(diff);
      currentDragY.current = diff;
    }
  };

  const handleBodyTouchEnd = () => {
    if (isPullingDown.current && currentDragY.current > 0) {
      const totalDrag = currentDragY.current;
      const elapsed = Date.now() - touchStartTime.current;
      const velocity = elapsed > 0 ? totalDrag / elapsed : 0;

      if (totalDrag > 50 || (totalDrag > 20 && velocity > 0.3)) {
        onClose();
      }
      setDragY(0);
      currentDragY.current = 0;
      setIsDragging(false);
    }
    isPullingDown.current = false;
  };

  if (!isMounted) return null;

  return (
    <div
      className={`!mt-0 fixed inset-0 top-0 left-0 right-0 bottom-0 h-screen h-[100dvh] max-h-[100dvh] z-[5000] flex items-end sm:justify-end overflow-hidden transition-opacity duration-300 ease-out ${
        hideBackdrop
          ? 'pointer-events-none bg-transparent'
          : `${backdropClassName !== undefined ? backdropClassName : 'bg-black/40 backdrop-blur-xs'} ${
              isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`
      }`}
      onClick={hideBackdrop ? undefined : onClose}
    >
      <div
        className={`pointer-events-auto w-full max-h-[92vh] sm:max-h-[100dvh] h-auto sm:h-full ${
          maxWidthClass
            .split(' ')
            .map((cls) => (cls.includes(':') ? cls : `sm:${cls}`))
            .join(' ')
        } bg-white rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col border-t sm:border-t-0 sm:border-l border-forest/10 transition-transform duration-300 ease-out ${
          isVisible 
            ? 'translate-y-0 sm:translate-x-0 sm:translate-y-0' 
            : 'translate-y-full sm:translate-x-full sm:translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: isVisible 
            ? (dragY > 0 ? `translate3d(0, ${dragY}px, 0)` : undefined)
            : undefined,
          transition: isDragging ? 'none' : 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header (With Pull-Down Touch Gesture Area) */}
        <div
          className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-forest/10 shrink-0 bg-white select-none rounded-t-3xl sm:rounded-none touch-none"
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
          onTouchCancel={handleHeaderTouchEnd}
        >
          {/* Mobile Pull-Down Handle Bar */}
          <div className="sm:hidden w-12 h-1.5 bg-forest/30 active:bg-forest/50 rounded-full mx-auto mb-3 cursor-grab active:cursor-grabbing shrink-0 transition-colors" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden pr-2">
              {icon && (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-forest/5 border border-forest/15 text-forest flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                  {icon}
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="font-bold font-display text-forest text-base sm:text-lg leading-tight truncate">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              <button
                onClick={onClose}
                className="hidden sm:flex p-2 rounded-full text-muted-foreground hover:text-forest hover:bg-forest/5 transition-colors shrink-0 cursor-pointer"
                aria-label="Cerrar panel lateral"
                title="Cerrar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Body (Scrollable with top pull-down support) */}
        <div
          ref={bodyRef}
          onTouchStart={handleBodyTouchStart}
          onTouchMove={handleBodyTouchMove}
          onTouchEnd={handleBodyTouchEnd}
          onTouchCancel={handleBodyTouchEnd}
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 overscroll-contain custom-scrollbar"
        >
          {children}
        </div>

        {/* Drawer Footer (Sticky) */}
        {footer && (
          <div className={`p-3.5 sm:p-4 px-4 sm:px-6 border-t border-forest/10 bg-white flex items-center justify-between shrink-0 ${footerClassName || ''}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideOverDrawer;
