import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Images,
  Image as ImageIcon,
  Globe,
  Lock,
  ArrowRight,
  Sparkles,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { Gallery, getGalleries } from '@/lib/sqlite';

interface FeedGalleryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGallery: (gallery: Gallery) => void;
}

export const FeedGalleryPickerModal: React.FC<FeedGalleryPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectGallery,
}) => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getGalleries()
        .then((data) => {
          setGalleries(data || []);
        })
        .catch((err) => {
          console.error('Error fetching galleries for picker:', err);
          setGalleries([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  const filteredGalleries = useMemo(() => {
    if (!searchQuery.trim()) return galleries;
    const q = searchQuery.toLowerCase().trim();
    return galleries.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
    );
  }, [galleries, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest/10 dark:bg-forest/20 text-forest flex items-center justify-center shadow-xs">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white leading-tight">
                Compartir Álbum de Galería en el Feed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona la galería escolar que deseas publicar en el muro comunitario.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar álbum por nombre o descripción..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>
        </div>

        {/* Galleries List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-forest" />
              <p className="text-xs font-medium">Cargando álbumes del colegio...</p>
            </div>
          ) : filteredGalleries.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {searchQuery ? 'No se encontraron álbumes coincidentes' : 'No hay galerías creadas aún'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm">
                {searchQuery
                  ? 'Intenta con otro término de búsqueda.'
                  : 'Crea tu primera galería de fotos en el panel de administración antes de compartirla en el feed.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredGalleries.map((gal) => (
                <div
                  key={gal.id}
                  onClick={() => onSelectGallery(gal)}
                  className="group flex flex-col justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-forest/50 dark:hover:border-forest/60 bg-white dark:bg-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs hover:shadow-md"
                >
                  <div className="space-y-3">
                    {/* Thumbnail & Badges */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      {gal.cover_image ? (
                        <img
                          src={gal.cover_image}
                          alt={gal.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                          <ImageIcon className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600" />
                          <span className="text-[10px] font-medium">Sin foto de portada</span>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                        {gal.is_default && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest text-white shadow-xs">
                            General
                          </span>
                        )}
                        {gal.show_on_web ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" />
                            Web
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/30 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Interno
                          </span>
                        )}
                      </div>

                      {typeof gal.image_count === 'number' && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white font-mono shadow-xs">
                          {gal.image_count} {gal.image_count === 1 ? 'foto' : 'fotos'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-forest transition-colors">
                        {gal.name}
                      </h4>
                      {gal.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {gal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-forest">
                    <span>Seleccionar para el Feed</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
          <span>{filteredGalleries.length} {filteredGalleries.length === 1 ? 'álbum disponible' : 'álbumes disponibles'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
