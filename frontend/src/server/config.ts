export interface OpenAIConfig {
  apiKey: string;
  visionModel: string;
  translationModel: string;
  imageModel: string;
  maxQaAttempts: number;
}

export function getOpenAIConfig(): OpenAIConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    visionModel: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
    translationModel: process.env.OPENAI_TRANSLATION_MODEL || 'gpt-4o-mini',
    imageModel: process.env.OPENAI_IMAGE_MODEL || 'dall-e-2',
    maxQaAttempts: parseInt(process.env.OPENAI_MAX_QA_ATTEMPTS || '3', 10),
  };
}
