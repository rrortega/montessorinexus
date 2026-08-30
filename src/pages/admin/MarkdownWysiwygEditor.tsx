import React, { useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, 
  List, ListOrdered, Quote, ImageIcon, Loader2, Maximize, Minimize 
} from 'lucide-react';
import { uploadPhysicalFile } from '@/lib/api';

interface MarkdownWysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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

export function MarkdownWysiwygEditor({ value, onChange, placeholder }: MarkdownWysiwygEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadPhysicalFile(file, 'blog', 'blog-image', true);
      if (uploaded?.url) {
        editor.chain().focus().setImage({ src: uploaded.url, alt: file.name }).run();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Insertar imagen"
          className="p-1.5 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          className="p-1.5 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-auto"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      <div className={`flex-1 bg-white dark:bg-card overflow-y-auto ${isFullscreen ? "h-full max-h-none" : "max-h-[600px]"}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
