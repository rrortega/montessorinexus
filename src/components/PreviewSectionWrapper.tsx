import React, { createContext, useContext, useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';

interface PreviewHoverContextType {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  currentlyEditingId: string | null;
  setCurrentlyEditingId: (id: string | null) => void;
}

const PreviewHoverContext = createContext<PreviewHoverContextType>({
  hoveredId: null,
  setHoveredId: () => {},
  currentlyEditingId: null,
  setCurrentlyEditingId: () => {}
});

export const PreviewHoverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [currentlyEditingId, setCurrentlyEditingId] = useState<string | null>(null);

  useEffect(() => {
    const handleEditingMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === 'SET_CURRENTLY_EDITING_SECTION') {
          setCurrentlyEditingId(event.data.sectionId || null);
        } else if (event.data.type === 'SCROLL_TO_SECTION') {
          setCurrentlyEditingId(event.data.sectionId || null);
        }
      }
    };
    window.addEventListener('message', handleEditingMessage);
    return () => window.removeEventListener('message', handleEditingMessage);
  }, []);

  return (
    <PreviewHoverContext.Provider value={{ hoveredId, setHoveredId, currentlyEditingId, setCurrentlyEditingId }}>
      {children}
    </PreviewHoverContext.Provider>
  );
};

interface PreviewSectionWrapperProps {
  id: string;
  name: string;
  targetTab: string;
  children: React.ReactNode;
}

export const PreviewSectionWrapper: React.FC<PreviewSectionWrapperProps> = ({
  id,
  name,
  targetTab,
  children
}) => {
  const isBuilderPreview = typeof window !== 'undefined' && (
    window.self !== window.top ||
    new URLSearchParams(window.location.search).get('preview') === '1'
  );

  const { hoveredId, setHoveredId, currentlyEditingId } = useContext(PreviewHoverContext);

  const isCurrentlyEditing = currentlyEditingId === id;
  const isDrawerOpenMode = Boolean(currentlyEditingId);

  // Hover is completely disabled when any drawer is currently open
  const isThisHovered = !isDrawerOpenMode && hoveredId === id;
  const isOtherHovered = !isDrawerOpenMode && hoveredId !== null && hoveredId !== id;

  // Listen to drawer open events from the parent builder window and scroll into view smoothly
  useEffect(() => {
    if (!isBuilderPreview) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SCROLL_TO_SECTION') {
        const targetId = event.data.sectionId;
        if (targetId === id) {
          const el = document.getElementById(id);
          if (el) {
            if (id === 'header') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [id, isBuilderPreview]);

  const handleEditClick = (e: React.MouseEvent) => {
    if (isDrawerOpenMode) return;
    e.stopPropagation();
    e.preventDefault();
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage(
        {
          type: 'OPEN_SECTION_DRAWER',
          targetTab
        },
        '*'
      );
    }
  };

  if (!isBuilderPreview) {
    return <div id={id} className="scroll-mt-24">{children}</div>;
  }

  const isHeader = id === 'header';

  return (
    <div
      id={id}
      onMouseEnter={() => {
        if (!isDrawerOpenMode) setHoveredId(id);
      }}
      onMouseLeave={() => {
        if (!isDrawerOpenMode) setHoveredId(null);
      }}
      className={`relative transition-all duration-300 ${
        isHeader
          ? isThisHovered
            ? 'z-[70]'
            : isOtherHovered
            ? 'z-[50] filter blur-[2px] opacity-70 transition-all duration-300'
            : 'z-[50] transition-all duration-300'
          : isThisHovered
          ? 'z-40'
          : isOtherHovered
          ? 'z-10 filter blur-[4px] opacity-40 grayscale-[20%] transition-all duration-300'
          : isCurrentlyEditing
          ? 'z-30'
          : 'z-20 transition-all duration-300'
      }`}
    >
      {/* Gray Dashed Border on the section currently being edited in Drawer (No blur on others) */}
      {isCurrentlyEditing && (
        <div className="absolute inset-0 z-30 pointer-events-none border-2 border-dashed border-slate-400/80 bg-slate-400/5 transition-all animate-in fade-in duration-150 rounded-xl" />
      )}

      {/* Red Dashed Border Overlay when Hovered in Normal Mode */}
      {isThisHovered && (
        <div className="absolute inset-0 z-40 pointer-events-none border-2 border-dashed border-rose-500 bg-rose-500/5 transition-all animate-in fade-in duration-150 rounded-xl shadow-xs" />
      )}

      {/* Bottom-Left Label Badge & Edit Button (Only in Normal Hover Mode) */}
      {isThisHovered && (
        <div className="absolute bottom-4 left-4 z-[99999] flex items-center gap-2 bg-rose-600/95 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xl border border-rose-400/60 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none">
          <span className="tracking-tight text-white">{name}</span>
          <button
            type="button"
            onClick={handleEditClick}
            className="px-2.5 py-1 rounded-lg bg-white text-rose-700 hover:bg-rose-50 active:scale-95 text-[11px] font-extrabold flex items-center gap-1 shadow-md transition-all cursor-pointer z-[99999]"
            title={`Editar ${name}`}
          >
            <Pencil className="w-3 h-3 text-rose-600" />
            <span>Editar</span>
          </button>
        </div>
      )}

      {children}
    </div>
  );
};
