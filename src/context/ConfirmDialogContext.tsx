import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AlertTriangle, Trash2, HelpCircle, Info, X } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  description?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'forest';
  icon?: 'trash' | 'warning' | 'info' | 'help';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

type ConfirmContextType = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: '' });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const isPushedRef = useRef(false);

  // Mobile pull-down drag gesture state
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const sheetTouchStartY = useRef(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

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

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setSheetDragY(0);
    setIsSheetDragging(false);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    setSheetDragY(0);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setSheetDragY(0);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  // Touch handlers for mobile pull-down dismissal
  const handleTouchStart = (e: React.TouchEvent) => {
    sheetTouchStartY.current = e.touches[0].clientY;
    setIsSheetDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - sheetTouchStartY.current;
    if (diff > 0) {
      setSheetDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsSheetDragging(false);
    if (sheetDragY > 50) {
      handleCancel();
    }
    setSheetDragY(0);
  };

  // Keyboard Escape and Browser Back (popstate) support
  useEffect(() => {
    if (!isOpen) return;

    // Handle ESC with capture to stop propagation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);

    // Push history state to intercept browser Back button
    const stateId = `confirm_${Date.now()}`;
    window.history.pushState({ confirmStateId: stateId }, '');
    isPushedRef.current = true;

    const handlePopState = () => {
      isPushedRef.current = false;
      handleCancel();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('popstate', handlePopState);
      if (isPushedRef.current && window.history.state?.confirmStateId === stateId) {
        (window as any).__ignoringDrawerPopstate = true;
        window.history.back();
        isPushedRef.current = false;
        setTimeout(() => {
          (window as any).__ignoringDrawerPopstate = false;
        }, 200);
      }
    };
  }, [isOpen, handleCancel]);

  const variant = options.variant || 'danger';
  const iconType = options.icon || (variant === 'danger' ? 'trash' : variant === 'warning' ? 'warning' : 'info');

  // Dynamic borderRadius tokens
  const isNone = options.borderRadius === 'none';
  const cardRadius = isNone ? 'rounded-none' : 'rounded-t-3xl sm:rounded-2xl';
  const badgeRadius = isNone ? 'rounded-none' : 'rounded-2xl';
  const buttonRadius = isNone ? 'rounded-none' : 'rounded-xl';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {isMounted && (
        <div 
          className={`fixed inset-0 bg-black/70 backdrop-blur-xs z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={handleCancel}
        >
          <div 
            className={`bg-white ${cardRadius} p-6 sm:p-7 max-w-md w-full shadow-2xl border border-forest/10 space-y-5 flex flex-col transition-all duration-300 ease-out transform ${
              isVisible 
                ? 'translate-y-0 opacity-100 sm:scale-100' 
                : 'translate-y-full sm:translate-y-0 opacity-0 sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: sheetDragY > 0 ? `translateY(${sheetDragY}px)` : undefined,
              transition: isSheetDragging ? 'none' : undefined
            }}
            role="dialog"
            aria-modal="true"
          >
            {/* Mobile Pull-down Handle Bar */}
            <div 
              className="sm:hidden w-full -mt-2 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
              onClick={handleCancel}
            >
              <div className="w-12 h-1.5 bg-forest/20 hover:bg-forest/40 rounded-full transition-colors" />
            </div>

            {/* Header Icon & Title */}
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${badgeRadius} flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-red-50 text-red-600 border border-red-200 shadow-2xs'
                  : variant === 'warning'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs'
                    : 'bg-forest/10 text-forest border border-forest/20 shadow-2xs'
              }`}>
                {iconType === 'trash' ? (
                  <Trash2 className="w-6 h-6" />
                ) : iconType === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1 pt-0.5 flex-1">
                <h3 className="font-bold text-forest text-base font-display leading-snug">
                  {options.title}
                </h3>
                {options.description && (
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {options.description}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-forest/10">
              <button
                type="button"
                onClick={handleCancel}
                className={`px-4 py-2.5 ${buttonRadius} border border-forest/20 text-xs font-bold text-forest hover:bg-forest/5 transition-all active:scale-95 cursor-pointer`}
                autoFocus
              >
                {options.cancelText || 'Cancelar'}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2.5 ${buttonRadius} text-xs font-bold shadow-xs transition-all active:scale-95 text-white cursor-pointer ${
                  variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                    : variant === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : 'bg-forest hover:bg-forest/90 shadow-forest/20'
                }`}
              >
                {options.confirmText || (variant === 'danger' ? 'Sí, eliminar' : 'Confirmar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context;
};
