import Groq from 'groq-sdk';
import { logger } from '../utils/logger.js';

export interface GroqConfig {
  apiKey?: string;
  model: string;
  isConfigured: boolean;
}

export const groqConfig: GroqConfig = {
  get apiKey() {
    return process.env.GROQ_API_KEY?.trim() || undefined;
  },
  get model() {
    return process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b';
  },
  get isConfigured() {
    return Boolean(process.env.GROQ_API_KEY?.trim());
  },
};

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq | null {
  if (!groqInstance && groqConfig.isConfigured) {
    try {
      groqInstance = new Groq({
        apiKey: groqConfig.apiKey,
      });
      logger.info('Groq client initialized successfully', { model: groqConfig.model });
    } catch (err: any) {
      logger.error('Failed to instantiate Groq client', { error: err.message });
      return null;
    }
  }
  return groqInstance;
}
