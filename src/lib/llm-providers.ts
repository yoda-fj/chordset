// LLM Provider configuration
// Add your API keys here or set via environment variables

export interface LLMProvider {
  id: string;
  name: string;
  visionModel: string;
  apiKeyEnv: string;
  apiEndpoint: string;
  supportsBase64: boolean;
}

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI (GPT-4 Vision)',
    visionModel: 'gpt-4o',
    apiKeyEnv: 'OPENAI_API_KEY',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    supportsBase64: true,
  },
  {
    id: 'google',
    name: 'Google (Gemini 2.0 Flash)',
    visionModel: 'gemini-2.0-flash',
    apiKeyEnv: 'GEMINI_API_KEY',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    supportsBase64: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Multi-Model)',
    visionModel: 'anthropic/claude-3.5-sonnet',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    supportsBase64: true,
  },
];

export function getProviderConfig(providerId: string): LLMProvider | undefined {
  return LLM_PROVIDERS.find(p => p.id === providerId);
}

export function getApiKey(provider: LLMProvider): string | undefined {
  // Check environment variable first
  const envKey = process.env[provider.apiKeyEnv];
  if (envKey) return envKey;
  
  // Fallback to NEXT_PUBLIC_ prefixed version for client-side
  const publicEnvKey = process.env[`NEXT_PUBLIC_${provider.apiKeyEnv}`];
  return publicEnvKey;
}
