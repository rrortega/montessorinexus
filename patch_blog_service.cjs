const fs = require('fs');

const file = 'server/blog-service.js';
let content = fs.readFileSync(file, 'utf8');

// Replace the return block of generateBlogCoverImage
const returnBlock = `
  // Return URL or base64 depending on API response format
  return {
    url: imageData.url || null,
    b64_json: imageData.b64_json || null,
    revised_prompt: imageData.revised_prompt || prompt
  };
`;

const newReturnBlock = `
  let b64 = imageData.b64_json || null;
  let finalUrl = imageData.url || null;

  // Si la API solo nos dio una URL (porque quitamos response_format='b64_json'),
  // la descargamos en el backend para evitar problemas de CORS y la devolvemos como base64
  if (!b64 && finalUrl) {
    try {
      const imgRes = await fetch(finalUrl);
      if (imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer();
        b64 = Buffer.from(arrayBuffer).toString('base64');
      }
    } catch (e) {
      console.error('Error downloading generated image:', e);
    }
  }

  // Return URL or base64 depending on API response format
  return {
    url: finalUrl,
    b64_json: b64,
    revised_prompt: imageData.revised_prompt || prompt
  };
`;

content = content.replace(returnBlock, newReturnBlock);
fs.writeFileSync(file, content);
console.log('Successfully patched blog-service.js');
