import React, { useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import CodeBlock from '@tiptap/extension-code-block';
import { Markdown } from 'tiptap-markdown';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, 
  List, ListOrdered, Quote, ImageIcon, Loader2, Maximize, Minimize,
  Network, X, Check, Upload, Sparkles, Paintbrush, Layers
} from 'lucide-react';
import { uploadPhysicalFile } from '@/lib/api';
import { MermaidNodeView } from './MermaidNodeView';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MarkdownWysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  articleTitle?: string;
  isPlatformBlog?: boolean;
  schoolId?: string | null;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  disabled?: boolean;
}

function ToolbarButton({ onClick, isActive, icon: Icon, title, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
        isActive 
          ? 'bg-forest text-white' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

const CustomCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  }
});

const DEFAULT_DIAGRAM_TEMPLATE = `flowchart LR
  A["🌱 Exploración Inicial"] ==> B["💡 Comprensión Profunda"]
  B ==> C["🎓 Maestría Práctica"]`;

const AI_STYLES = [
  { id: 'carboncillo', label: 'Carboncillo y Terracota (Oficial)', prompt: 'Dibujo a mano alzada con carboncillo negro y crayón terracota cálido, estilo bosquejo artístico sobre papel artesanal. Sin texto, sin letras, sin tipografía.' },
  { id: 'fotorrealista', label: 'Fotorrealista', prompt: 'Fotografía profesional de alta calidad, iluminación natural suave, ambiente preparado Montessori. Sin texto, sin letras, sin tipografía.' },
  { id: 'acuarela', label: 'Acuarela', prompt: 'Ilustración artística en acuarela, pinceladas suaves, tonos cálidos y orgánicos, atmósfera serena. Sin texto, sin letras, sin tipografía.' },
  { id: 'minimalista', label: 'Minimalista', prompt: 'Diseño minimalista moderno, formas limpias y elegantes, composición visual despejada. Sin texto, sin letras, sin tipografía.' },
  { id: '3d', label: 'Animación 3D', prompt: 'Render 3D suave estilo editorial/Pixar, iluminación cálida, texturas ricas. Sin texto, sin letras, sin tipografía.' }
];

