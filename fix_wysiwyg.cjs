const fs = require('fs');

const file = 'src/pages/admin/MarkdownWysiwygEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

// Strip the bad insertion at the end
const badEndIndex = content.indexOf('        <div className="flex-1" />\n        <button\n          type="button"');
if (badEndIndex !== -1 && badEndIndex > content.lastIndexOf('}')) {
  content = content.slice(0, badEndIndex);
}

// Find where to insert it in the toolbar
const toolbarEnd = content.indexOf('</button>\n        <input');
if (toolbarEnd !== -1) {
  const insertIndex = content.indexOf('\n', toolbarEnd); // after the button tag
  const fullscreenButton = `
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          className="p-1.5 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-auto"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>`;
  
  content = content.slice(0, insertIndex) + fullscreenButton + content.slice(insertIndex);
}

fs.writeFileSync(file, content);
console.log('Successfully fixed MarkdownWysiwygEditor.tsx');
