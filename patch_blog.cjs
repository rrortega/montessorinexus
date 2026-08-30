const fs = require('fs');

const file = 'src/pages/admin/BlogAdminSection.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state for the AI modal
const stateInsertPoint = content.indexOf('const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);');
if (stateInsertPoint !== -1) {
  content = content.slice(0, stateInsertPoint) + 
`const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPromptStyle, setAiPromptStyle] = useState('');
  const [aiPromptText, setAiPromptText] = useState('');

  const AI_STYLES = [
    { id: 'fotorrealista', label: 'Fotorrealista', prompt: 'Fotografía hiperrealista, alta calidad, iluminación natural, estilo editorial.' },
    { id: 'acuarela', label: 'Acuarela', prompt: 'Ilustración en acuarela, tonos suaves y cálidos, estilo infantil y pacífico.' },
    { id: 'minimalista', label: 'Minimalista', prompt: 'Estilo minimalista, diseño limpio, pocos elementos, colores pastel, vector.' },
    { id: '3d', label: 'Animación 3D', prompt: 'Render 3D estilo Pixar, iluminación suave, personajes expresivos, texturas ricas.' },
    { id: 'carboncillo', label: 'Carboncillo y Terracota', prompt: 'Estilo de dibujo a carboncillo a mano alzada en color negro y crayón terracota.' }
  ];
` + content.slice(stateInsertPoint + 'const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);'.length);
}

// 2. Modify handleAiGenerateImage to be openAiModal
content = content.replace(
  'const handleAiGenerateImage = async () => {',
  `const openAiModal = () => {
    const title = currentTranslation?.title;
    if (!title) {
      toast.warning('Escribe primero un titulo para generar una imagen relacionada.');
      return;
    }
    const defaultStyle = isPlatformBlog 
      ? AI_STYLES.find(s => s.id === 'carboncillo') 
      : AI_STYLES.find(s => s.id === 'fotorrealista');
    
    setAiPromptStyle(defaultStyle?.id || '');
    setAiPromptText(\`Crea una imagen de portada para un artículo de blog sobre educación Montessori titulado "\${title}". \${defaultStyle?.prompt || ''}\`);
    setIsAiModalOpen(true);
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const styleId = e.target.value;
    setAiPromptStyle(styleId);
    const style = AI_STYLES.find(s => s.id === styleId);
    const title = currentTranslation?.title || '';
    setAiPromptText(\`Crea una imagen de portada para un artículo de blog sobre educación Montessori titulado "\${title}". \${style?.prompt || ''}\`);
  };

  const handleAiGenerateImageSubmit = async () => {
    setIsAiModalOpen(false);`
);

// We need to also rename the old handleAiGenerateImage to handleAiGenerateImageSubmit inside the JSX, wait, no, the button in JSX was calling `handleAiGenerateImage`. We should change it to call `openAiModal`.
content = content.replace('onClick={handleAiGenerateImage}', 'onClick={openAiModal}');
// Replace the old fetch body which only sent { title: String(title) }
content = content.replace(
  'body: JSON.stringify({ title: String(title) })',
  'body: JSON.stringify({ title: String(currentTranslation?.title), prompt: aiPromptText })'
);

// 3. Inject the Modal JSX at the end of the return statement
const returnIndex = content.lastIndexOf('</Layout>');
const modalJsx = `
      {/* AI Image Generation Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-foreground">Generar Imagen con IA</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {!isPlatformBlog && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Estilo de Imagen</label>
                  <select
                    value={aiPromptStyle}
                    onChange={handleStyleChange}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {AI_STYLES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Prompt de Generación (Instrucciones para la IA)</label>
                  <span className="text-[10px] text-muted-foreground">Puedes modificar este texto</span>
                </div>
                <textarea
                  value={aiPromptText}
                  onChange={e => setAiPromptText(e.target.value)}
                  rows={4}
                  className="w-full p-3 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed resize-none"
                  placeholder="Instrucciones para la imagen..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/20">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAiGenerateImageSubmit}
                disabled={!aiPromptText.trim()}
                className="px-6 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Generar
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.slice(0, returnIndex) + modalJsx + content.slice(returnIndex);

fs.writeFileSync(file, content);
console.log('Successfully patched BlogAdminSection.tsx');