export function MarkdownWysiwygEditor({ 
  value, 
  onChange, 
  placeholder,
  articleTitle = '',
  isPlatformBlog = false,
  schoolId = null
}: MarkdownWysiwygEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Diagram modal states
  const [isInsertDiagramOpen, setIsInsertDiagramOpen] = useState(false);
  const [newDiagramCode, setNewDiagramCode] = useState(DEFAULT_DIAGRAM_TEMPLATE);

  // Image insertion modal states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'ai'>('upload');
  
  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [uploadAltText, setUploadAltText] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI image states
  const [aiPromptStyle, setAiPromptStyle] = useState<string>('');
  const [aiPromptText, setAiPromptText] = useState<string>('');
  const [aiAltText, setAiAltText] = useState<string>('');
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CustomCodeBlock,
      Image,
      Markdown,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as any)?.markdown?.getMarkdown?.() ?? editor.getHTML();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
      },
      handlePaste: () => false
    }
  });

  useEffect(() => {
    if (editor && typeof value === 'string') {
      const currentMarkdown = (editor.storage as any)?.markdown?.getMarkdown?.();
      if (currentMarkdown !== undefined && currentMarkdown !== value) {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  // Build default AI prompt
  const buildAiPrompt = (title: string, stylePrompt?: string) => {
    const concept = title ? `"${title}"` : 'Educación Montessori';
    return `Ilustración artística y visual para blog Montessori sobre el concepto: ${concept}. ${stylePrompt || ''} Estrictamente SIN texto, SIN títulos, SIN letras, SIN carteles ni palabras escritas, escena puramente visual.`;
  };

  // Open Image Modal and setup initial AI style
  const handleOpenImageModal = () => {
    const defaultStyle = isPlatformBlog
      ? AI_STYLES.find(s => s.id === 'carboncillo')
      : AI_STYLES.find(s => s.id === 'fotorrealista');

    const styleId = defaultStyle?.id || 'carboncillo';
    setAiPromptStyle(styleId);
    setAiPromptText(buildAiPrompt(articleTitle, defaultStyle?.prompt));
    setAiAltText(articleTitle || 'Ilustración Montessori');
    setUploadAltText(articleTitle || '');
    setSelectedFile(null);
    setUploadPreview('');
    setIsImageModalOpen(true);
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const styleId = e.target.value;
    setAiPromptStyle(styleId);
    const style = AI_STYLES.find(s => s.id === styleId);
    setAiPromptText(buildAiPrompt(articleTitle, style?.prompt));
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadPreview(URL.createObjectURL(file));
      if (!uploadAltText) {
        setUploadAltText(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // Submit Upload Image
  const handleUploadSubmit = async () => {
    if (!selectedFile || !editor) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadPhysicalFile(selectedFile, 'blog', 'blog-image', true);
      if (uploaded?.url) {
        editor.chain().focus().setImage({ 
          src: uploaded.url, 
          alt: uploadAltText || selectedFile.name 
        }).run();
        toast.success('Imagen subida e insertada correctamente');
        setIsImageModalOpen(false);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Submit AI Generate Image
  const handleAiGenerateSubmit = async () => {
    if (!aiPromptText.trim() || !editor) return;

    setIsGeneratingAiImage(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (isPlatformBlog) {
        headers['x-is-platform'] = 'true';
      } else if (schoolId) {
        headers['x-school-id'] = schoolId;
      }

      const res = await fetch('/api/admin/blog/ai/generate-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          title: articleTitle || 'Educación Montessori', 
          prompt: aiPromptText 
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al generar imagen con IA');
      }

      const data = await res.json();
      if (!data.url) {
        throw new Error('No se recibió la URL de la imagen generada');
      }

      editor.chain().focus().setImage({ 
        src: data.url, 
        alt: aiAltText || articleTitle || 'Ilustración generada con IA' 
      }).run();

      toast.success('✨ Imagen generada e incrustada en el artículo');
      setIsImageModalOpen(false);
    } catch (err: any) {
      console.error('Error generating AI image:', err);
      toast.error('Error al generar imagen: ' + err.message);
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  // Insert Diagram Handler
  const handleInsertDiagram = () => {
    if (!editor) return;

    const cleanCode = (newDiagramCode.trim() || DEFAULT_DIAGRAM_TEMPLATE)
      .replace(/→/g, '==>')
      .replace(/->\|([^|]+)\|/g, '==>|$1|')
      .replace(/(?<![-=])->(?![->])/g, '==>')
      .replace(/-->/g, '==>');

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'codeBlock',
        attrs: { language: 'mermaid' },
        content: [{ type: 'text', text: cleanCode }]
      })
      .run();

    setIsInsertDiagramOpen(false);
    setNewDiagramCode(DEFAULT_DIAGRAM_TEMPLATE);
  };

  if (!editor) {
    return <div className="h-[300px] bg-muted/20 animate-pulse rounded-xl border border-border" />;
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleStrike = () => editor.chain().focus().toggleStrike().run();
  const toggleH1 = () => editor.chain().focus().toggleHeading({ level: 1 }).run();
  const toggleH2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor.chain().focus().toggleBlockquote().run();

  return (
    <div className={`flex flex-col border border-border bg-white dark:bg-card overflow-hidden transition-all ${
      isFullscreen 
        ? 'fixed inset-0 z-[100] rounded-none' 
        : 'rounded-xl'
    }`}>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/20">
        <ToolbarButton onClick={toggleH1} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} title="Título 1" />
        <ToolbarButton onClick={toggleH2} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="Título 2" />
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton onClick={toggleBold} isActive={editor.isActive('bold')} icon={Bold} title="Negrita" />
        <ToolbarButton onClick={toggleItalic} isActive={editor.isActive('italic')} icon={Italic} title="Cursiva" />
        <ToolbarButton onClick={toggleStrike} isActive={editor.isActive('strike')} icon={Strikethrough} title="Tachado" />
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton onClick={toggleBulletList} isActive={editor.isActive('bulletList')} icon={List} title="Lista de viñetas" />
        <ToolbarButton onClick={toggleOrderedList} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Lista numerada" />
        <ToolbarButton onClick={toggleBlockquote} isActive={editor.isActive('blockquote')} icon={Quote} title="Cita" />
        
        <div className="w-px h-4 bg-border mx-1" />
        
        {/* Insert Diagram Button */}
        <ToolbarButton
          onClick={() => setIsInsertDiagramOpen(true)}
          icon={Network}
          title="Insertar Esquema / Diagrama"
        />

        {/* Insert Image Button (Opens Modal with Upload / AI Options) */}
        <ToolbarButton
          onClick={handleOpenImageModal}
          icon={ImageIcon}
          title="Incrustar Imagen (Subir o Generar con IA)"
        />

        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          className="p-1.5 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-auto cursor-pointer"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* Editor Body */}
      <div className={`flex-1 bg-white dark:bg-card overflow-y-auto ${isFullscreen ? "h-full max-h-none" : "max-h-[600px]"}`}>
        <EditorContent editor={editor} />
      </div>

      {/* Insert Diagram Modal */}
      {isInsertDiagramOpen && (
        <div
          onClick={() => setIsInsertDiagramOpen(false)}
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 font-display font-bold text-foreground text-sm">
                <Network className="w-4 h-4 text-forest" />
                <span>Insertar Nuevo Diagrama</span>
              </div>
              <button
                type="button"
                onClick={() => setIsInsertDiagramOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Código Mermaid
              </label>
              <textarea
                value={newDiagramCode}
                onChange={(e) => setNewDiagramCode(e.target.value)}
                rows={9}
                placeholder="flowchart LR&#10;  A[&quot;Inicio&quot;] ==> B[&quot;Fin&quot;]"
                className="w-full font-mono text-xs p-3.5 rounded-xl border border-border bg-stone-50 dark:bg-stone-950 text-foreground focus:outline-none focus:ring-2 focus:ring-forest/30 resize-y"
              />
              <p className="text-[11px] text-stone-500">
                Se insertará un bloque visual interactivo en la posición actual del cursor.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsInsertDiagramOpen(false)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleInsertDiagram}
                className="bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Insertar en el Documento</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Insertion Modal (Upload File or Generate with AI) */}
      {isImageModalOpen && (
        <div
          onClick={() => !isGeneratingAiImage && !isUploading && setIsImageModalOpen(false)}
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white dark:bg-stone-900 border border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2 font-display font-bold text-foreground text-sm">
                <ImageIcon className="w-4 h-4 text-forest" />
                <span>Incrustar Imagen en el Artículo</span>
              </div>
              <button
                type="button"
                disabled={isGeneratingAiImage || isUploading}
                onClick={() => setIsImageModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="p-4 px-6 pb-0">
              <div className="grid grid-cols-2 p-1 bg-muted/40 rounded-2xl border border-border/60">
                <button
                  type="button"
                  disabled={isGeneratingAiImage || isUploading}
                  onClick={() => setImageTab('upload')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    imageTab === 'upload'
                      ? 'bg-white dark:bg-stone-800 text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Archivo</span>
                </button>

                <button
                  type="button"
                  disabled={isGeneratingAiImage || isUploading}
                  onClick={() => setImageTab('ai')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    imageTab === 'ai'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-purple-600'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar con IA</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Upload File */}
            {imageTab === 'upload' && (
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">Seleccionar Imagen</label>
                  
                  {uploadPreview ? (
                    <div className="relative group rounded-2xl overflow-hidden border border-border max-h-48 flex items-center justify-center bg-stone-100 dark:bg-stone-950">
                      <img src={uploadPreview} alt="Preview" className="max-h-48 w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadPreview('');
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-xl shadow-md cursor-pointer hover:bg-destructive/90"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-muted/40 transition-colors p-4 text-center">
                      <Upload className="w-6 h-6 text-forest mb-2" />
                      <span className="text-xs font-bold text-foreground">Haz clic para buscar un archivo</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, WebP hasta 10MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Texto Alternativo (Alt Text)</label>
                  <input
                    type="text"
                    value={uploadAltText}
                    onChange={(e) => setUploadAltText(e.target.value)}
                    placeholder="Descripción para accesibilidad y SEO..."
                    className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/30 text-foreground"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => setIsImageModalOpen(false)}
                    className="rounded-xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!selectedFile || isUploading}
                    onClick={handleUploadSubmit}
                    className="bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{isUploading ? 'Subiendo...' : 'Subir e Insertar'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Tab 2: Generate with AI */}
            {imageTab === 'ai' && (
              <div className="p-6 space-y-4">
                {isGeneratingAiImage ? (
                  /* Animated Painter Progress Indicator */
                  <div className="relative w-full h-48 rounded-2xl bg-gradient-to-br from-purple-900/30 via-stone-900/60 to-purple-950/40 border border-purple-500/30 flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-radial from-purple-500/20 via-transparent to-transparent animate-pulse" />
                    
                    {/* Painter Canvas / Easel with brush animation */}
                    <div className="relative z-10 w-28 h-20 bg-stone-100 dark:bg-stone-800 rounded-xl border border-purple-400/40 shadow-xl overflow-hidden flex items-center justify-center">
                      <div 
                        className="absolute inset-x-2 h-4 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 blur-[1px] opacity-75"
                        style={{ animation: 'paintStrokeSweep 2s ease-in-out infinite' }}
                      />
                      <div 
                        className="relative z-20 flex flex-col items-center drop-shadow-md"
                        style={{ animation: 'brushSideToSide 1.8s ease-in-out infinite alternate' }}
                      >
                        <div className="w-2.5 h-7 bg-amber-700 rounded-t-sm shadow-inner" />
                        <div className="w-3.5 h-2 bg-stone-400" />
                        <div className="w-3 h-3 bg-purple-600 rounded-b-full relative">
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 mt-3 flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-300">
                      <Sparkles className="w-4 h-4 animate-spin text-purple-500" />
                      <span>Pintando e ilustrando imagen con IA...</span>
                    </div>

                    <style>{`
                      @keyframes brushSideToSide {
                        0% { transform: translateX(-55px) translateY(-3px) rotate(-15deg); }
                        50% { transform: translateX(0px) translateY(3px) rotate(12deg); }
                        100% { transform: translateX(55px) translateY(-3px) rotate(35deg); }
                      }
                      @keyframes paintStrokeSweep {
                        0% { transform: scaleX(0.3) translateX(-35px); opacity: 0.3; }
                        50% { transform: scaleX(1.1) translateX(0px); opacity: 0.85; }
                        100% { transform: scaleX(0.3) translateX(35px); opacity: 0.4; }
                      }
                    `}</style>
                  </div>
                ) : (
                  <>
                    {!isPlatformBlog && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">Estilo de Imagen</label>
                        <select
                          value={aiPromptStyle}
                          onChange={handleStyleChange}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground"
                        >
                          {AI_STYLES.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground">
                          Instrucciones para la IA (Prompt)
                        </label>
                        <span className="text-[10px] text-muted-foreground">Puedes ajustar los detalles</span>
                      </div>
                      <textarea
                        value={aiPromptText}
                        onChange={(e) => setAiPromptText(e.target.value)}
                        rows={4}
                        placeholder="Descripción de la escena..."
                        className="w-full p-3 text-xs bg-stone-50 dark:bg-stone-950 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed resize-none text-foreground font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Texto Alternativo (Alt Text)</label>
                      <input
                        type="text"
                        value={aiAltText}
                        onChange={(e) => setAiAltText(e.target.value)}
                        placeholder="Descripción para accesibilidad..."
                        className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isGeneratingAiImage}
                    onClick={() => setIsImageModalOpen(false)}
                    className="rounded-xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!aiPromptText.trim() || isGeneratingAiImage}
                    onClick={handleAiGenerateSubmit}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingAiImage ? 'Generando...' : 'Generar e Insertar'}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MarkdownWysiwygEditor;
