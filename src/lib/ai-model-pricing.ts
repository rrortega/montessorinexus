import pricingData from '@/data/ai-model-pricing.json';

export interface ModelPricingEntry {
  id: string;
  name: string;
  provider: string;
  type: 'tokens' | 'image';
  capabilities: Array<'text' | 'vision' | 'image' | 'reasoning' | 'code' | 'audio'>;
  contextWindow?: number;
  contextLabel?: string;
  inputPricePerMillion?: number;
  outputPricePerMillion?: number;
  cachedInputPricePerMillion?: number;
  pricePerUnit?: number;
  priceUnit?: string;
  currency: string;
  description: string;
}

export const AI_MODELS_PRICING: ModelPricingEntry[] = pricingData as ModelPricingEntry[];

/**
 * Normalizes any complex model string by stripping vendor namespaces (e.g. 'openai/gpt-4.1-mini', 'model360-gpt4-mini'),
 * date tags, and standardizing separators.
 */
export function normalizeModelId(raw: string): { clean: string; alpha: string } {
  if (!raw || typeof raw !== 'string') return { clean: '', alpha: '' };

  let s = raw.trim().toLowerCase();

  // 1. Strip provider/namespace prefixes (e.g., 'openai/', 'google/', 'deepseek-ai/', 'meta-llama/', 'accounts/fireworks/models/')
  s = s.replace(/^(?:[\w.-]+[/@:])+/i, '');

  // 2. Strip common wrapper prefixes like 'models/', 'model360-', 'model-', 'azure-', 'bedrock-'
  s = s.replace(/^(?:models\/|model\d*[-_]|model[-_]|azure[-_]|bedrock[-_]|preview[-_])/i, '');

  // 3. Normalize dots and underscores to hyphens (e.g., 'gpt-4.1-mini' -> 'gpt-4-1-mini', 'gpt_4o' -> 'gpt-4o')
  const clean = s.replace(/[._]/g, '-').replace(/-+/g, '-');

  // 4. Create alphanumeric fingerprint for robust matching (e.g., 'gpt4omini', 'gemini20flash', 'deepseekv3')
  const alpha = clean.replace(/[^a-z0-9]/g, '');

  return { clean, alpha };
}

/**
 * Searches the official pricing table for a model by ID, exact match, prefix, namespace stripping, or alphanumeric fingerprint.
 */
export function findModelPricing(modelId: string): ModelPricingEntry | null {
  if (!modelId || typeof modelId !== 'string') return null;

  const { clean, alpha } = normalizeModelId(modelId);
  if (!clean && !alpha) return null;

  // 1. Direct exact ID match
  const exact = AI_MODELS_PRICING.find((m) => m.id.toLowerCase() === clean);
  if (exact) return exact;

  // 2. Alphanumeric fingerprint match on catalog IDs
  const alphaExact = AI_MODELS_PRICING.find((m) => {
    const targetAlpha = m.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    return targetAlpha === alpha;
  });
  if (alphaExact) return alphaExact;

  // 3. Local / Self-Hosted / Ollama
  if (alpha.includes('ollama') || alpha.includes('localhost') || alpha.includes('local') || alpha.includes('selfhosted')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'ollama-local') || null;
  }

  // 4. OpenAI Family Patterns (e.g., 'gpt-4o-mini', 'gpt4mini', 'openai/gpt-4.1-mini', 'model360-gpt4-mini')
  if (alpha.includes('gpt4omini') || (alpha.includes('gpt4') && alpha.includes('mini')) || alpha.includes('gpt41mini')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'gpt-4o-mini') || null;
  }
  if (alpha.includes('gpt4o') || alpha.includes('gpt41') || alpha.includes('gpt4omni')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'gpt-4o') || null;
  }
  if (alpha.includes('o3mini')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'o3-mini') || null;
  }
  if (alpha.includes('o1mini')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'o1-mini') || null;
  }
  if (alpha.includes('o1preview')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'o1-preview') || null;
  }
  if (alpha.startsWith('o1') || clean.startsWith('o1-')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'o1') || null;
  }
  if (alpha.includes('gpt4turbo') || alpha.includes('gpt41106') || alpha.includes('gpt40125')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'gpt-4-turbo') || null;
  }
  if (alpha.includes('gpt35turbo') || alpha.includes('gpt35')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'gpt-3.5-turbo') || null;
  }
  if (alpha.includes('dalle3') || alpha.includes('dall-e-3')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'dall-e-3') || null;
  }
  if (alpha.includes('dalle2') || alpha.includes('dall-e-2')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'dall-e-2') || null;
  }

  // 5. Google Gemini Family Patterns (e.g., 'gemini-2.0-flash', 'google/gemini-2.0-flash-exp', 'gemini-1.5-pro')
  if (alpha.includes('gemini20flashlite') || alpha.includes('gemini2flashlite') || alpha.includes('gemini20flash8b')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'gemini-2.0-flash-lite') || null;
  }
  if (alpha.includes('gemini20flash') || alpha.includes('gemini2flash') || (alpha.includes('gemini2') && alpha.includes('flash'))) {
    return AI_MODELS_PRICING.find((m) => m.id === 'gemini-2.0-flash') || null;
  }
  if (alpha.includes('gemini15flash8b') || alpha.includes('geminiflash8b')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'gemini-1.5-flash-8b') || null;
  }
  if (alpha.includes('gemini15flash') || alpha.includes('geminiflash')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'gemini-1.5-flash') || null;
  }
  if (alpha.includes('gemini20pro') || alpha.includes('gemini2pro')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'gemini-2.0-pro') || null;
  }
  if (alpha.includes('gemini15pro') || alpha.includes('geminipro')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'gemini-1.5-pro') || null;
  }
  if (alpha.includes('imagen3') || alpha.includes('imagen30')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'imagen-3.0-generate-002') || null;
  }

  // 6. DeepSeek Family Patterns (e.g., 'deepseek-ai/DeepSeek-V3', 'deepseek-chat', 'deepseek-r1')
  if (alpha.includes('deepseekreasoner') || alpha.includes('deepseekr1') || alpha.includes('r1') || alpha.includes('deepseekreason')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'deepseek-reasoner') || null;
  }
  if (alpha.includes('deepseekchat') || alpha.includes('deepseekv3') || alpha.includes('deepseek')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'deepseek-chat') || null;
  }

  // 7. Anthropic Claude Family Patterns (e.g., 'anthropic/claude-3.5-sonnet', 'claude-3-5-haiku')
  if (alpha.includes('claude35sonnet') || alpha.includes('sonnet35') || (alpha.includes('claude') && alpha.includes('sonnet'))) {
    return AI_MODELS_PRICING.find((m) => m.id === 'claude-3-5-sonnet') || null;
  }
  if (alpha.includes('claude35haiku') || alpha.includes('haiku35') || (alpha.includes('claude') && alpha.includes('haiku'))) {
    return AI_MODELS_PRICING.find((m) => m.id === 'claude-3-5-haiku') || null;
  }

  // 8. Meta Llama Family Patterns (e.g., 'meta-llama/Llama-3.3-70B-Instruct', 'llama-3.2-11b')
  if (alpha.includes('llama3370b') || alpha.includes('llama33') || alpha.includes('llama70b')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'llama-3.3-70b-versatile') || null;
  }
  if (alpha.includes('llama3211b') || (alpha.includes('llama') && alpha.includes('11b'))) {
    return AI_MODELS_PRICING.find((m) => m.id === 'llama-3.2-11b-vision-preview') || null;
  }
  if (alpha.includes('llama3290b') || (alpha.includes('llama') && alpha.includes('90b'))) {
    return AI_MODELS_PRICING.find((m) => m.id === 'llama-3.2-90b-vision-preview') || null;
  }
  if (alpha.includes('llama318b') || alpha.includes('llama38b') || alpha.includes('llama8b') || alpha.includes('llama321b') || alpha.includes('llama323b')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'llama-3.1-8b-instant') || null;
  }

  // 9. Mistral AI & Qwen
  if (alpha.includes('mixtral8x7b') || alpha.includes('mixtral')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'mixtral-8x7b-32768') || null;
  }
  if (alpha.includes('qwen2572b') || alpha.includes('qwen72b') || alpha.includes('qwen')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'qwen-2.5-72b-instruct') || null;
  }

  // 10. Image Models
  if (alpha.includes('fluxschnell') || alpha.includes('schnell')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'flux-schnell') || null;
  }
  if (alpha.includes('fluxdev') || alpha.includes('fluxpro') || alpha.includes('flux')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'flux-dev') || null;
  }
  if (alpha.includes('stablediffusion') || alpha.includes('sd3') || alpha.includes('sdxl')) {
    return AI_MODELS_PRICING.find((m) => m.id === 'stable-diffusion-3.5-large') || null;
  }

  return null;
}

