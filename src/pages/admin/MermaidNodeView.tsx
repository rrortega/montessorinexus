import React, { useState, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Network, Edit3, Trash2, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';

export function MermaidNodeView({ node, updateAttributes, deleteNode, getPos, editor }: any) {
  const language = node.attrs?.language;
  const rawText = node.textContent || '';
  const isMermaid = language === 'mermaid' || /^(flowchart|graph|sequenceDiagram|pie|xychart|quadrantChart|gantt|timeline|mindmap)/i.test(rawText.trim());

  const [svg, setSvg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [draftCode, setDraftCode] = useState<string>(rawText);

  const renderDiagram = async (codeToRender: string) => {
    if (!codeToRender.trim()) {
      setSvg('');
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isDark = document.documentElement.classList.contains('dark');
      const isSaaS = typeof window !== 'undefined' && !window.location.pathname.includes('/escuela/');

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

      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        fontFamily: 'Lexend, system-ui, sans-serif',
        themeVariables: {
          fontFamily: 'Lexend, system-ui, sans-serif',
          fontSize: '13px',
          primaryColor: brandNodeBkg,
          primaryTextColor: brandTextColor,
          primaryBorderColor: brandBorderColor,
          lineColor: brandLineColor,
          edgeLabelBackground: isDark ? '#1c1917' : '#ffffff',
          nodeBorder: brandBorderColor,
          nodeTextColor: brandTextColor,
          mainBkg: brandNodeBkg,
          clusterBkg: brandClusterBkg,
          clusterBorder: brandClusterBorder
        }
      });

      const clean = codeToRender
        .trim()
        .replace(/→/g, '==>')
        .replace(/->\|([^|]+)\|/g, '==>|$1|')
        .replace(/(?<![-=])->(?![->])/g, '==>')
        .replace(/-->/g, '==>');

      const id = `editor-node-mermaid-${Math.random().toString(36).substring(2, 9)}`;
      const { svg: rendered } = await mermaid.render(id, clean);

      const styleBlock = `
        <style>
          #${id} .node rect, #${id} .node circle, #${id} .node ellipse, #${id} .node polygon, #${id} .node path {
            stroke: ${brandBorderColor} !important;
            stroke-width: 2px !important;
            fill: ${brandNodeBkg} !important;
            rx: 12px !important;
            ry: 12px !important;
          }
          #${id} .edgePath path.path, #${id} .flowchart-link {
            stroke: ${brandLineColor} !important;
            stroke-width: 2.2px !important;
          }
          #${id} .marker, #${id} .arrowheadPath, #${id} #statediagram-barbEnd {
            fill: ${brandLineColor} !important;
            stroke: ${brandLineColor} !important;
          }
          #${id} .label text, #${id} .node .label {
            font-family: Lexend, system-ui, sans-serif !important;
            font-weight: 600 !important;
            fill: ${brandTextColor} !important;
          }
        </style>
      `;

      const styledSvg = rendered
        .replace(/style="max-width:[^"]*"/gi, '')
        .replace(/<svg\b([^>]*)>/, `<svg $1>${styleBlock}`);

      setSvg(styledSvg);
    } catch (err: any) {
      setError(err?.message || 'Error de sintaxis');
      setSvg('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMermaid) {
      renderDiagram(rawText);
    }
  }, [rawText, isMermaid]);

  const handleOpenEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDraftCode(rawText);
    setIsModalOpen(true);
  };

  const handleSaveEdit = () => {
    const cleanCode = draftCode
      .trim()
      .replace(/→/g, '==>')
      .replace(/->\|([^|]+)\|/g, '==>|$1|')
      .replace(/(?<![-=])->(?![->])/g, '==>')
      .replace(/-->/g, '==>');

    const pos = typeof getPos === 'function' ? getPos() : null;
    if (pos !== null && editor) {
      editor.chain().focus().command(({ tr, schema }: any) => {
        const newNode = schema.nodes.codeBlock.create(
          { language: 'mermaid' },
          cleanCode ? schema.text(cleanCode) : null
        );
        tr.replaceRangeWith(pos, pos + node.nodeSize, newNode);
        return true;
      }).run();
    }
    setIsModalOpen(false);
  };

  if (!isMermaid) {
    return (
      <NodeViewWrapper className="code-block my-4 p-4 rounded-2xl bg-muted/40 border border-border font-mono text-xs">
        <pre>
          <NodeViewContent as="code" />
        </pre>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-6 select-none relative group/diagram" contentEditable={false}>
      {/* Hidden text container so ProseMirror attaches its content DOM without displaying raw code */}
      <pre className="hidden" style={{ display: 'none' }} aria-hidden="true">
        <NodeViewContent as="code" />
      </pre>

      {/* Visual Diagram Card in Editor */}
      <div className="w-full rounded-2xl border border-forest/25 bg-forest/[0.03] dark:bg-card/40 p-4 transition-all hover:border-forest/50 hover:shadow-md">
        {/* Card Header Bar */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
            <Network className="w-4 h-4 text-forest" />
            <span className="font-display font-bold text-forest text-xs uppercase tracking-wide">
              Diagrama Mermaid (Vista Previa)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-border text-xs text-forest hover:bg-forest/10 flex items-center gap-1 shadow-2xs font-semibold cursor-pointer transition-colors"
              title="Editar código del diagrama"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={() => deleteNode()}
              className="p-1 rounded-lg bg-white dark:bg-stone-800 border border-border text-xs text-destructive hover:bg-destructive/10 shadow-2xs cursor-pointer transition-colors"
              title="Eliminar diagrama"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Diagram SVG Canvas - Clicking it opens the edit modal */}
        <div
          onClick={handleOpenEdit}
          className="cursor-pointer overflow-x-auto min-h-[160px] flex items-center justify-center p-4 sm:p-6 bg-white/80 dark:bg-stone-900/60 rounded-xl border border-border/60 hover:border-forest/40 transition-all group-hover/diagram:bg-white"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-8">
              <Loader2 className="w-4 h-4 animate-spin text-forest" />
              <span>Compilando diagrama...</span>
            </div>
          ) : svg ? (
            <div
              className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:mx-auto pointer-events-none"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-muted-foreground">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-semibold text-foreground">Haz clic para editar el código del diagrama</span>
              {error && <span className="text-[11px] text-destructive">{error}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal / Textarea Dialog */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 font-display font-bold text-foreground text-sm">
                <Network className="w-4 h-4 text-forest" />
                <span>Editar Diagrama Mermaid</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Código del Diagrama
              </label>
              <textarea
                value={draftCode}
                onChange={(e) => setDraftCode(e.target.value)}
                rows={9}
                placeholder="flowchart LR&#10;  A[&quot;Inicio&quot;] ==> B[&quot;Fin&quot;]"
                className="w-full font-mono text-xs p-3.5 rounded-xl border border-border bg-stone-50 dark:bg-stone-950 text-foreground focus:outline-none focus:ring-2 focus:ring-forest/30 resize-y"
              />
              <p className="text-[11px] text-stone-500">
                Las flechas <code className="text-forest font-bold">{'->'}</code> se convertirán automáticamente a <code className="text-forest font-bold">{'==>'}</code> al guardar.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveEdit}
                className="bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Diagrama</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export default MermaidNodeView;
