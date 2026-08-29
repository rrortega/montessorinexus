import React, { useState } from 'react';
import { Pencil } from 'lucide-react';

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

  const [isHovered, setIsHovered] = useState(false);

  const handleEditClick = (e: React.MouseEvent) => {
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
    return <>{children}</>;
  }

  return (
    <div
      id={`preview-sec-${id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group/section-editor"
    >
      {/* Red Dashed Border Overlay when Hovered */}
      {isHovered && (
        <div className="absolute inset-0 z-40 pointer-events-none border-2 border-dashed border-rose-500 bg-rose-500/5 transition-all animate-in fade-in duration-150 rounded-xl" />
      )}

      {/* Top-Left Square Label Badge & Edit Button */}
      {isHovered && (
        <div className="absolute top-3 left-3 z-50 flex items-center gap-2 bg-rose-600/95 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl border border-rose-400/50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none">
          <span className="tracking-tight text-white">{name}</span>
          <button
            type="button"
            onClick={handleEditClick}
            className="px-2 py-1 rounded-lg bg-white text-rose-700 hover:bg-rose-50 active:scale-95 text-[11px] font-extrabold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
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
