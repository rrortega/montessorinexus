const fs = require('fs');

const file = 'src/pages/admin/MarkdownWysiwygEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add lucide icons for Maximize/Minimize
content = content.replace(
  'List, ListOrdered, Quote, ImageIcon, Loader2',
  'List, ListOrdered, Quote, ImageIcon, Loader2, Maximize, Minimize'
);

// 2. Add useEffect to imports
if (!content.includes('useEffect')) {
  content = content.replace(
    "import React, { useRef, useState } from 'react';",
    "import React, { useRef, useState, useEffect } from 'react';"
  );
}

// 3. Add isFullscreen state
content = content.replace(
  'const [isUploading, setIsUploading] = useState(false);',
  `const [isUploading, setIsUploading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);`
);

// 4. Add useEffect to sync value
const editorDefIndex = content.indexOf('const editor = useEditor({');
content = content.replace(
  'const editor = useEditor({',
  `useEffect(() => {
    if (editor && value) {
      // Prevent cursor jump by checking if content actually changed externally
      const currentContent = editor.storage.markdown.getMarkdown();
      if (currentContent !== value) {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  const editor = useEditor({`
);

// 5. Update wrapper classes for Fullscreen
const returnStart = content.indexOf('return (');
const oldWrapper = '<div className="flex flex-col border border-border rounded-xl bg-white dark:bg-card overflow-hidden">';
const newWrapper = `
    <div className={\`flex flex-col border border-border bg-white dark:bg-card overflow-hidden transition-all \${
      isFullscreen 
        ? 'fixed inset-0 z-[100] rounded-none' 
        : 'rounded-xl'
    }\`}>
`;
content = content.replace(oldWrapper, newWrapper);

// 6. Update EditorContent wrapper class to expand fully in fullscreen
const editorWrapperOld = '<div className="flex-1 bg-white dark:bg-card overflow-y-auto max-h-[600px]">';
const editorWrapperNew = '<div className={`flex-1 bg-white dark:bg-card overflow-y-auto ${isFullscreen ? "h-full max-h-none" : "max-h-[600px]"}`}>';
content = content.replace(editorWrapperOld, editorWrapperNew);

// 7. Add Fullscreen button to Toolbar
const toolbarEnd = content.indexOf('<div className="w-px h-4 bg-border mx-1" />', content.indexOf('<button\n          type="button"\n          onClick={() => fileInputRef.current?.click()}'));
const insertIndex = content.lastIndexOf('</div>', content.indexOf('<div className="flex-1 bg-white dark:bg-card'));

const fullscreenButton = `
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          className="p-1.5 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
`;
content = content.slice(0, insertIndex) + fullscreenButton + content.slice(insertIndex);


fs.writeFileSync(file, content);
console.log('Successfully patched MarkdownWysiwygEditor.tsx');
