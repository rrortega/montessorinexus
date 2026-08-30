import React, { useEffect, useState, useId, useRef } from 'react';
import mermaid from 'mermaid';
import { Loader2, Maximize2, ZoomIn, ZoomOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface MermaidDiagramProps {
  chart: string;
  isSaaSBlog?: boolean;
}

// Module-level cache so diagrams never re-render or flash on page scroll
const svgCache = new Map<string, string>();

export const MermaidDiagram: React.FC<MermaidDiagramProps> = React.memo(({ chart, isSaaSBlog }) => {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const isSaaS = isSaaSBlog ?? (typeof window !== 'undefined' && !window.location.pathname.includes('/escuela/'));

  const cleanChart = (chart || '')
    .trim()
    .replace(/→/g, '==>')
    .replace(/->\|([^|]+)\|/g, '==>|$1|')
    .replace(/(?<![-=])->(?![->])/g, '==>')
    .replace(/-->/g, '==>');

  const cacheKey = `${isSaaS ? 'saas' : 'school'}::${isDark ? 'dark' : 'light'}::${cleanChart}`;
  const cachedSvg = svgCache.get(cacheKey);

  const [svg, setSvg] = useState<string>(cachedSvg || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!cachedSvg);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number; initialPanX: number; initialPanY: number }>({
    x: 0,
    y: 0,
    initialPanX: 0,
    initialPanY: 0
  });

  const rawId = useId();
  const diagramId = `mermaid-${rawId.replace(/:/g, '')}`;
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Palette colors based on blog mode (SaaS / School) and dark mode
  const brandLineColor = isSaaS
    ? (isDark ? '#fb923c' : '#C4661F')
    : (isDark ? '#34d399' : '#166534');

  const brandBorderColor = isSaaS
    ? (isDark ? '#ea580c' : '#C4661F')
    : (isDark ? '#059669' : '#166534');

  const brandNodeBkg = isSaaS
    ? (isDark ? '#292524' : '#fef7ee')
    : (isDark ? '#1e293b' : '#f0fdf4');

  const brandTextColor = isSaaS
    ? (isDark ? '#ffedd5' : '#431407')
    : (isDark ? '#ecfdf5' : '#14532d');

  const brandClusterBorder = isSaaS
    ? (isDark ? '#7c2d12' : '#fed7aa')
    : (isDark ? '#065f46' : '#86efac');

  const brandClusterBkg = isSaaS
    ? (isDark ? '#1c1917' : '#fff7ed')
    : (isDark ? '#022c22' : '#f0fdf4');

  useEffect(() => {
    let isMounted = true;

    if (svgCache.has(cacheKey)) {
      setSvg(svgCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    const renderChart = async () => {
      if (!cleanChart) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'loose',
          fontFamily: 'Lexend, system-ui, sans-serif',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          pie: {
            useMaxWidth: true,
            textPosition: 0.5
          },
          sequence: {
            useMaxWidth: true,
            showSequenceNumbers: false
          },
          gantt: {
            useMaxWidth: true
          },
          themeVariables: {
            fontFamily: 'Lexend, system-ui, sans-serif',
            fontSize: '14px',
            primaryColor: brandNodeBkg,
            primaryTextColor: brandTextColor,
            primaryBorderColor: brandBorderColor,
            lineColor: brandLineColor,
            edgeLabelBackground: isDark ? '#1c1917' : '#ffffff',
            nodeBorder: brandBorderColor,
            nodeTextColor: brandTextColor,
            mainBkg: brandNodeBkg,
            clusterBkg: brandClusterBkg,
            clusterBorder: brandClusterBorder,
            secondaryColor: isDark ? '#0f172a' : '#f8fafc',
            tertiaryColor: isDark ? '#1e1b4b' : '#faf5ff',
            actorBkg: brandNodeBkg,
            actorBorder: brandBorderColor,
            actorTextColor: brandTextColor,
            signalColor: brandLineColor,
            signalTextColor: brandTextColor,
            labelBoxBkgColor: brandNodeBkg,
            labelBoxBorderColor: brandBorderColor,
            labelTextColor: brandTextColor,
            loopTextColor: brandTextColor,
            noteBorderColor: brandBorderColor,
            noteBkgColor: brandNodeBkg,
            noteTextColor: brandTextColor,
            activationBorderColor: brandBorderColor,
            activationBkgColor: isDark ? '#0f172a' : brandNodeBkg,
            sequenceNumberColor: brandTextColor,
            pie1: isSaaS ? '#C4661F' : '#166534',
            pie2: isSaaS ? '#f59e0b' : '#059669',
            pie3: isSaaS ? '#d97706' : '#10b981',
            pie4: isSaaS ? '#b45309' : '#34d399',
            pie5: isSaaS ? '#ea580c' : '#047857',
            pie6: isSaaS ? '#c2410c' : '#065f46',
            pie7: isSaaS ? '#9a3412' : '#022c22',
            pieTitleTextColor: brandTextColor,
            pieSectionTextColor: '#ffffff',
            xyChart: {
              backgroundColor: 'transparent',
              titleColor: brandTextColor,
              xAxisTitleColor: isDark ? '#94a3b8' : '#475569',
              xAxisLabelColor: isDark ? '#94a3b8' : '#475569',
              xAxisLineColor: isDark ? '#475569' : '#cbd5e1',
              yAxisTitleColor: isDark ? '#94a3b8' : '#475569',
              yAxisLabelColor: isDark ? '#94a3b8' : '#475569',
              yAxisLineColor: isDark ? '#475569' : '#cbd5e1',
              plotColorPalette: isSaaS 
                ? '#C4661F, #f59e0b, #ea580c, #d97706, #b45309'
                : '#166534, #059669, #10b981, #34d399, #047857'
            }
          }
        });

        const { svg: renderedSvg } = await mermaid.render(diagramId, cleanChart);
        
        // Enhance SVG with scoped CSS rules for brand borders, arrows and rounded shapes
        const styleBlock = `
          <style>
            #${diagramId} .node rect, #${diagramId} .node circle, #${diagramId} .node ellipse, #${diagramId} .node polygon, #${diagramId} .node path {
              stroke: ${brandBorderColor} !important;
              stroke-width: 2px !important;
              fill: ${brandNodeBkg} !important;
              rx: 12px !important;
              ry: 12px !important;
            }
            #${diagramId} .edgePath path.path, #${diagramId} .flowchart-link {
              stroke: ${brandLineColor} !important;
              stroke-width: 2.2px !important;
            }
            #${diagramId} .marker, #${diagramId} .arrowheadPath, #${diagramId} #statediagram-barbEnd {
              fill: ${brandLineColor} !important;
              stroke: ${brandLineColor} !important;
            }
            #${diagramId} .label text, #${diagramId} .node .label {
              font-family: Lexend, system-ui, sans-serif !important;
              font-weight: 600 !important;
              fill: ${brandTextColor} !important;
            }
            #${diagramId} .cluster rect {
              rx: 16px !important;
              ry: 16px !important;
              stroke: ${brandClusterBorder} !important;
              fill: ${brandClusterBkg} !important;
            }
          </style>
        `;

        const responsiveSvg = renderedSvg
          .replace(/style="max-width:\s*[^"]*"/gi, '')
          .replace(/max-width:\s*[^;"]*;?/gi, '')
          .replace(/<svg\b([^>]*)>/, `<svg $1>${styleBlock}`);

        svgCache.set(cacheKey, responsiveSvg);

        if (isMounted) {
          setSvg(responsiveSvg);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error rendering Mermaid chart:', err);
        if (isMounted) {
          setError(err?.message || 'Error de sintaxis en el gráfico');
          setLoading(false);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
      const tempElement = document.getElementById(diagramId);
      if (tempElement && tempElement.parentNode) {
        tempElement.parentNode.removeChild(tempElement);
      }
      const tempContainer = document.getElementById(`d${diagramId}`);
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    };
  }, [cleanChart, cacheKey, diagramId, isDark, isSaaS, brandBorderColor, brandLineColor, brandNodeBkg, brandTextColor, brandClusterBorder, brandClusterBkg]);

  // Lock body scroll and register native non-passive wheel listener when fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const container = modalContainerRef.current;
    if (container) {
      const handleNativeWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
        setZoomLevel(prev => {
          const next = Number((prev * zoomFactor).toFixed(2));
          return Math.min(Math.max(next, 0.4), 4);
        });
      };

      container.addEventListener('wheel', handleNativeWheel, { passive: false });

      return () => {
        document.body.style.overflow = originalOverflow;
        container.removeEventListener('wheel', handleNativeWheel);
      };
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFullscreen]);

  const handleOpenFullscreen = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleCloseFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(prev => Math.min(Number((prev + 0.25).toFixed(2)), 4));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(prev => Math.max(Number((prev - 0.25).toFixed(2)), 0.4));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: pan.x,
      initialPanY: pan.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.initialPanX + deltaX,
      y: dragStartRef.current.initialPanY + deltaY
    });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        initialPanX: pan.x,
        initialPanY: pan.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStartRef.current.x;
    const deltaY = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.initialPanX + deltaX,
      y: dragStartRef.current.initialPanY + deltaY
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  if (error) {
    return null;
  }

  return (
    <>
      <figure className="my-8 w-full group/mermaid select-none">
        <div className={`w-full overflow-hidden rounded-3xl border ${
          isSaaS ? 'border-[#C4661F]/25 bg-[#C4661F]/[0.02]' : 'border-forest/25 bg-forest/[0.02]'
        } dark:bg-card/40 backdrop-blur-md shadow-xs transition-all hover:shadow-md`}>
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border/60 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSaaS ? 'bg-[#C4661F]' : 'bg-forest'} animate-pulse`} />
              <span className="font-display font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Esquema / Gráfico Ilustrativo
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenFullscreen}
              className={`h-8 px-3 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                isSaaS
                  ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:bg-[#C4661F] hover:text-white hover:border-[#C4661F] dark:hover:bg-[#C4661F] dark:hover:text-white dark:hover:border-[#C4661F] group/btn'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:bg-forest hover:text-white hover:border-forest dark:hover:bg-forest dark:hover:text-white dark:hover:border-forest group/btn'
              }`}
              title="Ampliar esquema a pantalla completa"
            >
              <Maximize2 className={`w-3.5 h-3.5 ${
                isSaaS
                  ? 'text-[#C4661F] group-hover/btn:text-white'
                  : 'text-forest group-hover/btn:text-white'
              } transition-colors`} />
              <span className="font-semibold">Ampliar</span>
            </button>
          </div>

          {/* Diagram Canvas Body */}
          <div className="overflow-x-auto scrollbar-thin p-6 sm:p-10 lg:p-14 flex justify-center items-center min-h-[260px] sm:min-h-[380px] lg:min-h-[460px] bg-white/50 dark:bg-black/20">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground py-16">
                <Loader2 className={`w-7 h-7 animate-spin ${isSaaS ? 'text-[#C4661F]' : 'text-forest'}`} />
                <span>Cargando gráfico ilustrativo...</span>
              </div>
            ) : (
              <div
                className="mermaid-svg-container w-full max-w-5xl mx-auto flex justify-center items-center [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:mx-auto transition-all"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            )}
          </div>
        </div>
      </figure>

      {/* Fullscreen Lightbox Modal (100% Device Viewport, No Rounded Borders) */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#faf9f5] dark:bg-[#0c140e] w-screen h-screen flex flex-col select-none overflow-hidden rounded-none border-none p-0"
          >
            {/* Controls in the top-right */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-lg"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.4}
                className="h-8 w-8 p-0 rounded-xl hover:bg-muted cursor-pointer"
                title="Reducir"
              >
                <ZoomOut className="w-4 h-4 text-stone-700 dark:text-stone-300" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="h-8 w-8 p-0 rounded-xl hover:bg-muted cursor-pointer"
                title="Ampliar"
              >
                <ZoomIn className="w-4 h-4 text-stone-700 dark:text-stone-300" />
              </Button>

              <div className="w-px h-4 bg-stone-200 dark:bg-stone-700 mx-0.5" />

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseFullscreen();
                }}
                className="h-8 w-8 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors text-stone-600 dark:text-stone-300"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Fullscreen Interactive Draggable & Zoomable Canvas Area */}
            <div 
              ref={modalContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`w-full h-full overflow-hidden select-none flex items-center justify-center p-4 sm:p-12 ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              <div 
                style={{ 
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoomLevel})`, 
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.12s ease-out'
                }}
                className="mermaid-svg-container w-full h-full flex justify-center items-center [&>svg]:max-w-none [&>svg]:w-auto [&>svg]:max-h-[92vh] [&>svg]:h-auto [&>svg]:mx-auto pointer-events-none"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

MermaidDiagram.displayName = 'MermaidDiagram';

export default MermaidDiagram;
