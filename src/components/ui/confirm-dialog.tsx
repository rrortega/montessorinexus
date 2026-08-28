import React from 'react';
import { ResponsiveModal } from './responsive-modal';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-6 h-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-6 h-6" />
          </div>
        );
    }
  };

  const getConfirmBtnStyle = () => {
    switch (variant) {
      case 'danger':
        return 'bg-destructive hover:bg-destructive/90 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      default:
        return 'bg-forest hover:bg-forest/90 text-white';
    }
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-md" showCloseButton={false}>
      <div className="text-center space-y-4 pt-1 font-body w-full">
        {getIcon()}
        
        <div>
          <h3 className="font-display font-bold text-forest text-lg sm:text-xl">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed px-2">
            {message}
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-forest/10 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 text-xs font-semibold text-muted-foreground hover:text-forest border border-forest/10 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${getConfirmBtnStyle()}`}
          >
            {loading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default ConfirmDialog;
