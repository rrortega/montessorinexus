import React, { useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
  showCloseButton?: boolean;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  roundedClass?: string;
  disableDrag?: boolean;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidthClass = 'max-w-lg',
  showCloseButton = true,
  borderRadius,
  roundedClass,
  disableDrag = false
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    // If pulled down more than 75px or flicked down with velocity
    if (info.offset.y > 75 || info.velocity.y > 250) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-body">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Modal / Mobile Drawer Container */}
          <motion.div
            drag={disableDrag ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={disableDrag ? false : { top: 0, bottom: 0.6 }}
            dragSnapToOrigin={!disableDrag}
            onDragEnd={disableDrag ? undefined : handleDragEnd}
            initial={{ y: '100%', opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`relative z-10 w-full ${maxWidthClass} bg-white ${
              roundedClass || (borderRadius === 'none' ? 'rounded-none' : borderRadius === 'sm' ? 'rounded-t-xl sm:rounded-lg' : borderRadius === 'md' ? 'rounded-t-2xl sm:rounded-xl' : borderRadius === 'full' ? 'rounded-t-[2.5rem] sm:rounded-3xl' : 'rounded-t-[2.25rem] sm:rounded-3xl')
            } shadow-2xl border border-forest/10 max-h-[92vh] flex flex-col overflow-hidden shrink-0`}
          >
            {/* Pull-down handle bar on mobile (touchable & draggable) */}
            <div 
              onClick={onClose}
              className="sm:hidden w-full py-3 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none shrink-0"
              title="Toca o desliza hacia abajo para cerrar"
            >
              <div className="w-16 h-1.5 bg-forest/25 hover:bg-forest/40 rounded-full transition-colors" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between px-6 pt-2 sm:pt-6 pb-3 border-b border-forest/10 shrink-0">
                <div>
                  {title && (
                    <h3 className="font-display font-bold text-forest text-lg sm:text-xl leading-tight">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {description}
                    </p>
                  )}
                </div>

                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={`p-1.5 text-muted-foreground hover:text-forest hover:bg-forest/10 ${borderRadius === 'none' ? 'rounded-none' : 'rounded-xl'} transition-colors shrink-0 -mr-2 -mt-1 cursor-pointer`}
                    title="Cerrar (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {children}
            </div>

          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
};

export default ResponsiveModal;
