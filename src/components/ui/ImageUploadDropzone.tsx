import React, { useState, useRef, useCallback } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  Eye, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import { uploadFile, deleteUploadedFile } from '@/lib/sqlite';
import { toast } from 'sonner';

interface ImageUploadDropzoneProps {
  value?: string;
  onChange?: (url: string) => void;
  currentImageUrl?: string;
  onImageUploaded?: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  helperText?: string;
  aspectRatio?: 'landscape' | 'square' | 'portrait' | 'auto';
  className?: string;
  folder?: string;
  maxSizeMB?: number;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  value: propValue,
  onChange: propOnChange,
  currentImageUrl,
  onImageUploaded,
  onRemove,
  label = 'Fotografía o Imagen',
  helperText = 'Arrastra y suelta tu archivo aquí, o haz clic para explorar (PNG, JPG, WEBP hasta 25MB)',
  aspectRatio = 'landscape',
  className = '',
  folder = 'gallery',
  maxSizeMB = 25,
}) => {
  const value = propValue !== undefined ? propValue : (currentImageUrl || '');
  const onChange = (url: string) => {
    if (propOnChange) propOnChange(url);
    if (onImageUploaded) onImageUploaded(url);
    if (!url && onRemove) onRemove();
  };
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; type: string } | null>(null);
  const [previewZoomOpen, setPreviewZoomOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, SVG).');
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`El archivo excede el tamaño máximo permitido de ${maxSizeMB}MB.`);
      return;
    }

    const previousUrl = value;

    setFileDetails({
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type.split('/')[1]?.toUpperCase() || 'IMG',
    });

    setUploading(true);
    setUploadProgress(20);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 150);

    try {
      const res = await uploadFile(file, folder);
      clearInterval(progressTimer);
      setUploadProgress(100);

      // Asynchronously delete replaced previous file from storage to avoid orphan garbage
      if (previousUrl && previousUrl !== res.url) {
        deleteUploadedFile(previousUrl).catch(() => {});
      }

      setTimeout(() => {
        onChange(res.url);
        setUploading(false);
        setUploadProgress(0);
        toast.success('¡Imagen subida correctamente!');
      }, 300);
    } catch (err: any) {
      clearInterval(progressTimer);
      setUploading(false);
      setUploadProgress(0);
      toast.error(err.message || 'Error al subir la imagen');
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  }, [maxSizeMB, folder]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    const oldUrl = value;
    onChange('');
    setFileDetails(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Asynchronously delete removed file from storage
    if (oldUrl) {
      deleteUploadedFile(oldUrl).catch(() => {});
    }
  };

  return (
    <div className={`space-y-1.5 font-body w-full min-w-0 ${className}`}>
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-forest/70" />
          {label}
        </label>
        {value && (
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Imagen Cargada
          </span>
        )}
      </div>

      {/* Upload Zone / Preview Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`
          relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden group w-full min-w-0
          ${
            isDragging
              ? 'border-forest bg-forest/10 scale-[1.01] shadow-lg ring-4 ring-forest/10'
              : value
              ? 'border-forest/20 bg-forest/5 hover:border-forest/40'
              : 'border-forest/20 bg-cream/50 hover:bg-cream/90 hover:border-forest/40 hover:shadow-xs'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* STATE 1: Existing Image Preview */}
        {value && !uploading && (
          <div className="relative p-3 bg-white/60 w-full min-w-0">
            <div className="flex items-center gap-3.5 w-full min-w-0">
              {/* Compact Thumbnail with click to zoom preview modal */}
              <div 
                className="relative w-16 h-16 min-w-[4rem] min-h-[4rem] max-w-[4rem] max-h-[4rem] rounded-xl overflow-hidden bg-white shadow-2xs border border-forest/15 shrink-0 group/img cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewZoomOpen(true);
                }}
                title="Haz clic para ver la imagen en tamaño completo"
              >
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300 pointer-events-none"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye className="w-4 h-4" />
                </div>
              </div>

              {/* Info & Action Controls */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-forest/10 px-2 py-0.5 rounded-md">
                    {fileDetails?.type || 'FOTO'}
                  </span>
                  {fileDetails?.size && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {fileDetails.size}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-forest truncate">
                  {fileDetails?.name || value.split('/').pop() || 'imagen-cargada.jpg'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  Haz clic para reemplazar la fotografía
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-forest hover:bg-forest/10 transition-colors border border-forest/15 bg-white shadow-2xs"
                  title="Cambiar Imagen"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors border border-destructive/20 bg-white shadow-2xs"
                  title="Eliminar Imagen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATE 2: Upload in Progress */}
        {uploading && (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center mx-auto animate-pulse">
              <UploadCloud className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-bold text-forest block">
                Subiendo y procesando imagen... ({uploadProgress}%)
              </span>
              <span className="text-[10px] text-muted-foreground">
                Optimizando resolución para almacenamiento multi-tenant
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs mx-auto bg-forest/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-forest h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* STATE 3: Empty Dropzone */}
        {!value && !uploading && (
          <div className="p-6 text-center space-y-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110 ${
              isDragging ? 'bg-forest text-white' : 'bg-forest/10 text-forest'
            }`}>
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs font-bold text-forest">
                {isDragging ? '¡Suelta el archivo aquí!' : 'Haz clic para explorar o arrastra tu foto'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs mx-auto">
                {helperText}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Preview Modal */}
      {previewZoomOpen && value && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewZoomOpen(false)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-3xl overflow-hidden p-2 shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setPreviewZoomOpen(false)}
              className="absolute top-4 right-4 text-white bg-black/60 hover:bg-black p-2 rounded-full backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={value}
              alt="Vista previa ampliada"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadDropzone;
