import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Unlink,
  RemoveFormatting,
  Heading2,
  Heading3,
  Pilcrow,
  Highlighter,
  Check,
  X,
  Sparkles,
  ChevronDown,
  User,
  GraduationCap,
  Building,
  School,
  Mail,
  Calendar,
  Layers
} from 'lucide-react';

export interface DynamicVariable {
  code: string;
  label: string;
  description: string;
  example: string;
  icon: React.ReactNode;
}

export const DYNAMIC_VARIABLES: DynamicVariable[] = [
  {
    code: '{{nombre_destinatario}}',
    label: 'Nombre del Destinatario',
    description: 'Nombre del padre, tutor o miembro del personal',
    example: 'María González',
    icon: <User className="w-3.5 h-3.5 text-emerald-600" />
  },
  {
    code: '{{estudiante}}',
    label: 'Nombre del Alumno / Hijo',
    description: 'Nombre del estudiante vinculado al tutor',
    example: 'Santiago Pérez',
    icon: <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
  },
  {
    code: '{{ambiente}}',
    label: 'Ambiente / Salón',
    description: 'Ambiente o salón escolar del alumno',
    example: 'Casa de Niños 1',
    icon: <Building className="w-3.5 h-3.5 text-amber-600" />
  },
  {
    code: '{{escuela}}',
    label: 'Nombre del Colegio',
    description: 'Nombre institucional de la escuela',
    example: 'Ceiba Montessori',
    icon: <School className="w-3.5 h-3.5 text-forest" />
  },
  {
    code: '{{email_destinatario}}',
    label: 'Correo del Destinatario',
    description: 'Email registrado de destino',
    example: 'maria@ejemplo.com',
    icon: <Mail className="w-3.5 h-3.5 text-purple-600" />
  },
  {
    code: '{{fecha}}',
    label: 'Fecha de Emisión',
    description: 'Fecha actual formateada en español',
    example: '19 de agosto, 2026',
    icon: <Calendar className="w-3.5 h-3.5 text-rose-600" />
  },
  {
    code: '{{año_escolar}}',
    label: 'Ciclo Escolar',
    description: 'Período académico activo',
    example: '2026-2027',
    icon: <Layers className="w-3.5 h-3.5 text-teal-600" />
  }
];

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  showVariables?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe el contenido aquí con formato enriquecido...',
  minHeight = '220px',
  showVariables = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [variablesOpen, setVariablesOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const savedSelectionRef = useRef<Range | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setVariablesOpen(false);
      }
    };
    if (variablesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [variablesOpen]);

  // Sync value from outside if changed externally and not focused
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html === '<br>' || html === '<p><br></p>' || html.trim() === '') {
        onChange('');
      } else {
        onChange(html);
      }
    }
  }, [onChange]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    handleInput();
  };

  const injectVariable = (code: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();

      // Insert variable code cleanly
      const success = document.execCommand('insertText', false, code);
      if (!success) {
        document.execCommand('insertHTML', false, code);
      }
      handleInput();
      saveSelection();
    }
    setVariablesOpen(false);
  };

  const handleOpenLinkModal = () => {
    saveSelection();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString() : '';
    setLinkText(selectedText);
    setLinkUrl('');
    setLinkModalOpen(true);
  };

  const handleApplyLink = () => {
    restoreSelection();
    if (!linkUrl.trim()) {
      setLinkModalOpen(false);
      return;
    }
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
      url = 'https://' + url;
    }

    if (savedSelectionRef.current && (!linkText || linkText.trim() === '')) {
      executeCommand('createLink', url);
    } else {
      document.execCommand(
        'insertHTML',
        false,
        `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1b3b2b; text-decoration: underline; font-weight: 600;">${linkText || url}</a>`
      );
    }
    setLinkModalOpen(false);
    handleInput();
  };

  return (
    <div
      className={`rounded-2xl border transition-all bg-white shadow-2xs ${
        isFocused ? 'border-forest ring-2 ring-forest/15' : 'border-forest/20 hover:border-forest/40'
      }`}
    >
      {/* WYSIWYG TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-stone-50/90 border-b border-forest/10 text-forest select-none relative rounded-t-2xl">
        
        {/* DYNAMIC VARIABLES DROPDOWN BUTTON (PROMINENT - WHEN ENABLED) */}
        {showVariables && (
          <>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  saveSelection();
                  setVariablesOpen(prev => !prev);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                  variablesOpen
                    ? 'bg-forest text-white shadow-sm'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-forest border border-emerald-300/60'
                }`}
                title="Insertar variable dinámica personalizada"
              >
                <Sparkles className={`w-3.5 h-3.5 ${variablesOpen ? 'text-amber-300' : 'text-amber-500'}`} />
                <span>Variables Dinámicas</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${variablesOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* DROPDOWN MENU */}
              {variablesOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-forest/15 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-1.5 border-b border-forest/10 mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-forest uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Toca para inyectar en el texto:
                    </span>
                    <span className="text-[9px] text-muted-foreground">Reemplazo automático</span>
                  </div>

                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {DYNAMIC_VARIABLES.map(v => (
                      <button
                        key={v.code}
                        type="button"
                        onClick={() => injectVariable(v.code)}
                        className="w-full text-left p-2 rounded-xl hover:bg-emerald-50/80 border border-transparent hover:border-emerald-200 transition-all flex items-start gap-2.5 group cursor-pointer"
                      >
                        <div className="p-1.5 rounded-lg bg-stone-100 group-hover:bg-emerald-100 shrink-0 mt-0.5 transition-colors">
                          {v.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-forest group-hover:text-emerald-900 block truncate">
                              {v.label}
                            </span>
                            <code className="text-[10px] bg-stone-100 group-hover:bg-emerald-200/70 text-forest px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                              {v.code}
                            </code>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                            {v.description} <span className="italic text-slate-400">({v.example})</span>
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-[1px] bg-forest/15 mx-0.5 hidden sm:block" />
          </>
        )}

        {/* Style Dropdown / Quick Headings */}
        <div className="flex items-center gap-0.5 bg-white rounded-xl p-0.5 border border-forest/10 shadow-2xs">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('formatBlock', '<p>'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Párrafo normal"
          >
            <Pilcrow className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('formatBlock', '<h2>'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors font-bold text-xs"
            title="Encabezado H2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('formatBlock', '<h3>'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors font-bold text-xs"
            title="Sub-encabezado H3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Basic Text Formats */}
        <div className="flex items-center gap-0.5 bg-white rounded-xl p-0.5 border border-forest/10 shadow-2xs">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('bold'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Negrita (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('italic'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Cursiva (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('underline'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Subrayado (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('strikeThrough'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Tachado"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists & Quote */}
        <div className="flex items-center gap-0.5 bg-white rounded-xl p-0.5 border border-forest/10 shadow-2xs">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('insertUnorderedList'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Lista con viñetas"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('insertOrderedList'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Lista numerada"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('formatBlock', '<blockquote>'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Cita destacada"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignments */}
        <div className="flex items-center gap-0.5 bg-white rounded-xl p-0.5 border border-forest/10 shadow-2xs">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('justifyLeft'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Alinear a la izquierda"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('justifyCenter'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Centrar texto"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('justifyRight'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Alinear a la derecha"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('justifyFull'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Justificar"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Links & Clear */}
        <div className="flex items-center gap-0.5 bg-white rounded-xl p-0.5 border border-forest/10 shadow-2xs">
          <button
            type="button"
            onClick={handleOpenLinkModal}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Insertar enlace web"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('unlink'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-700 hover:text-forest transition-colors"
            title="Quitar enlace"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('hiliteColor', '#fef08a'); }}
            className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-700 transition-colors"
            title="Resaltador amarillo"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); executeCommand('removeFormat'); }}
            className="p-1.5 hover:bg-forest/10 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
            title="Limpiar formato"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* QUICK VARIABLES PILLS STRIP */}
      <div className="px-3 py-1.5 bg-stone-100/70 border-b border-forest/5 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Atajos rápidos:
        </span>
        {DYNAMIC_VARIABLES.slice(0, 4).map(v => (
          <button
            key={v.code}
            type="button"
            onMouseDown={e => {
              e.preventDefault();
              injectVariable(v.code);
            }}
            className="px-2 py-0.5 rounded-lg bg-white hover:bg-emerald-50 text-forest border border-forest/15 hover:border-forest/40 transition-colors text-[10px] font-medium font-mono shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
            title={`Inyectar ${v.label}`}
          >
            <span>+</span>
            <span>{v.code}</span>
          </button>
        ))}
      </div>

      {/* EDITABLE AREA */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            handleInput();
          }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onInput={handleInput}
          style={{ minHeight }}
          className="p-4 sm:p-5 text-sm leading-relaxed text-slate-800 focus:outline-none overflow-y-auto prose prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-headings:text-forest prose-blockquote:border-emerald-600 prose-blockquote:bg-emerald-50/50 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r-lg prose-ul:my-2 prose-ol:my-2"
        />

        {(!value || value.trim() === '' || value === '<p><br></p>') && !isFocused && (
          <div className="absolute top-4 left-5 text-sm text-slate-400 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* LINK INSERT MODAL */}
      {linkModalOpen && (
        <div className="p-3 bg-stone-50 border-t border-forest/10 flex flex-wrap items-center gap-2 animate-in fade-in">
          <input
            type="text"
            placeholder="Texto del enlace (opcional)..."
            value={linkText}
            onChange={e => setLinkText(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white rounded-xl border border-forest/20 text-slate-800 focus:outline-none focus:ring-1 focus:ring-forest flex-1 min-w-[140px]"
          />
          <input
            type="url"
            placeholder="https://ejemplo.com..."
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleApplyLink(); }}
            className="px-3 py-1.5 text-xs bg-white rounded-xl border border-forest/20 text-slate-800 focus:outline-none focus:ring-1 focus:ring-forest flex-1 min-w-[180px]"
            autoFocus
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="px-3 py-1.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Aplicar
          </button>
          <button
            type="button"
            onClick={() => setLinkModalOpen(false)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-stone-200 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