/**
 * Checks whether a given model name is functionally compatible with a target choice type:
 * - 'vision': Must support image input/OCR/multimodal (e.g. gpt-4o, gemini, claude, llama-vision, llava).
 * - 'text': General text chat, reasoning, or instruction models (excludes image generators and audio/embedding tools).
 * - 'image': Image generation models (e.g. dall-e, imagen, flux, stable-diffusion).
 */
export function isModelCompatibleWithType(
  modelName: string,
  modelType?: 'vision' | 'text' | 'image'
): boolean {
  if (!modelName || typeof modelName !== 'string') return false;
  if (!modelType) return true;

  const lower = modelName.toLowerCase();

  // 1. Exclude utilities/non-conversational tools regardless of type
  if (
    /embedding|whisper|tts|moderation|dall-e-2.*edit|davinci-search|bge-|text-similarity|canary|rerank/i.test(
      lower
    )
  ) {
    return false;
  }

  const pricing = findModelPricing(modelName);

  // 2. Vision / Multimodal / OCR Target
  if (modelType === 'vision') {
    // Pure image generation models CANNOT be used for OCR/Vision input
    if (
      /dall-e|imagen|flux|stable-diffusion|sdxl|midjourney/i.test(lower) ||
      pricing?.type === 'image'
    ) {
      return false;
    }
    // Pure text/reasoning models without vision capabilities cannot be used
    if (
      /deepseek-chat|deepseek-reasoner|deepseek-r1|o1-mini|o3-mini|gpt-3.5|text-davinci|mixtral-8x7b|qwen-2.5-72b-instruct$/i.test(
        lower
      )
    ) {
      return false;
    }
    // If cataloged, check capabilities
    if (pricing && pricing.capabilities) {
      return pricing.capabilities.includes('vision');
    }
    // Heuristics for uncataloged/custom models
    return /vision|vl|llava|4o|flash|pro|gemini|claude|pixtral|omni/i.test(lower);
  }

  // 3. Text / Chat Target
  if (modelType === 'text') {
    // Exclude image generation models
    if (
      /dall-e|imagen|flux|stable-diffusion|sdxl|midjourney/i.test(lower) ||
      pricing?.type === 'image'
    ) {
      return false;
    }
    // All text, chat, reasoning, and multimodal LLMs are valid for text generation
    return true;
  }

  // 4. Image Generation Target
  if (modelType === 'image') {
    if (pricing?.type === 'image') return true;
    return /dall-e|imagen|flux|image|stable-diffusion|sdxl|midjourney/i.test(lower);
  }

  return true;
}
